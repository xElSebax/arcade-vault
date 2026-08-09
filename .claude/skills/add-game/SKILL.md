---
name: add-game
description: >-
  Generates a unified per-game spec for Arcade Vault integration (engine,
  routes, CRT player, Supabase leaderboard) by merging patterns from
  SPEC 05 and SPEC 06. Use when adding a new game, porting from
  references/started-games/, or planning leaderboard wiring. Does NOT
  write application code — only produces specs/NN-slug.md for review.
disable-model-invocation: true
argument-hint: <game-slug or reference folder>
---

# /add-game — Unified game integration spec generator

This skill produces a **per-game spec** that merges platform integration (SPEC 05 — Asteroids pattern) and Supabase leaderboard wiring (SPEC 06). **You do not write application code here.** Your job is to clarify what will be built, develop the spec section by section, and save it to `specs/NN-{slug}.md` in `Borrador` state for human review. Implementation happens later via `@spec-impl`.

Read `template.md` (same directory) for the unified game-integration structure. Read `reference.md` for canonical patterns, file trees, and inherited defaults from specs 05 and 06.

## Prerequisite — read `/spec` first

**Before writing any spec file**, read the generic spec skill and its template. `@add-game` is a **specialization** of `@spec` for game integration — it inherits the spec-driven method and adds domain content from SPEC 05 and SPEC 06.

**Mandatory reads (Phase 0, step 1):**

1. `.claude/skills/spec/SKILL.md` — philosophy, question rhythm, section-by-section flow, hard rules, save procedure
2. `.claude/skills/spec/template.md` — base spec structure (header, scope, data model, plan, acceptance criteria, decisions, risks)
3. `specs/README.md` — naming conventions and valid states

**How the two templates relate:**

| Layer | File | Role |
|-------|------|------|
| Base (from `@spec`) | `.claude/skills/spec/template.md` | Global rules: one-sentence objective, explicit scope out, boolean acceptance criteria, no TODOs |
| Domain (this skill) | `.claude/skills/add-game/template.md` | Extra sections: Patrón de integración, engine API, Supabase seed, game-specific acceptance groups |

When writing sections, satisfy **both** templates. If `@spec` and `add-game/template.md` conflict on format, `@spec` wins for document hygiene; `add-game/template.md` wins for game-integration content.

Apply all **hard rules** from `.claude/skills/spec/SKILL.md` in addition to this skill's hard rules below.

## Philosophy

Each new game touches the engine, React shell, static routes, catalog, cover CSS, and leaderboard. SPEC 05 and SPEC 06 documented these patterns for Asteroids separately. This skill unifies them into **one reusable spec per game** so the human can review scope, decisions, and acceptance criteria before any code is written.

## Command flow

- Follow the four phases in order. **Do not skip phases.**
- Generated specs are written in **Spanish** (matches existing specs 05/06). Skill instructions and your questions may follow the user's language.
- Your replies must match the language of the initial prompt.

### Phase 0 — Context

Before asking questions:

