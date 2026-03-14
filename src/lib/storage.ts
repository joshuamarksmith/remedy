import type { Drink, UserProfile } from './bac';

const DRINKS_KEY = 'remedy_drinks';
const PROFILE_KEY = 'remedy_profile';
const SESSION_KEY = 'remedy_session_date';
const ONBOARDED_KEY = 'remedy_onboarded';

const DEFAULT_PROFILE: UserProfile = {
  weightKg: 75,
  sex: 'male',
  bedtime: '23:00',
};

/**
 * Get today's date string for session tracking.
 */
function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Load drinks from localStorage. Only returns today's drinks.
 */
export function loadDrinks(): Drink[] {
  try {
    const sessionDate = localStorage.getItem(SESSION_KEY);
    const today = getTodayKey();

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
  localStorage.setItem(SESSION_KEY, getTodayKey());
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

    const sessionDate = localStorage.getItem(SESSION_KEY) || getTodayKey();
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
 * Clear all app data and return to first-run state.
 */
export function resetApp(): void {
  localStorage.removeItem(DRINKS_KEY);
  localStorage.removeItem(PROFILE_KEY);
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(ONBOARDED_KEY);
  localStorage.removeItem('remedy_history');
}
