// BAC Calculation Engine
// Based on Widmark Formula + REM sleep impact research
// Sources: Gardiner et al. 2024, Ebrahim et al. 2013, Colrain et al. 2014

import { BAC_THRESHOLD_DANGER, type SleepQuality } from './theme';

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
  soberAtTimestamp: number;
  remReductionMinutes: number;
  remPercentReduction: number;
  sleepQuality: SleepQuality;
  /** Timestamp when REM loss drops below 10 minutes (practical "okay to sleep" time) */
  lowImpactAtTimestamp: number;
  timeToLowImpactMs: number;
}

// Constants
const ETHANOL_PER_STANDARD_DRINK_G = 14; // grams
const ELIMINATION_RATE = 0.015; // g/dL per hour
const WIDMARK_R_MALE = 0.68;
const WIDMARK_R_FEMALE = 0.55;
const REM_REDUCTION_COEFFICIENT = 40.4; // minutes per g/kg dose (Gardiner 2024)
const BASELINE_REM_MINUTES = 96; // ~20-25% of 8h sleep (Ohayon et al. 2004)

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
 * Find the most relevant bedtime occurrence relative to now.
 *
 * If you're within 4 hours after bedtime (stayed up late / crossed midnight),
 * uses that recent bedtime. Otherwise uses the next upcoming one.
 */
function nextBedtime(bedtime: string): number {
  const [h, m] = bedtime.split(':').map(Number);
  const now = Date.now();
  const fourHoursMs = 4 * 60 * 60 * 1000;

  // Generate yesterday, today, and tomorrow's bedtime
  const base = new Date(now);
  const candidates: number[] = [];
  for (const offset of [-1, 0, 1]) {
    const bed = new Date(base);
    bed.setDate(bed.getDate() + offset);
    bed.setHours(h, m, 0, 0);
    candidates.push(bed.getTime());
  }

  // Priority 1: recently-passed bedtime (within 4h) — you stayed up past it
  for (let i = candidates.length - 1; i >= 0; i--) {
    const ts = candidates[i];
    if (ts <= now && now - ts <= fourHoursMs) return ts;
  }

  // Priority 2: nearest upcoming bedtime
  for (const ts of candidates) {
    if (ts > now) return ts;
  }

  return candidates[2]; // fallback
}

/** BAC threshold below which REM loss is < 10 minutes */
const LOW_IMPACT_REM_MINUTES = 10;

function lowImpactBACThreshold(sex: 'male' | 'female'): number {
  const r = sex === 'male' ? WIDMARK_R_MALE : WIDMARK_R_FEMALE;
  // REM loss = REM_REDUCTION_COEFFICIENT * BAC * r * 10 < LOW_IMPACT_REM_MINUTES
  return LOW_IMPACT_REM_MINUTES / (REM_REDUCTION_COEFFICIENT * r * 10);
}

/**
 * Find when BAC drops to a given threshold (binary search).
 */
function findBACThresholdTime(
  drinks: Drink[],
  profile: UserProfile,
  threshold: number
): number {
  const now = Date.now();
  const currentBAC = calculateBAC(drinks, profile, now);
  if (currentBAC <= threshold) return now;

  const hoursToThreshold = (currentBAC - threshold) / ELIMINATION_RATE;
  let low = now;
  let high = now + (hoursToThreshold + 2) * 60 * 60 * 1000;

  while (high - low > 60000) {
    const mid = (low + high) / 2;
    if (calculateBAC(drinks, profile, mid) > threshold) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return high;
}

/**
 * Derive effective remaining dose (g/kg) from a BAC value.
 * Inverse of Widmark: BAC = (alcoholG / (weightG * r)) * 100
 * So alcoholG = BAC * weightKg * r * 10, and dose g/kg = BAC * r * 10.
 */
function effectiveDoseGPerKg(bac: number, sex: 'male' | 'female'): number {
  const r = sex === 'male' ? WIDMARK_R_MALE : WIDMARK_R_FEMALE;
  return bac * r * 10;
}

/**
 * Calculate REM reduction from an effective dose.
 */
function remImpact(doseGPerKg: number): { minutes: number; percent: number } {
  if (doseGPerKg < 0.001) return { minutes: 0, percent: 0 };
  const minutes = REM_REDUCTION_COEFFICIENT * doseGPerKg;
  const percent = Math.min(100, (minutes / BASELINE_REM_MINUTES) * 100);
  return { minutes, percent };
}

/**
 * Calculate the full BAC state including REM impact.
 *
 * REM impact is based on the alcohol still in your system, not total consumed.
 * Sleep quality reflects BAC at your configured bedtime — if BAC will be below
 * the low-impact threshold by bedtime, REM sleep is safe regardless of earlier drinking.
 * Note: "safe" means minimal REM impact, NOT that BAC has reached zero.
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

  // Sleep quality + REM impact: based on BAC at bedtime
  // If bedtime already passed (you stayed up late), use now — you could sleep any moment
  const bedtimeTs = nextBedtime(profile.bedtime);
  const effectiveBedtime = Math.max(bedtimeTs, now);
  const bacAtBedtime = calculateBAC(allDrinks, profile, effectiveBedtime);
  const bedtimeDose = effectiveDoseGPerKg(bacAtBedtime, profile.sex);
  const { minutes: remReductionMinutes, percent: remPercentReduction } = remImpact(bedtimeDose);

  // Find "low impact" time — when REM loss drops below 10 minutes
  const lowImpactThreshold = lowImpactBACThreshold(profile.sex);
  const lowImpactAtTimestamp = currentBAC > lowImpactThreshold
    ? findBACThresholdTime(allDrinks, profile, lowImpactThreshold)
    : now;
  const timeToLowImpactMs = Math.max(0, lowImpactAtTimestamp - now);

  let sleepQuality: SleepQuality = 'safe';
  if (lowImpactAtTimestamp > effectiveBedtime) {
    // REM will still be meaningfully impacted at bedtime — severity based on BAC
    sleepQuality = bacAtBedtime > BAC_THRESHOLD_DANGER ? 'danger' : 'caution';
  }

  return {
    currentBAC,
    peakBAC,
    timeToSoberMs,
    soberAtTimestamp,
    remReductionMinutes,
    remPercentReduction,
    sleepQuality,
    lowImpactAtTimestamp,
    timeToLowImpactMs,
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

  const now = Date.now();
  const start = startTime ?? Math.min(...drinks.map((d) => d.timestamp)) - 15 * 60 * 1000;
  const soberTime = findSoberTime(drinks, profile);
  const maxEnd = start + 16 * 60 * 60 * 1000; // cap at 16 hours from start
  const naturalEnd = soberTime + 60 * 60 * 1000;
  const end = endTime ?? Math.min(naturalEnd, Math.max(maxEnd, now + 2 * 60 * 60 * 1000));

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
