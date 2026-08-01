# Money Tracker

A bullet-journal style income and expense tracker. Installable PWA, hosted on
GitHub Pages, data in Supabase so the same account works on any device.

Everything is in Brazilian reais, and the interface is available in English (UK)
and Portuguese (BR).

## How it works

- **Months** are generated from the calendar, not stored. An entry belongs to a
  month through its `period` column (the first day of that month).
- **Income** rows hold source, date, amount expected, amount received and the
  date it arrived. **Expenses** hold name, due date, amount due and amount paid.
- **The paid/received tick box is derived, never stored** — it is ticked whenever
  the amount received is at least the amount expected. Ticking it fills in the
  full amount; unticking clears it; a partial payment leaves it unticked; editing
  the expected amount re-evaluates it. See `src/lib/totals.ts`.
- **The recurring list** (Settings → Recurring list) holds the things that repeat
  every month: a name, a day of the month and an amount. Any month can paste it
  in — dates land on that month, the 31st clamps to the month's last day, names
  already in the month are skipped, and everything pasted is an ordinary entry.
- **Net value = total expected − total due.** Positive is a surplus. Negative
  numbers are red, received and paid amounts are green, everything else is
  default ink.

## First-time setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com) (region: South
   America / São Paulo).
2. Open **SQL Editor → New query**, paste all of `supabase/schema.sql`, and run
   it. This creates the tables, the Row Level Security policies and the
   delete-all-data function.

   `supabase/schema.sql` is the only database file in this project, and it is
   safe to run repeatedly — it contains no `drop table`, `truncate` or `delete`,
   and every statement either creates what is missing or leaves what exists
   untouched. When the schema changes, that same file is updated and pasted
   again; there are no numbered migration files to keep track of.
3. Go to **Authentication → Sign In / Providers → Email** and make sure Email is
   enabled. If you would rather not wait for a confirmation email on sign-up,
   turn **Confirm email** off.
4. Go to **Authentication → URL Configuration** and set **Site URL** to
   `https://<your-user>.github.io/moneytracker/`. This is what the password-reset
   email links back to.
5. Copy `.env.example` to `.env` and fill in your project URL and publishable
   key from **Settings → API**.

Both of those values are safe in a browser bundle — Row Level Security is what
keeps the data private, and every policy is scoped to `auth.uid()`. The
`service_role` key must never appear in this repo.

### 2. Local development

```bash
npm install
npm run dev
```

### 3. Deployment

Pushing to `main` builds and publishes via `.github/workflows/deploy.yml`. The
workflow reads the Supabase values from repository **variables** (Settings →
Secrets and variables → Actions → Variables):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

In **Settings → Pages**, set Source to **GitHub Actions**.

## Layout of the code

| Path                     | What lives there                                              |
| ------------------------ | ------------------------------------------------------------- |
| `src/data/repository.ts` | The only file that talks to the database                      |
| `src/data/hooks.ts`      | TanStack Query hooks, with optimistic updates                 |
| `src/lib/totals.ts`      | The derived tick box and the totals arithmetic                |
| `src/lib/format.ts`      | BRL formatting, and parsing of what people actually type       |
| `src/lib/months.ts`      | Month/period helpers                                          |
| `src/lib/export.ts`      | The `.xlsx` and PDF exports                                   |
| `src/doodles/`           | Hand-written SVG doodles, no third-party assets                |
| `src/pages/Recurring.tsx` | The recurring list that months paste in                       |
| `src/index.css`          | The four themes, as swappable CSS custom properties            |
| `supabase/schema.sql`    | Schema and RLS — one file, safe to re-run                      |

## Themes and fonts

A theme changes more than the colours: each one brings its own typefaces, paper
pattern, corner radii and text size.

| Theme           | Paper       | Type                                        |
| --------------- | ----------- | ------------------------------------------- |
| **Plain paper** | dot grid    | Caveat / Patrick Hand / Architects Daughter |
| **Blossom**     | ruled lines | Playfair Display / Nunito                   |
| **Blueprint**   | graph paper | Space Mono / Nunito                         |
| **Typewriter**  | ledger rules| Special Elite / Courier Prime               |

They are pure CSS custom properties scoped to `[data-theme]` on `<html>`, which
is also how the theme picker previews each option in its own theme. Theme and
language are stored on your profile, so they follow the account across devices.
"Stay signed in on this device" is deliberately per-device.

Every font is SIL Open Font License and self-hosted, so nothing is fetched from
a third party at runtime.

## Scripts

| Command         | What it does                                    |
| --------------- | ----------------------------------------------- |
| `npm run dev`   | Dev server                                      |
| `npm run build` | Type-check and build to `dist/`                  |
| `npm run lint`  | Oxlint                                          |
| `npm run icons` | Regenerate the PWA icons from the SVG source     |

## Offline

This version is installable and loads instantly from cache, but needs a network
connection to read and write entries. The schema and data layer were built so
that true offline support can be added later without a migration — see
[BACKLOG.md](BACKLOG.md).
