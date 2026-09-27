import { useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { useCheckIns } from '@/data/store';
import type { Item, TrackerTab } from '@/data/types';
import { colors, fonts, gameText, type Accent } from '@/theme';
import { toDayKey, weekDays, WEEKDAY_LETTERS, type DayKey } from '@/utils/dates';

import { CheckCell } from './check-cell';
import { SectionRibbon } from './section-ribbon';

export const GRID_PADDING = 12;
const CELL_GAP = 5;

type Props = { tab: TrackerTab; weekStart: Date; todayKey: DayKey };

export function ChainGrid({ tab, weekStart, todayKey }: Props) {
  const { width } = useWindowDimensions();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const checkIns = useCheckIns((s) => s.checkIns);

  const days = weekDays(weekStart);
  const dayKeys = days.map(toDayKey);
  const showsToday = dayKeys.includes(todayKey);

  const contentWidth = Math.min(width, 520) - GRID_PADDING * 2;
  const nameWidth = Math.min(150, Math.round(contentWidth * 0.36));
  // Floor keeps the first web render (window width 0) from producing negative sizes.
  const cellSize = Math.max(24, Math.floor((contentWidth - nameWidth - CELL_GAP * 7) / 7));

  return (
    <View>
      <View style={styles.row}>
        <View style={{ width: nameWidth }} />
        {days.map((d, i) => {
          const isToday = dayKeys[i] === todayKey;
          return (
            <View
              key={dayKeys[i]}
              style={[
                styles.dayHeader,
                { width: cellSize, marginLeft: CELL_GAP },
                isToday && { backgroundColor: tab.accent.base, borderColor: colors.ink },
              ]}>
              <Text style={isToday ? styles.dayLetterToday : styles.dayLetter}>{WEEKDAY_LETTERS[i]}</Text>
              <Text style={[styles.dayNum, isToday && { color: colors.ink }]}>{d.getDate()}</Text>
            </View>
          );
        })}
      </View>

      {tab.sections.map((section) => {
        const isCollapsed = !!collapsed[section.id];
        const doneToday = showsToday
          ? section.items.filter((it) => checkIns[it.id]?.[todayKey]).length
          : null;
        return (
          <View key={section.id}>
            <SectionRibbon
              section={section}
              accent={tab.accent}
              collapsed={isCollapsed}
              doneToday={doneToday}
              onToggle={() => setCollapsed((c) => ({ ...c, [section.id]: !isCollapsed }))}
            />
            {!isCollapsed &&
              section.items.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  accent={tab.accent}
                  dayKeys={dayKeys}
                  todayKey={todayKey}
                  nameWidth={nameWidth}
                  cellSize={cellSize}
                />
              ))}
          </View>
        );
      })}
    </View>
  );
}

function ItemRow({
  item,
  accent,
  dayKeys,
  todayKey,
  nameWidth,
  cellSize,
}: {
  item: Item;
  accent: Accent;
  dayKeys: DayKey[];
  todayKey: DayKey;
  nameWidth: number;
  cellSize: number;
}) {
  const days = useCheckIns((s) => s.checkIns[item.id]);
  const toggle = useCheckIns((s) => s.toggle);

  return (
    <View style={[styles.row, { marginBottom: CELL_GAP + 2 }]}>
      <Text style={[styles.itemName, { width: nameWidth }]} numberOfLines={2}>
        {item.name}
      </Text>
      {dayKeys.map((day) => (
        <View key={day} style={{ marginLeft: CELL_GAP }}>
          <CheckCell
            size={cellSize}
            accent={accent}
            checked={days?.[day] === true}
            isToday={day === todayKey}
            // DayKeys sort lexically, so this is "day is after today".
            disabled={day > todayKey}
            label={`${item.name} on ${day}`}
            onToggle={() => toggle(item.id, day)}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  dayHeader: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    paddingVertical: 2,
  },
  dayLetter: { ...gameText, fontSize: 15 },
  dayNum: { fontFamily: fonts.body, fontSize: 11, color: colors.muted },
  dayLetterToday: { fontFamily: gameText.fontFamily, fontSize: 15, color: colors.ink },
  itemName: {
    fontFamily: fonts.black,
    fontSize: 14,
    lineHeight: 16,
    color: colors.white,
    paddingRight: 4,
  },
});
