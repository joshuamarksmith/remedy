import { useRef, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import type { AppData, Profile, Unit } from '../types';
import { COMMON_BELLS_KG, formatWeight, kgToLb } from '../lib/units';
import { downloadBackup, parseImport } from '../lib/storage';
import { computeStats } from '../lib/progress';
import { Download, Upload, Check, Kettlebell, Info } from './icons';

export function Settings({
  data,
  onPatchProfile,
  onImportData,
  onReset,
}: {
  data: AppData;
  onPatchProfile: (patch: Partial<Profile>) => void;
  onImportData: (data: AppData) => void;
  onReset: () => void;
}) {
  const { profile } = data;
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const stats = computeStats(data);

  function flash(kind: 'ok' | 'err', text: string) {
    setMsg({ kind, text });
    setTimeout(() => setMsg(null), 3500);
  }

  function handleExport() {
    downloadBackup(data);
    flash('ok', 'Backup downloaded. Keep it somewhere safe.');
  }

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const res = parseImport(String(reader.result));
      if (res.ok && res.data) {
        onImportData(res.data);
        flash('ok', `Restored ${res.data.logs.length} sessions from backup.`);
      } else {
        flash('err', res.error ?? 'Import failed.');
      }
    };
    reader.onerror = () => flash('err', 'Could not read that file.');
    reader.readAsText(file);
    e.target.value = '';
  }

  function toggleBell(kg: number) {
    const bells = profile.bells.includes(kg)
      ? profile.bells.filter((b) => b !== kg)
      : [...profile.bells, kg].sort((a, b) => a - b);
    if (bells.length === 0) return;
    const working = bells.includes(profile.workingBell) ? profile.workingBell : bells[Math.floor(bells.length / 2)];
    onPatchProfile({ bells, workingBell: working });
  }

  return (
    <div className="px-5 pt-2 pb-28 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-5">Settings</h1>

      {msg && (
        <div className={`mb-4 p-3 rounded-xl text-sm anim-fade-up ${msg.kind === 'ok' ? 'bg-mint/15 text-mint' : 'bg-ember/15 text-ember-soft'}`}>
          {msg.text}
        </div>
      )}

      {/* Backup — front and center */}
      <Section title="Your data" subtitle="Everything lives on this device. Back it up so you never lose progress.">
        <div className="grid grid-cols-2 gap-3">
          <button onClick={handleExport} className="card p-4 flex flex-col items-center gap-1.5 active:scale-95 transition">
            <Download size={22} className="text-ember" />
            <span className="font-medium text-sm">Export backup</span>
            <span className="text-[11px] text-fg-faint">save to a file</span>
          </button>
          <button onClick={() => fileRef.current?.click()} className="card p-4 flex flex-col items-center gap-1.5 active:scale-95 transition">
            <Upload size={22} className="text-steel" />
            <span className="font-medium text-sm">Import backup</span>
            <span className="text-[11px] text-fg-faint">restore from a file</span>
          </button>
        </div>
        <input ref={fileRef} type="file" accept="application/json,.json" onChange={handleFile} className="hidden" />
        <p className="text-xs text-fg-faint mt-3 flex items-start gap-1.5">
          <Info size={14} className="mt-0.5 shrink-0" />
          Pood also keeps a second on-device copy automatically, so a glitch won't wipe your history.
        </p>
      </Section>

      {/* Units */}
      <Section title="Units">
        <div className="flex gap-2">
          {(['kg', 'lb'] as Unit[]).map((u) => (
            <button
              key={u}
              onClick={() => onPatchProfile({ unit: u })}
              className={`flex-1 py-2.5 rounded-xl font-medium transition ${profile.unit === u ? 'bg-ember text-ink' : 'card text-fg-dim'}`}
            >
              {u}
            </button>
          ))}
        </div>
      </Section>

      {/* Bells */}
      <Section title="Your kettlebells" subtitle="Tap to add or remove. The plan scales to what you own.">
        <div className="grid grid-cols-4 gap-2">
          {COMMON_BELLS_KG.map((kg) => {
            const on = profile.bells.includes(kg);
            return (
              <button
                key={kg}
                onClick={() => toggleBell(kg)}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center transition active:scale-95 ${
                  on ? 'bg-ember/20 border border-ember/50' : 'card text-fg-dim'
                }`}
              >
                <span className="font-bold tnum">{profile.unit === 'kg' ? kg : Math.round(kgToLb(kg))}</span>
                {on && <Check size={13} className="text-ember" />}
              </button>
            );
          })}
        </div>
      </Section>

      {/* Working bell */}
      <Section title="Working bell" subtitle="The weight most sets are built around.">
        <div className="flex flex-wrap gap-2">
          {profile.bells.map((kg) => (
            <button
              key={kg}
              onClick={() => onPatchProfile({ workingBell: kg })}
              className={`px-4 py-2.5 rounded-xl font-semibold transition active:scale-95 ${
                profile.workingBell === kg ? 'bg-ember text-ink' : 'card text-fg-dim'
              }`}
            >
              {formatWeight(kg, profile.unit)}
            </button>
          ))}
        </div>
      </Section>

      {/* Cues */}
      <Section title="Timer cues">
        <Toggle label="Sound" value={profile.soundOn} onChange={(v) => onPatchProfile({ soundOn: v })} />
        <Toggle label="Vibration" value={profile.vibrateOn} onChange={(v) => onPatchProfile({ vibrateOn: v })} />
      </Section>

      {/* Danger zone */}
      <Section title="Reset">
        {!confirmReset ? (
          <button onClick={() => setConfirmReset(true)} className="w-full py-3 rounded-xl card text-ember-soft font-medium active:scale-[0.99] transition">
            Erase all data & start over
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-fg-dim">This deletes your {stats.sessionsDone} logged sessions and settings. Export a backup first if you want to keep them.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmReset(false)} className="flex-1 py-3 rounded-xl card font-medium">
                Cancel
              </button>
              <button
                onClick={() => {
                  onReset();
                  setConfirmReset(false);
                  flash('ok', 'Reset complete.');
                }}
                className="flex-1 py-3 rounded-xl bg-ember text-ink font-semibold"
              >
                Erase
              </button>
            </div>
          </div>
        )}
      </Section>

      <div className="mt-8 text-center text-fg-faint">
        <Kettlebell size={28} className="mx-auto mb-1.5 opacity-60" />
        <div className="text-sm font-medium text-fg-dim">Pood</div>
        <div className="text-xs">8-week kettlebell training · works offline</div>
      </div>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="mt-6">
      <h2 className="font-semibold">{title}</h2>
      {subtitle && <p className="text-sm text-fg-dim mt-0.5 mb-3">{subtitle}</p>}
      {!subtitle && <div className="mb-3" />}
      {children}
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)} className="w-full flex items-center justify-between py-2.5">
      <span className="text-fg">{label}</span>
      <span className={`relative h-7 w-12 rounded-full transition ${value ? 'bg-ember' : 'bg-white/15'}`}>
        <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition-all ${value ? 'left-[22px]' : 'left-0.5'}`} />
      </span>
    </button>
  );
}
