import { sessionDateKey, type Drink, type UserProfile, type SleepRecord } from './bac';

const DRINKS_KEY = 'remedy_drinks';
const PROFILE_KEY = 'remedy_profile';
const SESSION_KEY = 'remedy_session_date';
const ONBOARDED_KEY = 'remedy_onboarded';
const SLEEP_KEY = 'remedy_sleep';
const HISTORY_KEY = 'remedy_history';

const DEFAULT_PROFILE: UserProfile = {
  weightKg: 75,
  sex: 'male',
  bedtime: '23:00',
};

/**
 * Get today's session date key. Uses the shared 5 AM rollover from bac.ts —
 * a drinking session that spans midnight still counts as one "day".
 * This prevents drinks from vanishing when the clock strikes 12.
 */
function getSessionDateKey(): string {
  return sessionDateKey(Date.now());
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

    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') as {
      date: string;
      drinks: Drink[];
    }[];

    const sessionDate = localStorage.getItem(SESSION_KEY) || getSessionDateKey();
    history.push({ date: sessionDate, drinks });

    // Keep last 90 days
    if (history.length > 90) {
      history.splice(0, history.length - 90);
    }

    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
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
 * Clear all app data and return to first-run state.
 */
export function resetApp(): void {
  localStorage.removeItem(DRINKS_KEY);
  localStorage.removeItem(PROFILE_KEY);
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(ONBOARDED_KEY);
  localStorage.removeItem(HISTORY_KEY);
  localStorage.removeItem(SLEEP_KEY);
}

/**
 * Add a drink at an arbitrary timestamp.
 * If the drink is from today, adds to the current session.
 * If it's from a past date, adds to history.
 * Returns true if it was added to today's session (caller should reload drinks).
 */
export function addHistoricalDrink(drink: Drink): boolean {
  const drinkDate = sessionDateKey(drink.timestamp);
  const today = getSessionDateKey();

  if (drinkDate === today) {
    // Add to current session
    const current = loadDrinks();
    current.push(drink);
    saveDrinks(current);
    return true;
  }

  // Add to history archive
  const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') as {
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

  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  return false;
}

/**
 * Load the drinks for a given session date — the live session if it matches,
 * otherwise the archived one from history. Returns [] when nothing is found.
 */
export function loadSessionDrinks(date: string): Drink[] {
  try {
    if (localStorage.getItem(SESSION_KEY) === date) {
      const raw = localStorage.getItem(DRINKS_KEY);
      return raw ? (JSON.parse(raw) as Drink[]) : [];
    }
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') as {
      date: string;
      drinks: Drink[];
    }[];
    return history.find((h) => h.date === date)?.drinks ?? [];
  } catch {
    return [];
  }
}
