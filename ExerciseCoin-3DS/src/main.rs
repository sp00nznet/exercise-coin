//! Exercise Coin, pocket: the 3DS client.
//!
//! Two ways to earn, both checked by the server (docs/3ds.md):
//! - **Sync steps:** the console's pedometer counts steps even closed in a pocket. Syncing sends
//!   the last week's hourly history; the server pays new steps, at a lower rate than live walks,
//!   within hourly and daily caps.
//! - **Live walk:** with the app open, steps are counted from the accelerometer and sent once a
//!   second, as the phone apps send them, with how much the console actually moved.
//!
//! The top screen is the wallet; the bottom has the buttons. Settings live in
//! `sdmc:/3ds/excoin/config.txt` (`server=http://...`, and `email=`/`password=` for the first
//! login, after which only the token is kept).

mod font;
mod http;
mod steps;

use std::time::{Duration, Instant};

use ctru::prelude::*;
use ctru::services::gfx::{Flush, Screen, Swap};
use serde_json::{json, Value};

use font::{draw_text, text_width};
use steps::{console_now, iso, StepDetector};

const TW: i32 = 400;
const TH: i32 = 240;
const BW: i32 = 320;
const BH: i32 = 240;
const CONFIG_DIR: &str = "sdmc:/3ds/excoin";
const CONFIG: &str = "sdmc:/3ds/excoin/config.txt";
/// Build with EXCOIN_SELFTEST=1 for an unattended run in Azahar: it logs in from the config,
/// syncs a made-up week of pedometer history, walks for 130 s on a simulated accelerometer, ends
/// the walk, and syncs again.
const SELFTEST: bool = option_env!("EXCOIN_SELFTEST").is_some();

pub(crate) fn set_px(bits: *mut u8, w: i32, h: i32, x: i32, y: i32, r: u8, g: u8, b: u8) {
    if x < 0 || y < 0 || x >= w || y >= h { return; }
    let o = ((y * w + x) * 4) as usize;
    unsafe { *bits.add(o) = b; *bits.add(o + 1) = g; *bits.add(o + 2) = r; *bits.add(o + 3) = 255; }
}
fn fill(buf: &mut [u8], w: i32, h: i32, x: i32, y: i32, rw: i32, rh: i32, c: (u8, u8, u8)) {
    for yy in y.max(0)..(y + rh).min(h) { for xx in x.max(0)..(x + rw).min(w) { set_px(buf.as_mut_ptr(), w, h, xx, yy, c.0, c.1, c.2); } }
}
/// Copy a w x h BGRA buffer into a 3DS framebuffer (BGR8, rotated: columns of `fb_h` pixels, bottom row first).
fn present(fb: *mut u8, fb_h: usize, buf: &[u8], w: i32, h: i32) {
    let (w, h) = (w as usize, h as usize);
    for y in 0..h {
        let src = &buf[y * w * 4..(y + 1) * w * 4];
        let mut d = unsafe { fb.add((fb_h - 1 - y) * 3) };
        for px in src.chunks_exact(4) {
            unsafe { *d = px[0]; *d.add(1) = px[1]; *d.add(2) = px[2]; d = d.add(fb_h * 3); }
        }
    }
}
fn present_both(gfx: &Gfx, top: &[u8], bot: &[u8]) {
    { let mut s = gfx.top_screen.borrow_mut(); let fb = s.raw_framebuffer(); present(fb.ptr, fb.width, top, TW, TH); s.flush_buffers(); s.swap_buffers(); }
    { let mut s = gfx.bottom_screen.borrow_mut(); let fb = s.raw_framebuffer(); present(fb.ptr, fb.width, bot, BW, BH); s.flush_buffers(); s.swap_buffers(); }
}
fn wrap(text: &str, max: usize) -> Vec<String> {
    let mut lines = Vec::new();
    let mut cur = String::new();
    for word in text.split_whitespace() {
        if !cur.is_empty() && cur.len() + 1 + word.len() > max { lines.push(std::mem::take(&mut cur)); }
        if !cur.is_empty() { cur.push(' '); }
        cur.push_str(word);
    }
    if !cur.is_empty() { lines.push(cur); }
    lines
}

