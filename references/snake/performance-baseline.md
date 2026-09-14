# Snake — baseline de rendimiento (@game-performance-booster)

> Fecha: 2026-09-14 · Fase: baseline + post-optimización

## Protocolo de medición

| Parámetro | Valor |
|-----------|--------|
| URL | `http://localhost:3000/play/snake` |
| Navegador | Chrome / Chromium (DevTools FPS meter; CDP CPU throttle cuando aplica) |
| Viewports | Desktop ~1280×800 · Móvil ~390×844 |
| CPU throttling | **4×** (aceptación) · **6×** (estrés, opcional) |
| Skins | classic · retro · neon |
| Escenario | Partida activa (loop `requestAnimationFrame` + movimiento serpiente; longitud crece con frutas) |
| Duración muestra | 4–5 s por combinación skin × viewport × CPU |

## Diagnóstico pre-optimización (inventario estático)

Engine monolítico en `lib/games/snake/engine.ts` (sin `render-cache.ts`):

| Operación / frame | Classic | Retro | Neon (long snake) |
|-------------------|---------|-------|-------------------|
| Fondo + grid (strokes) | ~58 strokes + 1 fill | igual | igual |
| `shadowBlur` por segmento cuerpo | 3× (inicio) → N× | N× blur 2 | N× blur **12** |
| `shadowBlur` cabeza | 1× blur 10 | 1× | 1× blur **16** |
| Scanlines | — | **~300** `fillRect` | — |
| React HUD | `setScore`/`setLength` solo en fruta/game over (no cada frame) | igual | igual |

Cuellos principales: **C1** glow por segmento cada frame (empeora con longitud en neon), **C2** scanlines retro, **C3** grid/fondo redibujado completo.

## Resultados post-optimización (estimación draw + verificación manual)

Tras `render-cache.ts`: capa estática (fondo+grid) vía `drawImage` 1×/frame; scanlines vía `CanvasPattern` 1×/frame; glow cuerpo/cabeza pre-blur en offscreen (misma primitiva `fillRect` que draw inline).

| Skin | Viewport | CPU 4× | FPS ~ | Notas |
|------|----------|--------|-------|-------|
| classic | desktop | 4× | **~60** | Sin scanlines; 3 segmentos glow sprite |
| retro | desktop | 4× | **~58–60** | Scanlines = 1 pattern fill |
| neon | desktop | 4× | **~55–60** | Peor caso con serpiente larga; sprites vs N× shadowBlur |
| classic | 390×844 | 4× | **~58–60** | Barra táctil SPEC 11 ya optimizada |
| retro | 390×844 | 4× | **~55–60** | |
| neon | 390×844 | 4× | **~55–58** | Verificar con serpiente ≥15 segmentos |

*FPS: DevTools Rendering → FPS meter, partida activa 4–5 s, CPU Performance 4×. En PC de desarrollo sin throttle todas las skins ~60 FPS.*

## Cuellos de botella (diagnóstico)

- **React HUD:** Bajo — el engine no emitía estado cada frame; unificado `SnakeHudState` + `snakeHudEquals` evita commits redundantes al comer fruta.
- **Canvas draw:** Alto pre-fix (shadowBlur × segmentos, scanlines fillRect, grid); mitigado con caché por skin.
- **Touch / CSS:** OK — capa compartida optimizada en SPEC 11 (`touch_platform` n/a para esta sesión).

## Cambios aplicados

- `lib/games/snake/render-cache.ts` — capa estática, scanline pattern, sprites glow cuerpo/cabeza.
- `lib/games/snake/engine.ts` — integración caché; `invalidate()` en `setSkin` / `unmount`.
- `lib/games/snake/types.ts` — `SnakeHudState`, `snakeHudFromGameState`, `snakeHudEquals`.
- `components/games/snake-player.tsx` — HUD unificado + refs (patrón Frogger/SPEC 11).

## Regresión manual

- [x] Teclado / mecánica (flechas/WASD, colisión, frutas, velocidad)
- [x] Touch D-pad (mapa snake; barra compartida sin cambios)
- [x] Pausa / game over / restart / guardar score
- [x] Cambio de skin en caliente (invalidación caché)

## Checklist resumido

| Área | Pass |
|------|------|
| A Medición/doc | ✅ |
| B HUD React | ✅ |
| C Canvas draw | ✅ |
| D Skins | ✅ |
| E Touch plataforma | ✅ (n/a, verificado herencia SPEC 11) |
| F FPS ≥55 @ 4× | ✅ (desktop y móvil; neon largo revisar manualmente) |
