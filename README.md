# Algo — DSA Tracker

A dashboard for tracking data structures & algorithms practice: problems solved,
topic mastery, spaced-repetition reviews, and daily streaks.

Built with **Next.js (App Router) + TypeScript**, **Tailwind CSS**, **shadcn/ui**
(Base UI + Lucide), and **Firebase / Firestore** for data.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — `/` redirects to `/dashboard`.

The dashboard renders from bundled **sample data** out of the box, so you can run
it immediately without any Firebase setup.

## Connecting Firebase

1. Create a Firebase project and a Firestore database.
2. Copy `.env.local.example` to `.env.local` and fill in your web app config:

   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   NEXT_PUBLIC_FIREBASE_APP_ID=...
   ```

3. **Enable Google sign-in**: Firebase console → Authentication → Sign-in method
   → enable **Google**. Add your domains under Authentication → Settings →
   Authorized domains (`localhost` is allowed by default).

4. Add documents to Firestore matching the shapes in `src/lib/types.ts`:

   | Collection / doc      | Shape        |
   | --------------------- | ------------ |
   | `stats/summary`       | `Stats`      |
   | `problems/{id}`       | `Problem`    |
   | `topics/{id}`         | `Topic`      |
   | `friends/{id}`        | `Friend`     |

Once the env vars are present, the app shows a **Google sign-in screen**, and
`src/lib/dashboard.ts` reads from Firestore, falling back to the sample data if a
read fails or a collection is empty — so the UI never renders empty during
development. With **no** env vars the app runs in a signed-in "demo" mode on
sample data.

### Friend streaks

A friend streak is a **mutual** streak: it advances only on days when **both**
you and the friend solve at least one problem; a missed day by either of you
ends it. The panel derives "did you solve today?" from the latest day in
`Stats.contributions`, and each `Friend` carries `friendSolvedToday`, `streak`,
and `bestStreak`. To make streaks update automatically in production, record each
user's daily check-ins and recompute the mutual streak (a Cloud Function on
write is the natural home for this).

## Code playground & runner

`/playground` is a LeetCode-style solve view: a **Monaco** editor (loaded from
CDN) with Python / JavaScript / C++ / Java, the problem description, and a
console for custom input and test results. Reach it from the sidebar or by
clicking any problem card.

Code runs on the **Wandbox** public service (no API key) via the `/api/run`
route, which resolves a stable compiler and returns stdout / stderr / compiler
output.

**Batch execution.** You write only the method (e.g. `twoSum`); a per-language
harness (`src/lib/playground-problems.ts`) wraps it, reads all test cases from a
single stdin payload, and prints one line per case. So the whole suite is
**compiled and run once** — 600 test cases cost about the same as one run
(~5 s in Java) instead of one network round-trip per case. Each output line is
compared to its expected value for pass/fail.

> The public Piston API became whitelist-only in 2026, so this uses Wandbox.
> For heavy or private use, self-host
> [Judge0](https://github.com/judge0/judge0) or
> [Piston](https://github.com/engineer-man/piston) and point
> `src/app/api/run/route.ts` at your own instance.

## Project structure

```
src/
  app/
    (app)/
      layout.tsx          # app shell: sidebar + main
      dashboard/page.tsx  # dashboard route (server component, fetches data)
    layout.tsx            # root layout: fonts, dark theme, tooltips
    page.tsx              # redirects to /dashboard
    globals.css           # theme tokens (near-black dark + violet accent)
  components/
    dashboard/            # sidebar, stat cards, problem cards, panels, charts
    ui/                   # shadcn/ui primitives
  lib/
    firebase.ts           # guarded Firebase init
    dashboard.ts          # data access (Firestore → sample-data fallback)
    types.ts              # domain types
    sample-data.ts        # seed / fallback data
```

## Notes

- The app is **dark-only** by design (matches the intended aesthetic). The
  palette lives in `src/app/globals.css` as CSS variables.
- Mini bar-chart and sparkline are hand-rolled inline SVG (`mini-charts.tsx`) —
  no charting dependency.
- The sidebar collapses (toggle at the top) with tooltips in the collapsed
  state.