// ------------------------------------------------------------------ config

#[derive(Default, Clone)]
struct Config { server: String, email: String, password: String, token: String }

fn load_config() -> Config {
    let mut c = Config { server: "http://192.168.100.215:3000".into(), ..Default::default() };
    if let Ok(t) = std::fs::read_to_string(CONFIG) {
        for l in t.lines() {
            let Some((k, v)) = l.split_once('=') else { continue };
            let v = v.trim().to_string();
            match k.trim() { "server" => c.server = v, "email" => c.email = v, "password" => c.password = v, "token" => c.token = v, _ => {} }
        }
    }
    c
}
/// The password is never written back: once there's a token, only the token is kept.
fn save_config(c: &Config) {
    let _ = std::fs::create_dir_all(CONFIG_DIR);
    let mut t = format!("server={}\nemail={}\n", c.server, c.email);
    if !c.token.is_empty() { t += &format!("token={}\n", c.token); } else if !c.password.is_empty() { t += &format!("password={}\n", c.password); }
    let _ = std::fs::write(CONFIG, t);
}

// ------------------------------------------------------------------ the console

/// A hash unique to this console (and this app's salt): the server's per-console caps key on it.
/// It identifies the console to the server and nothing else.
fn console_hash() -> String {
    let mut h: u64 = 0;
    let _ = unsafe { ctru_sys::CFGU_GenHashConsoleUnique(0xEC0_1E, &mut h) };
    format!("{:016x}", h)
}

/// PTMU GetStepHistory (0xB): steps for each hour starting at `start_ms` (ms since 2000-01-01, by the
/// console's clock). Called over IPC directly: libctru's wrapper sizes the buffer in bytes, not
/// u16s (Azahar asserts on it), and always starts at "now".
fn step_history(start_ms: u64, out: &mut [u16]) -> Result<(), i32> {
    unsafe {
        let cmd = ctru_sys::getThreadCommandBuffer();
        *cmd = 0x000B_00C2;
        *cmd.add(1) = out.len() as u32;
        *cmd.add(2) = start_ms as u32;
        *cmd.add(3) = (start_ms >> 32) as u32;
        *cmd.add(4) = ((out.len() as u32 * 2) << 4) | 0x8 | 0x4; // IPC_Desc_Buffer(size, IPC_BUFFER_W)
        *cmd.add(5) = out.as_mut_ptr() as u32;
        let r = ctru_sys::svcSendSyncRequest(*ctru_sys::ptmuGetSessionHandle());
        if r < 0 { return Err(r); }
        let r = *cmd.add(1) as i32;
        if r < 0 { Err(r) } else { Ok(()) }
    }
}

/// The last week, hour by hour: (hour start by the console clock, steps). Zero hours are left out.
fn week_of_steps() -> Result<Vec<(u64, u32)>, String> {
    const HOURS: usize = 168;
    let now = console_now();
    let first = now - now % 3600 - (HOURS as u64 - 1) * 3600;
    let mut h = [0u16; HOURS];
    if SELFTEST {
        // Azahar's pedometer never counts: a made-up week, a walk most mornings and evenings
        for (i, v) in h.iter_mut().enumerate() {
            let hour = ((first + i as u64 * 3600) / 3600 % 24) as usize;
            *v = match hour { 7 | 8 => 1800 + (i as u16 * 37) % 900, 17 | 18 => 2500 + (i as u16 * 53) % 1200, 12 => 600, 9..=16 => 150, _ => 0 };
        }
    } else {
        let start_ms = first.saturating_sub(946_684_800) * 1000;
        step_history(start_ms, &mut h).map_err(|e| format!("pedometer error {:#x}", e))?;
    }
    let mut v: Vec<(u64, u32)> = h.iter().enumerate().filter(|(_, &s)| s > 0).map(|(i, &s)| (first + i as u64 * 3600, s as u32)).collect();
    if v.is_empty() { v.push((now - now % 3600, 0)); } // the server wants at least one hour
    Ok(v)
}

