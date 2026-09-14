-- SPEC 12: inserción en scores vía sesión (anon / authenticated)

alter table public.scores enable row level security;

create policy "scores_insert_anon"
  on public.scores
  for insert
  to anon
  with check (user_id is null);

create policy "scores_insert_authenticated"
  on public.scores
  for insert
  to authenticated
  with check (user_id is null or user_id = auth.uid());
