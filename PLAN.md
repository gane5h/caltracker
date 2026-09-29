# Chain — personal "don't break the chain" tracker

A personal mobile app with one tab per life area (Fitness, Diet, Finances, …).
Each tab is a weekly grid: **7 columns (Mon–Sun) × rows of actions**. Tap a cell
to check in. The goal is simple: keep the chain unbroken.

We build **Fitness first**, with the structure ready for the other tabs.

---

## 1. Tech stack

**Zero dependencies, no build step.** The app is plain HTML, CSS and JavaScript
(ES modules). GitHub Pages serves it straight from the repo.

| Concern | Choice | Why |
|---|---|---|
| App | Vanilla HTML/CSS/JS | Nothing to install, compile or keep updated; edit a file and push |
| Hosting | **GitHub Pages** from this repo | Free HTTPS, deploys on every push |
| "Install" on Android | **PWA**: web app manifest + service worker | Chrome's *Add to Home screen* gives a full-screen app with an icon, and it works offline |
| Storage | `localStorage` (+ `navigator.storage.persist()`) | Data stays on the phone. No server, no account |
| Navigation | URL hash tabs (`#fitness`, `#diet`, `#money`) | The Android back button works |
| Animations | CSS keyframes and transitions | Pop, star burst, bouncy tabs; honours "reduce motion" |
| Exercise infographics | Inline SVG animated with CSS | Custom looping figures in the app's style |
| Haptics | `navigator.vibrate()` | Supported by Chrome on Android |
| Fonts | **Lilita One** + **Nunito**, bundled in `fonts/` (OFL licence) | No calls to font CDNs |
| Tests | Node's built-in `node --test` | No test framework to install |

Trade-off: data lives in one browser on one phone. Clearing Chrome's site data
erases it, so JSON export/import (milestone 6) is the backup.

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
│ ▼ CARDIO · TREADMILL 30 MIN   0/1    │
│  Brisk walk         □  ■  □  ■  □ …  │
├──────────────────────────────────────┤
│  [🏋 Fitness] [🥗 Diet] [💰 Money] [+] │  ← bottom tabs
└──────────────────────────────────────┘
```

- The exercise names column stays fixed on the left. Each exercise has a small
  animated figure next to its name.
- **Tap a cell** → check in or undo. **Tap an exercise name** → the exercise card.
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

The upper-body split into push and pull is confirmed.

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

**Cardio — Treadmill**
1. Brisk walk, 30 min

Every exercise gets an original SVG figure animation with 2–4 keyframe poses,
animated with CSS. The figures are built from simple parts (limbs,
torso, a dumbbell), so new exercises are cheap to add.

---

## 5. Data model

The same model works for every tab, so Diet and Finances need no new code.

```js
tab      = { id, sections: [section] }
section  = { id, name, subtitle, emoji, archived?, items: [item] }
item     = { id, name, exercise?, archived? }   // exercise → js/exercises.js
checkIns = { [itemId]: { 'YYYY-MM-DD': true } }   // localStorage 'chain/check-ins'
tabs     = { [tabId]: tab }                        // localStorage 'chain/tabs', once edited
```

### Chain rules
- **Tab chain (the big flame):** a day counts if at least one check-in on that
  tab was made that day.
- **Item streak:** consecutive days on which that item was checked.
- **Section clear:** every item in the section is checked for that day.
- Streaks are computed from check-ins, never stored, so editing a past day
  updates them correctly.

---

## 6. Project structure

```
index.html              app shell: screens, tab bar, shared SVG star symbol
manifest.webmanifest    PWA metadata (name, icons, colours)
sw.js                   service worker: offline cache, updates in the background
css/app.css             theme tokens, chunky 3D styles, animations
js/app.js               rendering, tap handling, week nav, tabs
js/data.js              starting sections and exercises
js/exercises.js         exercise library: poses, muscles, form tips
js/figures.js           figure rig, keyframe generator, muscle map
js/layout.js            pure edits: add, move, archive …
js/backup.js            JSON export/import format
js/store.js             check-ins in localStorage
js/streaks.js           streak math (pure, unit-tested)
js/dates.js             local-time week math
tests/                  node --test unit tests
fonts/, icons/          bundled assets
```

---

## 7. Milestones

1. **Skeleton:** app shell, tabs, theme tokens, fonts, placeholder tabs for Diet and Finances.
2. **Grid + persistence:** the Fitness grid from seed data, tap to toggle, saved
   on the device, week navigation, today highlighted.
3. **Streaks:** HUD, item and section streaks, unit tests for the streak math
   (including timezone and daylight-saving edge cases).
4. **Juice:** check-in animation, haptics, section-clear stamp, milestone trophy card.
5. **Infographics:** figure rig, 11 exercise animations, muscle map, exercise card.
6. **Editing:** add, rename, reorder, and archive sections and items in the app,
   so you can fill in the rest yourself. Plus JSON export/import.
7. **Ship to your phone:** GitHub Pages plus *Add to Home screen* (done early, since it's free).
   Optional: a daily reminder notification ("Don't break the chain! 🔥").

Later: the Diet and Finances tabs (same grid engine), a home-screen widget,
and optional cloud sync.

---

## 8. Decisions

1. **Push/pull split:** confirmed as in §4.
2. **Chain definition:** *any* check-in on a tab keeps that day's chain alive.
   Items have no schedules.
3. **Platform:** Android first, as a PWA served from GitHub Pages.
5. **No external dependencies:** replaced the Expo/React Native build with vanilla web.
4. **Logging:** tap only. No weights or reps.

## 9. Status

- [x] Milestone 1: skeleton, theme, fonts, game-style tab bar, locked Diet and Money tabs
- [x] Milestone 2: Fitness grid, tap to toggle with pop, star burst and haptics,
      saved on the device, week navigation, today highlighted, future days locked
- [x] Milestone 3: HUD flame (dims until today has a check-in), item and section
      streak chips, streak unit tests across timezones and DST
- [x] Milestone 4: squash-and-stretch check-in, gentler undo, section-clear shine and
      stamp, 7/30/100-day trophy card (each chain celebrates a milestone once)
- [x] Milestone 5: figure rig (`js/figures.js`) that turns poses into SVG and CSS
      keyframes and keeps standing figures' feet planted; 10 exercise animations; mini
      figures in the grid; front/back muscle map; exercise card (tap an exercise name)
      with streaks, best streak, form tips and a 12-week heatmap
- [x] Milestone 6: edit mode to add, rename, reorder, move, archive and restore
      sections and exercises, pick an animation for each; JSON export and import
- [ ] Daily reminder (optional, milestone 7): not built. Without a server, Android
      only offers Periodic Background Sync, which fires when Chrome decides (often
      hours late), so it can't promise "remind me at 8pm"
- [x] Milestone 7: GitHub Pages + installable PWA with offline support