// ------------------------------------------------------------------ the API

#[derive(Clone)]
struct Api { cfg: Config }
impl Api {
    fn call(&self, method: &str, path: &str, body: Option<Value>) -> Result<Value, String> {
        let tok = (!self.cfg.token.is_empty()).then_some(self.cfg.token.as_str());
        let r = http::request(&self.cfg.server, method, &format!("/api{}", path), tok, body.map(|b| b.to_string()).as_deref())?;
        let v: Value = serde_json::from_str(&r.body).unwrap_or(Value::Null);
        if r.status >= 400 {
            let msg = v.get("error").and_then(|e| e.as_str()).unwrap_or("error").to_string();
            let detail = v.get("details").and_then(|d| d.get(0)).and_then(|d| d.get("message")).and_then(|m| m.as_str()).map(|m| format!(": {}", m)).unwrap_or_default();
            return Err(format!("{} ({}){}", msg, r.status, detail));
        }
        Ok(v)
    }
}

// ------------------------------------------------------------------ the app

#[derive(Default)]
struct Wallet { user: String, balance: f64, today_steps: u64, today_coins: f64, step_cap: u64, coin_cap: f64, last_sync: String }

struct Walk { id: String, started: Instant, det: StepDetector, pending: Vec<Value>, last_point: Instant, last_post: Instant, last_steps: u32,
    /// the upload in flight: sent from a thread, so a slow network never stalls the step counting
    inflight: Option<std::thread::JoinHandle<Result<(), String>>> }

fn n(v: &Value, k: &str) -> f64 { v.get(k).and_then(|x| x.as_f64()).unwrap_or(0.0) }

