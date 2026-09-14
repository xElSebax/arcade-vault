# SPEC 13 — Endurecimiento de seguridad (checklist básico)

> **Estado:** Aprobado
> **Depende de:** SPEC 04 — Integración de Supabase en Next.js, SPEC 06 — Catálogo y leaderboard Supabase, SPEC 12 — Autenticación con Supabase
> **Fecha:** 2026-09-14
> **Objetivo:** Cumplir `references/security/checklist.md` y la política de contraseñas del dashboard Supabase: RLS y funciones Postgres, headers HTTP en Next.js, protección de rutas en `proxy.ts` (Next.js 16), validación en `/auth` (mín. 8 caracteres + mayúscula, minúscula, dígito y símbolo vía regex compartida) y configuración Auth documentada en `references/supabase-auth-setup.md`.

## Alcance

**Dentro:**

- **RLS en Postgres:** Verificar que `public.games`, `public.profiles` y `public.scores` tienen RLS **habilitado** en el proyecto (migración idempotente si hace falta).
- **Políticas RLS:** Auditar y dejar explícito el modelo de acceso:
  - `games`: solo lectura pública (`SELECT`) para `anon` y `authenticated`; sin `INSERT`/`UPDATE`/`DELETE` desde roles de cliente.
  - `scores`: `SELECT` público; `INSERT` según SPEC 12 (`anon` con `user_id is null`; `authenticated` con `user_id is null` o `user_id = auth.uid()`); sin `UPDATE`/`DELETE` para `anon`/`authenticated`.
  - `profiles`: mantener políticas de SPEC 12 (`SELECT` público, `INSERT`/`UPDATE` solo propio usuario); sin borrado desde cliente salvo lo que permita RLS por defecto.
- **Funciones y linter Supabase:**
  - Fijar `search_path` en `public.set_profiles_updated_at` y `public.normalize_profile_display_name` (misma convención que `handle_new_user`).
  - Revocar `EXECUTE` para `PUBLIC`, `anon` y `authenticated` en funciones internas expuestas por error (`handle_new_user` y demás triggers/helpers que no deban ser RPC).
  - Eliminar `public.rls_auto_enable()` si existe en el proyecto remoto (no usada; RLS ya se gestiona por migraciones).
- **Headers HTTP (Next.js):** Añadir en `next.config.ts` para todas las rutas: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`.
- **Protección de rutas (`proxy.ts`):** Extender el proxy existente ([patrón Next.js 16](https://nextjs.org/docs/app/getting-started/proxy)): tras refrescar sesión Supabase, redirigir con `NextResponse.redirect` si la ruta exige autenticación y no hay usuario. Lista centralizada de prefijos protegidos (opt-in). El catálogo, juegos, salón, about y **jugar como invitado** siguen **públicos**; no se exige login en `/`, `/games`, `/play`, `/hall-of-fame`, `/about`, `/auth`, `/auth/callback` ni APIs públicas (`/api/health`, `/api/contact`). Usuario con sesión que visita `/auth` puede redirigirse a `/games` (evitar pantalla de login redundante).
- **Contraseñas en la app (`/auth`):**
  - Sustituir validación actual (mín. 6 caracteres) por política alineada con el dashboard: **mín. 8 caracteres** y al menos una mayúscula, una minúscula, un dígito y un símbolo.
  - Regex (o validador equivalente) en módulo compartido bajo `lib/auth/`; usar en **Crear cuenta**; reutilizar en cualquier UI futura de **nueva contraseña** en la misma app (hoy el reset solo envía email — no bloquea este spec).
  - Mensajes de error claros en español (requisitos visibles o mensaje que los enumere).
- **Checklist y documentación operativa:** Actualizar `references/supabase-auth-setup.md` con:
  - Password requirements (como en dashboard: minúsculas, mayúsculas, dígitos y símbolos).
  - Leaked password protection (Have I Been Pwned) activada.
  - Límite de signups por IP (anti-bot).
  - Mínimo 8 caracteres en Auth (coherente con la app).
  - Pasos post-deploy para comprobar advisors de seguridad en Supabase.
- **Referencia:** Actualizar `references/security/checklist.md` marcando ítems cubiertos cuando el humano valide la implementación.

**Fuera de alcance (para specs futuros):**

- Content-Security-Policy (CSP), HSTS u otros headers avanzados.
- Rate limiting en Next.js / proxy (solo configuración Auth en Supabase para signups).
- Obligar login para jugar o ver el catálogo (el sitio sigue público salvo prefijos en la lista protegida).
- 2FA, auditoría de seguridad completa, pentest.
- Cambiar proveedores OAuth o flujos de auth más allá de mensajes/validación de contraseña en registro.
- Tests E2E automatizados de seguridad.
- Rotación de claves, WAF o infra fuera de Supabase + Next.js.

## Modelo de datos

No se añaden tablas. Se refuerzan políticas RLS, funciones SQL y un contrato de validación en TypeScript.

### Política de contraseña (cliente)

Módulo nuevo, p. ej. `lib/auth/password-policy.ts`:

```ts
export const PASSWORD_MIN_LENGTH = 8;

