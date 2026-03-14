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
  const [customAmount, setCustomAmount] = useState<number | null>(null);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [drinkPulse, setDrinkPulse] = useState(false);
  const [tick, setTick] = useState(0); // force re-render every second
  const pulseTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

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

  // Cleanup pulse timeout on unmount
  useEffect(() => {
    return () => {
      if (pulseTimeout.current) clearTimeout(pulseTimeout.current);
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
      updateDrinks((prev) => [
        ...prev,
        { id: generateId(), timestamp: Date.now(), standardDrinks },
      ]);
      setShowCustomInput(false);
      setCustomAmount(null);

      setDrinkPulse(true);
      if (pulseTimeout.current) clearTimeout(pulseTimeout.current);
      pulseTimeout.current = setTimeout(() => setDrinkPulse(false), 600);
    },
    [updateDrinks]
  );

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
            remedy
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

            {/* Quick Add */}
            <button
              onClick={() => addDrink(1)}
              className={`w-full card p-4 text-center active:scale-[0.97] transition-all duration-200 border border-accent-teal/20 hover:border-accent-teal/40 ${
                drinkPulse ? 'ring-2 ring-accent-teal/30 scale-[0.98]' : ''
              }`}
            >
              <span className="text-lg font-medium text-accent-teal">+ Add Drink</span>
              <span className="block text-xs text-text-muted mt-0.5">
                1 standard drink · tap to log
              </span>
            </button>

            {showCustomInput ? (
              <div className="card p-3 flex items-center gap-2 animate-fade-in">
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="10"
                  placeholder="# drinks"
                  value={customAmount ?? ''}
                  onChange={(e) =>
                    setCustomAmount(e.target.value ? parseFloat(e.target.value) : null)
                  }
                  className="flex-1 bg-transparent border border-border-glass rounded-lg px-3 py-2 text-text-primary outline-none focus:border-accent-teal/50 text-center text-lg"
                  autoFocus
                />
                <button
                  onClick={() => customAmount && addDrink(customAmount)}
                  disabled={!customAmount || customAmount <= 0}
                  className="bg-accent-teal/20 text-accent-teal px-4 py-2 rounded-lg font-medium disabled:opacity-30"
                >
                  Add
                </button>
                <button
                  onClick={() => { setShowCustomInput(false); setCustomAmount(null); }}
                  className="text-text-muted px-2 py-2"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowCustomInput(true)}
                className="w-full text-center text-sm text-text-muted py-1"
              >
                Custom amount...
              </button>
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
