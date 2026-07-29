# Backlog

Things deliberately left out of the first version, with a note on what each one
would actually involve.

## Agreed to revisit

- **Planned vs actual in the top bar** — the summary currently shows Total
  expected / Total due / Net. Adding a second row for Received / Paid is a
  presentation-only change; `monthTotals()` already returns all four figures.

- **Monthly and yearly reports** — charts or a year-at-a-glance table. The data
  layer already supports fetching a range of months (`useIncomeRange`,
  `useExpensesRange`), so this is a new page rather than new plumbing.

- **Expense categories** — the `category` column exists on `expense_entries` and
  is unused. Needs the list of categories, a picker in the row, and grouping in
  the totals. No migration required.

- **Notes per row** — the `notes` column exists on both tables, likewise unused.

- **Copy from previous month** — recurring items (rent, salary, utilities) get
  retyped every month. Would copy the previous month's rows into the current one
  with the received/paid amounts reset to zero.

- **Delete account** — deliberately dropped for now; only "delete all data" is
  wired up. Deleting an auth user cannot be done from the browser with the
  publishable key, so it needs a Supabase Edge Function using the service role.

## Phase 2: true offline

The groundwork is already in place, so this does not need a schema migration:

- Primary keys are UUIDs generated on the client, so rows can be created offline
  and keep their identity when they sync.
- Every row carries `updated_at` and a `deleted_at` tombstone, which is what a
  sync needs to work out what changed and what was removed.
- All database access goes through `src/data/repository.ts`. Offline means
  changing the inside of that file — reads from IndexedDB, writes to IndexedDB
  plus an outbox — and leaving the UI untouched.
- `src/data/hooks.ts` already does optimistic updates, so the interface is
  used to writes that have not landed yet.
- The service worker precaches the app shell only (see `workbox` in
  `vite.config.ts`); phase 2 adds `runtimeCaching` and a background-sync queue.

The one genuinely new decision is conflict resolution. Last-write-wins on
`updated_at` is almost certainly right for a single-user tracker.

## Known trade-offs

- **`npm audit` reports a react-router advisory** (GHSA-qwww-vcr4-c8h2). It
  applies to RSC mode's server actions; this app is a static SPA with no server,
  so the vulnerable code path does not exist here. Worth re-checking whenever
  react-router publishes a patched release.
- **Hash routing** (`/#/m/2026-07-01`) rather than clean URLs, because GitHub
  Pages cannot serve a SPA fallback for a deep link on first visit.
