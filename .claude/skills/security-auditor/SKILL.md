---
name: security-auditor
description: >-
  Audita seguridad de la app Next.js y Supabase (RLS, auth, headers, proxy,
  Server Actions, APIs) contra SPEC 12/13. Solo informe por defecto; memoria en
  references/security/audit-log.md. Use when reviewing auth, scores, migrations,
  pre-deploy, or after security-related changes.
disable-model-invocation: true
argument-hint: "[full | db | app | dashboard | delta]"
---

# /security-auditor — App + Supabase security audit

This skill audits **Arcade Vault application and database security** against SPEC 12, SPEC 13, and `references/security/checklist.md`. **Default: report only** — do not modify code, SQL migrations, or Supabase dashboard unless the human explicitly asks to implement fixes in the same thread.

Read `app-security-checklist.md` and `db-security-checklist.md` (same directory) before auditing.

## Philosophy

Security work here is **continuous vigilance**, not a one-time hardening pass. The repo encodes RLS, auth, headers, and route protection; the Supabase dashboard holds Auth settings and advisors that code cannot replace.

**Audit-only by default.** Findings go in the session report and `references/security/audit-log.md`. Implementation is a separate, explicit human decision (`@spec` for new scope, `@spec-impl` after approval, or ad-hoc fixes when requested).

**Scope:** auth, Supabase data plane, Next.js surface (proxy, headers, actions, public APIs). Out of scope: pentest, 2FA, CSP/HSTS (future specs), game canvas logic unless it touches scores or auth.

## Command flow

- Follow the six phases in order. **Do not skip phases** (Phase 3 remote is optional when MCP unavailable).
- Replies must match the language of the initial prompt (default Spanish).
- **Memory is mandatory:** read and update `references/security/audit-log.md` every session that performs an audit.

### Phase 0 — Context and memory

Before auditing:

1. Read `AGENTS.md` (or `CLAUDE.md`) for stack and auth/score conventions.
2. Read `specs/12-auth-supabase.md` — auth, profiles, scores `user_id`, RLS auth model.
3. Read `specs/13-security-hardening.md` — RLS hardening, functions, headers, proxy, passwords.
4. Read `references/security/checklist.md` — operational checklist (regression baseline).
5. Read `references/security/audit-log.md` — **persistent audit memory** (prior findings, advisors).
6. Read `references/supabase-auth-setup.md` — dashboard Auth + advisor verification steps.
7. Read `app-security-checklist.md` and `db-security-checklist.md`.
8. Skim current sensitive code (read-only):
   - `lib/auth/route-protection.ts`, `lib/auth/password-policy.ts`, `lib/auth/score-user-id.ts`
   - `lib/supabase/proxy.ts`, root `proxy.ts`
   - `app/actions/save-score.ts`
   - `next.config.ts` (security headers)
   - `app/api/contact/route.ts`, `app/api/health/supabase/route.ts` (if present)
   - `supabase/migrations/` (RLS, policies, security migrations)

**Cross-check before auditing:**

- Resolve `$ARGUMENTS` to mode: `full` | `db` | `app` | `dashboard` | `delta`.
- If empty or unrecognized, use **`full`**.

### Phase 1 — Confirm mode

| Mode | Audit |
|------|--------|
| `full` | DB checklist + app checklist + dashboard checklist |
| `db` | `db-security-checklist.md` only (+ advisors in Phase 3) |
| `app` | `app-security-checklist.md` only |
| `dashboard` | Manual Supabase Auth items from `supabase-auth-setup.md` + checklist dashboard section |
| `delta` | `git diff` vs merge-base (or uncommitted) filtered to security-sensitive paths; map each hunk to SPEC 12/13 criteria |

For `delta`, include at minimum: `supabase/`, `lib/auth/`, `lib/supabase/`, `app/actions/`, `app/api/`, `app/auth/`, `proxy.ts`, `next.config.ts`.

### Phase 2 — Repository audit (read-only)

Walk the checklists for the chosen mode(s). For each item record ✅ pass, ❌ fail, or ⚠️ cannot verify (needs runtime/dashboard).

**DB highlights:**

- RLS enabled on `games`, `profiles`, `scores`.
- `games`: SELECT only for client roles; no client INSERT/UPDATE/DELETE.
- `scores`: public SELECT; INSERT rules for anon/authenticated per SPEC 12/13; no client UPDATE/DELETE.
- `profiles`: SELECT public; INSERT/UPDATE own user only.
- Functions: `set search_path = public` on profile helpers; REVOKE EXECUTE on trigger helpers from `anon`/`authenticated`.
- No invokable `rls_auto_enable` in migrations intent.

