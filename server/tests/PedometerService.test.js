const P = require('../src/services/PedometerService');

const cfg = { hourCap: 7000, dayCap: 20000, excPer1000: 10, dailyExcCap: 300 };
const H = 3600 * 1000;
const T = (s) => Date.parse(s + 'Z');

describe('getConfig', () => {
  test('defaults', () => {
    expect(P.getConfig({})).toEqual(cfg);
  });
  test('env overrides', () => {
    expect(P.getConfig({ PEDOMETER_HOUR_CAP: '5000', DAILY_EXC_CAP: '100' }))
      .toMatchObject({ hourCap: 5000, dailyExcCap: 100, dayCap: 20000 });
  });
});

describe('parseConsoleTime', () => {
  test('parses as UTC', () => {
    expect(P.parseConsoleTime('2026-11-23T10:15:00')).toBe(Date.UTC(2026, 10, 23, 10, 15, 0));
  });
  test('rejects junk and rollovers', () => {
    expect(P.parseConsoleTime('2026-02-31T10:00:00')).toBeNaN();
    expect(P.parseConsoleTime('2026-11-23T25:00:00')).toBeNaN();
    expect(P.parseConsoleTime('2026-11-23 10:00:00')).toBeNaN();
    expect(P.parseConsoleTime('2026-11-23T10:00:00Z')).toBeNaN();
  });
});

describe('computeOffsetMinutes', () => {
  const server = T('2026-11-23T12:00:00');
  test('zero offset with clock drift', () => {
    expect(P.computeOffsetMinutes('2026-11-23T12:03:10', server)).toBe(0);
    expect(P.computeOffsetMinutes('2026-11-23T11:53:00', server)).toBe(0);
  });
  test('console in UTC-5 (local is behind) gives +300', () => {
    expect(P.computeOffsetMinutes('2026-11-23T07:00:30', server)).toBe(300);
  });
  test('console in UTC+5:45 gives -345', () => {
    expect(P.computeOffsetMinutes('2026-11-23T17:45:00', server)).toBe(-345);
  });
  test('rounds to nearest 15', () => {
    expect(P.computeOffsetMinutes('2026-11-23T11:52:00', server)).toBe(15);
  });
  test('limits', () => {
    expect(P.isOffsetAllowed(14 * 60)).toBe(true);
    expect(P.isOffsetAllowed(-14 * 60)).toBe(true);
    expect(P.isOffsetAllowed(14 * 60 + 15)).toBe(false);
    expect(P.isOffsetAllowed(P.computeOffsetMinutes('2026-11-25T12:00:00', server))).toBe(false);
    expect(P.isOffsetAllowed(NaN)).toBe(false);
  });
});

describe('dayKey / utcDayStart', () => {
  test('buckets by UTC day', () => {
    expect(P.dayKey(T('2026-11-23T23:30:00'))).toBe('2026-11-23');
    expect(P.utcDayStart(T('2026-11-23T23:30:00'))).toBe(T('2026-11-23T00:00:00'));
  });
});

