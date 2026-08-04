# SPEC 05 — Juego Asteroids en Arcade Vault

> **Estado:** Aprobado
> **Depende de:** SPEC 01 — MVP visual de Arcade Vault
> **Fecha:** 2026-08-03
> **Objetivo:** Integrar el juego Asteroids (canvas 800×600) en `/play/asteroids` portando la referencia a un engine TypeScript modular que mantiene su HUD y controles dentro del canvas, notifica cambios de estado a React, y usa el shell del reproductor (HUD externo, pausa, modal de game over).

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
- Integración en `GamePlayer`: si `game.id === "asteroids"`, reemplaza la arena placeholder por `AsteroidsCanvas` y sincroniza el HUD externo vía `onStateChange`.
- Pausa controlada por el contenedor: PAUSA detiene el loop; REANUDAR lo reanida.
- Game over: al `phase === "gameover"`, abre el modal de la plataforma (sin overlay de game over en canvas).
- Reinicio desde "JUGAR DE NUEVO" del modal llama a `engine.reset()`.
- Controles solo teclado: `←` `→` rotar, `↑` propulsar, `Espacio` disparar.
- Guardar puntuación mock (sin Supabase ni localStorage), igual que el resto de la plataforma.
- Estilos del cover `cover-asteroids` en `app/arcade-vault.css`.
- Ruta `/play/asteroids` funcional desde detalle y biblioteca.

**Fuera de alcance (para specs futuros):**

- Implementar los otros 7 juegos reales o reemplazar `rocas`.
- Registry genérico de engines (`Record<string, GameEngine>`) — solo branch por `game.id` en `GamePlayer`.
- Controles táctiles u on-screen para móvil.
- Persistencia real de puntuaciones (Supabase, localStorage, salón de la fama dinámico).
- Audio / efectos de sonido.
- OVNIs (mencionados en la descripción de `rocas`, no en la referencia de Asteroids).
- Tests automatizados.
- Refactor del `GamePlayer` para todos los juegos a la vez.

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
  best: 0,        // mock inicial; sin persistencia real en este spec
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

Vive en el módulo del engine, portado de la referencia:

```ts
// Constantes
const W = 800;
const H = 600;
const RADII = [0, 16, 30, 50];    // índice = tamaño (1=pequeño, 3=grande)
const SPEEDS = [0, 85, 55, 32];
const POINTS = [0, 100, 50, 20];
const POWERUP_DROP_CHANCE = 0.15;
const POWERUP_DURATION = 5;      // segundos de disparo triple
const POWERUP_TTL = 12;          // segundos antes de que desaparezca el power-up

// Estado de módulo
let ship: Ship;
let bullets: Bullet[];
let asteroids: Asteroid[];
let particles: Particle[];
let powerUps: PowerUp[];
let score: number;               // inicia en 0
let lives: number;               // inicia en 3
let level: number;               // inicia en 1
let phase: AsteroidsPhase;       // inicia en "playing"
let deadTimer: number;
let powerUpSpawned: boolean;
let killsSinceSpawn: number;
let paused: boolean;             // controlado por pause()/resume()
```

### Notificación a React

El engine llama al callback registrado en `onStateChange` cuando cambian `score`, `lives`, `level` o `phase`. El componente `AsteroidsCanvas` reenvía al `GamePlayer`, que actualiza su HUD externo. Cuando `phase === "gameover"`, `GamePlayer` abre el modal de fin de partida.

### Sin persistencia

Este spec no introduce almacenamiento. El botón "GUARDAR PUNTUACIÓN" del modal sigue siendo mock (toast visual, sin escritura en DB ni localStorage).

### Estructura de archivos nuevos

