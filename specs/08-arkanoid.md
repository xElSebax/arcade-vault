# SPEC 08 — Arkanoid en Arcade Vault

> **Estado:** Implementado
> **Depende de:** SPEC 05 — Juego Asteroids, SPEC 06 — Catálogo y leaderboard en Supabase, SPEC 07 — Tetris (patrón `isSupabaseGame`)
> **Fecha:** 2026-08-10
> **Objetivo:** Integrar el juego Arkanoid en `/play/arkanoid` portando `references/started-games/04-arkanoid` a un engine TypeScript modular con spritesheet y 5 niveles, HUD en el shell externo, overlay CRT de fin de partida (derrota o victoria) con guardado de puntuación en Supabase bajo `id: "arkanoid"`.

## Alcance

**Dentro:**

- Nueva entrada en `app/data/games.ts` con `id: "arkanoid"`, título **ARKANOID**, categoría `ARCADE`, cover `cover-arkanoid`, color `magenta` (distinto de `bloque-buster`). Textos `short`/`long` propios de Arkanoid clásico. El placeholder `bloque-buster` queda intacto.
- Port de `references/started-games/04-arkanoid/` a módulo TypeScript en `lib/games/arkanoid/`:
  - Canvas 800×600 (mismo tamaño que Asteroids).
  - Paleta (mouse + `←` `→`), pelota con física AABB, grilla 10×6 de bloques (64×24 px).
  - 5 niveles desde `levels.js` con multiplicadores de velocidad (×1.0 … ×1.46).
  - 3 vidas; +10 puntos por bloque destruido; score acumulado entre niveles.
  - Animación de explosión al romper bloque (4 frames del spritesheet).
  - Spritesheet portado a `public/games/arkanoid/` + helpers de dibujo en TypeScript.
  - Fases: `playing` → `gameover` (sin vidas) o `win` (completar nivel 5).
- API del engine (`ArkanoidEngine`):
  - `mount(canvas)`, `unmount()`, `pause()`, `resume()`, `reset()`.
  - `onStateChange(cb)` emite `{ score, lives, level, phase: "playing" | "gameover" | "win" }`.
- HUD externo vía `GamePlayerShell` (Puntuación, Vidas, Nivel). Sin HUD dibujado en el canvas del engine.
- Extensión mínima de `GamePlayerShell`: prop opcional `won?: boolean` para overlay CRT de victoria (título **¡VICTORIA!** en lugar de **FIN DEL JUEGO**); mismo flujo de **GUARDAR PUNTUACIÓN** y **JUGAR DE NUEVO** que en derrota.
- Componentes `arkanoid-canvas.tsx` y `arkanoid-player.tsx`.
- Rutas estáticas `app/games/arkanoid/` y `app/play/arkanoid/`.
- Registro en `STATIC_GAME_ROUTES`.
- Cover CSS `.cover-arkanoid` en `app/arcade-vault.css` (paleta neón de bloques/paleta, distinta de `.cover-bricks`).
- Seed en `public.games` (`id: "arkanoid"`) + `arkanoid` en `SUPABASE_GAMES` (`lib/data/supabase-games.ts`).
- Guardar puntuación vía `saveScore` al pulsar **GUARDAR PUNTUACIÓN** (tanto en `gameover` como en `win`).
- Pausa solo por botones del shell (PAUSA/REANUDAR). Sin tecla `P`/`Escape` ni selector de nivel en pausa.

**Fuera de alcance (para specs futuros):**

- Modificar o implementar el placeholder `bloque-buster`.
- Audio / efectos de sonido (`ball-bounce.mp3`, `break-sound.mp3`).
- Selector de nivel en overlay de pausa (botones 1–5 de la referencia).
- Controles táctiles u on-screen para móvil.
- Tecla `P` / `Escape` para pausa.
- Supabase Auth, realtime, tests automatizados.
- Registry genérico de engines.
- Refactor global de `GamePlayerShell` más allá de la prop `won`.

## Modelo de datos

### Catálogo — `app/data/games.ts`

```ts
{
  id: "arkanoid",
  title: "ARKANOID",
  short: "Rebota la pelota y destruye todos los bloques.",
  long: "Controla la paleta, devuelve la pelota y pulveriza cinco layouts de bloques de neón. Cada nivel acelera la pelota. Tres vidas. ¿Llegas al final?",
  cat: "ARCADE",
  cover: "cover-arkanoid",
  color: "magenta",
  best: 0,
  plays: "0",
}
```