/** Alineado con Supabase: minúscula, mayúscula, dígito y símbolo (no alfanumérico). */
export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;

export const PASSWORD_REQUIREMENTS_MESSAGE =
  "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo.";

export function isPasswordValid(password: string): boolean {
  return password.length >= PASSWORD_MIN_LENGTH && PASSWORD_REGEX.test(password);
}
```

- **Login:** no validar complejidad (solo comprobar no vacía); Supabase rechaza credenciales inválidas.
- **Registro:** rechazar en cliente antes de `signUp` si `!isPasswordValid(password)`; mostrar `PASSWORD_REQUIREMENTS_MESSAGE` (o hint bajo el campo en tab Crear cuenta).

### Migración SQL (nueva en `supabase/migrations/`)

Resumen de cambios esperados (nombres de archivo con timestamp al implementar):

1. **`search_path` en funciones:**

```sql
create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$ ... $$;

create or replace function public.normalize_profile_display_name(raw text)
returns text
language plpgsql
immutable
set search_path = public
as $$ ... $$;
```

2. **Revocar ejecución RPC indebida** (ajustar lista si el linter reporta más funciones):

```sql
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_profiles_updated_at() from public, anon, authenticated;
revoke execute on function public.normalize_profile_display_name(text) from public, anon, authenticated;
```

3. **Eliminar función no usada** (solo si existe en el proyecto):

```sql
drop function if exists public.rls_auto_enable();
```

4. **RLS idempotente:** `alter table ... enable row level security` en `games`, `profiles`, `scores` si no está ya aplicado; revisar que no existan políticas `UPDATE`/`DELETE` en `scores` o `games` para roles de cliente.

### Protección de rutas (proxy + helpers)

Módulo nuevo, p. ej. `lib/auth/route-protection.ts`:

```ts
/** Prefijos que exigen sesión Supabase (opt-in). Vacío al inicio = solo infraestructura. */
export const PROTECTED_PATH_PREFIXES: string[] = [
  // Ejemplo futuro: "/cuenta",
];

/** Rutas siempre accesibles sin sesión (documentación + guards en proxy). */
export const PUBLIC_PATH_PREFIXES = [
  "/",
  "/games",
  "/play",
  "/hall-of-fame",
  "/about",
  "/auth",
  "/api/health",
  "/api/contact",
];

