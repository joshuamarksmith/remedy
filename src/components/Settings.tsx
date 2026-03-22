import { memo, useState } from 'react';
import type { UserProfile } from '../lib/bac';
import {
  isNotificationEnabled,
  setNotificationEnabled,
  requestPermission,
  cancelREMClearNotification,
} from '../lib/notifications';

const LBS_PER_KG = 2.20462;

function lbsToKg(lbs: number): number {
  return lbs / LBS_PER_KG;
}

function kgToLbs(kg: number): number {
  return Math.round(kg * LBS_PER_KG);
}

interface SettingsProps {
  profile: UserProfile;
  onUpdate: (profile: UserProfile) => void;
  onReset: () => void;
  onAddHistorical: (timestamp: number, standardDrinks: number) => void;
  onNotificationsChanged: (enabled: boolean) => void;
  showSetupPrompt?: boolean;
}

export const Settings = memo(function Settings({ profile, onUpdate, onReset, onAddHistorical, onNotificationsChanged, showSetupPrompt }: SettingsProps) {
  const [weightInput, setWeightInput] = useState(() => String(kgToLbs(profile.weightKg)));
  const [editingWeight, setEditingWeight] = useState(false);
  const displayWeight = editingWeight ? weightInput : String(kgToLbs(profile.weightKg));
  const [confirmReset, setConfirmReset] = useState(false);
  const [notifyEnabled, setNotifyEnabled] = useState(() => isNotificationEnabled());
  const [showAddPast, setShowAddPast] = useState(false);
  const [pastDate, setPastDate] = useState('');
  const [pastTime, setPastTime] = useState('20:00');
  const [pastAmount, setPastAmount] = useState('1');
  const [pastConfirmation, setPastConfirmation] = useState('');
  const [notifyDenied, setNotifyDenied] = useState(false);

  return (
    <div className="stagger-children space-y-4 py-2">
      {showSetupPrompt && (
        <div className="card p-4 border border-accent-teal/30 bg-accent-teal/5">
          <p className="text-sm font-medium text-text-primary">Set up your profile</p>
          <p className="text-xs text-text-secondary mt-1">
            Confirm your weight, sex, and usual bedtime below for accurate BAC estimates.
          </p>
        </div>
      )}
      <h2 className="text-sm font-medium text-text-secondary mb-3">Your Profile</h2>

      {/* Weight */}
      <div className="card p-4">
        <label className="text-sm text-text-secondary block mb-2">Body Weight</label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            inputMode="numeric"
            value={displayWeight}
            onFocus={() => {
              setEditingWeight(true);
              setWeightInput(String(kgToLbs(profile.weightKg)));
            }}
            onChange={(e) => {
              setWeightInput(e.target.value);
              const lbs = parseFloat(e.target.value);
              if (lbs > 0) {
                onUpdate({ ...profile, weightKg: lbsToKg(lbs) });
              }
            }}
            onBlur={() => {
              setEditingWeight(false);
              const lbs = parseFloat(weightInput);
              if (lbs > 0) {
                onUpdate({ ...profile, weightKg: lbsToKg(lbs) });
              }
            }}
            className="flex-1 bg-transparent border border-border-glass rounded-lg px-3 py-2 text-text-primary outline-none focus:border-accent-teal/50 text-lg"
          />
          <span className="text-text-muted text-sm">lbs</span>
        </div>
        <p className="text-xs text-text-muted mt-1">
          ≈ {Math.round(lbsToKg(parseFloat(displayWeight) || 0))} kg
        </p>
      </div>

      {/* Sex */}
      <div className="card p-4">
        <label className="text-sm text-text-secondary block mb-2">Biological Sex</label>
        <div className="flex gap-2">
          {(['male', 'female'] as const).map((sex) => (
            <button
              key={sex}
              onClick={() => onUpdate({ ...profile, sex })}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                profile.sex === sex
                  ? 'bg-accent-teal/20 text-accent-teal border border-accent-teal/40'
                  : 'bg-white/5 text-text-muted border border-transparent'
              }`}
            >
              {sex === 'male' ? 'Male' : 'Female'}
            </button>
          ))}
        </div>
        <p className="text-xs text-text-muted mt-2">
          Affects metabolism rate (Widmark factor: {profile.sex === 'male' ? '0.68' : '0.55'})
        </p>
      </div>

      {/* Bedtime */}
      <div className="card p-4">
        <label className="text-sm text-text-secondary block mb-2">Usual Bedtime</label>
        <input
          type="time"
          value={profile.bedtime}
          onChange={(e) => onUpdate({ ...profile, bedtime: e.target.value })}
          className="w-full bg-transparent border border-border-glass rounded-lg px-3 py-2 text-text-primary outline-none focus:border-accent-teal/50 text-lg"
        />
      </div>

      {/* REM-Clear Notification */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-text-secondary">REM-clear notification</p>
            <p className="text-xs text-text-muted mt-0.5">Get notified when your sleep is no longer impacted</p>
          </div>
          <button
            onClick={async () => {
              if (isNotificationEnabled()) {
                setNotificationEnabled(false);
                cancelREMClearNotification();
                setNotifyEnabled(false);
                onNotificationsChanged(false);
              } else {
                setNotifyDenied(false);
                const granted = await requestPermission();
                if (granted) {
                  setNotificationEnabled(true);
                  setNotifyEnabled(true);
                  onNotificationsChanged(true);
                } else {
                  setNotifyDenied(true);
                }
              }
            }}
            className={`w-12 h-7 shrink-0 rounded-full transition-colors relative overflow-hidden ${
              notifyEnabled ? 'bg-accent-teal' : 'bg-white/10'
            }`}
          >
            <div
              className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                notifyEnabled ? 'translate-x-[1.375rem]' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        {notifyDenied && (
          <p className="text-xs text-accent-red mt-2 animate-slide-up">
            Notifications are blocked. Check your browser or device settings to allow them.
          </p>
        )}
      </div>

      {/* Experimental Features */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-text-secondary">Sleep tracking</p>
            <p className="text-xs text-text-muted mt-0.5">
              Log actual REM &amp; deep sleep to compare against predictions
            </p>
          </div>
          <button
            onClick={() => onUpdate({ ...profile, experimentalSleep: !profile.experimentalSleep })}
            className={`w-12 h-7 shrink-0 rounded-full transition-colors relative overflow-hidden ${
              profile.experimentalSleep ? 'bg-accent-teal' : 'bg-white/10'
            }`}
          >
            <div
              className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                profile.experimentalSleep ? 'translate-x-[1.375rem]' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        <p className="text-[10px] text-accent-blue/60 mt-2 uppercase tracking-wider font-medium">Experimental</p>
      </div>

      {/* Science Info */}
      <div className="card p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-2">How it works</h3>
        <div className="space-y-2 text-xs text-text-muted">
          <p>
            <strong className="text-text-secondary">BAC</strong> is estimated using the
            Widmark formula, the gold standard in forensic toxicology.
          </p>
          <p>
            <strong className="text-text-secondary">REM impact</strong> is based on
            Gardiner et al. 2024 meta-analysis of 27 studies: each g/kg of alcohol
            reduces REM by ~40 minutes.
          </p>
          <p>
            <strong className="text-text-secondary">Sleep clear</strong> = when remaining alcohol
            would reduce REM by less than 10 minutes — a negligible impact.
          </p>
          <p className="pt-1 border-t border-border-glass">
            Sources: Ebrahim et al. 2013, Colrain et al. 2014, Gardiner et al. 2024
          </p>
        </div>
      </div>

      {/* Add Past Drinks */}
      <div className="card p-4">
        <button
          onClick={() => setShowAddPast(!showAddPast)}
          className="w-full flex items-center justify-between"
        >
          <h3 className="text-sm font-medium text-text-secondary">Add past drinks</h3>
          <span className={`text-text-muted text-xs transition-transform duration-200 ${showAddPast ? 'rotate-180' : ''}`}>
            ▾
          </span>
        </button>
        {showAddPast && (
          <div className="mt-3 space-y-3 animate-slide-up">
            <p className="text-xs text-text-muted">
              Backfill drinks you forgot to log. Past dates go to history.
            </p>
            <div>
              <label className="text-xs text-text-muted block mb-1">Date</label>
              <input
                type="date"
                value={pastDate}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setPastDate(e.target.value)}
                className="w-full bg-transparent border border-border-glass rounded-lg px-3 py-2 text-text-primary outline-none focus:border-accent-teal/50"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">Time</label>
              <input
                type="time"
                value={pastTime}
                onChange={(e) => setPastTime(e.target.value)}
                className="w-full bg-transparent border border-border-glass rounded-lg px-3 py-2 text-text-primary outline-none focus:border-accent-teal/50"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">Standard drinks</label>
              <input
                type="number"
                inputMode="decimal"
                step="0.5"
                min="0.5"
                max="20"
                value={pastAmount}
                onChange={(e) => setPastAmount(e.target.value)}
                className="w-full bg-transparent border border-border-glass rounded-lg px-3 py-2 text-text-primary outline-none focus:border-accent-teal/50"
              />
            </div>
            <button
              onClick={() => {
                if (!pastDate) return;
                const val = parseFloat(pastAmount);
                if (!val || val <= 0) return;
                const [y, mo, d] = pastDate.split('-').map(Number);
                const [h, m] = pastTime.split(':').map(Number);
                const ts = new Date(y, mo - 1, d, h, m).getTime();
                onAddHistorical(ts, val);
                setPastConfirmation(`Added ${val} drink${val !== 1 ? 's' : ''} on ${pastDate}`);
                setPastAmount('1');
                setTimeout(() => setPastConfirmation(''), 3000);
              }}
              disabled={!pastDate || !pastAmount || parseFloat(pastAmount) <= 0}
              className="w-full py-2 rounded-lg text-sm font-medium bg-accent-teal/15 text-accent-teal border border-accent-teal/20 disabled:opacity-30 transition-colors"
            >
              Add to history
            </button>
            {pastConfirmation && (
              <p className="text-xs text-accent-green animate-pop-in">{pastConfirmation}</p>
            )}
          </div>
        )}
      </div>

      {/* Reset App */}
      <div className="card p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-2">Reset</h3>
        {!confirmReset ? (
          <button
            onClick={() => setConfirmReset(true)}
            className="w-full py-2 rounded-lg text-sm font-medium bg-white/5 text-red-400 border border-red-400/20 hover:bg-red-400/10 transition-colors"
          >
            Reset app to first-run state
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-red-400">
              This clears all data (drinks, profile, history) and returns to onboarding. Are you sure?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmReset(false)}
                className="flex-1 py-2 rounded-lg text-sm font-medium bg-white/5 text-text-muted border border-transparent"
              >
                Cancel
              </button>
              <button
                onClick={onReset}
                className="flex-1 py-2 rounded-lg text-sm font-medium bg-red-500/20 text-red-400 border border-red-400/40"
              >
                Yes, reset everything
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Disclaimer */}
      <div className="card p-4">
        <div className="space-y-2 text-xs text-text-muted leading-relaxed">
          <p>
            <span className="font-medium text-text-secondary">Disclaimer:</span>{' '}
            Remedy is for informational and educational purposes only. It is not a
            medical device and does not provide medical advice, diagnosis, or treatment.
          </p>
          <p>
            BAC estimates are approximate and vary based on many factors not captured
            here (food intake, medications, hydration, liver health, tolerance,
            genetic variation). Actual impairment may differ significantly from
            displayed estimates.
          </p>
          <p className="font-medium text-red-400/80">
            Never use this app to determine whether it is safe to drive, operate
            machinery, or make any safety-critical decision.
          </p>
          <p>
            If you are concerned about your alcohol consumption, consult a healthcare
            professional or contact SAMHSA's National Helpline at 1-800-662-4357
            (free, confidential, 24/7).
          </p>
        </div>
      </div>
    </div>
  );
});
