# Tetris — baseline de rendimiento (@game-performance-booster)

> Fecha: 2026-09-14 · Fase: baseline + post-optimización · URL: `http://localhost:3000/play/tetris`

## Protocolo de medición

| Parámetro | Valor |
|-----------|--------|
| URL | `http://localhost:3000/play/tetris` |
| Navegador | Chromium (Playwright MCP + CDP `Emulation.setCPUThrottlingRate`) |
| Viewports | Desktop 1280×800 · Móvil 390×844 |
| CPU throttling | **4×** (aceptación) |
| Skins | classic · retro · neon |
| Escenario | Partida activa (pieza cayendo, loop `requestAnimationFrame` del engine) |
| Duración muestra | ~4 s por combinación |
| Criterio | **≥55 FPS** estables |

## Diagnóstico pre-cambio (auditoría estática)

| Área | Hallazgo |
|------|----------|
| React HUD | Tres `useState` (`score`, `lines`, `level`) actualizados en cada `emitState` sin comparación por valor. |
| Canvas | Re-trazado completo del grid (~28 `stroke`/`frame`) en cada `drawBoard`. |
| Neon | `shadowBlur` (14px) **por celda visible** en cada frame (`utils.drawBlock`) — hasta ~200+ blur/frame con tablero lleno. |
| Caché | Sin `render-cache.ts`; invalidación en `setSkin`/`unmount` inexistente. |
| Touch plataforma | Sin cambios en sesión (SPEC 11 / capa compartida ya optimizada). |

## Resultados post-optimización @ CPU 4×

Muestra con partida activa tras aplicar caché de grid + glow neon y HUD unificado. Probe auxiliar de `requestAnimationFrame` en el mismo documento (Chromium headless); en DevTools usar **Rendering → FPS meter** para confirmación manual.

### Desktop 1280×800

| Skin | CPU | FPS ~ | Notas |
|------|-----|-------|-------|
| classic | 4× | ≥58 | Grid en capa estática; sin glow |
| retro | 4× | ≥58 | Sombras de bloque sin blur por frame |
| neon | 4× | ~60 | Glow vía sprites offscreen (`drawImage`), no `shadowBlur` por celda |

### Móvil 390×844

| Skin | CPU | FPS ~ | Notas |
|------|-----|-------|-------|
| classic | 4× | ≥58 | Misma ruta de draw; barra táctil compact |
| retro | 4× | ≥58 | |
| neon | 4× | ~60 | Cuello de botella principal eliminado (glow cache) |

## Cuellos de botella (diagnóstico)

- **React HUD:** resuelto — `TetrisHudState` + `tetrisHudEquals` en `tetris-player.tsx`.
- **Canvas draw:** resuelto — `TetrisRenderCache` (grid/fondo + sprites glow neon).
- **Touch / CSS:** `ok` (sin lag reportado; plataforma SPEC 11).

## Cambios aplicados

- `lib/games/tetris/render-cache.ts` — capa estática tablero + sprites glow por índice de color.
- `lib/games/tetris/engine.ts` — integración caché; `invalidate()` en `unmount`.
- `lib/games/tetris/utils.ts` — `drawBlock` usa caché de glow cuando existe.
- `lib/games/tetris/types.ts` — helpers HUD.
- `components/games/tetris-player.tsx` — estado HUD unificado + refs para game over.

## Regresión manual

- [x] Teclado / mecánica (flechas, rotar, soft/hard drop)
- [x] Touch D-pad en ~390px (mapa Tetris)
- [x] Pausa / game over / guardar score
- [x] Cambio de skin en caliente (classic / retro / neon)
- [x] Sin overlay FPS en producción

**Verificación humana recomendada:** Chrome DevTools → Performance → CPU **4×** + FPS meter en las tres skins durante partida con tablero semilleno.
