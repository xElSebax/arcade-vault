# SPEC 02 — Homepage landing

> **Estado:** Aprobado
> **Depende de:** SPEC 01 — MVP visual de Arcade Vault
> **Fecha:** 2026-08-02
> **Objetivo:** Implementar la landing de Inicio en `/` fiel a `references/templates/home-about/home.jsx`, mover la biblioteca de juegos a `/games` y actualizar la navegación global.

## Alcance

**Dentro:**

- Landing de Inicio en `/` según `references/templates/home-about/home.jsx`:
  - Hero con siluetas flotantes, eyebrow, título en 3 líneas, subtítulo, CTAs y scroll hint.
  - Sección "¿Por qué Arcade Vault?" con grid de 4 feature cards e iconos pixel.
  - Preview de juegos (mini-rail con los primeros 6 de `GAMES`) + botón "VER TODOS LOS JUEGOS".
  - Banda de stats (3 bloques).
  - Actividad en vivo: ticker de últimas puntuaciones + top jugadores del día.
  - Sección de precios (plan único + FAQ lateral).
  - CTA final "¿LISTO PARA JUGAR?".
  - Animaciones `fade-in`, `reveal` (IntersectionObserver) y transiciones del prototipo.
- Mover la biblioteca actual de `/` a `/games` (`app/games/page.tsx`) sin cambiar su funcionalidad (búsqueda, filtros, grid, estado vacío).
- Actualizar navbar y menú móvil:
  - Links: **Inicio** (`/`), **Biblioteca** (`/games`), **Salón de la Fama** (`/hall-of-fame`).
  - Estados activos: Inicio en `/`; Biblioteca en `/games`, `/games/[id]` y `/play/[id]`; Salón en `/hall-of-fame`.
  - Logo → `/`.
- Datos mock de la home como constantes en `app/data/home.ts` (features, stats, ticker, top players, FAQ de precios).
- Estilos de home portados de `references/templates/home-about/styles.css` a `app/arcade-vault.css` (secciones `.home-*`, `.feature-*`, `.mini-*`, `.activity-*`, `.pricing-*`, `.reveal`, etc.).
- Componentes nuevos en `components/home/` (o equivalente): `FloatingSilhouettes`, `FeatureIcon`, `MiniCard`, hook `useReveal`.
- Actualizar enlaces internos que apuntaban a `/` como biblioteca → `/games` (detalle, reproductor, CTAs de la home, etc.).

**Fuera de alcance (para specs futuros):**

- Página Acerca de (`/about`) y formulario de contacto.
- Link "Acerca de" en la navbar.
- Backend real para envío de contacto o actividad en vivo.
- Datos dinámicos de ticker/stats/top (API, websockets, polling).
- Internacionalización.
- Tests automatizados.
- Cambios en pantallas ya implementadas fuera de lo necesario para la migración de rutas (auth, salón, reproductor, detalle de juego).

## Modelo de datos

Constantes estáticas en `app/data/home.ts`. Reutiliza `GAMES` de `app/data/games.ts` para el mini-rail (primeros 6). El resto es mock fiel al prototipo.

### `app/data/home.ts`

```ts
export interface HomeFeature {
  icon: "GAMEPAD" | "FREE" | "TROPHY" | "ROCKET";
  title: string;
  description: string;
  color: "cyan" | "magenta" | "yellow" | "green";
}

export interface HomeStat {
  number: string;   // ej. "12+"
  unit: string;     // ej. "JUEGOS"
  subtitle: string;
}

export interface HomeTickerRow {
  player: string;
  game: string;
  score: number;
  timeAgo: string;  // ej. "hace 2 min"
  color: "cyan" | "magenta" | "yellow" | "green";
}

export interface HomeTopPlayer {
  rank: number;
  player: string;
  score: number;
}

export interface HomeFaqItem {
  question: string;
  answer: string;
}

export const HOME_FEATURES: HomeFeature[];
export const HOME_STATS: HomeStat[];
export const HOME_TICKER: HomeTickerRow[];
export const HOME_TOP_PLAYERS: HomeTopPlayer[];
export const HOME_PRICING_FAQ: HomeFaqItem[];

// Helper para el mini-rail
export function getHomePreviewGames(): Game[];  // GAMES.slice(0, 6)
```

### Re-export

`app/data/index.ts` re-exporta los tipos y constantes de `home.ts`.

### Sin estado persistente

La landing no introduce estado de sesión ni almacenamiento. Los CTAs enlazan a rutas existentes (`/games`, `/auth`, `/hall-of-fame`, `/games/[id]`).

## Plan de implementación

