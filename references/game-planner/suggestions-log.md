# Game Planner — Log de sugerencias

> Actualizado por `@game-planner`. No editar manualmente salvo correcciones de estado.

## Snapshot catálogo

Última actualización: 2026-09-12

### Jugables (4)

| ID | Título | Categoría |
|----|--------|-----------|
| `asteroids` | ASTEROIDS | SHOOTER |
| `tetris` | TETRIS | PUZZLE |
| `arkanoid` | ARKANOID | ARCADE |
| `snake` | SNAKE | ARCADE |

### Placeholders (8)

| ID | Título | Categoría |
|----|--------|-----------|
| `bloque-buster` | BLOQUE BUSTER | ARCADE |
| `caida` | CAÍDA | PUZZLE |
| `serpentina` | SERPENTINA | ARCADE |
| `gloton` | GLOTÓN | ARCADE |
| `invasores` | INVASORES | SHOOTER |
| `rocas` | ROCAS | SHOOTER |
| `ranaria` | RANARIA | ARCADE |
| `duelo-pixel` | DUELO PIXEL | VERSUS |

### Prototipos vanilla (`references/started-games/`)

- `02-asteroids` → integrado como `asteroids`
- `03-tetris` → integrado como `tetris`
- `04-arkanoid` → integrado como `arkanoid`

### Specs de juegos

| Spec | Juego | Estado |
|------|-------|--------|
| 05 | asteroids | Implementado |
| 07 | tetris | Implementado |
| 08 | arkanoid | Implementado |
| 09 | snake | Implementado |

## Sesiones

### 2026-09-12 — Exploración abierta (primera sesión)

**Contexto:** Usuario pidió una recomendación de juego sin criterios adicionales.

**Criterios:** Exploración rápida sin aclaración detallada. Prioridad implícita: mejor encaje global con la plataforma y diversidad de catálogo.

**Sugerencias:**

| # | Slug propuesto | Encaje | Estado | Notas |
|---|----------------|--------|--------|-------|
| 1 | `invasores` | 9/10 | sugerido | Recomendación principal — Space Invaders sobre placeholder existente |
| 2 | `ranaria` | 8/10 | sugerido | Frogger-like; diversifica ARCADE sin duplicar snake |
| 3 | `gloton` | 7/10 | sugerido | Pac-Man-like; más complejidad (IA fantasmas) |
| 4 | `galaga` | 8/10 | sugerido | Fuera de catálogo; alternativa shooter si se prefiere formaciones |
| 5 | `duelo-pixel` | 6/10 | sugerido | Pong-like; riesgo en métrica de leaderboard |

### 2026-09-12 — Top 20 exploración amplia (segunda sesión)

**Contexto:** Usuario pidió 20 juegos sugeridos; evaluación paralela por categoría (shooters, arcade/action, puzzle, racing/versus/niche).

**Criterios:** Exploración amplia sin restricciones adicionales. Prioridad: encaje global, diversidad de género, evitar duplicados de jugables (`asteroids`, `tetris`, `arkanoid`, `snake`) y placeholders redundantes (`rocas`, `serpentina`, `caida`, `bloque-buster`).

**Sugerencias:**

| # | Slug propuesto | Encaje | Estado | Notas |
|---|----------------|--------|--------|-------|
| 1 | `invasores` | 9/10 | sugerido | Space Invaders — placeholder listo; ya sugerido sesión 1 |
| 2 | `ranaria` | 9/10 | sugerido | Frogger — placeholder listo; ya sugerido sesión 1 |
| 3 | `columns` | 9/10 | sugerido | Match-3 vertical; distinto de Tetris |
| 4 | `panel-pon` | 9/10 | sugerido | Swap match-3; combos leaderboard-friendly |
| 5 | `galaga` | 8/10 | sugerido | Shooter formaciones; ya sugerido sesión 1 |
| 6 | `centipede` | 8/10 | sugerido | Shooter grilla; hongos + cienpies |
| 7 | `escalada-pixel` | 8/10 | sugerido | Donkey Kong-like; abre categoría platform |
| 8 | `ladron-laberinto` | 8/10 | sugerido | Lode Runner; maze + excavar |
| 9 | `dr-mario` | 8/10 | sugerido | Cápsulas + virus; puzzle distinto |
| 10 | `puyo` | 8/10 | sugerido | Blob match; cadenas de combos |
| 11 | `sokoban` | 8/10 | sugerido | Lógica pura; definir fórmula de score |
| 12 | `moon-patrol` | 8/10 | sugerido | Runner lateral; distancia + bonus |
| 13 | `missile-command` | 8/10 | sugerido | Defensa balística; score fuerte |
| 14 | `pixel-enduro` | 8/10 | sugerido | Carrera top-down; adelantamientos |
| 15 | `gloton` | 7/10 | sugerido | Pac-Man; placeholder listo; ya sugerido sesión 1 |
| 16 | `phoenix` | 7/10 | sugerido | Shooter invasión + jefe |
| 17 | `pipe-mania` | 7/10 | sugerido | Colocar tuberías; lógica + tiempo |
| 18 | `puzzle-bobble` | 7/10 | sugerido | Burbujas; física de rebote |
| 19 | `joust` | 7/10 | sugerido | VERSUS 1P vs CPU; esfuerzo alto |
| 20 | `dig-dug` | 7/10 | sugerido | Túneles + inflar enemigos; arcade único |
| — | `duelo-pixel` | 6/10 | sugerido | Fuera del top 20; leaderboard débil |
| — | `xevious` | 7/10 | sugerido | Fuera del top 20; shooter redundante |
| — | `1942` | 7/10 | sugerido | Fuera del top 20; scope alto |
| — | `cubo-saltarin` | 7/10 | sugerido | Fuera del top 20; Q*bert; iso complejo |
| — | `patada-calle` | 7/10 | sugerido | Fuera del top 20; brawler-lite |
| — | `ascensor-espia` | 7/10 | sugerido | Fuera del top 20; Elevator Action |
| — | `pixel-hockey` | 6/10 | sugerido | Fuera del top 20; leaderboard débil |

## Estados válidos

| Estado | Significado |
|--------|-------------|
| `sugerido` | Propuesto por game-planner; pendiente de decisión |
| `descartado` | Rechazado explícitamente por el usuario |
| `en_spec` | Usuario eligió; pasó o pasará a `@add-game` |
| `implementado` | Juego integrado en la plataforma |
| `revisitado` | Candidato descartado antes, reevaluado a petición del usuario |