```
lib/games/asteroids/
  types.ts          # AsteroidsGameState, AsteroidsEngine
  engine.ts         # createAsteroidsEngine(): AsteroidsEngine
  entities/         # bullet.ts, asteroid.ts, ship.ts, particle.ts, power-up.ts
  constants.ts      # W, H, RADII, SPEEDS, POINTS, power-up config
  utils.ts          # wrap, dist, rand, randInt
components/games/
  asteroids-canvas.tsx   # Client Component: canvas + mount/unmount del engine
```

### Convenciones

- Coordenadas: origen arriba-izquierda.
- Velocidades y aceleraciones en px/s o px/s².
- `dt` en segundos, capado a 50 ms por frame.
- Input: objeto `keys` + `justPressed` para teclas (`ArrowLeft`, `ArrowRight`, `ArrowUp`, `Space`).

## Plan de implementación

1. **Catálogo y cover** — Añadir entrada `asteroids` en `app/data/games.ts`. Crear estilos `cover-asteroids` en `app/arcade-vault.css` (fondo espacial con silueta de nave/asteroides). Verificar que aparece en `/games` y `/games/asteroids`; `/play/asteroids` sigue con placeholder.

2. **Fundamentos del engine** — Crear `lib/games/asteroids/constants.ts`, `utils.ts` y `types.ts` con constantes, helpers (`wrap`, `dist`, `rand`) y la interfaz `AsteroidsEngine`. Sin lógica de juego aún; compila sin errores.

3. **Entidades** — Portar clases a `lib/games/asteroids/entities/`:
   - `bullet.ts`, `asteroid.ts`, `ship.ts`, `particle.ts`, `power-up.ts`.
   Cada una con `update(dt)`, `draw(ctx)` y flag `dead`. Fiel a la referencia.

4. **Engine core** — Crear `lib/games/asteroids/engine.ts` con `createAsteroidsEngine()`:
   - Input de teclado (`keys` / `justPressed`).
   - `initGame()`, `nextLevel()`, colisiones, spawn de asteroides, power-ups.
   - Loop `requestAnimationFrame` con `dt` capado a 50 ms.
   - HUD interno en canvas (score, nivel, vidas, 3x).
   - `onStateChange` notifica en cada cambio de `score`, `lives`, `level`, `phase`.
   - `pause()` / `resume()` detienen/reanudan el loop.
   - `reset()` reinicia partida.
   - Sin overlay de game over en canvas (solo congela en último frame al `phase === "gameover"`).
   - Probar montando el engine en un canvas HTML temporal o story de consola.

5. **Componente canvas** — Crear `components/games/asteroids-canvas.tsx`:
   - `useRef` para `<canvas width={800} height={600}>`.
   - `useEffect` monta/desmonta engine (`mount` / `unmount`).
   - Props: `paused`, `onStateChange`, `engineRef` (para que `GamePlayer` llame `reset()`).
   - Canvas centrado dentro del marco CRT existente.

6. **Integración en GamePlayer** — Modificar `components/game-player.tsx`:
   - Si `game.id === "asteroids"`: renderizar `AsteroidsCanvas` en lugar de `.game-arena` placeholder.
   - Suscribir `onStateChange` → actualizar `score`, `lives`, `level` del HUD externo.
   - `phase === "gameover"` → `setOver(true)`.
   - PAUSA/REANUDAR → `engine.pause()` / `engine.resume()`.
   - "JUGAR DE NUEVO" → `engine.reset()` + cerrar modal.
   - FIN → forzar game over o delegar al engine.
   - Resto de juegos: sin cambios (placeholder intacto).

7. **Smoke test manual** — Recorrer flujo completo:
   - `/games` → tarjeta ASTEROIDS visible.
   - `/games/asteroids` → detalle con CTA "JUGAR".
   - `/play/asteroids` → juego jugable con teclado.
   - HUD dual sincronizado (canvas + plataforma).
   - PAUSA congela el juego; REANUDAR continúa.
   - Perder 3 vidas → modal de plataforma con puntuación final.
   - "JUGAR DE NUEVO" reinicia partida.
   - "GUARDAR PUNTUACIÓN" muestra toast mock.
   - SALIR vuelve a `/games/asteroids`.
   - Sin errores en consola ni TypeScript/ESLint.

