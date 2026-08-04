-- games: catálogo persistido (spec 06 solo seed de asteroids)
create table public.games (
  id          text primary key,
  title       text not null,
  short       text not null,
  long        text not null,
  cat         text not null check (cat in ('ARCADE', 'PUZZLE', 'SHOOTER', 'VERSUS')),
  cover       text not null,
  color       text not null check (color in ('cyan', 'magenta', 'yellow', 'green')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- scores: historial de partidas
create table public.scores (
  id           uuid primary key default gen_random_uuid(),
  game_id      text not null references public.games (id) on delete restrict,
  player_name  text not null check (char_length(player_name) between 1 and 10),
  score        integer not null check (score >= 0),
  user_id      uuid null references auth.users (id) on delete set null,
  created_at   timestamptz not null default now()
);

create index scores_game_id_created_at_idx
  on public.scores (game_id, created_at desc);

create index scores_game_id_score_idx
  on public.scores (game_id, score desc);

-- RLS
alter table public.games enable row level security;
alter table public.scores enable row level security;

create policy "games_select_anon"
  on public.games for select to anon, authenticated using (true);

create policy "scores_select_anon"
  on public.scores for select to anon, authenticated using (true);

-- Inserción solo vía service role (Server Action); sin policy INSERT para anon

-- Seed: asteroids (mismos strings que app/data/games.ts)
insert into public.games (id, title, short, long, cat, cover, color)
values (
  'asteroids',
  'ASTEROIDS',
  'Destruye asteroides y sobrevive en el vacío.',
  'Pilota una nave triangular en gravedad cero. Rota, propúlsate y dispara para pulverizar rocas que se fragmentan en piezas más pequeñas. Cada nivel trae más asteroides. ¿Cuánto aguantas?',
  'SHOOTER',
  'cover-asteroids',
  'yellow'
);
