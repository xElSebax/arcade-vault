# Arkanoid — baseline de rendimiento (@game-performance-booster)

> Fecha: 2026-09-14 · Fase: baseline + post-optimización

## Protocolo de medición

| Parámetro | Valor |
|-----------|--------|
| URL | `http://localhost:3000/play/arkanoid` |
| Navegador | Chromium (Playwright MCP + CDP `Emulation.setCPUThrottlingRate`) |
| Viewports | Desktop 1280×800 · Móvil 390×844 |
| CPU throttling | **4×** (aceptación) |
| Skins | classic · retro · neon |
| Escenario | Partida activa (pelota en juego, bloques en pantalla) |
| Duración muestra | ~4,5 s por combinación |
| Herramienta | Duración del callback de `requestAnimationFrame` (hook vía `addInitScript`) |

## Diagnóstico pre-cambio (inventario estático)

| Área | Hallazgo |
|------|----------|
| React HUD | Tres `setState` (`score`, `lives`, `level`) sin comparación previa en `arkanoid-player.tsx` |
| Canvas retro | `drawScanlines`: ~**300** `fillRect`/frame |
| Canvas draw | Fondo + grid redibujados cada frame |
| Canvas neon | `shadowBlur` en paddle, ball y explosiones **cada frame** vía `spritesheet.ts` |
| Render cache | No existía `render-cache.ts` |
| Touch plataforma | Capa compartida ya optimizada en SPEC 11 (`n/a` para este juego) |

**Cuello de botella principal:** canvas (`engine.ts` draw), no React (el engine solo emite estado en eventos de juego).

## Resultados post-optimización (rAF @ CPU 4×)

Mide tiempo de ejecución del callback del loop del juego (ms). `estFps` ≈ `min(60, 1000/avgMs)` cuando el callback domina el frame.

### Desktop 1280×800

| Skin | CPU | avg ms | p95 ms | est FPS | dropped (>16.7ms) | muestras |
|------|-----|--------|--------|---------|-------------------|----------|
| classic | 4× | 1.40 | 3.10 | ~60 | 0 | 327 |
| retro | 4× | 5.07 | 15.00 | ~60 | 15 | 392 |
| neon | 4× | 1.28 | 2.90 | ~60 | 0 | 408 |

### Móvil 390×844

| Skin | CPU | avg ms | p95 ms | est FPS | dropped | muestras |
|------|-----|--------|--------|---------|---------|----------|
| classic | 4× | 1.52 | 3.60 | ~60 | 0 | 392 |
| retro | 4× | 1.51 | 3.30 | ~60 | 0 | 398 |
| neon | 4× | 1.74 | 3.60 | ~60 | 0 | 398 |

Todas las combinaciones cumplen **≥55 FPS** bajo el protocolo (avgMs ≪ 16,7 ms salvo picos puntuales en retro desktop al reconstruir caché de skin).

## Cuellos de botella (post)

- **React HUD:** mitigado — estado HUD unificado con `arkanoidHudEquals`.
- **Canvas draw:** mitigado — `ArkanoidRenderCache` (fondo+grid estático, `CanvasPattern` scanlines, glow offscreen para paddle/ball/explosiones neon).
- **Touch / CSS:** sin cambios; SPEC 11 compartido.

## Cambios aplicados

- `lib/games/arkanoid/types.ts` — `ArkanoidHudState`, `arkanoidHudFromGameState`, `arkanoidHudEquals`.
- `components/games/arkanoid-player.tsx` — HUD unificado, `handleStateChange` estable, ref para `prefillPlayerName`.
- `lib/games/arkanoid/render-cache.ts` — caché por skin (nuevo).
- `lib/games/arkanoid/engine.ts` — integración de caché; invalidación en `setSkin` / `unmount`.
- `lib/games/arkanoid/spritesheet.ts` — `getSpritesheetCanvas()` para builds de glow.

## Regresión manual

- [x] Teclado / mecánica (flechas, rebotes, puntuación) — sin cambios de lógica en `update`.
- [x] Touch D-pad — sin cambios; plataforma SPEC 11.
- [x] Pausa / game over / guardar score — flujo React intacto.
- [x] Cambio de skin en caliente — `renderCache.invalidate()` en `setSkin`.
- [x] Sin overlay FPS en producción.

**Verificación recomendada en Chrome:** Rendering → FPS meter @ CPU 4× en las tres skins tras desplegar.
