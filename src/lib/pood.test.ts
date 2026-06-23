import { describe, it, expect } from 'vitest';
import type { AppData, Block, Profile, SessionLog } from '../types';
import { resolveLoadKg, formatWeight, kgToLb, lbToKg, defaultBells } from './units';
import { describeBlock, estimateBlock, setCount, fmtDur, clock } from './blocks';
import { computeStreak, computeStats, nextSession } from './progress';
import { parseImport, buildExport, DEFAULT_PROFILE } from './storage';

const profile: Profile = {
  unit: 'kg',
  bells: [12, 16, 20, 24],
  workingBell: 16,
  experience: 'returning',
  daysPerWeek: 3,
  soundOn: true,
  vibrateOn: true,
};

describe('units', () => {
  it('converts kg and lb round-trip', () => {
    expect(Math.round(kgToLb(16))).toBe(35);
    expect(Math.round(lbToKg(kgToLb(24)))).toBe(24);
  });

  it('formats weights with units', () => {
    expect(formatWeight(16, 'kg')).toBe('16 kg');
    expect(formatWeight(16, 'lb')).toBe('35 lb');
    expect(formatWeight(0, 'kg')).toBe('bodyweight');
  });

  it('resolves load hints against owned bells', () => {
    expect(resolveLoadKg('moderate', profile)).toBe(16);
    expect(resolveLoadKg('light', profile)).toBe(12); // one down
    expect(resolveLoadKg('heavy', profile)).toBe(20); // one up
    expect(resolveLoadKg('bodyweight', profile)).toBe(0);
  });

  it('gives sensible default bells per experience', () => {
    expect(defaultBells('new').working).toBeLessThan(defaultBells('experienced').working);
  });
});

describe('blocks', () => {
  const swing: Block = { exerciseId: 'two-hand-swing', mode: 'reps', sets: 5, reps: 10, load: 'moderate' };
  const press: Block = { exerciseId: 'strict-press', mode: 'reps', sets: 4, reps: 5, perSide: true, load: 'heavy' };

  it('counts sets', () => {
    expect(setCount(swing)).toBe(5);
    expect(setCount({ ...swing, sets: undefined })).toBe(1);
  });

  it('describes a block', () => {
    expect(describeBlock(swing).primary).toBe('5 × 10');
    expect(describeBlock(press).primary).toBe('4 × 5 / side');
  });

  it('estimates work, swings, and volume', () => {
    const est = estimateBlock(swing, 16);
    expect(est.reps).toBe(50);
    expect(est.swings).toBe(50);
    expect(est.volumeKg).toBe(800);

    const pressEst = estimateBlock(press, 20);
    expect(pressEst.reps).toBe(40); // 4 x 5 x 2 sides
    expect(pressEst.swings).toBe(0);
    expect(pressEst.volumeKg).toBe(800);
  });

  it('formats durations', () => {
    expect(fmtDur(45)).toBe('45s');
    expect(fmtDur(90)).toBe('1:30');
    expect(clock(75)).toBe('1:15');
  });
});

function makeData(logs: SessionLog[]): AppData {
  return { version: 1, profile, logs, sessionNotes: {}, onboarded: true };
}

function log(sessionId: string, daysAgo: number, extra: Partial<SessionLog> = {}): SessionLog {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return {
    id: `${sessionId}-${daysAgo}`,
    sessionId,
    date: d.toISOString(),
    durationSec: 1800,
    totalReps: 100,
    totalSwings: 80,
    volumeKg: 1600,
    completedBlocks: [0, 1],
    ...extra,
  };
}

describe('progress', () => {
  it('computes a streak of consecutive days', () => {
    expect(computeStreak([log('w1d1', 0), log('w1d2', 1), log('w1d3', 2)])).toBe(3);
    expect(computeStreak([log('w1d1', 0), log('w1d3', 5)])).toBe(1);
    expect(computeStreak([])).toBe(0);
  });

  it('aggregates stats', () => {
    const data = makeData([log('w1d1', 1), log('w1d2', 0)]);
    const stats = computeStats(data);
    expect(stats.sessionsDone).toBe(2);
    expect(stats.totalSwings).toBe(160);
    expect(stats.totalVolumeKg).toBe(3200);
  });

  it('points at the first incomplete session', () => {
    expect(nextSession(makeData([]))).toBe('w1d1');
    expect(nextSession(makeData([log('w1d1', 0)]))).toBe('w1d2');
  });
});

describe('backup round-trip', () => {
  it('exports and re-imports without losing data', () => {
    const data = makeData([log('w1d1', 0)]);
    const file = buildExport(data);
    const res = parseImport(JSON.stringify(file));
    expect(res.ok).toBe(true);
    expect(res.data?.logs.length).toBe(1);
    expect(res.data?.profile.workingBell).toBe(16);
  });

  it('accepts a bare AppData object too', () => {
    const res = parseImport(JSON.stringify(makeData([])));
    expect(res.ok).toBe(true);
  });

  it('rejects junk', () => {
    expect(parseImport('not json').ok).toBe(false);
    expect(parseImport('12345').ok).toBe(false);
  });

  it('has a usable default profile', () => {
    expect(DEFAULT_PROFILE.bells.length).toBeGreaterThan(0);
  });
});
