# Touch integration guide — Arcade Vault

Referencia operativa para `@mobile-porter`. Spec canónico: `specs/10-controles-tactiles-movil.md`.

## Infraestructura compartida

```
lib/games/touch-controls/
  types.ts              # VirtualButton, VirtualInputState, TouchAction, GameTouchMap
  maps.ts               # TOUCH_MAPS por juego
  detect-touch-mode.ts  # isTouchPlayMode(), useTouchPlayMode()
  use-touch-play-chrome.ts  # av-touch-play en <html>, scroll lock
```

### Detección de modo táctil

- Criterio: `(pointer: coarse)` **OR** `window.innerWidth < 768`
- Hook: `useTouchPlayMode()` — escucha resize y cambios de media query

### Chrome de modo táctil

- `useTouchPlayChrome(enabled, overlayOpen)` en `GamePlayerShell`
- `enabled` → clase `av-touch-play` en `<html>` (oculta nav/footer, bloquea scroll)
- `overlayOpen` (pausa/game over) → `av-touch-play--overlay`

## API del engine

Cada engine jugable expone dos métodos (sin romper la API existente):

```ts
setVirtualInput(state: VirtualInputState): void;  // hold ≥ ~500 ms
pulseVirtualAction(action: TouchAction): void;   // tap en pointerdown
```

**No emitir `KeyboardEvent` sintéticos.** Traducir a la misma lógica que consumen `keydown` / `keys`.

| Engine      | `setVirtualInput` (hold)              | `pulseVirtualAction` (tap)                    |
| ----------- | ------------------------------------- | ------------------------------------------- |
| `snake`     | reafirma dirección mantenida          | `move_*` → `queueDirection` (1 giro)        |
| `asteroids` | `keys` ←→↑ rotación / thrust continuo  | `rotate_*` ±π/12, `thrust` 42 px, `fire`    |
| `tetris`    | guarda hold; loop repite ←→↓ cada 33 ms | `move_*`, `soft_drop`, `rotate`, `hard_drop` |
| `arkanoid`  | `keys` ←→ pala continua (400 px/s)    | `move_*` → `PADDLE_STEP` (32 px)            |

**Acciones solo-pulso** (nunca entran en hold): `fire`, `rotate`, `hard_drop` — definidas en `PULSE_ACTIONS` dentro de `VirtualGameControls`.

## Mapas por juego — `TOUCH_MAPS`

| Botón | Snake | Asteroids | Tetris | Arkanoid |
|-------|-------|-----------|--------|----------|
| ↑ | move_up | thrust | rotate | null |
| ↓ | move_down | null | soft_drop | null |
| ← | move_left | rotate_left | move_left | move_left |
| → | move_right | rotate_right | move_right | move_right |
| A | null | fire | hard_drop | null |
| B | null | null | null | null |

`null` = botón visible atenuado, sin respuesta al toque.

## Patrón de cableado — `{slug}-player.tsx`

```tsx
import { useTouchPlayMode } from "@/lib/games/touch-controls/detect-touch-mode";
import { TOUCH_MAPS } from "@/lib/games/touch-controls/maps";
import { VirtualGameControls } from "@/components/virtual-game-controls";

const touchMode = useTouchPlayMode();

// En GamePlayerShell:
touchMode={touchMode}
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

**Montaje condicional:** desmontar en pausa/game over (`touchMode && !paused && !over`), no solo `disabled`.

## Limpieza en pausa — `{slug}-canvas.tsx`

Al pausar o desmontar, limpiar input virtual:

```tsx
import { EMPTY_VIRTUAL_INPUT } from "@/lib/games/touch-controls/types";

engine.setVirtualInput(EMPTY_VIRTUAL_INPUT);
```

## Constantes críticas — `VirtualGameControls`

| Constante | Valor | Notas |
|-----------|-------|-------|
| `HOLD_REPEAT_DELAY_MS` | 500 | Delay antes de activar hold |
| `PULSE_DEBOUNCE_MS` | 90 | Debounce por botón en tap |
| `MOUSE_AFTER_TOUCH_SUPPRESS_MS` | 1200 | Ignorar mouse sintético post-touch |
| `VIRTUAL_INPUT_REPEAT_MS` | 33 | Tetris hold repeat (`dt` en **ms**) |
| `PADDLE_STEP` | 32 px | Arkanoid tap (`lib/games/arkanoid/constants.ts`) |
| `TAP_ROTATE` | π/12 rad | Asteroids tap |
| `TAP_THRUST` | 42 | Asteroids tap |

## Modelo tap + hold

1. `pointerdown` → siempre `onActionPulse(action)` (1 paso discreto).
2. Si acción **no** es solo-pulso → timer 500 ms → `holdState[button] = true` → `onInputChange(holdState)`.
3. `pointerup` / `pointercancel` / `touchend` global (capture) → limpiar hold.

**Eventos móvil:**

- **No** usar `setPointerCapture` ni `preventDefault` en `pointerdown`.
- Ignorar `pointerType: "mouse"` durante 1.2 s tras toque real.
- `touch-action: none` en botones y contenedor de controles.
- Pressed solo con clase `--pressed` (sin `:active` ni `transform`).

## Shell y UI

- `GamePlayerShell`: props `touchMode`, `touchControls`
- Barra `.av-touch-bar`: fila de controles (condicional) + toolbar (skin compact + PAUSA/FIN/SALIR)
- `GameSkinSelector` con `variant="compact"` en toolbar táctil
- HUD superior en móvil: solo stats; acciones en toolbar inferior
- `.crt-bottom` oculto en modo táctil

## Layout específico — Tetris móvil

- Clase `tetris-canvas-wrap--touch` en el wrap del canvas
- CRT sin `aspect-ratio` 4:3 cuando contiene wrap táctil
- Tablero `height: 100%` + `aspect-ratio: 10/20`
- Panel NEXT compacto (~64px) a la **derecha** del tablero
- `.tetris-controls` (lista teclado) oculto en móvil

## Archivos típicos a tocar por juego

```
lib/games/{slug}/engine.ts
lib/games/{slug}/types.ts          # tipos de engine API si hace falta
components/games/{slug}-player.tsx
components/games/{slug}-canvas.tsx
lib/games/touch-controls/maps.ts   # si el juego es nuevo
app/arcade-vault.css               # layout táctil específico
```

## Nuevo juego (post `@spec-impl`)

1. Añadir entrada en `TOUCH_MAPS` con acciones semánticas correctas.
2. Implementar `setVirtualInput` + `pulseVirtualAction` en el engine.
3. Cablear player con patrón condicional de montaje.
4. Limpiar `EMPTY_VIRTUAL_INPUT` en canvas al pausar.
5. Añadir fila en `references/mobile-porter/coverage-log.md`.

## Dev LAN (verificación manual)

Probar en dispositivo real con `ALLOWED_DEV_ORIGINS` en `.env.local` (ver `.env.example`). No commitear IP personal.
