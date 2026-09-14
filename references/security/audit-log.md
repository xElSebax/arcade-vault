# Security Auditor — Registro de auditorías

> Actualizado por `@security-auditor`. No editar manualmente salvo correcciones de estado o cierre de hallazgos.

## Snapshot

| Campo | Valor |
|-------|--------|
| Última auditoría | 2026-09-14 |
| Último modo | `full` |
| Baseline checklist | [`checklist.md`](checklist.md) (SPEC 13 implementado en repo) |
| Advisors (remoto) | MCP 2026-09-14: 1 WARN `auth_leaked_password_protection`; sin WARN en `search_path` / `security_definer` |

### Estado por área

| Área | Último resultado | Notas |
|------|------------------|-------|
| db | pass (repo) | RLS y migraciones SPEC 12/13 coherentes; estado remoto asumido aplicado si migraciones desplegadas |
| app | pass (1 warn) | Headers, proxy, auth, actions, APIs alineados SPEC 12/13 |
| dashboard | fail (1) + warn | Leaked password protection **OFF** en remoto (advisor); resto Auth no revalidado en esta sesión |

## Hallazgos abiertos

| ID | Severidad | Área | Ubicación | Hallazgo | Desde |
|----|-----------|------|-----------|----------|-------|
| SEC-001 | media | dashboard | Supabase Auth → Attack Protection / Email | Advisor `auth_leaked_password_protection`: protección de contraseñas filtradas **deshabilitada** en proyecto Arcade Vault (`rzmficomnhihcddlfdle`). | 2026-09-14 |
| SEC-002 | baja | app | `app/actions/save-score.ts` (bloque `catch`) | Errores inesperados devuelven `error.message` al cliente; el `insert` ya oculta detalle en producción. | 2026-09-14 |

## Hallazgos cerrados

_(Vacío.)_

## Sesiones

### 2026-09-14 — full

**Contexto:** Primera auditoría formal `@security-auditor` post-SPEC 13. Modo `full`: migraciones SQL, superficie Next.js (proxy, auth, actions, APIs), checklist dashboard contrastado con MCP advisors.

**Checklist:** db 27/28 pass · 1 fail (G3 advisor) · app 33/34 pass · 1 warn (D4) · dashboard 0/4 verificado en UI · 1 fail remoto (H3) · 3 warn (H1, H2, H4 manual)

**Advisors:** MCP OK — 1 WARN `auth_leaked_password_protection`; sin lints `function_search_path_mutable` ni `*_security_definer_function_executable` en esta consulta.

**Hallazgos:** 2 (SEC-001, SEC-002)

**Acción:** solo informe