describe('filterHours', () => {
  const now = T('2026-11-23T12:20:00');
  const base = { offsetMinutes: 0, nowMs: now, accountCreatedMs: T('2026-11-01T00:00:00') };

  test('shifts by offset', () => {
    const r = P.filterHours([{ start: '2026-11-23T07:00:00', steps: 10 }], { ...base, offsetMinutes: 300 });
    expect(r.accepted).toEqual([{ hourStart: T('2026-11-23T12:00:00'), steps: 10 }]);
  });
  test('drops future, old, before-account', () => {
    const r = P.filterHours([
      { start: '2026-11-23T13:00:00', steps: 1 },  // within 1 h: ok
      { start: '2026-11-23T14:00:00', steps: 1 },  // > 1 h ahead
      { start: '2026-11-16T12:00:00', steps: 1 },  // > 7 days
      { start: '2026-11-16T13:00:00', steps: 1 },  // within 7 days
      { start: '2026-11-23T05:00:00', steps: 1 }   // before account
    ], { ...base, accountCreatedMs: T('2026-11-23T05:30:00') });
    expect(r.accepted.map(h => h.hourStart)).toEqual([T('2026-11-23T13:00:00')]);
    expect(r.ignored).toMatchObject({ future: 1, old: 1, beforeAccount: 2 });
    const r2 = P.filterHours([
      { start: '2026-11-16T12:00:00', steps: 1 },
      { start: '2026-11-16T13:00:00', steps: 1 }
    ], base);
    expect(r2.ignored.old).toBe(1);
    expect(r2.accepted).toHaveLength(1);
  });
  test('dedupes keeping max, sorted', () => {
    const r = P.filterHours([
      { start: '2026-11-23T10:00:00', steps: 5 },
      { start: '2026-11-23T09:00:00', steps: 1 },
      { start: '2026-11-23T10:00:00', steps: 9 }
    ], base);
    expect(r.accepted).toEqual([
      { hourStart: T('2026-11-23T09:00:00'), steps: 1 },
      { hourStart: T('2026-11-23T10:00:00'), steps: 9 }
    ]);
  });
  test('clock change drops hours that ended before last sync', () => {
    const r = P.filterHours([
      { start: '2026-11-23T09:00:00', steps: 100 },
      { start: '2026-11-23T11:00:00', steps: 100 }
    ], { ...base, prevOffsetMinutes: 60, lastSyncMs: T('2026-11-23T11:10:00') });
    expect(r.clockChanged).toBe(true);
    expect(r.ignored.clockChange).toBe(1);
    expect(r.accepted.map(h => h.hourStart)).toEqual([T('2026-11-23T11:00:00')]);
  });
  test('same offset: no clock-change filtering', () => {
    const r = P.filterHours([{ start: '2026-11-23T09:00:00', steps: 100 }],
      { ...base, prevOffsetMinutes: 0, lastSyncMs: T('2026-11-23T11:10:00') });
    expect(r.clockChanged).toBe(false);
    expect(r.accepted).toHaveLength(1);
  });
});

describe('isImplausibleDay', () => {
  const day = T('2026-11-23T00:00:00');
  const hours = (n, steps) => Array.from({ length: n }, (_, i) => ({ hourStart: new Date(day + i * H), steps }));
  test('18 active hours is fine, 19 is not', () => {
    expect(P.isImplausibleDay(hours(18, 301))).toBe(false);
    expect(P.isImplausibleDay(hours(19, 301))).toBe(true);
  });
  test('300 exactly is not active', () => {
    expect(P.isImplausibleDay(hours(24, 300))).toBe(false);
  });
  test('sums consoles per hour', () => {
    const a = hours(19, 200);
    const b = hours(19, 200);
    expect(P.isImplausibleDay([...a, ...b])).toBe(true);
  });
});

describe('coins', () => {
  test('coinsForSteps / stepsForCoins', () => {
    expect(P.coinsForSteps(1234, cfg)).toBe(12.34);
    expect(P.coinsForSteps(1, { ...cfg, excPer1000: 7 })).toBe(0.01);
    expect(P.stepsForCoins(12.34, cfg)).toBe(1234);
    expect(P.stepsForCoins(0, cfg)).toBe(0);
  });
  test('trimCoins', () => {
    expect(P.trimCoins(50, 100, 300)).toEqual({ coins: 50, capped: false });
    expect(P.trimCoins(50, 280, 300)).toEqual({ coins: 20, capped: true });
    expect(P.trimCoins(50, 300, 300)).toEqual({ coins: 0, capped: true });
    expect(P.trimCoins(50, 400, 300)).toEqual({ coins: 0, capped: true });
  });
});

