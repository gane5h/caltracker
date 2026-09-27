import { accents } from '@/theme';

import type { TrackerTab } from './types';

// Item ids are persisted with check-ins, so never change an existing id.
export const fitnessTab: TrackerTab = {
  id: 'fitness',
  name: 'Fitness',
  emoji: '💪',
  accent: accents.fitness,
  sections: [
    {
      id: 'upper-push',
      name: 'Upper Body',
      subtitle: 'Shoulders · Push',
      emoji: '🏋️',
      items: [
        { id: 'shoulder-press', name: 'Shoulder press', animationKey: 'shoulder_press' },
        { id: 'chest-press', name: 'Chest press', animationKey: 'chest_press' },
        { id: 'skull-crusher', name: 'Skull crusher', animationKey: 'skull_crusher' },
        { id: 'tricep-kickback', name: 'Tricep kickback', animationKey: 'tricep_kickback' },
        { id: 'lateral-raise', name: 'Lateral raise', animationKey: 'lateral_raise' },
        { id: 'chest-fly', name: 'Chest fly', animationKey: 'chest_fly' },
      ],
    },
    {
      id: 'upper-pull',
      name: 'Upper Body',
      subtitle: 'Back · Pull',
      emoji: '🦾',
      items: [
        { id: 'bent-over-row', name: 'Bent-over DB row', animationKey: 'bent_over_row' },
        { id: 'bicep-curl', name: 'Bicep curls', animationKey: 'bicep_curl' },
      ],
    },
    {
      id: 'lower',
      name: 'Lower Body',
      subtitle: 'Legs',
      emoji: '🦵',
      items: [
        { id: 'deadlift', name: 'Deadlift', animationKey: 'deadlift' },
        { id: 'squat', name: 'Squat', animationKey: 'squat' },
      ],
    },
  ],
};
