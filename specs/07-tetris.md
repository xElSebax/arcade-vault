# SPEC 07 — Tetris en Arcade Vault

> **Estado:** Aprobado
> **Depende de:** SPEC 05 — Juego Asteroids, SPEC 06 — Catálogo y leaderboard en Supabase
> **Fecha:** 2026-08-09
> **Objetivo:** Integrar el juego Tetris en `/play/tetris` portando `references/started-games/03-tetris` a un engine TypeScript modular, conservando el layout original (tablero + panel lateral con preview) y conectando leaderboard real en Supabase bajo `id: "tetris"`.

## Alcance

**Dentro:**

- Nueva entrada en `app/data/games.ts` con `id: "tetris"`, título **TETRIS**, categoría `PUZZLE`, cover `cover-tetris`, color `yellow` (distinto de `caida`). Textos `short`/`long` similares a CAÍDA, adaptados a Tetris clásico. El placeholder `caida` queda intacto.
- Port de `references/started-games/03-tetris/game.js` a módulo TypeScript en `lib/games/tetris/`:
  - Tablero 10×20, bloque 30 px; canvas principal 300×600.
  - 8 piezas (I, O, T, S, Z, J, L + N "tuerca") con colores de la referencia.
  - Rotación CW con wall kicks `[0, ±1, ±2]`.
  - Ghost piece, soft drop (+1/fila), hard drop (+2/celda).
  - Puntuación: `LINE_SCORES = [0, 100, 300, 500, 800] × nivel`.
  - Nivel: `floor(líneas / 10) + 1`; velocidad `max(100, 1000 − (nivel−1) × 90)` ms.
  - Game over al colisionar en `spawn()` (sin sistema de vidas).
- API del engine (`TetrisEngine`):
  - `mount(canvas)`, `unmount()`, `pause()`, `resume()`, `reset()`.
  - `onStateChange(cb)` emite `{ score, lines, level, phase: "playing" | "gameover" }`.
- Layout del arena (dentro del CRT): tablero + panel lateral con preview **NEXT** (canvas 120×120) y lista de controles, como la referencia.
- Extensión mínima de `GamePlayerShell`: props opcionales `lines?: number` y `hideLives?: boolean` para Tetris. Shell externo muestra Puntuación, Líneas y Nivel (sin stat de Vidas).
- Componentes `tetris-canvas.tsx` y `tetris-player.tsx`.
- Rutas estáticas `app/games/tetris/` y `app/play/tetris/`.
- Registro en `STATIC_GAME_ROUTES`.
- Cover CSS `.cover-tetris` en `app/arcade-vault.css` (paleta cyan/amarillo de piezas I/O).
- Seed en `public.games` (`id: "tetris"`) + `tetris` en `SUPABASE_GAMES`.
- Guardar puntuación vía `saveScore` al pulsar **GUARDAR PUNTUACIÓN**.
- Controles teclado: `←` `→` mover · `↑`/`X` rotar · `↓` soft drop · `Espacio` hard drop. Pausa solo por botones del shell (PAUSA/REANUDAR).

**Fuera de alcance (para specs futuros):**

- Modificar o implementar el placeholder `caida`.
- Audio / efectos de sonido.
- Controles táctiles u on-screen para móvil.
- Toggle de tema claro/oscuro (`localStorage tetris-theme` de la referencia).
- Tecla `P` para pausa (solo botones del shell).
- Supabase Auth, realtime, tests automatizados.
- Registry genérico de engines.
- Refactor global de `GamePlayerShell` más allá de las props opcionales para Tetris.

## Modelo de datos

### Catálogo — `app/data/games.ts`

```ts
{
  id: "tetris",
  title: "TETRIS",
  short: "Encaja las piezas antes de que el tablero se llene.",
  long: "Tetrominós descienden desde arriba. Rótalos, encájalos y limpia líneas para sobrevivir. La velocidad aumenta sin piedad cada 10 líneas.",
  cat: "PUZZLE",
  cover: "cover-tetris",
  color: "yellow",
  best: 0,
  plays: "0",
}
```

