# WT Progress

WT Progress is a lightweight THE FINALS companion site focused on long-term progression tracking. It gives players a cleaner alternative to spreadsheets by turning seasonal progress, badge milestones, and Battle Pass progress into simple page-level dashboards with local save state.

Live site: [https://junga3.github.io/wt-progress/](https://junga3.github.io/wt-progress/)

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
- Models entry, middle, later, and bonus level bands for the current mockup rules.
- Shows main pass, bonus page, overall, and season completion bars.
- Includes a pass-type selector for `Free`, `Premium`, and `Ultimate`.

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
