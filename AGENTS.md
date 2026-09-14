# Arcade Vault — Guía para el agente

Este archivo es la memoria persistente del proyecto. Cursor lo lee al inicio de cada sesión. `CLAUDE.md` importa este archivo para compatibilidad con Claude Code.

## Qué es este proyecto

**Arcade Vault** es una plataforma web retro para jugar online y competir por la mayor cantidad de puntos. La app ya tiene UI completa (landing, biblioteca, detalle de juego, reproductor CRT, salón de la fama, about/contacto y **auth Supabase** en `/auth`), **cinco** juegos jugables con engine TypeScript y leaderboard real en Supabase, y el resto del catálogo como placeholders visuales.

## Stack técnico

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 4 |
| Lenguaje | TypeScript (strict) |
| Lint / formato | ESLint (`eslint-config-next`), Prettier |
| Backend / datos | Supabase (`@supabase/ssr`, `@supabase/supabase-js`) |
| Email | Resend (formulario de contacto en `/about`) |
| Fuentes | Press Start 2P, JetBrains Mono, Courier Prime (`next/font`) |

## Funcionalidades implementadas

| Área | Descripción |
|------|-------------|
| Landing | Home con hero, stats, preview de juegos, pricing FAQ y animaciones (`/`). SPEC 02. |
| Biblioteca | Catálogo filtrable por categoría (`/games`). SPEC 01. |
| Detalle de juego | Ficha con descripción, leaderboard lateral y CTA jugar (`/games/[id]` o rutas estáticas). SPEC 01. |
| Reproductor | Marco CRT con HUD, pausa, game over y guardado de puntuación (`/play/[id]` o rutas estáticas). SPEC 01 + 05. |
| Salón de la fama | Tabs por juego; Supabase para juegos reales, mock para el resto (`/hall-of-fame`). SPEC 06. |
| About / contacto | Página informativa + formulario con envío vía Resend (`/about`). SPEC 03. |
| Auth Supabase | Email/contraseña, Google, GitHub, perfiles `display_name`, invitado sin sesión (`/auth`, `/auth/callback`). SPEC 12. |
| Supabase | Tablas `games` y `scores`, migraciones, health check (`/api/health/supabase`). SPEC 04 + 06. |
| Leaderboard | Server Actions para leer y guardar scores; nombre de jugador en `localStorage`. SPEC 06. |

## Juegos

Inventario completo en [`references/implemented-games.md`](references/implemented-games.md).

- **5 jugables** — `asteroids`, `tetris`, `arkanoid`, `snake`, `frogger`: engine TypeScript, rutas estáticas, leaderboard Supabase. Skins (classic/retro/neon), touch móvil y pasada de rendimiento aplicados en los cinco.
- **8 placeholders** — resto del catálogo en `app/data/games.ts`: ficha y reproductor mock vía `/games/[id]` y `/play/[id]`.

`frogger` se integró vía `@game-jam` (variante en [`specs/game-jam/frogger/01-frogger-classic.md`](specs/game-jam/frogger/01-frogger-classic.md)); no hay `specs/NN-frogger.md` promovido en la raíz de `specs/`.

Registros centrales: `app/data/static-game-routes.ts` (rutas estáticas) y `lib/data/supabase-games.ts` (leaderboard real).

## Patrón de integración de juegos

Referencia canónica: **Asteroids** (SPEC 05) + leaderboard (SPEC 06). Para un juego nuevo, seguir este árbol:

```
lib/games/{slug}/          # Engine TypeScript modular (entities, constants, engine.ts)
components/games/{slug}-canvas.tsx   # Monta el engine en <canvas> dentro del marco CRT
components/games/{slug}-player.tsx   # Estado React + GamePlayerShell + guardado de score
app/play/{slug}/page.tsx             # Ruta de juego
app/games/{slug}/page.tsx            # Ficha de detalle (GameDetailView)
app/data/static-game-routes.ts       # Añadir id a STATIC_GAME_ROUTES
lib/data/supabase-games.ts           # Añadir id a SUPABASE_GAMES
supabase/migrations/                 # Seed del juego en tabla games
```

**Engine API** (convención Asteroids): `mount(canvas)`, `unmount()`, `pause()`, `resume()`, `reset()`, `onStateChange(cb)` emitiendo `{ score, lives, level, phase }`.

**Shell compartido:** `GamePlayerShell` — HUD externo, overlays de pausa/game over, input de iniciales y botón GUARDAR PUNTUACIÓN.

