# SPEC 10 — Controles táctiles móvil

> **Estado:** Implementado
> **Progreso:** Pasos 1–12 completados.
> **Depende de:** SPEC 05 — Juego Asteroids, SPEC 06 — Catálogo y leaderboard en Supabase, SPEC 07 — Juego Tetris, SPEC 08 — Juego Arkanoid, SPEC 09 — Juego Snake
> **Fecha:** 2026-09-12
> **Última revisión:** 2026-09-12 — modelo tap + hold final, repeat alineado a teclado, overlays/scroll, layout Tetris móvil
> **Objetivo:** Permitir jugar los cuatro juegos reales en dispositivos táctiles mediante una barra inferior fija con controles virtuales unificados (↑↓←→ + A/B), sin romper el teclado en desktop.

## Alcance

**Dentro:**

- Controles táctiles virtuales para los cuatro juegos reales: `asteroids`, `tetris`, `arkanoid`, `snake`.
- Layout unificado fijo en todos los juegos: **grupo D-pad** (↑ ↓ ← →) a la izquierda + **grupo acciones** (**A** y **B** en fila horizontal a la derecha). Los 6 botones siempre en la misma disposición; separación generosa **entre grupos** (no entre botones del mismo grupo) para evitar toques accidentales.
- Mapa de acciones por juego (botones sin uso se muestran atenuados y no responden al toque):
  - **Snake:** ↑↓←→ dirección; A y B atenuados.
  - **Asteroids:** ↑ impulso, ← rotar izquierda, → rotar derecha, A disparar; ↓ y B atenuados.
  - **Tetris:** ←→ mover, ↑ rotar, ↓ bajar suave, A caída dura; B atenuado.
  - **Arkanoid:** ←→ mover pala; ↑ ↓ A B atenuados (pelota sigue auto-lanzándose; sin cambio de engine).
- Detección automática de modo táctil: `(pointer: coarse)` **o** viewport `< 768px`.
- Barra inferior fija al viewport con dos zonas:
  - **Fila de juego** (solo partida activa): `VirtualGameControls` (D-pad + A/B).
  - **Toolbar** (siempre visible en modo táctil): selector de skin compacto (`<select>` con etiqueta **SKIN**) + PAUSA / FIN / SALIR en **una sola fila**.
- En pausa o game over: ocultar la fila de juego; la toolbar sigue visible (REANUDAR en lugar de PAUSA).
- **Chrome del sitio oculto** en modo táctil: navbar y footer no se muestran (`useTouchPlayChrome` → clase `av-touch-play` en `<html>`). Más espacio vertical para el CRT.
- HUD superior en móvil: solo stats de lectura (jugador, puntuación, vidas/nivel/longitud/líneas según juego), con margen inferior respecto al CRT (~14px).
- Player en modo táctil ocupa `100dvh` en flex; barra inferior del CRT (`SEÑAL OK`, etc.) oculta.
- Teclado en desktop sin cambios: los controles virtuales no se muestran fuera del modo táctil.
- **Modelo dual tap + hold** (ver sección dedicada): tap corto = un paso vía `pulseVirtualAction`; mantener > ~500 ms activa `setVirtualInput` y repetición continua (Tetris ~33 ms/celda; Arkanoid/Asteroids como teclado).
- Durante pausa o game over: ocultar controles de juego; la barra inferior muestra solo acciones del shell (REANUDAR, FIN, SALIR, skins).
- Bloqueo de scroll del **documento** durante modo táctil (`overflow: hidden` en `html`/`body` vía `av-touch-play`). `touch-action: none` en partida activa.
- Game over / pausa: el scroll, si hace falta, ocurre **dentro del overlay del CRT** (`overscroll-behavior: contain`), no en la página — evita que el fondo (grid de dots) se despegue del viewport.
- Panel de game over compacto en táctil: input de iniciales altura fija (~34px), botones apilados al 100% del ancho del panel.
- Tetris en móvil: tablero escalado al alto disponible del CRT (sin `aspect-ratio` 4:3); panel **NEXT** compacto a la **derecha** del tablero; ocultar lista de controles de teclado.
- Inyección de input táctil en cada engine sin simular `KeyboardEvent` (API explícita por engine).
- Estilos retro coherentes con el design system (`app/arcade-vault.css`).