## Criterios de aceptación

### Catálogo

- [ ] `asteroids` aparece en `/games` con título ASTEROIDS, categoría SHOOTER y cover `cover-asteroids`.
- [ ] `/games/asteroids` muestra detalle del juego con CTA "JUGAR" que lleva a `/play/asteroids`.
- [ ] La entrada `rocas` sigue existiendo sin cambios.

### Juego jugable

- [ ] `/play/asteroids` carga un canvas 800×600 dentro del marco CRT.
- [ ] La nave rota con `←` `→`, se propulsa con `↑` y dispara con `Espacio`.
- [ ] Los asteroides se mueven, rotan y envuelven los bordes del canvas.
- [ ] Al destruir un asteroide grande/mediano se fragmenta en piezas más pequeñas.
- [ ] Puntuación: pequeño = 100, mediano = 50, grande = 20 puntos.
- [ ] El jugador tiene 3 vidas; al morir reaparece con invencibilidad temporal (parpadeo).
- [ ] Al destruir todos los asteroides avanza al siguiente nivel con más asteroides.
- [ ] Los power-ups de disparo triple aparecen y funcionan (indicador `3x` en HUD del canvas).

### HUD dual sincronizado

- [ ] El canvas dibuja su HUD interno (score, nivel, vidas, 3x).
- [ ] El HUD externo del `GamePlayer` muestra puntuación, vidas y nivel sincronizados con el engine.
- [ ] Ambos HUDs reflejan los mismos valores en tiempo real.

### Contenedor (GamePlayer)

- [ ] PAUSA detiene el loop del juego (asteroides/nave congelados).
- [ ] REANUDAR reanuda el loop desde donde se pausó.
- [ ] Al perder todas las vidas (`phase === "gameover"`) aparece el modal de la plataforma con puntuación final.
- [ ] No hay overlay de "GAME OVER" dentro del canvas.
- [ ] "JUGAR DE NUEVO" reinicia la partida (score=0, vidas=3, nivel=1).
- [ ] "GUARDAR PUNTUACIÓN" muestra toast mock sin error.
- [ ] SALIR navega a `/games/asteroids`.

### Otros juegos sin regresión

- [ ] `/play/bloque-buster` (u otro juego) sigue mostrando la arena placeholder animada.
- [ ] El HUD y modales del placeholder funcionan igual que antes.

### Técnico

- [ ] Sin errores en consola al jugar una partida completa.
- [ ] Sin errores de TypeScript ni ESLint en archivos nuevos o modificados.
- [ ] El engine se desmonta limpiamente al salir de `/play/asteroids` (sin listeners ni rAF huérfanos).

### Fuera de alcance (verificar que NO existe)

- [ ] No hay persistencia real de puntuaciones (ni Supabase ni localStorage).
- [ ] No hay controles táctiles ni botones on-screen.
- [ ] No hay audio.
- [ ] No se implementaron otros juegos reales además de Asteroids.

## Decisiones

