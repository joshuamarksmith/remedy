import type { Block, LoadHint, Session, Week } from '../types';

// ---- Block builders (keep the program data readable) ----

function reps(
  exerciseId: string,
  sets: number,
  repCount: number,
  load: LoadHint,
  opts: Partial<Block> = {},
): Block {
  return { exerciseId, mode: 'reps', sets, reps: repCount, restSec: 60, load, ...opts };
}

function perSide(
  exerciseId: string,
  sets: number,
  repCount: number,
  load: LoadHint,
  opts: Partial<Block> = {},
): Block {
  return { exerciseId, mode: 'reps', sets, reps: repCount, perSide: true, restSec: 60, load, ...opts };
}

function hold(exerciseId: string, sets: number, timeSec: number, load: LoadHint, opts: Partial<Block> = {}): Block {
  return { exerciseId, mode: 'time', sets, timeSec, restSec: 45, load, ...opts };
}

function emom(exerciseId: string, sets: number, repCount: number, load: LoadHint, opts: Partial<Block> = {}): Block {
  return { exerciseId, mode: 'emom', sets, reps: repCount, timeSec: 60, load, ...opts };
}

function ladder(exerciseId: string, sets: number, rungs: number[], load: LoadHint, opts: Partial<Block> = {}): Block {
  return { exerciseId, mode: 'ladder', sets, ladder: rungs, perSide: true, restSec: 75, load, ...opts };
}

// Reusable warm-ups.
const standardWarmup = (): Block[] => [
  perSide('halo', 1, 5, 'light', { note: '5 each direction' }),
  reps('prying-goblet', 1, 5, 'light', { tempo: 'slow', note: 'Pry and breathe at the bottom' }),
  reps('hinge-drill', 1, 8, 'bodyweight'),
];

const getupWarmup = (): Block[] => [
  perSide('halo', 1, 5, 'light'),
  perSide('arm-bar', 1, 1, 'light', { timeSec: 30, mode: 'time', note: '~30s settle each side' }),
  perSide('cossack', 1, 5, 'bodyweight'),
];

// ---- Weeks ----

const week1: Week = {
  number: 1,
  title: 'Foundations',
  theme: 'Pattern the hinge, squat, and rack',
  description:
    'Before load comes skill. This week you wire the hip hinge that powers every swing, groove a clean goblet squat, and meet the get-up. Keep it crisp and a little easy.',
  sessions: [
    {
      id: 'w1d1',
      week: 1,
      day: 1,
      title: 'Hinge & Hike',
      focus: 'Own the deadlift and the swing hike',
      type: 'skill',
      estMinutes: 30,
      warmup: standardWarmup(),
      main: [
        reps('hinge-drill', 3, 8, 'bodyweight', { note: 'Dowel on the spine — find a flat back' }),
        reps('deadlift', 4, 5, 'moderate', { restSec: 75, note: 'Slow and deliberate' }),
        reps('two-hand-swing', 5, 10, 'light', { restSec: 60, note: 'Learn the float — power, not height' }),
      ],
      finisher: [hold('hollow-hold', 3, 20, 'bodyweight')],
      notes: ['If the swing feels like a squat, go back to the deadlift and re-set the hinge.'],
    },
    {
      id: 'w1d2',
      week: 1,
      day: 2,
      title: 'Squat & Press Prep',
      focus: 'Goblet squat depth and overhead readiness',
      type: 'strength',
      estMinutes: 32,
      warmup: standardWarmup(),
      main: [
        reps('goblet-squat', 4, 8, 'moderate', { tempo: '3-1-1', restSec: 75 }),
        perSide('strict-press', 4, 5, 'light', { restSec: 60, note: 'Light — build the groove' }),
        perSide('dead-row', 4, 6, 'moderate', { restSec: 60 }),
      ],
      finisher: [perSide('suitcase-carry', 3, 1, 'moderate', { mode: 'time', timeSec: 30, note: '~20m walk each side' })],
    },
    {
      id: 'w1d3',
      week: 1,
      day: 3,
      title: 'Meet the Get-Up',
      focus: 'Get-up to elbow + swing volume',
      type: 'skill',
      estMinutes: 30,
      warmup: getupWarmup(),
      main: [
        perSide('getup-elbow', 5, 2, 'getup', { restSec: 60, note: 'Slow, eyes on the bell' }),
        reps('two-hand-swing', 6, 10, 'moderate', { restSec: 60 }),
      ],
      finisher: [hold('hollow-hold', 3, 25, 'bodyweight')],
      notes: ['The get-up is a skill, not a workout. Rest as needed and stay precise.'],
    },
  ],
};

