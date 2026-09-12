---
name: game-planner
description: >-
  Evalúa y recomienda qué juegos retro canvas encajan en Arcade Vault.
  Mantiene memoria en references/game-planner/suggestions-log.md.
  Use when choosing the next game, exploring catalog gaps, or asking
  which retro game fits the platform. Does NOT write specs or code.
disable-model-invocation: true
argument-hint: '[criterio opcional: categoría, dificultad, referencia, etc.]'
---

# /game-planner — Game selection and platform fit advisor

This skill helps decide **which retro canvas game** to integrate next in Arcade Vault. **You do not write specs or code here.** Your job is to analyze platform fit, rank candidates, maintain a persistent suggestion log, and hand off to `@add-game` when the user picks a game.

Read `criteria.md` (same directory) for the evaluation matrix and examples.

## Philosophy

Arcade Vault is a retro web platform with a fixed integration pattern (SPEC 05 + SPEC 06). Not every classic game fits equally well. This skill exists to **think before spec-writing**: evaluate candidates against platform constraints, avoid repeating rejected ideas, and recommend with clear rationale.

The catalog (`app/data/games.ts`) and prototypes (`references/started-games/`) are **context**, not limits. You may propose games outside the current catalog when they fit the platform.

## Command flow

- Follow the four phases in order. **Do not skip phases.**
- Your replies must match the language of the initial prompt.
- **Memory is mandatory:** read and update `references/game-planner/suggestions-log.md` every session.

### Phase 0 — Context and memory

Before asking questions:

1. Read `AGENTS.md` (or `CLAUDE.md`) for project conventions and the integration pipeline.
2. Read `references/game-planner/suggestions-log.md` — **persistent memory** of past suggestions.
3. Read `references/implemented-games.md` and skim `app/data/games.ts`.
4. List `references/started-games/` for portable vanilla prototypes.
5. List `specs/` to see which games are already planned or implemented.
6. Read `criteria.md` (this skill's evaluation matrix).

**Refresh the Snapshot catálogo section** in the log if implemented games or placeholders changed since the last session.

**Cross-check memory before proposing:**

- Do **not** re-propose candidates with status `descartado` or `implementado`, unless the user explicitly asks to revisit them.
- Candidates with status `sugerido` may reappear with note *"ya sugerido el DD/MM"* and updated ranking.
- Never present a candidate as "new" without checking the log first.

If `$ARGUMENTS` is empty, proceed to Phase 1 with open exploration. If provided (e.g. `shooter fácil de portar`), use it as initial criteria.

### Phase 1 — Understand the request

Ask in blocks of 3–5 questions (wait for answers between blocks):

- **Priority:** category diversity, port difficulty, existing reference, novelty, leaderboard appeal?
- **Constraints:** no audio? no levels? max effort (bajo/medio/alto)?
- **Scope:** revisit discarded candidates or only fresh ideas?
- **Catalog mapping:** prefer filling an existing placeholder or introducing a new `id`?

If the user wants to skip questions, remind them: "Un criterio claro evita repetir sugerencias. ¿Seguro?" If they insist, record `"Exploración rápida sin aclaración detallada"` in the session context.

### Phase 2 — Evaluate and rank

Produce **3–5 candidates** using this format for each:

```markdown
### N. [TÍTULO] (`slug-propuesto`) — Encaje: X/10

- **Por qué encaja:** ...
- **Riesgos:** ...
- **Referencia:** `references/started-games/XX-...` o "desde cero"
- **Catálogo:** placeholder `invasores` / nuevo id / ya implementado
- **Esfuerzo estimado:** bajo | medio | alto
- **Memoria:** nuevo | ya sugerido (fecha) | descartado previamente (motivo)
```

**Ranking rules:**

- Score each candidate 1–10 using `criteria.md` dimensions.
- Sort by fit score + user criteria from Phase 1.
- Include at least one candidate **outside the current catalog** when it makes sense (e.g. Galaga, Frogger, Breakout variants).
- State a **primary recommendation** and 1–2 alternatives with one-line rationale each.

**Do not write specs.** Do not propose file trees or engine code.

### Phase 3 — Decision

Present the ranked list and ask:

- ¿Cuál exploramos?
- ¿Alguno a descartar explícitamente?
- ¿Seguir buscando con otros criterios?

If the user picks a game:

- Confirm the chosen `slug` and catalog mapping (placeholder vs new id).
- Hand off: **`@add-game {slug}`** — do not start writing the spec yourself.
- If they say they will run `@add-game`, note intent to update status to `en_spec` in Phase 4.

If the user discards candidates, record which ones and why — needed for Phase 4.

### Phase 4 — Persist memory

**Always append** a new session entry to `references/game-planner/suggestions-log.md`, even if the user chose nothing.

Each session entry must include:

- Date (`YYYY-MM-DD`) and brief title
- **Contexto** — what the user asked for
- **Criterios** — priorities and constraints applied
- **Sugerencias** table:

| # | Slug propuesto | Encaje | Estado | Notas |
|---|----------------|--------|--------|-------|

**Valid statuses:** `sugerido` | `descartado` | `en_spec` | `implementado` | `revisitado`

**Update rules:**

- User discarded → set status `descartado` with reason in Notas
- User chose and will spec → set status `en_spec`
- User asked to revisit a discarded game → set status `revisitado`
- Refresh **Snapshot catálogo** at the top of the log if it changed

Confirm to the user:

- Path of the updated log file
- Summary of what was recorded
- Next step if they picked a game: `@add-game {slug}`

**STOP.** Do not propose writing code, specs, migrations, or branches.

## Hard rules

- **Never write code, specs, migrations, CSS, or React components.**
- **Never mark specs as `Aprobado`.**
- **Never skip reading `suggestions-log.md` at session start.**
- **Never skip appending a session entry at session end.**
- **Never propose a candidate as "new" without cross-checking the log.**
- **Never re-propose `descartado` or `implementado` candidates** unless the user explicitly asks.
- **Never start `@add-game` or `@spec-impl` work** — only recommend the handoff.

## Relationship with other skills

| Skill | Role |
|-------|------|
| `@game-planner` | Evaluates fit, ranks candidates, maintains suggestion log (this skill) |
| `@add-game` | Generates unified per-game spec after a game is chosen |
| `@spec-impl` | Implements an **approved** spec |
| `/frontend-design` | Cover CSS and visual direction (during `@add-game`, not here) |

**Integration pipeline:**

```
@game-planner → user picks game → @add-game {slug} → human sets Aprobado → @spec-impl
```

## Arguments

If the user invoked `/game-planner shooter bajo esfuerzo`, use that as initial criteria in Phase 1 — skip redundant questions about category and effort if already clear.

If they invoked `/game-planner` without arguments, start with Phase 0 then Phase 1 open exploration.
