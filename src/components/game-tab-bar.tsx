import type { BottomTabBarProps } from 'expo-router/tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';

import { chunky, colors, fonts, gameText } from '@/theme';

export type TabMeta = { emoji: string; label: string; color: string };

export function GameTabBar({ state, navigation, insets, meta }: BottomTabBarProps & { meta: Record<string, TabMeta> }) {
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {state.routes.map((route, index) => {
        const m = meta[route.name];
        if (!m) return null;
        const focused = state.index === index;
        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };
        return <TabButton key={route.key} meta={m} focused={focused} onPress={onPress} />;
      })}
    </View>
  );
}

function TabButton({ meta, focused, onPress }: { meta: TabMeta; focused: boolean; onPress: () => void }) {
  const lift = useAnimatedStyle(() => ({
    transform: [
      { translateY: withSpring(focused ? -8 : 0, { damping: 11, stiffness: 260 }) },
      { scale: withSpring(focused ? 1.08 : 1, { damping: 11, stiffness: 260 }) },
    ],
  }));
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={meta.label}
      style={styles.slot}>
      <Animated.View style={[styles.button, { backgroundColor: focused ? meta.color : colors.panel }, lift]}>
        <Text style={[styles.emoji, !focused && { opacity: 0.75 }]}>{meta.emoji}</Text>
        <Text style={[styles.label, !focused && { color: colors.muted }]} numberOfLines={1}>
          {meta.label.toUpperCase()}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 10,
    paddingTop: 14,
    backgroundColor: colors.slot,
    borderTopWidth: 3,
    borderTopColor: colors.ink,
  },
  slot: { flex: 1 },
  button: { ...chunky(5, 14), alignItems: 'center', paddingVertical: 4 },
  emoji: { fontSize: 22 },
  label: { ...gameText, fontFamily: fonts.display, fontSize: 13 },
});
