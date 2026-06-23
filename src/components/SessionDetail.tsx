import type { Profile, Session, SessionLog } from '../types';
import { getExercise } from '../data/exercises';
import { describeBlock } from '../lib/blocks';
import { timeAgo } from '../lib/format';
import { resolveLoadKg, formatWeight } from '../lib/units';
import { Play, ChevronRight, Check } from './icons';
import { Pill } from './ui';
import { SESSION_TYPE_LABEL } from './sessionMeta';

export function SessionDetail({
  session,
  profile,
  lastLog,
  onStart,
  onShowExercise,
}: {
  session: Session;
  profile: Profile;
  lastLog?: SessionLog;
  onStart: () => void;
  onShowExercise: (id: string) => void;
}) {
  const sections: { label: string; blocks: typeof session.main }[] = [
    { label: 'Warm-up', blocks: session.warmup },
    { label: 'Main', blocks: session.main },
    ...(session.finisher?.length ? [{ label: 'Finisher', blocks: session.finisher }] : []),
  ];

  return (
    <div className="pb-2">
      <div className="flex items-center gap-2 mb-1">
        <Pill tone="ember">Week {session.week}</Pill>
        <Pill>{SESSION_TYPE_LABEL[session.type]}</Pill>
        <Pill>~{session.estMinutes} min</Pill>
      </div>
      <p className="text-fg-dim mt-2">{session.focus}</p>

      {lastLog && (
        <div className="mt-3 flex items-center gap-1.5 text-sm text-mint">
          <Check size={16} /> Last done {timeAgo(lastLog.date)}
          {lastLog.rpe ? ` · RPE ${lastLog.rpe}` : ''}
        </div>
      )}

      {session.notes?.map((n, i) => (
        <div key={i} className="mt-3 text-sm text-fg-dim bg-surface rounded-xl p-3 border border-hairline">
          {n}
        </div>
      ))}

      <div className="mt-5 space-y-5">
        {sections.map((sec) => (
          <div key={sec.label}>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-fg-faint mb-2">{sec.label}</h3>
            <div className="space-y-2">
              {sec.blocks.map((b, i) => {
                const ex = getExercise(b.exerciseId);
                const d = describeBlock(b);
                const load = resolveLoadKg(b.load, profile);
                return (
                  <button
                    key={i}
                    onClick={() => onShowExercise(ex.id)}
                    className="w-full text-left card p-3.5 flex items-center gap-3 active:scale-[0.99] transition"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{ex.name}</div>
                      <div className="text-sm text-fg-dim tnum">
                        {d.primary}
                        {load > 0 && <span className="text-fg-faint"> · {formatWeight(load, profile.unit)}</span>}
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-fg-faint shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onStart}
        className="sticky bottom-0 mt-6 w-full py-4 rounded-2xl bg-ember text-ink font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition glow-ember"
      >
        <Play size={20} /> {lastLog ? 'Train again' : 'Start session'}
      </button>
    </div>
  );
}
