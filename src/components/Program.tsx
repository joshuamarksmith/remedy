import { useState } from 'react';
import type { AppData } from '../types';
import { PROGRAM } from '../data/program';
import { completedSessionIds, currentWeek } from '../lib/progress';
import { Check, ChevronDown } from './icons';
import { Pill, SegBar } from './ui';
import { SESSION_TYPE_LABEL } from './sessionMeta';

export function Program({ data, onOpenSession }: { data: AppData; onOpenSession: (id: string) => void }) {
  const done = completedSessionIds(data);
  const cur = currentWeek(data);
  const [open, setOpen] = useState<number>(cur);

  return (
    <div className="px-5 pt-2 pb-28 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">The Program</h1>
      <p className="text-fg-dim text-sm mb-5">
        Eight weeks, beginner to the Simple standard. Built on hardstyle method — swings, get-ups, and the lifts that matter.
      </p>

      <div className="space-y-3 stagger">
        {PROGRAM.map((w) => {
          const wDone = w.sessions.filter((s) => done.has(s.id)).length;
          const isOpen = open === w.number;
          const complete = wDone === w.sessions.length;
          return (
            <div key={w.number} className="card overflow-hidden">
              <button
                onClick={() => setOpen(isOpen ? -1 : w.number)}
                className="w-full text-left p-4 flex items-center gap-3 active:bg-surface-2 transition"
              >
                <div
                  className={`h-10 w-10 rounded-xl grid place-items-center shrink-0 font-bold ${
                    complete ? 'bg-mint/20 text-mint' : w.number === cur ? 'bg-ember/20 text-ember' : 'bg-surface text-fg-faint'
                  }`}
                >
                  {complete ? <Check size={20} /> : w.number}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold truncate">{w.title}</span>
                    {w.number === cur && !complete && <Pill tone="ember">Now</Pill>}
                  </div>
                  <div className="text-sm text-fg-dim truncate">{w.theme}</div>
                </div>
                <ChevronDown size={20} className={`text-fg-faint shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {isOpen && (
                <div className="px-4 pb-4 anim-fade-up">
                  <p className="text-sm text-fg-dim leading-relaxed mb-3">{w.description}</p>
                  <div className="mb-3">
                    <SegBar done={wDone} total={w.sessions.length} />
                  </div>
                  <div className="space-y-2">
                    {w.sessions.map((s) => {
                      const isDone = done.has(s.id);
                      return (
                        <button
                          key={s.id}
                          onClick={() => onOpenSession(s.id)}
                          className="w-full text-left rounded-xl bg-surface p-3 flex items-center gap-3 active:scale-[0.99] transition border border-hairline"
                        >
                          <div
                            className={`h-8 w-8 rounded-full grid place-items-center shrink-0 text-xs font-semibold ${
                              isDone ? 'bg-mint/20 text-mint' : 'bg-white/5 text-fg-faint'
                            }`}
                          >
                            {isDone ? <Check size={16} /> : `D${s.day}`}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{s.title}</div>
                            <div className="text-xs text-fg-faint">
                              {SESSION_TYPE_LABEL[s.type]} · ~{s.estMinutes} min
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