**Guardado de score:** Server Action `app/actions/save-score.ts` → Supabase `scores`. `user_id` lo asigna **solo el servidor** tras `auth.getUser()` (email verificado); invitado → `null`. `player_name` es snapshot de la partida. Prefill de iniciales: `localStorage` (`av_player_name`) → perfil → `INVITADO` (`lib/use-default-player-name.ts`, `lib/player-name.ts`).

**Referencias de port:** prototipos vanilla en `references/started-games/` (p. ej. `02-asteroids`, `03-tetris`, `04-arkanoid`).

**Pipeline de integración (clásico):**

```
@game-planner → elegir juego → @add-game {slug} → Aprobado → @spec-impl-game NN-slug
```

**Pipeline creativo (game jam):**

```
@game-jam {tema} → revisar variantes en specs/game-jam/{slug}/ → elegir una → promover a specs/NN-{slug}.md → Aprobado → @spec-impl-game NN-slug
```

## Agentes y flujos spec

Invocar con `@nombre` en Cursor o `/nombre` en Claude Code. Skills en [`.claude/skills/`](.claude/skills/) (espejo [`.agents/skills/`](.agents/skills/)). Los subagentes con contexto limpio viven en [`.cursor/agents/`](.cursor/agents/); el resto se activa vía regla [`.cursor/rules/`](.cursor/rules/).

| Invocación | Qué hace | Definición |
|------------|----------|------------|
| `@game-planner` | Rankea candidatos retro antes de un spec; memoria en `references/game-planner/`. No escribe specs ni código. | [`.cursor/agents/game-planner.md`](.cursor/agents/game-planner.md) |
| `@game-jam` | Genera ≥2 variantes de spec temático en `specs/game-jam/`; no implementa. | [`.cursor/agents/game-jam.md`](.cursor/agents/game-jam.md) |
| `@add-game` | Spec unificado de integración + leaderboard (extiende `@spec`); solo estado `Borrador`. | [`.cursor/rules/add-game.mdc`](.cursor/rules/add-game.mdc) |
| `@spec` | Diseña specs genéricos antes de escribir código. | [`.cursor/rules/spec.mdc`](.cursor/rules/spec.mdc) |
| `@spec-impl` | Implementa un spec en estado `Aprobado` (features no juego). | [`.cursor/rules/spec-impl.mdc`](.cursor/rules/spec-impl.mdc) |
| `@spec-impl-game` | Implementa juego aprobado y encadena skins, touch móvil y rendimiento. | [`.cursor/rules/spec-impl-game.mdc`](.cursor/rules/spec-impl-game.mdc) |
| `@skin-designer` | Skins classic / retro / neon para un jugable; inventario en `references/skin-designer/`. | [`.cursor/agents/skin-designer.md`](.cursor/agents/skin-designer.md) |
| `@mobile-porter` | Touch play y layout CRT móvil por jugable (SPEC 10). | [`.cursor/agents/mobile-porter.md`](.cursor/agents/mobile-porter.md) |
| `@game-performance-booster` | FPS, HUD React y draw canvas por jugable (SPEC 11). | [`.cursor/agents/game-performance-booster.md`](.cursor/agents/game-performance-booster.md) |

Slugs de jugables actuales para post-integración: `asteroids`, `tetris`, `arkanoid`, `snake`, `frogger`.

## Skills

Además de la tabla anterior, skill de UI sin subagente dedicado:

| Skill | Uso | Definición |
|-------|-----|------------|
| `/frontend-design` | Interfaz retro CRT; tokens en `app/arcade-vault.css`. | [`.claude/skills/frontend-design/SKILL.md`](.claude/skills/frontend-design/SKILL.md) |

Usa siempre `/frontend-design` para diseñar la interfaz de usuario.

Para integrar un juego clásico: `@game-planner` → elegir juego → `@add-game {slug}` → revisar spec → cambiar a `Aprobado` → `@spec-impl-game NN-slug`.

Para un juego temático: `@game-jam {tema}` → revisar variantes → promover a `specs/NN-{slug}.md` → `Aprobado` → `@spec-impl-game NN-slug`.

Para features que no son juegos: `@spec` → `Aprobado` → `@spec-impl NN-slug`.

## Estructura del proyecto

