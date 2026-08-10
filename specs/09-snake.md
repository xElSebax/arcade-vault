# SPEC 09 — Snake en Arcade Vault

> **Estado:** Aprobado
> **Depende de:** SPEC 05 — Juego Asteroids, SPEC 06 — Catálogo y leaderboard en Supabase
> **Fecha:** 2026-08-10
> **Objetivo:** Integrar el juego Snake en `/play/snake` con engine TypeScript desde cero (sin referencia en `started-games`), sprites de frutas desde `references/source-assets/snake-assets`, shell del reproductor (HUD, pausa, fin de partida en CRT) y leaderboard real en Supabase.

## Alcance

**Dentro:**

- Nueva entrada en `app/data/games.ts` con `id: "snake"`, título **SNAKE**, categoría `ARCADE`, cover `cover-snake-game`, color `green`. El placeholder `serpentina` queda intacto y sin cambios.
- Engine desde cero en `lib/games/snake/` (no hay referencia en `references/started-games/`):
  - Grilla 30×30, celda 20 px, canvas 600×600.
  - Serpiente con cabeza diferenciada y cuerpo en segmentos verdes neón.
  - Frutas aleatorias del atlas `references/source-assets/snake-assets/` (fila pixel art de `fruits.png`); todas valen +10 puntos.
  - Colisión con paredes o con el propio cuerpo → game over (sin wrap).
  - Una sola vida por partida.
  - Velocidad base fija al inicio; aumenta cada 5 frutas comidas.
  - Controles: flechas + WASD; bloqueo de giro 180°.
- API del engine (`SnakeEngine`):
  - `mount(canvas)`, `unmount()`, `pause()`, `resume()`, `reset()`.
  - `onStateChange(cb)` emite `{ score, length, speed, phase: "playing" | "gameover" }`.
- Componentes `snake-canvas.tsx` y `snake-player.tsx`.
- Rutas estáticas `app/games/snake/` y `app/play/snake/`.
- Registro en `STATIC_GAME_ROUTES`.
- Cover CSS `.cover-snake-game` en `app/arcade-vault.css` (distinto de `.cover-snake` de `serpentina`).
- Assets copiados a `public/games/snake/` (`fruits.png` + atlas de coordenadas en TypeScript).
- Seed en `public.games` (`id: "snake"`) aplicado en Supabase vía plugin/MCP + `snake` en `SUPABASE_GAMES`.
- Guardar puntuación vía `saveScore` al pulsar **GUARDAR PUNTUACIÓN**.

**Fuera de alcance (para specs futuros):**

- Modificar o implementar el placeholder `serpentina`.
- Audio / efectos de sonido.
- Controles táctiles u on-screen para móvil.
- Puntos variables por tipo de fruta.
- Wrap toroidal (atravesar paredes).
- Sistema de vidas múltiples.
- Supabase Auth, realtime, tests automatizados.
- Registry genérico de engines.

## Modelo de datos

### Catálogo — `app/data/games.ts`

```ts
{
  id: "snake",
  title: "SNAKE",
  short: "Come frutas, crece y no te muerdas la cola.",
  long: "Una serpiente de neón recorre la grilla buscando frutas. Cada bocado la alarga y la acelera. Choca con una pared o contigo misma y la partida termina.",
  cat: "ARCADE",
  cover: "cover-snake-game",
  color: "green",
  best: 0,
  plays: "0",
}
```

### API del engine — `lib/games/snake/types.ts`

```ts
export type SnakePhase = "playing" | "gameover";

export interface SnakeGameState {
  score: number;
  length: number;   // segmentos de la serpiente (incluye cabeza)
  speed: number;    // ms entre ticks de movimiento (menor = más rápido)
  phase: SnakePhase;
}

export interface SnakeEngine {
  mount(canvas: HTMLCanvasElement): void;
  unmount(): void;
  pause(): void;
  resume(): void;
  reset(): void;
  onStateChange(cb: (state: SnakeGameState) => void): () => void;
}
```

### Estado interno del engine (no expuesto a React)

Constantes (`lib/games/snake/constants.ts`):

