// Centralized theme constants — single source of truth for colors, thresholds, and formatting

// BAC thresholds (from Ebrahim et al. 2013, Gardiner et al. 2024)
export const BAC_THRESHOLD_CAUTION = 0.02; // measurable REM suppression
export const BAC_THRESHOLD_DANGER = 0.05; // significant REM suppression


export type SleepQuality = 'safe' | 'caution' | 'danger';

// Canvas/SVG colors (raw values for imperative drawing)
export const COLORS = {
  safe: { hex: '#34d399', rgb: '52, 211, 153' },
  caution: { hex: '#fbbf24', rgb: '251, 191, 36' },
  danger: { hex: '#f87171', rgb: '248, 113, 113' },
  accent: { hex: '#60a5fa', rgb: '96, 165, 250' }, // blue — primary interactive
  teal: { hex: '#2dd4bf', rgb: '45, 212, 191' }, // teal — secondary
} as const;

// Tailwind class maps keyed by SleepQuality
export const STATUS_TEXT_CLASS: Record<SleepQuality, string> = {
  safe: 'text-accent-green',
  caution: 'text-accent-yellow',
  danger: 'text-accent-red',
};

export const STATUS_BORDER_CLASS: Record<SleepQuality, string> = {
  safe: 'border-accent-green/30',
  caution: 'border-accent-yellow/30',
  danger: 'border-accent-red/30',
};

// Timeline/event styling
export interface EventStyle {
  bg: string;
  text: string;
  icon: string;
}

export const EVENT_STYLES: Record<string, EventStyle> = {
  drink: { bg: 'bg-accent-blue', text: 'text-accent-blue', icon: '●' },
  hypothetical: { bg: 'bg-accent-blue/40 border border-accent-blue/60', text: 'text-accent-blue/60', icon: '○' },
  now: { bg: 'bg-white/80', text: 'text-white', icon: '◆' },
  sober: { bg: 'bg-accent-yellow', text: 'text-accent-yellow', icon: '◎' },
  'sleep-clear': { bg: 'bg-accent-green', text: 'text-accent-green', icon: '✦' },
};

// Format helpers
export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatDrinkCount(n: number): string {
  return n.toFixed(n % 1 === 0 ? 0 : 1);
}

// Canvas color helpers
export function getQualityStroke(quality: SleepQuality): string {
  const c = COLORS[quality === 'safe' ? 'safe' : quality === 'caution' ? 'caution' : 'danger'];
  return `rgba(${c.rgb}, 0.9)`;
}

export function getQualityFill(quality: SleepQuality): string {
  const c = COLORS[quality === 'safe' ? 'safe' : quality === 'caution' ? 'caution' : 'danger'];
  return `rgba(${c.rgb}, 0.12)`;
}

export function qualityFromBAC(bac: number): SleepQuality {
  if (bac > BAC_THRESHOLD_DANGER) return 'danger';
  if (bac > BAC_THRESHOLD_CAUTION) return 'caution';
  return 'safe';
}
