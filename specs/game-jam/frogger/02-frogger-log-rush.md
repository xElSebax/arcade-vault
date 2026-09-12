# JAM — FROGGER (Log Rush) en Arcade Vault

> **Estado:** Borrador
> **Tema jam:** cruza la carretera y el río sin convertirte en papilla
> **Carpeta:** `specs/game-jam/frogger/02-frogger-log-rush.md`
> **Variante:** Log Rush — score attack endless (solo río)
> **Depende de:** SPEC 05 — Juego Asteroids, SPEC 06 — Catálogo y leaderboard en Supabase
> **Fecha:** 2026-09-12
> **Objetivo:** Integrar **FROGGER** en `/play/frogger` con engine TypeScript desde cero, mecánica endless de supervivencia en el río (troncos, combo, score attack), estética CRT temática, shell del reproductor y leaderboard real en Supabase bajo `id: "frogger"`.

## Alcance

**Dentro:**

- Nueva entrada en `app/data/games.ts` con `id: "frogger"`, título **FROGGER**, categoría `ARCADE`, cover `cover-frogger`, color `yellow`. Textos `short`/`long` adaptados al modo endless (tagline jam conservado). El placeholder `ranaria` queda intacto.
- Engine desde cero en `lib/games/frogger/` (sin referencia en `references/started-games/`):
  - Canvas **480×640**; grilla **12×16**, celda **40 px**.
  - **Sin carretera, sin nenúfares meta, sin niveles discretos** — solo escenario de río endless.
  - Layout vertical:
    - **Filas 0–1:** decoración cielo / orilla lejana (no jugable).
    - **Filas 2–14:** 13 carriles de río con troncos de distinto largo y velocidad.
    - **Filas 15:** orilla inicial segura (spawn de la rana).
  - Rana: salto discreto 1 celda (`←` `→` `↑` `↓` + WASD); `↑` avanza fila y suma distancia; `↓` retrocede (sin penalización, riesgo de agua).
  - Troncos entran desde los lados, wrap horizontal; densidad y velocidad **crecen con el tiempo de supervivencia**.
  - Caer al agua → `phase: "gameover"` inmediato (sin vidas).
  - **Combo:** aterrizajes consecutivos en troncos sin tocar agua incrementan multiplicador ×1.0 → ×1.5 → ×2.0 → ×2.5 (tope); tocar agua o retroceder a orilla resetea combo a ×1.0.
  - **Puntuación continua:**
    - `+5 × combo` por cada salto `↑` exitoso (aterrizar en tronco o orilla superior de juego).
    - `+2 × combo` por segundo vivo (tick cada 1 s).
    - `+100 × combo` cada 10 saltos `↑` exitosos consecutivos (hito de distancia).
  - Dificultad: cada 15 s aumenta `speedMult` en +0.08 y reduce gap mínimo entre troncos; sin techo duro de velocidad hasta `speedMult ≤ 2.5`.
  - Una sola vida por partida (endless hasta error).
- API del engine (`FroggerEngine`):
  - `mount(canvas)`, `unmount()`, `pause()`, `resume()`, `reset()`.
  - `onStateChange(cb)` emite `{ score, combo, speedMult, hops, phase: "playing" | "gameover" }`.
- Componentes `frogger-canvas.tsx` y `frogger-player.tsx`.
- Rutas estáticas `app/games/frogger/` y `app/play/frogger/`.
- Registro en `STATIC_GAME_ROUTES`.
- Cover CSS `.cover-frogger` en `app/arcade-vault.css` (énfasis río cyan + troncos + rana en salto — distinta de `.cover-rana`).
- Seed en `public.games` (`id: "frogger"`) + `frogger` en `SUPABASE_GAMES`.
- Guardar puntuación vía `saveScore` al pulsar **GUARDAR PUNTUACIÓN**.
- Controles teclado; pausa solo por botones del shell.

**Fuera de alcance (para specs futuros):**

- Modificar o implementar el placeholder `ranaria`.
- Carretera, vehículos, nenúfares, timer por nivel, sistema de vidas múltiples.
- Audio / efectos de sonido.
- Controles táctiles u on-screen para móvil.
- Power-ups (reloj lento, escudo).
- Supabase Auth, realtime, tests automatizados.
- Registry genérico de engines.
- Variante Classic (ver `01-frogger-classic.md`).

## Modelo de datos

### Catálogo — `app/data/games.ts`