| Constante | Valor | Uso |
|-----------|-------|-----|
| `COLS` | `30` | Columnas de la grilla |
| `ROWS` | `30` | Filas de la grilla |
| `CELL` | `20` | Tamaño en px de cada celda |
| `W` / `H` | `600` | Dimensiones del canvas |
| `POINTS_PER_FRUIT` | `10` | Puntos por fruta comida |
| `SPEED_INITIAL` | `150` | ms entre ticks al inicio |
| `SPEED_MIN` | `60` | Límite inferior de intervalo (tope de velocidad) |
| `SPEED_STEP` | `10` | ms que se restan al acelerar |
| `SPEED_EVERY` | `5` | Frutas comidas para subir velocidad |

Estado en closure del engine:

- `snake: { x, y }[]` — cola de segmentos (índice 0 = cabeza).
- `direction: { x, y }` — dirección actual.
- `nextDirection` — dirección pendiente (evita doble input por tick).
- `fruit: { x, y, type }` — posición y clave del atlas (`apple`, `cherry`, …).
- `tickTimer` — acumulador para movimiento discreto por grid.
- `fruitsEaten` — contador para escalado de velocidad.
- `phase` — `"playing"` | `"gameover"`.

Atlas de sprites (`lib/games/snake/sprites.ts`):

- Port de coordenadas desde `references/source-assets/snake-assets/sprites.js`.
- Fuente: `/games/snake/fruits.png`.
- 22 tipos de fruta (fila pixel art, y≈136).

### Notificación a React

El engine llama `onStateChange` al comer fruta, acelerar, morir o reiniciar. `SnakePlayer` refleja `score`, `length`, `speed` en el HUD del shell. Con `phase === "gameover"`, el overlay CRT se muestra fuera del canvas.

### Supabase — seed

```sql
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
```

Aplicar en Supabase vía plugin/MCP (no solo dejar el SQL en una migración local).

### Ramificación híbrida — `lib/data/leaderboard.ts`

```ts
const SUPABASE_GAMES = new Set(["asteroids", "tetris", "arkanoid", "snake"]);
```

Sin nueva Server Action ni archivos de query por juego.

## Patrón de integración

### Checklist (orden de trabajo)

1. **Catálogo** — Entrada `snake` en `app/data/games.ts` (sin tocar `serpentina`).
2. **Cover CSS** — `.cover-snake-game` en `app/arcade-vault.css`.
3. **Assets** — Copiar `fruits.png` a `public/games/snake/`; atlas en `lib/games/snake/sprites.ts`.
4. **Engine** — `lib/games/snake/` (`types.ts`, `constants.ts`, `sprites.ts`, `utils.ts`, `engine.ts`).
5. **Canvas** — `components/games/snake-canvas.tsx`.
6. **Player** — `components/games/snake-player.tsx` con `saveScore` + `usePlayerName()`.
7. **Rutas estáticas** — `app/games/snake/page.tsx`, `app/play/snake/page.tsx`.
8. **Registro** — `"snake"` en `STATIC_GAME_ROUTES`.
9. **Supabase** — migración SQL seed + aplicar en Supabase vía plugin/MCP + `snake` en `SUPABASE_GAMES`.
10. **Smoke test** — verificación manual (ver criterios de aceptación).

**No hacer:** `if (game.id === "snake")` en `GamePlayer`.

### Diagrama de capas

```
app/games/snake/page.tsx          app/play/snake/page.tsx
         │                                    │
         ▼                                    ▼
  GameDetailView                      SnakePlayer
                                              │
                         ┌────────────────────┼────────────────────┐
                         ▼                    ▼                    ▼
                 GamePlayerShell      SnakeCanvas      engineRef → reset()
                   (HUD + CRT)              │
                         │                  ▼
                         │         lib/games/snake/engine.ts
                         ▼
              overlays: PAUSA / FIN DEL JUEGO (dentro del CRT)
```

### Estructura de archivos

```
app/
  data/static-game-routes.ts
  games/snake/page.tsx
  play/snake/page.tsx

components/
  games/snake-canvas.tsx
  games/snake-player.tsx

lib/games/snake/
  types.ts
  constants.ts
  sprites.ts
  utils.ts
  engine.ts

public/games/snake/
  fruits.png

app/arcade-vault.css            # .cover-snake-game

supabase/migrations/…           # seed public.games (id: snake)
```

