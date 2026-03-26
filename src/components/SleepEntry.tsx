import { memo, useState } from 'react';
import type { SleepRecord, BACState } from '../lib/bac';

interface SleepEntryProps {
  /** Date key (YYYY-MM-DD) for last night */
  date: string;
  /** Existing record for this date, if already entered */
  existing: SleepRecord | null;
  /** BAC state from last night's session (for comparison) */
  bacState: BACState;
  onSave: (record: SleepRecord) => void;
}

/** Baseline REM from Ohayon et al. 2004 (~20-25% of 8h sleep) */
const BASELINE_REM_HOURS = 1.6;

export const SleepEntry = memo(function SleepEntry({ date, existing, bacState, onSave }: SleepEntryProps) {
  const [remHours, setRemHours] = useState(() => existing?.remHours?.toString() ?? '');
  const [deepHours, setDeepHours] = useState(() => existing?.deepSleepHours?.toString() ?? '');
  const [saved, setSaved] = useState(!!existing);

  const canSave = remHours !== '' && deepHours !== '' &&
    parseFloat(remHours) >= 0 && parseFloat(deepHours) >= 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      date,
      remHours: parseFloat(remHours),
      deepSleepHours: parseFloat(deepHours),
      enteredAt: Date.now(),
    });
    setSaved(true);
  };

  const predictedRemHours = Math.max(0, BASELINE_REM_HOURS - bacState.remReductionMinutes / 60);
  const actualRem = parseFloat(remHours);

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-text-secondary">Last night's sleep</p>
          <p className="text-[10px] text-accent-blue/60 uppercase tracking-wider font-medium">Experimental</p>
        </div>
        <span className="text-xs text-text-muted">{date}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-text-muted block mb-1">REM sleep (hrs)</label>
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            min="0"
            max="8"
            placeholder="e.g. 1.5"
            value={remHours}
            onChange={(e) => { setRemHours(e.target.value); setSaved(false); }}
            className="w-full bg-white/5 border border-border-glass rounded-lg px-3 py-2 text-text-primary outline-none focus:border-accent-teal/50 text-center placeholder:text-text-muted/50"
          />
        </div>
        <div>
          <label className="text-xs text-text-muted block mb-1">Deep sleep (hrs)</label>
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            min="0"
            max="8"
            placeholder="e.g. 1.0"
            value={deepHours}
            onChange={(e) => { setDeepHours(e.target.value); setSaved(false); }}
            className="w-full bg-white/5 border border-border-glass rounded-lg px-3 py-2 text-text-primary outline-none focus:border-accent-teal/50 text-center placeholder:text-text-muted/50"
          />
        </div>
      </div>

      {!saved && (
        <button
          onClick={handleSave}
          disabled={!canSave}
          className="w-full py-2 rounded-lg text-sm font-medium bg-accent-teal/15 text-accent-teal border border-accent-teal/20 disabled:opacity-30 transition-colors press-bounce"
        >
          Save
        </button>
      )}

      {saved && !isNaN(actualRem) && (
        <div className="space-y-2 pt-2 border-t border-border-glass animate-slide-up">
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <p className="text-lg font-bold text-text-primary">{actualRem.toFixed(1)}h</p>
              <p className="text-[11px] text-text-muted">your REM</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-text-primary">{predictedRemHours.toFixed(1)}h</p>
              <p className="text-[11px] text-text-muted">we predicted</p>
            </div>
          </div>

          <p className="text-xs text-text-muted text-center">
            {Math.abs(actualRem - predictedRemHours) < 0.3
              ? 'Pretty close: the model tracked well last night'
              : actualRem > predictedRemHours
                ? 'You beat the prediction: the model was too pessimistic'
                : 'Model was optimistic: your REM took a bigger hit than expected'}
          </p>

          <p className="text-[10px] text-text-muted/50 text-center">
            This resets each day. It's just a quick spot-check, not a trend
          </p>
        </div>
      )}
    </div>
  );
});
