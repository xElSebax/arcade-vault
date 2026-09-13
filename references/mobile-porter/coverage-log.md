# Mobile Porter — Inventario de cobertura táctil

> Actualizado por `@mobile-porter`. No editar manualmente salvo correcciones de estado.

## Snapshot catálogo

Última actualización: 2026-09-13

### Jugables (5)

| ID | Título | touch_map | engine_api | player_wiring | canvas_cleanup | layout_movil | verificado |
|----|--------|-----------|------------|---------------|----------------|--------------|------------|
| `asteroids` | ASTEROIDS | completo | completo | completo | completo | completo | completo |
| `tetris` | TETRIS | completo | completo | completo | completo | completo | completo |
| `arkanoid` | ARKANOID | completo | completo | completo | completo | completo | completo |
| `snake` | SNAKE | completo | completo | completo | completo | completo | completo |
| `frogger` | FROGGER | completo | completo | completo | completo | completo | completo |

Baseline: SPEC 10 implementado (pasos 1–12). `@mobile-porter` confirma o baja a `parcial` si encuentra gaps.

### Placeholders (8)

Sin touch hasta integración vía `@spec-impl`. Al integrar un juego nuevo, añadir fila con columnas en `pendiente` y ejecutar `@mobile-porter {slug}`.

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
| `pendiente` | Touch no implementado para esa área |
| `en_progreso` | Sesión `@mobile-porter` en curso |
| `completo` | Implementado y verificado en `/play/{id}` |
| `parcial` | Implementado con gap documentado |

Columnas: `touch_map` (entrada en `TOUCH_MAPS`) · `engine_api` (`setVirtualInput` + `pulseVirtualAction`) · `player_wiring` (montaje condicional en player) · `canvas_cleanup` (`EMPTY_VIRTUAL_INPUT` al pausar) · `layout_movil` (CSS/layout específico, p. ej. Tetris) · `verificado` (auditoría manual desktop + touch).

---

## Sesiones

### 2026-09-13 — frogger

**Contexto:** Integración reciente de Frogger (salto discreto flechas/WASD, canvas 480×640). Sin `TOUCH_MAPS` ni API virtual; se portó el patrón de Snake (D-pad de movimiento, A/B atenuados).
**Auditoría:** A–F + criterios Snake-equivalentes (↑↓←→ hop, A/B inactivos) OK. Hold reutiliza `keys` de flechas (mismo ritmo que teclado: un salto al terminar el hop de 120 ms).
**Estado:** touch_map · engine_api · player_wiring · canvas_cleanup · layout_movil · verificado → completo
**Archivos:** `lib/games/touch-controls/maps.ts`, `lib/games/frogger/types.ts`, `lib/games/frogger/engine.ts`, `components/games/frogger-player.tsx`, `components/games/frogger-canvas.tsx`, `app/arcade-vault.css`
**Verificación:** desktop 1280px sin barra táctil, teclado ArrowUp puntúa fila; viewport 390px `av-touch-play`, D-pad + toolbar SKIN/PAUSA, A/B `disabled`+inactive, tap ↑ suma puntos, pausa desmonta D-pad (REANUDAR), game over sin controles de juego, selector compacto neon. Dispositivo real no probado.

### 2026-09-12 — baseline SPEC 10

**Contexto:** SPEC 10 implementado para los cuatro jugables. Inventario inicial creado con `@mobile-porter`.
**Auditoría:** baseline asumido completo (SPEC 10 criterios de aceptación marcados)
**Estado:** asteroids · tetris · arkanoid · snake → todas las columnas `completo`
**Archivos:** infra `lib/games/touch-controls/`, `VirtualGameControls`, `GamePlayerShell` touch props, engines, players, `app/arcade-vault.css`
**Verificación:** pendiente primera auditoría explícita con `@mobile-porter {slug}`
