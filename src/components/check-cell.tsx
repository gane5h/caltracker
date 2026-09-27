import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { colors, type Accent } from '@/theme';

import { Star } from './star';

type Props = {
  checked: boolean;
  disabled: boolean;
  isToday: boolean;
  size: number;
  accent: Accent;
  label: string;
  onToggle: () => boolean;
};

const PARTICLES = 6;

export function CheckCell({ checked, disabled, isToday, size, accent, label, onToggle }: Props) {
  const scale = useSharedValue(1);
  const burst = useSharedValue(0);

  const handlePress = () => {
    const nowChecked = onToggle();
    scale.value = withSequence(
      withTiming(0.72, { duration: 70 }),
      withSpring(1, { damping: 7, stiffness: 320, mass: 0.6 }),
    );
    if (nowChecked) {
      burst.value = 0;
      burst.value = withTiming(1, { duration: 480, easing: Easing.out(Easing.cubic) });
    }
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(
        nowChecked ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Light,
      );
    }
  };

  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const radius = size * 0.28;

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      hitSlop={2}
      role="checkbox"
      aria-checked={checked}
      aria-disabled={disabled}
      aria-label={label}
      style={{ width: size, height: size }}>
      <Animated.View style={[StyleSheet.absoluteFill, popStyle]}>
        {checked ? (
          <LinearGradient
            colors={['#FFF6A8', accent.base, accent.deep]}
            locations={[0, 0.45, 1]}
            style={[
              styles.token,
              { borderRadius: radius, borderColor: colors.ink },
            ]}>
            <View style={[styles.gloss, { borderRadius: radius * 0.6 }]} />
            <Star size={size * 0.52} />
          </LinearGradient>
        ) : (
          <View
            style={[
              styles.slot,
              { borderRadius: radius, opacity: disabled ? 0.35 : 1 },
              isToday && { borderColor: accent.base, borderTopColor: accent.deep },
            ]}
          />
        )}
      </Animated.View>
      {Array.from({ length: PARTICLES }, (_, i) => (
        <Particle key={i} index={i} progress={burst} size={size} color={i % 2 ? colors.white : accent.base} />
      ))}
    </Pressable>
  );
}

function Particle({
  index,
  progress,
  size,
  color,
}: {
  index: number;
  progress: SharedValue<number>;
  size: number;
  color: string;
}) {
  const angle = (index / PARTICLES) * Math.PI * 2 - Math.PI / 2;
  const distance = size * 0.85;
  const style = useAnimatedStyle(() => {
    const p = progress.value;
    const visible = p > 0 && p < 1;
    return {
      opacity: visible ? 1 - p : 0,
      transform: [
        { translateX: Math.cos(angle) * distance * p },
        { translateY: Math.sin(angle) * distance * p },
        { scale: 1 - p * 0.5 },
        { rotate: `${p * 180}deg` },
      ],
    };
  });
  const s = size * 0.32;
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', left: (size - s) / 2, top: (size - s) / 2 }, style]}>
      <Star size={s} fill={color} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  token: {
    flex: 1,
    borderWidth: 2.5,
    borderBottomWidth: 4.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  gloss: {
    position: 'absolute',
    top: 2,
    left: 3,
    right: 3,
    height: '32%',
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  // Recessed slot: darker top edge reads as an inset.
  slot: {
    flex: 1,
    backgroundColor: colors.slot,
    borderWidth: 2,
    borderTopWidth: 4,
    borderColor: '#2E1F66',
    borderTopColor: colors.slotEdge,
  },
});
