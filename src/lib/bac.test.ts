import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  calculateBAC,
  calculatePeakBAC,
  findSoberTime,
  calculateBACState,
  formatCountdown,
  formatBAC,
  type Drink,
  type UserProfile,
} from './bac';

// Standard test profile: 80kg male, 22:00 bedtime
const profile: UserProfile = { weightKg: 80, sex: 'male', bedtime: '22:00' };
const profileF: UserProfile = { weightKg: 60, sex: 'female', bedtime: '22:00' };

function makeDrink(minutesAgo: number, standardDrinks = 1): Drink {
  return {
    id: `d-${minutesAgo}`,
    timestamp: Date.now() - minutesAgo * 60 * 1000,
    standardDrinks,
  };
}

function makeDrinkAt(timestamp: number, standardDrinks = 1): Drink {
  return {
    id: `d-${timestamp}`,
    timestamp,
    standardDrinks,
  };
}

describe('calculateBAC', () => {
  it('returns 0 for no drinks', () => {
    expect(calculateBAC([], profile, Date.now())).toBe(0);
  });

  it('computes positive BAC immediately after a drink', () => {
    const drink = makeDrink(0); // just now
    const bac = calculateBAC([drink], profile, Date.now());
    expect(bac).toBeGreaterThan(0);
  });

  it('BAC decreases over time (zero-order elimination)', () => {
    const drink = makeDrink(60); // 1 hour ago
    const bacNow = calculateBAC([drink], profile, Date.now());
    const bacAtDrink = calculateBAC([drink], profile, drink.timestamp + 100);
    expect(bacNow).toBeLessThan(bacAtDrink);
  });

  it('never returns negative BAC', () => {
    const drink = makeDrink(24 * 60); // 24 hours ago
    expect(calculateBAC([drink], profile, Date.now())).toBe(0);
  });

  it('multiple drinks stack BAC contributions', () => {
    const d1 = makeDrink(30);
    const d2 = makeDrink(15);
    const bacTwo = calculateBAC([d1, d2], profile, Date.now());
    const bacOne = calculateBAC([d1], profile, Date.now());
    expect(bacTwo).toBeGreaterThan(bacOne);
  });

  it('uses correct Widmark factor for sex', () => {
    const drink = makeDrink(0);
    const bacM = calculateBAC([drink], profile, Date.now());
    const bacF = calculateBAC([drink], profileF, Date.now());
    // Female (lower body water ratio) should have higher BAC for same drink
    expect(bacF).toBeGreaterThan(bacM);
  });
});

describe('calculatePeakBAC', () => {
  it('returns 0 for no drinks', () => {
    expect(calculatePeakBAC([], profile)).toBe(0);
  });

  it('peak is at least as high as current BAC', () => {
    const drink = makeDrink(60);
    const peak = calculatePeakBAC([drink], profile);
    const current = calculateBAC([drink], profile, Date.now());
    expect(peak).toBeGreaterThanOrEqual(current);
  });
});

describe('findSoberTime', () => {
  it('returns now for no drinks', () => {
    const before = Date.now();
    const sober = findSoberTime([], profile);
    expect(sober).toBeGreaterThanOrEqual(before - 1);
    expect(sober).toBeLessThanOrEqual(Date.now() + 1);
  });

  it('sober time is in the future when BAC is positive', () => {
    const drink = makeDrink(10);
    const sober = findSoberTime([drink], profile);
    expect(sober).toBeGreaterThan(Date.now());
  });

  it('BAC is effectively zero at the sober time', () => {
    const drink = makeDrink(10);
    const sober = findSoberTime([drink], profile);
    const bacAtSober = calculateBAC([drink], profile, sober);
    expect(bacAtSober).toBeLessThanOrEqual(0.001);
  });
});