```ts
{
  id: "frogger",
  title: "FROGGER",
  short: "Cruza la carretera y el río sin convertirte en papilla.",
  long: "Modo Log Rush: solo el río importa. Salta de tronco en tronco mientras la corriente acelera. Encadena aterrizajes para multiplicar puntos. Un chapuzón y vuelves a ser papilla.",
  cat: "ARCADE",
  cover: "cover-frogger",
  color: "yellow",
  best: 0,
  plays: "0",
}
```

> Los textos `long` pueden enfatizar el modo endless; el título **FROGGER** y el tagline jam se mantienen.

### API del engine — `lib/games/frogger/types.ts`

```ts
export type FroggerPhase = "playing" | "gameover";

export interface FroggerGameState {
  score: number;
  combo: number;      // multiplicador actual (1.0 – 2.5)
  speedMult: number;    // escala de velocidad de troncos (≥ 1.0)
  hops: number;       // saltos ↑ exitosos acumulados
  phase: FroggerPhase;
}

export interface FroggerEngine {
  mount(canvas: HTMLCanvasElement): void;
  unmount(): void;
  pause(): void;
  resume(): void;
  reset(): void;
  onStateChange(cb: (state: FroggerGameState) => void): () => void;
}
```

### Estado interno del engine (no expuesto a React)

Constantes (`lib/games/frogger/constants.ts`):

| Constante | Valor | Uso |
|-----------|-------|-----|
| `COLS` | `12` | Columnas de la grilla |
| `ROWS` | `16` | Filas de la grilla |
| `CELL` | `40` | Tamaño en px de cada celda |
| `W` / `H` | `480` / `640` | Dimensiones del canvas |
| `HOP_MS` | `100` | Duración animación de salto |
| `RIVER_ROWS` | `[2, …, 14]` | Carriles activos de río |
| `SPAWN_ROW` | `15` | Orilla inicial |
| `POINTS_HOP` | `5` | Base por salto ↑ exitoso |
| `POINTS_PER_SEC` | `2` | Base por segundo vivo |
| `MILESTONE_HOPS` | `10` | Saltos para bonus de distancia |
| `MILESTONE_BONUS` | `100` | Bonus base al hito |
| `COMBO_STEPS` | `[1.0, 1.5, 2.0, 2.5]` | Escalones de multiplicador |
| `DIFFICULTY_INTERVAL` | `15` | Segundos entre escaladas |
| `SPEED_STEP` | `0.08` | Incremento de `speedMult` |
| `MAX_SPEED_MULT` | `2.5` | Tope de velocidad |
| `MIN_LOG_GAP` | `2` | Celdas mínimas entre troncos (reduce con dificultad hasta 1) |

Entidades en `lib/games/frogger/entities/`:

- `frog.ts` — `{ col, row, hopFrom, hopTo, hopT, riding: Log | null }`.
- `log.ts` — `{ x, y, w, h, vx, lane }` — troncos por carril (`w` en celdas: 2–5).

Módulos de soporte:

- `spawn.ts` — generación procedural de troncos por carril según `speedMult` y tiempo.
- `collision.ts` — AABB salto, punto en tronco, detección agua.
- `render.ts` — parallax sutil de agua, espuma, troncos, rana.

Estado en closure del engine:

- `frog`, `logs[]`
- `score`, `combo`, `speedMult`, `hops`, `phase`
- `consecutiveHops`, `survivalTime`, `difficultyTimer`
- `keys`, `hopLock`, `scoreTick`, `animId`, `lastTime`, `paused`

### Notificación a React

El engine llama `onStateChange` al cambiar score, combo, speedMult, hops o phase. `FroggerPlayer` refleja métricas en el shell. Con `phase === "gameover"`, overlay CRT del shell.

### Supabase — seed

```sql
insert into public.games (id, title, short, long, cat, cover, color)
values (
  'frogger',
  'FROGGER',
  'Cruza la carretera y el río sin convertirte en papilla.',
  'Modo Log Rush: solo el río importa. Salta de tronco en tronco mientras la corriente acelera. Encadena aterrizajes para multiplicar puntos. Un chapuzón y vuelves a ser papilla.',
  'ARCADE',
  'cover-frogger',
  'yellow'
);
```

### Ramificación híbrida — `lib/data/supabase-games.ts`

```ts
// Añadir "frogger" a SUPABASE_GAMES
```

Sin nueva Server Action ni archivos de query por juego.

## Patrón de integración

### Checklist (orden de trabajo)

