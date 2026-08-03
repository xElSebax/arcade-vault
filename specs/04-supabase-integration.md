# SPEC 04 — Integración de Supabase en Next.js

> **Estado:** Aprobado
> **Depende de:** SPEC 01 — MVP visual de Arcade Vault
> **Fecha:** 2026-08-03
> **Objetivo:** Integrar el cliente de Supabase en la app Next.js (SDK, utilidades server/browser, middleware y variables de entorno) dejando la infraestructura lista para specs futuros, sin cambiar la funcionalidad actual.

## Alcance

**Dentro:**

- Instalar dependencias oficiales: `@supabase/supabase-js` y `@supabase/ssr`.
- Variables de entorno documentadas en `.env.example`:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (solo servidor; para uso futuro en API routes / server actions)
  - Mantener `SUPABASE_DB_PASSWORD` si aplica al plugin/CLI de Supabase.
- Utilidades de cliente en `lib/supabase/`:
  - `client.ts` — `createBrowserClient` para Client Components.
  - `server.ts` — `createServerClient` para Server Components, Route Handlers y Server Actions.
  - `middleware.ts` — helper para crear el cliente en `middleware.ts` raíz.
- `middleware.ts` en la raíz del proyecto que refresque la sesión de auth vía cookies (patrón recomendado por Supabase SSR). Sin protección de rutas ni redirects.
- Ruta de verificación `app/api/health/supabase/route.ts` (GET) que confirme que las env vars están presentes y que el cliente server puede contactar Supabase (p. ej. `auth.getSession()`). Respuesta JSON `{ ok: true }` o `{ ok: false, error: "..." }`.
- La app sigue funcionando igual: auth mock, datos en `app/data/`, formulario de contacto con Resend.

**Fuera de alcance (para specs futuros):**

- Reemplazar `auth-provider.tsx` por Supabase Auth (login, registro, OAuth, invitado).
- Crear tablas, migraciones SQL o esquema de base de datos.
- Migrar datos mock (`app/data/`) a Supabase.
- Realtime (suscripciones, presencia, broadcast).
- Edge Functions (crear, desplegar o invocar).
- Row Level Security (RLS) y políticas de seguridad.
- Generación de tipos TypeScript desde el esquema (`supabase gen types`).
- Protección de rutas o redirects basados en sesión.
- Cambios en UI (`/auth`, navbar, salón de la fama, etc.).
- Tests automatizados.
- Configuración de Supabase CLI local (`supabase start`, `config.toml`).

## Modelo de datos

Esta feature no introduce tablas ni persistencia en Supabase. Solo configura la capa de conexión. Los datos de la app siguen viviendo en `app/data/` y el auth mock en `sessionStorage`.

### Variables de entorno (`.env.local`)

```env
# Supabase — obtén estos valores en https://supabase.com/dashboard/project/_/settings/api
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...

# Solo servidor — nunca exponer al cliente. Para specs futuros (admin, bypass RLS).
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# Opcional — contraseña de la BD del proyecto (plugin Supabase / CLI)
SUPABASE_DB_PASSWORD=
```

### Respuesta de la ruta de health check

```ts
// GET /api/health/supabase
export interface SupabaseHealthSuccess {
  ok: true;
}

export interface SupabaseHealthError {
  ok: false;
  error: string; // mensaje legible, sin exponer keys ni stack traces
}
```

### Estructura de archivos nuevos

```
lib/supabase/
  client.ts       # createBrowserClient — Client Components
  server.ts       # createServerClient — Server Components / Route Handlers
  middleware.ts   # createServerClient — middleware raíz
middleware.ts     # refresco de sesión (sin protección de rutas)
app/api/health/supabase/route.ts
```

No se modifican interfaces existentes (`User` de `auth-provider.tsx`, `Game`, `ScoreRow`, etc.).

## Plan de implementación

1. **Dependencias** — Instalar `@supabase/supabase-js` y `@supabase/ssr`. Verificar que el proyecto compila sin errores (`npm run build` o al menos `tsc --noEmit`).

2. **Variables de entorno** — Actualizar `.env.example` con `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` y comentarios de dónde obtener cada valor. Mantener `SUPABASE_DB_PASSWORD` con su nota. El humano copia valores reales a `.env.local`.

