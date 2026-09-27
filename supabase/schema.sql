-- ============================================================================
-- 1,000,000 BEERS CHALLENGE — Supabase Schema
-- Run this entire script in the Supabase SQL Editor (Project > SQL Editor).
-- Safe to re-run: it drops/recreates the objects it owns.
-- ============================================================================

-- Needed for gen_random_uuid() and crypt()/gen_salt() (pin hashing)
create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- 1. DRINKERS (fixed enum-like check, kept as text for simplicity/flexibility)
-- ----------------------------------------------------------------------------
do $$ begin
  if not exists (select 1 from pg_type where typname = 'drinker_name') then
    create type drinker_name as enum ('Dom', 'Josh', 'James', 'Grayson', 'Brendan');
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- 2. TABLE: beer_logs
-- ----------------------------------------------------------------------------
create table if not exists public.beer_logs (
  id          uuid primary key default gen_random_uuid(),
  drinker     drinker_name not null,
  count       integer not null default 1 check (count > 0 and count <= 24),
  note        text check (char_length(note) <= 140),
  created_at  timestamptz not null default now()
);

create index if not exists idx_beer_logs_created_at on public.beer_logs (created_at desc);
create index if not exists idx_beer_logs_drinker     on public.beer_logs (drinker);

-- ----------------------------------------------------------------------------
-- 3. SECRET CONFIG TABLE — stores a HASHED pin, never the plaintext.
--    RLS is enabled with NO policies at all, so it is unreadable/unwritable
--    from the anon/public API. Only SECURITY DEFINER functions (owned by a
--    privileged role) can read it.
-- ----------------------------------------------------------------------------
create table if not exists public.app_secrets (
  key         text primary key,
  value_hash  text not null
);

alter table public.app_secrets enable row level security;
-- Intentionally: no policies created for app_secrets => fully locked from PostgREST.

-- Seed / update the shared PIN. Change '1234' to your real PIN before running,
-- or run this UPDATE again later to rotate the PIN.
insert into public.app_secrets (key, value_hash)
values ('shared_pin', crypt('1234', gen_salt('bf')))
on conflict (key) do update set value_hash = excluded.value_hash;

-- ----------------------------------------------------------------------------
-- 4. RLS on beer_logs — public read, NO direct public write.
-- ----------------------------------------------------------------------------
alter table public.beer_logs enable row level security;

drop policy if exists "Public read access" on public.beer_logs;
create policy "Public read access"
  on public.beer_logs
  for select
  to anon, authenticated
  using (true);

-- No insert/update/delete policy is created for anon/authenticated.
-- This means direct client-side inserts (supabase.from('beer_logs').insert(...))
-- are rejected by RLS. The only way in is the log_beer() RPC below.

-- ----------------------------------------------------------------------------
-- 5. RPC: log_beer(drinker, count, pin, note)
--    SECURITY DEFINER runs as the function owner (postgres), which bypasses
--    RLS for the insert, after we've manually verified the PIN in-function.
-- ----------------------------------------------------------------------------
create or replace function public.log_beer(
  p_drinker drinker_name,
  p_count   integer,
  p_pin     text,
  p_note    text default null
)
returns public.beer_logs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hash   text;
  v_result public.beer_logs;
begin
  -- Basic sanity checks (defense in depth, mirrors the table constraints)
  if p_count is null or p_count <= 0 or p_count > 24 then
    raise exception 'Invalid count: must be between 1 and 24';
  end if;

  if p_note is not null and char_length(p_note) > 140 then
    raise exception 'Note too long (max 140 characters)';
  end if;

  -- Fetch the hashed pin
  select value_hash into v_hash
  from public.app_secrets
  where key = 'shared_pin';

  if v_hash is null then
    raise exception 'Server misconfigured: no pin set';
  end if;

  if p_pin is null or crypt(p_pin, v_hash) <> v_hash then
    raise exception 'Incorrect PIN';
  end if;

  -- All good — insert the log
  insert into public.beer_logs (drinker, count, note)
  values (p_drinker, p_count, nullif(trim(p_note), ''))
  returning * into v_result;

  return v_result;
end;
$$;

-- Let anon/authenticated call the RPC (the function itself enforces the PIN)
grant execute on function public.log_beer(drinker_name, integer, text, text) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 6. Convenience view for leaderboard aggregates (public read-only)
-- ----------------------------------------------------------------------------
create or replace view public.beer_totals as
select
  d.drinker,
  coalesce(sum(b.count), 0)::bigint as total
from unnest(enum_range(null::drinker_name)) as d(drinker)
left join public.beer_logs b on b.drinker = d.drinker
group by d.drinker;

grant select on public.beer_totals to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 7. Enable Realtime on beer_logs (optional but recommended for live feed)
--    In Supabase Dashboard: Database > Replication > toggle "beer_logs" on,
--    or run:
-- ----------------------------------------------------------------------------
alter publication supabase_realtime add table public.beer_logs;

-- ============================================================================
-- Done. Quick test (run manually, then delete the test row if you like):
-- select public.log_beer('Dom', 2, '1234', 'Test pour');
-- select * from public.beer_totals;
-- ============================================================================
