import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme';

/** Purple arena gradient with faint diagonal stripes. */
export function GameBackground({ children }: { children: ReactNode }) {
  return (
    <LinearGradient colors={[colors.bgTop, colors.bgBottom]} style={styles.fill}>
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.stripes]}>
        {Array.from({ length: 14 }, (_, i) => (
          <View key={i} style={[styles.stripe, { left: i * 90 - 300 }]} />
        ))}
      </View>
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  stripes: { overflow: 'hidden' },
  stripe: {
    position: 'absolute',
    top: -200,
    width: 36,
    height: 2000,
    backgroundColor: 'rgba(255,255,255,0.035)',
    transform: [{ rotate: '25deg' }],
  },
});