1. **Datos mock de la home** — Crear `app/data/home.ts` con `HOME_FEATURES`, `HOME_STATS`, `HOME_TICKER`, `HOME_TOP_PLAYERS`, `HOME_PRICING_FAQ` y `getHomePreviewGames()`. Re-exportar desde `app/data/index.ts`. Verificar imports sin errores de TypeScript.

2. **Estilos de la landing** — Auditar `references/templates/home-about/styles.css` y portar a `app/arcade-vault.css` las clases de home que falten (`.home`, `.home-hero`, `.home-silos`, `.feature-grid`, `.mini-rail`, `.home-stats`, `.activity-grid`, `.pricing-grid`, `.home-final`, `.reveal`, animaciones `float`/`bounce`/`tickin`, etc.). No tocar estilos de about (fuera de alcance).

3. **Hook y subcomponentes** — Crear en `components/home/`:
   - `use-reveal.ts` — IntersectionObserver para `.reveal` → clase `.in`.
   - `floating-silhouettes.tsx` — SVGs decorativos del hero.
   - `feature-icon.tsx` — iconos pixel por `kind`.
   - `mini-card.tsx` — tarjeta compacta con cover CSS + link a `/games/[id]`.

4. **Página landing** — Implementar `app/page.tsx` como Client Component con todas las secciones del prototipo: hero, features, preview, stats, actividad, precios, CTA final. CTAs: "EXPLORAR JUEGOS" / "INSERTAR MONEDA" → `/games`; "CREAR CUENTA" / "EMPEZAR GRATIS" → `/auth`; "VER SALÓN" → `/hall-of-fame`; mini-cards → `/games/[id]`.

5. **Migrar biblioteca a `/games`** — Mover el contenido actual de `app/page.tsx` (búsqueda, filtros, grid) a `app/games/page.tsx` sin cambiar funcionalidad. La ruta `/games/[id]` (detalle) permanece igual.

6. **Actualizar navegación** — Modificar `components/nav.tsx` y `lib/navigation.ts`:
   - Añadir link "Inicio" → `/`.
   - Cambiar "Biblioteca" de `/` a `/games`.
   - Estados activos: `inicio` en `/`; `biblioteca` en `/games`, `/games/[id]`, `/play/[id]`.
   - Actualizar menú móvil con los mismos links.

7. **Enlaces internos** — Buscar y actualizar referencias a `/` que apuntaban a la biblioteca:
   - Detalle: botón "VOLVER AL VAULT" → `/games`.
   - Auth: redirect post-login → `/games`.
   - Cualquier otro `href="/"` que implique biblioteca.

8. **Smoke test manual** — Recorrer `/` (landing completa con scroll y animaciones), `/games` (filtros y grid), `/games/[id]`, navbar en desktop y móvil (≤ 840px). Sin errores en consola ni de TypeScript/ESLint.

## Criterios de aceptación

### Landing (`/`)
- [ ] El hero muestra eyebrow "INSERTA UNA MONEDA", título en 3 líneas, subtítulo, 2 CTAs y hint "DESLIZA".
- [ ] Las siluetas flotantes del hero son visibles y animadas.
- [ ] La sección "¿POR QUÉ ARCADE VAULT?" muestra 4 feature cards con iconos y colores correctos.
- [ ] El mini-rail muestra 6 juegos con cover, título y categoría; al hacer clic navega a `/games/[id]`.
- [ ] "VER TODOS LOS JUEGOS" lleva a `/games`.
- [ ] La banda de stats muestra 3 bloques (12+ JUEGOS, MILES DE PARTIDAS, GLOBAL RANKING).
- [ ] El ticker muestra 7 filas de puntuaciones recientes con animación de entrada.
- [ ] El top de jugadores muestra 5 filas con barras de progreso; "VER SALÓN →" lleva a `/hall-of-fame`.
- [ ] La sección de precios muestra plan "JUGADOR VAULT" a $0 con lista de beneficios y 3 FAQs.
- [ ] "EMPEZAR GRATIS →" lleva a `/auth`.
- [ ] El CTA final "INSERTAR MONEDA →" lleva a `/games`.
- [ ] Las secciones con clase `.reveal` animan al entrar en viewport (IntersectionObserver).

### Biblioteca (`/games`)
- [ ] `/games` muestra la biblioteca con búsqueda, filtros por categoría y grid de 8 juegos.
- [ ] El buscador y los chips filtran correctamente; estado vacío "NO HAY RESULTADOS" funciona.
- [ ] Las tarjetas tienen efecto tilt y enlazan a `/games/[id]`.

