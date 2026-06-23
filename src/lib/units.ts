import type { LoadHint, Profile, Unit } from '../types';

const KG_PER_LB = 0.45359237;

export function kgToLb(kg: number): number {
  return kg / KG_PER_LB;
}

export function lbToKg(lb: number): number {
  return lb * KG_PER_LB;
}

// Display a kg value in the user's preferred unit, rounded sensibly.
export function formatWeight(kg: number, unit: Unit, withUnit = true): string {
  if (kg <= 0) return withUnit ? 'bodyweight' : '0';
  const value = unit === 'kg' ? kg : kgToLb(kg);
  const rounded = Math.round(value);
  return withUnit ? `${rounded} ${unit}` : `${rounded}`;
}

// Common kettlebell sizes, in kg. Used to seed the picker.
export const COMMON_BELLS_KG = [8, 12, 16, 20, 24, 28, 32, 40];

// Default starting bells by experience.
export function defaultBells(experience: Profile['experience']): {
  bells: number[];
  working: number;
} {
  switch (experience) {
    case 'new':
      return { bells: [8, 12, 16], working: 12 };
    case 'returning':
      return { bells: [12, 16, 20, 24], working: 16 };
    case 'experienced':
      return { bells: [16, 20, 24, 28, 32], working: 24 };
  }
}

// Pick the owned bell nearest to a target weight.
function nearestBell(targetKg: number, bells: number[]): number {
  if (bells.length === 0) return targetKg;
  return bells.reduce((best, b) =>
    Math.abs(b - targetKg) < Math.abs(best - targetKg) ? b : best,
  );
}

// Resolve a relative load hint into a concrete suggested weight (kg) using the
// lifter's working bell and what they actually own.
export function resolveLoadKg(load: LoadHint, profile: Profile): number {
  if (load === 'bodyweight') return 0;
  const { workingBell, bells } = profile;
  const sorted = [...bells].sort((a, b) => a - b);
  const idx = sorted.indexOf(nearestBell(workingBell, sorted));

  switch (load) {
    case 'light': {
      // One size down from working, if available.
      const lighter = idx > 0 ? sorted[idx - 1] : Math.round(workingBell * 0.6);
      return nearestBell(lighter, sorted);
    }
    case 'moderate':
      return nearestBell(workingBell, sorted);
    case 'heavy': {
      const heavier = idx < sorted.length - 1 ? sorted[idx + 1] : Math.round(workingBell * 1.25);
      return nearestBell(heavier, sorted);
    }
    case 'getup':
      // Get-ups start conservative; the working bell is plenty.
      return nearestBell(workingBell, sorted);
  }
}

export const LOAD_LABEL: Record<LoadHint, string> = {
  light: 'Light',
  moderate: 'Working',
  heavy: 'Heavy',
  getup: 'Get-up',
  bodyweight: 'Bodyweight',
};
