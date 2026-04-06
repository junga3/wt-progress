# WT Progress

WT Progress is a lightweight THE FINALS companion site focused on long-term progression tracking. It gives players a cleaner alternative to spreadsheets by turning seasonal progress, badge milestones, and Battle Pass progress into simple page-level dashboards with local save state.

Live site: [https://junga3.github.io/wt-progress/](https://junga3.github.io/wt-progress/)

## Latest Update

### April 6, 2026

- Rebuilt the `Battle Pass Progression` page around a single level-based reward map instead of split level bands.
- Added the live Season 10 reward set for `Free`, `Premium`, and `Ultimate`, including per-level inspection, hover and tap previews, muted non-selected tracks, and higher-contrast reward ticks.
- Polished the Battle Pass tracker layout so the right rail stays stable, the reward map uses more of the page width, and the interface no longer shifts when levels change quickly.
- Added a floating GitHub repo button to the shared app shell so it stays fixed at the bottom-right corner across every page.
- Updated the `World Tour progress companion` light mode so the active match mode and highlighted result card use the same red accent treatment as dark mode.
- Updated the `Statistics Badge Progression` stat entry typography to better match the in-game player card treatment.
- Cleaned up the shared `Button` export so lint and production builds pass cleanly.

## Current App Progress

The app currently ships with three routed tools:

- `World Tour progress companion`
- `Statistics Badge Progression`
- `Battle Pass Progression`

Each page is live, mobile-friendly, saved in local storage, and available in both light and dark mode.

## Feature Breakdown

### World Tour progress companion

- Tracks current World Tour points against the Season 10 timeline.
- Shows current rank, goal rank progress, season timing, and progress toward the 2,400-point cap.
- Includes quick match logging plus exact total syncing for correcting drift.
- Supports light and dark mode with shared brand styling.

Route: `/wt-progress/world-tour-progress`

### Statistics Badge Progression

- Tracks lifetime totals for wins, eliminations, revives, and total cash.
- Uses dedicated badge art for each stat family and tier.
- Shows the current badge tier, next milestone, and completion progress for each tracked stat.
- Uses a cleaner in-game-inspired stat entry panel instead of repeated per-card inputs.

Route: `/wt-progress/statistics-badge-progression`

### Battle Pass Progression

- Tracks Battle Pass progress by level instead of raw XP so the page stays stable as XP requirements change.
- Uses a single reward map with aligned level ticks, per-track rows, and level inspection for the current season.
- Shows live Season 10 rewards for `Free`, `Premium`, and `Ultimate`.
- Includes a pass-type selector that changes which reward tracks are emphasized while keeping the others visible.

Route: `/wt-progress/battle-pass-progression`

## Tech Stack

- `React 19`
- `TypeScript`
- `Vite`
- `Tailwind CSS v4`
- `shadcn/ui`
- `Framer Motion`
- `Lucide React`
- `GitHub Pages`

## App Structure

- Route-based single-page app built for GitHub Pages deployment.
- Shared theme system for light and dark mode using THE FINALS-inspired colors.
- Local storage persistence for tracker values and theme preferences.
- `404.html` redirect fallback so direct links to sub-routes continue to work on GitHub Pages.

## Local Development

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Deployment

Pushes to `main` trigger the GitHub Actions workflow in `.github/workflows/deploy.yml`, which builds the app and deploys the `dist` output to GitHub Pages.
