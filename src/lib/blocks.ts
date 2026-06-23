import type { Block } from '../types';
import { getExercise } from '../data/exercises';

// Number of discrete "steps" the player walks through for a block.
export function setCount(block: Block): number {
  return Math.max(1, block.sets ?? 1);
}

// Is this a timed work period (vs. a count-the-reps set)?
export function isTimed(block: Block): boolean {
  return block.mode === 'time' || block.mode === 'emom' || block.mode === 'amrap';
}

// Human-readable prescription, split into a bold primary line and a sub-line.
export function describeBlock(block: Block): { primary: string; sub: string } {
  const ex = getExercise(block.exerciseId);
  const side = block.perSide ? ' / side' : '';
  let primary = '';
  switch (block.mode) {
    case 'reps':
      primary = `${block.sets} × ${block.reps}${side}`;
      break;
    case 'ladder':
      primary = `${block.sets} × (${(block.ladder ?? []).join('·')})${side}`;
      break;
    case 'emom':
      primary = `EMOM ${block.sets} · ${block.reps}${side}`;
      break;
    case 'time':
      primary = `${block.sets} × ${fmtDur(block.timeSec ?? 0)}${side}`;
      break;
    case 'amrap':
      primary = `${fmtDur(block.timeSec ?? 0)} AMRAP`;
      break;
    case 'rounds':
      primary = `${block.sets} rounds`;
      break;
  }
  const parts: string[] = [];
  if (block.tempo) parts.push(`tempo ${block.tempo}`);
  if (block.restSec && block.mode !== 'emom') parts.push(`rest ${fmtDur(block.restSec)}`);
  if (block.rpe) parts.push(`RPE ${block.rpe}`);
  return { primary, sub: parts.join(' · ') || ex.category };
}

export function fmtDur(sec: number): string {
  if (sec <= 0) return '0s';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}m`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function clock(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// Estimate the work done for a fully-completed block (for logging).
export function estimateBlock(block: Block, loadKg: number): {
  reps: number;
  swings: number;
  volumeKg: number;
} {
  const ex = getExercise(block.exerciseId);
  const sides = block.perSide ? 2 : 1;
  let reps = 0;
  switch (block.mode) {
    case 'reps':
    case 'emom':
      reps = (block.sets ?? 1) * (block.reps ?? 0) * sides;
      break;
    case 'ladder':
      reps = (block.sets ?? 1) * (block.ladder ?? []).reduce((a, b) => a + b, 0) * sides;
      break;
    case 'amrap':
      reps = (block.reps ?? 0) * sides; // a planned target; user can edit later
      break;
    case 'time':
    case 'rounds':
      reps = 0;
      break;
  }
  const isSwing = ex.id.includes('swing') || ex.id === 'snatch' || ex.id === 'high-pull';
  const swings = isSwing ? reps : 0;
  const volumeKg = loadKg > 0 ? reps * loadKg : 0;
  return { reps, swings, volumeKg };
}
