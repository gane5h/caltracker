// The starting layout. After the first launch the layout is saved on the phone
// and edited in the app. Item ids are stored with check-ins, so never change one.
// `exercise` picks the animation, muscle map and tips from exercises.js.
export const fitnessTab = {
  id: 'fitness',
  sections: [
    {
      id: 'upper-push',
      name: 'Upper Body',
      subtitle: 'Shoulders · Push',
      emoji: '🏋️',
      items: [
        { id: 'shoulder-press', name: 'Shoulder press', exercise: 'shoulder-press' },
        { id: 'chest-press', name: 'Chest press', exercise: 'chest-press' },
        { id: 'skull-crusher', name: 'Skull crusher', exercise: 'skull-crusher' },
        { id: 'tricep-kickback', name: 'Tricep kickback', exercise: 'tricep-kickback' },
        { id: 'lateral-raise', name: 'Lateral raise', exercise: 'lateral-raise' },
        { id: 'chest-fly', name: 'Chest fly', exercise: 'chest-fly' },
      ],
    },
    {
      id: 'upper-pull',
      name: 'Upper Body',
      subtitle: 'Back · Pull',
      emoji: '🦾',
      items: [
        { id: 'bent-over-row', name: 'Bent-over DB row', exercise: 'bent-over-row' },
        { id: 'bicep-curl', name: 'Bicep curls', exercise: 'bicep-curl' },
      ],
    },
    {
      id: 'lower',
      name: 'Lower Body',
      subtitle: 'Legs',
      emoji: '🦵',
      items: [
        { id: 'deadlift', name: 'Deadlift', exercise: 'deadlift' },
        { id: 'squat', name: 'Squat', exercise: 'squat' },
      ],
    },
  ],
};
