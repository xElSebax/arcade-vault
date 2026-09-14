# SPEC 12 — Autenticación con Supabase

> **Estado:** Aprobado
> **Depende de:** SPEC 04 — Integración de Supabase en Next.js, SPEC 06 — Catálogo y leaderboard Supabase
> **Fecha:** 2026-09-14
> **Objetivo:** Reemplazar el auth mock por Supabase Auth (email/contraseña, Google, GitHub) con perfiles persistidos, verificación de correo y recuperación de contraseña, vinculando las puntuaciones al `user_id` cuando hay sesión sin cerrar el juego a invitados.

## Alcance

**Dentro:**

- Sustituir el auth mock (`sessionStorage` + `av_user`) por sesión real de **Supabase Auth** (cookies vía `@supabase/ssr`, middleware/proxy existente).
- Mantener **una sola ruta** `/auth` con tabs **Iniciar sesión** / **Crear cuenta**, conservando el look retro actual (`auth-card`, tabs, estilos en `arcade-vault.css`).
- **Registro** con email, contraseña y **nombre visible** (display name, 1–10 caracteres, normalización igual que `normalizePlayerName` / auth mock).
- **Inicio de sesión** con email y contraseña.
- **Verificación de correo** obligatoria: UI clara si la cuenta no está confirmada; no asociar `user_id` en scores hasta sesión de usuario verificado (según reglas de Supabase).
- **Recuperar contraseña** mínimo viable en `/auth` (solicitud de reset por email + feedback en UI; callback/redirect de Supabase documentado).
- **OAuth** funcional: **Google** y **GitHub** (botones que hoy son decorativos), con redirect de vuelta a la app.
- **Jugar como invitado** (sin sesión): sin cambio de producto; navbar sin usuario; scores con `player_name` y `user_id = null`.
- Tabla **`public.profiles`**: `id` (= `auth.users.id`), `display_name`, `created_at`, `updated_at`; creación al registrarse (trigger o lógica en signup); lectura para navbar y prefill.
- Refactor de **`AuthProvider`** / `useAuth`: exponer usuario autenticado (id, email, `display_name`), `signOut`, estados de carga; eliminar persistencia mock en `sessionStorage`.
- **`save-score`**: en servidor, `auth.getUser()`; si hay usuario autenticado, insertar con `user_id` del servidor (nunca desde el cliente); `player_name` sigue siendo snapshot de la partida.
- **Salón de la fama** (juegos Supabase): fila **TU MEJOR MARCA** priorizando **`user_id`** si hay sesión; si no, por `player_name` en `localStorage` como hoy.
- Leaderboard público: seguir mostrando **`player_name` de cada fila** (histórico), sin reescribir nombres al cambiar perfil.
- **RLS** en `profiles` (lectura pública o autenticada según convenga; escritura solo del propio usuario) y refuerzo de inserción en `scores` coherente con Server Action + políticas si aplica.
- Variables de entorno y notas de configuración en dashboard Supabase (URLs de redirect, proveedores OAuth, plantilla de email).
- Actualizar referencias en docs del proyecto (`AGENTS.md` solo si el spec lo exige al implementar; el spec describe el cambio de “auth mock” a real).

**Fuera de alcance (para specs futuros):**

- Protección de rutas (middleware que redirige a `/auth`); el sitio sigue **público**.
- Pantalla de **cuenta / ajustes** (cambiar display name, email, borrar cuenta).
- Vincular scores anónimos previos a una cuenta recién creada (merge por `player_name`).
- Proveedores OAuth adicionales (Discord, Apple, etc.).
- Login solo con magic link sin contraseña.
- 2FA, sesiones multi-dispositivo avanzadas, auditoría de seguridad.
- Auth en Edge Functions o custom JWT fuera de Supabase.
- Sistema de créditos funcional.
- Tests automatizados E2E de auth.
- Internacionalización de copy de auth.

## Modelo de datos

### Supabase Auth (`auth.users`)

Cuentas gestionadas por Supabase. Campos relevantes para la app (no duplicar en `app/data/`):

