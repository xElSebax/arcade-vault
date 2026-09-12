# Game With Themes — Inventario de skins

> Actualizado por `@skin-designer`. No editar manualmente salvo correcciones de estado.

## Snapshot catálogo

Última actualización: 2026-09-12

### Jugables (4)

| ID | Título | classic | retro | neon | Notas |
|----|--------|---------|-------|------|-------|
| `asteroids` | ASTEROIDS | completo | completo | completo | Primera sesión skins; infra compartida creada |
| `tetris` | TETRIS | pendiente | pendiente | pendiente | |
| `arkanoid` | ARKANOID | pendiente | pendiente | pendiente | |
| `snake` | SNAKE | pendiente | pendiente | pendiente | |

### Placeholders (8)

Sin skins hasta integración vía `@spec-impl`. Al integrar un juego nuevo, añadir fila aquí con los tres skins en `pendiente`.

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

### Estados por skin

| Estado | Significado |
|--------|-------------|
| `pendiente` | Skin aún no implementado para ese juego |
| `en_progreso` | Sesión `@skin-designer` en curso |
| `completo` | Skin implementado y verificado en `/play/{id}` |

Skins obligatorios por juego: **classic** (default), **retro**, **neon**.

---

## Sesiones

### 2026-09-12 — asteroids

**Contexto:** Primera sesión de skins en el proyecto. Infra compartida creada (`lib/games/skins/types.ts`, `lib/player-skin.ts`, `components/game-skin-selector.tsx`, estilos `.skin-selector`). Classic = baseline exacto del engine pre-cambio.
**Skins:** classic · retro · neon → completo
**Archivos:** `lib/games/asteroids/skins.ts`, engine + entities refactorizados, `asteroids-canvas.tsx`, `asteroids-player.tsx`, `game-player-shell.tsx`, `app/arcade-vault.css`
**Verificación:** checklist dark-mode OK — classic regresión visual, retro con paleta fosforo/ámbar y grid sutil, neon con tokens de marca y `shadowBlur` en vectores; selector persiste en `av_game_skin_asteroids`; hot-swap sin reset de score.
