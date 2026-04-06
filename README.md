# Contestant Companion

Contestant Companion is a lightweight THE FINALS companion site focused on long-term progression tracking. It gives players a cleaner alternative to spreadsheets by turning seasonal progress, badge milestones, and Battle Pass progress into simple page-level dashboards with local save state.

Live site: [https://junga3.github.io/wt-progress/](https://junga3.github.io/wt-progress/)

## Patch Notes

### `0.4` - April 6, 2026

Merged `codex/april-6-ui-polish` into `main` in [`6abf987`](https://github.com/junga3/wt-progress/commit/6abf9875d9db18d0b4ff10e0a18451472b0b0ede).

**New Features**

- Added live Season 10 Battle Pass reward data for `Free`, `Premium`, and `Ultimate`.
- Added per-level reward inspection for the full Battle Pass track with hover and tap support.
- Added a floating GitHub repo button that stays fixed to the bottom-right corner on every page.

**Gameplay UI Updates**

- Reworked `Battle Pass Progression` from split level bands into a single aligned reward map.
- Replaced the old Battle Pass progress presentation with level ticks and per-track reward rows.
- Updated the Battle Pass track selector so non-selected reward lines stay visible in muted colors.
- Updated the `World Tour progress companion` light mode so active match selections and featured result cards use the same red accent treatment as dark mode.
- Updated the `Statistics Badge Progression` stat-entry typography to better match THE FINALS player card styling.

**Polish**

- Improved Battle Pass tracker sizing so the right rail has a more stable width.
- Improved reward-map contrast so active and muted ticks are easier to read.
- Removed empty reward-tier placeholders from Battle Pass rows when no reward exists at that level.
- Locked changing tracker values to steadier widths so rapid level updates do not cause layout jitter.

**Technical**

- Cleaned up the shared `Button` export so lint and production builds pass cleanly.

### `0.3` - April 5, 2026

Merged `codex/readme-favicon-progress` into `main` in [`ba79fde`](https://github.com/junga3/wt-progress/commit/ba79fde6cab5b5e83dc25432c9e53fc3a8cf140f).

**New Features**

- Added the site favicon and supporting branded image assets.

**Gameplay UI Updates**

- Refined the `Battle Pass Progression` page after launch with additional visual and layout tuning.
- Refreshed shared app styling to better support the growing multi-page companion site.

**Polish**

- Updated project presentation and README copy to better match the live app.
- Smoothed out post-launch Battle Pass page presentation and readability.

### `0.2` - April 5, 2026

Merged `codex/battle-pass-dark-mode-icons` into `main` in [`d754252`](https://github.com/junga3/wt-progress/commit/d7542521dcd9a50adf403d713289fc1b0936f465).

**New Features**

- Added the `Battle Pass Progression` page as the app's third major tracker.
- Added the full statistics badge art set for wins, eliminations, revives, and cash progression.
- Added dark mode support and shared theme updates across the app.

**Gameplay UI Updates**

- Refreshed the `Statistics Badge Progression` page with badge-driven presentation updates.
- Expanded routing and app navigation to support the new Battle Pass surface.
- Updated dropdown and page icon treatments to support the broader app shell.

**Polish**

- Aligned season timer behavior and related progress timing details.
- Improved the overall multi-page feel of the app as it moved beyond the original World Tour tracker.

### `0.1` - April 1, 2026

Merged `world-tour-ui-polish` into `main` in [`c6b1e4b`](https://github.com/junga3/wt-progress/commit/c6b1e4b3de9237fe3f171c10e8067352d2856d37).

**New Features**

- Shipped the first polished routed version of Contestant Companion.
- Added the `Statistics Badge Progression` page.
- Added GitHub Pages route recovery through `public/404.html` for direct links.

**Gameplay UI Updates**

- Reworked the `World Tour progress companion` UI into the current page-level tracker experience.
- Added the shared routed app shell for switching between companion pages.

**Polish**

- Refreshed the README and live-site documentation.
- Prepared the app shell and routing flow for deployment on GitHub Pages.

## Current App Progress

The app currently ships with three routed tools:

- `World Tour progress companion`
- `Statistics Badge Progression`
- `Battle Pass Progression`

Current version: `0.4`

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
