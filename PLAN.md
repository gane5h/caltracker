# Chain — personal "don't break the chain" tracker

A personal mobile app with one tab per life area (Fitness, Diet, Finances, …).
Each tab is a weekly grid: **7 columns (Mon–Sun) × rows of actions**. Tap a cell
to check in. The goal is simple: keep the chain unbroken.

We build **Fitness first**, with the structure ready for the other tabs.

---

## 1. Tech stack

| Concern | Choice | Why |
|---|---|---|
| App framework | **Expo (React Native) + TypeScript** | One codebase for iOS and Android; runs on your phone through Expo Go in minutes, and EAS builds a real installable app later |
| Navigation | **expo-router** with a bottom tab bar | File-based tabs; adding "Diet" later is one new file |
| Local storage | **react-native-mmkv** (or AsyncStorage) behind a small repository layer | Fast, works offline, no backend needed for a personal app. Can sync to the cloud later without touching the UI |
| State | **Zustand** | Small, simple, and saves its state to storage |
| Animations | **react-native-reanimated** + **moti** | 60fps springs and bounces for tap feedback and streak effects |
| Exercise infographics | **react-native-svg** animated with Reanimated (Lottie as a fallback) | Custom looping figure animations in the app's style, small file size |
| Haptics / sound | **expo-haptics**, **expo-av** | The satisfying "thunk" when you check in |
| Fonts | **Lilita One** (headings) + **Nunito Black/ExtraBold** (body) via expo-font | Heavy, rounded, game-UI lettering |

No accounts, no server. Data stays on the device, with a JSON export/import for backup.

---

## 2. Visual direction — "Brawl Stars" style

Original art in a similar *style*; no copied game assets or branding.

- **Palette:** deep purple-blue backgrounds (`#2B1B5A` → `#4A2FBD` gradient),
  punchy accents: electric yellow `#FFD500`, hot pink `#FF3D7F`, lime `#7CFF3D`,
  cyan `#2FD8FF`. Each tab gets its own accent (Fitness = yellow, Diet = lime,
  Finances = cyan).
- **Chunky UI:** thick dark outlines (3–4px, `#12082B`), big corner radii,
  a solid "3D" bottom shadow under every button and card (offset shadow, no blur),
  and text with a dark outline and a drop shadow.
- **Cells:** empty cells look like recessed dark slots. A checked cell pops into
  a glossy, raised token with a star or checkmark.
- **Section headers:** banners shaped like ribbons with an icon
  (e.g. dumbbell, back, legs).
- **Top HUD:** a flame streak counter and a "trophy" total, like a game's
  resource bar.
- **Motion rules:** everything is springy and quick (≤ 300ms). Nothing loops in
  the background except the idle exercise figures and a soft flame flicker.

### Check-in feedback (the fun part)
1. Tap → the cell squashes and stretches, then pops to its checked state, with a heavy haptic.
2. A small burst of stars and confetti, and the row's streak number ticks up.
3. When the whole section is done for the day → the banner shines, and "SECTION CLEAR!" stamps in.
4. Streak milestones (7, 30, 100 days) → a full-screen trophy card, like a chest opening in a game.
5. Tapping a checked cell again undoes it, with a gentler animation, so mistakes are easy to fix.

---

## 3. Screen layout (Fitness tab)

```
┌──────────────────────────────────────┐
│  🔥 12-day chain      🏆 148 total    │  ← HUD
│  ◀  Week of Sep 21 – 27  ▶           │  ← swipe/arrow week nav
├──────────────────────────────────────┤
│             M  T  W  T  F  S  S      │  ← today's column highlighted
│ ▼ UPPER BODY · SHOULDERS/PUSH  4/6   │  ← collapsible ribbon
│  Shoulder press     ■  □  ■  □  ■ …  │
│  Chest press        ■  □  ■  □  □ …  │
│  …                                   │
│ ▼ UPPER BODY · BACK/PULL       1/2   │
│  Bent-over DB row   □  ■  □  ■  □ …  │
│  …                                   │
│ ▼ LOWER BODY                  0/2    │
│  Deadlift           □  □  ■  □  □ …  │
│  Squat              □  □  ■  □  □ …  │
├──────────────────────────────────────┤
│  [🏋 Fitness] [🥗 Diet] [💰 Money] [+] │  ← bottom tabs
└──────────────────────────────────────┘
```

- The exercise names column stays fixed on the left. Each exercise has a small
  animated figure next to its name.