fn main() {
    unsafe { ctru_sys::osSetSpeedupEnable(true); }
    let apt = Apt::new().expect("apt");
    let mut hid = Hid::new().expect("hid");
    let gfx = Gfx::new().expect("gfx");
    let _soc = ctru::services::soc::Soc::new().expect("network (soc) unavailable");
    let _cfgu = ctru::services::cfgu::Cfgu::new().expect("cfgu");
    let _ptm = ctru::services::ptm::user::PTMUser::new().ok();
    let _ = hid.set_accelerometer(true);
    gfx.top_screen.borrow_mut().set_double_buffering(true);
    gfx.bottom_screen.borrow_mut().set_double_buffering(true);

    let mut top = vec![0u8; (TW * TH * 4) as usize];
    let mut bot = vec![0u8; (BW * BH * 4) as usize];
    let mut api = Api { cfg: load_config() };
    let chash = console_hash();
    let mut wallet = Wallet::default();
    let mut msg = String::from("Hello!");
    let mut walk: Option<Walk> = None;
    let mut dirty = 2u8;
    let mut next_draw = Instant::now();
    let started = Instant::now();
    let mut st_step = 0u32; // self-test script position
    let mut last_t = Instant::now();

    // Draw a frame now (both buffers), so a blocking call shows what it's doing.
    let show = |gfx: &Gfx, top: &[u8], bot: &[u8]| {
        for _ in 0..2 { present_both(gfx, top, bot); gfx.wait_for_vblank(); }
    };

    while apt.main_loop() {
        hid.scan_input();
        let mut down = hid.keys_down();
        let now = Instant::now();
        let dt_ms = (now - last_t).as_millis() as u32; last_t = now;

        // ----- the self-test's script
        if SELFTEST {
            let t = started.elapsed().as_secs();
            let due = [2u64, 4, 6, 136, 140, 143];
            if (st_step as usize) < due.len() && t >= due[st_step as usize] {
                down |= match st_step { 0 => KeyPad::X, 1 => KeyPad::A, 2 => KeyPad::Y, 3 => KeyPad::Y, 4 => KeyPad::A, _ => KeyPad::X };
                st_step += 1;
            }
        }
        if down.contains(KeyPad::START) { break; }

        // touch buttons on the bottom screen
        if down.contains(KeyPad::TOUCH) {
            let (tx, ty) = hid.touch_position();
            let (tx, ty) = (tx as i32, ty as i32);
            if (16..304).contains(&tx) {
                if (40..92).contains(&ty) { down |= KeyPad::A; }
                else if (104..156).contains(&ty) { down |= KeyPad::Y; }
                else if (168..208).contains(&ty) { down |= KeyPad::X; }
            }
        }

        let busy = |m: &str, top: &mut Vec<u8>, bot: &mut Vec<u8>, w: &Wallet, walk: &Option<Walk>| {
            draw_top(top, w, walk.as_ref(), m, &chash);
            draw_bottom(bot, walk.is_some(), true);
            show(&gfx, top, bot);
        };

        // ----- log in (once; then the token is kept)
        let need_login = api.cfg.token.is_empty() && (down.intersects(KeyPad::A | KeyPad::X | KeyPad::Y));
        if need_login {
            if (api.cfg.email.is_empty() || api.cfg.password.is_empty()) && !SELFTEST {
                if let Some((e, p)) = ask_login(&apt, &gfx, &api.cfg.email) { api.cfg.email = e; api.cfg.password = p; }
            }
            if api.cfg.email.is_empty() || api.cfg.password.is_empty() {
                msg = format!("Log in first: put email= and password= in {} (or type them).", CONFIG);
            } else {
                busy("Logging in...", &mut top, &mut bot, &wallet, &walk);
                match api.call("POST", "/auth/login", Some(json!({"email": api.cfg.email, "password": api.cfg.password}))) {
                    Ok(v) => {
                        api.cfg.token = v["token"].as_str().unwrap_or("").to_string();
                        api.cfg.password.clear();
                        save_config(&api.cfg);
                        wallet.user = v["user"]["username"].as_str().unwrap_or("").to_string();
                        msg = format!("Logged in as {}.", wallet.user);
                    }
                    Err(e) => msg = format!("Login failed: {}", e),
                }
            }
            dirty = 2;
        }
        let logged_in = !api.cfg.token.is_empty();

        // ----- X: refresh the wallet
        if logged_in && down.contains(KeyPad::X) {
            busy("Refreshing...", &mut top, &mut bot, &wallet, &walk);
            msg = refresh(&api, &mut wallet).err().unwrap_or_else(|| "Up to date.".into());
            if msg.contains("(401)") { api.cfg.token.clear(); save_config(&api.cfg); msg = "Session expired: log in again (A).".into(); }
            dirty = 2;
        }

        // ----- A: sync the pedometer
        if logged_in && down.contains(KeyPad::A) {
            busy("Syncing steps...", &mut top, &mut bot, &wallet, &walk);
            msg = match week_of_steps() {
                Err(e) => e,
                Ok(hours) => {
                    let total = ctru::services::ptm::user::PTMUser::new().ok().and_then(|p| p.step_count().ok()).unwrap_or(0);
                    let body = json!({
                        "consoleHash": chash, "clientNow": iso(console_now()), "totalSteps": total,
                        "hours": hours.iter().map(|(s, n)| json!({"start": iso(*s), "steps": n})).collect::<Vec<_>>(),
                    });
                    match api.call("POST", "/pedometer/sync", Some(body)) {
                        Ok(v) => {
                            let c = &v["credited"];
                            // the caps and warnings, in words; the server's informational flags are left out
                            let mut flags: Vec<&str> = v["flags"].as_array().map(|a| a.iter().filter_map(|f| f.as_str()).filter_map(|f| match f.split(':').next() {
                                Some("hour_cap") => Some("hourly cap"), Some("day_step_cap") | Some("console_step_cap") => Some("daily step cap"),
                                Some("coin_cap") => Some("daily coin cap"), Some("implausible_day") => Some("a day looked implausible"),
                                Some("clock_changed") => Some("the clock changed"), _ => None }).collect()).unwrap_or_default();
                            flags.dedup();
                            let _ = refresh(&api, &mut wallet);
                            let mut m = if n(c, "steps") > 0.0 { format!("+{:.2} EXC for {} new steps.", n(c, "coins"), n(c, "steps") as u64) }
                                        else { "No new steps to pay for yet.".into() };
                            if !flags.is_empty() { m += &format!(" ({})", flags.join(", ")); }
                            m
                        }
                        Err(e) => format!("Sync failed: {}", e),
                    }
                }
            };
            dirty = 2;
        }

        // ----- Y: start or end a live walk
        if logged_in && down.contains(KeyPad::Y) {
            if let Some(mut w) = walk.take() {
                busy("Ending the walk...", &mut top, &mut bot, &wallet, &None);
                if let Some(h) = w.inflight.take() { let _ = h.join(); }
                if !w.pending.is_empty() { let _ = post_points(&api, &w.id, std::mem::take(&mut w.pending)); }
                msg = match api.call("POST", "/exercise/session/end", Some(json!({"sessionId": w.id}))) {
                    Ok(v) => {
                        let s = &v["session"];
                        let _ = refresh(&api, &mut wallet);
                        if n(s, "coinsEarned") > 0.0 {
                            format!("Walk done: {} steps, +{:.2} EXC{}.", n(s, "totalSteps") as u64, n(s, "coinsEarned"), if v["capped"].as_bool() == Some(true) || s["capped"].as_bool() == Some(true) { " (daily cap)" } else { "" })
                        } else {
                            format!("Walk done: {} steps, no coins: {}", n(s, "totalSteps") as u64, s["invalidReason"].as_str().unwrap_or("not long enough"))
                        }
                    }
                    Err(e) => format!("Ending the walk failed: {}", e),
                };
            } else {
                busy("Starting a walk...", &mut top, &mut bot, &wallet, &walk);
                let body = json!({"source": "3ds", "consoleHash": chash});
                let r = match api.call("POST", "/exercise/session/start", Some(body)) {
                    Ok(v) => Ok(v["sessionId"].as_str().unwrap_or("").to_string()),
                    // one left open (the app was closed mid-walk): end it and start again
                    Err(e) if e.contains("Active session") => api.call("GET", "/exercise/sessions?limit=1", None).ok()
                        .and_then(|v| v["sessions"][0]["_id"].as_str().map(|s| s.to_string()))
                        .map(|old| { let _ = api.call("POST", "/exercise/session/end", Some(json!({"sessionId": old}))); })
                        .ok_or(e).and_then(|_| api.call("POST", "/exercise/session/start", Some(json!({"source": "3ds", "consoleHash": chash})))
                        .map(|v| v["sessionId"].as_str().unwrap_or("").to_string())),
                    Err(e) => Err(e),
                };
                match r {
                    Ok(id) => {
                        walk = Some(Walk { id, started: now, det: StepDetector::new(), pending: Vec::new(), last_point: now, last_post: now, last_steps: 0, inflight: None });
                        msg = "Walking! Keep the console with you; Y ends the walk.".into();
                    }
                    Err(e) => msg = format!("Couldn't start a walk: {}", e),
                }
            }
            dirty = 2;
        }

        // ----- the live walk: sample every frame, a data point a second, posted every 10 s
        if let Some(w) = walk.as_mut() {
            let t_ms = (now - w.started).as_millis() as u64;
            let a = if SELFTEST { fake_accel(t_ms) } else { hid.accelerometer_vector().map(|v| v.into()).unwrap_or((0, 0, 0)) };
            w.det.sample(a, t_ms, dt_ms.max(1));
            if now - w.last_point >= Duration::from_secs(1) {
                w.last_point += Duration::from_secs(1);
                let count = w.det.steps - w.last_steps; w.last_steps = w.det.steps;
                let rate = (w.det.rate(t_ms) * 100.0).round() / 100.0;
                w.pending.push(json!({"timestamp": format!("{}Z", iso(console_now())), "stepCount": count,
                    "stepsPerSecond": rate, "accelVariance": (w.det.take_variance() * 1e5).round() / 1e5}));
            }
            if w.inflight.as_ref().is_some_and(|h| h.is_finished()) {
                if let Some(Err(e)) = w.inflight.take().and_then(|h| h.join().ok()) { msg = format!("Couldn't send steps: {}", e); dirty = 2; }
            }
            if now - w.last_post >= Duration::from_secs(10) && !w.pending.is_empty() && w.inflight.is_none() {
                w.last_post = now;
                let (a, id, pts) = (api.clone(), w.id.clone(), std::mem::take(&mut w.pending));
                w.inflight = Some(std::thread::spawn(move || post_points(&a, &id, pts)));
            }
        }

        // ----- draw, four times a second (or right away after something happened)
        if now >= next_draw || dirty > 0 {
            if now >= next_draw { next_draw = now + Duration::from_millis(250); dirty = dirty.max(2); }
            draw_top(&mut top, &wallet, walk.as_ref(), &msg, &chash);
            draw_bottom(&mut bot, walk.is_some(), !logged_in);
        }
        if dirty > 0 {
            dirty -= 1;
            present_both(&gfx, &top, &bot);
        }
        if SELFTEST && st_step >= 6 && started.elapsed().as_secs() >= 150 { break; }
        gfx.wait_for_vblank();
    }
}

