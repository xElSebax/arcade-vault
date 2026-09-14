-- SPEC 12: perfiles de usuario + índice scores por user_id

create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  display_name  text not null check (char_length(display_name) between 1 and 10),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index profiles_display_name_idx on public.profiles (display_name);

create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_profiles_updated_at();

-- Normaliza display_name desde metadata OAuth/signup (máx. 10, mayúsculas).
create or replace function public.normalize_profile_display_name(raw text)
returns text
language plpgsql
immutable
as $$
declare
  base text;
begin
  base := upper(left(trim(coalesce(raw, '')), 10));
  if char_length(base) < 1 then
    base := 'PLAYER';
  end if;
  return base;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  raw_name text;
  normalized text;
begin
  raw_name := coalesce(
    new.raw_user_meta_data ->> 'display_name',
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    nullif(split_part(coalesce(new.email, ''), '@', 1), '')
  );
  normalized := public.normalize_profile_display_name(raw_name);

  insert into public.profiles (id, display_name)
  values (new.id, normalized)
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

alter table public.profiles enable row level security;

create policy "profiles_select_public"
  on public.profiles
  for select
  to anon, authenticated
  using (true);

create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create index if not exists scores_game_id_user_id_score_idx
  on public.scores (game_id, user_id, score desc)
  where user_id is not null;
