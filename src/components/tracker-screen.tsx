import { useEffect, useState } from 'react';
import { AppState, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCheckIns } from '@/data/store';
import type { TrackerTab } from '@/data/types';
import { chunky, colors, gameText } from '@/theme';
import { addDays, fromDayKey, startOfWeek, toDayKey, weekDays } from '@/utils/dates';

import { ChainGrid, GRID_PADDING } from './chain-grid';
import { GameBackground } from './game-background';
import { Star } from './star';
import { WeekNav } from './week-nav';

/** Today's key, refreshed when the app returns to the foreground (e.g. the next morning). */
function useTodayKey() {
  const [today, setToday] = useState(() => toDayKey(new Date()));
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') setToday(toDayKey(new Date()));
    });
    return () => sub.remove();
  }, []);
  return today;
}

export function TrackerScreen({ tab }: { tab: TrackerTab }) {
  const insets = useSafeAreaInsets();
  const todayKey = useTodayKey();
  const currentWeekStart = startOfWeek(fromDayKey(todayKey));
  const [weekOffset, setWeekOffset] = useState(0);
  const weekStart = addDays(currentWeekStart, weekOffset * 7);

  const checkIns = useCheckIns((s) => s.checkIns);
  const itemIds = tab.sections.flatMap((s) => s.items.map((i) => i.id));
  const weekKeys = weekDays(weekStart).map(toDayKey);
  const weekTotal = itemIds.reduce(
    (n, id) => n + weekKeys.filter((k) => checkIns[id]?.[k]).length,
    0,
  );

  return (
    <GameBackground>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 8, paddingBottom: 24 },
        ]}>
        <View style={styles.hud}>
          <View style={[styles.titlePlate, { backgroundColor: tab.accent.base }]}>
            <Text style={styles.titleEmoji}>{tab.emoji}</Text>
            <Text style={styles.title}>{tab.name.toUpperCase()}</Text>
          </View>
          <View style={styles.counter} accessibilityLabel={`${weekTotal} check-ins this week`}>
            <Star size={22} fill={colors.yellow} />
            <Text style={styles.counterText}>{weekTotal}</Text>
          </View>
        </View>

        <WeekNav
          weekStart={weekStart}
          isCurrentWeek={weekOffset === 0}
          onPrev={() => setWeekOffset((w) => w - 1)}
          onNext={() => setWeekOffset((w) => Math.min(0, w + 1))}
          onToday={() => setWeekOffset(0)}
        />

        <View style={styles.board}>
          <ChainGrid tab={tab} weekStart={weekStart} todayKey={todayKey} />
        </View>
      </ScrollView>
    </GameBackground>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: GRID_PADDING, gap: 14, width: '100%', maxWidth: 520, alignSelf: 'center' },
  hud: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titlePlate: {
    ...chunky(5, 14),
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 4,
    transform: [{ rotate: '-2deg' }],
  },
  titleEmoji: { fontSize: 24 },
  title: { ...gameText, fontSize: 28, color: colors.white },
  counter: {
    ...chunky(4, 20),
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.slot,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  counterText: { ...gameText, fontSize: 20 },
  // Bleeds slightly into the page gutter; inner width still matches ChainGrid's layout math.
  board: {
    ...chunky(6, 20),
    backgroundColor: colors.panel,
    marginHorizontal: -(GRID_PADDING - 4),
    paddingHorizontal: GRID_PADDING - 7,
    paddingTop: 10,
    paddingBottom: 6,
  },
});
