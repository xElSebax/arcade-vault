---
name: game-performance-booster
description: >-
  Audita y optimiza rendimiento (FPS, HUD React, canvas draw, skins) de un juego
  jugable de Arcade Vault a la vez. Lee references/game-performance-booster/coverage-log.md
  e implementa solo el juego indicado. Use when /play/{slug} lags, shadowBlur hurts
  FPS, or React re-renders every frame. One game per session.
disable-model-invocation: true
argument-hint: <slug del juego, ej. frogger, asteroids, tetris, snake, arkanoid>
---

# /game-performance-booster — Per-game performance audit and fixes

This skill audits and optimizes **canvas game performance** for **one playable game at a time** in Arcade Vault. **You implement fixes** when gaps are found. Maintain inventory in `references/game-performance-booster/coverage-log.md`.

Read `performance-checklist.md` and `measurement-protocol.md` (same directory) before auditing. Canonical reference: `specs/11-rendimiento-frogger.md` and `references/performance-game-patterns.md`.

## Philosophy

Performance work is **measure first, then fix**. Acceptance: **≥55 FPS** stable in active play, classic / retro / neon, desktop and ~390px viewport, with Chrome DevTools CPU **4×** throttling.

**One game per session.** If the user says `@game-performance-booster` without a slug, ask which game. Do not batch-optimize all playables unless they explicitly request a catalog audit (read-only update to the reference file).

**Scope:** `/play/{slug}` HUD + engine draw + shared touch layer only when D-pad lag persists after canvas is healthy. Do not modify landing, library, hall of fame, about, or other site pages.

## Command flow

- Follow the six phases in order. **Do not skip phases.**
- Your replies must match the language of the initial prompt.
- **Memory is mandatory:** read and update `references/game-performance-booster/coverage-log.md` every session.

### Phase 0 — Context and memory

Before auditing:

1. Read `AGENTS.md` (or `CLAUDE.md`) for project conventions and game integration pattern.
2. Read `specs/11-rendimiento-frogger.md` — acceptance criteria and decisions.
3. Read `references/performance-game-patterns.md` — reusable HUD, canvas, and touch patterns.
4. Read `references/game-performance-booster/coverage-log.md` — **persistent inventory** of performance coverage.
5. Read `performance-checklist.md` and `measurement-protocol.md`.
6. Read `references/implemented-games.md` and confirm the target slug is playable.
7. Read the target game's performance-related files:
   - `components/games/{slug}-player.tsx`
   - `components/games/{slug}-canvas.tsx`
   - `lib/games/{slug}/engine.ts`, `render.ts`, `render-cache.ts` (if present), `types.ts`, `skins.ts`
   - `references/{slug}/performance-baseline.md` if it exists

**Cross-check before coding:**

- Resolve `$ARGUMENTS` to a single catalog `id` (e.g. `frogger`).
- If `$ARGUMENTS` is empty, ask: «¿Qué juego? (`frogger`, `asteroids`, `tetris`, `arkanoid`, `snake`)»
- If all columns are already `completo`, confirm with the user before rework (audit-only OK).

### Phase 1 — Confirm game

- Lock **one** `slug` for the session.
- Record intent in session notes (do not mark `completo` yet).
- **Do not** modify other games' engines in this session.

Optional: set the row's status to `en_progreso` in the snapshot table while working.

### Phase 2 — Baseline measurement

**Before changing game code** (unless user agreed to skip):

1. Follow `measurement-protocol.md`.
2. Create or update `references/{slug}/performance-baseline.md`.
3. Note bottlenecks: React vs canvas vs CSS touch.

If the game already has a post-SPEC-11 baseline (e.g. Frogger) and the user only wants verification, document «auditoría sin cambios» and proceed to Phase 3.

### Phase 3 — Audit

For the chosen game only, walk through `performance-checklist.md` sections A–F:

- Note each ✅ / ❌ with file/line or profiler evidence.
- Present a short audit summary to the user if they asked for review; otherwise proceed in fast mode.

If all items pass and FPS @ 4× meets target with no code changes needed, skip Phase 4 and go to Phase 5 (spot-check) then Phase 6.

### Phase 4 — Implement fixes