Origen de assets: `references/source-assets/snake-assets/` (sin `started-games`).

### Extensión del shell (si aplica)

`GamePlayerShell` puede necesitar props opcionales para Snake:

- `length?: number` — stat "Longitud" en el HUD externo.
- `hideLives?: boolean` — sin stat de Vidas (una sola vida, como Tetris).

Si `length` no encaja en el shell actual, mostrar longitud solo en el canvas del engine; decidir en implementación con el mínimo cambio posible.

## Plan de implementación

1. **Catálogo y cover** — Entrada `snake` en `app/data/games.ts`; clase `.cover-snake-game` en `app/arcade-vault.css`. Verificar que `/games` muestra SNAKE sin afectar `serpentina`.

2. **Assets** — Copiar `references/source-assets/snake-assets/fruits.png` → `public/games/snake/fruits.png`. Crear `lib/games/snake/sprites.ts` con coordenadas portadas de `sprites.js`.

3. **Fundamentos del engine** — `types.ts`, `constants.ts`, `utils.ts` (colisión pared/cuerpo, spawn de fruta aleatoria, bloqueo 180°).

4. **Engine core** — `engine.ts`: loop con ticks discretos por grilla, movimiento de serpiente, comer fruta (+10 pts, +1 segmento), aceleración cada 5 frutas, `onStateChange`, `pause`/`resume`/`reset`/`unmount`.

5. **Render** — Dibujo en canvas: grilla sutil, cuerpo verde neón, cabeza diferenciada (con orientación), frutas desde atlas. Sin texto "GAME OVER" en canvas.

6. **Componente canvas** — `snake-canvas.tsx`: mount/unmount, `engineRef`, `onStateChangeRef` (patrón Asteroids).

7. **Player + rutas** — `snake-player.tsx` + `GamePlayerShell`; rutas `app/games/snake/page.tsx` y `app/play/snake/page.tsx`; `"snake"` en `STATIC_GAME_ROUTES`. Extender shell con `length` + `hideLives` si hace falta.

8. **Supabase** — Crear migración SQL con seed de `snake` en `public.games`. **Aplicar en Supabase vía plugin/MCP** (verificar fila insertada). Añadir `"snake"` a `SUPABASE_GAMES` en `lib/data/leaderboard.ts`.

9. **Smoke test manual** — Jugar partida completa, game over, guardar puntuación, verificar ranking en detalle y hall-of-fame. `npm run build` sin errores.

## Criterios de aceptación

### Catálogo
- [ ] `snake` aparece en `/games` con título SNAKE, categoría ARCADE y cover `cover-snake-game`
- [ ] `serpentina` sigue visible sin cambios en catálogo ni cover
- [ ] `/games/snake` muestra detalle con CTA **JUGAR** → `/play/snake`

### Juego jugable
- [ ] `/play/snake` carga canvas 600×600 dentro del marco CRT
- [ ] Grilla 30×30 visible; serpiente con cabeza diferenciada y cuerpo verde neón
- [ ] Frutas aleatorias del atlas pixel art; todas valen +10 puntos
- [ ] Controles: `←` `→` `↑` `↓` y `W` `A` `S` `D`; no permite giro 180° instantáneo
- [ ] Chocar con pared → game over
- [ ] Chocar con el propio cuerpo → game over
- [ ] Cada fruta comida alarga la serpiente en 1 segmento
- [ ] Velocidad aumenta cada 5 frutas comidas (hasta tope `SPEED_MIN`)
- [ ] Una sola vida: sin sistema de vidas ni respawn

### HUD y shell
- [ ] HUD externo muestra Puntuación y Longitud (sin stat de Vidas)
- [ ] PAUSA detiene el loop; REANUDAR lo reanida
- [ ] Game over muestra overlay dentro del CRT (no en canvas del engine)
- [ ] **JUGAR DE NUEVO** llama a `engine.reset()`
- [ ] SALIR navega a `/games/snake`

