# Database security checklist — `@security-auditor`

Recorrer en modo `db` o `full`. Fuente de verdad en repo: `supabase/migrations/`. Referencia: SPEC 12, SPEC 13, `references/security/checklist.md`.

## A — RLS habilitado

| # | Criterio | Tabla |
|---|----------|-------|
| A1 | `alter table ... enable row level security` idempotente en migraciones | `games`, `profiles`, `scores` |
| A2 | No migración posterior deshabilita RLS sin spec | Regresión |

## B — Tabla `public.games`

| # | Criterio | Esperado |
|---|----------|----------|
| B1 | Política SELECT para `anon` / `authenticated` | Lectura catálogo |
| B2 | Sin política INSERT/UPDATE/DELETE para roles cliente | Solo lectura vía API |
| B3 | Seed/catálogo vía migraciones o service role, no PostgREST anon | SPEC 06 |

## C — Tabla `public.scores`

| # | Criterio | Esperado |
|---|----------|----------|
| C1 | SELECT público (leaderboard) | SPEC 06 |
| C2 | INSERT `anon` con `user_id is null` | SPEC 12 / 13 |
| C3 | INSERT `authenticated` con `user_id is null` OR `user_id = auth.uid()` | SPEC 12 / 13 |
| C4 | Sin UPDATE/DELETE para `anon` / `authenticated` | SPEC 13 |
| C5 | Índice útil para queries por `game_id`, `user_id`, `score` si aplica | SPEC 12 |

## D — Tabla `public.profiles`

| # | Criterio | Esperado |
|---|----------|----------|
| D1 | SELECT público (o documentado) para `display_name` | SPEC 12 |
| D2 | INSERT solo propio usuario (`id = auth.uid()`) o vía trigger | SPEC 12 |
| D3 | UPDATE solo `id = auth.uid()` | SPEC 12 |
| D4 | FK a `auth.users` ON DELETE CASCADE | SPEC 12 |
| D5 | CHECK longitud `display_name` 1–10 | SPEC 12 |

## E — Funciones y triggers

| # | Criterio | Funciones / notas |
|---|----------|-------------------|
| E1 | `set search_path = public` en helpers de perfiles | `set_profiles_updated_at`, `normalize_profile_display_name` |
| E2 | `handle_new_user` (trigger signup): REVOKE EXECUTE desde `anon`, `authenticated`, `PUBLIC` | SPEC 13 |
| E3 | REVOKE EXECUTE en helpers trigger no expuestos como RPC | SPEC 13 migración `20260914140000_*` |
| E4 | Triggers siguen creando perfil al registrarse (smoke lógico en informe) | SPEC 12 |
| E5 | `drop function if exists public.rls_auto_enable()` / event trigger `ensure_rls` eliminado en migración | SPEC 13 |

## F — Migraciones de endurecimiento

Verificar presencia y coherencia con SPEC 13:

| Archivo | Propósito |
|---------|-----------|
| `20260914140000_security_functions_rpc.sql` | search_path, REVOKE, drop rls_auto_enable |
| `20260914141000_security_rls_hardening.sql` | RLS idempotente, políticas documentadas |
| `20260914104000_auth_profiles.sql` | profiles + RLS auth |
| `20260914120000_scores_rls_auth.sql` | INSERT scores autenticados |

## G — Advisors Supabase (remoto)

Comprobar vía MCP o manual (dashboard → Advisors → Security):

| # | Advisor / tema | Estado objetivo |
|---|----------------|-----------------|
| G1 | `function_search_path_mutable` en funciones de perfiles | Sin WARN |
| G2 | `*_security_definer_function_executable` en `handle_new_user` y helpers revocados | Sin WARN |
| G3 | `auth_leaked_password_protection` | Sin WARN si leaked passwords ON en Auth |
| G4 | Políticas RLS faltantes o demasiado permisivas (advisor genérico) | Sin ERROR |

Registrar resultado en `audit-log.md` bajo **Advisors**.

## H — Dashboard Auth (modo `dashboard` o sección en `full`)

No verificable solo con SQL local; contrastar con `references/supabase-auth-setup.md`:

| # | Ajuste | Valor esperado |
|---|--------|----------------|
| H1 | Minimum password length | 8 |
| H2 | Password requirements | lower, upper, digit, symbol |
| H3 | Leaked password protection | Enabled |
| H4 | Max signup rate per IP | Documentado (p. ej. 30/h/IP) |

## Delta mode — archivos sensibles

Re-auditar secciones afectadas si el diff incluye:

`supabase/migrations/*.sql`, cambios a políticas, nuevas tablas públicas, nuevas funciones `security definer`, grants a `anon`/`authenticated`.