### API del engine — `lib/games/arkanoid/types.ts`

```ts
export type ArkanoidPhase = "playing" | "gameover" | "win";

export interface ArkanoidGameState {
  score: number;
  lives: number;
  level: number; // 1–5
  phase: ArkanoidPhase;
}

export interface ArkanoidEngine {
  mount(canvas: HTMLCanvasElement): void;
  unmount(): void;
  pause(): void;
  resume(): void;
  reset(): void;
  onStateChange(cb: (state: ArkanoidGameState) => void): () => void;
}
```

### Estado interno del engine (no expuesto a React)

Constantes (`lib/games/arkanoid/constants.ts`):

| Constante | Valor | Uso |
|-----------|-------|-----|
| `W` | `800` | Ancho del canvas |
| `H` | `600` | Alto del canvas |
| `PADDLE_SPEED` | `400` | px/s de la paleta con teclado |
| `BLOCK_COLS` / `BLOCK_ROWS` | `10` / `6` | Grilla de bloques |
| `BLOCK_W` / `BLOCK_H` | `64` / `24` | Tamaño de celda |
| `BLOCKS_ORIGIN_X` / `Y` | centrado / `80` | Origen de la grilla |
| `BASE_BALL_VX` / `VY` | `200` / `-300` | Velocidad base de la pelota |
| `BLOCK_SCORE` | `10` | Puntos por bloque |
| `STARTING_LIVES` | `3` | Vidas iniciales |
| `EXPLOSION_DURATION` | `150` | ms por animación de explosión |
| `MAX_DT` | `0.05` | Cap de delta time (patrón Asteroids) |

Entidades en `lib/games/arkanoid/entities/`:

- `paddle.ts` — `{ x, y, w: 81, h: 14 }` (sprite escalado desde 162×14 de la referencia)
- `ball.ts` — `{ x, y, w: 16, h: 16, vx, vy }`
- `block.ts` — `{ x, y, w, h, color, alive }` — colores: `gray`, `red`, `yellow`, `cyan`, `magenta`, `hotpink`, `green`
- `explosion.ts` — `{ x, y, w, h, color, elapsed }`

Módulos de soporte:

- `levels.ts` — port de `levels.js`: array `LEVELS` con `{ speed, blocks: { col, row, color }[] }` (5 niveles).
- `spritesheet.ts` — carga de `spritesheet-breakout.png`, `drawSprite()`, `drawFrame()`, mapas `SPRITES` y `EXPLOSION_FRAMES`.

Estado en closure del engine:

- `paddle`, `ball`, `blocks[]`, `explosions[]`
- `score`, `lives`, `level` (1-indexed), `phase`
- `keys` (`ArrowLeft`, `ArrowRight`), posición mouse para paleta
- `animId`, `lastTime`, `paused`, `spritesReady`

### Notificación a React

El engine llama `onStateChange` cuando cambian `score`, `lives`, `level` o `phase`. `ArkanoidPlayer` refleja el estado en `GamePlayerShell`. Cuando `phase === "gameover"` o `phase === "win"`, el shell muestra overlay CRT (`over = true`, `won = phase === "win"`). No se dibuja texto de fin de partida en el canvas del engine.

### Supabase — seed

```sql
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
```

### Ramificación híbrida — `lib/data/supabase-games.ts`

```ts
export const SUPABASE_GAMES = new Set(["asteroids", "tetris", "arkanoid"]);
```

Sin nueva Server Action ni archivos de query por juego.

### Assets estáticos — `public/games/arkanoid/`

```
public/games/arkanoid/
  spritesheet-breakout.png   # copia desde references/started-games/04-arkanoid/assets/
```

## Patrón de integración

### Checklist (orden de trabajo)

