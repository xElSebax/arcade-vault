# SPEC 10 — Controles táctiles móvil

> **Estado:** Implementado
> **Progreso:** Pasos 1–12 completados.
> **Depende de:** SPEC 05 — Juego Asteroids, SPEC 06 — Catálogo y leaderboard en Supabase, SPEC 07 — Juego Tetris, SPEC 08 — Juego Arkanoid, SPEC 09 — Juego Snake
> **Fecha:** 2026-09-12
> **Última revisión:** 2026-09-12 — afinación de layout táctil (D-pad | gap | A/B, chrome oculto, scroll contenido, game over compacto)
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
- Mantener pulsado más de ~500 ms = repetición continua a ritmo de teclado Windows/Chrome (~33 ms). Un tap corto = **un solo paso**.
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
  | "rotate" // Tetris: rotar pieza (pulso)
  | "soft_drop" // Tetris: bajar suave (mantener)
  | "hard_drop"; // Tetris: caída dura (pulso)

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
/** Botones mantenidos (thrust, mover pala, soft drop, direcciones Snake) */
setVirtualInput(state: VirtualInputState): void;

/** Acciones de un solo toque (disparo, rotar, hard drop) */
pulseVirtualAction(action: TouchAction): void;
```

Implementación interna: traducir a la misma lógica que hoy consumen `keydown` / `keys` / `ship.input`, sin emitir `KeyboardEvent` sintéticos.

| Engine      | `setVirtualInput` (hold tras delay)  | `pulseVirtualAction` (tap)                          |
| ----------- | ------------------------------------ | --------------------------------------------------- |
| `snake`     | reafirma dirección si se mantiene    | `move_*` encola un giro                             |
| `asteroids` | rotación / thrust continuo           | `rotate_*` un ángulo, `thrust` impulso, `fire`      |
| `tetris`    | ARR ←→↓                              | `move_*`, `soft_drop`, `rotate`, `hard_drop`        |
| `arkanoid`  | pala continua                        | `move_*` nudge de 32 px                             |

### Componente de UI — `components/virtual-game-controls.tsx`

```ts
interface VirtualGameControlsProps {
  map: GameTouchMap;
  disabled?: boolean; // true en pausa / game over
  onInputChange: (state: VirtualInputState) => void;
  onActionPulse: (action: TouchAction) => void;
  controlsLabel?: string; // ej. game.title → "Controles de SNAKE"
}
```

Sin estado persistente de juego propio: emite `onInputChange` en `pointerdown` / `pointerup` / `pointerleave` / `pointercancel`, y `onActionPulse` en acciones de pulso (A/B cuando el mapa apunta a acción de pulso; ↑ en Tetris para rotar).

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

2. **Componente `VirtualGameControls`** ✅ — Layout D-pad izquierda + A/B derecha; flechas rotadas; pulsos vs mantener; `controlsLabel` opcional.

3. **Estilos de barra táctil** ✅ — En `arcade-vault.css`: `.av-touch-play`, `.av-touch-bar`, `.virtual-controls`, `.skin-selector-compact`, HUD/CRT/game over táctil, tokens `--virtual-btn-size` / `--touch-bar-height`.

4. **Extender `GamePlayerShell`** ✅ — Props `touchMode` / `touchControls`; `useTouchPlayChrome`; toolbar de una fila; desktop sin cambios.

5. **Engine Snake** ✅ — `setVirtualInput` / `pulseVirtualAction`; cableado en `snake-player.tsx` + limpieza en `snake-canvas.tsx` al pausar.

6. **Engine Arkanoid** ✅ — `setVirtualInput` mapea `left`/`right` a `keys.ArrowLeft`/`ArrowRight`; `pulseVirtualAction` no-op; cableado en `arkanoid-player.tsx` + limpieza en `arkanoid-canvas.tsx` al pausar.

7. **Engine Asteroids** ✅ — `setVirtualInput` mapea `left`/`right`/`up` a `keys.ArrowLeft`/`ArrowRight`/`ArrowUp`; `pulseVirtualAction("fire")` marca `justPressed.Space`; cableado en `asteroids-player.tsx` + limpieza en `asteroids-canvas.tsx`.

8. **Engine Tetris** ✅ — `setVirtualInput` con borde en press + repetición ~50ms en loop para ←→ y ↓ soft drop; `pulseVirtualAction` para `rotate` y `hard_drop`; cableado en `tetris-player.tsx` + limpieza en `tetris-canvas.tsx`.

9. **Layout Tetris móvil** ✅ — `tetris-canvas-wrap--touch`; CRT sin `aspect-ratio` 4:3 (`:has(.tetris-canvas-wrap--touch)`); tablero `height: 100%` + `aspect-ratio: 10/20`; NEXT ~64px a la derecha; `.tetris-controls` oculto.

10. **Comportamiento de overlays y scroll** ✅ — Controles solo montados en partida activa (`touchMode && !paused && !over`); `av-player--active-touch` aplica `touch-action: none` solo en juego; overlay con `touch-action: manipulation` / `pan-y` en game over; scroll contenido en `.crt-gameover` (`overscroll-behavior: contain`); documento bloqueado vía `av-touch-play`.

11. **Selector de skins en barra inferior** ✅ (incluido en paso 4) — `GameSkinSelector` con `variant="compact"` (`<select>` + etiqueta SKIN) en la toolbar. No usar fila de tres botones en móvil salvo fallback futuro.

12. **Lint y build final** ✅ — `npm run lint` + `npm run build` sin errores.

## Criterios de aceptación

### Detección y layout general

- [ ] En viewport ≥ 768px con `pointer: fine` (desktop), los controles virtuales **no** se muestran.
- [ ] En viewport < 768px o `pointer: coarse`, la barra inferior fija se muestra en `/play/asteroids`, `/play/tetris`, `/play/arkanoid` y `/play/snake`.
- [ ] En modo táctil, **navbar y footer del sitio están ocultos** en la vista de juego.
- [ ] El HUD superior en modo táctil muestra solo stats (jugador, puntuación, vidas/nivel/etc.); no muestra PAUSA, FIN ni SALIR.
- [ ] Hay separación visible entre el HUD de stats y el marco CRT (~14px).
- [ ] PAUSA, FIN, SALIR y selector de skins son accesibles desde la **toolbar** de la barra inferior, en una sola fila, sin scroll hacia arriba.
- [ ] La barra de controles permanece fija al borde inferior del viewport durante la partida.

### Controles unificados

- [ ] Los 6 botones (↑ ↓ ← → A B) aparecen en la misma disposición en los cuatro juegos: **D-pad a la izquierda, A y B juntos a la derecha**.
- [ ] Hay separación amplia entre el grupo D-pad y el grupo A/B (~64px); los botones **dentro** de cada grupo permanecen compactos (4px / 8px).
- [ ] Las cuatro flechas usan el mismo icono rotado (sin `←` `→` deformados).
- [ ] Los botones sin acción en el mapa del juego se muestran atenuados y no responden al toque.
- [ ] Los botones con acción responden visualmente al toque (estado activo mientras el dedo está apoyado).

### Por juego

- [ ] **Snake:** ↑↓←→ cambian la dirección; A y B no hacen nada.
- [ ] **Asteroids:** ↑ impulsa, ←→ rotan, A dispara; ↓ y B no hacen nada.
- [ ] **Tetris:** ←→ mueven, ↑ rota, ↓ baja suave (mantener), A hace hard drop; B no hace nada.
- [ ] **Arkanoid:** ←→ mueven la pala; ↑ ↓ A B no hacen nada; la pelota sigue auto-lanzándose.

### Desktop sin regresiones

- [ ] En desktop, los cuatro juegos siguen funcionando con teclado exactamente como antes.
- [ ] No se emiten `KeyboardEvent` sintéticos desde los controles táctiles.

### Overlays y scroll

- [ ] En pausa, los botones de juego (↑↓←→ A B) están ocultos; solo toolbar del shell visible.
- [ ] En game over, igual: sin controles de juego; panel compacto dentro del CRT; si hay overflow, scroll **dentro del overlay**, no en el documento.
- [ ] El fondo del sitio (grid/dots) no se despega del viewport al interactuar con game over en modo táctil.
- [ ] Durante partida activa, scroll/zoom accidental del navegador está bloqueado (`av-touch-play` + `touch-action: none`).
- [ ] Input de iniciales en game over táctil tiene altura fija (~34px), no se estira por flex.

### Tetris móvil

- [ ] En modo táctil, el tablero completo (20 filas) es visible sin recorte vertical.
- [ ] El panel NEXT aparece compacto a la derecha del tablero.
- [ ] La lista de controles de teclado del panel lateral no se muestra en móvil.

### Skins

- [ ] En modo táctil se puede cambiar el skin desde la toolbar con el selector compacto (`SKIN` + `<select>`).

### Build

- [ ] `npm run lint` pasa sin errores nuevos.
- [ ] `npm run build` completa sin errores.

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
- **Sí:** Tap táctil = un paso discreto (`pulseVirtualAction`). El hold continuo (`setVirtualInput`) arranca ~500 ms después (DAS tipo teclado Windows). En Tetris el ARR táctil es **33 ms**, alineado al repeat típico del browser; `dt` del loop está en ms.
- **No:** `setPointerCapture` ni `preventDefault` en `pointerdown` de los botones virtuales. En móvil retrasa o pierde el `pointerup` y el botón queda “pegado”.
- **Sí:** Liberación global en capture (`pointerup` / `pointercancel` / `touchend`) y `touch-action: none` en los botones. El estilo pressed no usa `:active` ni `transform` (en iOS `:active` se queda pegado y el translate mueve el hit-box bajo el dedo).

## Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Dedos cubren parte del canvas en portrait | Barra fija abajo separada del CRT; canvas arriba con `max-width: 100%` ya existente. |
| `pointer: coarse` no detecta algunos tablets híbridos | Combinar con `viewport < 768px` como segundo criterio (OR, no AND). |
| Mantener pulsado en Snake encola giros erráticos | Snake solo acepta un cambio de dirección por tick; reutilizar lógica de bloqueo 180° existente. |
| Pulso de disparo en Asteroids demasiado rápido si A se interpreta como hold | `fire` solo vía `pulseVirtualAction` en `pointerdown`, no en `setVirtualInput`. |
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
