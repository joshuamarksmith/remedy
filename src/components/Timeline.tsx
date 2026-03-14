import { useMemo } from 'react';
import {
  type Drink,
  type UserProfile,
  calculateBAC,
  findSoberTime,
  formatCountdown,
} from '../lib/bac';

interface TimelineProps {
  drinks: Drink[];
  profile: UserProfile;
  hypotheticalDrinks?: Drink[];
}

interface TimelineEvent {
  timestamp: number;
  type: 'drink' | 'sober' | 'rem-safe' | 'now' | 'hypothetical';
  label: string;
  sublabel?: string;
  bac?: number;
}

const REM_BUFFER_MS = 60 * 60 * 1000;

export function Timeline({ drinks, profile, hypotheticalDrinks = [] }: TimelineProps) {
  const events = useMemo(() => {
    const allDrinks = [...drinks, ...hypotheticalDrinks];
    const evts: TimelineEvent[] = [];
    const now = Date.now();

    // Drink events
    for (const d of drinks) {
      const bac = calculateBAC(drinks, profile, d.timestamp + 100);
      evts.push({
        timestamp: d.timestamp,
        type: 'drink',
        label: `${d.standardDrinks === 1 ? '' : d.standardDrinks + '× '}Drink logged`,
        sublabel: `BAC → ${bac.toFixed(3)}`,
        bac,
      });
    }

    // Hypothetical drink events
    for (const d of hypotheticalDrinks) {
      evts.push({
        timestamp: d.timestamp,
        type: 'hypothetical',
        label: `+${d.standardDrinks} hypothetical`,
        sublabel: 'What-if preview',
      });
    }

    // Now marker
    const currentBAC = allDrinks.length > 0 ? calculateBAC(allDrinks, profile, now) : 0;
    evts.push({
      timestamp: now,
      type: 'now',
      label: 'Now',
      sublabel: currentBAC > 0.001 ? `BAC ${currentBAC.toFixed(3)}` : 'Sober',
      bac: currentBAC,
    });

    // Sober time
    if (allDrinks.length > 0) {
      const soberAt = findSoberTime(allDrinks, profile);
      if (soberAt > now) {
        evts.push({
          timestamp: soberAt,
          type: 'sober',
          label: 'BAC reaches zero',
          sublabel: `In ${formatCountdown(soberAt - now)}`,
        });
      }

      // REM-safe time
      const remSafeAt = soberAt + REM_BUFFER_MS;
      if (remSafeAt > now) {
        evts.push({
          timestamp: remSafeAt,
          type: 'rem-safe',
          label: 'REM-safe to sleep',
          sublabel: `In ${formatCountdown(remSafeAt - now)}`,
        });
      }
    }

    // Sort chronologically
    evts.sort((a, b) => a.timestamp - b.timestamp);
    return evts;
  }, [drinks, profile, hypotheticalDrinks]);

  if (drinks.length === 0 && hypotheticalDrinks.length === 0) {
    return null;
  }

  const colorMap = {
    drink: 'bg-accent-purple',
    hypothetical: 'bg-accent-purple/40 border border-accent-purple/60',
    now: 'bg-accent-blue',
    sober: 'bg-accent-yellow',
    'rem-safe': 'bg-accent-green',
  };

  const textColorMap = {
    drink: 'text-accent-purple',
    hypothetical: 'text-accent-purple/60',
    now: 'text-accent-blue',
    sober: 'text-accent-yellow',
    'rem-safe': 'text-accent-green',
  };

  const iconMap = {
    drink: '●',
    hypothetical: '○',
    now: '◆',
    sober: '◎',
    'rem-safe': '✦',
  };

  return (
    <div className="glass p-4 animate-fade-in">
      <p className="text-xs text-text-secondary mb-3 px-1">Timeline</p>
      <div className="relative pl-6">
        {/* Vertical line */}
        <div className="absolute left-[9px] top-2 bottom-2 w-px bg-border-glass" />

        {events.map((evt, i) => {
          const time = new Date(evt.timestamp);
          const timeStr = time.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
          });
          const isPast = evt.timestamp <= Date.now();
          const opacity = evt.type === 'hypothetical' ? 'opacity-60' : isPast || evt.type === 'now' ? '' : 'opacity-70';

          return (
            <div key={`${evt.type}-${i}`} className={`relative flex items-start gap-3 pb-4 last:pb-0 ${opacity}`}>
              {/* Dot */}
              <div className="absolute -left-6 mt-1">
                <div
                  className={`w-[18px] h-[18px] rounded-full flex items-center justify-center text-[8px] ${colorMap[evt.type]}`}
                >
                  <span className="text-white/90">{iconMap[evt.type]}</span>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className={`text-sm font-medium ${textColorMap[evt.type]}`}>
                    {evt.label}
                  </span>
                  <span className="text-xs text-text-muted shrink-0">{timeStr}</span>
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
}
