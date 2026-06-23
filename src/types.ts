// Core domain types for Pood — kettlebell training PWA.

export type Unit = 'kg' | 'lb';

export type Experience = 'new' | 'returning' | 'experienced';

export type MovementPattern =
  | 'hinge'
  | 'squat'
  | 'press'
  | 'pull'
  | 'getup'
  | 'carry'
  | 'core'
  | 'mobility';

export type ExerciseCategory =
  | 'ballistic' // explosive, hip-driven (swings, cleans, snatch)
  | 'grind' // slow strength (squats, presses, get-ups)
  | 'mobility' // prep & joint health
  | 'core' // bracing & anti-rotation
  | 'carry' // loaded carries
  | 'complex'; // chained movements / flows

// Rough load guidance relative to the lifter's working bell.
export type LoadHint = 'light' | 'moderate' | 'heavy' | 'getup' | 'bodyweight';

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  pattern: MovementPattern;
  summary: string;
  // Coaching cues — the few things that matter most.
  cues: string[];
  // Common mistakes to self-check against.
  mistakes: string[];
  // Per-side movement (most unilateral work)?
  unilateral?: boolean;
  // The exercise this one progresses from (easier variant id).
  regressionOf?: string;
  // The exercise this one builds toward (harder variant id).
  progressionTo?: string;
}

// How a block of work is measured.
export type BlockMode =
  | 'reps' // straight sets x reps
  | 'time' // hold/work for a duration (seconds)
  | 'emom' // every minute on the minute
  | 'ladder' // ascending rep ladder (e.g. 1,2,3)
  | 'amrap' // as many quality reps as possible in a window
  | 'rounds'; // circuit rounds

export interface Block {
  exerciseId: string;
  mode: BlockMode;
  sets?: number; // number of sets / rounds
  reps?: number; // reps per set (or per side if exercise is unilateral)
  perSide?: boolean; // reps counted per side
  timeSec?: number; // for 'time'/'amrap'/'emom' window length
  restSec?: number; // rest between sets (seconds)
  ladder?: number[]; // explicit ladder rungs, e.g. [1,2,3]
  load: LoadHint;
  tempo?: string; // e.g. "3-1-1" or "slow"
  rpe?: number; // target effort 1-10
  note?: string; // short coaching note for this block
}

export type SessionType =
  | 'skill'
  | 'strength'
  | 'conditioning'
  | 'complex'
  | 'test'
  | 'recovery';

export interface Session {
  id: string; // e.g. "w1d1"
  week: number; // 1-8
  day: number; // ordinal within the week
  title: string;
  focus: string; // one-line focus
  type: SessionType;
  estMinutes: number;
  warmup: Block[];
  main: Block[];
  finisher?: Block[];
  notes?: string[];
}

export interface Week {
  number: number;
  title: string;
  theme: string;
  description: string;
  sessions: Session[];
}

// ---- User data (persisted) ----

export interface Profile {
  unit: Unit;
  // Bells the lifter owns, stored in kg internally.
  bells: number[];
  // Primary working bell (kg).
  workingBell: number;
  experience: Experience;
  daysPerWeek: number;
  soundOn: boolean;
  vibrateOn: boolean;
  // ISO date the user started week 1 (used for "today's session" hint).
  startedAt?: string;
  name?: string;
}

export interface SetEntry {
  blockIndex: number;
  exerciseId: string;
  reps?: number; // actual reps logged (total)
  loadKg?: number; // actual load used
  side?: 'L' | 'R';
}

export interface SessionLog {
  id: string; // uuid
  sessionId: string;
  date: string; // ISO timestamp
  durationSec: number;
  totalReps: number;
  totalSwings: number;
  volumeKg: number; // sum(load * reps) over loaded reps
  rpe?: number;
  notes?: string;
  // Per-block completion flags captured during the session.
  completedBlocks: number[];
}

export interface AppData {
  version: number;
  profile: Profile;
  logs: SessionLog[];
  // Manual notes keyed by sessionId.
  sessionNotes: Record<string, string>;
  onboarded: boolean;
}
