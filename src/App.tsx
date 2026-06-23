import { useCallback, useEffect, useState } from 'react';
import type { AppData, Profile, SessionLog } from './types';
import { loadData, saveData, resetData } from './lib/storage';
import { getSession } from './data/program';
import { lastLogFor } from './lib/progress';
import { Onboarding } from './components/Onboarding';
import { Home } from './components/Home';
import { Program } from './components/Program';
import { Library } from './components/Library';
import { Progress } from './components/Progress';
import { Settings } from './components/Settings';
import { SessionPlayer } from './components/SessionPlayer';
import { SessionDetail } from './components/SessionDetail';
import { ExerciseDetail } from './components/ExerciseDetail';
import { TabBar, type Tab } from './components/TabBar';
import { Sheet } from './components/ui';
import { getExercise } from './data/exercises';

export default function App() {
  const [data, setData] = useState<AppData>(() => loadData());
  const [tab, setTab] = useState<Tab>('today');
  const [openSessionId, setOpenSessionId] = useState<string | null>(null); // detail sheet
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null); // live player
  const [exerciseId, setExerciseId] = useState<string | null>(null); // exercise sheet

  // Persist on every change.
  useEffect(() => {
    saveData(data);
  }, [data]);

  const patchProfile = useCallback((patch: Partial<Profile>) => {
    setData((d) => ({ ...d, profile: { ...d.profile, ...patch } }));
  }, []);

  const completeOnboarding = useCallback((profile: Profile) => {
    setData((d) => ({
      ...d,
      profile: { ...profile, startedAt: d.profile.startedAt ?? new Date().toISOString() },
      onboarded: true,
    }));
  }, []);

  const startSession = useCallback((id: string) => {
    setOpenSessionId(null);
    setActiveSessionId(id);
  }, []);

  const finishSession = useCallback((log: SessionLog) => {
    setData((d) => ({ ...d, logs: [...d.logs, log] }));
    setActiveSessionId(null);
    setTab('today');
  }, []);

  if (!data.onboarded) {
    return <Onboarding onDone={completeOnboarding} />;
  }

  const activeSession = activeSessionId ? getSession(activeSessionId) : undefined;
  const openSession = openSessionId ? getSession(openSessionId) : undefined;

  return (
    <>
      {activeSession ? (
        // Live workout takes over the screen.
        <SessionPlayer
          session={activeSession}
          profile={data.profile}
          onComplete={finishSession}
          onExit={() => setActiveSessionId(null)}
          onShowExercise={setExerciseId}
        />
      ) : (
        <div className="min-h-dvh safe-top">
          <main className="anim-fade-in">
            {tab === 'today' && <Home data={data} onOpenSession={setOpenSessionId} onStart={startSession} />}
            {tab === 'program' && <Program data={data} onOpenSession={setOpenSessionId} />}
            {tab === 'library' && <Library onShowExercise={setExerciseId} />}
            {tab === 'progress' && <Progress data={data} />}
            {tab === 'settings' && (
              <Settings
                data={data}
                onPatchProfile={patchProfile}
                onImportData={(d) => setData(d)}
                onReset={() => setData(resetData())}
              />
            )}
          </main>

          <TabBar active={tab} onChange={setTab} />

          {/* Session preview sheet */}
          <Sheet open={!!openSession} onClose={() => setOpenSessionId(null)} title={openSession?.title} full>
            {openSession && (
              <SessionDetail
                session={openSession}
                profile={data.profile}
                lastLog={lastLogFor(data, openSession.id)}
                onStart={() => startSession(openSession.id)}
                onShowExercise={setExerciseId}
              />
            )}
          </Sheet>
        </div>
      )}

      {/* Exercise detail sheet — available over both the shell and the live player */}
      <Sheet open={!!exerciseId} onClose={() => setExerciseId(null)} title={exerciseId ? getExercise(exerciseId).name : ''}>
        {exerciseId && <ExerciseDetail id={exerciseId} onShowExercise={setExerciseId} />}
      </Sheet>
    </>
  );
}
