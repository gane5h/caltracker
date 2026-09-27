// Item ids are stored with check-ins, so never change an existing id.
export const fitnessTab = {
  id: 'fitness',
  sections: [
    {
      id: 'upper-push',
      name: 'Upper Body',
      subtitle: 'Shoulders · Push',
      emoji: '🏋️',
      items: [
        { id: 'shoulder-press', name: 'Shoulder press' },
        { id: 'chest-press', name: 'Chest press' },
        { id: 'skull-crusher', name: 'Skull crusher' },
        { id: 'tricep-kickback', name: 'Tricep kickback' },
        { id: 'lateral-raise', name: 'Lateral raise' },
        { id: 'chest-fly', name: 'Chest fly' },
      ],
    },
    {
      id: 'upper-pull',
      name: 'Upper Body',
      subtitle: 'Back · Pull',
      emoji: '🦾',
      items: [
        { id: 'bent-over-row', name: 'Bent-over DB row' },
        { id: 'bicep-curl', name: 'Bicep curls' },
      ],
    },
    {
      id: 'lower',
      name: 'Lower Body',
      subtitle: 'Legs',
      emoji: '🦵',
      items: [
        { id: 'deadlift', name: 'Deadlift' },
        { id: 'squat', name: 'Squat' },
      ],
    },
    {
      id: 'cardio',
      name: 'Cardio',
      subtitle: 'Treadmill · 30 min',
      emoji: '🏃',
      items: [{ id: 'treadmill-walk', name: 'Brisk walk' }],
    },
  ],
};
