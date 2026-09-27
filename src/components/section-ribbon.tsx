import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';

import type { Section } from '@/data/types';
import { chunky, colors, fonts, gameText, type Accent } from '@/theme';

type Props = {
  section: Section;
  accent: Accent;
  collapsed: boolean;
  onToggle: () => void;
  /** Items done today, or null when today isn't in the visible week. */
  doneToday: number | null;
};

export function SectionRibbon({ section, accent, collapsed, onToggle, doneToday }: Props) {
  const chevron = useAnimatedStyle(() => ({
    transform: [{ rotate: withSpring(collapsed ? '-90deg' : '0deg', { damping: 14 }) }],
  }));
  const total = section.items.length;
  const cleared = doneToday === total;

  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityState={{ expanded: !collapsed }}
      style={({ pressed }) => [styles.ribbon, pressed && { transform: [{ translateY: 2 }] }]}>
      <Text style={styles.emoji}>{section.emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.name} numberOfLines={1}>
          {section.name.toUpperCase()}
        </Text>
        {section.subtitle ? <Text style={styles.subtitle}>{section.subtitle}</Text> : null}
      </View>
      {doneToday !== null && (
        <View style={[styles.badge, { backgroundColor: cleared ? accent.base : colors.slot }]}>
          <Text style={cleared ? styles.badgeTextCleared : styles.badgeText}>
            {doneToday}/{total}
          </Text>
        </View>
      )}
      <Animated.Text style={[styles.chevron, chevron]}>▼</Animated.Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ribbon: {
    ...chunky(4, 14),
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.pink,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 14,
    marginBottom: 8,
  },
  emoji: { fontSize: 22 },
  name: { ...gameText, fontSize: 18, letterSpacing: 0.5 },
  subtitle: { fontFamily: fonts.body, color: '#FFE0EC', fontSize: 12, marginTop: -2 },
  badge: {
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 1,
  },
  badgeText: { ...gameText, fontSize: 14 },
  badgeTextCleared: { fontFamily: gameText.fontFamily, fontSize: 14, color: colors.ink },
  chevron: { ...gameText, fontSize: 14 },
});
