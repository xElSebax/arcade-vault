-- Seed: snake (mismos strings que app/data/games.ts)
insert into public.games (id, title, short, long, cat, cover, color)
values (
  'snake',
  'SNAKE',
  'Come frutas, crece y no te muerdas la cola.',
  'Una serpiente de neón recorre la grilla buscando frutas. Cada bocado la alarga y la acelera. Choca con una pared o contigo misma y la partida termina.',
  'ARCADE',
  'cover-snake-game',
  'green'
);
