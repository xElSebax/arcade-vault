# App security checklist — `@security-auditor`

Recorrer en modo `app` o `full`. Marcar ✅ / ❌ / ⚠️ (runtime o manual). Referencia: SPEC 12, SPEC 13.

## A — HTTP headers (`next.config.ts`)

| # | Criterio | Referencia |
|---|----------|------------|
| A1 | `X-Content-Type-Options: nosniff` en `/(.*)` | SPEC 13 |
| A2 | `X-Frame-Options: DENY` | SPEC 13 |
| A3 | `Referrer-Policy: strict-origin-when-cross-origin` | SPEC 13 |
| A4 | No CSP/HSTS en este proyecto (fuera de alcance; no marcar como fallo) | SPEC 13 decisiones |

## B — Proxy y rutas (`proxy.ts`, `lib/supabase/proxy.ts`, `lib/auth/route-protection.ts`)

| # | Criterio | Referencia |
|---|----------|------------|
| B1 | Proxy exporta `proxy` + `config.matcher` (Next.js 16) | SPEC 13 |
| B2 | Sesión Supabase se refresca en rutas no estáticas | SPEC 04 / 12 |
| B3 | `PUBLIC_PATH_PREFIXES` incluye `/`, `/games`, `/play`, `/hall-of-fame`, `/about`, `/auth`, `/api/health`, `/api/contact` | SPEC 13 |
| B4 | `/auth/callback` no bloqueado por reglas de login redirect | SPEC 12 |
| B5 | `isProtectedPath` → sin sesión redirect a `/auth?next=` (path codificado) | SPEC 13 |
| B6 | Usuario con sesión en `/auth` (login) redirige fuera (p. ej. `/games`) | SPEC 13 |
| B7 | `next` / redirect post-login: solo paths relativos seguros (no `//`, no open redirect) | SPEC 12 / 13 |
| B8 | Catálogo y jugar invitado siguen públicos (no login obligatorio en `/play/*`) | SPEC 12 / 13 |

## C — Auth UI (`app/auth/`)

| # | Criterio | Referencia |
|---|----------|------------|
| C1 | Registro usa `isPasswordValid` / `password-policy.ts` (mín. 8 + complejidad) | SPEC 13 |
| C2 | Login no exige complejidad en cliente (solo campos requeridos) | SPEC 13 |
| C3 | Mensaje de requisitos de contraseña claro en español | SPEC 13 |
| C4 | OAuth (Google/GitHub) usa redirect documentado; no secrets en cliente | SPEC 12 |
| C5 | Display name normalizado (1–10 chars) coherente con scores/perfiles | SPEC 12 |

## D — Server Actions y datos (`app/actions/`)

| # | Criterio | Referencia |
|---|----------|------------|
| D1 | `saveScore` usa `"use server"` y cliente Supabase servidor | SPEC 06 / 12 |
| D2 | `user_id` derivado de `auth.getUser()` + `scoreUserIdFromAuthUser`, no del input cliente | SPEC 12 |
| D3 | Validación de `player_name` (1–10), `score` (entero ≥ 0), `gameId` existente en `games` | SPEC 06 |
| D4 | Errores de insert no filtran detalles internos al usuario | Buena práctica |
| D5 | Leaderboard read actions: solo lectura; sin mutaciones desde cliente no autorizadas | SPEC 06 |

## E — API routes (`app/api/`)

| # | Criterio | Referencia |
|---|----------|------------|
| E1 | `/api/contact`: JSON parse seguro; `validateContactPayload` | SPEC 03 |
| E2 | Honeypot `website` — respuesta OK silenciosa si relleno | Anti-spam |
| E3 | `RESEND_API_KEY`, `CONTACT_TO_EMAIL` solo servidor | SPEC 03 |
| E4 | `/api/health/supabase`: no expone service role ni claves | SPEC 04 |
| E5 | No endpoints nuevos sin autenticación/rate limit documentados (flag si aparecen en delta) | SPEC 13 fuera de alcance rate limit |

## F — Secretos y entorno

| # | Criterio | Referencia |
|---|----------|------------|
| F1 | Solo `NEXT_PUBLIC_*` en código cliente para Supabase URL/key publicable | `.env.example` |
| F2 | `SUPABASE_SERVICE_ROLE_KEY` no importado en componentes `"use client"` | SPEC 04 |
| F3 | `.env` / `.env.local` no commiteados (grep accidental en diff) | Repo hygiene |
| F4 | Documentación alineada con `.env.example` | AGENTS.md |

## G — Cliente auth (`components/providers/auth-provider.tsx`, `lib/supabase/`)

| # | Criterio | Referencia |
|---|----------|------------|
| G1 | Sesión vía cookies SSR; no auth mock en `sessionStorage` | SPEC 12 |
| G2 | `signOut` limpia sesión; navbar no filtra tokens | SPEC 12 |
| G3 | Cliente browser usa anon key, no service role | SPEC 04 |

## Delta mode — archivos sensibles

Si el diff toca alguno de estos, re-auditar secciones relacionadas:

`next.config.ts`, `proxy.ts`, `lib/supabase/**`, `lib/auth/**`, `app/auth/**`, `app/actions/**`, `app/api/**`, `components/providers/auth-provider.tsx`.
