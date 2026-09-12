# Arcade Vault — Guía para el agente

Este archivo es la memoria persistente del proyecto. Cursor lo lee al inicio de cada sesión. `CLAUDE.md` importa este archivo para compatibilidad con Claude Code.

## Qué es este proyecto

**Arcade Vault** es una plataforma web retro para jugar online y competir por la mayor cantidad de puntos. La app ya tiene UI completa (landing, biblioteca, detalle de juego, reproductor CRT, salón de la fama, about/contacto y auth mock), cuatro juegos jugables con engine TypeScript y leaderboard real en Supabase, y el resto del catálogo como placeholders visuales.

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
| Auth mock | Login/registro simulado con nombre en `sessionStorage` (`/auth`). SPEC 01. |
| Supabase | Tablas `games` y `scores`, migraciones, health check (`/api/health/supabase`). SPEC 04 + 06. |
| Leaderboard | Server Actions para leer y guardar scores; nombre de jugador en `localStorage`. SPEC 06. |

## Juegos

Inventario completo en [`references/implemented-games.md`](references/implemented-games.md).

- **4 jugables** — `asteroids`, `tetris`, `arkanoid`, `snake`: engine TypeScript, rutas estáticas, leaderboard Supabase.
- **8 placeholders** — resto del catálogo en `app/data/games.ts`: ficha y reproductor mock vía `/games/[id]` y `/play/[id]`.

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

**Guardado de score:** Server Action `app/actions/save-score.ts` → Supabase `scores`. Nombre normalizado (1–10 chars, mayúsculas) en `localStorage` (`av_player_name`, ver `lib/player-name.ts`).

**Referencias de port:** prototipos vanilla en `references/started-games/` (p. ej. `02-asteroids`, `03-tetris`, `04-arkanoid`).

**Pipeline de integración (clásico):**

```
@game-planner → elegir juego → @add-game {slug} → Aprobado → @spec-impl NN-slug
```

**Pipeline creativo (game jam):**

```
@game-jam {tema} → revisar variantes en specs/game-jam/{slug}/ → elegir una → promover a specs/NN-{slug}.md → Aprobado → @spec-impl NN-slug
```

## Agente `@game-jam`

Genera specs completos de juegos retro a partir de un **tema creativo** o un **juego nombrado** (p. ej. Frogger). Propone variantes de gameplay y escribe al menos 2 archivos de spec listos para revisión.

| Aspecto | Detalle |
|---------|---------|
| Invocación | `@game-jam` o `/game-jam` · argumento: tema (`océano`) o juego concreto (`Frogger`) |
| Modo juego nombrado | Mismo `id` en todas las variantes (`frogger`); archivos `01-{id}-{hook}.md`, `02-{id}-{hook}.md`; carpeta `specs/game-jam/{id}/` |
| Modo solo tema | Slugs de catálogo distintos por variante; carpeta con nombre creativo |
| Skill | [`.claude/skills/game-jam/SKILL.md`](.claude/skills/game-jam/SKILL.md) |
| Guía de temas | [`.claude/skills/game-jam/theme-guide.md`](.claude/skills/game-jam/theme-guide.md) |
| Plantilla | [`.claude/skills/game-jam/template.md`](.claude/skills/game-jam/template.md) |
| Memoria | [`references/game-jam/sessions-log.md`](references/game-jam/sessions-log.md) — log versionado en git |
| Regla Cursor | [`.cursor/rules/game-jam.mdc`](.cursor/rules/game-jam.mdc) |
| Salida | `specs/game-jam/{folder-slug}/` con `README.md` + ≥2 specs completos |

**Qué hace:** interpreta el tema, propone ≥2 variantes con encaje distinto, escribe specs al nivel de `specs/07-tetris.md` tras confirmación del usuario; registra la sesión en el log.

**Qué no hace:** no escribe código, migraciones ni branches. No marca specs como `Aprobado`. Tras elegir variante, el humano promueve el archivo a `specs/NN-{slug}.md` y ejecuta `@spec-impl`.

**Estados en el log:** `generado` · `elegido` · `promovido` · `descartado`

## Agente `@game-planner`

Evalúa qué juegos retro canvas encajan en Arcade Vault **antes** de escribir un spec. Piensa, rankea candidatos y mantiene memoria de lo ya sugerido.

| Aspecto | Detalle |
|---------|---------|
| Invocación | `@game-planner` o `/game-planner` · argumento opcional: criterios (p. ej. `shooter bajo esfuerzo`) |
| Skill | [`.claude/skills/game-planner/SKILL.md`](.claude/skills/game-planner/SKILL.md) |
| Criterios | [`.claude/skills/game-planner/criteria.md`](.claude/skills/game-planner/criteria.md) |
| Memoria | [`references/game-planner/suggestions-log.md`](references/game-planner/suggestions-log.md) — log versionado en git |
| Regla Cursor | [`.cursor/rules/game-planner.mdc`](.cursor/rules/game-planner.mdc) |

**Qué hace:** lee catálogo, placeholders, prototipos y el log de sugerencias; propone 3–5 candidatos con puntuación de encaje (1–10); registra cada sesión en el log.

**Qué no hace:** no escribe specs, código, migraciones ni branches. Si el usuario elige un juego, hace handoff a `@add-game {slug}`.

**Estados en el log:** `sugerido` · `descartado` · `en_spec` · `implementado` · `revisitado`

## Skills