- **Tap a cell** → check in or undo. **Long-press an exercise name** → the exercise card.
- Future days are dimmed and can't be tapped. Past days can be edited, so a
  forgotten check-in can be filled in.
- Swipe left or right to see earlier weeks.

### Exercise card (bottom sheet)
- A large looping animated figure doing the movement.
- A muscle map (front and back silhouette) with the targeted muscles glowing.
- 3 short form tips (e.g. "Elbows slightly in front of your shoulders").
- This exercise's current streak, best streak, and a 12-week mini heatmap.

---

## 4. Fitness content (v1)

The upper-body list below is my proposed split into push and pull. Please confirm it.

**Upper Body — Shoulders / Push**
1. Shoulder press
2. Chest press
3. Skull crusher
4. Dumbbell tricep kickback
5. Lateral raise
6. Chest fly

**Upper Body — Back / Pull**
1. Bent-over dumbbell row
2. Bicep curls

**Lower Body**
1. Deadlift
2. Squat

Every exercise gets an original SVG figure animation with 2–4 keyframe poses,
blended with Reanimated. The figures are built from simple parts (limbs,
torso, a dumbbell), so new exercises are cheap to add.

---

## 5. Data model

The same model works for every tab, so Diet and Finances need no new code.

```ts
type Tab      = { id: string; name: string; icon: string; accent: string; sections: Section[] };
type Section  = { id: string; tabId: string; name: string; order: number; items: Item[] };
type Item     = { id: string; sectionId: string; name: string; order: number;
                  animationKey?: string;  // e.g. 'shoulder_press'
                  schedule?: Weekday[];   // optional: which days it's expected
                  archived?: boolean };
type CheckIn  = { itemId: string; date: 'YYYY-MM-DD' };   // stored as a Set per item
```

### Chain rules (proposed)
- **Tab chain (the big flame):** a day counts if at least one check-in on that
  tab was made that day.
- **Item streak:** consecutive *scheduled* days on which that item was checked.
  If an item has no schedule, every day counts.
- **Section clear:** every item in the section is checked for that day.
- Streaks are computed from check-ins, never stored, so editing a past day
  updates them correctly.

---

## 6. Project structure

```
app/
  _layout.tsx            # fonts, theme, tab bar
  (tabs)/fitness.tsx
  (tabs)/diet.tsx        # placeholder "coming soon" at first
  (tabs)/finances.tsx
src/
  theme/                 # colors, typography, shadows, the chunky components
  components/
    ChainGrid.tsx        # sections + rows + 7-day columns
    CheckCell.tsx        # the animated tap target
    SectionRibbon.tsx
    StreakHud.tsx
    ExerciseSheet.tsx
    Celebration.tsx      # confetti / milestone overlays
  figures/               # SVG figure rig + one pose file per exercise
  data/
    seed.ts              # the Fitness sections and items above
    store.ts             # Zustand + MMKV
    streaks.ts           # pure functions for streak math (unit-tested)
  utils/dates.ts         # week math, local-timezone day keys
```

---

## 7. Milestones

1. **Skeleton:** Expo app, tabs, theme tokens, fonts, placeholder tabs for Diet and Finances.
2. **Grid + persistence:** the Fitness grid from seed data, tap to toggle, saved
   on the device, week navigation, today highlighted.
3. **Streaks:** HUD, item and section streaks, unit tests for the streak math
   (including timezone and daylight-saving edge cases).
4. **Juice:** check-in animation, haptics, section-clear stamp, milestone trophy card.
5. **Infographics:** figure rig, 10 exercise animations, muscle map, exercise card.
6. **Editing:** add, rename, reorder, and archive sections and items in the app,
   so you can fill in the rest yourself. Plus JSON export/import.
7. **Ship to your phone:** Expo Go first, then an EAS build (TestFlight or APK).
   Optional: a daily reminder notification ("Don't break the chain! 🔥").

Later: the Diet and Finances tabs (same grid engine), a home-screen widget,
and optional cloud sync.

---

## 8. Open questions

1. **Push/pull split:** is the grouping in §4 right?
2. **Chain definition:** should a day count if you do *anything* on the tab, or
   do you follow a split (e.g. Mon/Thu push, Tue/Fri pull, Wed/Sat legs), where
   only the scheduled items count?
3. **Phone:** iPhone, Android, or both? This decides the first build target.
4. **Sets and reps:** check-in only, or also log weight and reps on a long-press?
   Check-in only fits the "simple tap" idea best.