fn post_points(api: &Api, id: &str, pts: Vec<Value>) -> Result<(), String> {
    api.call("POST", "/exercise/session/steps", Some(json!({"sessionId": id, "stepData": pts}))).map(|_| ())
}

fn refresh(api: &Api, w: &mut Wallet) -> Result<(), String> {
    let b = api.call("GET", "/wallet/balance", None)?;
    w.balance = n(&b, "balance");
    let s = api.call("GET", "/pedometer/status", None)?;
    let t = &s["today"];
    w.today_steps = n(t, "steps") as u64; w.today_coins = n(t, "coins");
    w.step_cap = n(t, "stepCap") as u64; w.coin_cap = n(t, "coinCap");
    w.last_sync = s["lastSync"].as_str().map(|x| x.replace('T', " ").chars().take(16).collect()).unwrap_or_default();
    if w.user.is_empty() {
        if let Ok(p) = api.call("GET", "/auth/profile", None) {
            w.user = p["user"]["username"].as_str().or(p["username"].as_str()).unwrap_or("").to_string();
        }
    }
    Ok(())
}

/// Email and password on the system keyboard.
fn ask_login(apt: &Apt, gfx: &Gfx, email: &str) -> Option<(String, String)> {
    use ctru::applets::swkbd::{Button, ButtonConfig, Kind, PasswordMode, SoftwareKeyboard};
    let mut k = SoftwareKeyboard::new(Kind::Western, ButtonConfig::LeftRight);
    k.set_hint_text(Some("Exercise Coin email"));
    if !email.is_empty() { k.set_initial_text(Some(email.to_string().into())); }
    let (e, b) = k.launch(apt, gfx).ok()?;
    if b != Button::Right || e.is_empty() { return None; }
    let mut k = SoftwareKeyboard::new(Kind::Western, ButtonConfig::LeftRight);
    k.set_hint_text(Some("Password"));
    k.set_password_mode(PasswordMode::HideDelay);
    let (p, b) = k.launch(apt, gfx).ok()?;
    if b != Button::Right || p.is_empty() { return None; }
    Some((e, p))
}