- **Sí:** Juego nuevo `id: "asteroids"` separado de `rocas`. Cada juego es independiente; `rocas` queda como placeholder futuro.
- **No:** Reemplazar `rocas` por Asteroids. Son juegos distintos en el catálogo.
- **Sí:** Engine TypeScript modular en `lib/games/asteroids/` importado por Client Component con `useRef` + canvas. Lógica desacoplada de React, testeable y compatible con Next.js.
- **No:** Portar `game.js` como `<script>` externo o todo dentro de un solo componente React con hooks. Acopla innecesariamente o evita TypeScript.
- **Sí:** HUD dual — canvas interno + HUD externo del `GamePlayer`, sincronizados vía `onStateChange`. El juego mantiene su identidad visual; la plataforma refleja el estado.
- **No:** Eliminar el HUD del canvas (opción 3a inicial). El usuario pidió mantener ambos.
- **No:** Solo HUD del canvas sin sincronizar con React. Rompe la integración con el shell de Arcade Vault.
- **Sí:** API `AsteroidsEngine` con `mount`, `unmount`, `pause`, `resume`, `reset`, `onStateChange`. Contrato claro entre engine y contenedor.
- **No:** Exponer estado interno del engine directamente a React sin callback. Acoplaría el componente a la implementación interna.
- **Sí:** Pausa real del loop controlada por el contenedor (`GamePlayer`). PAUSA detiene `requestAnimationFrame`; no es solo overlay visual.
- **No:** Pausa solo visual con el juego corriendo en background.
- **Sí:** Game over via modal de la plataforma; sin overlay de game over en canvas.
- **No:** Overlay de game over en canvas + modal simultáneos. Evita dos UIs de fin de partida.
- **Sí:** Incluir power-ups de disparo triple de la referencia. Ya implementados y probados en `game.js`.
- **No:** Strip de power-ups para "simplificar". La referencia los incluye y funcionan.
- **Sí:** `GamePlayer` con branch `game.id === "asteroids"`. Mínimo cambio para el primer juego real.
- **No:** Registry genérico de engines (`Record<string, GameEngine>`). Prematuro con un solo juego; se introduce cuando haya un segundo.
- **Sí:** Guardar puntuación mock (toast visual). Coherente con el resto de la plataforma; persistencia real en spec futuro.
- **No:** Persistencia en Supabase o localStorage en este spec. SPEC 04 preparó infraestructura pero no hay esquema de scores.
- **Sí:** Solo teclado (`←` `→` `↑` + Espacio). Fiel a la referencia.
- **No:** Controles táctiles en este spec. Requiere UI on-screen y lógica de touch separada.
- **Sí:** Cover CSS nuevo `cover-asteroids`. Diferencia visual clara respecto a `rocas`.
- **No:** Reutilizar `cover-rocas`. Confundiría dos juegos distintos en la biblioteca.

## Riesgos

| Riesgo | Mitigación |
|--------|------------|
| `requestAnimationFrame` sigue corriendo tras desmontar el componente | `unmount()` cancela el rAF y elimina listeners de teclado; verificar en smoke test al salir de `/play/asteroids`. |
| Input de teclado capturado globalmente interfiere con otros elementos de la UI | Listeners en `window` solo activos mientras el engine está montado; se limpian en `unmount()`. |
| Desincronización entre HUD del canvas y HUD de React | El engine emite `onStateChange` en cada cambio de `score`, `lives`, `level`, `phase`; no hay estado duplicado en React más allá del espejo. |
| Pausa del contenedor no congela el juego si el engine ignora el flag | `pause()` detiene el loop; `resume()` lo reanuda. El flag `paused` se comprueba al inicio de cada frame. |
| Scroll de página al pulsar Espacio o flechas | `e.preventDefault()` en `keydown` para las teclas de juego mientras el canvas tiene foco o el engine está montado. |
| Canvas 800×600 desborda en móvil dentro del marco CRT | Fuera de alcance (solo teclado); el marco CRT existente ya maneja overflow. Documentar que móvil no es objetivo de este spec. |
| `GamePlayer` crece con lógica específica de Asteroids | Branch aislado por `game.id`; cuando haya un segundo juego, extraer a registry en spec dedicado. |

## Lo que NO está en este spec

- Implementación de los otros 7 juegos reales o reemplazo de `rocas`.
- Registry genérico de engines de juego.
- Controles táctiles u on-screen para móvil.
- Persistencia real de puntuaciones (Supabase, localStorage, salón de la fama dinámico).
- Audio / efectos de sonido.
- OVNIs u otros enemigos no presentes en la referencia.
- Tests automatizados.
- Refactor completo del `GamePlayer` para todos los juegos.

Cada uno de estos, si llega, va en su propio spec.
