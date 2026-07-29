-- Money Tracker — initial schema
-- Run this once in Supabase → SQL Editor → New query → Run.
--
-- Design notes:
--  * Primary keys are UUIDs the *client* generates. Needed so a future offline
--    mode can create rows with real IDs before they ever reach the server.
--  * Every table carries updated_at and deleted_at (soft delete) so a future
--    sync can work out what changed without a migration on existing data.
--  * notes/category columns exist but are unused by the UI today, again to
--    avoid migrating live data later.
--  * There is no "paid"/"received" boolean. The tick box is derived in the UI
--    from amount_paid >= amount_due, which makes contradictory states
--    impossible to store.

-- ---------------------------------------------------------------------------
-- Helper: keep updated_at honest
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles — per-account settings that must follow the user across devices
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  language    text not null default 'en-GB' check (language in ('en-GB', 'pt-BR')),
  theme       text not null default 'neutral' check (theme in ('neutral', 'warm', 'cool')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- income_entries
-- ---------------------------------------------------------------------------
create table if not exists public.income_entries (
  id              uuid primary key,
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- First day of the month the row belongs to, e.g. 2026-07-01.
  period          date not null,
  source          text not null default '',
  expected_date   date,
  expected_amount numeric(14, 2) not null default 0 check (expected_amount >= 0),
  received_amount numeric(14, 2) not null default 0 check (received_amount >= 0),
  received_date   date,
  notes           text,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

drop trigger if exists income_set_updated_at on public.income_entries;
create trigger income_set_updated_at
  before update on public.income_entries
  for each row execute function public.set_updated_at();

create index if not exists income_user_period_idx
  on public.income_entries (user_id, period)
  where deleted_at is null;

-- ---------------------------------------------------------------------------
-- expense_entries
-- ---------------------------------------------------------------------------
create table if not exists public.expense_entries (
  id           uuid primary key,
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  period       date not null,
  name         text not null default '',
  due_date     date,
  amount_due   numeric(14, 2) not null default 0 check (amount_due >= 0),
  amount_paid  numeric(14, 2) not null default 0 check (amount_paid >= 0),
  paid_date    date,
  category     text,
  notes        text,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

drop trigger if exists expense_set_updated_at on public.expense_entries;
create trigger expense_set_updated_at
  before update on public.expense_entries
  for each row execute function public.set_updated_at();

create index if not exists expense_user_period_idx
  on public.expense_entries (user_id, period)
  where deleted_at is null;

-- ---------------------------------------------------------------------------
-- Row Level Security — the only thing standing between the publishable key in
-- the browser bundle and your data. Every table, every command.
-- ---------------------------------------------------------------------------
alter table public.profiles        enable row level security;
alter table public.income_entries  enable row level security;
alter table public.expense_entries enable row level security;

drop policy if exists "own profile: select" on public.profiles;
create policy "own profile: select" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "own profile: insert" on public.profiles;
create policy "own profile: insert" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "own profile: update" on public.profiles;
create policy "own profile: update" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "own income: select" on public.income_entries;
create policy "own income: select" on public.income_entries
  for select using (auth.uid() = user_id);

drop policy if exists "own income: insert" on public.income_entries;
create policy "own income: insert" on public.income_entries
  for insert with check (auth.uid() = user_id);

drop policy if exists "own income: update" on public.income_entries;
create policy "own income: update" on public.income_entries
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own income: delete" on public.income_entries;
create policy "own income: delete" on public.income_entries
  for delete using (auth.uid() = user_id);

drop policy if exists "own expenses: select" on public.expense_entries;
create policy "own expenses: select" on public.expense_entries
  for select using (auth.uid() = user_id);

drop policy if exists "own expenses: insert" on public.expense_entries;
create policy "own expenses: insert" on public.expense_entries
  for insert with check (auth.uid() = user_id);

drop policy if exists "own expenses: update" on public.expense_entries;
create policy "own expenses: update" on public.expense_entries
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own expenses: delete" on public.expense_entries;
create policy "own expenses: delete" on public.expense_entries
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Give every new account a profile row automatically.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Delete-all-data, called from Settings → Data. Hard delete on purpose: the
-- user asked for the data to be gone, not tombstoned.
-- ---------------------------------------------------------------------------
create or replace function public.delete_all_my_data()
returns void
language plpgsql
security invoker
as $$
begin
  delete from public.income_entries  where user_id = auth.uid();
  delete from public.expense_entries where user_id = auth.uid();
end;
$$;
