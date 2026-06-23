import type { ReactNode } from 'react';
import type { AppData } from '../types';
import { getSession } from '../data/program';
import { computeStats } from '../lib/progress';
import { formatWeight } from '../lib/units';
import { clock } from '../lib/blocks';
import { Flame, Trophy, Check } from './icons';
import { timeAgo } from '../lib/format';

export function Progress({ data }: { data: AppData }) {
  const stats = computeStats(data);
  const recent = [...data.logs].slice(-12);
  const maxSwings = Math.max(1, ...recent.map((l) => l.totalSwings));
  const history = [...data.logs].reverse().slice(0, 15);

  return (
    <div className="px-5 pt-2 pb-28 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-5">Progress</h1>

      {/* Headline stats */}
      <div className="grid grid-cols-2 gap-3">
        <BigStat label="Sessions done" value={`${stats.sessionsDone}`} sub={`of ${stats.totalSessions}`} />
        <BigStat label="Day streak" value={`${stats.streakDays}`} sub="keep it lit" icon={<Flame size={18} className="text-ember" />} />
        <BigStat label="Total swings" value={fmt(stats.totalSwings)} sub="& snatches" />
        <BigStat label="Volume lifted" value={formatWeight(stats.totalVolumeKg, data.profile.unit, false)} sub={data.profile.unit} />
      </div>

      {/* Swings per session chart */}
      {recent.length > 0 ? (
        <div className="mt-6 card p-4">
          <h3 className="font-semibold mb-3 text-sm">Ballistic volume per session</h3>
          <div className="flex items-end gap-1.5 h-32">
            {recent.map((l) => (
              <div key={l.id} className="flex-1 flex flex-col items-center justify-end gap-1" title={`${l.totalSwings} reps`}>
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-ember/40 to-ember transition-all"
                  style={{ height: `${Math.max(4, (l.totalSwings / maxSwings) * 100)}%` }}
                />
              </div>
            ))}
          </div>
          <div className="text-xs text-fg-faint mt-2 text-center">last {recent.length} sessions</div>
        </div>
      ) : (
        <div className="mt-6 card p-8 text-center text-fg-dim">
          <Trophy size={32} className="mx-auto mb-2 text-fg-faint" />
          Log your first session to see progress here.
        </div>
      )}

      {/* Program completion grid */}
      <div className="mt-6 card p-4">
        <h3 className="font-semibold mb-3 text-sm">Program map</h3>
        <div className="space-y-2">
          {stats.weekProgress.map((w) => (
            <div key={w.week} className="flex items-center gap-3">
              <span className="text-xs text-fg-faint w-7 shrink-0">W{w.week}</span>
              <div className="flex gap-1.5 flex-1">
                {Array.from({ length: w.total }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-6 flex-1 rounded-md ${i < w.done ? 'bg-ember' : 'bg-white/8'}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold mb-3">Recent sessions</h3>
          <div className="space-y-2">
            {history.map((l) => {
              const s = getSession(l.sessionId);
              return (
                <div key={l.id} className="card p-3.5 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-mint/15 text-mint grid place-items-center shrink-0">
                    <Check size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{s?.title ?? l.sessionId}</div>
                    <div className="text-xs text-fg-faint">
                      {timeAgo(l.date)} · {clock(l.durationSec)}
                      {l.totalSwings > 0 ? ` · ${l.totalSwings} swings` : ''}
                      {l.rpe ? ` · RPE ${l.rpe}` : ''}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function BigStat({ label, value, sub, icon }: { label: string; value: string; sub: string; icon?: ReactNode }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-1.5">
        <span className="tnum text-3xl font-bold">{value}</span>
        {icon}
      </div>
      <div className="text-sm text-fg-dim mt-1">{label}</div>
      <div className="text-xs text-fg-faint">{sub}</div>
    </div>
  );
}

function fmt(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return `${n}`;
}