- `id` (`uuid`) — identidad estable para `scores.user_id` y `profiles.id`.
- `email` — login y verificación.
- `email_confirmed_at` — gating para tratar la sesión como válida para puntuaciones con `user_id` (alineado con verificación obligatoria).

OAuth (Google/GitHub) crea fila en `auth.users` igual que email/password; el display name inicial se toma del flujo de registro o de metadata del proveedor con fallback documentado en implementación.

### Tabla `public.profiles` (nueva migración)

```sql
create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  display_name  text not null check (char_length(display_name) between 1 and 10),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index profiles_display_name_idx on public.profiles (display_name);
```

- `display_name`: siempre normalizado en app (trim, mayúsculas, máx. 10) antes de insert/update.
- Trigger `on auth.users insert` → crear fila en `profiles` con `display_name` proveniente del signup (metadata/registro) o valor por defecto acotado si OAuth no aporta nombre usable.

**RLS (resumen):**

- `SELECT`: `anon` y `authenticated` pueden leer perfiles (necesario para mostrar nombres en UI pública si aplica; ajustar a “solo authenticated” si se prefiere mínimo exposición — decisión de implementación: lectura pública del `display_name` únicamente).
- `INSERT`: solo vía trigger/service o política `authenticated` con `id = auth.uid()` en el primer upsert post-signup.
- `UPDATE`: `authenticated` y `id = auth.uid()` (aunque la UI de edición queda fuera de alcance, la política deja el modelo listo).

### Tabla `public.scores` (existente, SPEC 06)

Sin cambio de esquema. Uso actualizado:

| Campo         | Invitado / sin sesión              | Usuario autenticado y verificado                          |
|---------------|------------------------------------|-----------------------------------------------------------|
| `player_name` | Iniciales del formulario game over | Mismo (snapshot de la partida; puede venir prefill del perfil) |
| `user_id`     | `null`                             | `auth.users.id` del servidor                              |

Índice recomendado (nueva migración si no existe):

```sql
create index scores_game_id_user_id_score_idx
  on public.scores (game_id, user_id, score desc)
  where user_id is not null;
```

**RLS `scores`:** mantener inserción vía Server Action con cliente de sesión; añadir política opcional `INSERT` para `authenticated` con `user_id = auth.uid()` solo si el insert deja de usar service role. La regla de negocio: **`user_id` en el payload del cliente se ignora**; solo el servidor asigna `user_id` tras `getUser()`.

### Cliente — contrato de `useAuth` (reemplazo del mock)

```ts
export interface AuthUser {
  id: string;
  email: string;
  displayName: string; // desde profiles.display_name
}

export interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  // Sin login(name) mock; login/registro viven en /auth vía Supabase client
}
```

- Eliminar `login`, `loginAsGuest` del contexto mock; **invitado** = `user === null` sin llamar a Supabase.
- Opcional: evento/callback `onAuthStateChange` de Supabase para sincronizar React.

### `localStorage` — `av_player_name` (existente)

- Sigue usándose para **invitados** y prefill de iniciales en `GamePlayerShell`.
- Usuario logueado: prefill desde `displayName` del perfil; al guardar score, servidor rellena `user_id` y persiste `player_name` enviado (normalizado).

### Server Action `saveScore`

```ts
export interface SaveScoreInput {
  gameId: string;
  playerName: string;
  score: number;
  // Sin userId en input — prohibido confiar en el cliente
}
```

Lógica servidor:

1. Validar `gameId`, `playerName`, `score` (igual que hoy).
2. `const { data: { user } } = await supabase.auth.getUser()`.
3. `user_id`: `user?.id ?? null` solo si el usuario existe y cumple criterio de email verificado (si `getUser()` ya excluye no verificados, documentar; si no, comprobar `email_confirmed_at` o equivalente).
4. `insert` en `scores` con `player_name`, `score`, `user_id`.

### Server / queries — “TU MEJOR MARCA”

Nueva firma o overload en capa de datos:

