# Reference — platform fit criteria for game-planner

Read this file when scoring candidates in Phase 2. Also read `AGENTS.md` and `.claude/skills/add-game/reference.md` for integration constraints.

---

## Scoring model

Rate each candidate **1–10** overall. Derive the score from the dimensions below — no single dimension should dominate unless the user explicitly prioritizes it (e.g. "solo juegos fáciles de portar" → weight **Complejidad** heavily).

| Score | Meaning |
|-------|---------|
| 9–10 | Excellent fit; strong recommendation |
| 7–8 | Good fit; viable next integration |
| 5–6 | Possible with tradeoffs; mention risks clearly |
| 3–4 | Weak fit; only suggest if user criteria force it |
| 1–2 | Poor fit; do not recommend unless asked to explore edge cases |

---

## Evaluation dimensions

| Dimensión | Encaja bien (+) | Penaliza encaje (−) |
|-----------|-----------------|---------------------|
| **Motor** | Canvas 2D, game loop claro, fases `playing` / `dead` / `gameover` | 3D, WebGL pesado, física compleja, simulación continua difícil de pausar |
| **Controles** | Teclado (flechas, WASD, space); mouse opcional (p. ej. paddle) | Touch-only, gamepad obligatorio, gestos multi-touch |
| **Puntuación** | Score numérico claro, comparable en leaderboard Supabase | Sin score, victoria binaria, coop sin ranking individual |
| **Shell CRT** | HUD externo vía `GamePlayerShell`; game over fuera del canvas | UI masiva dibujada en canvas que compite con el marco CRT |
| **Complejidad** | Port razonable desde vanilla JS o engine modular tipo Asteroids | Multijugador online, matchmaking, save states complejos, niveles procedurales masivos |
| **Estética** | Retro / pixel encaja con tokens en `app/arcade-vault.css` | Realismo, UI nativa del SO, assets fotorrealistas |
| **Catálogo** | Placeholder existente sin implementar, o hueco de categoría | Duplica juego ya implementado (`asteroids`, `tetris`, `arkanoid`, `snake`) |

---

## Catalog context (not a limit)

**Implementados (no volver a proponer como integración):** `asteroids`, `tetris`, `arkanoid`, `snake`

**Placeholders (candidatos naturales si el juego clásico encaja):**

| Placeholder id | Título | Categoría | Clásico probable |
|----------------|--------|-----------|------------------|
| `bloque-buster` | BLOQUE BUSTER | ARCADE | Breakout / Arkanoid-like |
| `caida` | CAÍDA | PUZZLE | Tetris-like |
| `serpentina` | SERPENTINA | ARCADE | Snake-like |
| `gloton` | GLOTÓN | ARCADE | Pac-Man-like |
| `invasores` | INVASORES | SHOOTER | Space Invaders-like |
| `rocas` | ROCAS | SHOOTER | Asteroids-like |
| `ranaria` | RANARIA | ARCADE | Frogger-like |
| `duelo-pixel` | DUELO PIXEL | VERSUS | Pong-like |

**Prototipos vanilla disponibles:**

| Folder | Juego | Notas |
|--------|-------|-------|
| `references/started-games/02-asteroids/` | Asteroids | Ya integrado como `asteroids` |
| `references/started-games/03-tetris/` | Tetris | Ya integrado como `tetris` |
| `references/started-games/04-arkanoid/` | Arkanoid | Ya integrado como `arkanoid` |

A game with a started prototype scores higher on **Complejidad** (effort: bajo/medio) even if catalog mapping differs from placeholder naming.

---

## Effort estimates

| Nivel | Señales |
|-------|---------|
| **bajo** | Prototipo en `started-games/`, pocas entidades, sin audio obligatorio, un solo modo |
| **medio** | Desde cero pero loop simple; niveles fijos; score claro; controles estándar |
| **alto** | Muchas entidades, IA compleja, colisiones exigentes, audio+niveles+power-ups, modo 2P local complejo |

---

## Examples (illustrative scores)

### INVASORES / Space Invaders → placeholder `invasores` — ~9/10

- **Motor:** grid + filas, loop clásico ✓
- **Controles:** flechas + space ✓
- **Puntuación:** puntos por alien, bonus UFO ✓
- **Shell CRT:** HUD mínimo ✓
- **Complejidad:** medio (desde cero) ✓
- **Catálogo:** placeholder `invasores` listo ✓

### GLOTÓN / Pac-Man-like → placeholder `gloton` — ~7/10

- **Motor:** laberinto + fantasmas ✓
- **Controles:** teclado ✓
- **Puntuación:** score claro ✓
- **Complejidad:** medio-alto (IA fantasmas, mapas) ⚠
- **Riesgo:** más lógica de estados que un shooter simple

### DUELO PIXEL / Pong → placeholder `duelo-pixel` — ~6/10

- **Motor:** simple ✓
- **Puntuación:** ⚠ victorias por rondas, no score acumulativo clásico — hay que definir métrica para leaderboard
- **Complejidad:** bajo en 1P vs CPU ✓
- **Riesgo:** modo 2P local no encaja con leaderboard online sin decisión de diseño

### Galaga (fuera de catálogo) — ~8/10

- **Motor:** shooter 2D clásico ✓
- **Puntuación:** excelente para leaderboard ✓
- **Catálogo:** requeriría nuevo id o reutilizar `invasores` con decisión explícita
- **Complejidad:** medio (formaciones, dual ship)

### MMORPG / RTS — ~1/10

- Fuera de alcance de la plataforma. No recomendar salvo petición explícita de explorar límites.

---

## Anti-patterns (do not recommend without heavy caveats)

- Juegos ya implementados bajo otro id (no duplicar Asteroids como `rocas` si `asteroids` ya existe)
- Juegos sin score numérico claro para Supabase leaderboard
- Dependencia de multijugador online real (auth no implementada)
- Ports que requieran romper el patrón `GamePlayerShell` / engine API de Asteroids

---

## Open scope reminder

The user may want games **not** in the catalog. When proposing them:

1. State proposed `slug` and title
2. Say whether to map to an existing placeholder or add a new catalog entry
3. Note any cover CSS work (`/frontend-design` later, during `@add-game`)