export function isPublicPath(pathname: string): boolean;
export function isProtectedPath(pathname: string): boolean;
```

Flujo en `lib/supabase/proxy.ts` (o `proxy.ts` raíz), después de `getUser()`:

1. Si `isProtectedPath(pathname)` y no hay `user` → `NextResponse.redirect(new URL(\`/auth?next=\${encodeURIComponent(pathname)}\`, request.url))`.
2. Si `pathname` es `/auth` (no callback), hay `user`, y no es logout explícito → redirect a `/games` (o `next` seguro si se prefiere en implementación).
3. En cualquier otro caso → `NextResponse.next()` con cookies de sesión ya actualizadas.

El `matcher` en `proxy.ts` raíz se mantiene amplio (como hoy), salvo exclusión de estáticos; la lógica de redirect es por pathname, no por duplicar matchers del [ejemplo de Next.js](https://nextjs.org/docs/app/getting-started/proxy) salvo que un prefijo protegido merezca `matcher` dedicado en el futuro.

Referencia de forma export (ya en el repo):

```ts
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = { matcher: ["/((?!_next/static|...)*)"] };
```

### Headers (`next.config.ts`)

```ts
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

// async headers() → { source: "/(.*)", headers: securityHeaders }
```

### Configuración dashboard (no es código)

Documentar en `references/supabase-auth-setup.md` (valores objetivo):

| Ajuste | Valor esperado |
|--------|----------------|
| Minimum password length | 8 |
| Password requirements | Lowercase, uppercase, digits and symbols |
| Leaked password protection | Enabled |
| Max signup rate | Limitar por IP (valor concreto según tráfico; documentar el elegido) |

## Plan de implementación

1. **Migración Postgres — funciones y RPC** — Nueva migración: `search_path` en `set_profiles_updated_at` y `normalize_profile_display_name`; `REVOKE EXECUTE` en funciones listadas; `DROP` de `rls_auto_enable` si existe. Aplicar en remoto/local. *Comprobación:* advisors de Supabase sin WARN `function_search_path_mutable` ni `*_security_definer_function_executable` para esas funciones; triggers de perfiles siguen creando filas al registrarse.

2. **Migración Postgres — RLS** — Idempotente: RLS habilitado en las tres tablas; confirmar políticas `games`/`scores`/`profiles` sin huecos (sin `UPDATE`/`DELETE` no deseados en `scores`/`games`). Añadir comentario SQL o política documentada si falta algo. *Comprobación:* invitado puede leer juegos y leaderboard; insert score sigue funcionando; no se puede borrar filas de `scores` vía API anon con clave publicable.

3. **Protección de rutas en proxy** — `lib/auth/route-protection.ts` + ampliar `updateSession` para devolver usuario y aplicar redirects. Mantener refresco de cookies. *Comprobación:* sin sesión, `/play/asteroids` y `/games` cargan (200); con un prefijo de prueba temporal en `PROTECTED_PATH_PREFIXES` (p. ej. `/cuenta` si existe página stub) o prefijo de prueba documentado en PR, sin sesión redirige a `/auth?next=...`; con sesión, `/auth` redirige a `/games`.

4. **Headers Next.js** — Extender `next.config.ts` con `headers()` global. *Comprobación:* `curl -I http://localhost:3000/` muestra los tres headers; `npm run build` OK.

5. **`lib/auth/password-policy.ts`** — Implementar constantes y `isPasswordValid`. *Comprobación:* importable sin `"use client"` (puro TS).

6. **`/auth` registro** — Usar validador en `handleSignUp`; quitar umbral de 6 caracteres; hint o mensaje de requisitos en tab Crear cuenta. *Comprobación:* contraseña `abcdefgh` rechazada en UI; `Abcdef1!` aceptada antes del llamado a Supabase.

7. **Documentación operativa** — Ampliar `references/supabase-auth-setup.md` con sección de seguridad (password, leaked protection, rate limit, verificación advisors) y nota sobre `PROTECTED_PATH_PREFIXES`. Aplicar cambios en dashboard. *Comprobación:* otro dev puede replicar configuración; checklist en `references/security/checklist.md` actualizado con ítems marcados tras validación humana.

8. **Cierre** — `npm run lint` y `npm run build`; recorrer criterios de aceptación; estado del spec a **Implementado** cuando el humano confirme (incl. dashboard y advisors).

## Criterios de aceptación

### Postgres y RLS

- [x] `games`, `profiles` y `scores` tienen RLS **enabled** en Supabase.
- [x] Cliente `anon` puede `SELECT` en `games` y `scores` (leaderboard y catálogo siguen cargando).
- [x] Cliente `anon` puede `INSERT` en `scores` solo con `user_id is null` (partida invitado).
- [x] Cliente `authenticated` puede `INSERT` en `scores` con `user_id is null` o `user_id = auth.uid()`.
- [x] No hay política que permita `UPDATE` o `DELETE` en `scores` para `anon`/`authenticated` (o intentos fallan con error RLS).

### Linter / funciones Supabase

- [x] Advisor sin WARN `function_search_path_mutable` para `set_profiles_updated_at` y `normalize_profile_display_name`.
- [x] Advisor sin WARN `anon_security_definer_function_executable` / `authenticated_security_definer_function_executable` para `handle_new_user` (y funciones revocadas).
- [x] `public.rls_auto_enable` no existe o no es invocable vía PostgREST RPC.

### Next.js

- [x] Respuesta HTTP de la app incluye `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` y `Referrer-Policy: strict-origin-when-cross-origin` en rutas representativas (`/`, `/auth`, `/play/asteroids`).

### Proxy y rutas

- [x] `proxy.ts` en la raíz sigue exportando `proxy` + `config.matcher` (patrón Next.js 16); ejecuta refresco de sesión Supabase en rutas no estáticas.
- [x] Sin sesión, rutas públicas (`/`, `/games`, `/play/asteroids`, `/hall-of-fame`, `/about`) responden sin redirect a `/auth`.
- [x] Sin sesión, una ruta cuyo prefijo esté en `PROTECTED_PATH_PREFIXES` responde con redirect a `/auth` e incluye query `next` con el path solicitado (codificado).
- [x] Con sesión activa, GET `/auth` redirige a `/games` (o destino seguro equivalente); `/auth/callback` no se bloquea.
- [x] Tras login, el flujo respeta `next` relativo cuando la app ya lo soporta en callback (sin open redirect: solo paths que empiezan por `/` y no por `//`).

### Contraseñas en la app

- [x] Tab **Crear cuenta** rechaza contraseñas que no cumplen la regex (mensaje en español con los cinco requisitos).
- [x] Tab **Crear cuenta** acepta una contraseña que cumple política y permite continuar el flujo `signUp` (salvo otros errores de Supabase).
- [x] Tab **Iniciar sesión** no exige complejidad en cliente (solo campos requeridos).

### Dashboard Supabase (manual)

- [ ] Minimum password length = **8**.
- [ ] Password requirements = **lowercase, uppercase, digits and symbols** (o equivalente en UI).
- [ ] **Leaked password protection** activada.
- [ ] **Max signup rate** configurado (anti-bot); valor documentado en `references/supabase-auth-setup.md`.

### Documentación y calidad

- [x] `references/supabase-auth-setup.md` describe los cuatro ajustes de Auth anteriores y cómo revisar advisors.
- [x] `npm run build` y `npm run lint` pasan sin errores nuevos atribuibles a este spec.
- [ ] Registro + score invitado + score autenticado siguen funcionando (smoke test SPEC 12).

## Decisiones

- **Sí:** Un solo spec para checklist + regex de contraseña + remediación linter; pasos separados repo vs. dashboard en el plan.
- **Sí:** Auditar políticas RLS (no solo “RLS on”); modelo de solo lectura en `games` y sin mutación de `scores` desde cliente.
- **Sí:** Solo tres headers HTTP en esta spec; CSP/HSTS quedan fuera.
- **Sí:** Validación de complejidad en **registro** vía `lib/auth/password-policy.ts` alineada con dashboard Supabase.
- **No:** Validar complejidad en login (evita bloquear cuentas legacy si la política del dashboard cambiara; Supabase sigue siendo autoridad en registro).
- **Sí:** `REVOKE EXECUTE` en funciones trigger/helper; no exponerlas como RPC.
- **Sí:** `DROP` de `rls_auto_enable` — añadida automáticamente en proyecto, no referenciada en migraciones del repo.
- **Sí:** Documentar configuración Auth en `references/supabase-auth-setup.md`; criterios de dashboard verificados manualmente.
- **No:** Rate limiting en el proxy en este spec.
- **Sí:** Protección de rutas en `proxy.ts` (Next.js 16), integrada con `updateSession` de SPEC 04/12 — redirects con `NextResponse.redirect`, no un `middleware.ts` aparte.
- **Sí:** Modelo **opt-in** (`PROTECTED_PATH_PREFIXES`): el arcade sigue público; nuevas áreas privadas (p. ej. `/cuenta`) se añaden a la lista sin cambiar el proxy.
- **Sí:** Redirect de usuarios autenticados fuera de `/auth` hacia `/games` (comportamiento tipo [guía Auth de Next.js](https://nextjs.org/docs/app/guides/authentication)).
- **No:** Exigir login para `/play/*` ni `/games/*`.
- **Definición guiada:** Alcance cerrado en conversación (Fase 2); regex añadida por requisito de dashboard; protección de rutas añadida tras revisión proxy vs. SPEC 12.

## Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Regex de símbolos no coincide exactamente con Supabase | Usar conjunto amplio `[^a-zA-Z0-9]`; probar registro con contraseña que pase UI y sea aceptada por Supabase; ajustar mensaje si el API devuelve error de “weak password”. |
| `REVOKE EXECUTE` rompe triggers | Solo revocar en funciones invocables por RPC; triggers siguen ejecutándose con privilegios del owner; probar registro OAuth/email tras migración. |
| `DROP rls_auto_enable` en entorno que aún la use | `IF EXISTS`; confirmar en dashboard que no hay jobs/documentación que la llamen (humano). |
| Headers rompen embeds o previews | Solo tres headers conservadores; sin CSP; probar OAuth callback y juego en iframe externo si aplica (X-Frame-Options DENY es deseado). |
| Rate limit de signup demasiado agresivo | Documentar valor elegido; ajustar en dashboard sin cambio de código. |
| Redirect loop `/auth` ↔ destino | Excluir `/auth/callback`; validar `next`; usuario logueado en `/auth` va a `/games`. |
| Lista protegida vacía y criterio “redirect” no verificable | Añadir al menos un prefijo de prueba en implementación (p. ej. ruta futura `/cuenta`) o test manual temporal documentado en el PR; luego vaciar o dejar según producto. |

## Qué **no** está en este spec

- CSP, HSTS y hardening de cookies avanzado.
- Rate limiting en la app Next.js.
- Login obligatorio para jugar o navegar el catálogo.
- 2FA, pentest.
- UI de “establecer nueva contraseña” tras enlace de reset (cuando exista, debe reutilizar `password-policy.ts`).
- Tests E2E de seguridad.

Cada uno de esos temas, si se aborda, va en su propio spec.