### API del engine — `lib/games/tetris/types.ts`

```ts
export type TetrisPhase = "playing" | "gameover";

export interface TetrisGameState {
  score: number;
  lines: number;
  level: number;
  phase: TetrisPhase;
}

export interface TetrisEngine {
  mount(canvas: HTMLCanvasElement, nextCanvas: HTMLCanvasElement): void;
  unmount(): void;
  pause(): void;
  resume(): void;
  reset(): void;
  onStateChange(cb: (state: TetrisGameState) => void): () => void;
}
```

> `mount` recibe dos canvas: tablero principal (300×600) y preview de siguiente pieza (120×120), como en la referencia.

### Estado interno del engine (no expuesto a React)

Constantes (`lib/games/tetris/constants.ts`):

| Constante | Valor | Uso |
|-----------|-------|-----|
| `COLS` | `10` | Columnas del tablero |
| `ROWS` | `20` | Filas del tablero |
| `BLOCK` | `30` | Tamaño en px de cada celda |
| `LINE_SCORES` | `[0, 100, 300, 500, 800]` | Puntos base por 1–4 líneas |
| `COLORS` | índices 1–8 | Paleta por tipo de pieza (incl. tuerca gris) |
| `PIECES` | matrices 1–8 | Formas I, O, T, S, Z, J, L, N |

Estado en closure del engine:

- `board: number[][]` — matriz `ROWS × COLS`; `0` = vacío, `1–8` = índice de color.
- `current: { type, shape, x, y }` — pieza activa.
- `next: { type, shape, x, y }` — siguiente pieza (para preview).
- `score`, `lines`, `level` — métricas de partida.
- `dropInterval`, `dropAccum`, `lastTime` — temporización de caída automática.
- `animId` — handle de `requestAnimationFrame`.

Entidades en `lib/games/tetris/` (funciones puras, no clases):

- `collide(shape, ox, oy)` — colisión con bordes y tablero.
- `rotateCW(shape)` + `tryRotate(current, board)` — rotación con wall kicks.
- `clearLines(board)` — elimina filas completas, devuelve líneas limpiadas.
- `ghostY(current, board)` — proyección de pieza fantasma.
- `drawBlock(ctx, x, y, colorIndex, size, alpha?)` — renderizado de celda.
- `randomPiece()` — genera pieza aleatoria (tipos 1–8).

### Notificación a React

El engine llama `onStateChange` cuando cambian `score`, `lines`, `level` o `phase`. `TetrisPlayer` refleja el estado en `GamePlayerShell` (`score`, `lines`, `level`, `hideLives`). Cuando `phase === "gameover"`, el shell muestra overlay CRT (no en canvas del engine).

### Supabase — seed

```sql
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
```

### Ramificación híbrida — `lib/data/leaderboard.ts`

```ts
const SUPABASE_GAMES = new Set(["asteroids", "tetris"]);
```

Sin nueva Server Action ni archivos de query por juego.

## Patrón de integración

### Checklist (orden de trabajo)

1. **Catálogo** — Entrada `tetris` en `app/data/games.ts` (sin tocar `caida`).
2. **Cover CSS** — `.cover-tetris` en `app/arcade-vault.css`.
3. **Engine** — `lib/games/tetris/` (`types.ts`, `constants.ts`, `utils.ts`, `board.ts`, `pieces.ts`, `engine.ts`).
4. **Canvas** — `components/games/tetris-canvas.tsx` (dos canvas: tablero + preview NEXT).
5. **Shell** — Extender `GamePlayerShell` con `lines?: number` y `hideLives?: boolean`.
6. **Player** — `components/games/tetris-player.tsx` con `saveScore` + `usePlayerName()`.
7. **Rutas estáticas** — `app/games/tetris/page.tsx`, `app/play/tetris/page.tsx`.
8. **Registro** — `"tetris"` en `STATIC_GAME_ROUTES`.
9. **Supabase** — migración seed + `SUPABASE_GAMES`.
10. **Smoke test** — verificación manual (criterios de aceptación).

