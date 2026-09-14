# Game Performance Booster — Inventario de rendimiento

> Actualizado por `@game-performance-booster`. No editar manualmente salvo correcciones de estado.

## Snapshot catálogo

Última actualización: 2026-09-14

### Jugables (5)

| ID | Título | hud_react | canvas_draw | render_cache | skins_cost | touch_platform | baseline_doc | fps_4x | verificado |
|----|--------|-----------|-------------|--------------|------------|----------------|--------------|--------|------------|
| `frogger` | FROGGER | completo | completo | completo | completo | completo | completo | completo | completo |
| `asteroids` | ASTEROIDS | pendiente | pendiente | pendiente | pendiente | n/a | pendiente | pendiente | pendiente |
| `tetris` | TETRIS | pendiente | pendiente | pendiente | pendiente | n/a | pendiente | pendiente | pendiente |
| `arkanoid` | ARKANOID | pendiente | pendiente | pendiente | pendiente | n/a | pendiente | pendiente | pendiente |
| `snake` | SNAKE | pendiente | pendiente | pendiente | pendiente | n/a | pendiente | pendiente | pendiente |

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
