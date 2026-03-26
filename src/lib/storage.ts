import type { Drink, UserProfile, SleepRecord } from './bac';

const DRINKS_KEY = 'remedy_drinks';
const PROFILE_KEY = 'remedy_profile';
const SESSION_KEY = 'remedy_session_date';
const ONBOARDED_KEY = 'remedy_onboarded';
const SLEEP_KEY = 'remedy_sleep';
const NUDGE_DISMISSED_KEY = 'remedy_nudge_dismissed';

const DEFAULT_PROFILE: UserProfile = {
  weightKg: 75,
  sex: 'male',
  bedtime: '23:00',
};

/**
 * Get the session date key. Uses local time with a 5 AM rollover —
 * a drinking session that spans midnight still counts as one "day".
 * This prevents drinks from vanishing when the clock strikes 12.
 */
function getSessionDateKey(): string {
  const now = new Date();
  // Subtract 5 hours so the "day" rolls over at 5 AM local, not midnight
  const shifted = new Date(now.getTime() - 5 * 60 * 60 * 1000);
  return shifted.toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
}

/**
 * Load drinks from localStorage. Only returns today's drinks.
 */
export function loadDrinks(): Drink[] {
  try {
    const sessionDate = localStorage.getItem(SESSION_KEY);
    const today = getSessionDateKey();

    // If it's a new day, archive old drinks and start fresh
    if (sessionDate !== today) {
      archiveDrinks();
      localStorage.setItem(SESSION_KEY, today);
      return [];
    }

    const raw = localStorage.getItem(DRINKS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Drink[];
  } catch {
    return [];
  }
}

/**
 * Save drinks to localStorage.
 */
export function saveDrinks(drinks: Drink[]): void {
  localStorage.setItem(DRINKS_KEY, JSON.stringify(drinks));
  localStorage.setItem(SESSION_KEY, getSessionDateKey());
}

/**
 * Archive current drinks into history before clearing.
 */
function archiveDrinks(): void {
  try {
    const raw = localStorage.getItem(DRINKS_KEY);
    if (!raw) return;

    const drinks = JSON.parse(raw) as Drink[];
    if (drinks.length === 0) return;

    const historyKey = 'remedy_history';
    const history = JSON.parse(localStorage.getItem(historyKey) || '[]') as {
      date: string;
      drinks: Drink[];
    }[];

    const sessionDate = localStorage.getItem(SESSION_KEY) || getSessionDateKey();
    history.push({ date: sessionDate, drinks });

    // Keep last 90 days
    if (history.length > 90) {
      history.splice(0, history.length - 90);
    }

    localStorage.setItem(historyKey, JSON.stringify(history));
    localStorage.removeItem(DRINKS_KEY);
  } catch {
    // Silently fail on archive errors
  }
}

/**
 * Load user profile from localStorage.
 */
export function loadProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PROFILE;
  }
}

/**
 * Save user profile to localStorage.
 */
export function saveProfile(profile: UserProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

/**
 * Check if user has completed onboarding.
 */
export function hasOnboarded(): boolean {
  return localStorage.getItem(ONBOARDED_KEY) === '1';
}

/**
 * Mark onboarding as complete.
 */
export function setOnboarded(): void {
  localStorage.setItem(ONBOARDED_KEY, '1');
}

/**
 * Load the single stored sleep record (if it matches the requested date).
 * Only one record is ever kept — this is a spot-check, not a history.
 */
export function loadSleepRecord(date: string): SleepRecord | null {
  try {
    const raw = localStorage.getItem(SLEEP_KEY);
    if (!raw) return null;
    const record = JSON.parse(raw) as SleepRecord;
    return record.date === date ? record : null;
  } catch {
    return null;
  }
}

/**
 * Save a sleep record. Overwrites any previous record — we only
 * keep one at a time. This is intentionally ephemeral: no history,
 * no trends, just "how'd last night go?"
 */
export function saveSleepRecord(record: SleepRecord): void {
  try {
    localStorage.setItem(SLEEP_KEY, JSON.stringify(record));
  } catch {
    // silently fail
  }
}

/**
 * Check if the profile nudge card has been dismissed.
 */
export function hasProfileNudgeDismissed(): boolean {
  return localStorage.getItem(NUDGE_DISMISSED_KEY) === '1';
}

/**
 * Dismiss the profile nudge card permanently.
 */
export function dismissProfileNudge(): void {
  localStorage.setItem(NUDGE_DISMISSED_KEY, '1');
}

/**
 * Clear all app data and return to first-run state.
 */
export function resetApp(): void {
  localStorage.removeItem(DRINKS_KEY);
  localStorage.removeItem(PROFILE_KEY);
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(ONBOARDED_KEY);
  localStorage.removeItem('remedy_history');
  localStorage.removeItem(SLEEP_KEY);
  localStorage.removeItem(NUDGE_DISMISSED_KEY);
}

/**
 * Add a drink at an arbitrary timestamp.
 * If the drink is from today, adds to the current session.
 * If it's from a past date, adds to history.
 * Returns true if it was added to today's session (caller should reload drinks).
 */
export function addHistoricalDrink(drink: Drink): boolean {
  const drinkTs = new Date(drink.timestamp);
  const shifted = new Date(drinkTs.getTime() - 5 * 60 * 60 * 1000);
  const drinkDate = shifted.toLocaleDateString('en-CA');
  const today = getSessionDateKey();

  if (drinkDate === today) {
    // Add to current session
    const current = loadDrinks();
    current.push(drink);
    saveDrinks(current);
    return true;
  }

  // Add to history archive
  const historyKey = 'remedy_history';
  const history = JSON.parse(localStorage.getItem(historyKey) || '[]') as {
    date: string;
    drinks: Drink[];
  }[];

  const existing = history.find((h) => h.date === drinkDate);
  if (existing) {
    existing.drinks.push(drink);
  } else {
    history.push({ date: drinkDate, drinks: [drink] });
    history.sort((a, b) => a.date.localeCompare(b.date));
  }

  // Keep last 90 days
  if (history.length > 90) {
    history.splice(0, history.length - 90);
  }

  localStorage.setItem(historyKey, JSON.stringify(history));
  return false;
}