1. **Catálogo** — Entrada `arkanoid` en `app/data/games.ts` (sin tocar `bloque-buster`).
2. **Assets** — Copiar `spritesheet-breakout.png` a `public/games/arkanoid/`.
3. **Cover CSS** — `.cover-arkanoid` en `app/arcade-vault.css`.
4. **Engine** — `lib/games/arkanoid/` (`types.ts`, `constants.ts`, `utils.ts`, `spritesheet.ts`, `levels.ts`, `entities/`, `engine.ts`).
5. **Extensión del shell** — Prop opcional `won?: boolean` en `GamePlayerShell` (título **¡VICTORIA!** vs **FIN DEL JUEGO**).
6. **Canvas** — `components/games/arkanoid-canvas.tsx` (mount/unmount, `engineRef`, `onStateChangeRef`).
7. **Player** — `components/games/arkanoid-player.tsx` con `saveScore`, `usePlayerName`, `won` según `phase`.
8. **Rutas estáticas** — `app/games/arkanoid/page.tsx`, `app/play/arkanoid/page.tsx`.
9. **Registro** — `"arkanoid"` en `STATIC_GAME_ROUTES`.
10. **Supabase** — migración seed + `arkanoid` en `SUPABASE_GAMES`.
11. **Smoke test** — verificación manual (criterios de aceptación).

**No hacer:** `if (game.id === "arkanoid")` en `GamePlayer`.

### Diagrama de capas

```
app/games/arkanoid/page.tsx          app/play/arkanoid/page.tsx
         │                                    │
         ▼                                    ▼
  GameDetailView                      ArkanoidPlayer
                                              │
                         ┌────────────────────┼────────────────────┐
                         ▼                    ▼                    ▼
                 GamePlayerShell      ArkanoidCanvas      engineRef → reset()
              (score·vidas·nivel)           │
              won → overlay victoria         ▼
                         │         lib/games/arkanoid/engine.ts
                         │              │
                         │         spritesheet + entities
                         ▼
              overlays: PAUSA / FIN DEL JUEGO / ¡VICTORIA! (dentro del CRT)
```

### Estructura de archivos

```
app/
  data/
    games.ts                      # + entrada arkanoid
    static-game-routes.ts         # + "arkanoid"
  games/arkanoid/page.tsx
  play/arkanoid/page.tsx

components/
  game-player-shell.tsx           # + prop won?: boolean
  games/
    arkanoid-canvas.tsx
    arkanoid-player.tsx

lib/games/arkanoid/
  types.ts
  constants.ts
  utils.ts                        # collideAABB, clamp, etc.
  spritesheet.ts                  # loadSpritesheet, drawSprite, drawFrame
  levels.ts                       # LEVELS (port de levels.js)
  entities/
    paddle.ts
    ball.ts
    block.ts
    explosion.ts
  engine.ts                       # loop rAF, input, colisiones, onStateChange

public/games/arkanoid/
  spritesheet-breakout.png

app/arcade-vault.css              # .cover-arkanoid

supabase/migrations/…             # seed public.games (arkanoid)
lib/data/supabase-games.ts        # + "arkanoid"
```

**Fuente del port:** `references/started-games/04-arkanoid/game.js` (~269 líneas), `levels.js`, `assets/spritesheet.js`.

## Plan de implementación

1. **Catálogo, assets y cover** — Añadir entrada `arkanoid` en `app/data/games.ts`. Copiar `spritesheet-breakout.png` a `public/games/arkanoid/`. Crear `.cover-arkanoid` en `app/arcade-vault.css`. Verificar que aparece en `/games` con tarjeta distinta de `bloque-buster`.

2. **Fundamentos del engine** — Crear `lib/games/arkanoid/types.ts`, `constants.ts`, `utils.ts` y `spritesheet.ts` con constantes, tipos, carga del spritesheet y helpers `drawSprite`/`drawFrame` portados de la referencia. Sin loop aún.

3. **Niveles y entidades** — Crear `levels.ts` (port de `levels.js`) y entidades en `entities/` (`paddle`, `ball`, `block`, `explosion`). Funciones puras de colisión AABB y spawn de bloques por nivel.

4. **Engine core** — Crear `engine.ts` con loop `requestAnimationFrame`, input mouse + teclado, física de pelota, colisiones paleta/paredes/bloques, explosiones, progresión de niveles 1→5, `onStateChange`, y métodos `mount`/`unmount`/`pause`/`resume`/`reset`. Sin overlays de texto en canvas.

5. **Extensión del shell** — Añadir prop opcional `won?: boolean` a `GamePlayerShell`. Cuando `won === true`, overlay CRT muestra **¡VICTORIA!** en lugar de **FIN DEL JUEGO**; resto del flujo (guardar, reiniciar, salir) idéntico. Asteroids y Tetris sin cambios de comportamiento.

