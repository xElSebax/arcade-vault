# Supabase Auth — checklist operativo (SPEC 12)

Usar este checklist al configurar un proyecto nuevo o al desplegar Arcade Vault en otro entorno. La app asume cookies de sesión (`@supabase/ssr`), callback en `/auth/callback` y tablas `profiles` + `scores` con RLS.

## Variables locales

Copiar `.env.example` → `.env.local` y rellenar:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- Opcional: `NEXT_PUBLIC_SITE_URL` (p. ej. `http://localhost:3000` en dev, URL pública en prod). Si no se define, la app usa `window.location.origin` en el cliente.

`SUPABASE_SERVICE_ROLE_KEY` sigue siendo **opcional**: inserts de scores van con la clave publicable y sesión del usuario (RLS).

## Dashboard → Authentication → URL Configuration

| Campo | Valor típico (dev) |
|-------|---------------------|
| **Site URL** | `http://localhost:3000` |
| **Redirect URLs** | `http://localhost:3000/auth/callback` |

En producción, añadir la URL pública equivalente (HTTPS). El callback intercambia el `code` por sesión y redirige a `/games` (o `?next=` relativo).

## Proveedores OAuth

En **Authentication → Providers**:

1. **Google** — habilitar; Client ID / Secret del Google Cloud Console; authorized redirect URI de Supabase copiada del dashboard.
2. **GitHub** — habilitar; OAuth App en GitHub con callback URL de Supabase.

Probar flujo: `/auth` → botón Google o GitHub → vuelta a la app con sesión y fila en `public.profiles`.

## Email / contraseña

- **Confirm email:** recomendado activado (el spec exige verificación antes de asignar `user_id` en scores).
- Plantillas en **Authentication → Email Templates** (confirmación y reset); los enlaces deben apuntar al dominio configurado en Site URL.
- Reset de contraseña: la app llama `resetPasswordForEmail` con `redirectTo` → `/auth/callback?next=/auth`.

## Base de datos

Aplicar migraciones del repo (`supabase db push` o MCP):

- `public.profiles` + trigger en `auth.users` + RLS
- Índice `scores (game_id, user_id, score desc)` where `user_id is not null`
- RLS en `scores`: INSERT anon con `user_id null`; INSERT authenticated con `user_id null` o `user_id = auth.uid()`

Comprobar: `GET /api/health/supabase` → `{ ok: true }`.

## Smoke test manual

1. **Invitado:** jugar, guardar score → fila con `user_id` null.
2. **Registro:** crear cuenta → mensaje verificar correo; tras confirmar, login → navbar muestra `display_name`.
3. **Score logueado:** guardar en juego Supabase → `user_id` = uuid del usuario.
4. **Salón de la fama:** con sesión, **TU MEJOR MARCA** por `user_id`; sin sesión, por nombre en `localStorage`.

Spec de diseño: [`specs/12-auth-supabase.md`](../specs/12-auth-supabase.md).