/// The self-test's walk: ~1.8-2.2 steps a second, uneven like a person, a bump of ~0.3 g per step.
fn fake_accel(t_ms: u64) -> (i16, i16, i16) {
    let t = t_ms as f32 / 1000.0;
    let rate = 2.0 + 0.25 * (t * 0.37).sin() + 0.1 * (t * 1.3).sin();
    let phase = (t * rate).fract();
    let bump = if phase < 0.15 { (phase / 0.15 * std::f32::consts::PI).sin() * 160.0 } else { 0.0 };
    let wob = ((t * 7.3).sin() * 6.0) as i16;
    (wob, (512.0 + bump) as i16, -wob)
}

// ------------------------------------------------------------------ drawing

const INK: (u8, u8, u8) = (30, 26, 20);
const GOLD: (u8, u8, u8) = (214, 160, 40);
const PAPER: (u8, u8, u8) = (250, 244, 228);

fn draw_top(buf: &mut [u8], w: &Wallet, walk: Option<&Walk>, msg: &str, chash: &str) {
    fill(buf, TW, TH, 0, 0, TW, TH, PAPER);
    fill(buf, TW, TH, 0, 0, TW, 22, (40, 110, 70));
    draw_text(buf, TW, TH, "Exercise Coin", 8, 7, 1, (255, 255, 255));
    let who = if w.user.is_empty() { "not logged in".to_string() } else { w.user.clone() };
    draw_text(buf, TW, TH, &who, TW - 8 - text_width(&who, 1), 7, 1, (220, 240, 225));
    draw_text(buf, TW, TH, "Balance", 12, 32, 1, (110, 100, 80));
    let bal = format!("{:.2} EXC", w.balance);
    draw_text(buf, TW, TH, &bal, 12, 44, 3, GOLD);
    let y = 80;
    draw_text(buf, TW, TH, &format!("Paid today: {} steps ({:.2} EXC)", w.today_steps, w.today_coins), 12, y, 1, INK);
    if w.step_cap > 0 {
        draw_text(buf, TW, TH, &format!("Daily caps: {} pedometer steps, {:.0} EXC", w.step_cap, w.coin_cap), 12, y + 12, 1, (110, 100, 80));
    }
    if !w.last_sync.is_empty() { draw_text(buf, TW, TH, &format!("Last sync: {} UTC", w.last_sync), 12, y + 24, 1, (110, 100, 80)); }
    // the walk
    fill(buf, TW, TH, 8, 122, TW - 16, 40, (232, 240, 226));
    match walk {
        Some(wk) => {
            let s = wk.started.elapsed().as_secs();
            let t = format!("Walking {}:{:02}   {} steps   {:.1} steps/s", s / 60, s % 60, wk.det.steps, wk.det.rate(wk.started.elapsed().as_millis() as u64));
            draw_text(buf, TW, TH, &t, 16, 130, 1, (30, 90, 50));
            draw_text(buf, TW, TH, "Coins need a minute or more of steady walking.", 16, 145, 1, (90, 110, 90));
        }
        None => draw_text(buf, TW, TH, "No walk going. Y starts one, A syncs steps.", 16, 137, 1, (90, 110, 90)),
    }
    for (i, l) in wrap(msg, 46).iter().take(3).enumerate() { draw_text(buf, TW, TH, l, 12, 172 + i as i32 * 12, 1, INK); }
    draw_text(buf, TW, TH, &format!("console {}", &chash[..8]), 12, TH - 12, 1, (170, 160, 140));
}

