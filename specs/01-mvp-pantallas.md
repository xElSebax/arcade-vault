# SPEC 01 — MVP visual de Arcade Vault

> **Estado:** Aprobado
> **Depende de:** ninguna
> **Fecha:** 2026-08-01
> **Objetivo:** Implementar las 5 pantallas del prototipo en `references/templates/` como rutas Next.js App Router, con datos ficticios en `app/data/`, fidelidad visual alta y sin lógica de juego real.

## Alcance

**Dentro:**

- Shell global: navbar (`Nav`), footer, fondo neón (`.av-bg`, `.av-noise`) — ya parcialmente en `layout.tsx`.
- 5 pantallas como rutas App Router (URLs en inglés, UI en español):
  - `/` — Biblioteca (hero, búsqueda, filtros por categoría, grid de tarjetas con tilt).
  - `/games/[id]` — Detalle del juego (cover, tags, stats, leaderboard lateral, CTA "Jugar").
  - `/play/[id]` — Reproductor visual (HUD, marco CRT, arena decorativa animada, modales pausa y game over).
  - `/auth` — Login / registro / invitado / botones OAuth decorativos.
  - `/hall-of-fame` — Salón de la Fama (tabs por juego, podio, tabla de rankings).
- Datos ficticios centralizados en `app/data/` (juegos, categorías, jugadores, función `seededScores`).
- Estilos: `app/arcade-vault.css` para tema/animaciones complejas; Tailwind para layout y componentes nuevos.
- Fuentes del prototipo: Press Start 2P + JetBrains Mono (ya configuradas en `layout.tsx`).
- 8 juegos mock con covers CSS puros (como en el prototipo).
- Interactividad de UI: búsqueda, filtros, menú móvil, tabs, modales, tilt en tarjetas.
- Auth mock funcional: login/invitado actualiza estado de usuario en navbar y fila "TU MEJOR MARCA" del salón (React Context + `sessionStorage`, sin backend).

**Fuera de alcance (para specs futuros):**

- Implementación de juegos reales (canvas, física, input de juego).
- Backend, base de datos, API REST o GraphQL.
- Autenticación real (OAuth, JWT, sesiones de servidor).
- Persistencia real de puntuaciones (guardar en DB).
- Sistema de créditos funcional (el contador "CRÉDITOS · 03" es decorativo).
- Tests automatizados.
- Internacionalización (i18n).
- PWA, notificaciones push.

## Modelo de datos

Datos ficticios en `app/data/`, reutilizando la estructura del prototipo (`references/templates/data.jsx`). Eventualmente esta capa se reemplaza por consultas a base de datos.

### `app/data/games.ts`

```ts
export type GameCategory = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";

export type GameColor = "cyan" | "magenta" | "yellow" | "green";

export interface Game {
  id: string;           // slug, ej. "bloque-buster"
  title: string;
  short: string;        // descripción corta para tarjeta
  long: string;         // descripción larga para detalle
  cat: GameCategory;
  cover: string;        // clase CSS, ej. "cover-bricks"
  color: GameColor;
  best: number;         // mejor puntuación global mock
  plays: string;        // ej. "12.4K"
}
```

8 juegos del prototipo: `bloque-buster`, `caida`, `serpentina`, `gloton`, `invasores`, `rocas`, `ranaria`, `duelo-pixel`.

### `app/data/categories.ts`

```ts
export const CATEGORIES = ["TODOS", "ARCADE", "PUZZLE", "SHOOTER", "VERSUS"] as const;
export type CategoryFilter = (typeof CATEGORIES)[number];
```

### `app/data/players.ts`

```ts
export const PLAYERS: string[];  // 18 nombres mock del prototipo
```

### `app/data/scores.ts`

```ts
export interface ScoreRow {
  rank: number;
  name: string;
  score: number;
  date: string;   // formato "DD/MM/YYYY"
}

export function seededScores(seed: number, count?: number): ScoreRow[];
```

Generador determinista (misma lógica del prototipo) para leaderboards en detalle, salón y reproductor.

### `app/data/index.ts`

Re-exporta todo lo anterior + helpers:

```ts
export function getGameById(id: string): Game | undefined;
export function getGamesByCategory(cat: CategoryFilter): Game[];
```

### Estado de sesión (cliente, no en `app/data/`)

```ts
// components/providers/auth-provider.tsx
export interface User {
  name: string;   // máx. 10 chars, mayúsculas
}

// sessionStorage key: "av_user"
```

El usuario mock no vive en `app/data/`; se gestiona en React Context + `sessionStorage`. Las puntuaciones del reproductor (game over) no se persisten — solo muestran toast "PUNTUACIÓN GUARDADA_" como en el prototipo.

## Plan de implementación

1. **Capa de datos** — Crear `app/data/games.ts`, `categories.ts`, `players.ts`, `scores.ts` e `index.ts` con los 8 juegos y helpers del prototipo. Verificar que `getGameById` y `seededScores` funcionan importándolos sin errores de TypeScript.

