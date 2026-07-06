import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  calculateBACState,
  estimateRemReductionForSession,
  generateId,
  SESSION_ROLLOVER_HOURS,
  sessionDateKey,
  type Drink,
  type BACState,
} from './lib/bac';
import { loadDrinks, saveDrinks, loadProfile, saveProfile, hasOnboarded, setOnboarded, resetApp, addHistoricalDrink, loadSleepRecord, saveSleepRecord, loadSessionDrinks } from './lib/storage';
import { scheduleREMClearNotification, cancelREMClearNotification, clearNotificationState } from './lib/notifications';
import { Onboarding } from './components/Onboarding';
import type { UserProfile } from './lib/bac';
import { STATUS_TEXT_CLASS, STATUS_BORDER_CLASS, formatDrinkCount, formatTime, qualityFromBAC } from './lib/theme';
import { BACGauge } from './components/BACGauge';
import { BACChart } from './components/BACChart';
import { Timeline } from './components/Timeline';
import { DrinkLog } from './components/DrinkLog';
import { Settings } from './components/Settings';
import { SleepEntry } from './components/SleepEntry';
import type { SleepRecord } from './lib/bac';

type Tab = 'home' | 'timeline' | 'log' | 'settings';

// Monochrome SVG nav icons — consistent style across platforms
const NAV_ICONS: Record<Tab, React.ReactNode> = {
  home: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" fill="currentColor" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  ),
  timeline: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 18 9 11 14 14 20 6" />
      <polyline points="16 6 20 6 20 10" />
    </svg>
  ),
  log: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </svg>
  ),
  settings: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
};

const TABS: { id: Tab; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'log', label: 'Log' },
  { id: 'settings', label: 'Settings' },
];

// Stable empty list — keeps memo/effect dependencies quiet when what-if is off
const NO_HYPOTHETICAL_DRINKS: Drink[] = [];

// Drink presets — typical pours mapped to standard-drink equivalents.
// Users think in beers and glasses, not 14g units; showing the equivalence
// on every button teaches the conversion over time.
const DRINK_PRESETS: { label: string; std: number; desc: string }[] = [
  { label: 'Beer', std: 1, desc: '12oz · 5%' },
  { label: 'Wine', std: 1.2, desc: '6oz pour' },
  { label: 'Cocktail', std: 1.5, desc: 'mixed drink' },
  { label: 'Shot', std: 1, desc: '1.5oz liquor' },
];