### Navegación
- [ ] La navbar muestra: Inicio, Biblioteca, Salón de la Fama (sin "Acerca de").
- [ ] El logo lleva a `/`.
- [ ] "Inicio" está activo solo en `/`.
- [ ] "Biblioteca" está activo en `/games`, `/games/[id]` y `/play/[id]`.
- [ ] "Salón de la Fama" está activo en `/hall-of-fame`.
- [ ] En móvil (≤ 840px) el menú hamburguesa muestra los mismos links.

### Enlaces actualizados
- [ ] "VOLVER AL VAULT" en detalle de juego lleva a `/games` (no a `/`).
- [ ] Ningún enlace de biblioteca apunta a `/` por error.

### Visual y técnico
- [ ] Fidelidad visual alta respecto a `references/templates/home-about/home.jsx`.
- [ ] Sin errores en consola al navegar `/` y hacer scroll.
- [ ] Sin errores de TypeScript ni ESLint en archivos nuevos o modificados.

### Fuera de alcance (verificar que NO existe)
- [ ] No hay ruta `/about` ni link "Acerca de" en la navbar.
- [ ] No hay backend ni datos dinámicos en ticker/stats/top.

## Decisiones

- **Sí:** Landing en `/` y biblioteca en `/games`. Separa marketing (home) de catálogo (juegos); `/games/[id]` sigue siendo detalle sin conflicto de rutas.
- **No:** Mantener biblioteca en `/`. El prototipo `home-about` ya asume Inicio y Biblioteca como pantallas distintas.
- **Sí:** About fuera de este spec. Reduce alcance; la referencia `about.jsx` va en un spec posterior.
- **No:** Incluir `/about` y navbar con "Acerca de" ahora. El usuario lo dejó explícitamente fuera.
- **Sí:** Datos de ticker, stats y top como constantes en `app/data/home.ts`. Suficiente para MVP; migración a API en spec futuro.
- **No:** Derivar ticker/top de `seededScores` o `PLAYERS`. Añade complejidad sin beneficio visual inmediato.
- **Sí:** Mini-rail con `GAMES.slice(0, 6)` desde `app/data/`. Reutiliza fuente de verdad existente; covers y títulos siempre sincronizados.
- **No:** Hardcodear los 6 juegos del mini-rail en `home.ts`. Duplicaría datos ya en `games.ts`.
- **Sí:** Portar estilos home a `app/arcade-vault.css`. Consistente con SPEC 01; evita otro archivo CSS.
- **No:** Estilos home solo en Tailwind. Las animaciones y clases del prototipo dependen de CSS custom.
- **Sí:** `app/page.tsx` como Client Component (`useReveal`, CTAs interactivos). Misma razón que biblioteca en SPEC 01.
- **No:** Server Component puro para la landing. Requiere `IntersectionObserver` y no aporta SEO crítico en esta fase.
- **Sí:** Redirect post-auth a `/games` (flujo "ir a jugar"). Coherente con que la biblioteca ya no está en `/`.
- **No:** Redirect post-auth a `/` (landing). El usuario que inicia sesión probablemente quiere ver juegos, no marketing.
- **Sí:** Implementación completa y fiel al prototipo (todas las secciones, animaciones, pricing).
- **No:** Versión recortada sin pricing o actividad en vivo. El usuario pidió fidelidad total.

## Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Conflicto de rutas `/games` (lista) vs `/games/[id]` (detalle) | Next.js App Router lo soporta nativamente: `app/games/page.tsx` + `app/games/[id]/page.tsx`. Verificar en paso 8 que ambas rutas resuelven sin 404. |
| Enlaces rotos tras mover biblioteca de `/` a `/games` | Paso 7 del plan: grep de `href="/"` y redirects; actualizar detalle, auth y CTAs. |
| CSS de home desincronizado respecto a la referencia | Paso 2: auditoría explícita contra `references/templates/home-about/styles.css`; no portar clases de about. |
| `useReveal` no observa elementos montados después del primer render | El hook corre en `useEffect` al montar la página; todas las secciones `.reveal` están en el DOM inicial. Si falla, re-observar en el mismo effect. |
| Navbar con 3 links + auth apretada en tablet | La referencia ya lo contempla (links ocultos ≤ 840px, menú hamburguesa). Reutilizar breakpoints existentes. |
| Redirect post-auth a `/games` rompe expectativa de usuarios que esperaban `/` | Documentado en Decisiones; es cambio intencional al mover la biblioteca. |

## Lo que NO está en este spec

- Página Acerca de (`/about`) y formulario de contacto.
- Link "Acerca de" en la navbar.
- Backend, API o actividad en vivo real.
- Datos dinámicos de ticker, stats o rankings.
- Tests automatizados.
- Internacionalización.

Cada uno de estos, si llega, va en su propio spec.