```ts
// Por nombre (invitado / legacy)
getPlayerBestForGame(gameId: string, playerName: string): Promise<PlayerBest | null>;

// Por usuario (sesión)
getPlayerBestForGameByUserId(gameId: string, userId: string): Promise<PlayerBest | null>;
```

Consulta por `user_id`: mejor `score` para `game_id`, rango calculado contra leaderboard del juego (misma lógica que hoy por nombre).

### Variables de entorno (añadir a `.env.example`)

```env
# Ya existentes
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=

# Redirect site URL (documentación; también en Supabase Dashboard)
# NEXT_PUBLIC_SITE_URL=http://localhost:3000  # opcional helper para OAuth/reset
```

Configuración en dashboard (no son env vars): Google/GitHub OAuth client IDs, **Site URL**, **Redirect URLs** (`/auth/callback` o ruta acordada en el plan de implementación).

### Archivos que tocan datos (referencia)

- `supabase/migrations/*_profiles.sql` — tabla + RLS + trigger.
- `supabase/migrations/*_scores_user_index.sql` — índice opcional.
- `lib/supabase/types.ts` — regenerar o ampliar con `profiles`.
- `components/providers/auth-provider.tsx` — sesión Supabase.
- `app/auth/page.tsx` + ruta callback OAuth si aplica.
- `app/actions/save-score.ts`, `lib/data/leaderboard.ts`, `app/actions/leaderboard.ts`, `app/hall-of-fame/page.tsx`.

## Plan de implementación

1. **Migración Supabase** — Añadir `public.profiles` (columnas acordadas), trigger post-insert en `auth.users`, políticas RLS de `profiles`, e índice parcial en `scores (game_id, user_id, score desc)`. Aplicar migración en el proyecto remoto/local. *Comprobación:* tabla visible en dashboard; políticas activas; la app sigue compilando (sin usar perfiles aún).

2. **Callback de auth** — Crear `app/auth/callback/route.ts` (patrón `@supabase/ssr`: intercambio de código por sesión y cookies). Definir redirect post-login (p. ej. `/games`). *Comprobación:* abrir URL de callback no rompe build; tras configurar dashboard, OAuth/email links redirigen sin error 500.

3. **Capa de perfil** — `lib/supabase/types.ts` (tipo `Profile` / fila de `profiles`) y helper servidor/cliente para leer `display_name` por `user.id` (p. ej. `lib/auth/profile.ts`). *Comprobación:* helper importable; sin uso en UI aún.

4. **`AuthProvider` real** — Reemplazar `sessionStorage` mock por `createBrowserClient` + `onAuthStateChange`; estado `{ user: AuthUser | null, isLoading }` con `id`, `email`, `displayName`; `signOut()` vía `supabase.auth.signOut()`. Eliminar `login`, `loginAsGuest`, `STORAGE_KEY`. *Comprobación:* sin sesión, `user === null`; navbar muestra “Iniciar sesión”; no quedan referencias rotas a `logout` (renombrar a `signOut` en `nav.tsx`).

5. **Pantalla `/auth`** — Implementar registro (`signUp` con email/password + metadata para `display_name`), login (`signInWithPassword` + mensajes si email no confirmado), “¿Olvidaste tu contraseña?” (`resetPasswordForEmail`), OAuth Google/GitHub con `redirectTo` al callback, invitado solo `router.push` sin Supabase, estados de error/carga en UI. *Comprobación:* flujo email en dev; OAuth tras configurar providers; invitado lleva a biblioteca sin sesión.

6. **`save-score` con identidad** — En Server Action: `getUser()`; asignar `user_id` solo con usuario presente y email verificado; insert con `player_name` snapshot. No aceptar `userId` del cliente. *Comprobación:* partida logueada inserta fila con `user_id` no nulo en Supabase; invitado sigue con `null`.

7. **Leaderboard por usuario** — Implementar `getPlayerBestForGameByUserId` en `lib/data/leaderboard.ts` y exposición en `app/actions/leaderboard.ts`. *Comprobación:* server action devuelve mejor marca para un `user_id` de prueba.

