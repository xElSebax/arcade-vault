# JAM — FROGGER (Classic) en Arcade Vault

> **Estado:** Borrador
> **Tema jam:** cruza la carretera y el río sin convertirte en papilla
> **Carpeta:** `specs/game-jam/frogger/01-frogger-classic.md`
> **Variante:** Classic — Frogger clásico por niveles
> **Depende de:** SPEC 05 — Juego Asteroids, SPEC 06 — Catálogo y leaderboard en Supabase
> **Fecha:** 2026-09-12
> **Objetivo:** Integrar **FROGGER** en `/play/frogger` con engine TypeScript desde cero, mecánica clásica por niveles (carretera + río + nenúfares + vidas + timer), estética CRT temática, shell del reproductor y leaderboard real en Supabase bajo `id: "frogger"`.

## Alcance

**Dentro:**

- Nueva entrada en `app/data/games.ts` con `id: "frogger"`, título **FROGGER**, categoría `ARCADE`, cover `cover-frogger`, color `yellow`. Textos `short`/`long` con narrativa del tagline jam. El placeholder `ranaria` queda intacto.
- Engine desde cero en `lib/games/frogger/` (sin referencia en `references/started-games/`):
  - Canvas **480×640**; grilla **12×16**, celda **40 px**.
  - Zonas verticales (filas 0–15, de abajo arriba):
    - **Fila 15:** dock inicial (zona segura).
    - **Filas 10–14:** 5 carriles de tráfico (vehículos en horizontal, direcciones alternas).
    - **Fila 9:** mediana segura (césped).
    - **Filas 4–8:** 5 carriles de río (troncos y tortugas en horizontal).
    - **Fila 3:** franja de nenúfares meta (5 slots fijos en columnas 1, 3, 5, 7, 9).
    - **Filas 0–2:** zona segura superior (decoración + HUD mínimo en canvas).
  - Rana: 1 celda; salto discreto **1 celda** por input (`←` `→` `↑` `↓` + WASD); sin diagonal; sin salto mientras está en animación de salto (~120 ms).
  - **Carretera:** colisión AABB rana vs vehículo → pierde vida; vehículos reaparecen en wrap horizontal.
  - **Río:** rana debe estar sobre tronco/tortuga; si cae al agua → pierde vida; al montar, la rana se mueve con la plataforma; tortugas se hunden periódicamente (ciclo 3 s visible / 1.5 s hundida).
  - **Meta:** al saltar a un nenúfar libre → +50 pts, nenúfar marcado ocupado, rana vuelve al dock; los 5 nenúfares llenos → `phase: "win"` y avance de nivel.
  - **Vidas:** 3 iniciales; −1 por atropello, ahogamiento o timeout; `phase: "gameover"` al llegar a 0 vidas.
  - **Timer:** 30 s por nivel (cuenta atrás); al llegar a 0 → pierde 1 vida y reinicia el nivel (vehículos/troncos reset, nenúfares desocupados, rana al dock).
  - **Niveles:** dificultad escala velocidad de vehículos y troncos `× (1 + (level − 1) × 0.12)`; tras completar los 5 nenúfares, bonus de tiempo `timeLeft × 10` pts y `level++`.
  - **Puntuación:** +10 pts por avanzar 1 fila hacia arriba (solo la primera vez por fila en el intento actual hacia meta); +50 por nenúfar; bonus tiempo al completar nivel.
- API del engine (`FroggerEngine`):
  - `mount(canvas)`, `unmount()`, `pause()`, `resume()`, `reset()`.
  - `onStateChange(cb)` emite `{ score, lives, level, timeLeft, frogsHome, phase: "playing" | "win" | "gameover" }`.
- Componentes `frogger-canvas.tsx` y `frogger-player.tsx`.
- Rutas estáticas `app/games/frogger/` y `app/play/frogger/`.
- Registro en `STATIC_GAME_ROUTES`.
- Cover CSS `.cover-frogger` en `app/arcade-vault.css` (rana verde neón, asfalto gris, río cyan — distinta de `.cover-rana`).
- Seed en `public.games` (`id: "frogger"`) + `frogger` en `SUPABASE_GAMES`.
- Guardar puntuación vía `saveScore` al pulsar **GUARDAR PUNTUACIÓN** (en `gameover` o tras pantalla breve de nivel completado si `phase === "win"`).
- Controles teclado únicamente; pausa solo por botones del shell.

**Fuera de alcance (para specs futuros):**

