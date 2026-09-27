import { StyleSheet, Text, View } from 'react-native';

import { chunky, colors, fonts, gameText } from '@/theme';

import { GameBackground } from './game-background';

export function ComingSoon({ name, emoji, color }: { name: string; emoji: string; color: string }) {
  return (
    <GameBackground>
      <View style={styles.center}>
        <View style={[styles.card, { backgroundColor: color }]}>
          <Text style={styles.emoji}>{emoji}</Text>
          <Text style={styles.title}>{name.toUpperCase()}</Text>
          <Text style={styles.body}>Locked · coming soon</Text>
        </View>
      </View>
    </GameBackground>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { ...chunky(8, 24), alignItems: 'center', paddingHorizontal: 40, paddingVertical: 28, gap: 6, transform: [{ rotate: '-2deg' }] },
  emoji: { fontSize: 56 },
  title: { ...gameText, fontSize: 34 },
  body: { fontFamily: fonts.black, fontSize: 14, color: colors.ink },
});
