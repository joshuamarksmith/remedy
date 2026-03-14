import { memo } from 'react';
import type { UserProfile } from '../lib/bac';

const LBS_PER_KG = 2.20462;

interface SettingsProps {
  profile: UserProfile;
  onUpdate: (profile: UserProfile) => void;
}

export const Settings = memo(function Settings({ profile, onUpdate }: SettingsProps) {
  const weightLbs = Math.round(profile.weightKg * LBS_PER_KG);

  return (
    <div className="stagger-children space-y-4 py-2">
      <h2 className="text-sm font-medium text-text-secondary mb-3">Your Profile</h2>

      {/* Weight */}
      <div className="card p-4">
        <label className="text-sm text-text-secondary block mb-2">Body Weight</label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={weightLbs}
            onChange={(e) => {
              const lbs = parseFloat(e.target.value);
              if (lbs > 0) {
                onUpdate({ ...profile, weightKg: lbs / LBS_PER_KG });
              }
            }}
            className="flex-1 bg-transparent border border-border-glass rounded-lg px-3 py-2 text-text-primary outline-none focus:border-accent-teal/50 text-lg"
          />
          <span className="text-text-muted text-sm">lbs</span>
        </div>
        <p className="text-xs text-text-muted mt-1">
          ≈ {Math.round(profile.weightKg)} kg
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
            <strong className="text-text-secondary">REM-safe time</strong> = time until
            BAC reaches zero + 1 hour buffer for sleep architecture to normalize.
          </p>
          <p className="pt-1 border-t border-border-glass">
            Sources: Ebrahim et al. 2013, Colrain et al. 2014, Gardiner et al. 2024
          </p>
        </div>
      </div>
    </div>
  );
});