**Fuera de alcance (para specs futuros):**

- Los ocho juegos placeholder mock (`/play/[id]` dinámico).
- Joystick virtual o gestos swipe como control principal.
- Cambio de mecánica de Arkanoid (pelota pegada a la pala / lanzar con botón).
- Soporte landscape dedicado con layout distinto.
- Vibración háptica.
- Reordenar o personalizar controles por el usuario.
- PWA, pantalla completa nativa o instalación como app.
- Tests automatizados E2E en dispositivos reales.
- Refactor del shell genérico para placeholders.

## Modelo de datos

### Detección de modo táctil — `lib/games/touch-controls/detect-touch-mode.ts`

```ts
/** true cuando debe mostrarse la barra inferior de controles virtuales */
export function isTouchPlayMode(): boolean;
```

Criterio: `window.matchMedia("(pointer: coarse)").matches` **o** `window.innerWidth < 768`.

Hook cliente: `useTouchPlayMode(): boolean` (escucha `resize` y cambios de media query; implementado con `useSyncExternalStore`).

### Chrome de modo táctil — `lib/games/touch-controls/use-touch-play-chrome.ts`

```ts
/** Oculta nav/footer y bloquea scroll del documento mientras touchMode está activo */
export function useTouchPlayChrome(enabled: boolean, overlayOpen: boolean): void;
```

- `enabled === true` → añade `av-touch-play` a `<html>`.
- `overlayOpen === true` (pausa o game over) → añade `av-touch-play--overlay` (barra táctil solo toolbar; CRT con más altura).
- Cleanup al desmontar o salir de touch mode.

### Botones virtuales — `lib/games/touch-controls/types.ts`

```ts
export type VirtualButton = "up" | "down" | "left" | "right" | "a" | "b";

/** Estado de botones mantenidos pulsados (equivalente a keys[key] === true) */
export type VirtualInputState = Record<VirtualButton, boolean>;

/** Acciones semánticas que un engine puede consumir */
export type TouchAction =
  | "move_up"
  | "move_down"
  | "move_left"
  | "move_right"
  | "thrust"
  | "rotate_left"
  | "rotate_right"
  | "fire"
  | "rotate" // Tetris: rotar pieza (solo pulso; no hold)
  | "soft_drop" // Tetris: bajar suave (pulso + hold)
  | "hard_drop"; // Tetris: caída dura (solo pulso)

/** null = botón visible pero atenuado (sin acción) */
export type GameTouchMap = Record<VirtualButton, TouchAction | null>;

/** Estado inicial vacío (limpiar input al pausar) */
export const EMPTY_VIRTUAL_INPUT: VirtualInputState;
```

### Mapas por juego — `lib/games/touch-controls/maps.ts`

```ts
import type { GameTouchMap } from "./types";

export const TOUCH_MAPS: Record<
  "snake" | "asteroids" | "tetris" | "arkanoid",
  GameTouchMap
> = {
  snake: {
    up: "move_up",
    down: "move_down",
    left: "move_left",
    right: "move_right",
    a: null,
    b: null,
  },
  asteroids: {
    up: "thrust",
    down: null,
    left: "rotate_left",
    right: "rotate_right",
    a: "fire",
    b: null,
  },
  tetris: {
    up: "rotate",
    down: "soft_drop",
    left: "move_left",
    right: "move_right",
    a: "hard_drop",
    b: null,
  },
  arkanoid: {
    up: null,
    down: null,
    left: "move_left",
    right: "move_right",
    a: null,
    b: null,
  },
};
```

### API de input en engines — extensión por engine

Cada engine expone dos métodos nuevos (sin romper la API existente):

```ts
/** Estado de botones mantenidos tras el delay de hold (~500 ms) */
setVirtualInput(state: VirtualInputState): void;

/** Un paso discreto en pointerdown (tap) */
pulseVirtualAction(action: TouchAction): void;
```

Implementación interna: traducir a la misma lógica que hoy consumen `keydown` / `keys` / `ship.input`, sin emitir `KeyboardEvent` sintéticos. Los `{slug}-canvas.tsx` llaman `setVirtualInput(EMPTY_VIRTUAL_INPUT)` al pausar.

