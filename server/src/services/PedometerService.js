/**
 * Pedometer (3DS) reward rules.
 *
 * The 3DS client is homebrew on hackable hardware (and runs in emulators), so
 * nothing it sends is trusted: every rule here is a cap or a plausibility check.
 * The first half of this file is pure functions (unit-tested without Mongo);
 * the second half wires them to the database.
 *
 * Rate rationale: a live session pays (validSeconds * MINING_RATIO / 60) *
 * COINS_PER_MINING_MINUTE. At 2 steps/s, 1000 steps = 500 s of valid exercise
 * = 250 s = 4.17 min of mining * 5.13 EXC/min = ~21.4 EXC per 1000 steps
 * (+-10% random variance). Passive pedometer steps pay roughly half that:
 * 10 EXC per 1000 steps by default.
 */
const crypto = require('crypto');
const mongoose = require('mongoose');

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const QUARTER_HOUR_MS = 15 * 60 * 1000;
const MAX_OFFSET_MINUTES = 14 * 60;
const HISTORY_DAYS = 7;
const ACTIVE_HOUR_STEPS = 300;      // an hour with more steps than this counts as "active"
const MAX_ACTIVE_HOURS_PER_DAY = 18;
const NO_MOTION_VARIANCE = 0.0005;

function intEnv(env, name, def) {
  const v = parseFloat(env[name]);
  return Number.isFinite(v) && v >= 0 ? v : def;
}

function getConfig(env = process.env) {
  return {
    hourCap: intEnv(env, 'PEDOMETER_HOUR_CAP', 7000),
    dayCap: intEnv(env, 'PEDOMETER_DAY_CAP', 20000),
    excPer1000: intEnv(env, 'PEDOMETER_EXC_PER_1000', 10),
    dailyExcCap: intEnv(env, 'DAILY_EXC_CAP', 300)
  };
}

// ---------------------------------------------------------------- pure logic

const CONSOLE_TIME_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/;

/** Parse a console "YYYY-MM-DDTHH:MM:SS" (no zone) as if it were UTC. NaN if invalid. */
function parseConsoleTime(str) {
  const m = CONSOLE_TIME_RE.exec(str || '');
  if (!m) return NaN;
  const [y, mo, d, h, mi, s] = m.slice(1).map(Number);
  const ms = Date.UTC(y, mo - 1, d, h, mi, s);
  const back = new Date(ms);
  // Reject rollovers like 2026-02-31 or 25:00.
  if (back.getUTCFullYear() !== y || back.getUTCMonth() !== mo - 1 || back.getUTCDate() !== d ||
      back.getUTCHours() !== h || back.getUTCMinutes() !== mi || back.getUTCSeconds() !== s) {
    return NaN;
  }
  return ms;
}

/** Offset (minutes) to add to console time to get UTC, rounded to 15 min. */
function computeOffsetMinutes(clientNowStr, serverNowMs) {
  const client = parseConsoleTime(clientNowStr);
  if (Number.isNaN(client)) return NaN;
  const rounded = Math.round((serverNowMs - client) / QUARTER_HOUR_MS) * QUARTER_HOUR_MS;
  return rounded / 60000 || 0; // avoid -0
}

function isOffsetAllowed(offsetMinutes) {
  return Number.isFinite(offsetMinutes) && Math.abs(offsetMinutes) <= MAX_OFFSET_MINUTES;
}

function utcDayStart(ms) {
  return Math.floor(ms / DAY_MS) * DAY_MS;
}

