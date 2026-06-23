import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Close } from './icons';

// ---- Bottom sheet overlay ----
export function Sheet({
  open,
  onClose,
  title,
  children,
  full,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  full?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end anim-fade-in" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative anim-sheet bg-ink-2 border-t border-hairline rounded-t-3xl ${
          full ? 'h-[92dvh]' : 'max-h-[88dvh]'
        } flex flex-col`}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-2 shrink-0">
          <div className="absolute left-1/2 -translate-x-1/2 top-2 h-1 w-10 rounded-full bg-white/15" />
          <h2 className="text-lg font-semibold mt-1">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid place-items-center h-9 w-9 rounded-full bg-surface text-fg-dim active:scale-95 transition"
          >
            <Close size={20} />
          </button>
        </div>
        <div className="overflow-y-auto no-scrollbar px-5 pb-8 safe-bottom">{children}</div>
      </div>
    </div>
  );
}

// ---- Circular progress ring ----
export function Ring({
  progress,
  size = 64,
  stroke = 6,
  color = 'var(--color-ember)',
  track = 'rgba(255,255,255,0.08)',
  children,
}: {
  progress: number; // 0..1
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - clamped)}
          style={{ transition: 'stroke-dashoffset 0.5s cubic-bezier(0.22,1,0.36,1)' }}
        />
      </svg>
      {children && <div className="absolute inset-0 grid place-items-center">{children}</div>}
    </div>
  );
}

// ---- Number stepper ----
export function Stepper({
  value,
  onChange,
  step = 1,
  min = 0,
  max = 999,
  suffix,
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  suffix?: string;
}) {
  const set = (v: number) => onChange(Math.max(min, Math.min(max, v)));
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => set(value - step)}
        className="grid place-items-center h-10 w-10 rounded-full bg-surface-2 text-fg active:scale-90 transition text-xl"
        aria-label="Decrease"
      >
        –
      </button>
      <span className="tnum min-w-16 text-center text-xl font-semibold">
        {value}
        {suffix ? <span className="text-fg-dim text-base ml-1">{suffix}</span> : null}
      </span>
      <button
        onClick={() => set(value + step)}
        className="grid place-items-center h-10 w-10 rounded-full bg-surface-2 text-fg active:scale-90 transition text-xl"
        aria-label="Increase"
      >
        +
      </button>
    </div>
  );
}

// ---- Segmented week progress bar ----
export function SegBar({ done, total }: { done: number; total: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full ${i < done ? 'bg-ember' : 'bg-white/10'}`}
        />
      ))}
    </div>
  );
}

// ---- Pill / chip ----
export function Pill({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'ember' | 'mint' | 'steel' }) {
  const tones: Record<string, string> = {
    default: 'bg-surface text-fg-dim',
    ember: 'bg-ember/15 text-ember-soft',
    mint: 'bg-mint/15 text-mint',
    steel: 'bg-steel/15 text-steel',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}