8. **Salón de la fama** — Si `useAuth().user`, llamar fetch por `user.id`; si no, mantener flujo por `displayName` / `localStorage`. Ajustar `displayName` local para usar `user.displayName`. Limpiar o acotar mocks decorativos de `youRank`/`youScore` si siguen atados al auth mock. *Comprobación:* usuario logueado ve **TU MEJOR MARCA** aunque cambie iniciales en un score nuevo; invitado igual que antes por nombre guardado.

9. **Jugadores y shell** — Actualizar `*-player.tsx` y `game-player.tsx`: `user?.name` → `user?.displayName` en prefill de iniciales. *Comprobación:* game over muestra iniciales del perfil si hay sesión.

10. **Documentación operativa** — Actualizar `.env.example` (comentarios Site URL / redirect). Añadir en el spec o `references/` breve checklist de dashboard: confirmación de email, URLs, Google/GitHub, plantilla reset. Actualizar `AGENTS.md` (auth real, `user_id` en scores). *Comprobación:* otro dev puede configurar auth siguiendo el checklist.

11. **Cierre** — `npm run build` y `npm run lint` sin errores; recorrer criterios de aceptación del spec; cambiar estado del spec a **Implementado** cuando el humano valide.

## Criterios de aceptación

### Registro y sesión

- [ ] En `/auth`, tab **Crear cuenta**, con email válido, contraseña y nombre visible (1–10 caracteres), el submit crea usuario en Supabase y muestra mensaje de **verificar correo** (no redirige como si ya estuviera dentro si la confirmación es obligatoria).
- [ ] Tras confirmar el email (enlace de Supabase), **Iniciar sesión** con esas credenciales establece sesión y el navbar muestra el **display name** del perfil (no el mock de `sessionStorage`).
- [ ] **Iniciar sesión** sin email confirmado muestra error o aviso claro y no trata al usuario como apto para `user_id` en scores.
- [ ] **Cerrar sesión** desde el navbar elimina la sesión; el navbar vuelve a **Iniciar sesión**; recargar la página no restaura sesión mock.

### OAuth e invitado

- [ ] Botón **Google** inicia OAuth y, con providers configurados, vuelve a la app con sesión activa y fila en `profiles` con `display_name` coherente.
- [ ] Botón **GitHub** cumple lo mismo que Google.
- [ ] **Jugar como invitado** navega a la biblioteca **sin** sesión Supabase (`user === null`).

### Recuperación de contraseña

- [ ] En tab inicio de sesión, **olvidé mi contraseña** (o equivalente) envía email de reset vía Supabase y la UI confirma el envío sin exponer si el email existe de forma insegura (mensaje genérico aceptable).

### Perfiles y datos

- [ ] Cada usuario nuevo tiene fila en `public.profiles` con `id` = `auth.users.id` y `display_name` normalizado (mayúsculas, máx. 10).
- [ ] No queda uso de `sessionStorage` clave `av_user` para auth en `auth-provider.tsx`.

### Puntuaciones

- [ ] Usuario autenticado y verificado que guarda score en un juego Supabase inserta en `scores` con **`user_id`** = su uuid y `player_name` = iniciales enviadas (snapshot).
- [ ] Invitado que guarda score inserta con **`user_id` null** y `player_name` válido.
- [ ] El cliente **no puede** forzar otro `user_id` (solo el servidor asigna).

### Salón de la fama

- [ ] Con sesión activa, en un juego Supabase, aparece **TU MEJOR MARCA** basada en **`user_id`**, no solo por coincidencia de `player_name` en `localStorage`.
- [ ] Sin sesión, **TU MEJOR MARCA** sigue funcionando por nombre en `localStorage` cuando hay datos.
- [ ] El top del leaderboard sigue mostrando el **`player_name` de cada fila** (histórico), no el display name actual del perfil.

### Infra y calidad

- [ ] `GET /api/health/supabase` sigue respondiendo `{ ok: true }` con variables configuradas.
- [ ] El middleware/proxy existente sigue refrescando sesión sin redirigir rutas públicas.
- [ ] `npm run build` y `npm run lint` pasan sin errores nuevos atribuibles a este cambio.