| Engine      | `setVirtualInput` (hold ≥ ~500 ms)     | `pulseVirtualAction` (tap en pointerdown)           |
| ----------- | -------------------------------------- | --------------------------------------------------- |
| `snake`     | reafirma dirección mantenida           | `move_*` → `queueDirection` (1 giro)                |
| `asteroids` | `keys` ←→↑ → rotación / thrust continuo | `rotate_*` ±π/12, `thrust` impulso 42 px, `fire`    |
| `tetris`    | guarda hold; loop repite ←→↓ cada 33 ms | `move_*`, `soft_drop`, `rotate`, `hard_drop` (1 paso) |
| `arkanoid`  | `keys` ←→ → pala continua (400 px/s)   | `move_*` → `PADDLE_STEP` (32 px)                    |

**Acciones solo-pulso** (nunca entran en hold): `fire`, `rotate`, `hard_drop` — definidas en `PULSE_ACTIONS` dentro de `VirtualGameControls`.

### Modelo de input táctil (tap + hold)

Flujo en `VirtualGameControls` al `pointerdown` de un botón con acción en el mapa:

1. **Siempre** → `onActionPulse(action)` (debounce 90 ms por botón) = **un paso discreto**.
2. Si la acción **no** es solo-pulso → iniciar timer de **500 ms**; al vencer, `holdState[button] = true` y `onInputChange(holdState)`.
3. Al soltar (`pointerup` / `pointercancel` / `touchend` global en capture) → limpiar hold y emitir estado vacío si cambió.

Constantes de referencia (implementación actual):

| Constante | Valor | Ubicación |
|-----------|-------|-----------|
| `HOLD_REPEAT_DELAY_MS` | 500 | `virtual-game-controls.tsx` |
| `PULSE_DEBOUNCE_MS` | 90 | `virtual-game-controls.tsx` |
| `MOUSE_AFTER_TOUCH_SUPPRESS_MS` | 1200 | `virtual-game-controls.tsx` |
| `VIRTUAL_INPUT_REPEAT_MS` | 33 | `lib/games/tetris/engine.ts` (`dt` del loop en **ms**) |
| `PADDLE_STEP` | 32 px | `lib/games/arkanoid/constants.ts` |
| `TAP_ROTATE` | π/12 rad | `lib/games/asteroids/engine.ts` |
| `TAP_THRUST` | 42 px/s equiv. | `lib/games/asteroids/engine.ts` |

**Eventos y robustez móvil:**

- **No** usar `setPointerCapture` ni `preventDefault` en `pointerdown`.
- Ignorar `pointerType: "mouse"` sintético durante 1.2 s tras un toque real (evita doble input).
- Liberación en `window` (`pointerup`, `pointercancel`, `touchend`, `touchcancel`) en fase capture.
- Estilo pressed solo con clase `--pressed` (sin `:active` ni `transform`).
- `touch-action: none` en botones y contenedor de controles.

**Montaje:** en cada `{slug}-player.tsx`, `VirtualGameControls` solo se renderiza con `touchMode && !paused && !over` (no se monta en overlay; el prop `disabled` del componente queda como respaldo interno).

### Componente de UI — `components/virtual-game-controls.tsx`

```ts
interface VirtualGameControlsProps {
  map: GameTouchMap;
  disabled?: boolean; // respaldo; en producción los players desmontan el componente en pausa/over
  onInputChange: (state: VirtualInputState) => void;
  onActionPulse: (action: TouchAction) => void;
  controlsLabel?: string; // ej. game.title → "Controles de SNAKE"
}
```

Sin estado de juego propio: traduce toques a `onActionPulse` (tap) y `onInputChange` (hold). No emite `KeyboardEvent`.

**Layout visual (referencia canónica):**

```
[  ↑  ]                    [ A ][ B ]
[← ↓ →]
     ↑ gap ~64px entre grupos (52px móvil)
```

- **D-pad:** cruz clásica; gap interno entre flechas **4px** (compacto).
- **Acciones A/B:** fila horizontal a la **derecha** del D-pad; gap interno entre A y B **8px**.
- **Separación entre grupos:** `gap` del contenedor `.virtual-controls` **64px** desktop / **52px** móvil — solo entre D-pad y bloque A+B, no entre botones del mismo grupo.
- **Flechas direccionales:** glifo único `↑` rotado con CSS (`0° / 90° / 180° / 270°`). No usar `←` `→` (se deforman en la fuente pixel).
- **Colores:** D-pad cyan; A magenta; B amarillo. Inactivos atenuados (`--inactive`).

