import { useMemo, useState } from 'react';
import type { ExerciseCategory } from '../types';
import { EXERCISES } from '../data/exercises';
import { ChevronRight } from './icons';

const CATEGORIES: { id: ExerciseCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'ballistic', label: 'Ballistic' },
  { id: 'grind', label: 'Grinds' },
  { id: 'complex', label: 'Complexes' },
  { id: 'carry', label: 'Carries' },
  { id: 'core', label: 'Core' },
  { id: 'mobility', label: 'Mobility' },
];

const CAT_TONE: Record<ExerciseCategory, string> = {
  ballistic: 'text-ember-soft',
  grind: 'text-steel',
  mobility: 'text-mint',
  core: 'text-gold',
  carry: 'text-steel',
  complex: 'text-ember-soft',
};

export function Library({ onShowExercise }: { onShowExercise: (id: string) => void }) {
  const [cat, setCat] = useState<ExerciseCategory | 'all'>('all');
  const [q, setQ] = useState('');

  const list = useMemo(() => {
    return EXERCISES.filter((e) => (cat === 'all' || e.category === cat) && (q === '' || e.name.toLowerCase().includes(q.toLowerCase())));
  }, [cat, q]);

  return (
    <div className="px-5 pt-2 pb-28 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Movement Library</h1>
      <p className="text-fg-dim text-sm mb-4">Every lift in the program, with cues and the mistakes to avoid.</p>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search movements…"
        className="w-full p-3.5 rounded-2xl bg-surface border border-hairline text-fg placeholder:text-fg-faint focus:outline-none focus:border-ember/50 mb-3"
      />

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-4 -mx-1 px-1">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCat(c.id)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
              cat === c.id ? 'bg-ember text-ink' : 'bg-surface text-fg-dim'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="space-y-2 stagger">
        {list.map((e) => (
          <button
            key={e.id}
            onClick={() => onShowExercise(e.id)}
            className="w-full text-left card p-4 flex items-center gap-3 active:scale-[0.99] transition"
          >
            <div className="flex-1 min-w-0">
              <div className="font-semibold">{e.name}</div>
              <div className="text-sm text-fg-dim line-clamp-1">{e.summary}</div>
              <span className={`text-[11px] uppercase tracking-wide font-medium ${CAT_TONE[e.category]}`}>{e.category}</span>
            </div>
            <ChevronRight size={18} className="text-fg-faint shrink-0" />
          </button>
        ))}
        {list.length === 0 && <p className="text-center text-fg-faint py-10">No movements found.</p>}
      </div>
    </div>
  );
}
