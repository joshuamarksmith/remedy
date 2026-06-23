import { useState } from 'react';
import type { Experience, Profile, Unit } from '../types';
import { COMMON_BELLS_KG, defaultBells, formatWeight, kgToLb } from '../lib/units';
import { Kettlebell, ChevronRight, Check } from './icons';

const EXPERIENCE: { id: Experience; title: string; desc: string }[] = [
  { id: 'new', title: 'New to kettlebells', desc: "I'm starting from scratch or nearly so." },
  { id: 'returning', title: 'Some experience', desc: "I've swung a bell before but want structure." },
  { id: 'experienced', title: 'Experienced', desc: 'I train regularly and want progression.' },
];

export function Onboarding({ onDone }: { onDone: (p: Profile) => void }) {
  const [step, setStep] = useState(0);
  const [experience, setExperience] = useState<Experience>('new');
  const [unit, setUnit] = useState<Unit>('kg');
  const [bells, setBells] = useState<number[]>(defaultBells('new').bells);
  const [working, setWorking] = useState<number>(defaultBells('new').working);

  const pickExperience = (e: Experience) => {
    setExperience(e);
    const d = defaultBells(e);
    setBells(d.bells);
    setWorking(d.working);
    setStep(2);
  };

  const toggleBell = (kg: number) => {
    setBells((prev) => {
      const next = prev.includes(kg) ? prev.filter((b) => b !== kg) : [...prev, kg].sort((a, b) => a - b);
      if (!next.includes(working) && next.length) setWorking(next[Math.floor(next.length / 2)]);
      return next;
    });
  };

  const finish = () =>
    onDone({
      ...defaultProfile(),
      experience,
      unit,
      bells: bells.length ? bells : defaultBells(experience).bells,
      workingBell: working,
    });

  return (
    <div className="min-h-dvh flex flex-col safe-top safe-bottom px-6">
      {/* Progress dots */}
      <div className="flex gap-1.5 justify-center pt-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-ember' : 'w-1.5 bg-white/15'}`}
          />
        ))}
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        {step === 0 && (
          <div className="anim-fade-up text-center">
            <div className="mx-auto mb-8 h-24 w-24 rounded-3xl bg-ember/15 grid place-items-center text-ember glow-ember">
              <Kettlebell size={56} />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Pood</h1>
            <p className="mt-3 text-fg-dim text-lg leading-relaxed">
              An 8-week kettlebell journey. From your first clean swing to the Simple standard.
            </p>
            <p className="mt-2 text-fg-faint text-sm">
              Built on hardstyle method. Yours to keep, fully offline.
            </p>
          </div>
        )}

        {step === 1 && (
          <div className="anim-fade-up">
            <h2 className="text-2xl font-bold mb-1">Where are you starting?</h2>
            <p className="text-fg-dim mb-6">We'll set your weights and pace from here.</p>
            <div className="space-y-3">
              {EXPERIENCE.map((e) => (
                <button
                  key={e.id}
                  onClick={() => pickExperience(e.id)}
                  className="w-full text-left card p-4 active:scale-[0.98] transition flex items-center gap-3"
                >
                  <div className="flex-1">
                    <div className="font-semibold">{e.title}</div>
                    <div className="text-sm text-fg-dim">{e.desc}</div>
                  </div>
                  <ChevronRight className="text-fg-faint" />
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="anim-fade-up">
            <h2 className="text-2xl font-bold mb-1">Which bells do you have?</h2>
            <p className="text-fg-dim mb-4">Tap all the kettlebells you own. We'll scale the plan to them.</p>

            <div className="flex gap-2 mb-5 text-sm">
              {(['kg', 'lb'] as Unit[]).map((u) => (
                <button
                  key={u}
                  onClick={() => setUnit(u)}
                  className={`px-4 py-1.5 rounded-full font-medium transition ${
                    unit === u ? 'bg-ember text-ink' : 'bg-surface text-fg-dim'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-4 gap-2.5">
              {COMMON_BELLS_KG.map((kg) => {
                const on = bells.includes(kg);
                return (
                  <button
                    key={kg}
                    onClick={() => toggleBell(kg)}
                    className={`aspect-square rounded-2xl flex flex-col items-center justify-center transition active:scale-95 ${
                      on ? 'bg-ember/20 border border-ember/50 text-fg' : 'card text-fg-dim'
                    }`}
                  >
                    <span className="text-lg font-bold tnum">
                      {unit === 'kg' ? kg : Math.round(kgToLb(kg))}
                    </span>
                    <span className="text-[10px] text-fg-faint">{unit}</span>
                    {on && <Check size={14} className="text-ember mt-0.5" />}
                  </button>
                );
              })}
            </div>

            <button
              disabled={bells.length === 0}
              onClick={() => setStep(3)}
              className="mt-7 w-full py-4 rounded-2xl bg-ember text-ink font-semibold disabled:opacity-40 active:scale-[0.98] transition"
            >
              Continue
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="anim-fade-up">
            <h2 className="text-2xl font-bold mb-1">Your working bell</h2>
            <p className="text-fg-dim mb-5">
              The weight most of your sets are built around. You can change it any time.
            </p>
            <div className="flex flex-wrap gap-2.5 justify-center">
              {bells.map((kg) => (
                <button
                  key={kg}
                  onClick={() => setWorking(kg)}
                  className={`px-5 py-3 rounded-2xl font-semibold transition active:scale-95 ${
                    working === kg ? 'bg-ember text-ink glow-ember' : 'card text-fg-dim'
                  }`}
                >
                  {formatWeight(kg, unit)}
                </button>
              ))}
            </div>
            <button
              onClick={finish}
              className="mt-9 w-full py-4 rounded-2xl bg-ember text-ink font-semibold active:scale-[0.98] transition"
            >
              Start training
            </button>
          </div>
        )}
      </div>

      {step === 0 && (
        <button
          onClick={() => setStep(1)}
          className="mb-6 mx-auto max-w-md w-full py-4 rounded-2xl bg-ember text-ink font-semibold active:scale-[0.98] transition"
        >
          Get started
        </button>
      )}
    </div>
  );
}

// Local copy so onboarding doesn't import storage defaults directly.
function defaultProfile(): Profile {
  return {
    unit: 'kg',
    bells: [8, 12, 16],
    workingBell: 12,
    experience: 'new',
    daysPerWeek: 3,
    soundOn: true,
    vibrateOn: true,
  };
}