3. **Utilidades de cliente** — Crear `lib/supabase/`:
   - `client.ts` — exporta `createClient()` con `createBrowserClient`.
   - `server.ts` — exporta `createClient()` async con `createServerClient` + `cookies()` de `next/headers`.
   - `middleware.ts` — exporta `createClient(request)` con el patrón de cookies de Supabase SSR para middleware.

4. **Middleware raíz** — Crear `middleware.ts` en la raíz del proyecto:
   - Instanciar cliente Supabase con el helper de `lib/supabase/middleware.ts`.
   - Llamar `await supabase.auth.getUser()` para refrescar sesión.
   - Devolver `response` sin redirects ni bloqueos de rutas.
   - Configurar `matcher` para excluir assets estáticos (`_next/static`, `_next/image`, `favicon.ico`, imágenes).

5. **Health check** — Crear `app/api/health/supabase/route.ts` (GET):
   - Verificar que `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` existen.
   - Crear cliente server y llamar `auth.getSession()`.
   - Responder `{ ok: true }` si la conexión funciona; `{ ok: false, error: "..." }` si falla.
   - Probar con `curl http://localhost:3000/api/health/supabase` con `.env.local` configurado.

6. **Smoke test manual** — Con `.env.local` configurado:
   - `npm run dev` arranca sin errores.
   - Navegar `/`, `/games`, `/auth` — todo funciona igual que antes (auth mock intacto).
   - `GET /api/health/supabase` devuelve `{ ok: true }`.
   - Sin errores de TypeScript ni ESLint en archivos nuevos.
   - Sin warnings de middleware en consola del servidor.

## Criterios de aceptación

### Dependencias y entorno

- [ ] `@supabase/supabase-js` y `@supabase/ssr` están en `package.json`.
- [ ] `.env.example` documenta `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` con comentarios de dónde obtenerlos.
- [ ] El proyecto compila sin errores de TypeScript.

### Utilidades de cliente

- [ ] Existe `lib/supabase/client.ts` exportando un cliente browser.
- [ ] Existe `lib/supabase/server.ts` exportando un cliente server (async, con cookies).
- [ ] Existe `lib/supabase/middleware.ts` exportando un helper para middleware.

### Middleware

- [ ] Existe `middleware.ts` en la raíz del proyecto.
- [ ] El middleware refresca la sesión (`getUser()`) sin bloquear ni redirigir rutas.
- [ ] El `matcher` excluye assets estáticos (`_next/static`, `_next/image`, `favicon.ico`, imágenes).
- [ ] `npm run dev` arranca sin errores de middleware.

### Health check

- [ ] `GET /api/health/supabase` devuelve `{ ok: true }` con `.env.local` configurado correctamente.
- [ ] Sin env vars configuradas, devuelve `{ ok: false, error: "..." }` con mensaje claro (sin exponer keys).
- [ ] La respuesta nunca incluye valores de API keys ni stack traces.

### Sin regresiones

- [ ] `/auth` sigue usando auth mock (`auth-provider.tsx`) — login/invitado funcionan igual.
- [ ] `/games`, `/hall-of-fame`, `/about` funcionan sin cambios.
- [ ] Los datos siguen viniendo de `app/data/` (sin consultas a Supabase en pantallas).
- [ ] El formulario de contacto (`/api/contact`) sigue funcionando con Resend.

### Técnico