const week2: Week = {
  number: 2,
  title: 'Foundations II',
  theme: 'Reinforce patterns, add a little volume',
  description:
    'Same patterns, slightly more work. Swings get cleaner, the get-up extends toward standing, and pressing strength starts to show up.',
  sessions: [
    {
      id: 'w2d1',
      week: 2,
      day: 1,
      title: 'Swing Volume',
      focus: 'Build the engine with two-hand swings',
      type: 'conditioning',
      estMinutes: 32,
      warmup: standardWarmup(),
      main: [
        reps('deadlift', 3, 5, 'heavy', { restSec: 75 }),
        emom('two-hand-swing', 10, 12, 'moderate', { note: '12 swings at the top of each minute, rest the remainder' }),
      ],
      finisher: [hold('hollow-hold', 3, 30, 'bodyweight')],
    },
    {
      id: 'w2d2',
      week: 2,
      day: 2,
      title: 'Press & Squat',
      focus: 'Grind strength: press and goblet squat',
      type: 'strength',
      estMinutes: 35,
      warmup: standardWarmup(),
      main: [
        perSide('strict-press', 5, 5, 'moderate', { restSec: 75 }),
        reps('goblet-squat', 4, 8, 'moderate', { tempo: '3-1-1', restSec: 75 }),
        perSide('dead-row', 4, 8, 'moderate'),
      ],
      finisher: [perSide('rack-carry', 3, 1, 'moderate', { mode: 'time', timeSec: 30 })],
    },
    {
      id: 'w2d3',
      week: 2,
      day: 3,
      title: 'Full Get-Up',
      focus: 'String the get-up together to standing',
      type: 'skill',
      estMinutes: 34,
      warmup: getupWarmup(),
      main: [
        perSide('turkish-getup', 5, 1, 'getup', { restSec: 75, note: 'One slow, perfect rep each side' }),
        perSide('one-hand-swing', 6, 8, 'moderate', { restSec: 60, note: 'Stay square — resist the twist' }),
      ],
      finisher: [hold('hollow-hold', 3, 30, 'bodyweight')],
    },
  ],
};

const week3: Week = {
  number: 3,
  title: 'Build',
  theme: 'Heavier hinges, the clean appears',
  description:
    'Now we load. Deadlifts get heavy, swings get powerful, and you learn to clean the bell to the rack without banging the wrist.',
  sessions: [
    {
      id: 'w3d1',
      week: 3,
      day: 1,
      title: 'Power Swings',
      focus: 'Heavier two-hand and one-hand swings',
      type: 'conditioning',
      estMinutes: 34,
      warmup: standardWarmup(),
      main: [
        emom('two-hand-swing', 10, 15, 'moderate', { note: '15 powerful swings each minute' }),
        perSide('one-hand-swing', 5, 8, 'moderate', { restSec: 60 }),
      ],
      finisher: [perSide('suitcase-carry', 3, 1, 'heavy', { mode: 'time', timeSec: 40 })],
    },
    {
      id: 'w3d2',
      week: 3,
      day: 2,
      title: 'Meet the Clean',
      focus: 'Dead clean to a soft rack + press',
      type: 'skill',
      estMinutes: 35,
      warmup: standardWarmup(),
      main: [
        perSide('dead-clean', 5, 5, 'moderate', { restSec: 60, note: 'Tame the arc — no banging' }),
        perSide('strict-press', 5, 5, 'moderate', { restSec: 75 }),
        reps('goblet-squat', 4, 10, 'heavy', { restSec: 75 }),
      ],
    },
    {
      id: 'w3d3',
      week: 3,
      day: 3,
      title: 'Get-Up Strength',
      focus: 'Heavier get-ups + windmill mobility',
      type: 'strength',
      estMinutes: 36,
      warmup: getupWarmup(),
      main: [
        perSide('turkish-getup', 5, 1, 'heavy', { restSec: 90, note: 'Heavier than week 2 — stay slow' }),
        perSide('windmill', 4, 4, 'light', { restSec: 60, note: 'Light, mobility focus' }),
        perSide('one-hand-swing', 5, 10, 'moderate'),
      ],
    },
  ],
};