6. **Componente canvas** — Crear `components/games/arkanoid-canvas.tsx`: canvas 800×600, `useEffect` para mount/unmount, props `paused`, `onStateChange`, `engineRef`. Callback estable vía `onStateChangeRef` (patrón React 19 de Asteroids).

7. **Player y rutas** — Crear `arkanoid-player.tsx` (estado React, `saveScore`, `usePlayerName`, `GamePlayerShell` con `won` según `phase === "win"`). Crear `app/games/arkanoid/page.tsx` y `app/play/arkanoid/page.tsx`. Registrar `"arkanoid"` en `STATIC_GAME_ROUTES`. Verificar flujo: biblioteca → detalle → play → pausa → game over / victoria → reinicio → salir.

8. **Supabase** — Migración SQL con seed de `arkanoid` en `public.games`. Añadir `"arkanoid"` a `SUPABASE_GAMES` en `lib/data/supabase-games.ts`. Verificar ranking en `/games/arkanoid` y tab **ARKANOID** en `/hall-of-fame`. Probar **GUARDAR PUNTUACIÓN** en derrota y en victoria.

9. **Smoke test manual** — Recorrer criterios de aceptación. Confirmar regresión en Asteroids, Tetris y que `bloque-buster` sigue como placeholder. `npm run build` sin errores.

## Criterios de aceptación

### Catálogo
- [ ] `arkanoid` aparece en `/games` con título **ARKANOID**, categoría `ARCADE` y cover `.cover-arkanoid` (distinto de `bloque-buster`)
- [ ] `/games/arkanoid` muestra detalle con CTA **JUGAR** → `/play/arkanoid`
- [ ] El placeholder `bloque-buster` sigue visible y sin cambios en `/games` y `/play/bloque-buster`

### Juego jugable
- [ ] `/play/arkanoid` carga canvas 800×600 con sprites del spritesheet dentro del marco CRT
- [ ] Controles: mouse mueve la paleta · `←` `→` mueven la paleta
- [ ] 5 niveles con patrones distintos y velocidad creciente (×1.0 … ×1.46)
- [ ] Colisión paleta/paredes/bloques con rebote correcto de la pelota
- [ ] +10 puntos por bloque destruido; animación de explosión (4 frames) al romper bloque
- [ ] 3 vidas; al perder la pelota se descuenta una vida y se reposiciona; sin vidas → `gameover`
- [ ] Al destruir todos los bloques del nivel N, avanza a N+1; al completar nivel 5 → `win`
- [ ] Sin texto "GAME OVER" ni "VICTORIA" dibujado en el canvas del engine

### HUD y shell
- [ ] Shell externo muestra Puntuación, Vidas y Nivel sincronizados vía `onStateChange`
- [ ] PAUSA detiene el loop; REANUDAR lo reanuda
- [ ] Derrota (`gameover`) muestra overlay CRT **FIN DEL JUEGO** con puntuación final
- [ ] Victoria (`win`) muestra overlay CRT **¡VICTORIA!** con puntuación final
- [ ] En ambos finales: **GUARDAR PUNTUACIÓN**, **JUGAR DE NUEVO** (`engine.reset()`), SALIR → `/games/arkanoid`
- [ ] Tecla `P` / `Escape` no pausa el juego (pausa solo por botones del shell)
- [ ] Sin selector de nivel en pausa

### Leaderboard
- [ ] `/games/arkanoid` muestra ranking desde Supabase
- [ ] `/hall-of-fame` tab **ARKANOID** muestra ranking real (vía `isSupabaseGame`)
- [ ] **GUARDAR PUNTUACIÓN** inserta en `scores` con `game_id = "arkanoid"` y `user_id = null` (tanto en derrota como en victoria)
- [ ] Nombre recordado en `localStorage` (`av_player_name`)
- [ ] Fila **TU MEJOR MARCA** si hay nombre guardado y scores en BD

### Regresión
- [ ] Asteroids sigue funcionando con normalidad (`/play/asteroids`, leaderboard, guardado)
- [ ] Tetris sigue funcionando con normalidad (`/play/tetris`, leaderboard, guardado)
- [ ] Placeholder `bloque-buster` sin cambios de comportamiento
- [ ] Otro juego placeholder (ej. `/play/caida`) sin regresiones

### Técnico
- [ ] Sin errores de consola relevantes en `/play/arkanoid`
- [ ] Sin errores TypeScript/ESLint en archivos del juego
- [ ] Engine se desmonta limpiamente al salir de `/play/arkanoid` (rAF cancelado, listeners eliminados)
- [ ] `npm run build` sin errores

