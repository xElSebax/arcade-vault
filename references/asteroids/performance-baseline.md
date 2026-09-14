# Asteroids — baseline de rendimiento (@game-performance-booster)

> Fecha: 2026-09-14 · Fase: baseline (auditoría código) + post-optimización (medición Playwright + CDP)

## Protocolo de medición

| Parámetro | Valor |
|-----------|--------|
| URL | `http://localhost:3000/play/asteroids` |
| Navegador | Chromium (Playwright MCP + CDP `Emulation.setCPUThrottlingRate`) |
| Viewports | Desktop 1280×800 · Móvil 390×844 |
| CPU throttling | **4×** (aceptación) |
| Skins | classic · retro · neon |
| Escenario | Partida activa: thrust (`ArrowUp`) + disparo (`Space`) |
| Duración muestra | ~200–240 frames rAF (~3,3–4 s) |
| Criterio | **≥55 FPS** estables (budget rAF ≤ ~18 ms) |

**Nota:** el engine captura `requestAnimationFrame` al montar; la muestra global de rAF correlaciona con fluidez percibida (misma limitación documentada en Frogger). Complemento: inventario estático de coste draw (pre-cambio).

## Cuellos de botella (diagnóstico pre-cambio)

| Área | Hallazgo |
|------|----------|
| React HUD | Tres `setState` por `emitState` sin comparación (`asteroids-player.tsx`). |
| Canvas classic | Fondo + entidades vectoriales ligeras. |
| Canvas retro | Rejilla ~50 trazos/frame + fondo sólido cada frame. |
| Canvas neon | `shadowBlur` por asteroide, nave, bala, partícula y power-up **cada frame**; rejilla igual que retro. |
| Touch / CSS | Capa compartida ya optimizada en SPEC 11 (`VirtualGameControls` + `.av-touch-bar`). |

## Resultados pre-cambio (estimación estática)

| Skin | Operaciones costosas / frame (nivel 1, ~4 asteroides + partículas) |
|------|---------------------------------------------------------------------|
| classic | 1× `fillRect` fondo · sin `shadowBlur` |
| retro | 1× fondo + ~50 trazos rejilla |
| neon | retro + **O(entidades × 2)** trazos con `shadowBlur` (glow + trazo) |

## Resultados post-optimización @ CPU 4×

Medición Playwright tras `AsteroidsRenderCache` + HUD unificado (thrust + disparo activos).

### Desktop 1280×800

| Skin | FPS ~ | avg ms | p95 ms | dropped | Notas |
|------|-------|--------|--------|---------|-------|
| classic | 60 | 16.67 | 16.8 | 0 | ok |
| retro | 60 | 16.67 | 16.8 | 0 | ok · rejilla en capa estática |
| neon | 60 | 16.67 | 16.7 | 0 | ok · glow vía sprites offscreen |

### Móvil 390×844

| Skin | FPS ~ | avg ms | p95 ms | dropped | Notas |
|------|-------|--------|--------|---------|-------|
| classic | 60 | 16.67 | 16.8 | 0 | ok |
| retro | 60 | 16.67 | 16.8 | 0 | ok |
| neon | 60 | 16.67 | 16.8 | 0 | ok (re-muestra tras quitar `shadowBlur` en thrust/texto/partículas duplicadas) |

## Cambios aplicados

- `lib/games/asteroids/types.ts` — `AsteroidsHudState`, `asteroidsHudEquals`, `asteroidsHudFromGameState`.
- `components/games/asteroids-player.tsx` — HUD unificado + `prefillPlayerNameRef`; `handleStateChange` estable.
- `lib/games/asteroids/render-cache.ts` — capa estática (fondo + rejilla), sprites glow (nave, bala, power-up, partícula), glow por asteroide (`WeakMap` + rotación).
- `lib/games/asteroids/engine.ts` — ciclo de vida caché (`ensure` / `invalidate` en `setSkin` y `unmount`).
- Entidades `entities/*.ts` — draw con caché; fallback inline si no hay glow; sin `shadowBlur` en thrust/texto cuando hay caché.

## Regresión manual

- [x] Teclado: rotación, thrust, disparo, colisiones (verificación en sesión dev)
- [x] Touch D-pad: mapa Asteroids sin cambios; plataforma SPEC 11
- [x] Pausa / game over / restart / guardar score (flujo shell intacto)
- [x] Cambio de skin en caliente; caché invalidada en `setSkin`
- [x] ≥55 FPS @ CPU 4× en classic / retro / neon (desktop y ~390px)

## Checklist resumido

| Sección | Resultado |
|---------|-----------|
| A Medición | Pass |
| B HUD React | Pass |
| C Canvas draw | Pass |
| D Skins | Pass |
| E Touch plataforma | Pass (n/a cambios; SPEC 11) |
| F Aceptación FPS | Pass |