Skills del proyecto en `.claude/skills/` (espejo en `.agents/skills/`). Invocar con `/` en Claude Code o `@` en Cursor.

| Skill / regla | Uso |
|---------------|-----|
| `/frontend-design` | Diseñar la interfaz de usuario (estética retro CRT, tokens en `app/arcade-vault.css`). |
| `@game-planner` | Evaluar qué juego retro encaja en la plataforma; mantener memoria en `references/game-planner/suggestions-log.md`. **No escribe specs** — handoff a `@add-game`. |
| `@game-jam` | Generar specs temáticos con variantes en `specs/game-jam/{slug}/`. **No implementa código** — promover variante elegida a `specs/NN-{slug}.md` antes de `@spec-impl`. |
| `@spec` | Diseñar un spec genérico antes de escribir código. |
| `@add-game` | Generar spec unificado por juego (integración + leaderboard). **Extiende `@spec`** — lee primero `/spec`, luego aplica patrones de SPEC 05 y SPEC 06. **No implementa código** — solo produce `specs/NN-slug.md` en `Borrador`. |
| `@spec-impl` | Implementar un spec en estado `Aprobado`. |

Usa siempre `/frontend-design` para diseñar la interfaz de usuario.

Para integrar un juego clásico: `@game-planner` → elegir juego → `@add-game {slug}` → revisar spec → cambiar a `Aprobado` → `@spec-impl NN-slug`.

Para un juego temático: `@game-jam {tema}` → revisar variantes → promover a `specs/NN-{slug}.md` → `Aprobado` → `@spec-impl NN-slug`.

## Estructura del proyecto

```
app/
  layout.tsx              # Layout raíz (fuentes, Nav, Footer, AuthProvider)
  page.tsx                # Landing
  globals.css             # Tailwind + import de arcade-vault.css
  arcade-vault.css        # Design system retro (tokens, componentes, covers)
  about/                  # About + contacto
  auth/                   # Auth mock
  games/                  # Biblioteca, detalle dinámico y rutas estáticas por juego
  play/                     # Reproductor dinámico y rutas estáticas por juego
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
  started-games/          # Prototipos vanilla para portar
  templates/              # Referencias JSX/CSS de diseño
  source-assets/          # Assets fuente
.cursor/rules/            # Reglas de Cursor (@spec, @spec-impl, @add-game, @game-planner, @game-jam, nextjs)
.claude/skills/           # Skills del proyecto (spec, spec-impl, add-game, game-planner, game-jam, frontend-design)
```

Alias de importación: `@/*` apunta a la raíz del proyecto.

## Supabase y datos

- **Tablas:** `games` (catálogo persistido), `scores` (historial de partidas).
- **Juegos en Supabase:** `asteroids`, `tetris`, `arkanoid`, `snake` (`SUPABASE_GAMES`).
- **Híbrido:** juegos en Supabase leen/escriben scores reales; el resto usa `seededScores()` mock.
- **Auth real:** no implementada; `user_id` en scores es `null`. Auth mock solo afecta UI.
- **Migraciones:** `supabase/migrations/` — aplicar con Supabase CLI o MCP.

## Variables de entorno

Ver `.env.example`:

| Variable | Uso |
|----------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clave pública (anon) |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo servidor; opcional mientras RLS de insert esté deshabilitado |
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
5. **`@spec-impl NN-slug`** — Implementación paso a paso.

**Integración creativa (game jam):**

1. **`@game-jam {tema}`** — Propone variantes y escribe specs en `specs/game-jam/{folder-slug}/`.
2. **Elección humana** — Se elige una variante.
3. **Promoción** — Copiar spec elegido a `specs/NN-{slug}.md` (asignar siguiente `NN`).
4. **Revisión humana** — Cambiar estado a `Aprobado`.
5. **`@spec-impl NN-slug`** — Implementación paso a paso.

Configuración en `specs/.spec-config.yml` (`AutoCreateBranch: true` crea la rama automáticamente).

### Estados de un spec

| Estado | Significado |
|--------|-------------|
| `Borrador` | Generado por `@spec`, pendiente de revisión humana |
| `En revisión` | El humano está iterando |
| `Aprobado` | Listo para implementar (`@spec-impl` solo funciona con este estado) |
| `Implementado` | Código listo y criterios de aceptación verificados |
| `Obsoleto` | Reemplazado por otro spec |

**Cambiar el estado a `Aprobado` es un acto deliberado del humano.** El agente nunca aprueba su propio trabajo.

### Cuándo usar specs

- Sí: features que tocan más de 2 archivos, decisiones costosas de revertir, trabajo de varias sesiones, integración de juegos nuevos.
- No: bug fixes puntuales, refactors mecánicos, experimentos exploratorios.

Ver `specs/README.md` para la plantilla y convenciones de formato.

## Reglas de Cursor

Invocar con `@` en el chat:

| Regla | Uso |
|-------|-----|
| `@game-planner` | Evaluar qué juego retro encaja; memoria en `references/game-planner/suggestions-log.md` |
| `@game-jam` | Generar specs temáticos con variantes en `specs/game-jam/{slug}/` |
| `@spec` | Diseñar un spec antes de escribir código |
| `@add-game` | Generar spec unificado por juego (integración + leaderboard) |
| `@spec-impl` | Implementar un spec aprobado |
| `@nextjs` | Convenciones y breaking changes de Next.js 16 (archivos en `app/`) |
