import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

const NOTIFICATION_KEY = 'remedy_notify_rem_clear';
const MORNING_NOTIFY_KEY = 'remedy_notify_morning';
const NOTIFICATION_ID = 9001;
const MORNING_NOTIFICATION_ID = 9002;

const isNative = Capacitor.isNativePlatform();

/**
 * Check if the user has enabled REM-clear notifications.
 */
export function isNotificationEnabled(): boolean {
  return localStorage.getItem(NOTIFICATION_KEY) === '1';
}

/**
 * Set the notification preference.
 */
export function setNotificationEnabled(enabled: boolean): void {
  localStorage.setItem(NOTIFICATION_KEY, enabled ? '1' : '0');
}

/**
 * Check if morning summary notifications are enabled.
 */
export function isMorningNotifyEnabled(): boolean {
  return localStorage.getItem(MORNING_NOTIFY_KEY) === '1';
}

/**
 * Set morning summary notification preference.
 */
export function setMorningNotifyEnabled(enabled: boolean): void {
  localStorage.setItem(MORNING_NOTIFY_KEY, enabled ? '1' : '0');
}

/**
 * Request notification permission. Returns true if granted.
 */
export async function requestPermission(): Promise<boolean> {
  if (isNative) {
    const result = await LocalNotifications.requestPermissions();
    return result.display === 'granted';
  }
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

let scheduledTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Schedule a "REM sleep clear" notification at the given timestamp.
 * Cancels any previously scheduled notification.
 */
export async function scheduleREMClearNotification(atTimestamp: number): Promise<void> {
  cancelREMClearNotification();

  if (!isNotificationEnabled()) return;

  const delay = atTimestamp - Date.now();
  if (delay <= 0) return;

  // Cap at 24 hours to avoid unreliable long timers
  if (delay > 24 * 60 * 60 * 1000) return;

  if (isNative) {
    await LocalNotifications.schedule({
      notifications: [{
        id: NOTIFICATION_ID,
        title: 'remedy',
        body: 'Your REM sleep is clear now. Sleep well tonight.',
        schedule: { at: new Date(atTimestamp) },
      }],
    });
    return;
  }

  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

  scheduledTimer = setTimeout(() => {
    new Notification('remedy', {
      body: 'Your REM sleep is clear now. Sleep well tonight.',
      icon: '/favicon.svg',
      tag: 'rem-clear',
    });
    scheduledTimer = null;
  }, delay);
}

/**
 * Cancel any scheduled notification.
 */
export function cancelREMClearNotification(): void {
  if (isNative) {
    LocalNotifications.cancel({ notifications: [{ id: NOTIFICATION_ID }] }).catch(() => {});
    return;
  }
  if (scheduledTimer) {
    clearTimeout(scheduledTimer);
    scheduledTimer = null;
  }
}

let morningTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Schedule a morning summary notification for the next 8 AM.
 * Uses stored session summary data.
 */
export async function scheduleMorningSummary(
  drinkCount: number,
  remReduction: number,
  peakBAC: number,
  soberAtTimestamp: number
): Promise<void> {
  cancelMorningSummary();

  if (!isMorningNotifyEnabled()) return;
  if (drinkCount === 0) return;

  // Schedule for 8 AM tomorrow (or today if before 8 AM)
  const now = new Date();
  const target = new Date(now);
  target.setHours(8, 0, 0, 0);
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  const delay = target.getTime() - now.getTime();
  if (delay > 24 * 60 * 60 * 1000) return;

  const body = `Last night: ${drinkCount} ${drinkCount === 1 ? 'drink' : 'drinks'} logged. Your REM was likely reduced by ~${Math.round(remReduction)} minutes.`;

  // Store summary for the in-app card
  localStorage.setItem('remedy_morning_summary', JSON.stringify({
    drinkCount,
    remReduction: Math.round(remReduction),
    peakBAC,
    soberAtTimestamp,
    createdAt: Date.now(),
  }));

  if (isNative) {
    await LocalNotifications.schedule({
      notifications: [{
        id: MORNING_NOTIFICATION_ID,
        title: 'remedy',
        body,
        schedule: { at: target },
      }],
    });
    return;
  }

  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

  morningTimer = setTimeout(() => {
    new Notification('remedy', {
      body,
      icon: '/favicon.svg',
      tag: 'morning-summary',
    });
    morningTimer = null;
  }, delay);
}

/**
 * Cancel any scheduled morning summary notification.
 */
export function cancelMorningSummary(): void {
  if (isNative) {
    LocalNotifications.cancel({ notifications: [{ id: MORNING_NOTIFICATION_ID }] }).catch(() => {});
    return;
  }
  if (morningTimer) {
    clearTimeout(morningTimer);
    morningTimer = null;
  }
}

export interface MorningSummary {
  drinkCount: number;
  remReduction: number;
  peakBAC: number;
  soberAtTimestamp: number;
  createdAt: number;
}

/**
 * Load morning summary if it exists and is from last night (within 24h).
 */
export function loadMorningSummary(): MorningSummary | null {
  try {
    const raw = localStorage.getItem('remedy_morning_summary');
    if (!raw) return null;
    const summary = JSON.parse(raw) as MorningSummary;
    // Only show if created within last 24 hours
    if (Date.now() - summary.createdAt > 24 * 60 * 60 * 1000) {
      localStorage.removeItem('remedy_morning_summary');
      return null;
    }
    return summary;
  } catch {
    return null;
  }
}

/**
 * Dismiss the morning summary card.
 */
export function dismissMorningSummary(): void {
  localStorage.removeItem('remedy_morning_summary');
}