Apply **minimal diffs** only for confirmed gaps:

| Area | Typical files |
|------|---------------|
| HUD state | `lib/games/{slug}/types.ts`, `components/games/{slug}-player.tsx` |
| Render cache | `lib/games/{slug}/render-cache.ts`, `render.ts`, `engine.ts` |
| Skins cost | `lib/games/{slug}/skins.ts`, `render.ts` |
| Shared touch | `components/virtual-game-controls.tsx`, `app/arcade-vault.css` (only if checklist E fails) |
| Shell | `components/game-player-shell.tsx` (only if this game requires it) |

**Hard rules during implementation:**

- Never add an FPS overlay to production builds.
- Never permanently lower canvas resolution or remove skins to hit FPS.
- Never change gameplay mechanics disguised as performance.
- Glow cache primitives must match inline draw (`ellipse` not `fillRect` for round entities).
- Invalidate render cache on `setSkin` and `unmount`.
- Do not introduce a shared `RenderCache` across all engines.

### Phase 5 — Verify

1. Re-run `measurement-protocol.md`; update baseline with post-optimization section.
2. Walk checklist section F (regression).
3. Run `npm run lint` on touched files.
4. Manual check on `/play/{slug}`:
   - **Desktop:** keyboard, all three skins, pause, game over, save score.
   - **Mobile ~390px:** touch bar, D-pad responsiveness, skin change on toolbar.

### Phase 6 — Persist memory

**Always update** `references/game-performance-booster/coverage-log.md`:

1. Set **Snapshot catálogo → Última actualización** to today's date.
2. Update the row for `{slug}`: `hud_react`, `canvas_draw`, `render_cache`, `skins_cost`, `touch_platform`, `baseline_doc`, `fps_4x`, `verificado`.
3. **Append** a session entry under `## Sesiones`:

```markdown
### YYYY-MM-DD — {slug}

**Contexto:** …
**Auditoría:** X/Y items OK · FPS 4×: …
**Estado:** hud_react · canvas_draw · … → completo | parcial | pendiente
**Archivos:** lista breve
**Baseline:** references/{slug}/performance-baseline.md
**Verificación:** desktop OK · móvil OK / notas
```

Confirm to the user:

- Path of the updated reference file
- Baseline path
- Audit and FPS summary
- Files changed (or «sin cambios de código»)
- Gaps remaining if `parcial`

**STOP** after one game unless the user explicitly requests another in the same session.

## Hard rules

- **Never audit or fix multiple playables in one session** without explicit user request listing each slug.
- **Never skip reading `coverage-log.md` at session start.**
- **Never skip updating `coverage-log.md` at session end** when an audit was performed.
- **Never skip baseline documentation** when code was changed for performance.
- **Never mark specs as `Aprobado`.**
- **Never modify non-game site pages** (landing, library, hall of fame, about).
- **Never add E2E FPS tests** — out of scope per SPEC 11.
- **Gameplay and SPEC 10 touch behavior must remain correct** unless fixing touch-induced jank via platform layer.

## Catalog audit mode

If the user asks only for status (no implementation):

- Read all playables' HUD/render wiring and update the snapshot table accurately.
- Do not write game code unless a critical gap is explicitly approved.
- Append a short session note: «Auditoría sin implementación».

## Relationship with other skills

| Skill | Role |
|-------|------|
| `@game-performance-booster` | Per-game performance audit and fixes (this skill) |
| `@skin-designer` | Skins — run booster after heavy neon/retro draw exists |
| `@mobile-porter` | Touch wiring — booster fixes touch **CSS/React lag**, not missing maps |
| `@spec-impl-game` | After impl: skin-designer → mobile-porter → **game-performance-booster** |
| SPEC 11 | Canonical Frogger performance spec (pattern source) |

**Typical flow:**

```
@spec-impl-game NN-slug → … → @game-performance-booster {slug}
```

Or for an existing playable:

```
@game-performance-booster tetris → measure → fix → verify
```

## Arguments

`@game-performance-booster frogger` → Phase 1 uses `frogger` immediately.

`@game-performance-booster` → ask which playable to optimize first.

`@game-performance-booster audit` → catalog audit mode only.
