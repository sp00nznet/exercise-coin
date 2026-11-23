# Nintendo 3DS

Exercise Coin on a New 3DS / 2DS as a homebrew `.3dsx` (`ExerciseCoin-3DS/`, Rust over
[ctru-rs](https://github.com/rust3ds/ctru-rs)). The plan is game-ideas `ideas/3ds.md` #39.

## Client

- **Top screen:** your balance, what's been paid today against the caps, the walk in progress, the last result.
- **Bottom screen:** Sync steps (A), Start / End walk (Y), Refresh (X). START quits.
- **Sync steps:** the console's pedometer counts steps even closed in a pocket. Sync sends the last week's hourly
  history and the server pays the steps it hasn't paid yet (at about half a live walk's rate, within the caps below).
- **Live walk:** with the app open, steps are counted from the accelerometer (a peak detector,
  `src/steps.rs`) and sent once a second like the phone apps send them, plus how much the console moved
  (`accelVariance`), so a console lying on a desk earns nothing. Uploads go from a thread so the counting never stalls.
  Coins need a minute or more of steady walking, as on the phones.
- **Settings:** `sdmc:/3ds/excoin/config.txt`:

      server=http://192.168.1.10:3000
      email=you@example.com
      password=...          (first run only; after logging in only the token is kept)

  Without `email`/`password` the first A/X/Y opens the system keyboard for them.
- **Plain HTTP, on the LAN, for now.** The 3DS's own TLS (`httpc`) trusts a root store from 2016; reaching a server
  over HTTPS on the internet needs `httpcAddTrustedRootCA` with a current root (or a TLS library in the app). Until
  then, run the server where the console can reach it on the local network.
- **The console's clock is local time, with no time zone.** The client sends times as the console sees them and the
  server works out the offset from `clientNow`.
- **The pedometer's history** is `ptm:u` GetStepHistory, called over IPC directly: libctru's `PTMU_GetStepHistory`
  sizes the buffer in bytes instead of u16s (Azahar asserts on it) and always starts at "now".
- **Console identity:** `CFGU_GenHashConsoleUnique` with this app's salt, a hash that identifies the console to this
  server only. The server's per-console caps key on it.

### Building

Needs Docker; the first run builds the `shelf-3ds-rust` image (devkitARM + nightly Rust + cargo-3ds, `3ds.Dockerfile`).

    ExerciseCoin-3DS/build.sh        # -> ExerciseCoin-3DS/target/armv6k-nintendo-3ds/release/excoin.3dsx

Copy `excoin.3dsx` to `sdmc:/3ds/` and start it from the Homebrew Launcher. `EXCOIN_SELFTEST=1 build.sh` builds an
unattended version for Azahar (which has no pedometer and can't be walked with): it logs in from the config, syncs a
made-up week, walks 130 s on a simulated accelerometer, ends the walk and syncs again.

### Tested

In Azahar against the dev server (below) and a real MongoDB: login (the password is dropped from the config, the token
kept), a week's sync paid, a re-sync paid nothing, and a 130 s walk was rewarded (298 steps, 127 valid seconds,
5.80 EXC). Not yet on hardware. Azahar stalls for a second or so a few times in its first ~40 s of running code, which is
enough to break the "60 s of steady walking" rule for an 80 s walk; on hardware that shouldn't happen.


## Server

The 3DS client uses the same REST API and JWT auth as the phone apps
(`POST /api/auth/login`, then `Authorization: Bearer <token>`). It adds a
pedometer sync and tags live sessions with `source: "3ds"`.

The client is homebrew on hackable hardware (and runs in emulators), so the
server trusts nothing it sends: everything below is caps and plausibility
checks. Rules live in `server/src/services/PedometerService.js` (pure functions,
unit-tested in `server/tests/`).

### `POST /api/pedometer/sync`

```json
{
  "consoleHash": "0123456789abcdef",
  "clientNow": "2026-11-23T09:20:00",
  "totalSteps": 123456,
  "hours": [ { "start": "2026-11-23T08:00:00", "steps": 1500 } ]
}
```

- `consoleHash`: 16 hex chars. `clientNow` / `start`: the console clock (local
  time, no zone); `start` must be on the hour. `steps`: 0..65535. 1..168 hours.
- Response 200:

```json
{
  "credited": { "steps": 4500, "coins": 45 },
  "today": { "steps": 20000, "coins": 200, "stepCap": 20000, "coinCap": 300 },
  "flags": ["hour_cap:2026-11-23", "day_step_cap:2026-11-23"],
  "offsetMinutes": 300
}
```

- 400: validation failure, or the console clock is more than 14 h from server
  time (`{ "error": ..., "offsetMinutes": ... }`). 409: another reward
  operation for this user/console was still running after 10 s (retry).

### `GET /api/pedometer/status`

```json
{ "today": { "steps": 0, "coins": 0, "stepCap": 20000, "coinCap": 300 }, "lastSync": "2026-11-23T14:25:05.764Z" }
```

`lastSync` is `null` before the first sync. `today` is the current UTC day.

### Rules

- **Clock**: offset = server UTC − `clientNow` (read as if UTC), rounded to
  15 min; every `start` is shifted by it. Stored per console. If a console's
  offset changes, hours that had already ended by its previous sync are
  ignored (they would otherwise be re-keyed and paid again).
- **Hours ignored**: more than 1 h in the future, older than 7 days, or
  starting before the account was created. A brand-new account earns from the
  next full hour on.
- **Storage**: one `PedometerHour` per (user, console, UTC hour);
  `steps = max(old, new)`. Only steps above what was already paid for that hour
  are paid, up to `PEDOMETER_HOUR_CAP` per hour.
- **Implausible day**: more than 18 hours with >300 steps in one UTC day (all of
  the user's consoles) flags the day; nothing more is paid for it, ever.
  Already-paid steps are not clawed back.
- **Day caps** (by the UTC day of the hour): `PEDOMETER_DAY_CAP` steps per user,
  and the same per console across all users.
- **Coins**: `PEDOMETER_EXC_PER_1000` per 1000 steps, rounded to 2 decimals.
  A live session pays ~21.4 EXC per 1000 steps at 2 steps/s, so passive steps
  pay about half.
- **Daily coin cap**: `DAILY_EXC_CAP` per user per UTC day across live-session
  mining rewards and pedometer rewards (bonuses/achievements/treasure aren't
  counted). Pedometer payout and live-session rewards are trimmed to what's
  left.
- **Credit**: one `Transaction` (`type: "pedometer_reward"`, confirmed,
  `metadata: { steps, hours, consoleHash }`) per sync that pays anything;
  `User.totalCoinsEarned` (which is the wallet balance) and `totalSteps` go up.
- **Concurrency**: syncs take a per-user and a per-console lock (Mongo
  `rewardlocks` collection, 30 s TTL); each hour's payment is also a
  conditional update on its previous `paidSteps`, so the same steps can't be
  paid twice. Live-session `end` takes the same per-user lock while applying
  the daily cap.
- **Flags** (strings, informational): `hour_cap:<day>`, `day_step_cap:<day>`,
  `console_step_cap:<day>`, `coin_cap:<day>`, `implausible_day:<day>`,
  `clock_changed`, `hours_exceed_total`, `ignored_<future|old|beforeAccount|clockChange|invalid>:<n>`.

### Live sessions

- `POST /api/exercise/session/start` takes an optional
  `{ "source": "3ds", "consoleHash": "0123456789abcdef" }` (`source` defaults
  to `unknown`).
- `POST /api/exercise/session/steps` points take optional `accelVariance`
  (number >= 0).
- `POST /api/exercise/session/end`: reward trimmed to the daily coin cap
  (response has top-level `"capped": true|false`). For `source: "3ds"`, if more
  than half of the points carrying `accelVariance` have it below 0.0005, the
  session is invalid with reason `no motion`.

### Env vars

| Var | Default | |
|---|---|---|
| `PEDOMETER_HOUR_CAP` | 7000 | steps paid per hour |
| `PEDOMETER_DAY_CAP` | 20000 | steps paid per UTC day, per user and per console |
| `PEDOMETER_EXC_PER_1000` | 10 | EXC per 1000 pedometer steps |
| `DAILY_EXC_CAP` | 300 | EXC per user per UTC day, live sessions + pedometer |
| `HOST` | (all interfaces) | bind address |

### Dev server

```sh
sudo docker run -d --name excoin-mongo -p 127.0.0.1:27017:27017 mongo:7   # once
cd server && npm install
MONGODB_URI=mongodb://127.0.0.1:27017/exercise-coin JWT_SECRET=dev PORT=3000 node src/index.js
npx jest
```

It listens on all interfaces, so a 3DS or emulator can use
`http://<this machine's LAN IP>:3000`. There is no external coin daemon;
mining is simulated in-process.
