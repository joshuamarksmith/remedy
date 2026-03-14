// BAC Calculation Engine
// Based on Widmark Formula + REM sleep impact research
// Sources: Gardiner et al. 2024, Ebrahim et al. 2013, Colrain et al. 2014

import { BAC_THRESHOLD_CAUTION, BAC_THRESHOLD_DANGER, REM_SAFE_BUFFER_MS, type SleepQuality } from './theme';

export interface Drink {
  id: string;
  timestamp: number; // unix ms
  standardDrinks: number; // number of standard drinks (1.0 = default)
}

export interface UserProfile {
  weightKg: number;
  sex: 'male' | 'female';
  bedtime: string; // HH:MM format
}

export interface BACState {
  currentBAC: number;
  peakBAC: number;
  timeToSoberMs: number;
  timeToREMSafeMs: number;
  soberAtTimestamp: number;
  remSafeAtTimestamp: number;
  remReductionMinutes: number;
  remPercentReduction: number;
  sleepQuality: SleepQuality;
}

// Constants
const ETHANOL_PER_STANDARD_DRINK_G = 14; // grams
const ELIMINATION_RATE = 0.015; // g/dL per hour
const WIDMARK_R_MALE = 0.68;
const WIDMARK_R_FEMALE = 0.55;
const REM_REDUCTION_COEFFICIENT = 40.4; // minutes per g/kg dose (Gardiner 2024)

/**
 * Calculate BAC at a given time using zero-order elimination.
 *
 * Alcohol elimination is constant-rate (~0.015 g/dL/hr) regardless of
 * how much is in the system. We simulate forward chronologically:
 * between each drink event, BAC decreases linearly (clamped to 0),
 * then the new drink's Widmark contribution is added.
 */
export function calculateBAC(
  drinks: Drink[],
  profile: UserProfile,
  atTime: number = Date.now()
): number {
  // Filter and sort drinks up to atTime
  const relevant = drinks
    .filter((d) => d.timestamp <= atTime)
    .sort((a, b) => a.timestamp - b.timestamp);

  if (relevant.length === 0) return 0;

  const r = profile.sex === 'male' ? WIDMARK_R_MALE : WIDMARK_R_FEMALE;
  const bodyWeightG = profile.weightKg * 1000;

  let bac = 0;
  let lastTime = relevant[0].timestamp;

  for (const drink of relevant) {
    // Eliminate between last event and this drink
    const hoursElapsed = (drink.timestamp - lastTime) / (1000 * 60 * 60);
    bac = Math.max(0, bac - ELIMINATION_RATE * hoursElapsed);
    lastTime = drink.timestamp;

    // Add this drink's Widmark contribution
    const alcoholGrams = drink.standardDrinks * ETHANOL_PER_STANDARD_DRINK_G;
    bac += (alcoholGrams / (bodyWeightG * r)) * 100;
  }

  // Eliminate from last drink to atTime
  const finalHours = (atTime - lastTime) / (1000 * 60 * 60);
  bac = Math.max(0, bac - ELIMINATION_RATE * finalHours);

  return bac;
}

/**
 * Calculate peak BAC (at the time of the last drink).
 */
export function calculatePeakBAC(drinks: Drink[], profile: UserProfile): number {
  if (drinks.length === 0) return 0;
  const lastDrinkTime = Math.max(...drinks.map((d) => d.timestamp));
  return calculateBAC(drinks, profile, lastDrinkTime);
}

/**
 * Find when BAC will reach zero by binary search.
 */
export function findSoberTime(drinks: Drink[], profile: UserProfile): number {
  if (drinks.length === 0) return Date.now();

  const now = Date.now();
  const currentBAC = calculateBAC(drinks, profile, now);
  if (currentBAC <= 0) return now;

  const estimatedHours = currentBAC / ELIMINATION_RATE;
  let low = now;
  let high = now + (estimatedHours + 2) * 60 * 60 * 1000;

  while (high - low > 60000) {
    const mid = (low + high) / 2;
    if (calculateBAC(drinks, profile, mid) > 0.001) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return high;
}

/**
 * Calculate the full BAC state including REM impact.
 */
export function calculateBACState(
  drinks: Drink[],
  profile: UserProfile,
  hypotheticalDrinks: Drink[] = []
): BACState {
  const allDrinks = [...drinks, ...hypotheticalDrinks];
  const now = Date.now();

  const currentBAC = calculateBAC(allDrinks, profile, now);
  const peakBAC = calculatePeakBAC(allDrinks, profile);
  const soberAtTimestamp = findSoberTime(allDrinks, profile);
  const timeToSoberMs = Math.max(0, soberAtTimestamp - now);

  const remSafeAtTimestamp = soberAtTimestamp + REM_SAFE_BUFFER_MS;
  const timeToREMSafeMs = Math.max(0, remSafeAtTimestamp - now);

  // REM impact (Gardiner 2024 meta-analysis)
  const totalAlcoholG = allDrinks.reduce(
    (sum, d) => sum + d.standardDrinks * ETHANOL_PER_STANDARD_DRINK_G,
    0
  );
  const doseGPerKg = totalAlcoholG / profile.weightKg;
  const remReductionMinutes = currentBAC > 0.001 ? REM_REDUCTION_COEFFICIENT * doseGPerKg : 0;
  const remPercentReduction = currentBAC > 0.001 ? 2.8 * (doseGPerKg / 0.75) : 0;

  let sleepQuality: SleepQuality = 'safe';
  if (currentBAC > BAC_THRESHOLD_DANGER) {
    sleepQuality = 'danger';
  } else if (currentBAC > BAC_THRESHOLD_CAUTION) {
    sleepQuality = 'caution';
  }

  return {
    currentBAC,
    peakBAC,
    timeToSoberMs,
    timeToREMSafeMs,
    soberAtTimestamp,
    remSafeAtTimestamp,
    remReductionMinutes,
    remPercentReduction,
    sleepQuality,
  };
}

/**
 * Generate BAC curve data points for charting.
 */
export function generateBACCurve(
  drinks: Drink[],
  profile: UserProfile,
  startTime?: number,
  endTime?: number,
  intervalMinutes: number = 5
): { time: number; bac: number }[] {
  if (drinks.length === 0) return [];

  const start = startTime ?? Math.min(...drinks.map((d) => d.timestamp)) - 15 * 60 * 1000;
  const soberTime = findSoberTime(drinks, profile);
  const end = endTime ?? soberTime + 60 * 60 * 1000;

  const points: { time: number; bac: number }[] = [];
  for (let t = start; t <= end; t += intervalMinutes * 60 * 1000) {
    points.push({ time: t, bac: calculateBAC(drinks, profile, t) });
  }

  return points;
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return 'Now';
  const totalMinutes = Math.ceil(ms / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

export function formatBAC(bac: number): string {
  if (bac < 0.001) return '0.000';
  return bac.toFixed(3);
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
