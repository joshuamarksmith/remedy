import { useMemo, memo } from 'react';
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
}

interface TimelineEvent {
  timestamp: number;
  type: 'drink' | 'sober' | 'sleep-clear' | 'now' | 'hypothetical';
  label: string;
  sublabel?: string;
}

export const Timeline = memo(function Timeline({
  drinks,
  profile,
  hypotheticalDrinks = [],
  bacState,
}: TimelineProps) {
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

          return (
            <div
              key={`${evt.type}-${i}`}
              className={`relative flex items-start gap-3 pb-4 last:pb-0 ${opacity}`}
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
                  <span className="text-xs text-text-muted shrink-0">
                    {formatTime(evt.timestamp)}
                  </span>
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
