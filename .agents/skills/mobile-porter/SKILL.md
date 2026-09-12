---
name: mobile-porter
description: >-
  Audita y corrige la experiencia móvil (touch play + layout CRT) de un juego
  jugable de Arcade Vault a la vez. Lee references/mobile-porter/coverage-log.md
  e implementa solo el juego indicado. Use when fixing or verifying mobile touch
  controls on /play/{slug}. One game per session.
disable-model-invocation: true
argument-hint: <slug del juego, ej. asteroids, tetris, snake, arkanoid>
---

# /mobile-porter — Per-game mobile touch audit and fixes

This skill audits and fixes **mobile touch play** for **one playable game at a time** in Arcade Vault. **You implement fixes** when gaps are found. Maintain inventory in `references/mobile-porter/coverage-log.md`.

Read `touch-integration-guide.md` and `mobile-game-checklist.md` (same directory) before auditing. Canonical spec: `specs/10-controles-tactiles-movil.md`.

## Philosophy

Mobile play is a **layer on top of desktop keyboard** — never a replacement. Touch controls use an explicit engine API (`setVirtualInput`, `pulseVirtualAction`), not synthetic keyboard events. The CRT shell, virtual D-pad + A/B bar, and per-game touch maps are unified across all four playables.

**One game per session.** If the user says `@mobile-porter` without a slug, ask which game. Do not batch-audit all four playables unless they explicitly request a catalog audit (read-only update to the reference file).

**Scope:** touch play on `/play/{slug}` only. Do not modify landing, library, hall of fame, about, or other site pages.

## Command flow

- Follow the five phases in order. **Do not skip phases.**
- Your replies must match the language of the initial prompt.
- **Memory is mandatory:** read and update `references/mobile-porter/coverage-log.md` every session.

### Phase 0 — Context and memory

Before auditing:

1. Read `AGENTS.md` (or `CLAUDE.md`) for project conventions and game integration pattern.
2. Read `specs/10-controles-tactiles-movil.md` — canonical touch play spec.
3. Read `references/mobile-porter/coverage-log.md` — **persistent inventory** of mobile coverage.
4. Read `touch-integration-guide.md` and `mobile-game-checklist.md`.
5. Read `references/implemented-games.md` and confirm the target slug is playable.
6. Read the target game's touch wiring:
   - `lib/games/touch-controls/maps.ts` (entry for slug)
   - `lib/games/{slug}/engine.ts` (`setVirtualInput`, `pulseVirtualAction`)
   - `components/games/{slug}-player.tsx` (conditional mount)
   - `components/games/{slug}-canvas.tsx` (`EMPTY_VIRTUAL_INPUT` on pause)
   - Relevant CSS in `app/arcade-vault.css` (touch bar, game-specific layout)

**Cross-check before coding:**

- Resolve `$ARGUMENTS` to a single catalog `id` (e.g. `tetris`).
- If `$ARGUMENTS` is empty, ask: «¿Qué juego? (`asteroids`, `tetris`, `arkanoid`, `snake`)»
- If status is already `completo` for all columns, confirm with the user before rework.

### Phase 1 — Confirm game

- Lock **one** `slug` for the session.
- Record intent in session notes (do not mark `completo` yet).
- **Do not** modify other games' touch wiring in this session.

Optional: set the row's status to `en_progreso` in the snapshot table while working.

### Phase 2 — Audit

For the chosen game only, walk through `mobile-game-checklist.md`:

- Sections A–F (general + game-specific criteria).
- Note each ✅ / ❌ with file/line reference for failures.
- Present a short audit summary to the user if they asked for review; otherwise proceed in fast mode.

If all items pass and no code changes are needed, skip Phase 3 and go to Phase 4 (spot-check) then Phase 5.

### Phase 3 — Implement fixes

Apply **minimal diffs** only for confirmed gaps:

| Area | Typical files |
|------|---------------|
| Touch map | `lib/games/touch-controls/maps.ts` |
| Engine API | `lib/games/{slug}/engine.ts`, `types.ts` |
| Player wiring | `components/games/{slug}-player.tsx` |
| Pause cleanup | `components/games/{slug}-canvas.tsx` |
| Layout/CSS | `app/arcade-vault.css`, `{slug}-canvas.tsx` classes |
| Shared controls | `components/virtual-game-controls.tsx`, `game-player-shell.tsx` (only if bug affects all games) |

**Hard rules during implementation:**

- Never emit `KeyboardEvent` sintéticos.
- Mount `VirtualGameControls` only when `touchMode && !paused && !over`.
- Pulse-only actions (`fire`, `rotate`, `hard_drop`) must stay in `PULSE_ACTIONS`.
- Tetris hold repeat: `VIRTUAL_INPUT_REPEAT_MS = 33` with `dt` in **milliseconds**.
- Do not change gameplay mechanics (e.g. Arkanoid auto-launch stays).

### Phase 4 — Verify

1. Run `npm run lint` on touched files.
2. Manual check on `/play/{slug}`:
   - **Desktop:** keyboard works; no virtual controls visible.
   - **Touch mode:** DevTools mobile emulation or real device — bar, tap, hold, pause, game over.
3. Confirm no regression in `@skin-designer` compact selector on touch toolbar.

### Phase 5 — Persist memory

**Always update** `references/mobile-porter/coverage-log.md`:

1. Set **Snapshot catálogo → Última actualización** to today's date.
2. Update the row for `{slug}`: columns `touch_map`, `engine_api`, `player_wiring`, `canvas_cleanup`, `layout_movil`, `verificado`.
3. **Append** a session entry under `## Sesiones`:

```markdown
### YYYY-MM-DD — {slug}

**Contexto:** …
**Auditoría:** X/Y items OK
**Estado:** touch_map · engine_api · … → completo | parcial
**Archivos:** lista breve
**Verificación:** desktop OK · touch OK / notas
```

Confirm to the user:

- Path of the updated reference file
- Audit result summary
- Files changed (or «sin cambios de código»)
- Gaps remaining if `parcial`

**STOP** after one game unless the user explicitly requests another in the same session.

## Hard rules

- **Never audit or fix multiple playables in one session** without explicit user request listing each slug.
- **Never skip reading `coverage-log.md` at session start.**
- **Never skip updating `coverage-log.md` at session end** when an audit was performed.
- **Never mark specs as `Aprobado`.**
- **Never modify non-game site pages** (landing, library, hall of fame, about).
- **Never implement PWA, native fullscreen, or haptic feedback** — out of scope per SPEC 10.
- **Desktop keyboard must remain unchanged** unless fixing a touch-induced regression.

## Catalog audit mode

If the user asks only for status (no implementation):

- Read all four playables' touch wiring and update the snapshot table accurately.
- Do not write game code.
- Append a short session note: «Auditoría sin implementación».

## Relationship with other skills

| Skill | Role |
|-------|------|
| `@mobile-porter` | Per-game mobile touch audit and fixes (this skill) |
| `@spec-impl` | New game integration — add row to `coverage-log.md` with columns `pendiente` |
| `@add-game` | Spec generation — mobile deferred; handoff to `@mobile-porter` after impl |
| `@skin-designer` | Visual skins — re-run `@mobile-porter` if compact selector or touch layout breaks |
| SPEC 10 | Canonical reference for touch play architecture |

**Typical flow:**

```
@spec-impl NN-slug → @mobile-porter {slug} → verify touch
```

Or after engine/shell changes:

```
@mobile-porter tetris → fix gaps → verify
```

## Arguments

`@mobile-porter tetris` → Phase 1 uses `tetris` immediately.

`@mobile-porter` → ask which playable to audit first.

`@mobile-porter audit` → catalog audit mode only.
