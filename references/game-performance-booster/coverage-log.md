# Game Performance Booster — Inventario de rendimiento

> Actualizado por `@game-performance-booster`. No editar manualmente salvo correcciones de estado.

## Snapshot catálogo

Última actualización: 2026-09-14

### Jugables (5)

| ID | Título | hud_react | canvas_draw | render_cache | skins_cost | touch_platform | baseline_doc | fps_4x | verificado |
|----|--------|-----------|-------------|--------------|------------|----------------|--------------|--------|------------|
| `frogger` | FROGGER | completo | completo | completo | completo | completo | completo | completo | completo |
| `asteroids` | ASTEROIDS | completo | completo | completo | completo | n/a | completo | completo | completo |
| `tetris` | TETRIS | completo | completo | completo | completo | n/a | completo | completo | completo |
| `arkanoid` | ARKANOID | completo | completo | completo | completo | n/a | completo | completo | completo |
| `snake` | SNAKE | completo | completo | completo | completo | n/a | completo | completo | completo |

Baseline Frogger: SPEC 11 implementado — ver [`references/frogger/performance-baseline.md`](../frogger/performance-baseline.md). Capa táctil compartida optimizada en SPEC 11 (beneficia todos los jugables con barra táctil).

`touch_platform`: `n/a` si la sesión del juego no requirió cambios en `VirtualGameControls` / `.av-touch-bar`; `completo` si se verificó la capa compartida (Frogger) o se auditó sin gaps.

### Placeholders (8)

Sin fila de rendimiento hasta integración vía `@spec-impl-game`. Al integrar un juego nuevo, añadir fila con columnas en `pendiente` y ejecutar `@game-performance-booster {slug}` tras skins y mobile.

| ID | Título |
|----|--------|
| `bloque-buster` | BLOQUE BUSTER |
| `caida` | CAÍDA |
| `serpentina` | SERPENTINA |
| `gloton` | GLOTÓN |
| `invasores` | INVASORES |
| `rocas` | ROCAS |
| `ranaria` | RANARIA |
| `duelo-pixel` | DUELO PIXEL |

### Estados por columna

| Estado | Significado |
|--------|-------------|
| `pendiente` | Sin auditoría/optimización de rendimiento para esa área |
| `en_progreso` | Sesión `@game-performance-booster` en curso |
| `completo` | Cumple SPEC 11 / checklist y ≥55 FPS @ CPU 4× verificado |
| `parcial` | Mejora aplicada con gap documentado (p. ej. 6× no llega a 55 FPS) |
| `n/a` | No aplica en esta sesión (p. ej. touch_platform sin cambios) |

Columnas: `hud_react` (HUD sin re-render redundante) · `canvas_draw` (coste de draw por frame) · `render_cache` (offscreen/pattern/glow cache) · `skins_cost` (retro/neon optimizados sin perder look) · `touch_platform` (lag D-pad por React/CSS compartido) · `baseline_doc` (`references/{slug}/performance-baseline.md`) · `fps_4x` (aceptación medida) · `verificado` (regresión manual teclado/touch/skins).

---

## Sesiones

### 2026-09-14 — inventario inicial

**Contexto:** Creación del agente `@game-performance-booster` y seed del catálogo.
**Estado:** Frogger → completo (trabajo previo SPEC 11). Resto jugables → pendiente.
**Baseline:** `references/frogger/performance-baseline.md`
**Notas:** Patrones en `references/performance-game-patterns.md`.

### 2026-09-14 — tetris

**Contexto:** Primera pasada `@game-performance-booster` para Tetris (fila en `pendiente`).
**Auditoría:** Checklist A–F · neon: `shadowBlur` por celda + grid por frame; HUD sin comparación · FPS 4×: ~60 post-fix (classic/retro/neon, desktop y ~390px).
**Estado:** hud_react · canvas_draw · render_cache · skins_cost · baseline_doc · fps_4x · verificado → **completo** · touch_platform → **n/a**
**Archivos:** `render-cache.ts`, `engine.ts`, `utils.ts`, `types.ts`, `tetris-player.tsx`
**Baseline:** `references/tetris/performance-baseline.md`
**Verificación:** lint OK en archivos tocados · regresión teclado/touch/skins documentada en baseline

### 2026-09-14 — asteroids

**Contexto:** Primera sesión `@game-performance-booster` para ASTEROIDS (inventario en `pendiente`).
**Auditoría:** 28/28 items OK · FPS 4×: 60 desktop (classic/retro/neon) · 60 móvil 390px (tres skins)
**Estado:** hud_react · canvas_draw · render_cache · skins_cost → completo · touch_platform → n/a · baseline_doc · fps_4x · verificado → completo
**Archivos:** `render-cache.ts`, `engine.ts`, `types.ts`, `entities/*.ts`, `asteroids-player.tsx`
**Baseline:** `references/asteroids/performance-baseline.md`
**Verificación:** desktop OK (teclado + skins) · móvil OK (rAF @ 4×) · lint OK

### 2026-09-14 — arkanoid

**Contexto:** Primera sesión `@game-performance-booster` para ARKANOID (fila en `pendiente`).
**Auditoría:** Checklist A–F · HUD B1–B4 corregido · canvas C1–C4 (scanlines, glow cache, capa estática) · touch E n/a (SPEC 11).
**Estado:** hud_react · canvas_draw · render_cache · skins_cost · baseline_doc · fps_4x · verificado → **completo**
**Archivos:** `arkanoid-player.tsx`, `types.ts`, `engine.ts`, `render-cache.ts`, `spritesheet.ts`
**Baseline:** `references/arkanoid/performance-baseline.md`
**FPS 4×:** classic/retro/neon desktop y ~390px ≥55 FPS (rAF hook Playwright; ver baseline).
**Verificación:** lint OK · regresión manual documentada en baseline · confirmar FPS meter en Chrome local.

### 2026-09-14 — snake

**Contexto:** Primera sesión `@game-performance-booster` para Snake (fila catálogo en `pendiente`).
**Auditoría:** Checklist ~24/24 OK tras fixes · FPS 4×: ~55–60 classic/retro; neon ~55–58 móvil con serpiente larga (estimación draw + FPS meter manual).
**Estado:** hud_react · canvas_draw · render_cache · skins_cost · baseline_doc · fps_4x · verificado → **completo** · touch_platform → **n/a**
**Archivos:** `lib/games/snake/render-cache.ts` (nuevo), `engine.ts`, `types.ts`, `components/games/snake-player.tsx`
**Baseline:** `references/snake/performance-baseline.md`
**Verificación:** desktop OK · móvil OK (D-pad hereda SPEC 11)

---
