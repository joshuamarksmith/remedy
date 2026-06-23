import type { AppData, SessionLog } from '../types';
import { ALL_SESSIONS, PROGRAM, TOTAL_SESSIONS } from '../data/program';

export interface Stats {
  sessionsDone: number;
  totalSessions: number;
  totalSwings: number;
  totalReps: number;
  totalVolumeKg: number;
  streakDays: number;
  uniqueSessionIds: Set<string>;
  weekProgress: { week: number; done: number; total: number }[];
}

// Most recent log per sessionId — a session counts as "done" once logged.
export function completedSessionIds(data: AppData): Set<string> {
  return new Set(data.logs.map((l) => l.sessionId));
}

function localDayKey(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-CA'); // YYYY-MM-DD local
}

// Count consecutive days (ending today or yesterday) with at least one log.
export function computeStreak(logs: SessionLog[]): number {
  if (logs.length === 0) return 0;
  const days = new Set(logs.map((l) => localDayKey(l.date)));
  let streak = 0;
  const cursor = new Date();
  // Allow the streak to "hold" if they haven't trained yet today.
  if (!days.has(cursor.toLocaleDateString('en-CA'))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (days.has(cursor.toLocaleDateString('en-CA'))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function computeStats(data: AppData): Stats {
  const unique = completedSessionIds(data);
  const totals = data.logs.reduce(
    (acc, l) => {
      acc.swings += l.totalSwings;
      acc.reps += l.totalReps;
      acc.volume += l.volumeKg;
      return acc;
    },
    { swings: 0, reps: 0, volume: 0 },
  );

  const weekProgress = PROGRAM.map((w) => ({
    week: w.number,
    done: w.sessions.filter((s) => unique.has(s.id)).length,
    total: w.sessions.length,
  }));

  return {
    sessionsDone: unique.size,
    totalSessions: TOTAL_SESSIONS,
    totalSwings: totals.swings,
    totalReps: totals.reps,
    totalVolumeKg: Math.round(totals.volume),
    streakDays: computeStreak(data.logs),
    uniqueSessionIds: unique,
    weekProgress,
  };
}

// The next session the lifter should tackle: first incomplete in program order,
// or, if all done, the last session (so they can repeat / re-test).
export function nextSession(data: AppData): string {
  const done = completedSessionIds(data);
  const next = ALL_SESSIONS.find((s) => !done.has(s.id));
  return next ? next.id : ALL_SESSIONS[ALL_SESSIONS.length - 1].id;
}

// Which week is "current" — the week of the next session.
export function currentWeek(data: AppData): number {
  const id = nextSession(data);
  const s = ALL_SESSIONS.find((x) => x.id === id);
  return s ? s.week : 1;
}

export function lastLogFor(data: AppData, sessionId: string): SessionLog | undefined {
  return [...data.logs].reverse().find((l) => l.sessionId === sessionId);
}
