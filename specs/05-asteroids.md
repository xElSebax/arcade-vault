# SPEC 05 — Juego Asteroids en Arcade Vault

> **Estado:** Implementado
> **Depende de:** SPEC 01 — MVP visual de Arcade Vault
> **Fecha:** 2026-08-03
> **Objetivo:** Integrar el juego Asteroids (canvas 800×600) en `/play/asteroids` portando la referencia a un engine TypeScript modular que mantiene su HUD y controles dentro del canvas, notifica cambios de estado a React, y usa el shell del reproductor (HUD externo, pausa, fin de partida dentro del marco CRT).

## Alcance

**Dentro:**

- Nuevo juego en `app/data/games.ts` con `id: "asteroids"`, título **ASTEROIDS**, categoría `SHOOTER`, cover CSS `cover-asteroids` y metadatos propios (sin tocar `rocas`).
- Port de `references/started-games/02-asteroids/game.js` a módulo TypeScript en `lib/games/asteroids/`:
  - Clases: `Bullet`, `Asteroid`, `Ship`, `Particle`, `PowerUp`.
  - Loop con `requestAnimationFrame`, física, colisiones, niveles, 3 vidas, power-up de disparo triple.
  - Canvas fijo 800×600 con envolvimiento toroidal.
  - HUD interno del juego dentro del canvas (score, nivel, vidas, indicador 3x) — se mantiene.
- API del engine (`AsteroidsEngine`):
  - `mount(canvas)`, `unmount()`, `pause()`, `resume()`, `reset()`.
  - `onStateChange(cb)` emite `{ score, lives, level, phase: "playing" | "dead" | "gameover" }`.
- Componente cliente `components/games/asteroids-canvas.tsx` que monta el engine en un `<canvas>` dentro del marco CRT.
- **Integración por ruta dedicada** (no branch en `GamePlayer`):
  - `app/play/asteroids/page.tsx` → `AsteroidsPlayer`.
  - `app/games/asteroids/page.tsx` → `GameDetailView`.
- Shell compartido `GamePlayerShell`: HUD externo, marco CRT, overlays de pausa y fin de partida.
- Player dedicado `AsteroidsPlayer`: estado React, sincronización con engine, arena = `AsteroidsCanvas`.
- Pausa controlada por el contenedor: PAUSA detiene el loop; REANUDAR lo reanida.
- Game over: al `phase === "gameover"` (o botón FIN), overlay de fin de partida **dentro del CRT** (sin overlay "GAME OVER" en el canvas del engine).
- Reinicio desde "JUGAR DE NUEVO" llama a `engine.reset()`.
- Controles solo teclado: `←` `→` rotar, `↑` propulsar, `Espacio` disparar.
- Estilos del cover `cover-asteroids` en `app/arcade-vault.css`.
- Rutas `/games/asteroids` y `/play/asteroids` funcionales desde detalle y biblioteca.

**Fuera de alcance (para specs futuros):**

- Implementar los otros 7 juegos reales o reemplazar `rocas`.
- Registry genérico de engines (`Record<string, GameEngine>`).
- Controles táctiles u on-screen para móvil.
- Audio / efectos de sonido.
- OVNIs (mencionados en la descripción de `rocas`, no en la referencia de Asteroids).
- Tests automatizados automatizados en CI.
- Refactor global que unifique todos los players en un solo componente con `if` por `game.id`.

---

## Implementación final

> **Sección de referencia.** Documenta la vía real seguida respecto al borrador aprobado. Usar como plantilla para integrar otros juegos (skill futura).

### Desviaciones respecto al borrador aprobado

| Tema | Borrador (aprobado) | Implementación final | Motivo |
|------|---------------------|----------------------|--------|
| **Integración en play** | Branch `if (game.id === "asteroids")` en `GamePlayer` | Ruta estática `app/play/asteroids/` + componente `AsteroidsPlayer` | Alineación con el curso: cada juego aislado en su propia ruta; sin mezclar lógica en un player genérico |
| **Rutas de detalle** | Solo `app/games/[id]/page.tsx` | También `app/games/asteroids/page.tsx` | Carpeta visible por juego en App Router; la ruta estática gana sobre `[id]` |
| **Shell del reproductor** | Todo en `GamePlayer` | `GamePlayerShell` (UI común) + `{Juego}Player` (lógica del juego) | Reutilizar HUD/CRT/pausa/game over sin acoplar engines entre sí |
| **Detalle compartido** | Inline en `[id]/page.tsx` | `components/game-detail-view.tsx` reutilizado por `[id]` y rutas estáticas | Evitar duplicar la UI de detalle |
| **Registro de rutas estáticas** | No contemplado | `app/data/static-game-routes.ts` con `STATIC_GAME_ROUTES` y `hasStaticGameRoute()` | Excluir juegos con ruta propia de `generateStaticParams` en `[id]` |
| **Game over UI** | Modal fullscreen `.modal-bd` | Overlay `.crt-gameover` dentro de `.crt-screen` | Coherencia visual con PAUSA (ambos dentro de la "tele"); decisión de UX post-implementación |
| **Input de la nave** | `keys` global leído en `Ship.update` | `Ship.input: { left, right, thrust }` asignado por el engine cada frame | Mantener firma `update(dt)` en entidades sin acoplar a `window` |
| **Callback en canvas** | No especificado | `onStateChangeRef` actualizado en `useEffect`, no en render | Regla React 19 (`react-hooks/refs`): no mutar refs durante render |
| **Guardar puntuación** | Toast mock sin persistencia | `AsteroidsPlayer` usa `saveScore` (server action + Supabase); placeholder en `GamePlayer` sigue mock | Evolución posterior en `main`; ver nota abajo |