describe('planDayPayout', () => {
  const day = T('2026-11-23T00:00:00');
  const hour = (i, steps, paidSteps = 0, flagged = false) =>
    ({ id: `h${i}`, hourStart: new Date(day + i * H), steps, paidSteps, flagged });
  const base = { day: '2026-11-23', implausible: false, userPaidSteps: 0, consolePaidSteps: 0, liveCoins: 0 };

  test('pays new steps only', () => {
    const r = P.planDayPayout({ ...base, hours: [hour(8, 1000, 400), hour(9, 500)], userPaidSteps: 400, consolePaidSteps: 400 }, cfg);
    expect(r.payments).toEqual([{ id: 'h8', from: 400, to: 1000 }, { id: 'h9', from: 0, to: 500 }]);
    expect(r.steps).toBe(1100);
    expect(r.flags).toEqual([]);
  });
  test('nothing new -> nothing paid', () => {
    const r = P.planDayPayout({ ...base, hours: [hour(8, 1000, 1000)], userPaidSteps: 1000, consolePaidSteps: 1000 }, cfg);
    expect(r.payments).toEqual([]);
    expect(r.steps).toBe(0);
  });
  test('hour cap', () => {
    const r = P.planDayPayout({ ...base, hours: [hour(8, 9000)] }, cfg);
    expect(r.payments).toEqual([{ id: 'h8', from: 0, to: 7000 }]);
    expect(r.flags).toEqual(['hour_cap:2026-11-23']);
    const again = P.planDayPayout({ ...base, hours: [hour(8, 9500, 7000)], userPaidSteps: 7000, consolePaidSteps: 7000 }, cfg);
    expect(again.payments).toEqual([]);
    expect(again.flags).toEqual([]);
  });
  test('user day cap trims in time order', () => {
    const r = P.planDayPayout({ ...base, hours: [hour(10, 6000), hour(8, 6000), hour(9, 6000)], userPaidSteps: 15000, consolePaidSteps: 15000 }, cfg);
    expect(r.payments).toEqual([{ id: 'h8', from: 0, to: 5000 }]);
    expect(r.steps).toBe(5000);
    expect(r.flags).toEqual(['day_step_cap:2026-11-23']);
  });
  test('console cap across users', () => {
    const r = P.planDayPayout({ ...base, hours: [hour(8, 6000)], userPaidSteps: 0, consolePaidSteps: 18000 }, cfg);
    expect(r.steps).toBe(2000);
    expect(r.flags).toEqual(['console_step_cap:2026-11-23']);
  });
  test('coin cap with live-session coins', () => {
    // 300 - 250 live - 10 (1000 pedometer steps) = 40 EXC = 4000 steps
    const r = P.planDayPayout({ ...base, hours: [hour(8, 6000), hour(9, 6000)], liveCoins: 250, userPaidSteps: 1000, consolePaidSteps: 1000 }, cfg);
    expect(r.steps).toBe(4000);
    expect(r.flags).toEqual(['coin_cap:2026-11-23']);
  });
  test('implausible day pays nothing and flags', () => {
    const r = P.planDayPayout({ ...base, hours: [hour(8, 6000)], implausible: true }, cfg);
    expect(r).toEqual({ payments: [], steps: 0, flags: ['implausible_day:2026-11-23'], flagDay: true });
  });
  test('previously flagged day stays unpaid', () => {
    const r = P.planDayPayout({ ...base, hours: [hour(8, 6000, 0, true), hour(9, 100)] }, cfg);
    expect(r.steps).toBe(0);
    expect(r.flagDay).toBe(true);
  });
});

describe('isNoMotion', () => {
  const pts = (vars) => vars.map(v => (v === undefined ? { stepsPerSecond: 2 } : { stepsPerSecond: 2, accelVariance: v }));
  test('no accelVariance -> not checked', () => {
    expect(P.isNoMotion(pts([undefined, undefined]))).toBe(false);
    expect(P.isNoMotion([])).toBe(false);
  });
  test('more than half still -> no motion', () => {
    expect(P.isNoMotion(pts([0, 0.0001, 0.2]))).toBe(true);
    expect(P.isNoMotion(pts([0, 0.2]))).toBe(false);
    expect(P.isNoMotion(pts([0.0005, 0.0005, 0]))).toBe(false);
  });
});
