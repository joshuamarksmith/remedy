import { useMemo, memo, useState, useRef } from 'react';
import {
  type Drink,
  type UserProfile,
  type BACState,
  DRINK_PRESETS,
  calculateBAC,
  formatCountdown,
  formatBAC,
} from '../lib/bac';
import { EVENT_STYLES, formatTime } from '../lib/theme';

interface TimelineProps {
  drinks: Drink[];
  profile: UserProfile;
  hypotheticalDrinks?: Drink[];
  bacState: BACState;
  onRemoveDrink?: (id: string) => void;
}

interface TimelineEvent {
  timestamp: number;
  type: 'drink' | 'sober' | 'sleep-clear' | 'now' | 'hypothetical';
  label: string;
  sublabel?: string;
  drinkId?: string;
}

export const Timeline = memo(function Timeline({
  drinks,
  profile,
  hypotheticalDrinks = [],
  bacState,
  onRemoveDrink,
}: TimelineProps) {
  const [swipedId, setSwipedId] = useState<string | null>(null);
  const touchStartX = useRef(0);
  const events = useMemo(() => {
    const allDrinks = [...drinks, ...hypotheticalDrinks];
    const evts: TimelineEvent[] = [];
    const now = Date.now();

    for (const d of drinks) {
      const bac = calculateBAC(drinks, profile, d.timestamp + 100);
      const preset = d.drinkType && d.drinkType !== 'custom' ? DRINK_PRESETS[d.drinkType] : null;
      const drinkLabel = preset
        ? `${preset.icon} ${preset.label}${d.standardDrinks !== preset.standardDrinks ? ` (${d.standardDrinks} std)` : ''}`
        : `${d.standardDrinks === 1 ? '' : d.standardDrinks + '× '}Drink logged`;
      evts.push({
        timestamp: d.timestamp,
        type: 'drink',
        label: drinkLabel,
        sublabel: `BAC → ${formatBAC(bac)}`,
        drinkId: d.id,
      });
    }

    for (const d of hypotheticalDrinks) {
      evts.push({
        timestamp: d.timestamp,
        type: 'hypothetical',
        label: `+${d.standardDrinks} hypothetical`,
        sublabel: 'What-if preview',
      });
    }

    const currentBAC = allDrinks.length > 0 ? calculateBAC(allDrinks, profile, now) : 0;
    evts.push({
      timestamp: now,
      type: 'now',
      label: 'Now',
      sublabel: currentBAC > 0.001 ? `BAC ${formatBAC(currentBAC)}` : 'Sober',
    });

    if (allDrinks.length > 0) {
      if (bacState.soberAtTimestamp > now) {
        evts.push({
          timestamp: bacState.soberAtTimestamp,
          type: 'sober',
          label: 'BAC reaches zero',
          sublabel: `In ${formatCountdown(bacState.soberAtTimestamp - now)}`,
        });
      }

      if (bacState.lowImpactAtTimestamp > now) {
        evts.push({
          timestamp: bacState.lowImpactAtTimestamp,
          type: 'sleep-clear',
          label: 'Sleep clear',
          sublabel: `In ${formatCountdown(bacState.lowImpactAtTimestamp - now)}`,
        });
      }
    }

    evts.sort((a, b) => a.timestamp - b.timestamp);
    return evts;
  }, [drinks, profile, hypotheticalDrinks]);

  if (drinks.length === 0 && hypotheticalDrinks.length === 0) return null;

  return (
    <div className="card p-4 animate-fade-in">
      <p className="text-xs text-text-secondary mb-3 px-1">Timeline</p>
      <div className="relative pl-6">
        <div className="absolute left-[9px] top-2 bottom-2 w-px bg-border-glass" />

        {events.map((evt, i) => {
          const style = EVENT_STYLES[evt.type];
          const isPast = evt.timestamp <= Date.now();
          const opacity =
            evt.type === 'hypothetical'
              ? 'opacity-60'
              : isPast || evt.type === 'now'
                ? ''
                : 'opacity-70';

          const canSwipe = evt.type === 'drink' && evt.drinkId && onRemoveDrink;
          const isSwiped = canSwipe && swipedId === evt.drinkId;

          return (
            <div
              key={`${evt.type}-${i}`}
              className={`relative flex items-start gap-3 pb-4 last:pb-0 ${opacity}`}
              onTouchStart={canSwipe ? (e) => { touchStartX.current = e.touches[0].clientX; } : undefined}
              onTouchEnd={canSwipe ? (e) => {
                const dx = e.changedTouches[0].clientX - touchStartX.current;
                if (dx < -60) setSwipedId(evt.drinkId!);
                else if (dx > 30) setSwipedId(null);
              } : undefined}
            >
              <div className="absolute -left-6 mt-1">
                <div
                  className={`w-[18px] h-[18px] rounded-full flex items-center justify-center text-[8px] ${style.bg}`}
                >
                  <span className="text-white/90">{style.icon}</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className={`text-sm font-medium ${style.text}`}>
                    {evt.label}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    {isSwiped && (
                      <button
                        onClick={() => { onRemoveDrink(evt.drinkId!); setSwipedId(null); }}
                        className="text-xs text-accent-red font-medium animate-pop-in"
                      >
                        Remove
                      </button>
                    )}
                    <span className="text-xs text-text-muted">
                      {formatTime(evt.timestamp)}
                    </span>
                  </div>
                </div>
                {evt.sublabel && (
                  <p className="text-xs text-text-muted mt-0.5">{evt.sublabel}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