```
app/
  layout.tsx              # Layout raíz (fuentes, Nav, Footer, AuthProvider)
  page.tsx                # Landing
  globals.css             # Tailwind + import de arcade-vault.css
  arcade-vault.css        # Design system retro (tokens, componentes, covers)
  about/                  # About + contacto
  auth/                   # Login/registro Supabase + callback OAuth/email
  games/                  # Biblioteca, detalle dinámico y rutas estáticas por juego
  play/                   # Reproductor dinámico y rutas estáticas por juego
  hall-of-fame/           # Leaderboard
  actions/                # Server Actions (leaderboard, save-score)
  api/                    # contact (Resend), health/supabase
  data/                   # Catálogo, home, about, scores mock, rutas estáticas
components/
  nav.tsx, footer.tsx, btn.tsx
  game-card.tsx, game-detail-view.tsx, game-player.tsx, game-player-shell.tsx
  games/                  # Canvas + player por juego implementado
  home/, about/           # Componentes de landing y contacto
  providers/auth-provider.tsx
lib/
  games/{slug}/           # Engines de juegos
  games/touch-controls/   # Barra táctil compartida (SPEC 10)
  auth/                   # Perfil, callback URL, user_id en scores (SPEC 12)
  supabase/               # client, server, queries, types
  data/                   # leaderboard híbrido, supabase-games
  navigation.ts, player-name.ts, contact.ts, use-mounted.ts
public/games/             # Assets estáticos por juego (sprites, sonidos)
supabase/migrations/      # SQL: games, scores, seeds, RLS
specs/                    # Specs de diseño (spec-driven development)
  game-jam/               # Specs temáticos con variantes (@game-jam)
references/
  implemented-games.md    # Inventario de juegos (jugables + placeholders)
  game-planner/           # Memoria de sugerencias (@game-planner)
  game-jam/               # Memoria de sesiones jam (@game-jam)
  skin-designer/          # Inventario de skins por juego (@skin-designer)
  mobile-porter/          # Inventario de cobertura táctil (@mobile-porter)
  game-performance-booster/  # Inventario de rendimiento por juego (@game-performance-booster)
  performance-game-patterns.md  # Patrones HUD/canvas/touch (SPEC 11)
  supabase-auth-setup.md    # Checklist dashboard Auth (SPEC 12)
  frogger/                # Baseline de rendimiento (@game-performance-booster)
  started-games/          # Prototipos vanilla para portar
  templates/              # Referencias JSX/CSS de diseño
  source-assets/          # Assets fuente
.cursor/rules/            # Reglas de Cursor (@spec, @spec-impl, @spec-impl-game, @add-game, @game-planner, @game-jam, @skin-designer, @mobile-porter, @game-performance-booster, nextjs)
.claude/skills/           # Skills del proyecto (spec, spec-impl, spec-impl-game, add-game, game-planner, game-jam, skin-designer, mobile-porter, game-performance-booster, frontend-design)
```

Alias de importación: `@/*` apunta a la raíz del proyecto.

## Supabase y datos

- **Tablas:** `games` (catálogo persistido), `scores` (historial de partidas), `profiles` (`display_name` por usuario, SPEC 12).
- **Juegos en Supabase:** `asteroids`, `tetris`, `arkanoid`, `snake`, `frogger` (`SUPABASE_GAMES`).
- **Híbrido:** juegos en Supabase leen/escriben scores reales; el resto usa `seededScores()` mock.
- **Auth:** Supabase Auth (cookies SSR). Sesión en `AuthProvider`; invitado = sin sesión. Scores: `user_id` en servidor si email verificado; `player_name` histórico por fila.
- **Migraciones:** `supabase/migrations/` — aplicar con Supabase CLI o MCP. Configuración Auth: [`references/supabase-auth-setup.md`](references/supabase-auth-setup.md).

## Variables de entorno

Ver `.env.example`:

| Variable | Uso |
|----------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clave pública (anon) |
| `NEXT_PUBLIC_SITE_URL` | Opcional; origen para redirects OAuth/email (ver `.env.example`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo servidor; opcional (scores usan sesión + RLS) |
| `RESEND_API_KEY` | Envío de correo del formulario de contacto |
| `CONTACT_TO_EMAIL` | Destinatario de mensajes de contacto |

## Comandos

```bash
npm run dev           # Servidor de desarrollo (http://localhost:3000)
npm run build         # Build de producción
npm run start         # Servir build de producción
npm run lint          # ESLint
npm run lint:fix      # ESLint con autofix
npm run format        # Prettier write
npm run format:check  # Prettier check
```

No hay suite de tests configurada todavía.

## Convenciones de código

- Componentes funcionales con TypeScript.
- Estilos con Tailwind CSS + clases del design system en `app/arcade-vault.css` (sin CSS modules).
- App Router de Next.js: páginas en `app/`, no `pages/`.
- Preferir Server Components; usar `"use client"` solo cuando haga falta interactividad (canvas, auth, formularios).
- Juegos nuevos: engine en `lib/games/`, no lógica de juego inline en componentes React.
- Rutas estáticas dedicadas para juegos reales; no añadir branches en `GamePlayer` genérico.
- Mantener cambios mínimos y enfocados; no refactorizar código no relacionado.

## Next.js — advertencia importante

Esta versión de Next.js tiene cambios respecto a versiones anteriores. Antes de escribir código, consulta la guía en `node_modules/next/dist/docs/` y respeta los avisos de deprecación. La regla `@nextjs` en `.cursor/rules/nextjs.mdc` refuerza esto para archivos en `app/`.

## Flujo spec-driven

Este proyecto usa **Spec Driven Design** con las skills de [fernando-skills](https://github.com/Klerith/fernando-skills).

### Specs del proyecto

| Spec | Título | Estado |
|------|--------|--------|
| 01 | MVP pantallas | Implementado |
| 02 | Homepage landing | Implementado |
| 03 | About + contacto | Implementado |
| 04 | Integración Supabase | Implementado |
| 05 | Juego Asteroids | Implementado |
| 06 | Catálogo y leaderboard Supabase | Implementado |
| 07 | Juego Tetris | Implementado |
| 08 | Juego Arkanoid | Implementado |
| 09 | Juego Snake | Implementado |
| 10 | Controles táctiles móvil | Implementado |
| 11 | Rendimiento Frogger (patrón por juego) | Implementado |

Spec **12** (auth Supabase): código en rama `spec-12-auth-supabase`; marcar **Implementado** en `specs/12-auth-supabase.md` tras validar criterios de aceptación (paso 11).

Juego **Frogger** implementado sin spec numerado en la raíz; diseño en [`specs/game-jam/frogger/`](specs/game-jam/frogger/).

### Ciclo de trabajo

**Features genéricas:**

1. **`@spec`** — Diseña un spec haciendo preguntas clarificadoras. Guarda en `specs/NN-slug.md` con estado `Borrador`.
2. **Revisión humana** — El humano relee el spec fuera del chat y cambia el estado a `Aprobado` manualmente.
3. **`@spec-impl`** — Valida que el estado sea `Aprobado`, crea la rama `spec-NN-slug` y implementa paso a paso con pausas para revisar diffs.

**Integración de un juego nuevo (clásico):**

1. **`@game-planner`** — Evalúa encaje, propone candidatos y persiste la sesión en `references/game-planner/suggestions-log.md`.
2. **Elección humana** — Se elige el juego a integrar.
3. **`@add-game {slug}`** — Genera `specs/NN-slug.md` en `Borrador` (extiende `@spec` con patrones SPEC 05 + 06).
4. **Revisión humana** — Cambiar estado a `Aprobado`.
5. **`@spec-impl-game NN-slug`** — Igual que `@spec-impl`, luego `@skin-designer`, `@mobile-porter` y `@game-performance-booster` en serie.

**Integración creativa (game jam):**

1. **`@game-jam {tema}`** — Propone variantes y escribe specs en `specs/game-jam/{folder-slug}/`.
2. **Elección humana** — Se elige una variante.
3. **Promoción** — Copiar spec elegido a `specs/NN-{slug}.md` (asignar siguiente `NN`).
4. **Revisión humana** — Cambiar estado a `Aprobado`.
5. **`@spec-impl-game NN-slug`** — Implementación + skins + touch + rendimiento.

Configuración en `specs/.spec-config.yml` (`AutoCreateBranch: true` crea la rama automáticamente).

### Estados de un spec

| Estado | Significado |
|--------|-------------|
| `Borrador` | Generado por `@spec`, pendiente de revisión humana |
| `En revisión` | El humano está iterando |
| `Aprobado` | Listo para implementar (`@spec-impl` o `@spec-impl-game`; ambos exigen este estado) |
| `Implementado` | Código listo y criterios de aceptación verificados |
| `Obsoleto` | Reemplazado por otro spec |

**Cambiar el estado a `Aprobado` es un acto deliberado del humano.** El agente nunca aprueba su propio trabajo.

### Cuándo usar specs

- Sí: features que tocan más de 2 archivos, decisiones costosas de revertir, trabajo de varias sesiones, integración de juegos nuevos.
- No: bug fixes puntuales, refactors mecánicos, experimentos exploratorios.

Ver `specs/README.md` para la plantilla y convenciones de formato.

## Reglas de Cursor

Las reglas en [`.cursor/rules/`](.cursor/rules/) corresponden a la tabla **Agentes y flujos spec** (mismo `@` en el chat). Además:

| Regla | Uso | Definición |
|-------|-----|------------|
| `@nextjs` | Convenciones y breaking changes de Next.js 16 en `app/`. | [`.cursor/rules/nextjs.mdc`](.cursor/rules/nextjs.mdc) |
