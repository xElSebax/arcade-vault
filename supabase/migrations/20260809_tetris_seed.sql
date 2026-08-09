-- Seed: tetris (mismos strings que app/data/games.ts)
insert into public.games (id, title, short, long, cat, cover, color)
values (
  'tetris',
  'TETRIS',
  'Encaja las piezas antes de que el tablero se llene.',
  'Tetrominós descienden desde arriba. Rótalos, encájalos y limpia líneas para sobrevivir. La velocidad aumenta sin piedad cada 10 líneas.',
  'PUZZLE',
  'cover-tetris',
  'yellow'
);
