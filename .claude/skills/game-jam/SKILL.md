---
name: game-jam
description: >-
  Genera specs completos de juegos retro temáticos en specs/game-jam/{slug}/.
  Dado un tema, propone variantes de gameplay y escribe al menos 2 archivos
  de spec completos listos para revisión. Use when brainstorming themed games
  or running a creative jam session. Does NOT write code or implement games.
disable-model-invocation: true
argument-hint: <tema del jam, ej. océano, neón, invierno>
---

# /game-jam — Themed game spec generator

This skill turns a **creative theme** into **complete game integration specs** for Arcade Vault. **You do not write application code here.** Your job is to interpret the theme, propose gameplay variants, and save at least two full spec documents under `specs/game-jam/{slug}/` for human review.

Read `theme-guide.md` (same directory) for variant design rules. Read `template.md` for the required spec structure. Reuse patterns from `@add-game` (SPEC 05 + SPEC 06).

## Philosophy

`@game-planner` picks from known classics; `@add-game` writes one spec interactively. `@game-jam` is for **creative exploration**: a theme (e.g. "océano", "neón") becomes one jam folder with **≥2 independent, complete specs** — same template as `specs/07-tetris.md`, different gameplay angles on the same theme. The human picks a variant, promotes it to `specs/NN-{slug}.md`, and runs `@spec-impl`.

## Command flow

- Follow the four phases in order. **Do not skip phases.**
- Generated specs are written in **Spanish** (matches specs 05–09).
- Your replies must match the language of the initial prompt.

### Phase 0 — Context and memory

Before asking questions:

1. Read `AGENTS.md` (or `CLAUDE.md`) for project conventions and integration pipeline.
2. Read `references/game-jam/sessions-log.md` — **persistent memory** of past jam sessions.
3. Read `specs/README.md` — naming, states, and game-jam promotion rules.
4. Read `.claude/skills/add-game/reference.md` — inherited defaults, file trees, anti-patterns.
5. Read canonical specs: `specs/05-asteroids.md`, `specs/07-tetris.md`, `specs/08-arkanoid.md`, `specs/09-snake.md` (at minimum Alcance through Criterios de aceptación).
6. Read `app/data/games.ts`, `references/implemented-games.md`, and `.claude/skills/game-planner/criteria.md`.
7. List `specs/game-jam/` to avoid duplicate folder slugs.
8. Read `theme-guide.md` and `template.md` (this skill's supporting files).

**Cross-check before proposing:**

- Do **not** duplicate implemented games: `asteroids`, `tetris`, `arkanoid`, `snake`.
- Do **not** reuse folder slugs already present in `specs/game-jam/` unless the user explicitly asks to revisit.
- Validate platform fit (canvas 2D, score, `GamePlayerShell`, Supabase leaderboard) using `criteria.md`.

If `$ARGUMENTS` is empty, ask the user for a theme before proceeding.

### Phase 1 — Interpret the theme

`$ARGUMENTS` = the jam theme (required).

Ask in one block of 3–5 optional questions (wait for answers unless user wants fast mode):

- **Category preference:** ARCADE, PUZZLE, SHOOTER, or open?
- **Effort:** bajo (simple loop) | medio (levels/entities) | alto (flag if risky)?
- **Catalog:** new `id` or fill an existing placeholder?
- **Reference:** port from `references/started-games/` or engine from scratch?
- **Variant count:** default 2; user may request 3.

If the user wants fast mode, remind them: "Sin aclaración, las variantes serán más genéricas. ¿Seguro?" If they insist, record `"Jam rápida sin aclaración"` in the session context.

### Phase 2 — Propose concept (single confirmation)

Present before writing any files:

```markdown
## Jam: {tema}

**Carpeta:** `specs/game-jam/{folder-slug}/`
**Título del jam:** {nombre creativo corto}

| # | Archivo | Slug catálogo | Género | Hook | Encaje | Riesgos |
|---|---------|---------------|--------|------|--------|---------|
| A | `{variant-a}.md` | `{slug-a}` | … | … | X/10 | … |
| B | `{variant-b}.md` | `{slug-b}` | … | … | X/10 | … |
```

**Variant rules** (see `theme-guide.md`):

- Same visual/narrative theme; **different gameplay** (e.g. action vs puzzle).
- **Distinct catalog slugs** per variant (default) to avoid collision.
- Each variant must score ≥6/10 on platform fit.
- State a **primary recommendation** with one-line rationale.

Ask:

- ¿Procedo a escribir los specs?
- ¿Descartar alguna variante?
- ¿Cambiar ángulo de gameplay?

**Do not write files until the user confirms.**

### Phase 3 — Generate and save (automatic)

After confirmation, write all files in one pass (no section-by-section confirmation — unlike `@add-game`):

**Output structure:**

```
specs/game-jam/{folder-slug}/
  README.md                 # índice de sesión
  {variant-a-slug}.md       # spec completo — variante A
  {variant-b-slug}.md       # spec completo — variante B
  {variant-c-slug}.md       # opcional si se acordó 3 variantes
```

**README.md** must include:

- Tema, fecha, carpeta
- Tabla de variantes con slug, género, archivo, recomendación
- Pasos de promoción: elegir variante → copiar a `specs/NN-{slug}.md` → `Aprobado` → `@spec-impl`

**Each variant `.md`** must follow `template.md` completely:

- Header: `Estado: Borrador`, SPEC 05 + 06 dependencies, date, one-sentence objective
- Title format: `# JAM — {Título} en Arcade Vault` (no `NN` number)
- Sections: Alcance, Modelo de datos, Patrón de integración (checklist + diagram + file tree), Plan de implementación, Criterios de aceptación (grouped), Decisiones, Riesgos, Lo que NO está en este spec
- Concrete TypeScript types, constants tables, SQL seed, boolean acceptance criteria
- Target length: ~250–350 lines per spec (same depth as `specs/07-tetris.md`)

**Quality checks before saving:**

- No duplicate of implemented games or near-clones without differentiation.
- Placeholders left intact when creating new ids (do not modify placeholder entries).
- Both variants are independently implementable.
- Cover CSS class names are unique and distinct from existing covers.

### Phase 4 — Persist memory and close

**Always append** a session entry to `references/game-jam/sessions-log.md`:

- Date (`YYYY-MM-DD`) and theme
- **Contexto** — user constraints
- **Carpeta** — `specs/game-jam/{folder-slug}/`
- **Variantes** table:

| Archivo | Slug catálogo | Género | Encaje | Estado |
|---------|---------------|--------|--------|--------|

**Valid statuses:** `generado` | `elegido` | `promovido` | `descartado`

Confirm to the user:

- Paths of all created files
- Summary of variants and primary recommendation
- Next steps:
  1. Re-read both specs outside the chat
  2. Pick one variant
  3. Copy/move chosen spec to `specs/NN-{slug}.md` (assign next `NN` from `specs/`)
  4. Change state to `Aprobado` manually
  5. Run `@spec-impl NN-{slug}`

**STOP.** Do not propose writing code, migrations, CSS, React components, or branches.

## Hard rules

- **Never write application code, CSS, migrations, or React components.**
- **Never mark specs as `Aprobado`.**
- **Never implement games** — that is `@spec-impl` after human approval.
- **Never skip reading SPEC 05/06 context** (canonical specs + `add-game/reference.md`).
- **Never generate specs without user confirmation in Phase 2.**
- **Never duplicate** `asteroids`, `tetris`, `arkanoid`, `snake` or near-identical clones.
- **Never skip appending** a session entry to `sessions-log.md`.
- **Never use `if (game.id)` branches** in specs — always dedicated player/canvas/routes.

## Relationship with other skills

| Skill | Role |
|-------|------|
| `@game-planner` | Evaluates fit from classics catalog; no specs |
| `@game-jam` | Creative themed specs with variants (this skill) |
| `@add-game` | Single game, interactive section-by-section spec |
| `@spec-impl` | Implements an **approved** spec in `specs/NN-slug.md` |
| `/frontend-design` | Cover CSS direction (mention in spec Decisions) |

**Creative pipeline:**

```
@game-jam {tema} → review variants in specs/game-jam/{slug}/ → pick one → promote to specs/NN-{slug}.md → Aprobado → @spec-impl
```

**Classic pipeline** (unchanged):

```
@game-planner → @add-game {slug} → Aprobado → @spec-impl
```

## Arguments

If the user invoked `/game-jam océano`, use `océano` as the theme in Phase 1.

If they invoked `/game-jam` without arguments, ask for a theme first.
