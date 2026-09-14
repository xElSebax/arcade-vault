-- SPEC 13: search_path en helpers de perfiles, revocar RPC indebida, eliminar rls_auto_enable

create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.normalize_profile_display_name(raw text)
returns text
language plpgsql
immutable
set search_path = public
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

-- Triggers siguen invocando estas funciones; solo se bloquea ejecución vía PostgREST/RPC.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_profiles_updated_at() from public, anon, authenticated;
revoke execute on function public.normalize_profile_display_name(text) from public, anon, authenticated;

-- Event trigger de Supabase que invoca rls_auto_enable; RLS se gestiona por migraciones del repo.
drop event trigger if exists ensure_rls;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
drop function if exists public.rls_auto_enable();
