import type { TextStyle, ViewStyle } from 'react-native';

export const colors = {
  bgTop: '#2B1B5A',
  bgBottom: '#4A2FBD',
  ink: '#12082B', // outlines and hard shadows
  panel: '#3A2585',
  panelDeep: '#23155033',
  slot: '#1A0F3D',
  slotEdge: '#0C0620',
  white: '#FFFFFF',
  muted: '#A99BE0',
  yellow: '#FFD500',
  yellowDeep: '#E09A00',
  pink: '#FF3D7F',
  lime: '#7CFF3D',
  cyan: '#2FD8FF',
} as const;

export type Accent = { base: string; deep: string };

export const accents = {
  fitness: { base: colors.yellow, deep: colors.yellowDeep },
  diet: { base: colors.lime, deep: '#3DB31A' },
  finances: { base: colors.cyan, deep: '#1497C2' },
} satisfies Record<string, Accent>;

export const fonts = {
  display: 'LilitaOne_400Regular',
  body: 'Nunito_800ExtraBold',
  black: 'Nunito_900Black',
} as const;

/** White game-style lettering with a hard dark drop shadow. */
export const gameText: TextStyle = {
  fontFamily: fonts.display,
  color: colors.white,
  textShadowColor: colors.ink,
  textShadowOffset: { width: 0, height: 2 },
  textShadowRadius: 0.1,
};

/** Chunky "3D" block: thick outline with a deeper bottom edge instead of a blurred shadow. */
export function chunky(depth = 5, radius = 16): ViewStyle {
  return {
    borderWidth: 3,
    borderBottomWidth: 3 + depth,
    borderColor: colors.ink,
    borderRadius: radius,
  };
}
