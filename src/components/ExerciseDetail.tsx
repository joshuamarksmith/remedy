import { EXERCISE_MAP, getExercise } from '../data/exercises';
import { Check, Close, ChevronRight } from './icons';
import { Pill } from './ui';

export function ExerciseDetail({ id, onShowExercise }: { id: string; onShowExercise: (id: string) => void }) {
  const ex = getExercise(id);
  const regression = ex.regressionOf ? EXERCISE_MAP[ex.regressionOf] : undefined;
  const progression = ex.progressionTo ? EXERCISE_MAP[ex.progressionTo] : undefined;

  return (
    <div className="pb-4">
      <div className="flex items-center gap-2 mb-3">
        <Pill tone="ember">{ex.category}</Pill>
        <Pill tone="steel">{ex.pattern}</Pill>
        {ex.unilateral && <Pill>per side</Pill>}
      </div>

      <p className="text-fg-dim leading-relaxed">{ex.summary}</p>

      <h3 className="mt-6 mb-2 text-sm font-semibold uppercase tracking-wider text-ember-soft">Coaching cues</h3>
      <ul className="space-y-2.5">
        {ex.cues.map((c, i) => (
          <li key={i} className="flex gap-3">
            <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-ember/20 text-ember grid place-items-center">
              <Check size={14} />
            </span>
            <span className="text-fg leading-snug">{c}</span>
          </li>
        ))}
      </ul>

      <h3 className="mt-6 mb-2 text-sm font-semibold uppercase tracking-wider text-fg-dim">Common mistakes</h3>
      <ul className="space-y-2">
        {ex.mistakes.map((m, i) => (
          <li key={i} className="flex gap-3 text-fg-dim">
            <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-white/5 text-fg-faint grid place-items-center">
              <Close size={13} />
            </span>
            <span className="leading-snug">{m}</span>
          </li>
        ))}
      </ul>

      {(regression || progression) && (
        <div className="mt-6 space-y-2">
          <h3 className="mb-1 text-sm font-semibold uppercase tracking-wider text-fg-dim">Progression path</h3>
          {regression && (
            <button onClick={() => onShowExercise(regression.id)} className="w-full text-left card p-3 flex items-center gap-3 active:scale-[0.99] transition">
              <span className="text-xs text-fg-faint shrink-0">Easier</span>
              <span className="flex-1 font-medium">{regression.name}</span>
              <ChevronRight size={16} className="text-fg-faint" />
            </button>
          )}
          {progression && (
            <button onClick={() => onShowExercise(progression.id)} className="w-full text-left card p-3 flex items-center gap-3 active:scale-[0.99] transition">
              <span className="text-xs text-ember-soft shrink-0">Harder</span>
              <span className="flex-1 font-medium">{progression.name}</span>
              <ChevronRight size={16} className="text-fg-faint" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
