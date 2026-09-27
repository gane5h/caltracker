import type { Accent } from '@/theme';

export type Item = {
  id: string;
  name: string;
  /** Key into the exercise figure animations (milestone 5). */
  animationKey?: string;
};

export type Section = {
  id: string;
  name: string;
  subtitle?: string;
  emoji: string;
  items: Item[];
};

export type TrackerTab = {
  id: string;
  name: string;
  emoji: string;
  accent: Accent;
  sections: Section[];
};
