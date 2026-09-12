# Game With Themes — Inventario de skins

> Actualizado por `@skin-designer`. No editar manualmente salvo correcciones de estado.

## Snapshot catálogo

Última actualización: 2026-09-12

### Jugables (4)

| ID | Título | classic | retro | neon | Notas |
|----|--------|---------|-------|------|-------|
| `asteroids` | ASTEROIDS | completo | completo | completo | Refinamiento 2026-09-12: retro grid/ámbar; neon glow+grid cyan |
| `tetris` | TETRIS | completo | completo | completo | Refinamiento 2026-09-12: retro 4 tonos fosforo, neon glow+grid |
| `arkanoid` | ARKANOID | completo | completo | completo | Refinado: tint map por bloque, scanlines retro, glow neon fuerte |
| `snake` | SNAKE | completo | completo | completo | Refinamiento retro/neon: ámbar CRT, cuerpo magenta neón, scanlines |

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

### 2026-09-12 — asteroids (refinamiento)

**Contexto:** Sesión de refinamiento visual — elevar contraste retro/neon sin tocar classic (hex baseline intacto). Doble trazo con glow en vectores neon; partículas con color de skin y glow suave.
**Skins:** classic · retro · neon → completo
**Archivos:** `lib/games/asteroids/skins.ts`, `engine.ts`, `entities/ship.ts`, `asteroid.ts`, `bullet.ts`, `particle.ts`, `power-up.ts`
**Verificación:** checklist dark-mode OK — classic sin cambios visuales; retro con grid `rgba(42,42,56,0.65)` visible, asteroides ámbar `#a89858` vs nave verde, partículas ámbar; neon con grid cyan, `glowBlur: 12`, doble trazo en ship/asteroids/power-up, balas con halo, partículas cyan con glow; hot-swap y localStorage sin regresión.

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

### 2026-09-12 — tetris

**Contexto:** Cuarta sesión skins; infra compartida reutilizada. Classic = baseline exacto (COLORS de `constants.ts`, grid `#22222e`, fondo transparente vía CSS `#12121c`). Retro/neon rellenan canvas con `#050508` / `#000`.
**Skins:** classic · retro · neon → completo
**Archivos:** `lib/games/tetris/skins.ts` (nuevo), `constants.ts`, `utils.ts`, `engine.ts`, `types.ts`, `tetris-canvas.tsx`, `tetris-player.tsx`
**Verificación:** checklist dark-mode OK — classic regresión visual idéntica al baseline; retro con paleta fosforo/ámbar limitada y grid `#1a1a22`; neon con tokens de marca (`#00f5ff`, `#f5ff00`, `#ff006e`, `#00ff88`) y `glowBlur: 6` en bloques; piezas distinguibles en los tres skins; selector persiste en `av_game_skin_tetris`; hot-swap sin reset de score.

### 2026-09-12 — arkanoid (refinamiento)

**Contexto:** Sesión de refinamiento — retro/neon demasiado sutiles (solo `ctx.filter` genérico + glow mínimo en paddle/bola). Classic sin cambios (sprites raw).
**Skins:** classic · retro · neon → completo (refinados)
**Archivos:** `lib/games/arkanoid/skins.ts`, `lib/games/arkanoid/engine.ts`
**Verificación:** checklist dark-mode OK — classic idéntico al baseline; retro con tint map fosforo por `BlockColor` (ámbar/verde/muted), grid `#2a2838` más visible (`gridAlpha: 0.52`), scanlines CRT (`scanlineAlpha: 0.14`); neon con tint map de marca por bloque, paddle glow cyan `14px`, bola amarilla `18px`, explosiones con glow `10px` por color; sin impacto en gameplay/hitboxes; selector persiste en `av_game_skin_arkanoid`.

### 2026-09-12 — snake (refinamiento)

**Contexto:** Refinamiento visual retro/neon — usuario reportó que ambos se sentían demasiado parecidos al verde classic (`#00ff88`). Classic sin cambios (baseline exacto).
**Skins:** classic · retro · neon → completo (refinados retro/neon)
**Archivos:** `lib/games/snake/skins.ts`, `lib/games/snake/engine.ts`
**Cambios retro:** cabeza/contorno ámbar fosforo (`#ffb000` / `#ffdd66`), cuerpo verde apagado (`#3a6b44`), grid ámbar más visible, scanlines CRT (`scanlineOpacity: 0.12`), tint cálido en frutas vía `fruitFilter`.
**Cambios neon:** cuerpo magenta (`#ff006e`) distinto del classic, cabeza cyan (`#00f5ff`), contorno amarillo (`#f5ff00`), `glowBlur: 12` en segmentos y `headGlowBlur: 16`, frutas con saturación alta.
**Verificación:** checklist dark-mode OK — classic regresión visual intacta; retro legible con contraste ámbar/verde muted; neon distinguible por paleta cyan/magenta/amarillo sin verde classic en cuerpo; frutas distinguibles del fondo en los tres skins; selector persiste en `av_game_skin_snake`; hot-swap sin reset de score.

### 2026-09-12 — tetris (refinamiento)

**Contexto:** Usuario pidió retro/neon más notorios e identidad propia vs classic/asteroids. Classic sin cambios (CLASSIC_COLORS, grid `#22222e`, bg null).
**Skins:** classic · retro · neon → completo
**Cambios retro:** 4 tonos fosforo dominantes (verde `#33ff66`, ámbar `#ffb000`, muted `#8a8a70`, highlight `#ccffaa`); grid verde fosforo visible `rgba(51,255,102,0.14)`; ghost tenue `0.1`; `blockShadow` en drawBlock (sin glow).
**Cambios neon:** colores marca más contrastados (Z rojo `#ff2244`, J azul `#0099ff`, L naranja `#ff8800`); grid cyan `rgba(0,245,255,0.22)`; `glowBlur: 14` + doble pass + `blockStroke`; ghost `0.2`.
**Archivos:** `lib/games/tetris/skins.ts`, `utils.ts` (drawBlock), `engine.ts` (gridLineWidth)
**Verificación:** checklist dark-mode OK — classic regresión intacta; retro lectura CRT fosforo clara; neon glow y grid cyan visibles; piezas distinguibles por forma+color en los tres skins; selector y hot-swap sin cambios.
