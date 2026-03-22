const NOTIFICATION_KEY = 'remedy_notify_rem_clear';

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
 * Request notification permission. Returns true if granted.
 */
export async function requestPermission(): Promise<boolean> {
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
export function scheduleREMClearNotification(atTimestamp: number): void {
  cancelREMClearNotification();

  if (!isNotificationEnabled()) return;
  if (Notification.permission !== 'granted') return;

  const delay = atTimestamp - Date.now();
  if (delay <= 0) return;

  // Cap at 24 hours to avoid unreliable long timers
  if (delay > 24 * 60 * 60 * 1000) return;

  scheduledTimer = setTimeout(() => {
    new Notification('remedy', {
      body: "Your REM sleep is clear now. Sleep well tonight.",
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
  if (scheduledTimer) {
    clearTimeout(scheduledTimer);
    scheduledTimer = null;
  }
}