**App highlights:**

- Three security headers on all routes via `next.config.ts`.
- Proxy refreshes session; protected prefixes redirect to `/auth?next=`; public play/catalog unchanged.
- Sign-up uses `isPasswordValid`; login does not enforce complexity client-side.
- `saveScore`: server assigns `user_id`; validates game exists; no trust of client `user_id`.
- Contact API: validation + honeypot; secrets server-only.
- No `SUPABASE_SERVICE_ROLE_KEY` or other secrets in client bundles (`NEXT_PUBLIC_*` only where intended).

Do **not** edit files in this phase.

### Phase 3 — Remote / advisors (optional)

If **Supabase MCP** is authenticated for the Arcade Vault project:

- Call security advisors (e.g. `get_advisors` with type security) and note WARN/ERROR vs last `audit-log.md` entry.

If MCP is unavailable:

- State «advisors: pendiente manual» and point to `references/supabase-auth-setup.md` verification steps.

Do not change remote configuration in audit-only mode.

### Phase 4 — Report

Deliver a structured report to the human:

1. **Mode** and files/areas reviewed.
2. **Checklist summary** — counts pass/fail/warn per area (db / app / dashboard).
3. **Findings table** (empty table = no regressions detected in repo for this scope):

| Severidad | Área | Ubicación | Hallazgo | Acción sugerida |
|-----------|------|-----------|----------|-----------------|
| alta / media / baja | db / app / dashboard | file or setting | description | fix / `@spec` / dashboard manual |

4. **Advisors** — MCP result or manual follow-up.

**No code changes** unless the human explicitly requested implementation.

### Phase 5 — Persist memory

**Always update** `references/security/audit-log.md` when an audit was performed:

1. Refresh **Snapshot** dates and high-level status if anything changed.
2. Update **Hallazgos abiertos** (add new, close resolved with note).
3. **Append** under `## Sesiones`:

```markdown
### YYYY-MM-DD — {mode}

**Contexto:** …
**Checklist:** db X/Y · app X/Y · dashboard X/Y
**Advisors:** MCP OK / pendiente manual / …
**Hallazgos:** N (listar ids o «ninguno»)
**Acción:** solo informe | humano pidió fixes (fuera de alcance skill)
```

Confirm to the user:

- Path of updated `audit-log.md`
- Finding count and severity summary
- «Sin cambios de código» (default)

**STOP** after one audit cycle unless the user requests another mode in the same session.

### Phase 6 — Handoff (when applicable)

| Situation | Handoff |
|-----------|---------|
| Gap outside SPEC 13 (CSP, rate limit, 2FA, pentest) | `@spec` with proposed slug/title |
| Approved spec needs code | `@spec-impl` (human sets `Aprobado`) |
| Human wants fixes for listed findings | Implement only after explicit request; prefer minimal diffs |
| Generic PR diff review | Complement with Cursor `/review-security`; does not replace this checklist |

## Hard rules

- **Never implement fixes by default** — audit and report only.
- **Never skip reading `audit-log.md` at session start** when performing an audit.
- **Never skip updating `audit-log.md` at session end** when an audit was performed.
- **Never mark specs as `Aprobado`.**
- **Never write new specs** unless recommending handoff to `@spec`.
- **Never rotate secrets or change Supabase dashboard** in audit-only mode.
- **Never claim pentest or compliance certification.**

## Delta mode details

1. Determine diff: `git diff` against default branch merge-base, or uncommitted if user asked for local only.
2. For each changed file, check whether it affects auth, RLS, scores, headers, proxy, or APIs.
3. Flag: new public endpoints, new env vars, weakened validation, new DB policies, removed REVOKE/search_path, client exposure of secrets, open redirects in `next` param.

## Relationship with other skills

| Tool | Role |
|------|------|
| `@security-auditor` | Domain audit SPEC 12/13 + checklist + audit log (this skill) |
| `/review-security` | Generic security review of branch/uncommitted diff |
| `@spec` | New security capabilities beyond current specs |
| `@spec-impl` | Implement approved security specs |
| SPEC 12 / SPEC 13 | Canonical requirements |

**When to invoke:**

- After auth, Supabase, or API changes
- Before production deploy
- Periodic regression (e.g. monthly `full`)
- `@security-auditor dashboard` after Auth dashboard changes

## Arguments

`@security-auditor` → `full`.

`@security-auditor db` → database + advisors only.

`@security-auditor app` → Next.js surface only.

`@security-auditor dashboard` → manual Auth checklist only.

`@security-auditor delta` → security-sensitive diff only.