function App() {
  const [showOnboarding, setShowOnboarding] = useState(() => !hasOnboarded());
  const [drinks, setDrinks] = useState<Drink[]>(() => loadDrinks());
  const [profile, setProfile] = useState<UserProfile>(() => loadProfile());
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [whatIfMode, setWhatIfMode] = useState(false);
  const [whatIfDrinks, setWhatIfDrinks] = useState(1);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [drinkPulse, setDrinkPulse] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showSetupPrompt, setShowSetupPrompt] = useState(false);
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now()); // refreshed every second

  // "Last night" = the previous drinking session (session days roll over at
  // 5 AM, matching storage). At 2 AM this is the night BEFORE the one in
  // progress — the one whose sleep you could actually have recorded.
  const lastNight = new Date(now - SESSION_ROLLOVER_HOURS * 60 * 60 * 1000);
  lastNight.setDate(lastNight.getDate() - 1);
  const lastNightDate = lastNight.toLocaleDateString('en-CA'); // YYYY-MM-DD

  const [sleepRecord, setSleepRecord] = useState<SleepRecord | null>(() =>
    profile.experimentalSleep ? loadSleepRecord(lastNightDate) : null
  );
  // NOTE: the `drinks` initializer above already ran loadDrinks(), which
  // archives a finished session into history — so last night's drinks are
  // reliably in history (or still live under lastNightDate's session key).
  const [lastNightDrinks, setLastNightDrinks] = useState<Drink[]>(() =>
    profile.experimentalSleep ? loadSessionDrinks(lastNightDate) : []
  );
  const pulseTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const undoTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Hypothetical drink pinned to the current moment ("one more right now")
  const hypotheticalDrinksList = useMemo<Drink[]>(
    () =>
      whatIfMode
        ? [{ id: 'hypothetical', timestamp: now, standardDrinks: whatIfDrinks }]
        : NO_HYPOTHETICAL_DRINKS,
    [whatIfMode, whatIfDrinks, now]
  );

  // If the app stays open across the 5 AM session rollover, archive the
  // finished session and start fresh — matching what a reload would do.
  // loadDrinks() detects the stale session key, archives, and returns [].
  const sessionKeyRef = useRef(sessionDateKey(now));
  const refreshClock = useCallback(() => {
    setNow(Date.now());
    const key = sessionDateKey(Date.now());
    if (key !== sessionKeyRef.current) {
      sessionKeyRef.current = key;
      setDrinks(loadDrinks());
      setWhatIfMode(false);
    }
  }, []);

  // Advance the clock every second so BAC and countdowns stay fresh
  useEffect(() => {
    const interval = setInterval(refreshClock, 1000);
    return () => clearInterval(interval);
  }, [refreshClock]);

  // Background tabs throttle timers — refresh the clock immediately when
  // the user returns so BAC, countdowns, and the session aren't stale
  useEffect(() => {
    const onVisible = () => {
      if (!document.hidden) refreshClock();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refreshClock]);

  // While sleep tracking is on, watch for the 5 AM session rollover and
  // reload last-night data when it happens (app left open overnight)
  const loadedSleepForRef = useRef(lastNightDate);
  useEffect(() => {
    if (!profile.experimentalSleep) return;
    const check = () => {
      const d = new Date(Date.now() - SESSION_ROLLOVER_HOURS * 60 * 60 * 1000);
      d.setDate(d.getDate() - 1);
      const key = d.toLocaleDateString('en-CA');
      if (key !== loadedSleepForRef.current) {
        loadedSleepForRef.current = key;
        setSleepRecord(loadSleepRecord(key));
        setLastNightDrinks(loadSessionDrinks(key));
      }
    };
    const interval = setInterval(check, 60 * 1000);
    return () => clearInterval(interval);
  }, [profile.experimentalSleep]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (pulseTimeout.current) clearTimeout(pulseTimeout.current);
      if (undoTimeout.current) clearTimeout(undoTimeout.current);
    };
  }, []);

  // Derive BAC state from LOGGED drinks only — the gauge, status card, and
  // timeline always reflect reality. What-if projections live in whatIfState.
  const bacState: BACState = useMemo(() => {
    if (drinks.length === 0) {
      // Fast path: no drinks, skip all computation
      return {
        currentBAC: 0,
        peakBAC: 0,
        timeToSoberMs: 0,
        soberAtTimestamp: now,
        remReductionMinutes: 0,
        remPercentReduction: 0,
        sleepQuality: 'safe' as const,
        lowImpactAtTimestamp: now,
        timeToLowImpactMs: 0,
      };
    }
    return calculateBACState(drinks, profile);
  }, [drinks, profile, now]);

  // Projected state if the hypothetical drink(s) were added right now
  const whatIfState: BACState | null = useMemo(
    () => (whatIfMode ? calculateBACState(drinks, profile, hypotheticalDrinksList) : null),
    [whatIfMode, drinks, profile, hypotheticalDrinksList]
  );

  // Predicted REM loss for last night's session (experimental sleep tracking)
  const lastNightPredictedRemLoss = useMemo(
    () => estimateRemReductionForSession(lastNightDrinks, profile, lastNightDate),
    [lastNightDrinks, profile, lastNightDate]
  );

  // Notification target from REAL drinks only — a what-if preview must never
  // schedule an OS notification. Recomputes only when logged drinks change,
  // and the threshold search is deterministic, so the effect below fires once
  // per drink change instead of every second.
  const notificationTarget = useMemo(() => {
    if (drinks.length === 0) return null;
    const state = calculateBACState(drinks, profile);
    return { at: state.lowImpactAtTimestamp, quality: state.sleepQuality };
  }, [drinks, profile]);

  // Schedule/cancel REM-clear notification when logged drinks change
  useEffect(() => {
    if (!notificationTarget || notificationTarget.quality === 'safe' || notificationTarget.at <= Date.now()) {
      cancelREMClearNotification();
    } else {
      scheduleREMClearNotification(notificationTarget.at);
    }
    return () => cancelREMClearNotification();
  }, [notificationTarget]);

  // Persist on change (not in effects — direct in handlers)
  const updateDrinks = useCallback(
    (updater: (prev: Drink[]) => Drink[]) => {
      setDrinks((prev) => {
        const next = updater(prev);
        saveDrinks(next);
        return next;
      });
    },
    []
  );

  const updateProfile = useCallback((p: UserProfile) => {
    setProfile(p);
    saveProfile(p);
    // Load last-night data when sleep tracking is toggled on
    if (p.experimentalSleep && !profile.experimentalSleep) {
      setSleepRecord(loadSleepRecord(lastNightDate));
      setLastNightDrinks(loadSessionDrinks(lastNightDate));
    }
  }, [profile.experimentalSleep, lastNightDate]);

  const handleSaveSleep = useCallback((record: SleepRecord) => {
    saveSleepRecord(record);
    setSleepRecord(record);
  }, []);

  const addDrink = useCallback(
    (standardDrinks: number = 1) => {
      const id = generateId();
      updateDrinks((prev) => [
        ...prev,
        { id, timestamp: Date.now(), standardDrinks },
      ]);

      setLastAddedId(id);
      if (undoTimeout.current) clearTimeout(undoTimeout.current);
      undoTimeout.current = setTimeout(() => setLastAddedId(null), 5000);

      setDrinkPulse(true);
      if (pulseTimeout.current) clearTimeout(pulseTimeout.current);
      pulseTimeout.current = setTimeout(() => setDrinkPulse(false), 600);
    },
    [updateDrinks]
  );

  const undoLastDrink = useCallback(() => {
    if (lastAddedId) {
      updateDrinks((prev) => prev.filter((d) => d.id !== lastAddedId));
      setLastAddedId(null);
      if (undoTimeout.current) clearTimeout(undoTimeout.current);
    }
  }, [lastAddedId, updateDrinks]);

  const clearSession = useCallback(() => {
    updateDrinks(() => []);
    setShowResetConfirm(false);
    setWhatIfMode(false);
  }, [updateDrinks]);

  const removeDrink = useCallback(
    (id: string) => updateDrinks((prev) => prev.filter((d) => d.id !== id)),
    [updateDrinks]
  );

  const totalDrinks = useMemo(
    () => drinks.reduce((sum, d) => sum + d.standardDrinks, 0),
    [drinks]
  );

  const statusColor = STATUS_TEXT_CLASS[bacState.sleepQuality];
  const statusBorder = STATUS_BORDER_CLASS[bacState.sleepQuality];

  // Derived from the ticking clock so it rolls over at midnight
  const todayString = new Date(now).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  if (showOnboarding) {
    return (
      <Onboarding
        onComplete={() => {
          setOnboarded();
          setShowOnboarding(false);
          setActiveTab('settings');
          setShowSetupPrompt(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-dvh flex flex-col bg-bg-primary pb-20">
      {/* Header */}
      <header className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight text-text-primary">
            <span className="text-accent-teal">rem</span>edy
          </h1>
          <span className="text-sm text-text-muted">{todayString}</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 overflow-y-auto">
        {activeTab === 'home' && (
          <div className="stagger-children space-y-4">
            {/* BAC Gauge — colored by the BAC level itself; the status card
                below carries the bedtime-based sleep verdict */}
            <div className={`flex justify-center py-4 transition-transform duration-300 ${drinkPulse ? 'animate-drink-pop' : ''}`}>
              <BACGauge bac={bacState.currentBAC} quality={qualityFromBAC(bacState.currentBAC)} />
            </div>

            {/* Tonight's Sleep */}
            <div className={`card p-4 text-center border transition-all duration-500 ${drinks.length === 0 ? 'border-border-glass' : statusBorder}`}>
              {drinks.length === 0 ? (
                <>
                  <p className="text-lg font-semibold text-text-primary">
                    Tonight&rsquo;s a clean slate
                  </p>
                  <p className="text-sm text-text-secondary mt-1">
                    Log your first drink to start tracking tonight&rsquo;s impact.
                  </p>
                </>
              ) : bacState.sleepQuality === 'safe' ? (
                <>
                  <p className={`text-lg font-semibold transition-colors duration-500 ${statusColor}`}>
                    Your sleep is on track tonight
                  </p>
                  <p className="text-sm text-text-secondary mt-1">
                    {bacState.currentBAC >= 0.001
                      ? 'Still clearing alcohol, but your sleep tonight should be fine.'
                      : 'No alcohol left in your system. Sleep well!'}
                  </p>
                </>
              ) : (() => {
                // Is "wait until X" realistic advice? If the clear time is more
                // than 3 hours away, staying up that long is worse than sleeping
                // with alcohol \u2014 state the clear time as information instead.
                const waitIsRealistic = bacState.timeToLowImpactMs / (1000 * 60 * 60) <= 3;

                return (
                  <>
                    <p className={`text-lg font-semibold transition-colors duration-500 ${statusColor} ${bacState.sleepQuality === 'danger' ? 'animate-glow' : ''}`}>
                      {bacState.sleepQuality === 'danger'
                        ? 'Tonight\u2019s sleep will take a hit'
                        : 'Your sleep will be lighter tonight'}
                    </p>
                    <p className="text-sm text-text-secondary mt-1">
                      {bacState.sleepQuality === 'danger'
                        ? 'Alcohol is disrupting your body\u2019s ability to get restorative sleep.'
                        : `You could lose ~${Math.round(bacState.remReductionMinutes)} minutes of restorative sleep tonight.`}
                    </p>
                    {bacState.timeToLowImpactMs > 0 && (
                      <div className="mt-3 pt-3 border-t border-border-glass">
                        <p className="text-sm text-text-secondary">
                          {waitIsRealistic ? 'Wait until ' : 'Alcohol clears from your sleep around '}
                          <span className="font-semibold text-accent-teal">
                            {formatTime(bacState.lowImpactAtTimestamp)}
                          </span>
                          {waitIsRealistic ? ' for better sleep' : ''}
                        </p>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Add Drinks */}
            <div className="card p-4 space-y-3">
              <div className={`grid grid-cols-2 gap-2 ${drinkPulse ? 'animate-drink-pop' : ''}`}>
                {DRINK_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => addDrink(preset.std)}
                    className="py-3 rounded-xl text-center press-bounce bg-accent-teal/10 border border-accent-teal/20 hover:border-accent-teal/40"
                  >
                    <span className="block text-base font-medium text-accent-teal">
                      + {preset.label}
                    </span>
                    <span className="block text-[11px] text-text-muted mt-0.5">
                      {preset.desc} = {formatDrinkCount(preset.std)} std
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  min="0.1"
                  max="10"
                  placeholder="custom, e.g. 1.5"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="flex-1 bg-white/5 border border-border-glass rounded-xl px-3 py-2.5 text-text-primary outline-none focus:border-accent-teal/50 text-center text-lg placeholder:text-text-muted/50"
                />
                <button
                  onClick={() => {
                    const val = parseFloat(customAmount);
                    if (val >= 0.1 && val <= 10) {
                      addDrink(val);
                      setCustomAmount('');
                    }
                  }}
                  disabled={isNaN(parseFloat(customAmount)) || parseFloat(customAmount) < 0.1 || parseFloat(customAmount) > 10}
                  className="bg-accent-teal/15 text-accent-teal px-5 py-2.5 rounded-xl font-medium disabled:opacity-30 press-bounce"
                >
                  Add
                </button>
              </div>

              <p className="text-[11px] text-text-muted leading-relaxed">
                Presets are typical pours. Strong drinks count for more: a craft IPA or
                a double is ~1.5 to 2. Custom accepts 0.1 to 10 standard drinks.
              </p>
            </div>

            {/* Undo toast */}
            {lastAddedId && (
              <div className="card p-3 animate-slide-up space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">Drink added</span>
                  <button
                    onClick={undoLastDrink}
                    className="text-sm font-medium text-accent-teal active:scale-95 transition-transform"
                  >
                    Undo
                  </button>
                </div>
                {drinks.length % 2 === 0 && drinks.length > 0 && (
                  <p className="text-xs text-text-muted">Have a glass of water too</p>
                )}
              </div>
            )}

            {/* What-If */}
            <div className={`card p-4 transition-all duration-300 ${whatIfMode ? 'border border-accent-blue/20' : ''}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-secondary">
                  "What if I have one more?"
                </span>
                <button
                  onClick={() => setWhatIfMode(!whatIfMode)}
                  className={`w-12 h-7 shrink-0 rounded-full transition-colors relative overflow-hidden ${
                    whatIfMode ? 'bg-accent-blue' : 'bg-white/10'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                      whatIfMode ? 'translate-x-[1.375rem]' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              {whatIfMode && (
                <div className="animate-slide-up">
                  <div className="flex items-center gap-3 mb-2">
                    <button
                      onClick={() => setWhatIfDrinks(Math.max(1, whatIfDrinks - 1))}
                      className="w-8 h-8 rounded-full bg-white/10 text-text-primary font-bold active:scale-90 transition-transform"
                    >
                      −
                    </button>
                    <span className="text-lg font-semibold text-accent-blue min-w-[2ch] text-center">
                      {whatIfDrinks}
                    </span>
                    <button
                      onClick={() => setWhatIfDrinks(whatIfDrinks + 1)}
                      className="w-8 h-8 rounded-full bg-white/10 text-text-primary font-bold active:scale-90 transition-transform"
                    >
                      +
                    </button>
                    <span className="text-sm text-text-muted">
                      more drink{whatIfDrinks > 1 ? 's' : ''} right now
                    </span>
                  </div>
                  {whatIfState && (
                    <div className="mb-2 pt-2 border-t border-border-glass space-y-1">
                      <p className="text-sm text-text-secondary">
                        {whatIfState.timeToLowImpactMs > 0 ? (
                          <>
                            Sleep would clear at{' '}
                            <span className="font-semibold text-accent-blue">
                              {formatTime(whatIfState.lowImpactAtTimestamp)}
                            </span>
                            {whatIfState.lowImpactAtTimestamp - bacState.lowImpactAtTimestamp > 60 * 1000 && bacState.timeToLowImpactMs > 0 && (
                              <span className="text-text-muted"> (instead of {formatTime(bacState.lowImpactAtTimestamp)})</span>
                            )}
                          </>
                        ) : (
                          'Your sleep would still be clear'
                        )}
                      </p>
                      {Math.round(whatIfState.remReductionMinutes) > Math.round(bacState.remReductionMinutes) && (
                        <p className="text-xs text-text-muted">
                          ~{Math.round(whatIfState.remReductionMinutes)} min of REM lost at bedtime
                          {Math.round(bacState.remReductionMinutes) > 0
                            ? ` (vs ~${Math.round(bacState.remReductionMinutes)} without)`
                            : ''}
                        </p>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-text-muted">
                    Preview only. Your gauge shows logged drinks; the dashed chart line shows this projection
                  </p>
                </div>
              )}
            </div>

            {/* Today's Tally */}
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Today</span>
                <span className={`text-2xl font-bold text-text-primary ${drinkPulse ? 'animate-pop-in' : ''}`}>
                  {formatDrinkCount(totalDrinks)}
                </span>
              </div>
              <p className="text-xs text-text-muted mt-1">
                standard drink{totalDrinks !== 1 ? 's' : ''} logged
              </p>

              {/* Reset */}
              {drinks.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border-glass">
                  {showResetConfirm ? (
                    <div className="flex items-center justify-between animate-pop-in">
                      <span className="text-sm text-accent-red">Clear all drinks?</span>
                      <div className="flex gap-2">
                        <button
                          onClick={clearSession}
                          className="px-3 py-1.5 rounded-lg bg-accent-red/15 text-accent-red text-sm font-medium press-bounce"
                        >
                          Yes, clear
                        </button>
                        <button
                          onClick={() => setShowResetConfirm(false)}
                          className="px-3 py-1.5 rounded-lg bg-white/5 text-text-muted text-sm press-bounce"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowResetConfirm(true)}
                      className="text-sm text-text-muted hover:text-accent-red transition-colors"
                    >
                      Clear tonight&rsquo;s drinks
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Sleep Tracking (Experimental) — keyed by date so it remounts
                cleanly when the session day rolls over at 5 AM */}
            {profile.experimentalSleep && (
              <SleepEntry
                key={lastNightDate}
                date={lastNightDate}
                existing={sleepRecord}
                predictedRemLossMinutes={lastNightPredictedRemLoss}
                onSave={handleSaveSleep}
              />
            )}

            {/* BAC Chart */}
            <BACChart
              drinks={drinks}
              profile={profile}
              hypotheticalDrinks={hypotheticalDrinksList}
              now={now}
            />
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="stagger-children space-y-4 py-2">
            <BACChart
              drinks={drinks}
              profile={profile}
              hypotheticalDrinks={hypotheticalDrinksList}
              now={now}
            />
            <Timeline
              drinks={drinks}
              profile={profile}
              hypotheticalDrinks={hypotheticalDrinksList}
              bacState={bacState}
              whatIfState={whatIfState}
              now={now}
            />
            {drinks.length === 0 && (
              <div className="text-center py-12">
                <p className="text-4xl mb-4 text-text-muted">⊘</p>
                <p className="text-text-secondary">No data yet</p>
                <p className="text-sm text-text-muted mt-1">
                  Log drinks on the Home tab to see your timeline
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'log' && <DrinkLog drinks={drinks} onRemove={removeDrink} />}
        {activeTab === 'settings' && <Settings profile={profile} onUpdate={updateProfile} showSetupPrompt={showSetupPrompt} onReset={() => {
                  resetApp();
                  clearNotificationState();
                  setShowOnboarding(true);
                  setDrinks([]);
                  setProfile(loadProfile());
                  setSleepRecord(null);
                  setWhatIfMode(false);
                  setWhatIfDrinks(1);
                  setActiveTab('home');
                }} onAddHistorical={(timestamp, standardDrinks) => {
                  const drink = { id: generateId(), timestamp, standardDrinks };
                  const isToday = addHistoricalDrink(drink);
                  if (isToday) setDrinks(loadDrinks());
                  else if (profile.experimentalSleep) setLastNightDrinks(loadSessionDrinks(lastNightDate));
                }} onNotificationsChanged={(enabled) => {
                  if (enabled && notificationTarget && notificationTarget.quality !== 'safe' && notificationTarget.at > Date.now()) {
                    scheduleREMClearNotification(notificationTarget.at);
                  }
                }} />}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 inset-x-0 bg-bg-primary/90 border-t border-border-glass pb-safe backdrop-blur-sm">
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setShowSetupPrompt(false); }}
              className={`relative flex flex-col items-center gap-0.5 px-4 py-2 transition-all duration-200 ${
                activeTab === tab.id ? 'text-accent-teal' : 'text-text-muted'
              }`}
            >
              <span className={`transition-transform duration-300 ${activeTab === tab.id ? 'nav-icon-bounce' : ''}`}>
                {NAV_ICONS[tab.id]}
              </span>
              <span className="text-[10px] font-medium">{tab.label}</span>
              {activeTab === tab.id && (
                <span className="absolute -bottom-0.5 w-4 h-0.5 rounded-full bg-accent-teal nav-dot-in" />
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

export default App;