const week4: Week = {
  number: 4,
  title: 'Build II',
  theme: 'Clean & press, front squat, carries',
  description:
    'The big combos arrive. Clean and press become one fluid lift, the front squat lets you load the legs harder, and loaded carries finish the work.',
  sessions: [
    {
      id: 'w4d1',
      week: 4,
      day: 1,
      title: 'Clean & Press',
      focus: 'Link the clean to a strong press',
      type: 'strength',
      estMinutes: 38,
      warmup: standardWarmup(),
      main: [
        perSide('clean-press', 5, 5, 'moderate', { restSec: 90, note: 'Clean, breathe, press — every rep' }),
        perSide('front-squat', 4, 6, 'moderate', { restSec: 75 }),
        perSide('dead-row', 4, 8, 'heavy'),
      ],
      finisher: [perSide('rack-carry', 3, 1, 'heavy', { mode: 'time', timeSec: 40 })],
    },
    {
      id: 'w4d2',
      week: 4,
      day: 2,
      title: 'Swing Ladders',
      focus: 'Conditioning through one-hand swing volume',
      type: 'conditioning',
      estMinutes: 34,
      warmup: standardWarmup(),
      main: [
        emom('one-hand-swing', 10, 10, 'moderate', { perSide: true, note: 'Alternate sides each minute' }),
        reps('two-hand-swing', 3, 20, 'moderate', { restSec: 90 }),
      ],
      finisher: [hold('hollow-hold', 3, 35, 'bodyweight')],
    },
    {
      id: 'w4d3',
      week: 4,
      day: 3,
      title: 'Get-Up + Windmill',
      focus: 'Overhead control under heavier load',
      type: 'skill',
      estMinutes: 36,
      warmup: getupWarmup(),
      main: [
        perSide('turkish-getup', 5, 1, 'heavy', { restSec: 90 }),
        perSide('windmill', 4, 5, 'moderate', { restSec: 60 }),
        perSide('overhead-carry', 3, 1, 'moderate', { mode: 'time', timeSec: 30 }),
      ],
    },
  ],
};