fn button(buf: &mut [u8], x: i32, y: i32, w: i32, h: i32, label: &str, key: &str, c: (u8, u8, u8)) {
    fill(buf, BW, BH, x, y, w, h, c);
    fill(buf, BW, BH, x, y + h - 3, w, 3, (c.0 / 2, c.1 / 2, c.2 / 2));
    draw_text(buf, BW, BH, label, x + (w - text_width(label, 2)) / 2, y + h / 2 - 9, 2, (255, 255, 255));
    draw_text(buf, BW, BH, key, x + w - 8 - text_width(key, 1), y + 5, 1, (255, 255, 255));
}

fn draw_bottom(buf: &mut [u8], walking: bool, login: bool) {
    fill(buf, BW, BH, 0, 0, BW, BH, (34, 40, 36));
    draw_text(buf, BW, BH, if login { "A, X or Y logs in first" } else { "Touch a button, or press its key" }, 16, 16, 1, (190, 200, 190));
    button(buf, 16, 40, 288, 52, "Sync steps", "A", (50, 120, 200));
    if walking { button(buf, 16, 104, 288, 52, "End walk", "Y", (200, 80, 60)); }
    else { button(buf, 16, 104, 288, 52, "Start walk", "Y", (40, 150, 80)); }
    button(buf, 16, 168, 288, 40, "Refresh", "X", (110, 110, 110));
    draw_text(buf, BW, BH, "START quits", BW - 16 - text_width("START quits", 1), BH - 16, 1, (150, 160, 150));
}