function dayKey(ms) {
  return new Date(utcDayStart(ms)).toISOString().slice(0, 10);
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

/**
 * Shift console hours to UTC and drop the ones we won't accept.
 * opts: { offsetMinutes, nowMs, accountCreatedMs, prevOffsetMinutes?, lastSyncMs? }
 * If the console's clock offset changed since its last sync, hours that had
 * already ended by the last sync are dropped (they were reported under the old
 * offset and would otherwise be re-keyed and paid twice).
 * Duplicate hours in one request keep the max.
 */
function filterHours(hours, opts) {
  const { offsetMinutes, nowMs, accountCreatedMs } = opts;
  const clockChanged = opts.prevOffsetMinutes !== undefined && opts.prevOffsetMinutes !== null &&
    opts.lastSyncMs && opts.prevOffsetMinutes !== offsetMinutes;
  const ignored = { invalid: 0, future: 0, old: 0, beforeAccount: 0, clockChange: 0 };
  const byStart = new Map();

  for (const h of hours) {
    const local = parseConsoleTime(h.start);
    if (Number.isNaN(local) || !Number.isInteger(h.steps) || h.steps < 0 || h.steps > 65535) {
      ignored.invalid++;
      continue;
    }
    const start = local + offsetMinutes * 60000;
    if (start > nowMs + HOUR_MS) { ignored.future++; continue; }
    if (start < nowMs - HISTORY_DAYS * DAY_MS) { ignored.old++; continue; }
    if (start < accountCreatedMs) { ignored.beforeAccount++; continue; }
    if (clockChanged && start + HOUR_MS <= opts.lastSyncMs) { ignored.clockChange++; continue; }
    byStart.set(start, Math.max(byStart.get(start) || 0, h.steps));
  }

  const accepted = [...byStart.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([hourStart, steps]) => ({ hourStart, steps }));
  return { accepted, ignored, clockChanged: Boolean(clockChanged) };
}

/**
 * hours: [{hourStart, steps}] for ONE user and ONE UTC day (any consoles).
 * Steps from several consoles in the same hour are summed.
 */
function isImplausibleDay(hours) {
  const perHour = new Map();
  for (const h of hours) {
    const k = +new Date(h.hourStart);
    perHour.set(k, (perHour.get(k) || 0) + h.steps);
  }
  let active = 0;
  for (const steps of perHour.values()) if (steps > ACTIVE_HOUR_STEPS) active++;
  return active > MAX_ACTIVE_HOURS_PER_DAY;
}

function coinsForSteps(steps, cfg) {
  return round2(steps * cfg.excPer1000 / 1000);
}

/** Largest step count whose coins fit in `coins` (floor). */
function stepsForCoins(coins, cfg) {
  if (cfg.excPer1000 <= 0) return Infinity;
  return Math.max(0, Math.floor((coins * 1000) / cfg.excPer1000 + 1e-9));
}

/**
 * Plan payments for one UTC day.
 * input: {
 *   day: 'YYYY-MM-DD',
 *   hours: [{id, hourStart, steps, paidSteps, flagged}]  this user's hours on this console that day
 *   implausible: bool                                     from isImplausibleDay over all the user's hours
 *   userPaidSteps: pedometer steps already paid to this user that day (all consoles)
 *   consolePaidSteps: steps already paid for this console that day (all users)
 *   liveCoins: live-session coins this user earned that day
 * }
 * returns { payments: [{id, from, to}], steps, flags, flagDay }
 */
function planDayPayout(input, cfg) {
  const { day, hours } = input;
  const flags = [];
  const anyFlagged = hours.some(h => h.flagged);

  if (input.implausible || anyFlagged) {
    return { payments: [], steps: 0, flags: [`implausible_day:${day}`], flagDay: true };
  }

  const userLeft = Math.max(0, cfg.dayCap - input.userPaidSteps);
  const consoleLeft = Math.max(0, cfg.dayCap - input.consolePaidSteps);
  const coinsLeft = Math.max(0, cfg.dailyExcCap - input.liveCoins - coinsForSteps(input.userPaidSteps, cfg));
  const coinStepsLeft = stepsForCoins(coinsLeft, cfg);
  let allowance = Math.min(userLeft, consoleLeft, coinStepsLeft);

  const payments = [];
  let paid = 0;
  let unpaid = 0;
  let hourCapHit = false;

  for (const h of [...hours].sort((a, b) => +new Date(a.hourStart) - +new Date(b.hourStart))) {
    if (h.steps > cfg.hourCap && h.paidSteps < cfg.hourCap) hourCapHit = true;
    const payable = Math.max(0, Math.min(h.steps, cfg.hourCap) - h.paidSteps);
    if (payable === 0) continue;
    const take = Math.min(payable, allowance);
    unpaid += payable - take;
    if (take > 0) {
      payments.push({ id: h.id, from: h.paidSteps, to: h.paidSteps + take });
      allowance -= take;
      paid += take;
    }
  }

  if (hourCapHit) flags.push(`hour_cap:${day}`);
  if (unpaid > 0) {
    const limit = Math.min(userLeft, consoleLeft, coinStepsLeft);
    if (limit === coinStepsLeft && coinStepsLeft < Math.min(userLeft, consoleLeft)) flags.push(`coin_cap:${day}`);
    else if (limit === consoleLeft && consoleLeft < userLeft) flags.push(`console_step_cap:${day}`);
    else flags.push(`day_step_cap:${day}`);
  }

  return { payments, steps: paid, flags, flagDay: false };
}

/** Trim a coin amount to what's left under the daily cap. */
function trimCoins(coins, usedToday, cap) {
  const left = Math.max(0, round2(cap - usedToday));
  if (coins <= left) return { coins: round2(coins), capped: false };
  return { coins: left, capped: true };
}

/** True if more than half of the points carrying accelVariance show (almost) no motion. */
function isNoMotion(points) {
  const withVar = (points || []).filter(p => typeof p.accelVariance === 'number');
  if (withVar.length === 0) return false;
  const still = withVar.filter(p => p.accelVariance < NO_MOTION_VARIANCE).length;
  return still > withVar.length / 2;
}

// ---------------------------------------------------------------- database

function models() {
  // Lazy so the pure functions can be tested without loading Mongoose models.
  return {
    User: require('../models/User'),
    Transaction: require('../models/Transaction'),
    PedometerHour: require('../models/PedometerHour'),
    PedometerConsole: require('../models/PedometerConsole')
  };
}

const LOCK_TTL_MS = 30 * 1000;
const LOCK_WAIT_MS = 10 * 1000;

function lockCollection() {
  return mongoose.connection.collection('rewardlocks');
}

async function acquireLock(key) {
  const deadline = Date.now() + LOCK_WAIT_MS;
  const token = crypto.randomBytes(8).toString('hex');
  for (;;) {
    const now = new Date();
    try {
      await lockCollection().findOneAndUpdate(
        { _id: key, until: { $lt: now } },
        { $set: { until: new Date(now.getTime() + LOCK_TTL_MS), token } },
        { upsert: true }
      );
      return token;
    } catch (err) {
      if (err.code !== 11000) throw err; // 11000 = held by someone else
    }
    if (Date.now() > deadline) {
      const e = new Error('Another reward operation is in progress, try again');
      e.statusCode = 409;
      throw e;
    }
    await new Promise(r => setTimeout(r, 100));
  }
}

async function releaseLock(key, token) {
  await lockCollection().deleteOne({ _id: key, token });
}

/** Run fn while holding the given locks (acquired in order, released in reverse). */
async function withLocks(keys, fn) {
  const held = [];
  try {
    for (const k of keys) held.push([k, await acquireLock(k)]);
    return await fn();
  } finally {
    for (const [k, t] of held.reverse()) {
      await releaseLock(k, t).catch(() => {});
    }
  }
}

const userLockKey = (userId) => `user:${userId}`;
const consoleLockKey = (hash) => `console:${hash}`;

async function sumPaidSteps(match) {
  const { PedometerHour } = models();
  const r = await PedometerHour.aggregate([
    { $match: match },
    { $group: { _id: null, steps: { $sum: '$paidSteps' } } }
  ]);
  return r[0] ? r[0].steps : 0;
}

/** Coins from live exercise sessions created in [dayStart, dayStart+1d). */
async function liveCoinsForDay(userId, dayStartMs) {
  const { Transaction } = models();
  const r = await Transaction.aggregate([
    { $match: {
      userId: new mongoose.Types.ObjectId(String(userId)),
      type: 'mining_reward',
      exerciseSessionId: { $exists: true, $ne: null },
      createdAt: { $gte: new Date(dayStartMs), $lt: new Date(dayStartMs + DAY_MS) }
    } },
    { $group: { _id: null, coins: { $sum: '$amount' } } }
  ]);
  return r[0] ? r[0].coins : 0;
}

function dayRange(dayStartMs) {
  return { $gte: new Date(dayStartMs), $lt: new Date(dayStartMs + DAY_MS) };
}

/** Today's totals (UTC day): pedometer steps paid, coins counted toward the daily cap. */
async function getToday(userId, nowMs, cfg = getConfig()) {
  const dayStart = utcDayStart(nowMs);
  const uid = new mongoose.Types.ObjectId(String(userId));
  const steps = await sumPaidSteps({ userId: uid, hourStart: dayRange(dayStart) });
  const live = await liveCoinsForDay(userId, dayStart);
  return {
    steps,
    coins: round2(live + coinsForSteps(steps, cfg)),
    stepCap: cfg.dayCap,
    coinCap: cfg.dailyExcCap
  };
}

/** Coins already counted toward today's cap (live sessions + pedometer). */
async function coinsUsedToday(userId, nowMs, cfg = getConfig()) {
  return (await getToday(userId, nowMs, cfg)).coins;
}

function accountCreatedMs(user) {
  if (user.createdAt) return new Date(user.createdAt).getTime();
  return user._id.getTimestamp().getTime();
}

/**
 * POST /api/pedometer/sync. Returns { status, body }.
 */
async function sync(userId, body, nowMs = Date.now()) {
  const cfg = getConfig();
  const { User, Transaction, PedometerHour, PedometerConsole } = models();
  const { consoleHash } = body;

  const offsetMinutes = computeOffsetMinutes(body.clientNow, nowMs);
  if (Number.isNaN(offsetMinutes)) {
    return { status: 400, body: { error: 'Invalid clientNow' } };
  }
  if (!isOffsetAllowed(offsetMinutes)) {
    return { status: 400, body: { error: 'Console clock is more than 14 hours from server time', offsetMinutes } };
  }

  const user = await User.findById(userId);
  if (!user) return { status: 404, body: { error: 'User not found' } };
  const uid = user._id;

  return withLocks([userLockKey(uid), consoleLockKey(consoleHash)], async () => {
    const flags = [];
    const consoleDoc = await PedometerConsole.findOne({ userId: uid, consoleHash });

    const { accepted, ignored, clockChanged } = filterHours(body.hours, {
      offsetMinutes,
      nowMs,
      accountCreatedMs: accountCreatedMs(user),
      prevOffsetMinutes: consoleDoc ? consoleDoc.offsetMinutes : undefined,
      lastSyncMs: consoleDoc && consoleDoc.lastSyncAt ? consoleDoc.lastSyncAt.getTime() : undefined
    });
    if (clockChanged) flags.push('clock_changed');
    for (const [k, n] of Object.entries(ignored)) if (n > 0) flags.push(`ignored_${k}:${n}`);

    const reportedSum = accepted.reduce((s, h) => s + h.steps, 0);
    if (reportedSum > body.totalSteps) flags.push('hours_exceed_total');

    // Upsert hours: an hour's count only grows.
    if (accepted.length) {
      await PedometerHour.bulkWrite(accepted.map(h => ({
        updateOne: {
          filter: { userId: uid, consoleHash, hourStart: new Date(h.hourStart) },
          update: { $max: { steps: h.steps }, $setOnInsert: { paidSteps: 0, flagged: false } },
          upsert: true
        }
      })), { ordered: false });
    }

    // Plan and pay per UTC day.
    const days = [...new Set(accepted.map(h => utcDayStart(h.hourStart)))].sort((a, b) => a - b);
    let creditedSteps = 0;
    let paidHours = 0;

    for (const dayStart of days) {
      const range = dayRange(dayStart);
      const key = dayKey(dayStart);
      const userDayHours = await PedometerHour.find({ userId: uid, hourStart: range }).lean();
      const consoleDayHours = userDayHours.filter(h => h.consoleHash === consoleHash);
      const userPaidSteps = userDayHours.reduce((s, h) => s + h.paidSteps, 0);
      const consolePaidSteps = await sumPaidSteps({ consoleHash, hourStart: range });
      const liveCoins = await liveCoinsForDay(uid, dayStart);

      const plan = planDayPayout({
        day: key,
        hours: consoleDayHours.map(h => ({
          id: h._id, hourStart: h.hourStart, steps: h.steps, paidSteps: h.paidSteps, flagged: h.flagged
        })),
        implausible: isImplausibleDay(userDayHours),
        userPaidSteps,
        consolePaidSteps,
        liveCoins
      }, cfg);
      flags.push(...plan.flags);

      if (plan.flagDay) {
        await PedometerHour.updateMany({ userId: uid, hourStart: range }, { $set: { flagged: true } });
        continue;
      }

      for (const p of plan.payments) {
        // Conditional on the paidSteps we planned from: never pays the same steps twice.
        const r = await PedometerHour.updateOne(
          { _id: p.id, paidSteps: p.from, flagged: false },
          { $set: { paidSteps: p.to } }
        );
        if (r.modifiedCount === 1) {
          creditedSteps += p.to - p.from;
          paidHours++;
        }
      }
    }

    const coins = coinsForSteps(creditedSteps, cfg);
    if (coins > 0) {
      await Transaction.create({
        userId: uid,
        type: 'pedometer_reward',
        amount: coins,
        status: 'confirmed',
        confirmedAt: new Date(nowMs),
        metadata: { steps: creditedSteps, hours: paidHours, consoleHash }
      });
      await User.updateOne({ _id: uid }, {
        $inc: { totalCoinsEarned: coins, totalSteps: creditedSteps },
        $set: { lastActiveAt: new Date(nowMs) }
      });
    }

    await PedometerConsole.updateOne(
      { userId: uid, consoleHash },
      { $set: { offsetMinutes, lastSyncAt: new Date(nowMs), lastTotalSteps: body.totalSteps } },
      { upsert: true }
    );

    return {
      status: 200,
      body: {
        credited: { steps: creditedSteps, coins },
        today: await getToday(uid, nowMs, cfg),
        flags,
        offsetMinutes
      }
    };
  });
}

/** GET /api/pedometer/status */
async function status(userId, nowMs = Date.now()) {
  const { PedometerConsole } = models();
  const last = await PedometerConsole.findOne({ userId }).sort({ lastSyncAt: -1 }).lean();
  return {
    today: await getToday(userId, nowMs),
    lastSync: last && last.lastSyncAt ? new Date(last.lastSyncAt).toISOString() : null
  };
}

/** Run fn under the user's reward lock (shared with pedometer sync, so the daily cap holds). */
function withUserLock(userId, fn) {
  return withLocks([userLockKey(userId)], fn);
}

module.exports = {
  // pure
  getConfig,
  parseConsoleTime,
  computeOffsetMinutes,
  isOffsetAllowed,
  utcDayStart,
  dayKey,
  filterHours,
  isImplausibleDay,
  coinsForSteps,
  stepsForCoins,
  planDayPayout,
  trimCoins,
  isNoMotion,
  round2,
  // db
  sync,
  status,
  getToday,
  coinsUsedToday,
  withUserLock
};