const week5: Week = {
  number: 5,
  title: 'Strength Block',
  theme: 'Press ladders and heavy squats',
  description:
    'A dedicated strength phase. Press ladders build pressing power without burning out, front squats get heavy, and swings stay sharp.',
  sessions: [
    {
      id: 'w5d1',
      week: 5,
      day: 1,
      title: 'Press Ladders',
      focus: 'Build pressing strength with ladders',
      type: 'strength',
      estMinutes: 40,
      warmup: standardWarmup(),
      main: [
        ladder('strict-press', 5, [1, 2, 3], 'heavy', { note: '1,2,3 per side = 1 ladder. Rest as needed.' }),
        perSide('front-squat', 5, 5, 'heavy', { restSec: 90 }),
        perSide('renegade-row', 4, 5, 'moderate', { restSec: 60 }),
      ],
    },
    {
      id: 'w5d2',
      week: 5,
      day: 2,
      title: 'Heavy Swings',
      focus: 'Maximal-power swings, low fatigue',
      type: 'conditioning',
      estMinutes: 34,
      warmup: standardWarmup(),
      main: [
        emom('one-hand-swing', 12, 10, 'heavy', { perSide: true, note: 'Alternate sides — peak power each set' }),
        perSide('suitcase-carry', 3, 1, 'heavy', { mode: 'time', timeSec: 40 }),
      ],
      finisher: [hold('hollow-hold', 3, 40, 'bodyweight')],
    },
    {
      id: 'w5d3',
      week: 5,
      day: 3,
      title: 'Get-Up + Floor Press',
      focus: 'Shoulder strength and stability',
      type: 'strength',
      estMinutes: 38,
      warmup: getupWarmup(),
      main: [
        perSide('turkish-getup', 4, 1, 'heavy', { restSec: 90 }),
        perSide('floor-press', 5, 6, 'heavy', { restSec: 75 }),
        perSide('windmill', 3, 5, 'moderate'),
      ],
    },
  ],
};

const week6: Week = {
  number: 6,
  title: 'Power & Complexes',
  theme: 'High pulls toward the snatch, ABC',
  description:
    'Power production steps up. The high pull bridges toward the snatch, and the Armor Building Complex teaches you to keep form under dense, fatiguing work.',
  sessions: [
    {
      id: 'w6d1',
      week: 6,
      day: 1,
      title: 'High Pull to Snatch',
      focus: 'Learn the snatch path safely',
      type: 'skill',
      estMinutes: 38,
      warmup: standardWarmup(),
      main: [
        perSide('high-pull', 5, 8, 'moderate', { restSec: 60, note: 'Knuckles lead, elbow high' }),
        perSide('snatch', 5, 5, 'light', { restSec: 75, note: 'Punch through — no banging the wrist' }),
        emom('two-hand-swing', 8, 15, 'moderate'),
      ],
    },
    {
      id: 'w6d2',
      week: 6,
      day: 2,
      title: 'Armor Building Complex',
      focus: 'Dense full-body complex work',
      type: 'complex',
      estMinutes: 36,
      warmup: standardWarmup(),
      main: [
        emom('abc', 10, 1, 'moderate', {
          note: '1 round (2 clean, 2 press, 3 front squat) per minute. Single bell is fine.',
        }),
      ],
      finisher: [perSide('rack-carry', 3, 1, 'heavy', { mode: 'time', timeSec: 45 })],
      notes: ['Pick a weight you can press for clean reps. Stop a round short of failure.'],
    },
    {
      id: 'w6d3',
      week: 6,
      day: 3,
      title: 'Get-Up + Snatch',
      focus: 'Overhead strength and the new lift',
      type: 'strength',
      estMinutes: 38,
      warmup: getupWarmup(),
      main: [
        perSide('turkish-getup', 4, 1, 'heavy', { restSec: 90 }),
        perSide('snatch', 6, 5, 'moderate', { restSec: 75 }),
        perSide('overhead-carry', 3, 1, 'moderate', { mode: 'time', timeSec: 40 }),
      ],
    },
  ],
};