**No hacer:** `if (game.id === "tetris")` en `GamePlayer`.

### Diagrama de capas

```
app/games/tetris/page.tsx          app/play/tetris/page.tsx
         │                                    │
         ▼                                    ▼
  GameDetailView                      TetrisPlayer
                                              │
                         ┌────────────────────┼────────────────────┐
                         ▼                    ▼                    ▼
                 GamePlayerShell      TetrisCanvas          engineRef → reset()
              (score·líneas·nivel)           │
                         │            ┌───────┴───────┐
                         │            ▼               ▼
                         │      board 300×600   next 120×120
                         │            │               │
                         │            └───────┬───────┘
                         │                    ▼
                         │         lib/games/tetris/engine.ts
                         ▼
              overlays: PAUSA / FIN DEL JUEGO (dentro del CRT)
```

### Estructura de archivos

```
app/
  data/
    games.ts                      # + entrada tetris
    static-game-routes.ts         # + "tetris"
  games/tetris/page.tsx
  play/tetris/page.tsx

components/
  game-player-shell.tsx           # + props lines, hideLives
  games/
    tetris-canvas.tsx
    tetris-player.tsx

lib/games/tetris/
  types.ts
  constants.ts      # COLS, ROWS, BLOCK, COLORS, PIECES, LINE_SCORES
  utils.ts          # rotateCW, collide, ghostY, drawBlock
  board.ts          # createBoard, clearLines, merge
  pieces.ts         # randomPiece, tryRotate, lockPiece, spawn
  engine.ts         # loop rAF, input, onStateChange, mount/unmount

app/arcade-vault.css              # .cover-tetris

supabase/migrations/…             # seed public.games (tetris)
lib/data/leaderboard.ts           # + "tetris" en SUPABASE_GAMES
```

**Fuente del port:** `references/started-games/03-tetris/game.js` (~333 líneas, sin módulos).

## Plan de implementación

1. **Catálogo y cover** — Añadir entrada `tetris` en `app/data/games.ts`. Crear `.cover-tetris` en `app/arcade-vault.css` (gradiente cyan/amarillo con silueta de pieza I u O). Verificar que aparece en `/games` con tarjeta distinta de `caida`.

2. **Fundamentos del engine** — Crear `lib/games/tetris/types.ts`, `constants.ts` y `utils.ts` con constantes, tipos, `rotateCW`, `collide`, `ghostY`, `drawBlock` portados de la referencia. Sin loop aún.

3. **Lógica de tablero y piezas** — Crear `board.ts` (`createBoard`, `merge`, `clearLines`) y `pieces.ts` (`randomPiece`, `tryRotate`, `lockPiece`, `spawn`, `softDrop`, `hardDrop`). Tests manuales unitarios vía consola o import temporal.

4. **Engine core** — Crear `engine.ts` con loop `requestAnimationFrame`, input de teclado, temporización de caída, `onStateChange`, y métodos `mount`/`unmount`/`pause`/`resume`/`reset`. Renderiza tablero + ghost + pieza activa en canvas principal y preview en canvas secundario.

5. **Extensión del shell** — Añadir props opcionales `lines?: number` y `hideLives?: boolean` a `GamePlayerShell`. Cuando `hideLives` es `true`, ocultar stat de Vidas; si `lines` está definido, mostrar stat de Líneas. Asteroids sin cambios de comportamiento.

6. **Componente canvas** — Crear `components/games/tetris-canvas.tsx`: layout flex (tablero + panel lateral con NEXT y controles), `useEffect` para mount/unmount de ambos canvas, props `paused`, `onStateChange`, `engineRef`. Callback estable vía `onStateChangeRef` (patrón React 19 de Asteroids).