1. **Read `/spec` skill** — `.claude/skills/spec/SKILL.md` and `.claude/skills/spec/template.md`, plus `specs/README.md`. Do not skip this step.
2. Read `AGENTS.md` (or `CLAUDE.md`) for project conventions.
3. List `specs/` to determine the next sequential number `NN`. Read at least the two most recent specs for project conventions (same as `@spec` Phase 1).
4. Read `specs/05-asteroids.md` and `specs/06-games-leaderboard-supabase.md` — **source of truth** for inherited game + leaderboard patterns.
5. Read `add-game/template.md` and `add-game/reference.md` (this skill's supporting files).
6. Skim the Asteroids gold standard if needed: `lib/games/asteroids/`, `components/games/asteroids-player.tsx`, `components/games/asteroids-canvas.tsx`.

If `$ARGUMENTS` is empty, ask the user which game they want to integrate (slug, catalog name, or reference folder).

### Phase 1 — Analyze inputs

From `$ARGUMENTS` (slug, reference path, or game name):

1. **Resolve catalog id** — look up `app/data/games.ts`. Note if the entry is a placeholder or missing.
2. **Detect reference path** — check `references/started-games/`. Auto-map common aliases:

   | User says | Reference folder | Catalog `id` |
   |-----------|------------------|----------------|
   | asteroids | `02-asteroids` | `asteroids` |
   | tetris, caida | `03-tetris` | `caida` |
   | arkanoid, bloque-buster | `04-arkanoid` | `bloque-buster` |

3. **If reference exists** — read `game.js`, `README.md`, `index.html`, and any `levels.js` or asset manifests. Extract for the spec:
   - Canvas dimensions
   - Controls (keyboard / mouse)
   - Entity classes and game state globals
   - Scoring rules, lives, levels, win/lose conditions
   - Internal HUD (if drawn on canvas)
   - Audio or assets to port (note paths, do not copy code into spec)
4. **If no reference** — record "engine from scratch" and flag canvas size, controls, and game-over logic as open questions.

**Do not write code.** Only gather facts for the spec.

### Phase 2 — Clarify through questions

Follow `@spec` Phase 2: ask in blocks of 3–5, wait for answers between blocks, use concrete questions with recommendations, and apply the same "when to stop asking" criteria from `.claude/skills/spec/SKILL.md`.

**Game-integration categories:**

- **Scope:** Audio? Touch/on-screen controls? Internal HUD in canvas? Assets to port from reference?
- **Catalog:** Reuse existing placeholder entry or new `id`? Cover CSS direction? (Suggest `/frontend-design` for cover decisions.)
- **Gameplay:** Controls, lives, levels, game-over condition, scoring rules (confirm or override reference analysis).
- **Leaderboard:** Default is Supabase wiring identical to Asteroids (`SUPABASE_GAMES`, `saveScore`, `usePlayerName`). Confirm or defer.
- **Out of scope:** Auth, realtime, tests, mobile, registry of engines — record explicit deferrals.

Stop when you can answer without assuming:

1. Which files will be created or changed?
2. What is the first implementation step and what is the last?
3. How do we verify the feature is finished?

If the user wants to skip questions, remind them: "Questions now save hours later. Are you sure?" If they insist, record `"Definición rápida sin aclaración detallada"` in the Decisions section.

### Phase 3 — Develop the spec section by section

Follow `@spec` Phase 3 workflow and `add-game/template.md` structure. **Do not generate the full spec in one shot.** Develop one section at a time, show it formatted in markdown, ask "Does this section stay like this or do you want to tweak it?", and only proceed after confirmation (same confirmation loop as `.claude/skills/spec/SKILL.md`).

**Section order:**

1. **Header** — `Estado: Borrador`, depends on SPEC 05 + SPEC 06, one-sentence objective
2. **Alcance** — In: game + leaderboard. Out: deferred items (explicit)
3. **Modelo de datos** — `games.ts` entry, engine API (`{Slug}Engine`, `{Slug}GameState`), Supabase seed SQL
4. **Patrón de integración** — File tree, layer diagram, integration checklist
5. **Plan de implementación** — Numbered steps; each leaves the system runnable
6. **Criterios de aceptación** — Catálogo, gameplay, HUD/shell, leaderboard, regresión, técnico
7. **Decisiones** — Inherited defaults + game-specific choices
8. **Riesgos** — Table with mitigations (skip if none)
9. **Lo que NO está en este spec** — Reinforcement

**Inherited defaults** (pre-fill unless the user overrides — see `reference.md`):

- Static routes: `app/games/{slug}/`, `app/play/{slug}/`, register in `STATIC_GAME_ROUTES`
- Dedicated `{Slug}Player` + `{Slug}Canvas` — **no** `if (game.id)` branch in `GamePlayer`
- Game over overlay inside CRT shell (`.crt-gameover`), **not** drawn on the engine canvas
- Reuse `saveScore` server action — no per-game insert action
- Add `{slug}` to `SUPABASE_GAMES` in `lib/data/leaderboard.ts` + SQL seed in `public.games`
- `onStateChange` callback + `usePlayerName()` patterns from Asteroids
- Engine API: `mount`, `unmount`, `pause`, `resume`, `reset`, `onStateChange`
- RLS on `scores` stays disabled (SPEC 06 final implementation)

### Phase 4 — Save the spec

When all sections are confirmed, follow `@spec` Phase 4 save procedure:

1. Determine `NN` from `specs/` (next sequential number).
2. Propose filename `specs/NN-{slug}.md` and **confirm with the user before writing** (same as `@spec`).
3. Write the file with `Estado: Borrador` (Spanish label; equivalent to `Draft` in `@spec`).
4. **Do not mark as `Aprobado`.** The human does that after re-reading.
5. **Seed `specs/.spec-config.yml` if missing** — same default as `@spec` Phase 4 step 6; never overwrite if it already exists.
6. Confirm to the user:
   - Path of the created file.
   - Reminder: change state to `Aprobado` manually after review.
   - If `.spec-config.yml` was created, mention `AutoCreateBranch` default.
   - Next step: `@spec-impl NN-{slug}` when ready to implement.
7. **STOP.** Do not propose writing code, migrations, CSS, or creating branches.

## Hard rules

Inherited from `@spec` (see `.claude/skills/spec/SKILL.md`):

- **Never write code during this command.** Only the spec `.md` file at the end.
- **Never propose implementing the spec after saving it.** The user runs `@spec-impl` when ready.
- **Never assume decisions the user did not confirm.** If information is missing, ask.
- **Never generate the full spec in a single response.** Section by section, with confirmation.
- **If the user wants to skip Phase 2**, apply the same warning and record it in Decisions (per `@spec`).

Additional rules for `@add-game`:

- **Never create Supabase migrations, React components, or engine files.**
- **Never skip reading `.claude/skills/spec/SKILL.md` and `spec/template.md` in Phase 0.**

## Relationship with other skills

| Skill | Role |
|-------|------|
| `@spec` | **Base method** — read first; `@add-game` extends it for game integration |
| `@add-game` | Generates per-game unified spec (this skill) |
| `@spec-impl` | Implements an **approved** spec |
| `/frontend-design` | Cover CSS and visual direction during Phase 2 |

## Arguments

If the user invoked `/add-game bloque-buster`, use `bloque-buster` as the initial slug and auto-detect `references/started-games/04-arkanoid/` as the reference. Confirm both with the user.

If they invoked `/add-game` without arguments, start by asking which game to integrate.