- Modificar o implementar el placeholder `ranaria`.
- Audio / efectos de sonido.
- Controles táctiles u on-screen para móvil.
- Power-ups, bonus fly, cocodrilo en nenúfar, serpiente en mediana.
- Multijugador alternado (2P clásico).
- Supabase Auth, realtime, tests automatizados.
- Registry genérico de engines.
- Variante Log Rush (ver `02-frogger-log-rush.md`).

## Modelo de datos

### Catálogo — `app/data/games.ts`

```ts
{
  id: "frogger",
  title: "FROGGER",
  short: "Cruza la carretera y el río sin convertirte en papilla.",
  long: "Salta entre carriles de tráfico pixelado, monta troncos y tortugas a la deriva, y ocupa los cinco nenúfares antes de que el cronómetro llegue a cero. Cada nivel acelera el caos. ¿Llegas entero?",
  cat: "ARCADE",
  cover: "cover-frogger",
  color: "yellow",
  best: 0,
  plays: "0",
}
```

### API del engine — `lib/games/frogger/types.ts`

```ts
export type FroggerPhase = "playing" | "win" | "gameover";

export interface FroggerGameState {
  score: number;
  lives: number;
  level: number;
  timeLeft: number;   // segundos restantes del nivel (entero, ≥ 0)
  frogsHome: number;  // nenúfares ocupados en el nivel actual (0–5)
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
| `STARTING_LIVES` | `3` | Vidas iniciales |
| `LEVEL_TIME_SEC` | `30` | Segundos por nivel |
| `HOP_MS` | `120` | Duración animación de salto |
| `POINTS_PER_ROW` | `10` | Puntos por fila nueva ascendente |
| `POINTS_HOME` | `50` | Puntos por nenúfar ocupado |
| `TIME_BONUS_MULT` | `10` | Multiplicador bonus al completar nivel |
| `SPEED_SCALE` | `0.12` | Incremento de velocidad por nivel |
| `HOME_COLS` | `[1, 3, 5, 7, 9]` | Columnas de los 5 nenúfares |
| `ROAD_ROWS` | `[10, 11, 12, 13, 14]` | Índices de carriles de tráfico |
| `RIVER_ROWS` | `[4, 5, 6, 7, 8]` | Índices de carriles de río |
| `MEDIAN_ROW` | `9` | Fila de mediana segura |
| `DOCK_ROW` | `15` | Fila inicial de la rana |

Entidades en `lib/games/frogger/entities/`:

- `frog.ts` — `{ col, row, hopFrom, hopTo, hopT, riding: Platform | null }` — rana y animación de salto.
- `vehicle.ts` — `{ x, y, w, h, vx, kind: "car" | "truck" | "bus" }` — vehículos por carril.
- `platform.ts` — `{ x, y, w, h, vx, kind: "log" | "turtle", sinkPhase?: number }` — troncos/tortugas.
- `home.ts` — `{ col, occupied: boolean }` — estado de nenúfares.

Módulos de soporte:

- `lanes.ts` — definición de carriles: velocidad base, dirección, densidad de spawn por nivel.
- `collision.ts` — AABB rana/vehículo, punto-en-plataforma, detección agua.
- `render.ts` — dibujo por capas: fondo, carretera, río, entidades, rana.

Estado en closure del engine:

- `frog`, `vehicles[]`, `platforms[]`, `homes[]`
- `score`, `lives`, `level`, `timeLeft`, `frogsHome`, `phase`
- `rowsReached: Set<number>` — filas ya premiadas en el intento actual
- `keys`, `hopLock`, `levelTimer`, `animId`, `lastTime`, `paused`

### Notificación a React

El engine llama `onStateChange` cuando cambian métricas o `phase`. `FroggerPlayer` refleja `score`, `lives`, `level`, `timeLeft`, `frogsHome` en el shell. Con `phase === "gameover"` o `"win"`, overlay CRT del shell (no texto en canvas del engine).

### Supabase — seed

```sql
insert into public.games (id, title, short, long, cat, cover, color)
values (
  'frogger',
  'FROGGER',
  'Cruza la carretera y el río sin convertirte en papilla.',
  'Salta entre carriles de tráfico pixelado, monta troncos y tortugas a la deriva, y ocupa los cinco nenúfares antes de que el cronómetro llegue a cero. Cada nivel acelera el caos. ¿Llegas entero?',
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
3. **Engine** — `lib/games/frogger/` (`types.ts`, `constants.ts`, `entities/`, `lanes.ts`, `collision.ts`, `render.ts`, `engine.ts`).
4. **Canvas** — `components/games/frogger-canvas.tsx`.
5. **Shell** — Extender `GamePlayerShell` con props opcionales `timeLeft?: number` y `frogsHome?: number` (stats **Tiempo** y **Meta**).
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
            (score·vidas·nivel·            │
             tiempo·meta)                  ▼
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
  game-player-shell.tsx           # + props timeLeft, frogsHome (opcionales)
  games/frogger-canvas.tsx
  games/frogger-player.tsx

lib/games/frogger/
  types.ts
  constants.ts
  lanes.ts
  collision.ts
  render.ts
  engine.ts
  entities/
    frog.ts
    vehicle.ts
    platform.ts
    home.ts

app/arcade-vault.css              # .cover-frogger

supabase/migrations/…             # seed public.games (frogger)
lib/data/supabase-games.ts        # + "frogger" en SUPABASE_GAMES
```

**Fuente:** engine desde cero (sin `references/started-games/`).

## Plan de implementación

1. **Catálogo y cover** — Entrada `frogger` en `app/data/games.ts`; `.cover-frogger` en `app/arcade-vault.css` (asfalto + río cyan + silueta rana verde). Verificar distinción visual frente a `ranaria` (`.cover-rana`).

2. **Fundamentos del engine** — `types.ts`, `constants.ts`, `lanes.ts` con velocidades/direcciones por carril y escalado por nivel.

3. **Entidades y colisiones** — `entities/*`, `collision.ts` (AABB, montar plataforma, agua), `render.ts` (capas CRT).

4. **Engine core** — `engine.ts`: loop rAF, input de salto discreto, spawn/wrap vehículos y plataformas, timer de nivel, vidas, estados `playing`/`win`/`gameover`, `onStateChange`, pause/resume/reset/unmount.

5. **Extensión del shell** — Props opcionales `timeLeft?: number` y `frogsHome?: number` en `GamePlayerShell`. Asteroids/Snake sin cambios si no pasan las props.

6. **Componente canvas** — `frogger-canvas.tsx`: mount/unmount, `engineRef`, `onStateChangeRef` (patrón React 19 de Asteroids).

7. **Player y rutas** — `frogger-player.tsx`, páginas estáticas, `"frogger"` en `STATIC_GAME_ROUTES`. Flujo: biblioteca → detalle → play → pausa → game over → reinicio → salir.

8. **Supabase** — Migración seed + `"frogger"` en `SUPABASE_GAMES`. Verificar ranking en detalle y `/hall-of-fame`.

9. **Smoke test manual** — Recorrer criterios de aceptación; `npm run build` sin errores.

## Criterios de aceptación

### Catálogo
- [ ] `frogger` aparece en `/games` con título **FROGGER**, categoría `ARCADE` y cover `.cover-frogger`
- [ ] `/games/frogger` muestra detalle con CTA **JUGAR** → `/play/frogger`
- [ ] El placeholder `ranaria` sigue visible y sin cambios en `/games` y `/play/ranaria`

### Juego jugable
- [ ] `/play/frogger` carga canvas 480×640 dentro del marco CRT
- [ ] Grilla 12×16 con zonas: dock, 5 carriles tráfico, mediana, 5 carriles río, 5 nenúfares meta
- [ ] Controles: `←` `→` `↑` `↓` y `W` `A` `S` `D`; salto de 1 celda; sin diagonal
- [ ] Atropello por vehículo → pierde 1 vida; rana reaparece en dock si quedan vidas
- [ ] Caer al agua sin plataforma → pierde 1 vida
- [ ] Montar tronco/tortuga mueve la rana con la plataforma
- [ ] Tortugas alternan visible / hundida; no se puede montar cuando están hundidas
- [ ] Nenúfar libre ocupado → +50 pts, contador meta 1/5 … 5/5, rana vuelve al dock
- [ ] 5 nenúfares llenos → bonus `timeLeft × 10`, sube nivel, resetea timer y entidades
- [ ] Timer 30 s: al llegar a 0 pierde 1 vida y reinicia el nivel
- [ ] +10 pts por cada fila nueva hacia arriba (una vez por intento hacia meta)
- [ ] Velocidad de tráfico y río aumenta con el nivel
- [ ] 0 vidas → `phase: "gameover"`

### HUD y shell
- [ ] Shell externo muestra Puntuación, Vidas, Nivel, Tiempo (s) y Meta (0–5)
- [ ] PAUSA detiene el loop y el timer; REANUDAR los reanuda
- [ ] Game over muestra overlay dentro del CRT (no en canvas del engine)
- [ ] **JUGAR DE NUEVO** llama a `engine.reset()`
- [ ] SALIR navega a `/games/frogger`

### Leaderboard
- [ ] `/games/frogger` muestra ranking desde Supabase
- [ ] `/hall-of-fame` tab **FROGGER** muestra ranking real
- [ ] **GUARDAR PUNTUACIÓN** inserta en `scores` con `game_id = "frogger"` y `user_id = null`
- [ ] Nombre recordado en `localStorage` (`av_player_name`)

### Regresión
- [ ] `ranaria` sigue como placeholder sin ruta estática de juego real
- [ ] Asteroids, tetris, arkanoid, snake sin regresiones

### Técnico
- [ ] Sin errores de consola relevantes en `/play/frogger`
- [ ] Sin errores TypeScript/ESLint en archivos del juego
- [ ] Engine se desmonta limpiamente (rAF cancelado, listeners eliminados)
- [ ] `npm run build` sin errores

## Decisiones

### Heredadas de SPEC 05 / SPEC 06
- **Sí:** Ruta estática + `FroggerPlayer` + `FroggerCanvas` (sin branch en `GamePlayer`).
- **Sí:** `GamePlayerShell` para HUD, pausa y game over en CRT.
- **Sí:** `saveScore` genérico + `SUPABASE_GAMES`.
- **Sí:** `onStateChange` + `usePlayerName()` + `onStateChangeRef`.
- **No:** Registry genérico de engines.
- **No:** Guardado automático al game over.

### Específicas de este juego (tema: cruza la carretera…)
- **Sí:** Modo juego nombrado — `id: "frogger"`, título **FROGGER**, rutas `/games/frogger` y `/play/frogger`.
- **Sí:** Nueva entrada de catálogo; **no** reutilizar ni modificar el placeholder `ranaria` (Frogger-like visual pero sin implementar).
- **Sí:** Cover `.cover-frogger` (distinta de `.cover-rana` de `ranaria`); color catálogo `yellow` vs `green` de `ranaria`.
- **Sí:** Engine desde cero; canvas 480×640; timer estricto 30 s por nivel.
- **Sí:** Mecánica clásica: tráfico + río + 5 metas + 3 vidas + niveles progresivos.
- **Sí:** Extensión mínima de `GamePlayerShell` con `timeLeft` y `frogsHome`.
- **Sí:** Paleta CRT — asfalto `#2a2a2a`, césped `#1a4d1a`, río `#004466`, tráfico neón magenta/cyan, rana `#33ff66`.
- **No:** Implementar bonus fly, cocodrilo, serpiente en mediana (deferido).
- **No:** Audio ni controles táctiles.
- **No:** Modificar `ranaria`.

### Relación con placeholder `ranaria`
- `ranaria` (RANARIA) comparte temática Frogger-like y cover `.cover-rana`, pero permanece **placeholder** sin engine.
- `frogger` es el juego real integrado con nombre reconocible internacionalmente.
- Coexisten en catálogo: `ranaria` mock en `/play/ranaria`, `frogger` jugable en `/play/frogger`.

## Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Rana montada en plataforma desincronizada al salto | Durante salto, ignorar arrastre; al aterrizar recalcular `riding` por colisión |
| Timer y pausa desincronizados | Decrementar `timeLeft` solo con `!paused && phase === "playing"` |
| Muchas entidades móviles → jank | Cap `MAX_DT`; pool fijo de vehículos/plataformas por carril |
| Confusión `frogger` vs `ranaria` en catálogo | Títulos distintos, covers distintas, color distinto; `ranaria` sin leaderboard real |
| Input spam durante hop | `hopLock` hasta completar animación 120 ms |
| `requestAnimationFrame` tras desmontar | `unmount()` cancela rAF y listeners |

## Lo que NO está en este spec

- Implementar o modificar el placeholder `ranaria`.
- Variante Log Rush (`02-frogger-log-rush.md`).
- Audio / efectos de sonido.
- Controles táctiles u on-screen para móvil.
- Power-ups clásicos (mosca, cocodrilo, serpiente).
- Multijugador alternado 2P.
- Supabase Auth, realtime, tests automatizados.
- Registry genérico de engines.

Cada uno de estos, si llega, va en su propio spec.
