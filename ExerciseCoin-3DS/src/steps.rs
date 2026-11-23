//! Steps, two ways: the console's pedometer (hourly history, counted even asleep) and a live
//! step detector on the accelerometer, for walks with the app open. Plus the console's clock.
//! Everything here is plain Rust so it can be tested on the PC.

/// Seconds since 1970 by the console's clock. It's LOCAL time with no time zone: the server
/// works out the offset from `clientNow` (see docs/3ds.md).
pub fn console_now() -> u64 {
    std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map(|d| d.as_secs()).unwrap_or(0)
}

/// "YYYY-MM-DDTHH:MM:SS" for `secs` since 1970 (proleptic Gregorian; Howard Hinnant's civil_from_days).
pub fn iso(secs: u64) -> String {
    let days = (secs / 86_400) as i64;
    let rem = secs % 86_400;
    let z = days + 719_468;
    let era = z.div_euclid(146_097);
    let doe = z - era * 146_097;
    let yoe = (doe - doe / 1460 + doe / 36_524 - doe / 146_096) / 365;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if mp < 10 { mp + 3 } else { mp - 9 };
    let y = yoe + era * 400 + if m <= 2 { 1 } else { 0 };
    format!("{:04}-{:02}-{:02}T{:02}:{:02}:{:02}", y, m, d, rem / 3600, rem / 60 % 60, rem % 60)
}

/// Live step detection from the accelerometer, sampled every frame (~60 Hz).
///
/// A step is a peak in the magnitude of acceleration, after a slow average (gravity, and how the
/// console is held) is taken away. Peaks have to clear a threshold that follows how hard you're
/// moving, and be at least 250 ms apart (no one takes four steps a second walking).
pub struct StepDetector {
    avg: f32,        // slow average of |a|: gravity and posture
    env: f32,        // how big the swings are lately: the threshold follows it
    prev: f32, prev2: f32,
    since_step_ms: u32,
    pub steps: u32,
    /// times (ms) of the recent steps, for the rate
    recent: Vec<u64>,
    /// this second's magnitudes, for the variance the server checks (a console lying still has none)
    window: Vec<f32>,
}

impl Default for StepDetector { fn default() -> Self { Self::new() } }

impl StepDetector {
    pub fn new() -> Self {
        StepDetector { avg: 0.0, env: 0.0, prev: 0.0, prev2: 0.0, since_step_ms: 10_000, steps: 0, recent: Vec::new(), window: Vec::new() }
    }

    /// One sample: raw axes (the 3DS reports ~512 per g) at time `t_ms`, `dt_ms` since the last.
    pub fn sample(&mut self, (x, y, z): (i16, i16, i16), t_ms: u64, dt_ms: u32) -> bool {
        let g = ((x as f32).powi(2) + (y as f32).powi(2) + (z as f32).powi(2)).sqrt() / 512.0;
        if self.avg == 0.0 { self.avg = g; }
        self.avg += (g - self.avg) * 0.02;
        let v = g - self.avg;
        self.env = self.env * 0.98 + v.abs() * 0.02;
        self.window.push(g);
        self.since_step_ms = self.since_step_ms.saturating_add(dt_ms);
        // a peak one sample back: rose into it, falls after it
        let peak = self.prev > self.prev2 && self.prev >= v;
        let thresh = (self.env * 1.4).max(0.06);
        let mut stepped = false;
        if peak && self.prev > thresh && self.since_step_ms >= 250 {
            self.steps += 1; self.since_step_ms = 0; stepped = true;
            self.recent.push(t_ms);
            self.recent.retain(|&s| t_ms - s <= 4000);
        }
        self.prev2 = self.prev; self.prev = v;
        stepped
    }

    /// Steps per second over the last few seconds, from the step times (a float, so it varies
    /// the way real walking does instead of 2, 2, 2).
    pub fn rate(&self, t_ms: u64) -> f32 {
        let r: Vec<u64> = self.recent.iter().copied().filter(|&s| t_ms - s <= 4000).collect();
        if r.len() < 2 || t_ms - *r.last().unwrap() > 1500 { return 0.0; }
        (r.len() - 1) as f32 * 1000.0 / (r.last().unwrap() - r[0]).max(1) as f32
    }

    /// The variance of |a| (in g^2) over the samples since the last call, and reset.
    pub fn take_variance(&mut self) -> f32 {
        let n = self.window.len().max(1) as f32;
        let m = self.window.iter().sum::<f32>() / n;
        let v = self.window.iter().map(|x| (x - m).powi(2)).sum::<f32>() / n;
        self.window.clear();
        v
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn iso_dates() {
        assert_eq!(iso(0), "1970-01-01T00:00:00");
        assert_eq!(iso(951_782_400), "2000-02-29T00:00:00");
        assert_eq!(iso(1_795_413_031), "2026-11-23T05:50:31");
    }

    /// A simulated walk: 2 steps/s, a bump of ~0.3 g per step on 1 g of gravity, a little noise.
    #[test]
    fn counts_a_walk_and_not_a_table() {
        let mut d = StepDetector::new();
        let mut seed = 12345u32;
        let mut noise = || { seed ^= seed << 13; seed ^= seed >> 17; seed ^= seed << 5; (seed % 21) as f32 - 10.0 };
        for i in 0..(60 * 30) { // 30 s at 60 Hz
            let t = i as f32 / 60.0;
            let phase = (t * 2.0).fract(); // two steps a second
            let bump = if phase < 0.15 { (phase / 0.15 * std::f32::consts::PI).sin() * 160.0 } else { 0.0 };
            d.sample((noise() as i16, (512.0 + bump + noise()) as i16, noise() as i16), (t * 1000.0) as u64, 16);
        }
        assert!((55..=62).contains(&d.steps), "walk: {} steps", d.steps);
        let r = d.rate(30_000);
        assert!((1.7..2.3).contains(&r), "rate {}", r);
        assert!(d.take_variance() > 0.001);

        let mut still = StepDetector::new();
        for i in 0..(60 * 30) { still.sample((0, 512, 1), i * 16, 16); }
        assert_eq!(still.steps, 0);
        assert!(still.take_variance() < 0.0005);
    }
}
