# WT Progress

WT Progress is a lightweight companion site for tracking progression in THE FINALS. It currently includes two tools:

- `World Tour progress companion`
- `Statistics Badge Progression`

The app is built as a GitHub Pages-friendly single-page React app with route-based pages and local persistence for user-entered progress.

Live site: [https://junga3.github.io/wt-progress/](https://junga3.github.io/wt-progress/)

## What It Is For

This project is meant to give players a cleaner way to keep track of long-term progression without relying on spreadsheets or manual notes.

The current pages are:

- `World Tour progress companion`
  Track current World Tour points, season pace, rank progress, and quick match result logging.
- `Statistics Badge Progression`
  Enter lifetime totals for eliminations, revives, cash, and wins to see badge progression and milestone progress.

## Technologies Used

- `React 19`
- `TypeScript`
- `Vite`
- `Tailwind CSS v4`
- `shadcn/ui`
- `Framer Motion`
- `Lucide React`
- `GitHub Pages`

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

## Routing

The app is deployed under the GitHub Pages base path:

- `/wt-progress/world-tour-progress`
- `/wt-progress/statistics-badge-progression`

The project includes a `404.html` redirect fallback so direct links keep working on GitHub Pages.

## Deployment

Pushes to `main` trigger the GitHub Actions workflow in `.github/workflows/deploy.yml`, which builds the app and deploys the `dist` output to GitHub Pages.
