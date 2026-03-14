// BAC Calculation Engine
// Based on Widmark Formula + REM sleep impact research
// Sources: Gardiner et al. 2024, Ebrahim et al. 2013, Colrain et al. 2014

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
  sleepQuality: 'green' | 'yellow' | 'red';
}

// Constants
const ETHANOL_PER_STANDARD_DRINK_G = 14; // grams
const ELIMINATION_RATE = 0.015; // g/dL per hour
const WIDMARK_R_MALE = 0.68;
const WIDMARK_R_FEMALE = 0.55;
const REM_SAFE_BUFFER_HOURS = 1; // hours after BAC=0 for clean REM
const REM_REDUCTION_COEFFICIENT = 40.4; // minutes per g/kg dose (Gardiner 2024)

/**
 * Calculate current BAC given a list of drinks and user profile.
 * Each drink is metabolized independently from its consumption time.
 */
export function calculateBAC(
  drinks: Drink[],
  profile: UserProfile,
  atTime: number = Date.now()
): number {
  const r = profile.sex === 'male' ? WIDMARK_R_MALE : WIDMARK_R_FEMALE;
  const bodyWeightG = profile.weightKg * 1000;

  let totalBAC = 0;

  for (const drink of drinks) {
    if (drink.timestamp > atTime) continue; // future drink (hypothetical not yet counted)

    const hoursElapsed = (atTime - drink.timestamp) / (1000 * 60 * 60);
    const alcoholGrams = drink.standardDrinks * ETHANOL_PER_STANDARD_DRINK_G;

    // Widmark: BAC contribution from this drink
    const bacFromDrink = (alcoholGrams / (bodyWeightG * r)) * 100;
    // Subtract elimination over time
    const bacAfterElimination = bacFromDrink - ELIMINATION_RATE * hoursElapsed;

    totalBAC += Math.max(0, bacAfterElimination);
  }

  return Math.max(0, totalBAC);
}

/**
 * Calculate peak BAC from all drinks (the max BAC that was reached).
 */
export function calculatePeakBAC(drinks: Drink[], profile: UserProfile): number {
  if (drinks.length === 0) return 0;

  const r = profile.sex === 'male' ? WIDMARK_R_MALE : WIDMARK_R_FEMALE;
  const bodyWeightG = profile.weightKg * 1000;

  // Peak BAC occurs at the time of the last drink (approximately)
  const lastDrinkTime = Math.max(...drinks.map((d) => d.timestamp));

  let totalBAC = 0;
  for (const drink of drinks) {
    if (drink.timestamp > lastDrinkTime) continue;
    const hoursElapsed = (lastDrinkTime - drink.timestamp) / (1000 * 60 * 60);
    const alcoholGrams = drink.standardDrinks * ETHANOL_PER_STANDARD_DRINK_G;
    const bacFromDrink = (alcoholGrams / (bodyWeightG * r)) * 100;
    const bacAfterElimination = bacFromDrink - ELIMINATION_RATE * hoursElapsed;
    totalBAC += Math.max(0, bacAfterElimination);
  }

  return Math.max(0, totalBAC);
}

/**
 * Find when BAC will reach zero by binary search.
 */
export function findSoberTime(drinks: Drink[], profile: UserProfile): number {
  if (drinks.length === 0) return Date.now();

  const now = Date.now();
  const currentBAC = calculateBAC(drinks, profile, now);
  if (currentBAC <= 0) return now;

  // Estimate: BAC / elimination rate gives hours, then search around it
  const estimatedHours = currentBAC / ELIMINATION_RATE;
  let low = now;
  let high = now + (estimatedHours + 2) * 60 * 60 * 1000;

  // Binary search for zero crossing
  while (high - low > 60000) {
    // Within 1 minute precision
    const mid = (low + high) / 2;
    const bacAtMid = calculateBAC(drinks, profile, mid);
    if (bacAtMid > 0.001) {
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

  // REM-safe = sober + buffer
  const remSafeAtTimestamp = soberAtTimestamp + REM_SAFE_BUFFER_HOURS * 60 * 60 * 1000;
  const timeToREMSafeMs = Math.max(0, remSafeAtTimestamp - now);

  // REM impact calculation (Gardiner 2024 meta-analysis)
  const totalAlcoholG = allDrinks.reduce(
    (sum, d) => sum + d.standardDrinks * ETHANOL_PER_STANDARD_DRINK_G,
    0
  );
  const doseGPerKg = totalAlcoholG / profile.weightKg;
  const remReductionMinutes = currentBAC > 0.001 ? REM_REDUCTION_COEFFICIENT * doseGPerKg : 0;
  const remPercentReduction = currentBAC > 0.001 ? 2.8 * (doseGPerKg / 0.75) : 0;

  // Sleep quality rating
  let sleepQuality: 'green' | 'yellow' | 'red' = 'green';
  if (currentBAC > 0.05) {
    sleepQuality = 'red';
  } else if (currentBAC > 0.02) {
    sleepQuality = 'yellow';
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
    points.push({
      time: t,
      bac: calculateBAC(drinks, profile, t),
    });
  }

  return points;
}

/**
 * Format milliseconds into a human-readable countdown string.
 */
export function formatCountdown(ms: number): string {
  if (ms <= 0) return 'Now';

  const totalMinutes = Math.ceil(ms / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

/**
 * Format BAC as a readable string.
 */
export function formatBAC(bac: number): string {
  if (bac < 0.001) return '0.000';
  return bac.toFixed(3);
}

/**
 * Generate a unique ID for a drink.
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
