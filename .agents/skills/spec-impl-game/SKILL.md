---
name: spec-impl-game
description: >-
  Implements an approved game spec using /spec-impl, then runs @skin-designer
  and @mobile-porter in series for that game slug. Use for playable game
  integrations. Generic (non-game) specs still use /spec-impl.
disable-model-invocation: true
argument-hint: <NN-spec-name>
allowed-tools: Bash(git status:*), Bash(git branch:*), Bash(git checkout:*), Bash(cat:*), Bash(ls:*)
---

# /spec-impl-game — Game spec implementer + skins + mobile

This skill is a **specialization of `/spec-impl`** for Arcade Vault **playable games**. It does not replace `/spec-impl`. Features that are not games still use `/spec-impl`.

`@spec-impl-game` inherits Phases 1–4 from `/spec-impl` (Approved state, branch `spec-NN-slug`, step-by-step implementation with pauses). After the last implementation step completes, it **automatically** runs `@skin-designer` and then `@mobile-porter` **in series**.

## Prerequisite — read `/spec-impl` first

**Before identifying or implementing any spec**, read the generic implementer skill and follow it in full.

**Mandatory reads (Phase 0):**

1. `.claude/skills/spec-impl/SKILL.md` — Phases 1–4, Approved gate, branch creation, step rhythm, hard rules
2. `specs/.spec-config.yml` — `AutoCreateBranch` (same as `/spec-impl`)

Apply **all** instructions from `.claude/skills/spec-impl/SKILL.md` for Phases 1–4. Do **not** rewrite or skip those phases here.

The received argument is: `$ARGUMENTS` (same resolution as `/spec-impl`: full name, number, or slug).

## Command flow

```
/spec-impl-game 07-tetris

  Phase 0  →  Read /spec-impl skill
  Phases 1–4  →  Exact /spec-impl behavior (stop if not Approved)
  Phase 5  →  After last plan step: skin-designer {slug}, then mobile-porter {slug}
```

---

### Phase 0 — Load `/spec-impl`

Read `.claude/skills/spec-impl/SKILL.md` with the Read tool. Then execute it completely (session context, Phases 1–4).

If `/spec-impl` **stops** (empty argument, spec not found, state is not Approved, user declines branch / Step 1, ambiguity, out of scope): **do not run Phase 5**. Do not launch subagents.

---

### Phases 1–4 — Implement the spec

Follow `/spec-impl` exactly, including:

- Pause after each implementation step and wait for confirmation before Step N+1.
- After the last step, show the `/spec-impl` completion reminder (acceptance criteria, state → Implemented).

**Then continue immediately to Phase 5.** Do not ask whether to start skins or mobile. Do not wait for a second confirmation after the last step.

---

### Phase 5 — Skins then mobile (automatic, sequential)

Run this phase **only** when Phases 1–4 finished (all plan steps implemented).

#### 5.1 Resolve the game slug

From the spec filename `NN-{slug}.md`, take `{slug}` after the numeric prefix and hyphen.

Examples:

- `07-tetris.md` → `tetris`
- `05-asteroids.md` → `asteroids`
- `11-frogger.md` → `frogger`

If the filename does not match `NN-slug` or the slug is ambiguous, **ask the user** for the catalog slug. Do not launch agents without a slug.

#### 5.2 `@skin-designer` first

Launch the **skin-designer** subagent (`Task`, `subagent_type: skin-designer`):

- Pass the resolved slug in the prompt (`@skin-designer {slug}`).
- Instruct it to follow `.claude/skills/skin-designer/SKILL.md` for this game only.
- **Wait until it completes.** Do not set `run_in_background`.
- Do **not** launch `mobile-porter` in the same message.

#### 5.3 `@mobile-porter` second

**Only after** skin-designer has returned, launch **mobile-porter** (`Task`, `subagent_type: mobile-porter`):

- Same slug, follow `.claude/skills/mobile-porter/SKILL.md`.
- Wait until it completes. Do not run it in parallel with skin-designer.

#### 5.4 Final summary

Tell the user, in their language:

- Spec path and that Phases 1–4 are done
- Slug used
- Skin-designer result (classic / retro / neon, files, inventory path)
- Mobile-porter result (checklist columns, files, coverage-log path)

## Hard rules

- **Never** launch both `Task` calls in one turn.
- **Never** skip Phase 5 because the game spec already mentions skins or touch. Those agents own their inventories and checklists.
- **Never** run Phase 5 if `/spec-impl` aborted.
- **Never** mark a spec as `Aprobado`. Spec closure stays as in `/spec-impl` (verify criteria; human/process may set `Implementado`).
- **Never** implement a generic (non-game) spec with this command; tell the user to use `/spec-impl` instead if they clearly asked for a non-game feature spec.

## Related commands

| Command | Role |
|---------|------|
| `/spec-impl` | Approved spec, any feature — no skins/mobile pipeline |
| `/spec-impl-game` | Approved **game** spec, then skins, then touch |
| `@skin-designer` | Skins only, one game |
| `@mobile-porter` | Touch play only, one game |
