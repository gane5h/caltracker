# Chain

A personal "don't break the chain" tracker. Each tab is a weekly grid: tap a
cell to check in for that day. See [PLAN.md](PLAN.md) for the full roadmap.

Built with Expo SDK 57 (React Native + TypeScript). Android is the first target.

## Run it on your Android phone

1. Install **Expo Go** from the Play Store.
2. On your computer:
   ```bash
   npm install
   npm start          # or: npx expo start --tunnel   if phone and computer aren't on the same Wi-Fi
   ```
3. Scan the QR code in the terminal with Expo Go.

Check-ins are stored on the device only (AsyncStorage).

## Scripts

| Command | What it does |
|---|---|
| `npm start` | Start the dev server |
| `npm run web` | Run in the browser |
| `npm test` | Unit tests (Node's built-in test runner) |
| `npm run typecheck` | TypeScript |
| `npm run lint` | ESLint |

## Layout

```
src/app/            routes: index (Fitness), diet, finances, and the tab layout
src/components/     grid, animated check cell, section ribbons, game tab bar
src/data/           tab/section/item seed data and the persisted check-in store
src/theme/          colors, fonts, "chunky" 3D styles
src/utils/dates.ts  local-time week math (tested)
```

To change exercises, edit `src/data/seed.ts`. Keep existing item `id`s, because
check-ins are stored against them.