### Selector de skins compacto — `components/game-skin-selector.tsx`

```ts
interface GameSkinSelectorProps {
  skin: GameSkinId;
  onSkinChange: (skin: GameSkinId) => void;
  variant?: "default" | "compact"; // compact = <select> en toolbar táctil
}
```

En `variant="compact"`: etiqueta **SKIN** + `<select>` nativo estilizado retro. Sustituye la fila de tres botones en la barra inferior.

### Barra inferior del shell — `components/game-player-shell.tsx`

Nuevas props opcionales:

```ts
interface GamePlayerShellProps {
  // ...existentes
  touchMode?: boolean;
  touchControls?: ReactNode; // <VirtualGameControls /> + acciones móvil
}
```

En `touchMode`:
- El HUD superior omite `.hud-actions`.
- Clases en el player: `av-player--touch`, `av-player--active-touch` (partida activa), `av-player--touch-overlay` (pausa/game over).
- Invoca `useTouchPlayChrome(touchMode, paused || over)`.
- Barra `.av-touch-bar`: fila de controles (condicional) + `.av-touch-bar__toolbar` (skin compact + acciones).

No se introducen tablas Supabase, `localStorage` ni cambios en el catálogo de juegos.

## Plan de implementación

1. **Infraestructura de touch controls** ✅ — `types.ts`, `maps.ts`, `detect-touch-mode.ts`, `useTouchPlayMode`, `EMPTY_VIRTUAL_INPUT`.

2. **Componente `VirtualGameControls`** ✅ — Layout D-pad + A/B; modelo tap + hold (500 ms DAS); debounce pulso; supresión mouse fantasma; liberación global; `controlsLabel` opcional.

3. **Estilos de barra táctil** ✅ — En `arcade-vault.css`: `.av-touch-play`, `.av-touch-bar`, `.virtual-controls`, `.skin-selector-compact`, HUD/CRT/game over táctil, tokens `--virtual-btn-size` / `--touch-bar-height`.

4. **Extender `GamePlayerShell`** ✅ — Props `touchMode` / `touchControls`; `useTouchPlayChrome`; toolbar de una fila; desktop sin cambios.

5. **Engine Snake** ✅ — `pulseVirtualAction` encola dirección (tap); `setVirtualInput` reafirma en hold; cableado en `snake-player.tsx` + limpieza en `snake-canvas.tsx`.

6. **Engine Arkanoid** ✅ — `setVirtualInput` → `keys` (pala continua); `pulseVirtualAction` → `PADDLE_STEP` (32 px); cableado en `arkanoid-player.tsx` + limpieza en `arkanoid-canvas.tsx`.

7. **Engine Asteroids** ✅ — `setVirtualInput` → `keys` (rotación/thrust continuo); `pulseVirtualAction` → ángulo/impulso/disparo; cableado en `asteroids-player.tsx` + limpieza en `asteroids-canvas.tsx`.

8. **Engine Tetris** ✅ — `pulseVirtualAction` = un paso (mover, soft drop, rotar, hard drop); `setVirtualInput` = hold; `processVirtualHoldInput` repite cada 33 ms (`dt` en ms); cableado en `tetris-player.tsx` + limpieza en `tetris-canvas.tsx`.

9. **Layout Tetris móvil** ✅ — `tetris-canvas-wrap--touch`; CRT sin `aspect-ratio` 4:3 (`:has(.tetris-canvas-wrap--touch)`); tablero `height: 100%` + `aspect-ratio: 10/20`; NEXT ~64px a la derecha; `.tetris-controls` oculto.

10. **Comportamiento de overlays y scroll** ✅ — Controles solo montados en partida activa (`touchMode && !paused && !over`); `av-player--active-touch` aplica `touch-action: none` solo en juego; overlay con `touch-action: manipulation` / `pan-y` en game over; scroll contenido en `.crt-gameover` (`overscroll-behavior: contain`); documento bloqueado vía `av-touch-play`.