1. **Catálogo** — Entrada `frogger` en `app/data/games.ts` (sin tocar `ranaria`).
2. **Cover CSS** — `.cover-frogger` en `app/arcade-vault.css`.
3. **Engine** — `lib/games/frogger/` (`types.ts`, `constants.ts`, `entities/`, `spawn.ts`, `collision.ts`, `render.ts`, `engine.ts`).
4. **Canvas** — `components/games/frogger-canvas.tsx`.
5. **Shell** — Extender `GamePlayerShell` con props opcionales `combo?: number` y `hideLives?: boolean` (sin stat Vidas).
6. **Player** — `components/games/frogger-player.tsx` con `saveScore` + `usePlayerName()`.
7. **Rutas estáticas** — `app/games/frogger/page.tsx`, `app/play/frogger/page.tsx`.
8. **Registro** — `"frogger"` en `STATIC_GAME_ROUTES`.
9. **Supabase** — migración seed + `SUPABASE_GAMES`.
10. **Smoke test** — verificación manual.

**No hacer:** `if (game.id === "frogger")` en `GamePlayer`.

### Diagrama de capas

```
app/games/frogger/page.tsx          app/play/frogger/page.tsx
         │                                    │
         ▼                                    ▼
  GameDetailView                      FroggerPlayer
                                              │
                         ┌────────────────────┼────────────────────┐
                         ▼                    ▼                    ▼
                 GamePlayerShell      FroggerCanvas          engineRef → reset()
           (score·combo·velocidad)           │
                         │                  ▼
                         │         lib/games/frogger/engine.ts
                         ▼
              overlays: PAUSA / FIN DEL JUEGO (dentro del CRT)
```

### Estructura de archivos

```
app/
  data/games.ts
  data/static-game-routes.ts
  games/frogger/page.tsx
  play/frogger/page.tsx

components/
  game-player-shell.tsx           # + prop combo (opcional), hideLives
  games/frogger-canvas.tsx
  games/frogger-player.tsx

lib/games/frogger/
  types.ts
  constants.ts
  spawn.ts
  collision.ts
  render.ts
  engine.ts
  entities/
    frog.ts
    log.ts

app/arcade-vault.css              # .cover-frogger

supabase/migrations/…             # seed public.games (frogger)
lib/data/supabase-games.ts        # + "frogger" en SUPABASE_GAMES
```

**Fuente:** engine desde cero (sin `references/started-games/`).

## Plan de implementación

1. **Catálogo y cover** — Entrada `frogger`; `.cover-frogger` con énfasis río/troncos (distinta de `.cover-rana`).

2. **Fundamentos** — `types.ts`, `constants.ts`, `spawn.ts` (generación por carril con `speedMult`).

3. **Entidades y colisiones** — `entities/frog.ts`, `entities/log.ts`, `collision.ts`, `render.ts` (agua animada, troncos).

4. **Engine core** — Loop rAF, saltos discretos, arrastre en tronco, combo, ticks de puntuación por segundo, escalada de dificultad cada 15 s, game over al agua, `onStateChange`, pause/resume/reset/unmount.

5. **Extensión del shell** — Prop `combo?: number` (stat **Combo ×**); `hideLives: true`. Prop opcional `speedMult` mapeada a stat **Velocidad** si cabe en HUD.

6. **Componente canvas** — `frogger-canvas.tsx` con patrón `onStateChangeRef`.

7. **Player y rutas** — `frogger-player.tsx`, rutas estáticas, `STATIC_GAME_ROUTES`.

8. **Supabase** — Seed + `SUPABASE_GAMES`; verificar leaderboard.

9. **Smoke test** — Partida endless, combo, game over, guardar score, build.

## Criterios de aceptación

### Catálogo
- [ ] `frogger` aparece en `/games` con título **FROGGER**, categoría `ARCADE` y cover `.cover-frogger`
- [ ] `/games/frogger` muestra detalle con CTA **JUGAR** → `/play/frogger`
- [ ] El placeholder `ranaria` sigue visible y sin cambios

### Juego jugable
- [ ] `/play/frogger` carga canvas 480×640 dentro del marco CRT
- [ ] Escenario solo río (sin carretera ni nenúfares meta)
- [ ] Controles: `←` `→` `↑` `↓` y WASD; salto 1 celda
- [ ] Caer al agua → game over inmediato
- [ ] Montar tronco mueve la rana con el tronco
- [ ] Salto `↑` exitoso suma `5 × combo` puntos
- [ ] Supervivencia suma `2 × combo` pts/s
- [ ] Cada 10 saltos `↑` consecutivos → bonus `100 × combo`
- [ ] Combo sube tras aterrizajes seguidos en tronco (tope ×2.5); caer al agua resetea combo
- [ ] Dificultad escala cada 15 s (`speedMult`, densidad de troncos)
- [ ] No hay vidas ni reinicio automático tras error

