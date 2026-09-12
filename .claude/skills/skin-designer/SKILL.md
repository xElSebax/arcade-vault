---
name: skin-designer
description: >-
  Configura skins classic/retro/neon para un juego canvas de Arcade Vault a la vez.
  Lee references/skin-designer/game-with-themes.md e implementa solo el juego indicado.
  Use when applying visual themes to a playable game. One game per session.
disable-model-invocation: true
argument-hint: <slug del juego, ej. asteroids, tetris, snake, arkanoid>
---

# /skin-designer — Per-game canvas skin implementation

This skill applies **three visual skins** — **classic** (default), **retro**, and **neon** — to **one game at a time** in Arcade Vault. **You implement application code** for the requested game only. Maintain inventory in `references/skin-designer/game-with-themes.md`.

Read `palette-guide.md` and `dark-mode-checklist.md` (same directory) before defining tokens and before sign-off.

## Philosophy

Skins change **visual tokens only** (colors, optional glow, sprite tints). Gameplay, hitboxes, scoring, and leaderboard integration stay unchanged. The platform CRT shell is dark; every skin must look good on a black canvas — not on a light site theme.

**One game per session.** If the user says `@skin-designer` without a slug, ask which game. Do not batch-implement all four playables unless they explicitly request a catalog audit (read-only update to the reference file).

## Command flow

- Follow the five phases in order. **Do not skip phases.**
- Your replies must match the language of the initial prompt.
- **Memory is mandatory:** read and update `references/skin-designer/game-with-themes.md` every session.

### Phase 0 — Context and memory

Before implementing:

1. Read `AGENTS.md` (or `CLAUDE.md`) for project conventions and game integration pattern.
2. Read `references/skin-designer/game-with-themes.md` — **persistent inventory** of skin coverage.
3. Read `references/implemented-games.md` and confirm the target slug is playable (or explicitly requested placeholder).
4. Read `palette-guide.md` and `dark-mode-checklist.md`.
5. Read the target game's engine under `lib/games/{slug}/` and its `components/games/{slug}-*.tsx` pair.
6. Skim `app/arcade-vault.css` for brand tokens (neon skin).
7. Use `/frontend-design` when designing the skin selector UI (first session that creates shared UI).

**Cross-check before coding:**

- Resolve `$ARGUMENTS` to a single catalog `id` (e.g. `tetris`).
- If `$ARGUMENTS` is empty, ask: «¿Qué juego? (`asteroids`, `tetris`, `arkanoid`, `snake`)»
- If status is already `completo` for all three skins, confirm with the user before rework.

### Phase 1 — Confirm game

- Lock **one** `slug` for the session.
- Record intent in session notes (do not mark `completo` yet).
- **Do not** modify other games' engines in this session.

Optional: set the row's skins to `en_progreso` in the snapshot table while working.

### Phase 2 — Audit current visuals

For the chosen game only:

- List hardcoded colors / sprite usage in engine and entities.
- Map them to **classic** tokens (baseline = today's look).
- Draft **retro** and **neon** token tables using `palette-guide.md`.
- Present a short token summary to the user if they asked for review; otherwise proceed in fast mode.

### Phase 3 — Shared infrastructure (if missing)

Create **once** for the whole project (skip files that already exist):

| File | Purpose |
|------|---------|
| `lib/games/skins/types.ts` | `GameSkinId`, `DEFAULT_GAME_SKIN`, `GAME_SKINS` |
| `lib/player-skin.ts` | `readGameSkin`, `writeGameSkin`, `useGameSkin` — key `av_game_skin_{gameId}` |
| `components/game-skin-selector.tsx` | CLÁSICO · RETRO · NEÓN segmented control |
| `app/arcade-vault.css` | `.skin-selector` styles |
| `components/game-player-shell.tsx` | Optional props: `skin`, `onSkinChange` |

Extend engine API (convention):

```ts
setSkin(skin: GameSkinId): void;
getSkin(): GameSkinId;
```

### Phase 4 — Implement game skins

For **`lib/games/{slug}/` only**:

1. Add `skins.ts` with `SKINS: Record<GameSkinId, …>`.
2. Refactor engine/entities to read active tokens (not hardcoded hex).
3. Wire `{slug}-canvas.tsx` and `{slug}-player.tsx`: `useGameSkin(game.id)`, pass to engine, render selector via shell.
4. Run `npm run lint` on touched files.
5. Verify manually per `dark-mode-checklist.md` on `/play/{slug}`.

**Game-specific notes:**

- **asteroids** — vector strokes; neon may use `shadowBlur`.
- **tetris** — swap `COLORS` array + grid per skin.
- **snake** — body/head/grid tokens; keep fruit sprites unless tint is trivial.
- **arkanoid** — classic = raw sprites; retro/neon = draw-time tint/filter.

### Phase 5 — Persist memory

**Always update** `references/skin-designer/game-with-themes.md`:

1. Set **Snapshot catálogo → Última actualización** to today's date.
2. Update the row for `{slug}`: each skin column → `completo` (or `parcial` if documented gap).
3. **Append** a session entry under `## Sesiones`:

```markdown
### YYYY-MM-DD — {slug}

**Contexto:** …
**Skins:** classic · retro · neon → completo
**Archivos:** lista breve
**Verificación:** checklist dark-mode OK / notas
```

Confirm to the user:

- Path of the updated reference file
- Which skins are now complete
- Files changed
- Next game only if they ask

**STOP** after one game unless the user explicitly requests another in the same session.

## Hard rules

- **Never implement skins for multiple playables in one session** without explicit user request listing each slug.
- **Never skip reading `game-with-themes.md` at session start.**
- **Never skip updating `game-with-themes.md` at session end** when code was written.
- **Never mark specs as `Aprobado`.**
- **Never change gameplay logic** for skin swaps.
- **classic must match pre-change baseline** unless the user asks to redefine classic.

## Catalog audit mode

If the user asks only for status (no implementation):

- Read all engines and update the snapshot table accurately.
- Do not write game code.
- Append a short session note: «Auditoría sin implementación».

## Relationship with other skills

| Skill | Role |
|-------|------|
| `@skin-designer` | Per-game skin implementation (this skill) |
| `@add-game` / `@spec-impl` | New game integration — add row to `game-with-themes.md` with skins `pendiente` |
| `/frontend-design` | Skin selector and HUD aesthetics |
| `@game-planner` | Unrelated to skins — picks next game to integrate |

**Typical flow:**

```
@skin-designer asteroids → verify → @skin-designer tetris → …
```

## Arguments

`@skin-designer tetris` → Phase 1 uses `tetris` immediately.

`@skin-designer` → ask which playable to skin first.

`@skin-designer audit` → catalog audit mode only.
