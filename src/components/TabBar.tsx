import type { ReactNode } from 'react';
import { Today, Calendar, Book, Chart, Gear } from './icons';

export type Tab = 'today' | 'program' | 'library' | 'progress' | 'settings';

const TABS: { id: Tab; label: string; icon: (p: { size?: number }) => ReactNode }[] = [
  { id: 'today', label: 'Today', icon: Today },
  { id: 'program', label: 'Program', icon: Calendar },
  { id: 'library', label: 'Library', icon: Book },
  { id: 'progress', label: 'Progress', icon: Chart },
  { id: 'settings', label: 'Settings', icon: Gear },
];

export function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 safe-bottom">
      <div className="mx-auto max-w-xl px-3 pb-2">
        <div className="flex items-center justify-around bg-ink-2/90 backdrop-blur-xl border border-hairline rounded-2xl px-1 py-1.5 shadow-2xl">
          {TABS.map((t) => {
            const on = active === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => onChange(t.id)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition ${on ? 'text-ember' : 'text-fg-faint active:text-fg-dim'}`}
                aria-label={t.label}
                aria-current={on ? 'page' : undefined}
              >
                <Icon size={22} />
                <span className="text-[10px] font-medium">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
