# Checklist de seguridad básico (SPEC 13)

SPEC 13 **Implementado** (rama `spec-13-security-hardening`). Ítems de repo verificados; dashboard Auth validado en operación.

## Repositorio y Next.js

- [x] **RLS** habilitado en `games`, `profiles` y `scores` (migración `20260914141000_security_rls_hardening.sql`).
- [x] **Funciones Postgres:** `search_path` fijo y `REVOKE EXECUTE` en helpers/triggers; eliminación de `rls_auto_enable` (migración `20260914140000_security_functions_rpc.sql`).
- [x] **Contraseña en registro:** mín. 8 + mayúscula, minúscula, dígito y símbolo (`lib/auth/password-policy.ts`, tab Crear cuenta en `/auth`).
- [x] **Headers HTTP** en `next.config.ts`: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`.
- [x] **Protección de rutas** en `proxy.ts` + `lib/auth/route-protection.ts` (`PROTECTED_PATH_PREFIXES`; catálogo y `/play` públicos).

## Dashboard Supabase (manual)

- [x] **Minimum password length** = 8 (alineado con la app).
- [x] **Password requirements** = lowercase, uppercase, digits and symbols.
- [x] **Leaked password protection** activada.
- [x] **Max signup rate** por IP configurado (referencia documentada: 30/hora/IP en [`supabase-auth-setup.md`](../supabase-auth-setup.md)).

## Verificación advisors

Tras deploy y ajustes Auth:

- [x] Sin WARN `function_search_path_mutable` en `set_profiles_updated_at` / `normalize_profile_display_name` (remoto Arcade Vault, post-migración SPEC 13).
- [x] Sin WARN `anon_*` / `authenticated_*_security_definer_function_executable` en `handle_new_user` ni `rls_auto_enable`.
- [x] Sin WARN `auth_leaked_password_protection` (depende de activar leaked passwords en Auth).

### Referencia rápida — headers Next.js

```ts
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

// next.config.ts → headers(): [{ source: "/(.*)", headers: securityHeaders }]
```

### Snapshot histórico (pre-SPEC 13)

Antes de las migraciones SPEC 13, el linter de Supabase reportaba WARN en `set_profiles_updated_at`, `normalize_profile_display_name`, `handle_new_user`, `rls_auto_enable` y `auth_leaked_password_protection`. Los cuatro primeros quedaron resueltos en código/SQL; leaked passwords queda pendiente de dashboard.