7. **Player y rutas** — Crear `tetris-player.tsx` (estado React, `saveScore`, `usePlayerName`, `GamePlayerShell` con `hideLives` y `lines`). Crear `app/games/tetris/page.tsx` y `app/play/tetris/page.tsx`. Registrar `"tetris"` en `STATIC_GAME_ROUTES`. Verificar flujo completo: biblioteca → detalle → play → pausa → game over → reinicio → salir.

8. **Supabase** — Migración SQL con seed de `tetris` en `public.games`. Añadir `"tetris"` a `SUPABASE_GAMES` en `lib/data/leaderboard.ts`. Verificar ranking en `/games/tetris` y tab TETRIS en `/hall-of-fame`. Probar **GUARDAR PUNTUACIÓN**.

9. **Smoke test manual** — Recorrer criterios de aceptación. Confirmar regresión en Asteroids y que `caida` sigue como placeholder. `npm run build` sin errores.

## Criterios de aceptación

### Catálogo
- [ ] `tetris` aparece en `/games` con título **TETRIS**, categoría `PUZZLE` y cover `.cover-tetris` (distinto de `caida`)
- [ ] `/games/tetris` muestra detalle con CTA **JUGAR** → `/play/tetris`
- [ ] El placeholder `caida` sigue visible y sin cambios en `/games` y `/play/caida`

### Juego jugable
- [ ] `/play/tetris` carga tablero 300×600 y panel lateral con preview NEXT dentro del marco CRT
- [ ] Controles: `←` `→` mover · `↑`/`X` rotar · `↓` soft drop · `Espacio` hard drop
- [ ] Las 8 piezas (I, O, T, S, Z, J, L, N) aparecen con colores de la referencia
- [ ] Ghost piece visible con opacidad reducida
- [ ] Rotación con wall kicks básicos (`±0`, `±1`, `±2` columnas)
- [ ] Limpieza de líneas: 1 línea = 100×nivel, 2 = 300×nivel, 3 = 500×nivel, 4 = 800×nivel
- [ ] Soft drop suma 1 punto/fila; hard drop suma 2 puntos/celda
- [ ] Nivel sube cada 10 líneas; velocidad de caída aumenta acorde a la fórmula de la referencia
- [ ] Game over al no poder spawnear nueva pieza (sin vidas ni reintentos automáticos)

### HUD y shell
- [ ] Shell externo muestra Puntuación, Líneas y Nivel (sin stat de Vidas)
- [ ] Panel lateral dentro del CRT muestra preview **NEXT** y lista de controles
- [ ] Valores del shell sincronizados con el engine vía `onStateChange`
- [ ] PAUSA detiene el loop; REANUDAR lo reanuda
- [ ] Game over muestra overlay dentro del CRT (no texto "GAME OVER" en canvas del engine)
- [ ] **JUGAR DE NUEVO** llama a `engine.reset()` y reinicia partida
- [ ] SALIR navega a `/games/tetris`
- [ ] Tecla `P` no pausa el juego (pausa solo por botones del shell)

### Leaderboard
- [ ] `/games/tetris` muestra ranking desde Supabase
- [ ] `/hall-of-fame` tab **TETRIS** muestra ranking real
- [ ] **GUARDAR PUNTUACIÓN** inserta en `scores` con `game_id = "tetris"` y `user_id = null`
- [ ] Nombre recordado en `localStorage` (`av_player_name`)
- [ ] Fila **TU MEJOR MARCA** si hay nombre guardado y scores en BD

### Regresión
- [ ] Asteroids sigue funcionando con normalidad (`/play/asteroids`, leaderboard, guardado)
- [ ] Placeholder `caida` sin cambios de comportamiento
- [ ] Otro juego placeholder (ej. `/play/bloque-buster`) sin regresiones

