# Game With Themes — Inventario de skins

> Actualizado por `@skin-designer`. No editar manualmente salvo correcciones de estado.

## Snapshot catálogo

Última actualización: 2026-09-12

### Jugables (4)

| ID | Título | classic | retro | neon | Notas |
|----|--------|---------|-------|------|-------|
| `asteroids` | ASTEROIDS | completo | completo | completo | Primera sesión skins; infra compartida creada |
| `tetris` | TETRIS | pendiente | pendiente | pendiente | |
| `arkanoid` | ARKANOID | completo | completo | completo | Sprites raw classic; retro/neon con filter draw-time |
| `snake` | SNAKE | completo | completo | completo | Tokens body/head/grid; sprites fruta sin cambio |

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

### 2026-09-12 — arkanoid

**Contexto:** Segunda sesión skins; reutiliza infra compartida de asteroids. Classic = sprites raw sin filter (`#000`). Retro/neon aplican `ctx.filter` en draw-time vía `spritesheet.ts`.
**Skins:** classic · retro · neon → completo
**Archivos:** `lib/games/arkanoid/skins.ts`, `engine.ts`, `spritesheet.ts`, `types.ts`, `arkanoid-canvas.tsx`, `arkanoid-player.tsx`
**Verificación:** checklist dark-mode OK — classic idéntico al baseline (sprites sin filter); retro con fondo `#050508`, grid sutil en área de bloques y filter sepia/hue fosforo; neon con saturación alta y glow cyan en paddle/bola; selector persiste en `av_game_skin_arkanoid`; hot-swap sin reset de score.

### 2026-09-12 — snake

**Contexto:** Segunda sesión de skins. Infra compartida reutilizada (sin recrear). Classic = baseline exacto del engine pre-cambio (`#0a0a12` bg, verde `#00ff88`, cabeza `#88ffbb`). Sprites de fruta sin modificación.
**Skins:** classic · retro · neon → completo
**Archivos:** `lib/games/snake/skins.ts` (nuevo), `lib/games/snake/engine.ts`, `lib/games/snake/types.ts`, `components/games/snake-canvas.tsx`, `components/games/snake-player.tsx`
**Verificación:** checklist dark-mode OK — classic regresión visual, retro con fosforo verde `#33ff66` y ámbar en contorno de cabeza, neon con cyan/magenta/amarillo de marca y `glowBlur: 8`; grid sutil en los tres skins; frutas distinguibles del fondo; selector persiste en `av_game_skin_snake`; hot-swap sin reset de score.
