import type { AppData, Session } from '../types';
import { PROGRAM, getSession } from '../data/program';
import { getExercise } from '../data/exercises';
import { computeStats, currentWeek, lastLogFor, nextSession } from '../lib/progress';
import { Flame, Play, Check, ChevronRight } from './icons';
import { Pill, SegBar } from './ui';
import { SESSION_TYPE_LABEL } from './sessionMeta';

export function Home({
  data,
  onOpenSession,
  onStart,
}: {
  data: AppData;
  onOpenSession: (id: string) => void;
  onStart: (id: string) => void;
}) {
  const stats = computeStats(data);
  const nextId = nextSession(data);
  const next = getSession(nextId)!;
  const week = PROGRAM[currentWeek(data) - 1];
  const done = stats.uniqueSessionIds;
  const allDone = stats.sessionsDone >= stats.totalSessions;

  return (
    <div className="px-5 pt-2 pb-28 max-w-xl mx-auto">
      {/* Greeting */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold">{greeting()}</h1>
          <p className="text-fg-dim text-sm">
            {allDone ? 'Program complete — keep the iron moving.' : `Week ${week.number} · ${week.title}`}
          </p>
        </div>
        {stats.streakDays > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-ember/15 text-ember-soft">
            <Flame size={18} />
            <span className="font-bold tnum">{stats.streakDays}</span>
          </div>
        )}
      </div>

      {/* Hero — next session */}
      <div className="anim-fade-up card-2 p-5 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-ember/10 blur-2xl pointer-events-none" />
        <div className="flex items-center gap-2 mb-3">
          <Pill tone="ember">{allDone ? 'Repeat' : 'Up next'}</Pill>
          <Pill>{SESSION_TYPE_LABEL[next.type]}</Pill>
          <Pill>~{next.estMinutes} min</Pill>
        </div>
        <h2 className="text-2xl font-bold leading-tight">{next.title}</h2>
        <p className="text-fg-dim mt-1">{next.focus}</p>

        <div className="flex flex-wrap gap-1.5 mt-4">
          {mainMovements(next).map((name) => (
            <span key={name} className="text-xs px-2.5 py-1 rounded-lg bg-surface text-fg-dim">
              {name}
            </span>
          ))}
        </div>

        <div className="flex gap-2.5 mt-5">
          <button
            onClick={() => onStart(next.id)}
            className="flex-1 py-3.5 rounded-2xl bg-ember text-ink font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition glow-ember"
          >
            <Play size={20} /> Start
          </button>
          <button
            onClick={() => onOpenSession(next.id)}
            className="px-5 py-3.5 rounded-2xl bg-surface-2 text-fg font-medium active:scale-95 transition"
          >
            Preview
          </button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3 mt-5">
        <MiniStat label="Sessions" value={`${stats.sessionsDone}`} sub={`of ${stats.totalSessions}`} />
        <MiniStat label="Swings" value={fmtBig(stats.totalSwings)} sub="lifetime" />
        <MiniStat label="Get-ups" value={`${getupCount(data)}`} sub="lifetime" />
      </div>

      {/* This week */}
      <div className="mt-7">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">This week</h3>
          <span className="text-sm text-fg-faint">
            {week.sessions.filter((s) => done.has(s.id)).length}/{week.sessions.length}
          </span>
        </div>
        <SegBar done={week.sessions.filter((s) => done.has(s.id)).length} total={week.sessions.length} />
        <div className="mt-3 space-y-2 stagger">
          {week.sessions.map((s) => {
            const isDone = done.has(s.id);
            const log = lastLogFor(data, s.id);
            return (
              <button
                key={s.id}
                onClick={() => onOpenSession(s.id)}
                className="w-full text-left card p-3.5 flex items-center gap-3 active:scale-[0.99] transition"
              >
                <div
                  className={`h-9 w-9 rounded-full grid place-items-center shrink-0 ${
                    isDone ? 'bg-mint/20 text-mint' : s.id === nextId ? 'bg-ember/20 text-ember' : 'bg-surface text-fg-faint'
                  }`}
                >
                  {isDone ? <Check size={18} /> : <span className="text-sm font-semibold">D{s.day}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{s.title}</div>
                  <div className="text-sm text-fg-dim truncate">
                    {SESSION_TYPE_LABEL[s.type]}
                    {log?.rpe ? ` · RPE ${log.rpe}` : ''}
                  </div>
                </div>
                <ChevronRight size={18} className="text-fg-faint shrink-0" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="card p-3.5 text-center">
      <div className="tnum text-xl font-bold">{value}</div>
      <div className="text-[11px] text-fg-faint mt-0.5">{label}</div>
      <div className="text-[10px] text-fg-faint/70">{sub}</div>
    </div>
  );
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function mainMovements(session: Session): string[] {
  const names = session.main.map((b) => getExercise(b.exerciseId).name);
  return [...new Set(names)].slice(0, 4);
}

// Count planned get-ups across every logged session that includes a get-up block.
function getupCount(data: AppData): number {
  let total = 0;
  for (const log of data.logs) {
    const s = getSession(log.sessionId);
    if (!s) continue;
    for (const b of [...s.main, ...(s.finisher ?? [])]) {
      if (b.exerciseId === 'turkish-getup' || b.exerciseId === 'getup-elbow') {
        const sides = b.perSide ? 2 : 1;
        total += (b.sets ?? 0) * (b.reps ?? 0) * sides;
      }
    }
  }
  return total;
}

function fmtBig(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return `${n}`;
}
