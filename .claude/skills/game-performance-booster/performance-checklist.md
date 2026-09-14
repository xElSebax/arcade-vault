# Checklist de rendimiento — por juego

> Recorrer en Fase 3. Marcar ✅ / ❌ con referencia a archivo o evidencia de profiler. Patrones: `references/performance-game-patterns.md`.

## A — Medición y documentación

| # | Criterio | Pass |
|---|----------|------|
| A1 | Existe `references/{slug}/performance-baseline.md` con mediciones pre-cambio (o referencia a spec previo) | |
| A2 | Mediciones incluyen CPU **4×** y viewport **~390px** como mínimo | |
| A3 | Las tres skins (classic / retro / neon) fueron probadas en partida activa | |
| A4 | Post-optimización: baseline actualizado con comparación antes/después | |

## B — HUD React (`components/games/{slug}-player.tsx`)

| # | Criterio | Pass |
|---|----------|------|
| B1 | Estado HUD unificado o setters que **no** actualizan si valores visibles no cambiaron | |
| B2 | `handleStateChange` estable (`useCallback` sin deps innecesarias) + refs para callbacks que no pintan UI | |
| B3 | Engine no fuerza re-render de React en cada frame del canvas (solo cambios de score, lives, level, phase, campos visibles del juego) | |
| B4 | Todos los campos visibles del HUD comparados (p. ej. tiempo, contadores secundarios) | |
| B5 | `GamePlayerShell` sin cambios salvo necesidad real del juego | |
| B6 | Canvas: `engineRef` / `onStateChangeRef` (patrón Asteroids) si aplica | |

## C — Draw canvas (`lib/games/{slug}/`)

| # | Criterio | Pass |
|---|----------|------|
| C1 | Sin `shadowBlur` / glow completo por entidad **cada frame** en neon/retro (caché o pre-blur) | |
| C2 | Scanlines retro vía `CanvasPattern` o equivalente, no cientos de `fillRect` por frame | |
| C3 | Capa estática (fondo, grid, terreno) en offscreen / `drawImage` 1× por frame si el juego lo permite | |
| C4 | `render-cache.ts` (o equivalente) con `invalidate()` en `setSkin` y `unmount` | |
| C5 | Sprites de glow usan la **misma primitiva** que el draw inline (`ellipse`/`arc` vs `fillRect`) | |
| C6 | Classic no degradado perceptiblemente; neon/retro siguen distinguibles (glow/scanlines presentes) | |
| C7 | No hay `RenderCache` genérico compartido entre engines (solo en carpeta del juego) | |

## D — Skins y coste visual

| # | Criterio | Pass |
|---|----------|------|
| D1 | Cambio de skin en caliente funciona; caché invalidada | |
| D2 | Retro y neon son los skins más costosos — priorizar optimización ahí | |
| D3 | Comparación visual rápida antes/después en los tres skins | |

## E — Controles táctiles (plataforma, SPEC 10)

> Solo auditar si hay lag al pulsar con canvas ya fluido. Fixes en `virtual-game-controls.tsx` / `arcade-vault.css` benefician **todos** los jugables.

| # | Criterio | Pass |
|---|----------|------|
| E1 | `--pressed` vía `classList`, sin `useState` por botón en cada toque | |
| E2 | Estilo pressed sin `box-shadow` con blur pesado ni `filter: brightness()` costoso en móvil | |
| E3 | `.av-touch-bar` sin `backdrop-filter` en viewport móvil (≤768px) | |
| E4 | D-pad responde sin lag perceptible en ~390px tras optimizar canvas | |

## F — Aceptación FPS y regresión

| # | Criterio | Pass |
|---|----------|------|
| F1 | **≥55 FPS** @ CPU 4×, partida activa, classic + retro + neon (desktop) | |
| F2 | **≥55 FPS** @ CPU 4×, partida activa, classic + retro + neon (~390px) | |
| F3 | Teclado: mecánica y puntuación intactas | |
| F4 | Pausa, game over, restart, guardar puntuación | |
| F5 | Sin overlay FPS en producción | |
| F6 | No se modificaron engines/skins de **otros** juegos (salvo plataforma táctil justificada) | |

## Resumen de sesión

- Total pass: \_\_ / \_\_
- Bloqueantes (❌ en F1–F2 o B1–B3): …
- Acción: implementar Fase 4 / solo documentar / `completo` sin cambios