const week7: Week = {
  number: 7,
  title: 'Advanced Density',
  theme: 'Snatch volume, flows, conditioning',
  description:
    'Put it together. Snatch volume builds your conditioning ceiling, flows demand skill under fatigue, and the engine work gets serious.',
  sessions: [
    {
      id: 'w7d1',
      week: 7,
      day: 1,
      title: 'Snatch Intervals',
      focus: 'Build the snatch engine',
      type: 'conditioning',
      estMinutes: 36,
      warmup: standardWarmup(),
      main: [
        emom('snatch', 12, 6, 'moderate', { perSide: true, note: 'Alternate sides each minute' }),
        perSide('suitcase-carry', 3, 1, 'heavy', { mode: 'time', timeSec: 45 }),
      ],
      finisher: [hold('hollow-hold', 3, 45, 'bodyweight')],
    },
    {
      id: 'w7d2',
      week: 7,
      day: 2,
      title: 'The Flow',
      focus: 'Swing–clean–press chained skill',
      type: 'complex',
      estMinutes: 38,
      warmup: standardWarmup(),
      main: [
        perSide('swing-clean-press', 6, 5, 'moderate', { restSec: 75, note: '1 swing + 1 clean + 1 press = 1 rep' }),
        ladder('push-press', 4, [2, 3, 5], 'heavy', { note: '2,3,5 per side ladders' }),
      ],
      finisher: [perSide('overhead-carry', 3, 1, 'heavy', { mode: 'time', timeSec: 40 })],
    },
    {
      id: 'w7d3',
      week: 7,
      day: 3,
      title: 'Heavy Get-Up + Squat',
      focus: 'Peak strength before the test week',
      type: 'strength',
      estMinutes: 40,
      warmup: getupWarmup(),
      main: [
        perSide('turkish-getup', 5, 1, 'heavy', { restSec: 120, note: 'Heaviest get-ups of the program' }),
        perSide('front-squat', 5, 5, 'heavy', { restSec: 90 }),
      ],
    },
  ],
};

const week8: Week = {
  number: 8,
  title: 'Peak & Test',
  theme: 'Prove it — the Simple standard',
  description:
    'The payoff. After a light primer you test the classic minimalist standard: 100 swings and 10 get-ups, plus a snatch test. Hit it and you have a real, durable kettlebell base.',
  sessions: [
    {
      id: 'w8d1',
      week: 8,
      day: 1,
      title: 'Primer',
      focus: 'Sharpen, don’t fatigue',
      type: 'recovery',
      estMinutes: 26,
      warmup: standardWarmup(),
      main: [
        reps('two-hand-swing', 5, 10, 'moderate', { restSec: 60, note: 'Crisp and powerful, well short of fatigue' }),
        perSide('turkish-getup', 3, 1, 'moderate', { restSec: 90 }),
      ],
      notes: ['Keep this easy. The goal is to feel fast and fresh for the test.'],
    },
    {
      id: 'w8d2',
      week: 8,
      day: 2,
      title: 'The Simple Test',
      focus: '100 swings + 10 get-ups',
      type: 'test',
      estMinutes: 35,
      warmup: getupWarmup(),
      main: [
        perSide('one-hand-swing', 10, 10, 'heavy', { restSec: 30, note: '10x10 = 100 swings. Target near 5 minutes.' }),
        perSide('turkish-getup', 10, 1, 'heavy', { restSec: 0, note: '10 total get-ups, alternating, ~10 minutes.' }),
      ],
      notes: [
        'The StrongFirst "Simple" standard. Quality over clock — but note your time.',
        'If you hit every rep clean, you have built a serious foundation.',
      ],
    },
    {
      id: 'w8d3',
      week: 8,
      day: 3,
      title: 'Snatch Test',
      focus: 'Conditioning benchmark',
      type: 'test',
      estMinutes: 20,
      warmup: standardWarmup(),
      main: [
        perSide('snatch', 1, 50, 'moderate', { mode: 'amrap', timeSec: 300, note: '100 snatches in 5:00, switching sides as needed' }),
      ],
      finisher: [perSide('overhead-carry', 2, 1, 'moderate', { mode: 'time', timeSec: 40 })],
      notes: ['The classic snatch test: 100 reps in 5 minutes. Pace it and breathe.'],
    },
  ],
};

export const PROGRAM: Week[] = [week1, week2, week3, week4, week5, week6, week7, week8];

export const ALL_SESSIONS: Session[] = PROGRAM.flatMap((w) => w.sessions);

export function getSession(id: string): Session | undefined {
  return ALL_SESSIONS.find((s) => s.id === id);
}

export const TOTAL_SESSIONS = ALL_SESSIONS.length;
