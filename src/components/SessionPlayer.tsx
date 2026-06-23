import { useEffect, useMemo, useRef, useState } from 'react';
import type { Block, Profile, Session, SessionLog } from '../types';
import { getExercise } from '../data/exercises';
import { resolveLoadKg, formatWeight, LOAD_LABEL } from '../lib/units';
import { clock, describeBlock, estimateBlock, fmtDur, isTimed, setCount } from '../lib/blocks';
import { cueFinish, cueGo, cueTick, primeAudio } from '../lib/sound';
import { uuid } from '../lib/storage';
import { Ring } from './ui';
import { ArrowLeft, Check, Info, Pause, Play, Skip, Trophy } from './icons';

type Phase = 'work' | 'rest' | 'done';

interface FlowBlock extends Block {
  section: 'Warm-up' | 'Main' | 'Finisher';
  blockKey: number; // index into the flattened flow
}

export function SessionPlayer({
  session,
  profile,
  onComplete,
  onExit,
  onShowExercise,
}: {
  session: Session;
  profile: Profile;
  onComplete: (log: SessionLog) => void;
  onExit: () => void;
  onShowExercise: (id: string) => void;
}) {
  const flow: FlowBlock[] = useMemo(() => {
    const tag = (blocks: Block[], section: FlowBlock['section']) =>
      blocks.map((b) => ({ ...b, section }));
    const all = [
      ...tag(session.warmup, 'Warm-up'),
      ...tag(session.main, 'Main'),
      ...tag(session.finisher ?? [], 'Finisher'),
    ];
    return all.map((b, i) => ({ ...b, blockKey: i }));
  }, [session]);

  const cues = { sound: profile.soundOn, haptic: profile.vibrateOn };

  const [idx, setIdx] = useState(0); // current block in flow
  const [setNo, setSetNo] = useState(0); // current set within block (0-based)
  const [phase, setPhase] = useState<Phase>('work');
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [remaining, setRemaining] = useState(0); // countdown seconds
  const [running, setRunning] = useState(false);
  const startRef = useRef<number>(Date.now());
  const [elapsed, setElapsed] = useState(0);

  const block = flow[idx];
  const sets = block ? setCount(block) : 1;
  const loadKg = block ? resolveLoadKg(block.load, profile) : 0;

  // ---- Elapsed session clock ----
  useEffect(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  // ---- Countdown engine: one tick per second while running ----
  useEffect(() => {
    if (!running || remaining <= 0) return;
    const id = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(id);
  }, [running, remaining]);

  // ---- Audible final-seconds ticks ----
  useEffect(() => {
    if (running && remaining > 0 && remaining <= 3) cueTick(cues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, running]);

  // ---- When a countdown reaches zero, transition phase ----
  useEffect(() => {
    if (remaining !== 0 || !running) return;
    if (phase === 'rest') {
      cueGo(cues);
      setPhase('work');
      setRunning(false);
      advanceWithinBlockAfterRest();
    } else if (phase === 'work' && block && isTimed(block)) {
      cueGo(cues);
      finishSet();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, running]);

  function startTimedWork() {
    if (!block) return;
    primeAudio();
    const t = block.timeSec ?? 30;
    setRemaining(t);
    setRunning(true);
  }

  function beginRest() {
    const rest = block?.restSec ?? 0;
    if (rest <= 0) {
      goToNextSet();
      return;
    }
    primeAudio();
    setPhase('rest');
    setRemaining(rest);
    setRunning(true);
  }

  // Mark current set complete; either rest, or advance.
  function finishSet() {
    setRunning(false);
    if (setNo + 1 < sets) {
      beginRest();
    } else {
      markBlockDone();
      goToNextBlock();
    }
  }

  function advanceWithinBlockAfterRest() {
    goToNextSet();
  }

  function goToNextSet() {
    setSetNo((n) => n + 1);
    setPhase('work');
    setRemaining(0);
    setRunning(false);
  }

  function markBlockDone() {
    setCompleted((prev) => new Set(prev).add(idx));
  }

  function goToNextBlock() {
    if (idx + 1 < flow.length) {
      setIdx((i) => i + 1);
      setSetNo(0);
      setPhase('work');
      setRemaining(0);
      setRunning(false);
    } else {
      cueFinish(cues);
      setPhase('done');
    }
  }

  function skipBlock() {
    goToNextBlock();
  }

  function skipRest() {
    setRunning(false);
    setRemaining(0);
    cueGo(cues);
    setPhase('work');
    goToNextSet();
  }

  // ---- Build the log on finish ----
  function buildLog(rpe: number | undefined, notes: string): SessionLog {
    let totalReps = 0;
    let totalSwings = 0;
    let volumeKg = 0;
    for (const b of flow) {
      if (!completed.has(b.blockKey)) continue;
      const est = estimateBlock(b, resolveLoadKg(b.load, profile));
      totalReps += est.reps;
      totalSwings += est.swings;
      volumeKg += est.volumeKg;
    }
    return {
      id: uuid(),
      sessionId: session.id,
      date: new Date().toISOString(),
      durationSec: Math.floor((Date.now() - startRef.current) / 1000),
      totalReps,
      totalSwings,
      volumeKg,
      rpe,
      notes: notes.trim() || undefined,
      completedBlocks: [...completed],
    };
  }

  if (phase === 'done') {
    return <Summary session={session} flow={flow} completed={completed} profile={profile} elapsed={elapsed} onSave={(rpe, notes) => onComplete(buildLog(rpe, notes))} />;
  }

  if (!block) return null;
  const ex = getExercise(block.exerciseId);
  const desc = describeBlock(block);
  const progress = (idx + (phase === 'rest' ? 0.5 : setNo / sets)) / flow.length;

  return (
    <div className="fixed inset-0 z-40 bg-ink flex flex-col safe-top safe-bottom anim-fade-in">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-5 pt-3 pb-2">
        <button onClick={onExit} aria-label="Exit" className="grid place-items-center h-9 w-9 rounded-full bg-surface text-fg-dim active:scale-95 transition">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-ember rounded-full transition-all duration-500" style={{ width: `${progress * 100}%` }} />
          </div>
        </div>
        <span className="tnum text-sm text-fg-dim w-12 text-right">{clock(elapsed)}</span>
      </div>

      {/* Section label */}
      <div className="px-5 mt-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-ember-soft">{block.section}</span>
        <span className="text-xs text-fg-faint">
          {idx + 1} / {flow.length}
        </span>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center" key={`${idx}-${setNo}-${phase}`}>
        {phase === 'rest' ? (
          <div className="anim-pop flex flex-col items-center">
            <span className="text-fg-dim mb-4 uppercase text-sm tracking-wider">Rest</span>
            <Ring progress={block.restSec ? remaining / block.restSec : 0} size={220} stroke={10} color="var(--color-steel)">
              <div className="text-center">
                <div className="tnum text-6xl font-bold">{remaining}</div>
                <div className="text-fg-faint text-sm mt-1">up next: set {setNo + 2}</div>
              </div>
            </Ring>
            <button onClick={skipRest} className="mt-8 px-6 py-3 rounded-full bg-surface-2 text-fg font-medium active:scale-95 transition">
              Skip rest
            </button>
          </div>
        ) : (
          <div className="anim-fade-up w-full max-w-sm">
            <button onClick={() => onShowExercise(ex.id)} className="inline-flex items-center gap-1.5 text-fg-dim text-sm mb-3 active:opacity-70">
              <Info size={16} /> form & cues
            </button>
            <h1 className="text-3xl font-bold leading-tight">{ex.name}</h1>

            <div className="mt-6 mb-2">
              <div className="text-5xl font-bold text-ember tnum">{desc.primary}</div>
              {desc.sub && <div className="text-fg-dim mt-2 text-sm">{desc.sub}</div>}
            </div>

            {loadKg > 0 ? (
              <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-full bg-surface text-sm">
                <span className="text-fg-faint">{LOAD_LABEL[block.load]}</span>
                <span className="font-semibold">{formatWeight(loadKg, profile.unit)}</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-full bg-surface text-sm text-fg-dim">
                Bodyweight
              </div>
            )}

            {block.note && <p className="mt-5 text-fg-dim text-sm leading-relaxed">{block.note}</p>}

            {/* Top coaching cue for quick reference */}
            <p className="mt-4 text-fg-faint text-xs">“{ex.cues[0]}”</p>

            {/* Set tracker dots */}
            {sets > 1 && (
              <div className="flex gap-1.5 justify-center mt-7">
                {Array.from({ length: sets }).map((_, i) => (
                  <div key={i} className={`h-2 w-2 rounded-full ${i < setNo ? 'bg-ember' : i === setNo ? 'bg-ember anim-pulse' : 'bg-white/15'}`} />
                ))}
              </div>
            )}

            {/* Timed work countdown */}
            {isTimed(block) && (remaining > 0 || running) && (
              <div className="mt-6 tnum text-5xl font-bold text-steel">{clock(remaining)}</div>
            )}
          </div>
        )}
      </div>

      {/* Action bar */}
      {phase === 'work' && (
        <div className="px-5 pb-4 space-y-3">
          <div className="text-center text-sm text-fg-faint">
            Set {setNo + 1} of {sets}
          </div>
          {isTimed(block) ? (
            running ? (
              <button onClick={() => setRunning(false)} className="w-full py-4 rounded-2xl bg-surface-2 text-fg font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition">
                <Pause size={20} /> Pause
              </button>
            ) : remaining > 0 ? (
              <button onClick={() => setRunning(true)} className="w-full py-4 rounded-2xl bg-ember text-ink font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition">
                <Play size={20} /> Resume
              </button>
            ) : (
              <button onClick={startTimedWork} className="w-full py-4 rounded-2xl bg-ember text-ink font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition glow-ember">
                <Play size={20} /> Start {fmtDur(block.timeSec ?? 0)}
              </button>
            )
          ) : (
            <button onClick={finishSet} className="w-full py-4 rounded-2xl bg-ember text-ink font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition glow-ember">
              <Check size={20} /> {setNo + 1 < sets ? 'Set done' : 'Finish exercise'}
            </button>
          )}
          <button onClick={skipBlock} className="w-full py-2.5 text-fg-faint text-sm flex items-center justify-center gap-1.5 active:opacity-70">
            <Skip size={15} /> Skip exercise
          </button>
        </div>
      )}
    </div>
  );
}

// ---- End-of-session summary ----
function Summary({
  session,
  flow,
  completed,
  profile,
  elapsed,
  onSave,
}: {
  session: Session;
  flow: FlowBlock[];
  completed: Set<number>;
  profile: Profile;
  elapsed: number;
  onSave: (rpe: number | undefined, notes: string) => void;
}) {
  const [rpe, setRpe] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState('');

  const totals = flow.reduce(
    (acc, b) => {
      if (!completed.has(b.blockKey)) return acc;
      const est = estimateBlock(b, resolveLoadKg(b.load, profile));
      acc.reps += est.reps;
      acc.swings += est.swings;
      acc.volume += est.volumeKg;
      return acc;
    },
    { reps: 0, swings: 0, volume: 0 },
  );

  return (
    <div className="fixed inset-0 z-40 bg-ink flex flex-col safe-top safe-bottom overflow-y-auto no-scrollbar anim-fade-in">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center max-w-md mx-auto w-full">
        <div className="h-20 w-20 rounded-3xl bg-mint/15 grid place-items-center text-mint anim-pop">
          <Trophy size={44} />
        </div>
        <h1 className="text-3xl font-bold mt-5">Session complete</h1>
        <p className="text-fg-dim mt-1">{session.title}</p>

        <div className="grid grid-cols-2 gap-3 w-full mt-7">
          <Stat label="Time" value={clock(elapsed)} />
          <Stat label="Swings / snatches" value={`${totals.swings}`} />
          <Stat label="Total reps" value={`${totals.reps}`} />
          <Stat label="Volume" value={totals.volume > 0 ? formatWeight(totals.volume, profile.unit) : '—'} />
        </div>

        <div className="w-full mt-7 text-left">
          <label className="text-sm text-fg-dim">How hard was it? (RPE)</label>
          <div className="flex gap-1.5 mt-2">
            {Array.from({ length: 10 }).map((_, i) => {
              const v = i + 1;
              return (
                <button
                  key={v}
                  onClick={() => setRpe(v)}
                  className={`flex-1 h-10 rounded-lg text-sm font-semibold tnum transition ${
                    rpe === v ? 'bg-ember text-ink' : 'bg-surface text-fg-dim'
                  }`}
                >
                  {v}
                </button>
              );
            })}
          </div>
        </div>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes — how it felt, weights used, what to tweak…"
          rows={3}
          className="w-full mt-5 p-4 rounded-2xl bg-surface border border-hairline text-fg placeholder:text-fg-faint resize-none focus:outline-none focus:border-ember/50"
        />
      </div>

      <div className="px-5 pb-4">
        <button onClick={() => onSave(rpe, notes)} className="w-full py-4 rounded-2xl bg-ember text-ink font-semibold active:scale-[0.98] transition glow-ember">
          Save & finish
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <div className="tnum text-2xl font-bold">{value}</div>
      <div className="text-xs text-fg-faint mt-0.5">{label}</div>
    </div>
  );
}
