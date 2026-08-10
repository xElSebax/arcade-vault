-- Seed: arkanoid (mismos strings que app/data/games.ts)
insert into public.games (id, title, short, long, cat, cover, color)
values (
  'arkanoid',
  'ARKANOID',
  'Rebota la pelota y destruye todos los bloques.',
  'Controla la paleta, devuelve la pelota y pulveriza cinco layouts de bloques de neón. Cada nivel acelera la pelota. Tres vidas. ¿Llegas al final?',
  'ARCADE',
  'cover-arkanoid',
  'magenta'
);