11. **Selector de skins en barra inferior** ✅ (incluido en paso 4) — `GameSkinSelector` con `variant="compact"` (`<select>` + etiqueta SKIN) en la toolbar. No usar fila de tres botones en móvil salvo fallback futuro.

12. **Lint y build final** ✅ — `npm run lint` + `npm run build` sin errores.

## Criterios de aceptación

### Detección y layout general

- [x] En viewport ≥ 768px con `pointer: fine` (desktop), los controles virtuales **no** se muestran.
- [x] En viewport < 768px o `pointer: coarse`, la barra inferior fija se muestra en `/play/asteroids`, `/play/tetris`, `/play/arkanoid` y `/play/snake`.
- [x] En modo táctil, **navbar y footer del sitio están ocultos** en la vista de juego.
- [x] El HUD superior en modo táctil muestra solo stats (jugador, puntuación, vidas/nivel/etc.); no muestra PAUSA, FIN ni SALIR.
- [x] Hay separación visible entre el HUD de stats y el marco CRT (~14px).
- [x] PAUSA, FIN, SALIR y selector de skins son accesibles desde la **toolbar** de la barra inferior, en una sola fila, sin scroll hacia arriba.
- [x] La barra de controles permanece fija al borde inferior del viewport durante la partida.

### Controles unificados

- [x] Los 6 botones (↑ ↓ ← → A B) aparecen en la misma disposición en los cuatro juegos: **D-pad a la izquierda, A y B juntos a la derecha**.
- [x] Hay separación amplia entre el grupo D-pad y el grupo A/B (~64px); los botones **dentro** de cada grupo permanecen compactos (4px / 8px).
- [x] Las cuatro flechas usan el mismo icono rotado (sin `←` `→` deformados).
- [x] Los botones sin acción en el mapa del juego se muestran atenuados y no responden al toque.
- [x] Los botones con acción responden visualmente al toque (estado activo mientras el dedo está apoyado).

### Input táctil (tap + hold)

- [x] Un tap corto produce **exactamente un paso** (celda, nudge de pala, giro/impulso, rotar, disparar, etc.).
- [x] Mantener ≥ ~500 ms activa repetición continua comparable al teclado (Tetris: 33 ms/celda en hold).
- [x] No hay doble input por mouse sintético post-toque ni botones “pegados” tras soltar.

### Por juego

- [x] **Snake:** ↑↓←→ cambian la dirección (tap y hold); A y B no hacen nada.
- [x] **Asteroids:** ↑ impulsa, ←→ rotan, A dispara; ↓ y B no hacen nada.
- [x] **Tetris:** ←→ mueven (tap + hold), ↑ rota (solo tap), ↓ baja suave (tap + hold), A hard drop (solo tap); B no hace nada.
- [x] **Arkanoid:** ←→ mueven la pala (tap 32 px + hold continuo); ↑ ↓ A B no hacen nada; la pelota sigue auto-lanzándose.

### Desktop sin regresiones

- [x] En desktop, los cuatro juegos siguen funcionando con teclado exactamente como antes.
- [x] No se emiten `KeyboardEvent` sintéticos desde los controles táctiles.

### Overlays y scroll

- [x] En pausa, los botones de juego (↑↓←→ A B) no están montados; solo toolbar del shell visible.
- [x] En game over, igual: sin controles de juego; panel compacto dentro del CRT; si hay overflow, scroll **dentro del overlay**, no en el documento.
- [x] El fondo del sitio (grid/dots) no se despega del viewport al interactuar con game over en modo táctil.
- [x] Durante partida activa, scroll/zoom accidental del navegador está bloqueado (`av-touch-play` + `touch-action: none` en `av-player--active-touch`).
- [x] Input de iniciales en game over táctil tiene altura fija (~34px), no se estira por flex.

### Tetris móvil

- [x] En modo táctil, el tablero completo (20 filas) es visible sin recorte vertical.
- [x] El panel NEXT aparece compacto a la derecha del tablero.
- [x] La lista de controles de teclado del panel lateral no se muestra en móvil.

### Skins

- [x] En modo táctil se puede cambiar el skin desde la toolbar con el selector compacto (`SKIN` + `<select>`).

### Build

- [x] `npm run lint` pasa sin errores nuevos.
- [x] `npm run build` completa sin errores.

## Decisiones

