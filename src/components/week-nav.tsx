import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, gameText } from '@/theme';
import { formatWeekRange } from '@/utils/dates';

import { ChunkyButton } from './chunky-button';

type Props = {
  weekStart: Date;
  isCurrentWeek: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
};

export function WeekNav({ weekStart, isCurrentWeek, onPrev, onNext, onToday }: Props) {
  return (
    <View style={styles.row}>
      <ChunkyButton onPress={onPrev} accessibilityLabel="Previous week">
        <Text style={styles.arrow}>◀</Text>
      </ChunkyButton>
      <View style={styles.center}>
        <Text style={styles.caption}>{isCurrentWeek ? 'THIS WEEK' : 'WEEK OF'}</Text>
        <Text style={styles.range}>{formatWeekRange(weekStart)}</Text>
        {!isCurrentWeek && (
          <Text style={styles.today} onPress={onToday} accessibilityRole="button">
            Back to today
          </Text>
        )}
      </View>
      <ChunkyButton onPress={onNext} disabled={isCurrentWeek} accessibilityLabel="Next week">
        <Text style={styles.arrow}>▶</Text>
      </ChunkyButton>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  center: { flex: 1, alignItems: 'center' },
  caption: { fontFamily: fonts.black, fontSize: 11, color: colors.muted, letterSpacing: 1.5 },
  range: { ...gameText, fontSize: 22 },
  today: { fontFamily: fonts.black, fontSize: 12, color: colors.cyan, textDecorationLine: 'underline' },
  arrow: { ...gameText, fontSize: 16 },
});