### Técnico
- [ ] Sin errores de consola relevantes en `/play/tetris`
- [ ] Sin errores TypeScript/ESLint en archivos del juego
- [ ] Engine se desmonta limpiamente al salir de `/play/tetris` (rAF cancelado, listeners eliminados)
- [ ] `npm run build` sin errores

## Decisiones

### Heredadas de SPEC 05 / SPEC 06
- **Sí:** Ruta estática + `TetrisPlayer` + `TetrisCanvas` (sin branch en `GamePlayer`).
- **Sí:** `GamePlayerShell` para HUD externo, pausa y game over en CRT.
- **Sí:** `saveScore` genérico + `SUPABASE_GAMES` con `"tetris"`.
- **Sí:** RLS deshabilitado en `scores` (patrón del curso).
- **Sí:** `onStateChange` + `usePlayerName()` + `onStateChangeRef` (patrón React 19 de Asteroids).
- **No:** Registry genérico de engines.
- **No:** Inserción directa desde cliente Supabase.
- **No:** Guardado automático al game over (solo botón **GUARDAR PUNTUACIÓN**).

### Específicas de este juego
- **Sí:** Juego nuevo `id: "tetris"`, independiente del placeholder `caida` (no reutilizar slug ni cover).
- **Sí:** Port fiel de `references/started-games/03-tetris/game.js` con las 8 piezas (incl. N "tuerca").
- **Sí:** Layout original conservado: tablero + panel lateral con NEXT y controles dentro del CRT.
- **Sí:** Dos canvas en `mount()` — tablero 300×600 y preview 120×120.
- **Sí:** Extensión mínima de `GamePlayerShell` con `lines?: number` y `hideLives?: boolean`.
- **Sí:** Ocultar stat de Vidas (no mostrar "1 vida" simbólico); shell muestra Puntuación, Líneas y Nivel.
- **Sí:** Cover CSS nueva `.cover-tetris` (paleta cyan/amarillo, distinta de `.cover-tetro` de `caida`).
- **Sí:** Textos `short`/`long` similares a CAÍDA, adaptados a Tetris.
- **Sí:** Pausa solo por botones del shell (no tecla `P` de la referencia).
- **Sí:** Game over en overlay CRT del shell (no overlay DOM de la referencia ni texto en canvas).
- **No:** Toggle de tema claro/oscuro de la referencia.
- **No:** Audio.
- **No:** Controles táctiles.
- **No:** Modificar entrada ni comportamiento de `caida`.

## Riesgos

| Riesgo | Mitigación |
|--------|------------|
| `requestAnimationFrame` sigue corriendo tras desmontar | `unmount()` cancela rAF y elimina listeners de teclado |
| Dos canvas complican el mount/unmount | `TetrisCanvas` gestiona ambos en un solo `useEffect`; `engine.mount(board, next)` atómico |
| Extensión de `GamePlayerShell` rompe Asteroids | Props opcionales (`lines`, `hideLives`); Asteroids no las pasa, comportamiento idéntico |
| Panel lateral no cabe en marco CRT en pantallas estrechas | Layout flex con `flex-wrap` o escala proporcional; verificar en viewport ≥ 768 px |
| Confusión visual entre `tetris` y `caida` en catálogo | Covers distintas (`.cover-tetris` vs `.cover-tetro`), títulos distintos, colores distintos (`yellow` vs `magenta`) |
| Pieza N "tuerca" desbalancea dificultad | Port fiel a referencia; ajuste de balance queda fuera de alcance |

## Lo que NO está en este spec

- Implementar o modificar el placeholder `caida`.
- Audio / efectos de sonido.
- Controles táctiles u on-screen para móvil.
- Toggle de tema claro/oscuro.
- Tecla `P` para pausa.
- Supabase Auth, realtime, tests automatizados.
- Registry genérico de engines.
- Ajuste de balance de la pieza N "tuerca".
- Migrar el catálogo completo de `games.ts` a Supabase.

Cada uno de estos, si llega, va en su propio spec.