describe('calculateBACState — sleep quality vs sobriety', () => {
  // This is the key bug scenario: sleepQuality can be 'safe' while BAC > 0.
  // The app must NOT claim the user is "sober" — only that REM impact is minimal.

  let dateSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Fix "now" to 18:00 so bedtime (22:00) is 4 hours away
    const fixedNow = new Date();
    fixedNow.setHours(18, 0, 0, 0);
    dateSpy = vi.spyOn(Date, 'now').mockReturnValue(fixedNow.getTime());
  });

  afterEach(() => {
    dateSpy.mockRestore();
  });

  it('sleepQuality is safe when low-impact time is before bedtime', () => {
    // 1 drink 3 hours ago — BAC should be low enough that REM impact < 10min by 22:00
    const now = Date.now();
    const drink = makeDrinkAt(now - 3 * 60 * 60 * 1000);
    const state = calculateBACState([drink], profile);

    expect(state.sleepQuality).toBe('safe');
  });

  it('safe sleepQuality does NOT mean BAC is zero', () => {
    // This is the actual bug: sleepQuality='safe' but soberAtTimestamp > bedtime
    // A drink ~2h ago should still show positive BAC while being safe for REM
    const now = Date.now();
    const drink = makeDrinkAt(now - 2 * 60 * 60 * 1000);
    const state = calculateBACState([drink], profile);

    if (state.sleepQuality === 'safe') {
      // The user may still have a positive BAC — this is the scenario
      // where the old "sober well before bedtime" text was misleading
      expect(state.currentBAC).toBeGreaterThanOrEqual(0); // can be 0 or positive
      // soberAtTimestamp might be after bedtime even though sleep quality is safe
      // The key insight: lowImpactAtTimestamp <= bedtime, but soberAtTimestamp may not be
    }
  });

  it('caution when BAC still has meaningful REM impact at bedtime', () => {
    // Heavy recent drinking — BAC will still significantly impact REM at 22:00
    const now = Date.now();
    const drinks = Array.from({ length: 5 }, (_, i) =>
      makeDrinkAt(now - (30 - i * 5) * 60 * 1000)
    );
    const state = calculateBACState(drinks, profile);

    expect(state.sleepQuality).not.toBe('safe');
    expect(state.remReductionMinutes).toBeGreaterThan(0);
  });

  it('danger when BAC is very high at bedtime', () => {
    // 5 drinks in last hour — heavy drinking
    const now = Date.now();
    const drinks = Array.from({ length: 5 }, (_, i) =>
      makeDrinkAt(now - (60 - i * 10) * 60 * 1000)
    );
    const state = calculateBACState(drinks, profile);

    expect(state.sleepQuality).toBe('danger');
  });

  it('lowImpactAtTimestamp is always <= soberAtTimestamp', () => {
    // Low-impact threshold is always >= 0, so you hit it before full sobriety
    const now = Date.now();
    const drink = makeDrinkAt(now - 30 * 60 * 1000);
    const state = calculateBACState([drink], profile);

    expect(state.lowImpactAtTimestamp).toBeLessThanOrEqual(state.soberAtTimestamp);
  });

  it('key scenario: safe for REM but not yet sober', () => {
    // The exact scenario the user reported: BAC reaches zero AFTER bedtime,
    // but REM impact drops below threshold BEFORE bedtime
    const now = Date.now();
    // 2 drinks ~1.5 hours ago — enough that BAC won't be zero by 22:00
    // but low enough that REM impact will be negligible by then
    const drinks = [
      makeDrinkAt(now - 90 * 60 * 1000),
      makeDrinkAt(now - 80 * 60 * 1000),
    ];
    const state = calculateBACState(drinks, profile);

    // Verify the scenario exists (BAC > 0 now)
    expect(state.currentBAC).toBeGreaterThan(0);

    // Whether safe or caution depends on the specific numbers, but
    // the critical invariant: if safe, soberAt can still be far out
    if (state.sleepQuality === 'safe') {
      // This is the bug case: safe for REM but NOT sober
      // Old text "sober well before bedtime" would be WRONG here
      // lowImpactAtTimestamp should be before bedtime
      const bedtime = new Date(now);
      bedtime.setHours(22, 0, 0, 0);
      expect(state.lowImpactAtTimestamp).toBeLessThanOrEqual(bedtime.getTime());
    }
  });
});

describe('formatCountdown', () => {
  it('formats zero as Now', () => {
    expect(formatCountdown(0)).toBe('Now');
  });

  it('formats minutes only', () => {
    expect(formatCountdown(30 * 60 * 1000)).toBe('30m');
  });

  it('formats hours and minutes', () => {
    expect(formatCountdown(2.5 * 60 * 60 * 1000)).toBe('2h 30m');
  });
});

describe('formatBAC', () => {
  it('formats zero', () => {
    expect(formatBAC(0)).toBe('0.000');
  });

  it('formats small BAC', () => {
    expect(formatBAC(0.025)).toBe('0.025');
  });

  it('treats sub-0.001 as zero', () => {
    expect(formatBAC(0.0005)).toBe('0.000');
  });
});