## Decisiones

### Heredadas de SPEC 05 / SPEC 06 / SPEC 07
- **Sí:** Ruta estática + `ArkanoidPlayer` + `ArkanoidCanvas` (sin branch en `GamePlayer`).
- **Sí:** `GamePlayerShell` para HUD externo, pausa y fin de partida en CRT.
- **Sí:** `saveScore` genérico + `arkanoid` en `SUPABASE_GAMES` (`lib/data/supabase-games.ts`).
- **Sí:** `isSupabaseGame()` en hall-of-fame (patrón SPEC 07, no hardcode por juego).
- **Sí:** RLS deshabilitado en `scores` (patrón del curso).
- **Sí:** `onStateChange` + `usePlayerName()` + `onStateChangeRef` (patrón React 19 de Asteroids).
- **No:** Registry genérico de engines.
- **No:** Inserción directa desde cliente Supabase.
- **No:** Guardado automático al fin de partida (solo botón **GUARDAR PUNTUACIÓN**).

### Específicas de este juego
- **Sí:** Juego nuevo `id: "arkanoid"`, independiente del placeholder `bloque-buster` (no reutilizar slug ni cover).
- **Sí:** Port fiel de `references/started-games/04-arkanoid/` con 5 niveles, explosiones y spritesheet.
- **Sí:** Sin audio (MP3 de la referencia quedan fuera de alcance).
- **Sí:** Mouse + teclado para mover la paleta (como la referencia).
- **Sí:** Fase `win` al completar nivel 5; mismo flujo de overlay CRT y guardado que `gameover`.
- **Sí:** Extensión mínima de `GamePlayerShell` con `won?: boolean` para título **¡VICTORIA!**.
- **Sí:** HUD en shell externo; sin score/vidas/nivel dibujados en canvas del engine.
- **Sí:** Pausa solo por botones del shell (no `P`/`Escape` de la referencia).
- **Sí:** Sin selector de nivel en pausa (deferido a spec futuro).
- **Sí:** Cover CSS nueva `.cover-arkanoid` (magenta/neón, distinta de `.cover-bricks`).
- **Sí:** Assets en `public/games/arkanoid/spritesheet-breakout.png`.
- **No:** Modificar entrada ni comportamiento de `bloque-buster`.
- **No:** Controles táctiles.

## Riesgos

| Riesgo | Mitigación |
|--------|------------|
| `requestAnimationFrame` sigue corriendo tras desmontar | `unmount()` cancela rAF y elimina listeners de teclado/mouse |
| Spritesheet no cargado al primer frame | `engine.mount()` espera `loadSpritesheet()` antes de iniciar loop; estado `spritesReady` |
| Colisión pelota-bloque ambigua (esquinas) | Port fiel a `collideAABB` de la referencia; un bloque por frame |
| Extensión `won` en `GamePlayerShell` rompe otros juegos | Prop opcional; Asteroids/Tetris no la pasan, comportamiento idéntico |
| Confusión visual entre `arkanoid` y `bloque-buster` en catálogo | Covers distintas (`.cover-arkanoid` vs `.cover-bricks`), títulos distintos, colores distintos (`magenta` vs `cyan`) |
| Mouse + teclado simultáneos compiten por posición de paleta | Último input gana; mouse tiene prioridad si se mueve (patrón de la referencia) |
| Victoria no dispara guardado si el jugador no pulsa el botón | Comportamiento intencional (igual que Asteroids/Tetris); solo guardado manual |
| Hall-of-fame no muestra datos reales | Añadir `arkanoid` a `SUPABASE_GAMES`; tab usa `isSupabaseGame()` (lección SPEC 07) |

## Lo que NO está en este spec

- Implementar o modificar el placeholder `bloque-buster`.
- Audio / efectos de sonido.
- Selector de nivel en overlay de pausa (botones 1–5).
- Controles táctiles u on-screen para móvil.
- Tecla `P` / `Escape` para pausa.
- Supabase Auth, realtime, tests automatizados.
- Registry genérico de engines.
- Power-ups o bloques especiales (solo bloques estándar de la referencia).
- Migrar el catálogo completo de `games.ts` a Supabase.

Cada uno de estos, si llega, va en su propio spec.