### Patrón de integración (checklist para nuevos juegos)

Seguir este orden al añadir un juego real (ej. `bloque-buster`):

1. **Catálogo** — Entrada en `app/data/games.ts` (`id`, título, cover, metadatos).
2. **Cover CSS** — Clase `.cover-{slug}` en `app/arcade-vault.css`.
3. **Engine** — `lib/games/{slug}/` con `types.ts`, `constants.ts`, `utils.ts`, `engine.ts`, `entities/`.
4. **Canvas** — `components/games/{slug}-canvas.tsx`:
   - `useRef` + `<canvas>`.
   - `useEffect` → `mount` / `unmount`.
   - Props: `paused`, `onStateChange`, `engineRef`.
   - Callback estable vía ref (`useEffect` para actualizar).
5. **Player** — `components/games/{slug}-player.tsx`:
   - Estado React (score, lives, level, paused, over, …).
   - `onStateChange` del engine → estado + `setOver` si `phase === "gameover"`.
   - `engineRef.current?.reset()` en reinicio.
   - Render: `<GamePlayerShell arena={<SlugCanvas … />} />`.
6. **Rutas estáticas**:
   - `app/games/{slug}/page.tsx` → `<GameDetailView game={getGameById("slug")} />`.
   - `app/play/{slug}/page.tsx` → `<SlugPlayer game={…} />`.
7. **Registro** — Añadir `"{slug}"` a `STATIC_GAME_ROUTES` en `app/data/static-game-routes.ts`.
8. **Smoke test** — Biblioteca, detalle, play, pausa, fin de partida, reinicio, salir, regresión en otro juego placeholder.

**No hacer:** añadir `if (game.id === "…")` en `GamePlayer`. El placeholder genérico sigue en `GamePlayer` + `app/play/[id]/page.tsx` para juegos sin implementar.

### Diagrama de capas (implementación final)

```
app/games/asteroids/page.tsx          app/play/asteroids/page.tsx
         │                                      │
         ▼                                      ▼
  GameDetailView                      AsteroidsPlayer
                                              │
                         ┌────────────────────┼────────────────────┐
                         ▼                    ▼                    ▼
                 GamePlayerShell      AsteroidsCanvas      engineRef → reset()
                   (HUD + CRT)              │
                         │                  ▼
                         │         lib/games/asteroids/engine.ts
                         ▼
              overlays: PAUSA / FIN DEL JUEGO (dentro del CRT)
```

### Estructura de archivos (final)

```
app/
  data/
    static-game-routes.ts       # STATIC_GAME_ROUTES, hasStaticGameRoute()
  games/
    [id]/page.tsx               # detalle genérico (excluye rutas estáticas en generateStaticParams)
    asteroids/page.tsx          # detalle ASTEROIDS
  play/
    [id]/page.tsx               # GamePlayer placeholder
    asteroids/page.tsx          # AsteroidsPlayer

components/
  game-detail-view.tsx          # UI de detalle compartida
  game-player.tsx               # placeholder mock (juegos sin implementar)
  game-player-shell.tsx         # HUD + CRT + overlays pausa/game over
  games/
    asteroids-canvas.tsx
    asteroids-player.tsx

lib/games/asteroids/
  types.ts
  constants.ts
  utils.ts
  engine.ts
  entities/
    bullet.ts
    asteroid.ts
    ship.ts          # Ship.input para input desacoplado
    particle.ts
    power-up.ts

app/arcade-vault.css            # .cover-asteroids, .asteroids-canvas-wrap, .crt-gameover-*
```

### Nota: persistencia de puntuaciones (evolución post-spec)

El borrador original dejaba "GUARDAR PUNTUACIÓN" como mock. En `main`, `AsteroidsPlayer` integra `app/actions/save-score.ts` (Supabase) con manejo de `saveError` en `GamePlayerShell`. Los juegos placeholder siguen con toast mock. Documentar en el spec del juego si se mantiene persistencia real o se revierte a mock.