2. **Auth provider** — Crear `components/providers/auth-provider.tsx` con Context para `User | null`, `login()`, `logout()`, `loginAsGuest()`, persistencia en `sessionStorage` (`av_user`). Envolver el layout en el provider.

3. **Componentes compartidos** — Crear en `components/`:
   - `nav.tsx` — navbar sticky, links activos, contador de créditos decorativo, menú móvil.
   - `footer.tsx` — footer del prototipo.
   - `game-card.tsx` — tarjeta con tilt 3D y cover CSS.
   - `btn.tsx` — botón neón reutilizable (variantes: default, magenta, yellow, ghost, lg, xl, pulse).

4. **Layout raíz** — Actualizar `app/layout.tsx`: incluir `Nav`, `Footer`, `AuthProvider` y `{children}` dentro de `.av-app`. La home actual se reemplaza en el paso 5.

5. **Pantalla Biblioteca** — Implementar `app/page.tsx` con hero, búsqueda, chips de categoría y grid de `GameCard`. Filtrado client-side con `useState` + `useMemo`. Estado vacío "NO HAY RESULTADOS".

6. **Pantalla Detalle** — Crear `app/games/[id]/page.tsx`. Cover grande, tags, descripción, stat-strip, leaderboard lateral con `seededScores`, botones "JUGAR AHORA" → `/play/[id]` y "VOLVER AL VAULT" → `/`. `notFound()` si el id no existe.

7. **Pantalla Reproductor** — Crear `app/play/[id]/page.tsx` como Client Component. HUD con contadores simulados (score auto-increment, vidas, nivel), marco CRT con arena decorativa, overlay de pausa, modal game over con input de iniciales y toast. Sin lógica de juego real.

8. **Pantalla Auth** — Crear `app/auth/page.tsx` como Client Component. Tabs login/registro, formulario, "JUGAR COMO INVITADO", botones Google/GitHub decorativos. Submit redirige a `/` con usuario en Context.

9. **Pantalla Salón de la Fama** — Crear `app/hall-of-fame/page.tsx`. Tabs por juego, podio top 3, tabla de rankings con animación `rise`, fila "TU MEJOR MARCA" si hay usuario logueado.

10. **Revisión de estilos** — Auditar `app/arcade-vault.css` contra `references/templates/styles.css`: cubrir clases que falten o corregir discrepancias. Usar Tailwind solo donde el CSS global no aplique (layout puntual, responsive tweaks).

11. **Navegación y estados activos** — Verificar que `Nav` marca activo correctamente en `/`, `/games/*`, `/play/*`, `/hall-of-fame` y `/auth`. Links del logo → `/`, biblioteca → `/`, salón → `/hall-of-fame`.

12. **Smoke test manual** — Recorrer las 5 rutas en desktop y móvil (< 840px): sin errores en consola, transiciones visibles, formularios y modales operativos.

## Criterios de aceptación

### Rutas y navegación
- [ ] `/` muestra la biblioteca con los 8 juegos del mock.
- [ ] `/games/[id]` muestra el detalle del juego; un id inválido devuelve 404.
- [ ] `/play/[id]` muestra el reproductor visual; un id inválido devuelve 404.
- [ ] `/auth` muestra el formulario de acceso.
- [ ] `/hall-of-fame` muestra el salón de la fama.
- [ ] El logo y el link "Biblioteca" en la navbar llevan a `/`.
- [ ] El link "Salón de la Fama" lleva a `/hall-of-fame`.
- [ ] "JUGAR" en una tarjeta lleva a `/games/[id]`; "JUGAR AHORA" en detalle lleva a `/play/[id]`.

### Biblioteca (`/`)
- [ ] El buscador filtra juegos por título en tiempo real.
- [ ] Los chips de categoría filtran correctamente (incluido "TODOS").
- [ ] Con búsqueda sin resultados se muestra el estado vacío "NO HAY RESULTADOS".
- [ ] Las tarjetas tienen efecto tilt al mover el mouse.

### Detalle (`/games/[id]`)
- [ ] Se muestran cover, categoría, descripción larga, stats y leaderboard lateral.
- [ ] El leaderboard muestra 10 filas generadas por `seededScores`.

### Reproductor (`/play/[id]`)
- [ ] El HUD muestra jugador, puntuación (auto-incrementa), vidas y nivel.
- [ ] El botón "PAUSA" muestra overlay "EN PAUSA"; "REANUDAR" lo oculta.
- [ ] El botón "FIN" abre el modal "FIN DEL JUEGO" con puntuación final.
- [ ] "GUARDAR PUNTUACIÓN" muestra el toast "▸ PUNTUACIÓN GUARDADA_".
- [ ] La arena CRT muestra la animación decorativa (nave, enemigos, grid).
- [ ] No hay errores en consola al interactuar con HUD y modales.

