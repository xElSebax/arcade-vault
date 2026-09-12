# Reference — theme interpretation and variant design for game-jam

Read this file in Phase 0–2 when turning an abstract theme into playable game specs. Also read `.claude/skills/game-planner/criteria.md` for platform fit scoring.

---

## From theme to mechanics

A theme is **not** a game. Extract playable loops by asking:

| Pregunta | Ejemplo (tema: océano) |
|----------|------------------------|
| ¿Qué **mueve** al jugador? | Huir de depredadores, recolectar perlas, subir a la superficie |
| ¿Qué **obstáculo** encaja visualmente? | Corrientes, rocas, medusas, burbujas tóxicas |
| ¿Qué **recolectable** suma puntos? | Perlas, peces, oxígeno, algas |
| ¿Cuál es la **tensión**? | Tiempo (oxígeno), espacio (grid lleno), precisión (navegar) |
| ¿Qué **paleta CRT** evoca el tema? | Azul profundo + cyan neón + blanco espuma |

**Rule:** every variant must have a clear **score** comparable on Supabase leaderboard.

---

## Recommended variant pairs

Use **different gameplay axes** on the same theme. Pick one row per jam:

| Par A (acción) | Par B (reflexión) | Ejemplo tema |
|----------------|-------------------|--------------|
| Endless dodge + score | Grid puzzle + lines | océano |
| Shooter + waves | Timing / rhythm tap | neón |
| Platform hop + levels | Match / cascade | invierno |
| Survival (recursos) | Score attack (velocidad) | desierto |
| Breakout variant | Snake-like growth | circuitos |
| Lane runner (3 vías) | Memory / pattern match | halloween |

**Avoid:** two variants that differ only in skin (same loop, different sprites).

---

## Variant design checklist

Before presenting in Phase 2, verify each variant:

- [ ] Canvas 2D, pausable loop, `phase: "playing" | "gameover"` (or `win` if levels)
- [ ] Keyboard controls (arrows/WASD/space); mouse optional
- [ ] Numeric score for leaderboard
- [ ] HUD via `GamePlayerShell` — not heavy in-canvas UI
- [ ] Distinct `id` slug (kebab-case, 2–20 chars)
- [ ] Cover class `.cover-{slug}` distinct from existing covers
- [ ] Effort proportionate to user constraint (bajo/medio/alto)
- [ ] Encaje ≥6/10 on `criteria.md` dimensions

---

## Anti-patterns

| Tema | Idea rechazada | Por qué |
|------|----------------|---------|
| Cualquiera | Clon de Tetris con tema | Ya existe `tetris`; usar mecánica distinta |
| Cualquiera | Clon de Snake temático | Ya existe `snake` |
| Cualquiera | Multijugador online | Fuera de plataforma |
| Cualquiera | Sin puntuación (solo victoria) | No encaja con leaderboard Supabase |
| Cualquiera | 3D / WebGL pesado | Fuera de stack canvas 2D |
| océano | "Submarino = Arkanoid" | Demasiado cercano a `arkanoid` sin twist claro |
| espacio | "Naves = Asteroids" | Duplica `asteroids` / placeholder `rocas` |
| laberinto | "Fantasmas = Pac-Man" | Válido solo si hay twist; `gloton` es el placeholder natural |

When a variant is close to a placeholder (`invasores`, `ranaria`, etc.), **note the mapping** in the spec Decisions section. If the user **named a specific game** (e.g. Frogger), use that game name as `id` — **do not** silently map to the placeholder (`ranaria` ≠ `frogger`). Only fill a placeholder when the user explicitly asks.

---

## Named game vs theme-only

| | **Juego nombrado** | **Solo tema** |
|---|-------------------|---------------|
| Ejemplo input | "implementar Frogger", "juego Galaga" | "océano", "neón" |
| Carpeta jam | `{game-id}/` — mismo que el juego | Nombre creativo (`tide-runner/`) |
| `id` catálogo | **Uno compartido** en todas las variantes | Distinto por variante (default) |
| Archivos spec | `01-{id}-{hook}.md`, `02-{id}-{hook}.md` | `{variant-slug}.md` o numerados |
| Promoción | `specs/NN-{id}.md` (p. ej. `10-frogger.md`) | `specs/NN-{slug-elegido}.md` |

**Ejemplo Frogger (juego nombrado):**

| Archivo | `id` | Hook |
|---------|------|------|
| `01-frogger-classic.md` | `frogger` | Frogger clásico por niveles |
| `02-frogger-log-rush.md` | `frogger` | Endless solo río |

El placeholder `ranaria` permanece en `games.ts` hasta que un spec futuro lo sustituya o se decida fusionar catálogos.

---

## Folder and file naming

| Elemento | Convención (solo tema) | Convención (juego nombrado) |
|----------|------------------------|----------------------------|
| Carpeta jam | Evoca el tema | `{game-id}/` (`frogger/`) |
| Archivo variante | `{catalog-slug}.md` | `01-{id}-{hook}.md`, `02-{id}-{hook}.md` |
| Slug catálogo | kebab-case, único por variante | **Mismo `id`** en todas las variantes |
| Título juego | MAYÚSCULAS en catálogo | Nombre del juego (`FROGGER`) |

Default (solo tema): **one folder per jam session**, **distinct catalog slugs per variant**.

---

## Mini example — tema `neón`

**Carpeta:** `specs/game-jam/neon-drift/`

| Archivo | Slug | Género | Hook | Encaje |
|---------|------|--------|------|--------|
| `pulse-lane.md` | `pulse-lane` | ARCADE | Runner 3 carriles; esquivar barras de luz; velocidad crece | 8/10 |
| `grid-glow.md` | `grid-glow` | PUZZLE | Conectar nodos neón en grid 8×8 antes de que se apaguen | 7/10 |

**Recomendación:** `pulse-lane` — loop más simple, mejor showcase del tema en movimiento.

**Paleta compartida:** magenta `#ff00ff`, cyan `#00ffff`, fondo `#0a0a12` — cada spec documenta su `.cover-{slug}` con variación (runner vs grid).

---

## Promotion to main specs

Jam specs live in `specs/game-jam/{folder}/` without `NN` prefix. When the human picks a variant:

1. List `specs/` for next `NN` (e.g. `10`).
2. Copy chosen file to `specs/NN-{slug}.md`.
3. Update header: `# SPEC NN — {Título} en Arcade Vault` (add number).
4. Human sets `Estado: Aprobado`.
5. `@spec-impl NN-{slug}`.

Update `sessions-log.md` variant status to `elegido` or `promovido`.