---

## Modelo de datos

### Entrada en catálogo — `app/data/games.ts`

```ts
{
  id: "asteroids",
  title: "ASTEROIDS",
  short: "Destruye asteroides y sobrevive en el vacío.",
  long: "Pilota una nave triangular en gravedad cero. Rota, propúlsate y dispara para pulverizar rocas que se fragmentan en piezas más pequeñas. Cada nivel trae más asteroides. ¿Cuánto aguantas?",
  cat: "SHOOTER",
  cover: "cover-asteroids",
  color: "yellow",
  best: 0,
  plays: "0",
}
```

### API del engine — `lib/games/asteroids/types.ts`

```ts
export type AsteroidsPhase = "playing" | "dead" | "gameover";

export interface AsteroidsGameState {
  score: number;
  lives: number;
  level: number;
  phase: AsteroidsPhase;
}

export interface AsteroidsEngine {
  mount(canvas: HTMLCanvasElement): void;
  unmount(): void;
  pause(): void;
  resume(): void;
  reset(): void;
  onStateChange(cb: (state: AsteroidsGameState) => void): () => void;
}
```

### Estado interno del juego (engine, no expuesto a React)

Portado de la referencia; vive en el closure de `createAsteroidsEngine()`:

```ts
// Constantes → lib/games/asteroids/constants.ts
const W = 800;
const H = 600;
const RADII = [0, 16, 30, 50];
const SPEEDS = [0, 85, 55, 32];
const POINTS = [0, 100, 50, 20];
const POWERUP_DROP_CHANCE = 0.15;
const POWERUP_DURATION = 5;
const POWERUP_TTL = 12;
const MAX_DT = 0.05;

// Estado de módulo (engine.ts)
let ship, bullets, asteroids, particles, powerUps;
let score, lives, level, phase;
let deadTimer, powerUpSpawned, killsSinceSpawn, paused;
```

### Notificación a React

El engine llama a `onStateChange` cuando cambian `score`, `lives`, `level` o `phase`. `AsteroidsCanvas` reenvía al callback de `AsteroidsPlayer`, que actualiza el HUD externo vía `GamePlayerShell`. Cuando `phase === "gameover"`, `AsteroidsPlayer` pone `over = true` y muestra el overlay de fin de partida dentro del CRT.

### Convenciones

- Coordenadas: origen arriba-izquierda.
- Velocidades y aceleraciones en px/s o px/s².
- `dt` en segundos, capado a 50 ms por frame (`MAX_DT`).
- Input en engine: `keys` + `justPressed` en listeners de `window` (solo mientras montado).
- Input en entidad `Ship`: propiedad `input` sincronizada por el engine antes de `ship.update(dt)`.

---

## Plan de implementación (ejecutado)

1. **Catálogo y cover** — Entrada `asteroids` en `games.ts` + `.cover-asteroids` en CSS. ✅
2. **Fundamentos del engine** — `constants.ts`, `utils.ts`, `types.ts`. ✅
3. **Entidades** — `entities/*.ts` con `update(dt)`, `draw(ctx)`, `dead`. ✅
4. **Engine core** — `engine.ts` con loop, input, colisiones, HUD interno, `onStateChange`, pause/resume/reset. ✅
5. **Componente canvas** — `asteroids-canvas.tsx` con mount/unmount y `engineRef`. ✅
6. **Integración por ruta dedicada** — `asteroids-player.tsx`, rutas estáticas, `GamePlayerShell`, `static-game-routes.ts`. ✅ *(desvía del paso 6 original: branch en `GamePlayer`)*
7. **Smoke test** — Flujo completo verificado (manual + Playwright). ✅

---

## Criterios de aceptación

### Catálogo

- [x] `asteroids` aparece en `/games` con título ASTEROIDS, categoría SHOOTER y cover `cover-asteroids`.
- [x] `/games/asteroids` muestra detalle del juego con CTA "JUGAR" que lleva a `/play/asteroids`.
- [x] La entrada `rocas` sigue existiendo sin cambios.

### Juego jugable

- [x] `/play/asteroids` carga un canvas 800×600 dentro del marco CRT.
- [x] La nave rota con `←` `→`, se propulsa con `↑` y dispara con `Espacio`.
- [x] Los asteroides se mueven, rotan y envuelven los bordes del canvas.
- [x] Al destruir un asteroide grande/mediano se fragmenta en piezas más pequeñas.
- [x] Puntuación: pequeño = 100, mediano = 50, grande = 20 puntos.
- [x] El jugador tiene 3 vidas; al morir reaparece con invencibilidad temporal (parpadeo).
- [x] Al destruir todos los asteroides avanza al siguiente nivel con más asteroides.
- [x] Los power-ups de disparo triple aparecen y funcionan (indicador `3x` en HUD del canvas).

### HUD dual sincronizado

