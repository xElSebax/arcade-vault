-- Temporal (spec 06): sin RLS en scores para permitir INSERT con clave publicable.
-- Volver a habilitar RLS + políticas cuando haya auth real o service role en el curso.
alter table public.scores disable row level security;