- **Sí:** Controles virtuales on-screen (opción A) en lugar de gestos swipe o joystick. Consistencia visual y menor curva de aprendizaje entre juegos.
- **No:** Gestos directos sobre el canvas como control principal. Complejidad distinta por juego y difícil de descubrir sin tutorial.
- **Sí:** Layout unificado de 6 botones en todos los juegos: **D-pad izquierda + A/B derecha en fila**, con mapa por juego. El jugador siempre encuentra los controles en el mismo sitio.
- **Sí:** Separación generosa **solo entre grupos** (D-pad ↔ acciones), no entre flechas ni entre A/B. Valores de referencia: 64px / 52px (móvil) en `.virtual-controls { gap }`; 4px dentro del D-pad; 8px entre A y B.
- **Sí:** Flechas del D-pad = glifo `↑` rotado por CSS. Evita flechas horizontales unicode deformadas en fuente pixel.
- **Sí:** Ocultar navbar y footer del sitio en touch play (`useTouchPlayChrome`). La vista de juego usa todo el viewport.
- **Sí:** Bloquear scroll del documento en touch play; game over hace scroll contenido dentro del CRT si hace falta.
- **Sí:** Selector de skin compacto (`<select>`) en toolbar, no la fila de tres botones del desktop.
- **Sí:** Botones sin uso mostrados atenuados (no ocultos). Refuerza la consistencia del layout sin confundir con botones rotos.
- **No:** `gameId` hardcodeado en props de `VirtualGameControls`. El componente recibe solo `map`; el player resuelve el mapa desde `TOUCH_MAPS`.
- **Sí:** API explícita en engines (`setVirtualInput` + `pulseVirtualAction`) en lugar de `KeyboardEvent` sintéticos. Evita efectos colaterales en listeners globales y mantiene tipado.
- **No:** Cambiar mecánica de Arkanoid (pelota pegada + lanzar con A). La pelota sigue auto-lanzándose; A/B atenuados en Arkanoid.
- **Sí:** HUD superior solo lectura en móvil; todas las acciones interactivas (PAUSA, FIN, SALIR, skins) en barra inferior fija.
- **Sí:** Ocultar controles de juego en pausa/game over; mostrar solo acciones del shell. Evita input accidental durante overlays.
- **Sí:** Detección automática con `(pointer: coarse)` OR `viewport < 768px`. Sin toggle manual ni preferencia persistida.
- **Sí:** Portrait como objetivo mínimo; landscape sin layout dedicado en este spec.
- **Sí:** Tetris móvil sin `aspect-ratio` 4:3 en el CRT; tablero escalado por altura; NEXT compacto a la derecha; sin lista de controles teclado.
- **Sí:** Mantener teclado en desktop sin cambios. Los controles táctiles son capa adicional, no reemplazo.
- **Sí:** `touch-action: none` solo durante partida activa. En pausa/game over el documento sigue bloqueado; el overlay del CRT puede hacer scroll interno.
- **Sí:** Botones A/B con color distinto (magenta / amarillo). Etiqueta accesible opcional vía `controlsLabel`.
- **Sí:** Ocultar `.crt-bottom` en modo táctil para ganar altura al canvas.
- **No:** A la izquierda del D-pad ni A/B apilados verticalmente — el layout acordado es D-pad | gap | [A][B].
- **Sí:** Modelo dual en **todos** los botones con acción: `pointerdown` → siempre `pulseVirtualAction` (1 paso); si no es solo-pulso → tras 500 ms `setVirtualInput` (hold). Tetris ↑ / A y Asteroids A son solo-pulso.
- **Sí:** Tetris hold: `setVirtualInput` solo guarda estado; `processVirtualHoldInput(dt)` repite en el loop cada **33 ms** (`VIRTUAL_INPUT_REPEAT_MS`; `dt` en **milisegundos**). Bug histórico: usar `0.05` segundos contra `dt` en ms repetía cada frame (~60 celdas/s).
- **Sí:** Arkanoid tap: `PADDLE_STEP` (32 px). Hold: misma velocidad que teclado (`PADDLE_SPEED` 400 px/s).
- **Sí:** Asteroids tap: `TAP_ROTATE` (π/12) e impulso `TAP_THRUST` (42). Hold: rotación/thrust continuo vía `keys`.
- **No:** `setPointerCapture` ni `preventDefault` en `pointerdown`. Ignorar mouse sintético 1.2 s tras touch.
- **Sí:** Liberación global en capture; `touch-action: none` en controles; pressed solo con `--pressed` (sin `:active`/`transform`).
- **Sí:** Desmontar `VirtualGameControls` en pausa/game over (`touchMode && !paused && !over`), no solo `disabled`.

## Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Dedos cubren parte del canvas en portrait | Barra fija abajo separada del CRT; canvas arriba con `max-width: 100%` ya existente. |
| `pointer: coarse` no detecta algunos tablets híbridos | Combinar con `viewport < 768px` como segundo criterio (OR, no AND). |
| Mantener pulsado en Snake encola giros erráticos | Snake solo acepta un cambio de dirección por tick; reutilizar lógica de bloqueo 180° existente. |
| Pulso de disparo en Asteroids demasiado rápido si A se interpreta como hold | `fire` en `PULSE_ACTIONS` → solo `pulseVirtualAction`, nunca hold. |
| Tap móvil recorre varios pasos (dedo abajo 150–300 ms) | Tap siempre vía `pulseVirtualAction`; hold solo tras 500 ms. |
| Mouse sintético tras touch deja hold activo | Suprimir `pointerType: mouse` 1.2 s; liberación global en `touchend`. |
| Tetris hold demasiado rápido | `VIRTUAL_INPUT_REPEAT_MS = 33` con `dt` en ms (no segundos). |
| Selector de skins no cabe en barra inferior | `GameSkinSelector` `variant="compact"` (`<select>`) en la toolbar de una fila. |
| Scroll en game over despega el fondo del sitio | `overflow: hidden` en `html`/`body` con `av-touch-play`; scroll solo dentro de `.crt-gameover`. |
| Toques accidentales entre D-pad y acciones | `gap` grande entre grupos en `.virtual-controls`; gaps internos pequeños. |
| Regresión en desktop por listeners táctiles | Controles virtuales no se montan fuera de `touchMode`; engines ignoran `setVirtualInput` si no hay llamada. |

## Qué **no** está en este spec

- Juegos placeholder mock (solo los 4 reales).
- Joystick virtual, gestos swipe o controles personalizables por el usuario.
- Lanzar pelota en Arkanoid con botón de acción (la mecánica del engine no cambia).
- Layout landscape dedicado.
- Vibración háptica, PWA o pantalla completa nativa.
- Tests automatizados E2E en dispositivos reales.

Cada uno de estos, si llega, va en su propio spec.

## Archivos implementados (referencia skill)

```
lib/games/touch-controls/
  types.ts              # VirtualButton, VirtualInputState, TouchAction, GameTouchMap
  maps.ts               # TOUCH_MAPS por juego
  detect-touch-mode.ts  # isTouchPlayMode, useTouchPlayMode
  use-touch-play-chrome.ts  # av-touch-play en <html>, scroll lock

components/
  virtual-game-controls.tsx   # D-pad + A/B, tap + hold
  game-player-shell.tsx       # touchMode, av-touch-bar, overlays
  game-skin-selector.tsx      # variant="compact"
  games/{slug}-player.tsx     # TOUCH_MAPS + VirtualGameControls condicional
  games/{slug}-canvas.tsx     # EMPTY_VIRTUAL_INPUT al pausar

lib/games/{slug}/engine.ts    # setVirtualInput + pulseVirtualAction
lib/games/arkanoid/constants.ts  # PADDLE_STEP

app/arcade-vault.css          # .av-touch-play, .av-touch-bar, .virtual-controls, Tetris touch layout
specs/10-controles-tactiles-movil.md
```

**Cableado por juego (patrón):**

```tsx
// {slug}-player.tsx
const touchMode = useTouchPlayMode();
touchControls={
  touchMode && !paused && !over ? (
    <VirtualGameControls
      map={TOUCH_MAPS.{slug}}
      onInputChange={(s) => engineRef.current?.setVirtualInput(s)}
      onActionPulse={(a) => engineRef.current?.pulseVirtualAction(a)}
    />
  ) : undefined
}
```

**Dev LAN (fuera de este spec):** probar en móvil con `ALLOWED_DEV_ORIGINS` en `.env.local` (ver `.env.example`); no commitear IP personal.