- [x] El canvas dibuja su HUD interno (score, nivel, vidas, 3x).
- [x] El HUD externo muestra puntuación, vidas y nivel sincronizados con el engine.
- [x] Ambos HUDs reflejan los mismos valores en tiempo real.

### Contenedor (shell + player)

- [x] PAUSA detiene el loop del juego (asteroides/nave congelados).
- [x] REANUDAR reanuda el loop desde donde se pausó.
- [x] Al perder todas las vidas (`phase === "gameover"`) aparece el overlay de fin de partida con puntuación final **dentro del CRT**.
- [x] No hay overlay de "GAME OVER" dibujado por el engine en el canvas.
- [x] "JUGAR DE NUEVO" reinicia la partida (score=0, vidas=3, nivel=1).
- [x] "GUARDAR PUNTUACIÓN" funciona (persistencia real en `AsteroidsPlayer`; mock en placeholder).
- [x] SALIR navega a `/games/asteroids`.

### Otros juegos sin regresión

- [x] `/play/bloque-buster` sigue mostrando la arena placeholder animada.
- [x] El HUD y overlays del placeholder funcionan igual que antes.

### Técnico

- [x] Sin errores de consola relevantes en flujo de juego.
- [x] Sin errores de TypeScript ni ESLint en archivos del juego.
- [x] El engine se desmonta limpiamente al salir de `/play/asteroids`.

### Fuera de alcance (verificado)

- [x] No hay branch `game.id === "asteroids"` en `GamePlayer`.
- [x] No hay controles táctiles ni botones on-screen.
- [x] No hay audio.
- [x] No se implementaron otros juegos reales además de Asteroids.

---

## Decisiones

### Mantenidas de la versión aprobada

- **Sí:** Juego `id: "asteroids"` separado de `rocas`.
- **Sí:** Engine TypeScript modular en `lib/games/asteroids/`, desacoplado de React.
- **Sí:** HUD dual (canvas interno + HUD externo) sincronizado vía `onStateChange`.
- **Sí:** API `AsteroidsEngine` con `mount`, `unmount`, `pause`, `resume`, `reset`, `onStateChange`.
- **Sí:** Pausa real del loop (`pause()` cancela rAF).
- **Sí:** Sin overlay "GAME OVER" en el canvas del engine.
- **Sí:** Power-ups de disparo triple de la referencia.
- **Sí:** Solo teclado.
- **Sí:** Cover CSS `cover-asteroids` distinto de `cover-rocas`.

### Cambiadas en implementación (ver tabla de desviaciones)

- **~~Sí: `GamePlayer` con branch `game.id === "asteroids"`.~~** → **No.** Sustituido por ruta estática + `AsteroidsPlayer` (patrón del curso).
- **~~Sí: Game over via modal fullscreen de la plataforma.~~** → **No.** Game over como overlay `.crt-gameover` dentro del CRT (misma "tele" que PAUSA).
- **~~Sí: Guardar puntuación mock.~~** → **Parcial.** Asteroids usa `saveScore` real; placeholder sigue mock.

### Para el siguiente juego

- **Sí:** Repetir el patrón ruta estática + `{Juego}Player` + `{Juego}Canvas` + engine en `lib/games/{slug}/`.
- **Sí:** Añadir el `id` a `STATIC_GAME_ROUTES`.
- **No:** Registry genérico de engines hasta tener varios juegos y dolor real de mantenimiento.
- **No:** Mezclar lógica de juegos distintos en `GamePlayer`.

---

## Riesgos

| Riesgo | Mitigación |
|--------|------------|
| `requestAnimationFrame` sigue corriendo tras desmontar | `unmount()` cancela rAF y elimina listeners; verificado al salir de `/play/asteroids`. |
| Input global interfiere con la UI | Listeners en `window` solo activos mientras el engine está montado. |
| Desincronización HUD canvas / React | `onStateChange` en cada cambio de estado; React solo espeja. |
| Pausa no congela el juego | `pause()` detiene el loop; `AsteroidsCanvas` pasa `paused \|\| over`. |
| Scroll al pulsar Espacio/flechas | `preventDefault` en teclas de juego en el engine. |
| Duplicación al añadir juegos | Patrón documentado en "Implementación final"; `GamePlayerShell` centraliza UI. |
| Rutas estáticas vs `[id]` en conflicto | `STATIC_GAME_ROUTES` + exclusión en `generateStaticParams`. |

---

## Lo que NO está en este spec

- Implementación de los otros 7 juegos reales o reemplazo de `rocas`.
- Registry genérico de engines.
- Controles táctiles u on-screen.
- Audio / efectos de sonido.
- OVNIs u otros enemigos no presentes en la referencia.
- Tests automatizados en CI.
- Unificar todos los players en un solo componente con branches por `game.id`.

Cada uno de estos, si llega, va en su propio spec.
