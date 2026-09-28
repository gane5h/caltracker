# Chain

A personal "don't break the chain" tracker. Each tab is a weekly grid: tap a
cell to check in for that day. See [PLAN.md](PLAN.md) for the roadmap.

It's plain HTML, CSS and JavaScript. There are **no dependencies and no build
step**, and it runs straight from this repo on GitHub Pages.

## Put it on your Android phone

1. **Turn on GitHub Pages** (one time): in the repo, go to **Settings → Pages**.
   Under *Build and deployment*, choose **Deploy from a branch**, then pick the
   branch and the **`/ (root)`** folder, and save.
   After about a minute the app is live at `https://<your-username>.github.io/caltracker/`.
2. Open that URL in **Chrome** on your phone.
3. Open the **⋮ menu** and tap **Add to Home screen** (or **Install app**).

It then opens full-screen from its own icon and works offline. When you push
changes, the app picks them up the next time you open it.

> GitHub Pages is free for public repos. A private repo needs a paid GitHub plan
> to use Pages.

Check-ins are saved on the phone only (`localStorage`). Clearing Chrome's data
for the site erases them.

## Run it locally

Any static file server works. For example:

```bash
python3 -m http.server 8000     # then open http://localhost:8000
```

Opening `index.html` directly as a `file://` URL won't work, because browsers
block ES modules and service workers there.

## Tests

```bash
node --test
```

## Changing exercises

Tap **✏️ Edit exercises** under the grid. You can add, rename, reorder and
archive sections and exercises, and give each exercise an animation. Archived
items keep their check-ins and can be restored.

Tap an exercise's name to see its animation, the muscles it works, form tips,
and your streaks.

`js/data.js` is only the starting layout for a fresh install. To add a new
animation, add an entry to `js/exercises.js` (see the pose notes at the top).

## Backups

Your data lives on the phone only. In edit mode, **Export** saves a
`chain-backup-YYYY-MM-DD.json` file to Downloads, and **Import** restores one
(it replaces everything on the phone).

## Layout

```
index.html  manifest.webmanifest  sw.js
css/app.css     theme and animations
js/app.js       rendering and interactions
js/data.js      starting sections and exercises
js/exercises.js exercise library: poses, muscles, tips
js/figures.js   animated figures and muscle map
js/layout.js    edits (add, move, archive)
js/backup.js    export/import format
js/store.js     localStorage persistence
js/streaks.js   streak math
js/dates.js     week math
tests/          unit tests
fonts/ icons/   bundled assets (fonts under the SIL Open Font License)
```
