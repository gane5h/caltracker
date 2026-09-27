import type { ReactNode } from 'react';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { chunky, colors } from '@/theme';

type Props = {
  onPress: () => void;
  children: ReactNode;
  color?: string;
  disabled?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
};

/** A button that physically "presses down" onto its 3D edge. */
export function ChunkyButton({ onPress, children, color = colors.cyan, disabled, style, accessibilityLabel }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: color, opacity: disabled ? 0.4 : 1 },
        pressed && styles.pressed,
        style,
      ]}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    ...chunky(5, 12),
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 40,
    paddingHorizontal: 10,
  },
  pressed: { borderBottomWidth: 4, marginTop: 4 },
});
