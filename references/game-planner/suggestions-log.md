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

_(Sin sesiones registradas todavía.)_

## Estados válidos

| Estado | Significado |
|--------|-------------|
| `sugerido` | Propuesto por game-planner; pendiente de decisión |
| `descartado` | Rechazado explícitamente por el usuario |
| `en_spec` | Usuario eligió; pasó o pasará a `@add-game` |
| `implementado` | Juego integrado en la plataforma |
| `revisitado` | Candidato descartado antes, reevaluado a petición del usuario |