### HUD y shell
- [ ] Shell muestra Puntuación y Combo (×); sin stat de Vidas
- [ ] PAUSA detiene loop y ticks de score; REANUDAR reanuda
- [ ] Game over en overlay CRT (no en canvas)
- [ ] **JUGAR DE NUEVO** llama a `engine.reset()`
- [ ] SALIR navega a `/games/frogger`

### Leaderboard
- [ ] `/games/frogger` muestra ranking desde Supabase
- [ ] `/hall-of-fame` tab **FROGGER** muestra ranking real
- [ ] **GUARDAR PUNTUACIÓN** inserta con `game_id = "frogger"`, `user_id = null`
- [ ] Nombre en `localStorage` (`av_player_name`)

### Regresión
- [ ] `ranaria` placeholder intacto
- [ ] asteroids, tetris, arkanoid, snake sin regresiones

### Técnico
- [ ] Sin errores de consola relevantes
- [ ] Sin errores TypeScript/ESLint
- [ ] Engine desmonta limpiamente
- [ ] `npm run build` sin errores

## Decisiones

### Heredadas de SPEC 05 / SPEC 06
- **Sí:** Ruta estática + `FroggerPlayer` + `FroggerCanvas`.
- **Sí:** `GamePlayerShell` para HUD, pausa y game over en CRT.
- **Sí:** `saveScore` + `SUPABASE_GAMES`.
- **Sí:** `onStateChange` + `usePlayerName()` + `onStateChangeRef`.
- **No:** Registry genérico; guardado automático al game over.

### Específicas de Log Rush
- **Sí:** Mismo `id: "frogger"` (modo juego nombrado) — gameplay alternativo al Classic.
- **Sí:** Nueva entrada catálogo; placeholder `ranaria` intacto.
- **Sí:** Cover `.cover-frogger` compartida conceptualmente; implementación visual puede enfatizar río.
- **Sí:** Endless score attack — una vida, sin niveles ni timer countdown.
- **Sí:** Combo como diferenciador de skill para leaderboard.
- **Sí:** Canvas 480×640; engine desde cero.
- **Sí:** `hideLives: true` en shell (patrón Tetris/Snake).
- **No:** Carretera, nenúfares, timer por nivel, tortugas hundibles.
- **No:** Modificar `ranaria`.

### Relación con placeholder `ranaria`
- `ranaria` evoca Frogger en copy y cover `.cover-rana`, pero sigue sin engine.
- `frogger` (Log Rush) es la versión jugable con nombre oficial; mecánica **distinta** del Frogger clásico que `ranaria` sugiere en su descripción larga (carretera + río + nenúfares).
- Si el humano elige Classic (`01-…`) en lugar de Log Rush, este spec queda descartado; no coexisten dos engines bajo el mismo `id`.

### Relación con variante Classic
- Ambos specs comparten `id`, rutas y archivos de integración (`lib/games/frogger/`, etc.).
- Solo se implementa **una** variante; el código del engine refleja la elegida.
- Log Rush prioriza loop arcade corto y puntuación combo; Classic prioriza fidelidad retro.

## Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Gameplay percibido como "Frogger recortado" | Copy en detalle enfatiza modo Log Rush; combo y escalada de velocidad dan profundidad |
| Combo difícil de balancear | Tope ×2.5; playtest manual en implementación |
| Troncos imposibles de cruzar en alta dificultad | Garantizar al menos un tronco alcanzable por carril; `MIN_LOG_GAP` no baja de 1 |
| Colisión agua falsa en borde de tronco | Hitbox generosa en tronco (+4 px inset agua) |
| Confusión entre variantes al promover | README jam + humano elige un spec; el otro se marca `descartado` en sessions-log |
| rAF/listeners tras desmontar | `unmount()` cancela todo |

## Lo que NO está en este spec

- Variante Classic (`01-frogger-classic.md`).
- Implementar o modificar `ranaria`.
- Carretera, vehículos, nenúfares, vidas múltiples, timer por nivel.
- Audio / efectos de sonido.
- Controles táctiles.
- Power-ups.
- Supabase Auth, realtime, tests automatizados.
- Registry genérico de engines.

Cada uno de estos, si llega, va en su propio spec.
