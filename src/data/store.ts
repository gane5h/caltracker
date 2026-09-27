import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { DayKey } from '@/utils/dates';

type CheckInState = {
  /** itemId → set of days it was checked (as an object for JSON storage). */
  checkIns: Record<string, Record<DayKey, true>>;
  toggle: (itemId: string, day: DayKey) => boolean;
};

export const useCheckIns = create<CheckInState>()(
  persist(
    (set, get) => ({
      checkIns: {},
      /** Flips the cell and returns whether it is now checked. */
      toggle: (itemId, day) => {
        const days = { ...get().checkIns[itemId] };
        const nowChecked = !days[day];
        if (nowChecked) days[day] = true;
        else delete days[day];
        set({ checkIns: { ...get().checkIns, [itemId]: days } });
        return nowChecked;
      },
    }),
    {
      name: 'chain/check-ins',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ checkIns: s.checkIns }),
    },
  ),
);

export function isChecked(state: CheckInState, itemId: string, day: DayKey): boolean {
  return state.checkIns[itemId]?.[day] === true;
}
