import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  calculateBACState,
  formatCountdown,
  formatBAC,
  generateId,
  type Drink,
  type BACState,
} from './lib/bac';
import { loadDrinks, saveDrinks, loadProfile, saveProfile } from './lib/storage';
import type { UserProfile } from './lib/bac';
import { STATUS_TEXT_CLASS, STATUS_BORDER_CLASS, formatDrinkCount } from './lib/theme';
import { BACGauge } from './components/BACGauge';
import { BACChart } from './components/BACChart';
import { Timeline } from './components/Timeline';
import { DrinkLog } from './components/DrinkLog';
import { Settings } from './components/Settings';

type Tab = 'home' | 'timeline' | 'log' | 'settings';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'home', label: 'Home', icon: '◉' },
  { id: 'timeline', label: 'Timeline', icon: '📈' },
  { id: 'log', label: 'Log', icon: '☰' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
];

// Memoized date string — only changes once per day
const todayString = new Date().toLocaleDateString('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
});

function App() {
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
        timeToREMSafeMs: 0,
        soberAtTimestamp: now,
        remSafeAtTimestamp: now,
        remReductionMinutes: 0,
        remPercentReduction: 0,
        sleepQuality: 'safe' as const,
      };
    }
    return calculateBACState(drinks, profile, hypotheticalDrinksList);
  }, [drinks, profile, hypotheticalDrinksList]);

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
          <div className="animate-fade-in space-y-4">
            {/* BAC Gauge */}
            <div className={`flex justify-center py-4 transition-transform duration-300 ${drinkPulse ? 'scale-105' : ''}`}>
              <BACGauge bac={bacState.currentBAC} quality={bacState.sleepQuality} />
            </div>

            {/* REM-Safe Countdown */}
            <div className={`card p-4 text-center border transition-all duration-500 ${statusBorder}`}>
              <p className="text-sm text-text-secondary mb-1">
                {bacState.currentBAC < 0.001 ? 'REM sleep status' : 'REM-safe sleep in'}
              </p>
              <p className={`text-4xl font-bold tracking-tight transition-colors duration-500 ${statusColor}`}>
                {bacState.currentBAC < 0.001
                  ? 'Clear'
                  : formatCountdown(bacState.timeToREMSafeMs)}
              </p>
              {bacState.currentBAC >= 0.001 && (
                <p className="text-xs text-text-muted mt-2">
                  Sober in {formatCountdown(bacState.timeToSoberMs)} · BAC{' '}
                  {formatBAC(bacState.currentBAC)}
                </p>
              )}
            </div>

            {/* REM Impact */}
            {bacState.currentBAC >= 0.001 && (
              <div className="card p-4 animate-fade-in">
                <p className="text-sm text-text-secondary mb-2">If you sleep now</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-2xl font-semibold text-accent-red">
                      -{Math.round(bacState.remReductionMinutes)}m
                    </p>
                    <p className="text-xs text-text-muted">REM sleep lost</p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-accent-yellow">
                      -{bacState.remPercentReduction.toFixed(1)}%
                    </p>
                    <p className="text-xs text-text-muted">REM proportion</p>
                  </div>
                </div>
              </div>
            )}

            {/* BAC Chart */}
            <BACChart
              drinks={drinks}
              profile={profile}
              hypotheticalDrinks={hypotheticalDrinksList}
            />

            {/* Add Drinks */}
            <div className="card p-4 space-y-3">
              <button
                onClick={() => addDrink(1)}
                className={`w-full py-3 rounded-xl text-center active:scale-[0.97] transition-all duration-200 bg-accent-teal/10 border border-accent-teal/20 hover:border-accent-teal/40 ${
                  drinkPulse ? 'ring-2 ring-accent-teal/30 scale-[0.98]' : ''
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
                  className="bg-accent-teal/15 text-accent-teal px-5 py-2.5 rounded-xl font-medium disabled:opacity-30 active:scale-95 transition-all"
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
              <div className="card p-3 flex items-center justify-between animate-fade-in">
                <span className="text-sm text-text-secondary">Drink added</span>
                <button
                  onClick={undoLastDrink}
                  className="text-sm font-medium text-accent-teal active:scale-95 transition-transform"
                >
                  Undo
                </button>
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
                <div className="animate-fade-in">
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
                <span className={`text-2xl font-bold text-text-primary transition-transform duration-200 ${drinkPulse ? 'scale-125' : ''}`}>
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
                    <div className="flex items-center justify-between animate-fade-in">
                      <span className="text-sm text-accent-red">Clear all drinks?</span>
                      <div className="flex gap-2">
                        <button
                          onClick={clearSession}
                          className="px-3 py-1.5 rounded-lg bg-accent-red/15 text-accent-red text-sm font-medium active:scale-95 transition-transform"
                        >
                          Yes, clear
                        </button>
                        <button
                          onClick={() => setShowResetConfirm(false)}
                          className="px-3 py-1.5 rounded-lg bg-white/5 text-text-muted text-sm active:scale-95 transition-transform"
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
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="animate-fade-in space-y-4 py-2">
            <BACChart
              drinks={drinks}
              profile={profile}
              hypotheticalDrinks={hypotheticalDrinksList}
            />
            <Timeline
              drinks={drinks}
              profile={profile}
              hypotheticalDrinks={hypotheticalDrinksList}
            />
            {drinks.length === 0 && (
              <div className="text-center py-12">
                <p className="text-4xl mb-4">📊</p>
                <p className="text-text-secondary">No data yet</p>
                <p className="text-sm text-text-muted mt-1">
                  Log drinks on the Home tab to see your timeline
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'log' && <DrinkLog drinks={drinks} onRemove={removeDrink} />}
        {activeTab === 'settings' && <Settings profile={profile} onUpdate={updateProfile} />}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 inset-x-0 bg-bg-primary/90 border-t border-border-glass pb-safe backdrop-blur-sm">
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-0.5 px-4 py-2 transition-all duration-200 ${
                activeTab === tab.id ? 'text-accent-teal scale-105' : 'text-text-muted'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

export default App;