- [ ] Sin errores de ESLint en archivos nuevos o modificados.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` no se importa ni se usa en Client Components ni en código con prefijo `NEXT_PUBLIC_`.

### Fuera de alcance (verificar que NO existe)

- [ ] No hay tablas ni migraciones SQL en el repo.
- [ ] No se reemplazó `auth-provider.tsx` por Supabase Auth.
- [ ] No hay suscripciones Realtime ni Edge Functions.
- [ ] No hay protección de rutas ni redirects por sesión.
- [ ] No se migraron datos de `app/data/` a Supabase.

## Decisiones

- **Sí:** `@supabase/ssr` en lugar de solo `@supabase/supabase-js`. Patrón oficial para Next.js App Router con manejo correcto de cookies en server, middleware y browser.
- **No:** Usar solo `@supabase/supabase-js` sin SSR. No maneja cookies de sesión correctamente en Server Components ni middleware.
- **Sí:** Middleware de refresco de sesión desde el inicio. Evita sorpresas cuando un spec futuro active auth real; coste mínimo ahora.
- **No:** Omitir middleware hasta el spec de auth. Habría que reintroducirlo después y probar de nuevo toda la integración.
- **Sí:** Health check en `/api/health/supabase`. Verificación concreta de que la conexión funciona sin tocar UI ni auth.
- **No:** Verificar conexión solo en build time. No confirma que las credenciales son válidas ni que Supabase responde.
- **Sí:** `SUPABASE_SERVICE_ROLE_KEY` documentada en `.env.example` aunque no se use aún. Specs futuros (admin, bypass RLS) la necesitarán; evita reconfigurar entorno después.
- **No:** Omitir la service role key del ejemplo. Obligaría a buscarla y documentarla en cada spec que la requiera.
- **Sí:** Mantener auth mock intacto. Este spec es solo integración; reemplazar auth es un spec separado con su propio alcance y criterios.
- **No:** Migrar `/auth` a Supabase Auth en este spec. Mezcla infraestructura con funcionalidad y rompe el principio de un spec = una responsabilidad.
- **Sí:** Sin tablas ni migraciones SQL. El esquema de BD merece su propio spec con modelo de datos pensado (juegos, scores, profiles, RLS).
- **No:** Crear tablas "por si acaso" en este spec. Sin uso inmediato, el esquema se diseñaría a ciegas.
- **Sí:** Realtime y Edge Functions explícitamente fuera de alcance. Se mencionaron como uso futuro; van en specs dedicados cuando haya caso de uso concreto.
- **No:** Instalar o configurar Realtime/Edge Functions "de paso". Añade complejidad sin beneficio hasta que haya feature que los consuma.
- **Sí:** Proyecto Supabase ya creado por el humano. El spec asume que URL y keys existen; el agente no crea proyectos en supabase.com.
- **No:** Incluir pasos de creación de proyecto en Supabase Dashboard. El humano ya lo tiene hecho.
- **Sí:** Sin Supabase CLI local (`supabase start`, `config.toml`). La integración es contra el proyecto remoto; CLI local es opcional para otro momento.
- **No:** Inicializar `supabase/` con CLI en este spec. Añade dependencia de Docker/local sin requisito inmediato.

## Riesgos

| Riesgo                                                     | Mitigación                                                                                                                             |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_*` keys ausentes en runtime                   | El health check devuelve `{ ok: false, error: "..." }` con mensaje claro; no crashea la app ni las pantallas existentes.               |
| `SUPABASE_SERVICE_ROLE_KEY` expuesta al cliente            | Solo se documenta en `.env.example`; no se importa en ningún archivo de este spec. Criterio de aceptación explícito.                   |
| Middleware interfiere con rutas estáticas o API existentes | `matcher` excluye `_next/static`, `_next/image`, `favicon.ico` e imágenes; smoke test recorre `/`, `/games`, `/auth` y `/api/contact`. |
| Cambios de API en `@supabase/ssr` con Next.js 16           | Consultar docs en `node_modules` y guía oficial antes de implementar; fijar versiones en `package.json`.                               |
| Health check falla por red pero la app "funciona"          | El health check es diagnóstico, no bloqueante; las pantallas mock siguen operando sin Supabase.                                        |
| Confusión sobre qué hace este spec vs. auth real           | Alcance, decisiones y sección final repiten que auth mock y datos estáticos no cambian.                                                |

## Lo que NO está en este spec

- Reemplazo de auth mock por Supabase Auth (login, registro, OAuth, invitado).
- Tablas, migraciones SQL o esquema de base de datos.
- Migración de datos mock (`app/data/`) a Supabase.
- Realtime (suscripciones, presencia, broadcast).
- Edge Functions (crear, desplegar o invocar).
- Row Level Security (RLS) y políticas de seguridad.
- Generación de tipos TypeScript desde el esquema.
- Protección de rutas o redirects por sesión.
- Cambios en UI (`/auth`, navbar, salón de la fama, etc.).
- Supabase CLI local (`supabase start`, `config.toml`).
- Tests automatizados.

Cada uno de estos, si llega, va en su propio spec.