### Auth (`/auth`)
- [ ] Las tabs "INICIAR SESIÓN" / "CREAR CUENTA" alternan el formulario.
- [ ] "CREAR CUENTA" muestra el campo de email adicional.
- [ ] Submit con usuario guarda el nombre en Context y redirige a `/`.
- [ ] "JUGAR COMO INVITADO" entra sin usuario y redirige a `/`.
- [ ] Con sesión activa, la navbar muestra el nombre del usuario en lugar de "Iniciar Sesión".

### Salón de la Fama (`/hall-of-fame`)
- [ ] Los tabs cambian el juego y regeneran el ranking.
- [ ] El podio muestra posiciones 01 (oro), 02 (plata) y 03 (bronce).
- [ ] La tabla muestra 12 filas con animación de entrada.
- [ ] Con usuario logueado aparece la fila "TU MEJOR MARCA".

### Visual y responsive
- [ ] Fuentes Press Start 2P y JetBrains Mono cargan correctamente.
- [ ] El fondo neón (grid perspectiva + scanlines + noise) es visible.
- [ ] En viewport ≤ 840px el menú hamburguesa abre el panel lateral.
- [ ] No hay errores de TypeScript ni de ESLint en los archivos nuevos.

### Fuera de alcance (verificar que NO existe)
- [ ] No hay canvas ni lógica de juego jugable (teclado/táctil no controlan nada).
- [ ] No hay llamadas a API ni conexión a base de datos.
- [ ] Los botones Google/GitHub no realizan OAuth real.

## Decisiones

- **Sí:** App Router de Next.js con rutas en inglés (`/`, `/games/[id]`, `/play/[id]`, `/auth`, `/hall-of-fame`). URLs compartibles y convención estándar; UI permanece en español.
- **No:** Routing por hash como el prototipo (`#{"name":"detalle"}`). No aporta valor en Next.js y rompe URLs compartibles.
- **Sí:** `app/arcade-vault.css` para tema global, animaciones y covers CSS; Tailwind para layout y componentes nuevos. El CSS ya está migrado; evita reescribir ~950 líneas de animaciones complejas.
- **No:** Portar todo a clases Tailwind puras. Coste alto sin beneficio visual; las animaciones (grid perspectiva, CRT, covers) dependen de CSS custom.
- **Sí:** Datos ficticios en `app/data/` como capa estática tipada. Facilita el reemplazo futuro por queries a DB sin tocar componentes.
- **No:** Datos hardcodeados dentro de cada componente. Duplicaría la fuente de verdad y dificultaría la migración a backend.
- **Sí:** Reproductor con shell visual completo (HUD simulado, CRT, arena decorativa, modales). Mantiene el flujo "Jugar" demostrable sin implementar juegos.
- **No:** Placeholder estático "próximamente". Cortaría el flujo de navegación que el prototipo ya validó.
- **Sí:** Auth mock con React Context + `sessionStorage`. Demuestra estados de navbar y salón sin backend.
- **No:** Auth puramente decorativa (formularios sin efecto). Perdería la demostración de estados con/sin usuario.
- **No:** `localStorage` para usuario (como el prototipo). `sessionStorage` es suficiente para MVP y no persiste entre pestañas cerradas.
- **Sí:** Fidelidad visual alta: mismas fuentes, colores, 8 juegos y animaciones del prototipo.
- **No:** Simplificar a 4 juegos o cambiar a Geist. El prototipo ya está validado visualmente.
- **Sí:** Puntuaciones del game over sin persistencia real. El toast "PUNTUACIÓN GUARDADA_" es feedback visual; la persistencia va en otro spec.
- **No:** Guardar scores en `localStorage` como el prototipo. Evita confusión sobre qué es mock y qué es funcional.

## Riesgos

| Riesgo | Mitigación |
|--------|------------|
| `arcade-vault.css` desincronizado respecto al prototipo | Paso 10 del plan: auditoría explícita contra `references/templates/styles.css` antes de cerrar. |
| Mezcla CSS global + Tailwind genera clases conflictivas | Regla: CSS global para tema/animaciones; Tailwind solo para layout puntual. No duplicar estilos de `.btn`, `.card`, etc. en Tailwind. |
| Client Components excesivos penalizan rendimiento | Solo marcar `"use client"` en pantallas con interactividad (`/play`, `/auth`, biblioteca con filtros, nav). Detalle y salón pueden ser Server Components con islands client si aplica. |
| `seededScores` produce datos distintos entre servidor y cliente | Llamar `seededScores` solo en Server Components o pasar seed fijo por `id`; en client usar el mismo seed derivado del `id` del juego. |
| Rutas dinámicas sin `generateStaticParams` | Generar páginas estáticas para los 8 ids conocidos con `generateStaticParams` en `/games/[id]` y `/play/[id]`. |

## Lo que NO está en este spec

- Juegos reales jugables (canvas, WebGL, física, input).
- Backend, base de datos, API o autenticación real.
- Persistencia real de puntuaciones.
- Sistema de créditos funcional.
- Tests automatizados (unit, e2e).
- Internacionalización.
- PWA o notificaciones push.
- Editor visual de juegos.

Cada uno de estos, si llega, va en su propio spec.