## Decisiones

- **Sí:** Supabase Auth como único proveedor de identidad (email/contraseña + Google + GitHub), sobre la integración de SPEC 04.
- **No:** Auth mock (`sessionStorage`, `login(name)`). Se elimina al implementar.
- **Sí:** Una sola ruta `/auth` con tabs; no rutas separadas `/login` y `/register`.
- **Sí:** Tabla `public.profiles` con `display_name` en lugar de depender solo de `raw_user_meta_data` — facilita RLS, lecturas y evolución (p. ej. editar nombre en un spec futuro).
- **No:** Pantalla de cuenta/ajustes en este spec; el nombre se fija en registro (y OAuth con fallback documentado).
- **Sí:** Verificación de email obligatoria antes de tratar la sesión como válida para `user_id` en scores.
- **Sí:** Recuperación de contraseña mínima en `/auth`.
- **Sí:** Mantener **Jugar como invitado**; invitado = ausencia de sesión, sin atajo mock.
- **Sí:** Sitio público sin protección de rutas en middleware (SPEC 04 se mantiene en espíritu: refresh de sesión, sin redirects forzados).
- **Sí:** `scores.user_id` asignado **solo en servidor** tras `auth.getUser()`; el cliente no envía `userId`.
- **Sí:** Refuerzo RLS en `scores` (INSERT autenticado con `user_id = auth.uid()`) **además** de la validación en Server Action — defensa en profundidad si el patrón de insert cambia.
- **Sí:** Leaderboard público muestra `player_name` histórico por fila; identidad estable del jugador logueado vía `user_id` para **TU MEJOR MARCA** y análisis futuro.
- **Sí:** Prefill de iniciales en game over desde `profiles.display_name` si hay sesión; invitados siguen con `localStorage` (`av_player_name`).
- **No:** Fusionar scores anónimos previos al crear cuenta (merge por nombre).
- **No:** OAuth adicional, magic-link-only, 2FA, tests E2E — specs futuros.
- **Sí:** Renombrar API de contexto: `signOut` en lugar de `logout`; `AuthUser.displayName` en lugar de `User.name`.
- **Definición guiada:** El alcance se cerró en conversación (Fase 2) con bloques de preguntas; no se omitió la fase de aclaración.

## Riesgos

| Riesgo | Mitigación |
|--------|------------|
| OAuth mal configurado (redirect URL, Site URL) | Checklist en paso 10 del plan; probar Google y GitHub en local con URLs explícitas en dashboard. |
| Usuario OAuth sin nombre usable | Fallback de `display_name` (p. ej. prefijo de email o `PLAYER` + sufijo) acotado a 10 caracteres y único suficiente para UI. |
| Race: score guardado antes de que exista fila `profiles` | Trigger en `auth.users` + manejo de error en signup; reintentar lectura de perfil en `AuthProvider` tras `SIGNED_IN`. |
| Email no confirmado pero sesión parcial | Comprobar confirmación antes de `user_id`; mensajes claros en login y al guardar score si aplica. |
| RLS bloquea INSERT de scores | Mantener Server Action con cliente de sesión del usuario; política INSERT alineada con `auth.uid()`; probar en dev con usuario real. |
| Lectura pública de `profiles` expone emails | Solo exponer `display_name` en queries de app; no seleccionar email desde `profiles` (email solo vía `auth.getUser()` en servidor/cliente auth). |

## Qué **no** está en este spec

- Protección de rutas y “solo usuarios logueados pueden jugar”.
- Pantalla de cuenta, cambio de display name post-registro, borrado de cuenta.
- Merge de puntuaciones anónimas al registrarse.
- Proveedores OAuth distintos de Google y GitHub.
- Magic link sin contraseña, 2FA y auditoría de seguridad avanzada.
- Tests E2E automatizados de flujos de auth.
- Créditos funcionales e i18n del copy de auth.

Cada uno de esos temas, si se aborda, va en su propio spec.