### Leaderboard
- [ ] `/games/snake` muestra ranking desde Supabase
- [ ] `/hall-of-fame` tab **SNAKE** muestra ranking real
- [ ] **GUARDAR PUNTUACIÓN** inserta en `scores` con `user_id = null`
- [ ] Nombre recordado en `localStorage` (`av_player_name`)
- [ ] Fila **TU MEJOR MARCA** si hay nombre guardado y scores en BD
- [ ] Fila `snake` existe en `public.games` en Supabase (verificado tras aplicar seed vía plugin/MCP)

### Regresión
- [ ] `serpentina` sigue como placeholder sin ruta de juego
- [ ] Asteroids, Tetris y Arkanoid siguen funcionando con normalidad

### Técnico
- [ ] Sin errores de consola relevantes
- [ ] Sin errores TypeScript/ESLint en archivos del juego
- [ ] Engine se desmonta limpiamente al salir de `/play/snake`
- [ ] `npm run build` sin errores

## Decisiones

### Heredadas de SPEC 05 / SPEC 06
- **Sí:** Ruta estática + `SnakePlayer` + `SnakeCanvas` (sin branch en `GamePlayer`).
- **Sí:** `GamePlayerShell` para HUD, pausa y game over en CRT.
- **Sí:** `saveScore` genérico + `SUPABASE_GAMES`.
- **Sí:** Seed en `public.games` aplicado en Supabase vía plugin/MCP, no solo archivo SQL local.
- **Sí:** RLS deshabilitado en `scores` (patrón del curso).
- **No:** Registry genérico de engines.
- **No:** Inserción directa desde cliente Supabase.

### Específicas de Snake
- **Sí:** `id: "snake"` como juego nuevo, aislado del placeholder `serpentina`.
- **Sí:** Engine desde cero (sin referencia en `started-games`).
- **Sí:** Canvas 600×600, grilla 30×30, celda 20 px.
- **Sí:** Colisión con paredes = game over (sin wrap toroidal).
- **Sí:** Una sola vida por partida (sin stat de Vidas en HUD).
- **Sí:** Frutas aleatorias del atlas; puntos fijos +10 por fruta.
- **Sí:** Velocidad aumenta cada 5 frutas (`SPEED_STEP` ms, tope `SPEED_MIN`).
- **Sí:** Controles flechas + WASD con bloqueo de giro 180°.
- **Sí:** Cabeza diferenciada del cuerpo; cuerpo verde neón; frutas desde sprite atlas pixel art.
- **Sí:** Cover CSS `.cover-snake-game` (distinto de `.cover-snake` de `serpentina`).
- **No:** Audio / efectos de sonido.
- **No:** Controles táctiles u on-screen.
- **No:** Puntos variables por tipo de fruta.
- **No:** Modificar el placeholder `serpentina`.

## Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Input buffer permite giro 180° en un solo tick si se pulsan dos teclas rápido | Usar `nextDirection` con validación contra dirección actual antes de cada tick |
| `setInterval` o rAF sigue corriendo tras desmontar | `unmount()` cancela timer/rAF y elimina listeners de teclado |
| Fruta spawnea sobre la serpiente | `spawnFruit()` reintenta posiciones libres; si la grilla está llena, declarar victoria o game over |
| Atlas de sprites no carga a tiempo | Preload de `fruits.png` en `mount()`; no iniciar ticks hasta `onload` |
| Confusión visual entre `snake` y `serpentina` en catálogo | IDs, covers y rutas distintas; `serpentina` sin ruta estática |
| Seed SQL no aplicado en Supabase remoto | Paso explícito en implementación: aplicar vía plugin/MCP y verificar fila en `public.games` |

## Lo que NO está en este spec

- Implementar o modificar el placeholder `serpentina`.
- Audio / efectos de sonido.
- Controles táctiles u on-screen para móvil.
- Puntos variables por tipo de fruta.
- Wrap toroidal (atravesar paredes).
- Sistema de vidas múltiples.
- Supabase Auth, realtime, tests automatizados.
- Registry genérico de engines.

Cada uno de estos, si llega, va en su propio spec.
