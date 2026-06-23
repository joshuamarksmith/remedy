import type { Exercise } from '../types';

// A focused library of the kettlebell movements that matter, ordered roughly
// beginner -> advanced. Cues and mistakes are drawn from established hardstyle
// methodology (Tsatsouline / StrongFirst, Dan John) and current strength
// research on hip-hinge mechanics and ballistic power production.

export const EXERCISES: Exercise[] = [
  // ---------------- Mobility / prep ----------------
  {
    id: 'halo',
    name: 'Kettlebell Halo',
    category: 'mobility',
    pattern: 'mobility',
    summary:
      'Slow circles of the bell around the head to open the shoulders and thoracic spine.',
    cues: [
      'Hold the bell by the horns, bottom up or bottom down.',
      'Trace a tight circle close to the skull.',
      'Keep ribs down and glutes lightly braced — no leaning.',
    ],
    mistakes: ['Flaring the ribs', 'Rushing the circle', 'Shrugging the shoulders'],
  },
  {
    id: 'prying-goblet',
    name: 'Prying Goblet Squat',
    category: 'mobility',
    pattern: 'squat',
    summary: 'A loaded deep squat where you gently pry the hips open at the bottom.',
    cues: [
      'Sit straight down into a deep squat, elbows inside the knees.',
      'Use the elbows to push the knees out and pry the hips.',
      'Stay tall through the spine and breathe into the position.',
    ],
    mistakes: ['Rounding the lower back', 'Heels lifting', 'Bouncing aggressively'],
  },
  {
    id: 'arm-bar',
    name: 'Kettlebell Arm Bar',
    category: 'mobility',
    pattern: 'getup',
    summary: 'A grounded shoulder-stability drill that preps the get-up overhead position.',
    cues: [
      'Lie on your side, press the bell, then roll to your back.',
      'Pack the shoulder into the socket and lock the elbow.',
      'Slowly rotate the chest toward the ground, eyes on the bell.',
    ],
    mistakes: ['Soft, bent elbow', 'Losing sight of the bell', 'Forcing range too fast'],
    unilateral: true,
  },
  {
    id: 'cossack',
    name: 'Cossack Squat',
    category: 'mobility',
    pattern: 'squat',
    summary: 'Side-to-side squat that builds hip mobility and single-leg strength.',
    cues: [
      'Wide stance, shift fully over one bent leg.',
      'Keep the trailing leg straight, toes up.',
      'Chest tall, sit into the hip.',
    ],
    mistakes: ['Collapsing the chest', 'Heel of the working foot lifting'],
  },

  // ---------------- Foundational strength ----------------
  {
    id: 'deadlift',
    name: 'Kettlebell Deadlift',
    category: 'grind',
    pattern: 'hinge',
    summary: 'The foundational hip hinge — teaches the swing without the ballistics.',
    cues: [
      'Bell between the heels, hinge the hips back.',
      'Flat back, long spine, shoulders packed.',
      'Drive the floor away and squeeze the glutes to stand tall.',
    ],
    mistakes: ['Squatting instead of hinging', 'Rounding the back', 'Leaning back at the top'],
    progressionTo: 'two-hand-swing',
  },
  {
    id: 'goblet-squat',
    name: 'Goblet Squat',
    category: 'grind',
    pattern: 'squat',
    summary: 'Front-loaded squat that grooves clean squat mechanics and braces the core.',
    cues: [
      'Hold the bell at chest height by the horns.',
      'Sit between the hips, knees tracking over the toes.',
      'Drive up through mid-foot, ribs stacked over hips.',
    ],
    mistakes: ['Knees caving in', 'Elbows drifting away from the body', 'Heels rising'],
    progressionTo: 'front-squat',
  },
  {
    id: 'hinge-drill',
    name: 'Hip Hinge Drill',
    category: 'mobility',
    pattern: 'hinge',
    summary: 'A no-load (or light) hinge pattern using a dowel or hands to find the movement.',
    cues: [
      'Push the hips straight back, soft knees.',
      'Feel the hamstrings load like a spring.',
      'Stand by snapping the hips, not by squatting up.',
    ],
    mistakes: ['Bending the knees too much', 'Reaching down with the chest'],
    progressionTo: 'deadlift',
  },
  {
    id: 'dead-row',
    name: 'Dead-Stop Bent Row',
    category: 'grind',
    pattern: 'pull',
    summary: 'Hinge-and-row from a dead stop to build a strong, balanced back.',
    cues: [
      'Hinge to a flat-back position, bell on the floor.',
      'Row to the hip, leading with the elbow.',
      'Reset to the floor each rep — no momentum.',
    ],
    mistakes: ['Standing up to yank the bell', 'Rounding the back', 'Shrugging'],
    unilateral: true,
    progressionTo: 'renegade-row',
  },

  // ---------------- Ballistics ----------------
  {
    id: 'two-hand-swing',
    name: 'Two-Hand Swing',
    category: 'ballistic',
    pattern: 'hinge',
    summary:
      'The cornerstone kettlebell drill — an explosive hip snap that builds power and conditioning.',
    cues: [
      'Hike the bell back high between the thighs.',
      'Snap the hips and squeeze the glutes hard — the arms are ropes.',
      'Bell floats to chest height; brace and breathe sharp on the top.',
    ],
    mistakes: ['Squatting the swing', 'Using the arms to lift', 'Hyperextending the lower back at the top'],
    regressionOf: 'deadlift',
    progressionTo: 'one-hand-swing',
  },
  {
    id: 'one-hand-swing',
    name: 'One-Hand Swing',
    category: 'ballistic',
    pattern: 'hinge',
    summary: 'A single-arm swing that adds a strong anti-rotation demand on the core.',
    cues: [
      'Same hip snap; let the bell ride up on the working arm.',
      'Resist the twist — keep both hips and shoulders square.',
      'Tame the arc on the way down; hike late.',
    ],
    mistakes: ['Rotating the torso', 'Loose grip / over-gripping', 'Pulling with the arm'],
    regressionOf: 'two-hand-swing',
    progressionTo: 'snatch',
  },
  {
    id: 'dead-clean',
    name: 'Dead Clean',
    category: 'ballistic',
    pattern: 'hinge',
    summary: 'A clean from the floor each rep — teaches the rack landing without banging the wrist.',
    cues: [
      'Hike and clean, taming the arc into the rack.',
      'Spear the hand through; the bell rolls around, not slaps.',
      'Land in a tall rack: fist at the sternum, elbow down.',
    ],
    mistakes: ['Bell crashing on the forearm', 'Curling the bell up', 'Loose wrist'],
    progressionTo: 'clean',
  },
  {
    id: 'clean',
    name: 'Kettlebell Clean',
    category: 'ballistic',
    pattern: 'hinge',
    summary: 'Continuous cleans linking the backswing to a clean rack position.',
    cues: [
      'Keep the bell close — it travels in a tight vertical path.',
      'Open the hand and let the bell roll around the wrist.',
      'Absorb softly into the rack; stay tall and braced.',
    ],
    mistakes: ['Bell flipping over and banging', 'Wide looping arc', 'Gripping too hard'],
    regressionOf: 'dead-clean',
    progressionTo: 'clean-press',
  },
  {
    id: 'high-pull',
    name: 'Kettlebell High Pull',
    category: 'ballistic',
    pattern: 'hinge',
    summary: 'A swing that finishes with a horizontal elbow pull — the bridge to the snatch.',
    cues: [
      'Hip snap as in a swing, then pull the elbow back and high.',
      'Knuckles lead; keep the bell close to the body.',
      'Reverse the path and fall back into the next swing.',
    ],
    mistakes: ['Pulling early before the hips finish', 'Bell drifting forward'],
    progressionTo: 'snatch',
  },
  {
    id: 'snatch',
    name: 'Kettlebell Snatch',
    category: 'ballistic',
    pattern: 'hinge',
    summary:
      'The "tsar" of kettlebell lifts — one explosive movement from swing to locked overhead.',
    cues: [
      'Aggressive hip snap, then punch the hand to the ceiling.',
      'Spear through so the bell rolls quietly onto the forearm.',
      'Lock out tall: biceps by the ear, shoulder packed.',
    ],
    mistakes: ['Bell flopping and banging the wrist', 'Pressing it out at the top', 'Casting the bell too far forward'],
    regressionOf: 'high-pull',
  },

  // ---------------- Presses ----------------
  {
    id: 'strict-press',
    name: 'Strict Overhead Press',
    category: 'grind',
    pattern: 'press',
    summary: 'A grinding vertical press from the rack — builds honest overhead strength.',
    cues: [
      'Start in a tight rack, wrist straight, lat engaged.',
      'Press as if pushing yourself away from the bell.',
      'Lock out with the biceps near the ear, ribs down.',
    ],
    mistakes: ['Leaning back to press', 'Flaring the elbow early', 'Bent wrist'],
    unilateral: true,
    progressionTo: 'push-press',
  },
  {
    id: 'push-press',
    name: 'Push Press',
    category: 'grind',
    pattern: 'press',
    summary: 'A leg-driven press that moves heavier loads and builds overhead power.',
    cues: [
      'Short dip with vertical torso.',
      'Drive through the legs and ride the momentum overhead.',
      'Lock out and lower under control to the rack.',
    ],
    mistakes: ['Dipping forward', 'Pressing too early', 'Soft lockout'],
    unilateral: true,
    regressionOf: 'strict-press',
  },
  {
    id: 'floor-press',
    name: 'Floor Press',
    category: 'grind',
    pattern: 'press',
    summary: 'A horizontal press from the floor — shoulder-friendly pushing strength.',
    cues: [
      'Lie back, bell pressed, the triceps lightly touch the floor each rep.',
      'Keep the wrist stacked over the elbow.',
      'Drive the bell straight up, pause at the bottom.',
    ],
    mistakes: ['Bouncing the elbow off the floor', 'Flaring the elbow wide'],
    unilateral: true,
  },

  // ---------------- Get-ups & windmills ----------------
  {
    id: 'getup-elbow',
    name: 'Get-Up to Elbow',
    category: 'grind',
    pattern: 'getup',
    summary: 'The first half of the Turkish get-up — roll and post to the elbow.',
    cues: [
      'Press the bell up, same-side knee bent, eyes on the bell.',
      'Roll to the elbow, then to the hand, chest proud.',
      'Move slowly — the get-up is a strength skill, not a rep.',
    ],
    mistakes: ['Crunching up instead of rolling', 'Losing the vertical arm', 'Looking away from the bell'],
    progressionTo: 'turkish-getup',
  },
  {
    id: 'turkish-getup',
    name: 'Turkish Get-Up',
    category: 'grind',
    pattern: 'getup',
    summary:
      'A full floor-to-stand movement under load — total-body stability, mobility, and control.',
    cues: [
      'Roll to elbow, to hand, sweep the leg, hinge to a lunge, stand.',
      'Keep the loaded arm vertical and the shoulder packed throughout.',
      'Reverse the exact same path with control.',
    ],
    mistakes: ['Rushing the steps', 'Bending the wrist or elbow', 'Losing the overhead stack'],
    unilateral: true,
    regressionOf: 'getup-elbow',
  },
  {
    id: 'windmill',
    name: 'Kettlebell Windmill',
    category: 'grind',
    pattern: 'getup',
    summary: 'A loaded hip-hinge rotation that builds shoulder stability and hip mobility.',
    cues: [
      'Bell locked overhead, weight shifted into the rear hip.',
      'Hinge sideways, tracing the front leg with the free hand.',
      'Keep eyes on the bell and the loaded arm vertical.',
    ],
    mistakes: ['Squatting instead of hinging', 'Letting the overhead arm drift', 'Rounding the back'],
    unilateral: true,
  },

  // ---------------- Squats (loaded) ----------------
  {
    id: 'front-squat',
    name: 'Rack Front Squat',
    category: 'grind',
    pattern: 'squat',
    summary: 'A squat with the bell(s) in the rack — heavier loading than the goblet.',
    cues: [
      'Bell in a tight rack, elbow tucked to the ribs.',
      'Sit between the hips, stay tall and braced.',
      'Drive evenly through the whole foot.',
    ],
    mistakes: ['Elbow dropping and pulling you forward', 'Knees caving', 'Losing the rack'],
    regressionOf: 'goblet-squat',
  },

  // ---------------- Carries & core ----------------
  {
    id: 'suitcase-carry',
    name: 'Suitcase Carry',
    category: 'carry',
    pattern: 'carry',
    summary: 'A one-side loaded walk — brutal anti-lateral-flexion core work.',
    cues: [
      'Stand tall, brace, walk with even, quiet steps.',
      'Resist leaning toward the bell — stay perfectly upright.',
      'Crush the handle; keep the shoulder packed.',
    ],
    mistakes: ['Side-bending toward the load', 'Hiking the shoulder', 'Rushing the steps'],
    unilateral: true,
  },
  {
    id: 'rack-carry',
    name: 'Rack Carry',
    category: 'carry',
    pattern: 'carry',
    summary: 'A loaded walk in the rack — teaches bracing and breathing under load.',
    cues: [
      'Tall rack, ribs down, glutes lightly braced.',
      'Breathe behind the brace, short controlled steps.',
      'Keep the bell from sagging away from the body.',
    ],
    mistakes: ['Leaning back', 'Holding the breath', 'Losing the rack position'],
    unilateral: true,
  },
  {
    id: 'overhead-carry',
    name: 'Overhead Carry',
    category: 'carry',
    pattern: 'carry',
    summary: 'Walking with the bell locked out overhead — shoulder stability under fatigue.',
    cues: [
      'Lock the bell out, shoulder packed, biceps by the ear.',
      'Ribs down, walk tall with control.',
      'Keep the wrist straight and the elbow locked.',
    ],
    mistakes: ['Arching the lower back', 'Soft elbow', 'Letting the arm drift forward'],
    unilateral: true,
  },
  {
    id: 'hollow-hold',
    name: 'Hollow Hold',
    category: 'core',
    pattern: 'core',
    summary: 'A bodyweight anti-extension hold that wires total-body tension.',
    cues: [
      'Press the lower back into the floor.',
      'Lift the shoulders and legs, reach long.',
      'Breathe shallow but steady — keep the brace.',
    ],
    mistakes: ['Lower back arching off the floor', 'Holding the breath'],
  },
  {
    id: 'renegade-row',
    name: 'Renegade Row',
    category: 'core',
    pattern: 'pull',
    summary: 'A plank row on the bells — anti-rotation core plus pulling strength.',
    cues: [
      'Wide feet, rigid plank, hips level.',
      'Row one bell to the hip without twisting the torso.',
      'Push the floor away with the supporting arm.',
    ],
    mistakes: ['Hips rotating', 'Sagging the plank', 'Feet too narrow'],
    regressionOf: 'dead-row',
  },

  // ---------------- Complexes / flows ----------------
  {
    id: 'clean-press',
    name: 'Clean & Press',
    category: 'complex',
    pattern: 'press',
    summary: 'Clean the bell to the rack and press it overhead — the classic strength combo.',
    cues: [
      'Clean to a solid rack, reset your breath.',
      'Press from a stable base, lock out tall.',
      'Lower to the rack, then back to the swing — stay smooth.',
    ],
    mistakes: ['Rushing rack to press', 'Losing tension between reps'],
    unilateral: true,
    regressionOf: 'clean',
  },
  {
    id: 'abc',
    name: 'Armor Building Complex (ABC)',
    category: 'complex',
    pattern: 'press',
    summary:
      "Dan John's double-bell complex: 2 cleans, 2 presses, 3 front squats — dense full-body work.",
    cues: [
      'Two cleans, two presses, three front squats = one round.',
      'Move with intent but never rush the rack landing.',
      'Use the EMOM clock to pace recovery.',
    ],
    mistakes: ['Breaking down form as fatigue sets in', 'Going too heavy too soon'],
  },
  {
    id: 'swing-clean-press',
    name: 'Swing–Clean–Press Flow',
    category: 'complex',
    pattern: 'hinge',
    summary: 'A chained flow that strings the big patterns together for conditioning and skill.',
    cues: [
      'One swing, one clean, one press — flow without pausing.',
      'Stay tall in transitions; let the hips power each piece.',
      'Switch sides each round to stay balanced.',
    ],
    mistakes: ['Letting form fall apart for speed', 'Forgetting to breathe'],
  },
];

export const EXERCISE_MAP: Record<string, Exercise> = Object.fromEntries(
  EXERCISES.map((e) => [e.id, e]),
);

export function getExercise(id: string): Exercise {
  const ex = EXERCISE_MAP[id];
  if (!ex) throw new Error(`Unknown exercise: ${id}`);
  return ex;
}
