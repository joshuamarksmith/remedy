// Small audio + haptic helper for the workout timers. Uses the Web Audio API so
// there are no asset files to ship and it works offline.

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new Ctor();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

// Must be called from a user gesture (e.g. the Start button) to unlock audio on iOS.
export function primeAudio(): void {
  getCtx();
}

function beep(freq: number, durationMs: number, when = 0, gain = 0.15): void {
  const audio = getCtx();
  if (!audio) return;
  const osc = audio.createOscillator();
  const vol = audio.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  vol.gain.value = gain;
  osc.connect(vol);
  vol.connect(audio.destination);
  const start = audio.currentTime + when;
  osc.start(start);
  // Quick fade to avoid clicks.
  vol.gain.setValueAtTime(gain, start);
  vol.gain.exponentialRampToValueAtTime(0.0001, start + durationMs / 1000);
  osc.stop(start + durationMs / 1000);
}

function vibrate(pattern: number | number[]): void {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    // ignore
  }
}

export interface Cues {
  sound: boolean;
  haptic: boolean;
}

// A soft tick for the final seconds of a countdown.
export function cueTick(c: Cues): void {
  if (c.sound) beep(660, 90, 0, 0.08);
  if (c.haptic) vibrate(20);
}

// A bright two-tone chime when a timer completes (rest over / round start).
export function cueGo(c: Cues): void {
  if (c.sound) {
    beep(880, 140, 0);
    beep(1320, 200, 0.12);
  }
  if (c.haptic) vibrate([40, 60, 80]);
}

// A descending tone when the whole session finishes.
export function cueFinish(c: Cues): void {
  if (c.sound) {
    beep(880, 160, 0);
    beep(660, 160, 0.16);
    beep(440, 320, 0.32);
  }
  if (c.haptic) vibrate([60, 40, 60, 40, 120]);
}
