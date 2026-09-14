-- SPEC 13: RLS habilitado y modelo de acceso explícito (games / scores / profiles)

alter table public.games enable row level security;
alter table public.profiles enable row level security;
alter table public.scores enable row level security;

comment on table public.games is
  'RLS: SELECT público (anon, authenticated). Sin INSERT/UPDATE/DELETE desde roles de cliente.';

comment on table public.scores is
  'RLS: SELECT público; INSERT anon (user_id null) o authenticated (user_id null o auth.uid()). Sin UPDATE/DELETE cliente.';

-- Quitar políticas de mutación en games/scores si se añadieron fuera del repo.
do $$
declare
  rec record;
begin
  for rec in
    select p.polname as policy_name, c.relname as table_name
    from pg_policy p
    join pg_class c on c.oid = p.polrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in ('games', 'scores')
      and p.polcmd in ('w', 'd', '*')
  loop
    execute format(
      'drop policy if exists %I on public.%I',
      rec.policy_name,
      rec.table_name
    );
  end loop;
end;
$$;

drop policy if exists "games_select_anon" on public.games;
create policy "games_select_anon"
  on public.games
  for select
  to anon, authenticated
  using (true);

drop policy if exists "scores_select_anon" on public.scores;
create policy "scores_select_anon"
  on public.scores
  for select
  to anon, authenticated
  using (true);

drop policy if exists "scores_insert_anon" on public.scores;
create policy "scores_insert_anon"
  on public.scores
  for insert
  to anon
  with check (user_id is null);

drop policy if exists "scores_insert_authenticated" on public.scores;
create policy "scores_insert_authenticated"
  on public.scores
  for insert
  to authenticated
  with check (user_id is null or user_id = auth.uid());
