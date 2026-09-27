// The exercise library: how each figure moves, which muscles it works, and form tips.
//
// Poses give each body segment's direction in degrees: 0 points down, 90 points
// the way the figure faces (front view: away from the body's centre), 180 points up.
// Values past 180 keep rotating the same way, so 190 is "up, tipped back".
//
// Views: 'side' (standing, feet planted), 'lying' (on a bench, side view),
// 'front' (standing, facing you), 'front-lying' (on a bench, seen from the feet).
// `db` is how the dumbbell faces the camera: 'end' (a round plate) or 'bar'.
//
// Timing: the figure holds poses[0], moves to poses[1], holds, and comes back.
// With reduced motion the figure rests in poses[1], the working position.

const STAND = { torso: 180, ua: 0, fa: 0, th: 0, sh: 0 };
const HINGE = { torso: 125, th: 18, sh: -8 };
const BENCH = { torso: -90, th: 90, sh: 0 };

export const EXERCISES = {
  'shoulder-press': {
    name: 'Shoulder press',
    view: 'front',
    db: 'bar',
    poses: [{ ua: 90, fa: 180 }, { ua: 165, fa: 176 }],
    muscles: { primary: ['delts'], secondary: ['triceps', 'traps'] },
    tips: [
      'Start with the dumbbells at ear height, elbows slightly in front of your shoulders.',
      'Press up and a little in, so the weights nearly meet over your head.',
      'Brace your stomach so your lower back doesn’t arch.',
    ],
  },
  'chest-press': {
    name: 'Chest press',
    view: 'lying',
    db: 'end',
    poses: [{ ...BENCH, ua: 40, fa: 180 }, { ...BENCH, ua: 178, fa: 180 }],
    muscles: { primary: ['chest'], secondary: ['delts', 'triceps'] },
    tips: [
      'Feet flat on the floor, shoulder blades squeezed back into the bench.',
      'Lower until your elbows are just below the bench, at about 45° from your body.',
      'Push up over your chest, not your face.',
    ],
  },
  'skull-crusher': {
    name: 'Skull crusher',
    view: 'lying',
    db: 'end',
    poses: [{ ...BENCH, ua: 190, fa: 186 }, { ...BENCH, ua: 196, fa: 296 }],
    muscles: { primary: ['triceps'], secondary: ['forearms'] },
    tips: [
      'Keep your upper arms still, tipped slightly back toward your head.',
      'Bend only at the elbows and lower the weights beside your head, slowly.',
      'Straighten fully and squeeze the backs of your arms at the top.',
    ],
  },
  'tricep-kickback': {
    name: 'Tricep kickback',
    view: 'side',
    db: 'end',
    poses: [{ ...HINGE, torso: 112, ua: -68, fa: 0 }, { ...HINGE, torso: 112, ua: -72, fa: -66 }],
    muscles: { primary: ['triceps'], secondary: ['delts'] },
    tips: [
      'Hinge forward with a flat back and pin your upper arm to your side.',
      'Only your forearm moves: swing it back until your arm is straight.',
      'Pause at the top and lower with control. No swinging.',
    ],
  },
  'lateral-raise': {
    name: 'Lateral raise',
    view: 'front',
    db: 'end',
    poses: [{ ua: 10, fa: 14 }, { ua: 88, fa: 96 }],
    muscles: { primary: ['delts'], secondary: ['traps'] },
    tips: [
      'Keep a soft bend in your elbows the whole time.',
      'Lift out to the sides until your arms are level with your shoulders. No higher.',
      'Lead with your elbows and lower slowly. Light weights are fine.',
    ],
  },
  'chest-fly': {
    name: 'Chest fly',
    view: 'front-lying',
    db: 'end',
    poses: [{ ua: 96, fa: 108 }, { ua: 190, fa: 200 }],
    muscles: { primary: ['chest'], secondary: ['delts', 'biceps'] },
    tips: [
      'Lie on the bench and keep a slight, fixed bend in your elbows.',
      'Open your arms in a wide arc until you feel a stretch across your chest.',
      'Bring the weights back together as if hugging a big tree.',
    ],
  },
  'bent-over-row': {
    name: 'Bent-over DB row',
    view: 'side',
    db: 'bar',
    poses: [{ ...HINGE, ua: 0, fa: 0 }, { ...HINGE, ua: -62, fa: 2 }],
    muscles: { primary: ['lats'], secondary: ['traps', 'delts', 'biceps'] },
    tips: [
      'Hinge at the hips with a flat back, knees soft, arms hanging straight.',
      'Pull your elbows back past your body, toward your hips.',
      'Squeeze your shoulder blades together at the top, then lower slowly.',
    ],
  },
  'bicep-curl': {
    name: 'Bicep curls',
    view: 'side',
    db: 'end',
    poses: [{ ...STAND, ua: 4, fa: 8 }, { ...STAND, ua: 12, fa: 158 }],
    muscles: { primary: ['biceps'], secondary: ['forearms'] },
    tips: [
      'Stand tall with your elbows tucked in at your sides.',
      'Curl the weights up without letting your elbows drift forward.',
      'Lower all the way down slowly. That half counts too.',
    ],
  },
  deadlift: {
    name: 'Deadlift',
    view: 'side',
    db: 'bar',
    poses: [{ ...STAND }, { torso: 108, ua: -4, fa: -4, th: 32, sh: -6 }],
    muscles: { primary: ['glutes', 'hamstrings', 'lowerBack'], secondary: ['traps', 'forearms', 'quads'] },
    tips: [
      'Push your hips back while the dumbbells slide down the front of your legs.',
      'Keep your back flat and your chest proud, with a small knee bend.',
      'Drive your hips forward to stand up and squeeze your glutes at the top.',
    ],
  },
  squat: {
    name: 'Squat',
    view: 'side',
    db: 'bar',
    dbTilt: 90,
    poses: [{ ...STAND, ua: 22, fa: 162 }, { torso: 148, ua: 50, fa: 172, th: 82, sh: -22 }],
    muscles: { primary: ['quads', 'glutes'], secondary: ['hamstrings', 'calves', 'abs'] },
    tips: [
      'Hold one dumbbell upright against your chest, feet shoulder-width apart.',
      'Sit back and down until your thighs are about level with the floor.',
      'Keep your heels down and knees tracking over your toes, then stand up.',
    ],
  },
};

export const MUSCLE_NAMES = {
  delts: 'Shoulders',
  chest: 'Chest',
  biceps: 'Biceps',
  forearms: 'Forearms',
  abs: 'Core',
  quads: 'Quads',
  traps: 'Traps',
  lats: 'Lats',
  triceps: 'Triceps',
  lowerBack: 'Lower back',
  glutes: 'Glutes',
  hamstrings: 'Hamstrings',
  calves: 'Calves',
};
