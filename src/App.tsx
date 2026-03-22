import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  calculateBACState,
  generateId,
  type Drink,
  type BACState,
} from './lib/bac';
import { loadDrinks, saveDrinks, loadProfile, saveProfile, hasOnboarded, setOnboarded, resetApp, addHistoricalDrink, loadSleepRecord, saveSleepRecord } from './lib/storage';
import { scheduleREMClearNotification, cancelREMClearNotification } from './lib/notifications';
import { Onboarding } from './components/Onboarding';
import type { UserProfile } from './lib/bac';
import { STATUS_TEXT_CLASS, STATUS_BORDER_CLASS, formatDrinkCount } from './lib/theme';
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

// Memoized date string — only changes once per day
const todayString = new Date().toLocaleDateString('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
});

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
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const [tick, setTick] = useState(0); // force re-render every second

  // "Last night" = yesterday's date for sleep entry
  const lastNightDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toLocaleDateString('en-CA'); // YYYY-MM-DD
  }, []);
  const [sleepRecord, setSleepRecord] = useState<SleepRecord | null>(() =>
    profile.experimentalSleep ? loadSleepRecord(lastNightDate) : null
  );
  const pulseTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const undoTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Stable hypothetical drinks list
  const hypotheticalDrinksList = useMemo<Drink[]>(
    () =>
      whatIfMode
        ? [{ id: 'hypothetical', timestamp: Date.now(), standardDrinks: whatIfDrinks }]
        : [],
    [whatIfMode, whatIfDrinks, tick] // tick ensures timestamp freshness
  );

  // Tick every second — but only re-render if BAC has meaningfully changed
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (pulseTimeout.current) clearTimeout(pulseTimeout.current);
      if (undoTimeout.current) clearTimeout(undoTimeout.current);
    };
  }, []);

  // Derive BAC state (no redundant state — just computed)
  const bacState: BACState = useMemo(() => {
    if (drinks.length === 0 && !whatIfMode) {
      // Fast path: no drinks, skip all computation
      const now = Date.now();
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
    return calculateBACState(drinks, profile, hypotheticalDrinksList);
  }, [drinks, profile, hypotheticalDrinksList]);

  // Schedule/cancel REM-clear notification when BAC state changes
  useEffect(() => {
    if (bacState.sleepQuality === 'safe' || bacState.lowImpactAtTimestamp <= Date.now()) {
      cancelREMClearNotification();
    } else {
      scheduleREMClearNotification(bacState.lowImpactAtTimestamp);
    }
    return () => cancelREMClearNotification();
  }, [bacState.lowImpactAtTimestamp, bacState.sleepQuality]);

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
    // Load sleep record when experimental sleep is toggled on
    if (p.experimentalSleep && !profile.experimentalSleep) {
      setSleepRecord(loadSleepRecord(lastNightDate));
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

  if (showOnboarding) {
    return (
      <Onboarding
        onComplete={() => {
          setOnboarded();
          setShowOnboarding(false);
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
            {/* BAC Gauge */}
            <div className={`flex justify-center py-4 transition-transform duration-300 ${drinkPulse ? 'animate-drink-pop' : ''}`}>
              <BACGauge bac={bacState.currentBAC} quality={bacState.sleepQuality} />
            </div>

            {/* Tonight's Sleep */}
            <div className={`card p-4 text-center border transition-all duration-500 ${statusBorder}`}>
              {bacState.sleepQuality === 'safe' ? (
                <>
                  <p className={`text-lg font-semibold transition-colors duration-500 ${statusColor}`}>
                    Your sleep is on track tonight
                  </p>
                  <p className="text-sm text-text-secondary mt-1">
                    {bacState.currentBAC >= 0.001
                      ? 'You\u2019re still processing alcohol, but it won\u2019t noticeably affect your sleep quality.'
                      : 'No alcohol in your system. Sleep well!'}
                  </p>
                </>
              ) : (() => {
                // Is "wait until X" realistic? If the clear time is more than 3 hours
                // past bedtime, staying up that long is worse than sleeping with alcohol.
                const waitHours = bacState.timeToLowImpactMs / (1000 * 60 * 60);
                const clearTimeIsRealistic = bacState.timeToLowImpactMs > 0 && waitHours <= 3;

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
                        : `Sleeping now would cost you ~${Math.round(bacState.remReductionMinutes)} minutes of restorative sleep.`}
                    </p>
                    {clearTimeIsRealistic && (
                      <div className="mt-3 pt-3 border-t border-border-glass">
                        <p className="text-sm text-text-secondary">
                          Wait until{' '}
                          <span className="font-semibold text-accent-teal">
                            {new Date(bacState.lowImpactAtTimestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          </span>
                          {' '}for better sleep
                        </p>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Add Drinks */}
            <div className="card p-4 space-y-3">
              <button
                onClick={() => addDrink(1)}
                className={`w-full py-3 rounded-xl text-center press-bounce bg-accent-teal/10 border border-accent-teal/20 hover:border-accent-teal/40 ${
                  drinkPulse ? 'ring-2 ring-accent-teal/30 animate-drink-pop' : ''
                }`}
              >
                <span className="text-lg font-medium text-accent-teal">+ 1 Standard Drink</span>
              </button>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  min="0.1"
                  max="10"
                  placeholder="e.g. 1.5"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="flex-1 bg-white/5 border border-border-glass rounded-xl px-3 py-2.5 text-text-primary outline-none focus:border-accent-teal/50 text-center text-lg placeholder:text-text-muted/50"
                />
                <button
                  onClick={() => {
                    const val = parseFloat(customAmount);
                    if (val > 0) {
                      addDrink(val);
                      setCustomAmount('');
                    }
                  }}
                  disabled={!customAmount || parseFloat(customAmount) <= 0 || isNaN(parseFloat(customAmount))}
                  className="bg-accent-teal/15 text-accent-teal px-5 py-2.5 rounded-xl font-medium disabled:opacity-30 press-bounce"
                >
                  Add
                </button>
              </div>

              <p className="text-[11px] text-text-muted leading-relaxed">
                1 standard drink = 12oz beer · 5oz wine · 1.5oz liquor
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
                  className={`w-12 h-7 rounded-full transition-colors relative ${
                    whatIfMode ? 'bg-accent-blue' : 'bg-white/10'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                      whatIfMode ? 'translate-x-6' : 'translate-x-1'
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
                      hypothetical drink{whatIfDrinks > 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted">
                    Dashed line on chart shows projected BAC
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
                      Reset session
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Sleep Tracking (Experimental) */}
            {profile.experimentalSleep && (
              <SleepEntry
                date={lastNightDate}
                existing={sleepRecord}
                bacState={bacState}
                onSave={handleSaveSleep}
              />
            )}

            {/* BAC Chart */}
            <BACChart
              drinks={drinks}
              profile={profile}
              hypotheticalDrinks={hypotheticalDrinksList}
            />
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="stagger-children space-y-4 py-2">
            <BACChart
              drinks={drinks}
              profile={profile}
              hypotheticalDrinks={hypotheticalDrinksList}
            />
            <Timeline
              drinks={drinks}
              profile={profile}
              hypotheticalDrinks={hypotheticalDrinksList}
              bacState={bacState}
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
        {activeTab === 'settings' && <Settings profile={profile} onUpdate={updateProfile} onReset={() => {
                  resetApp();
                  setShowOnboarding(true);
                  setDrinks([]);
                  setProfile(loadProfile());
                  setSleepRecord(null);
                  setActiveTab('home');
                }} onAddHistorical={(timestamp, standardDrinks) => {
                  const drink = { id: generateId(), timestamp, standardDrinks };
                  const isToday = addHistoricalDrink(drink);
                  if (isToday) setDrinks(loadDrinks());
                }} onNotificationsChanged={(enabled) => {
                  if (enabled && bacState.sleepQuality !== 'safe' && bacState.lowImpactAtTimestamp > Date.now()) {
                    scheduleREMClearNotification(bacState.lowImpactAtTimestamp);
                  }
                }} />}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 inset-x-0 bg-bg-primary/90 border-t border-border-glass pb-safe backdrop-blur-sm">
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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
