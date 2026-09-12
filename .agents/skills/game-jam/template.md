# Game Jam spec template — themed variant (full integration spec)

This file is the **output template** for `@game-jam`. It extends `.claude/skills/add-game/template.md` for files under `specs/game-jam/{folder-slug}/`. **Do not copy verbatim** — fill with game-specific content confirmed in Phase 2.

Generated specs are written in **Spanish**, matching specs 07–09 in depth (~250–350 lines each).

**Promotion note:** Jam specs omit `NN` in the title. When promoted to `specs/NN-{slug}.md`, add the sequential number to the header.

---

## Header

```markdown
# JAM — {Título del juego} en Arcade Vault

> **Estado:** Borrador
> **Tema jam:** {tema del jam}
> **Carpeta:** `specs/game-jam/{folder-slug}/{archivo}.md`
> **Depende de:** SPEC 05 — Juego Asteroids, SPEC 06 — Catálogo y leaderboard en Supabase
> **Fecha:** YYYY-MM-DD
> **Objetivo:** Integrar el juego {TÍTULO} en `/play/{slug}` con engine TypeScript modular, estética temática "{tema}", shell del reproductor (HUD, pausa, fin de partida en CRT) y leaderboard real en Supabase bajo `id: "{slug}"`.
```

**Objective rule:** one sentence. If it needs two, the variant is too big — split scope or simplify.

---

## Section 1 — Alcance

```markdown
## Alcance

**Dentro:**

- Nueva entrada en `app/data/games.ts` con `id: "{slug}"`, título **{TÍTULO}**, categoría `{CAT}`, cover `cover-{slug}`, color `{color}`. Textos `short`/`long` con narrativa del tema "{tema}". {Nota sobre placeholders si aplica.}
- Engine en `lib/games/{slug}/` ({port desde `references/…` **o** desde cero})
- Canvas {W}×{H}; mecánica principal: {descripción breve}
- Controles: {teclas}
- Puntuación: {reglas}
- Condición de game over: {condición}
- API del engine (`{Pascal}Engine`): `mount`, `unmount`, `pause`, `resume`, `reset`, `onStateChange` → `{ score, …, phase }`
- Componentes `{slug}-canvas.tsx` y `{slug}-player.tsx`
- Rutas estáticas `app/games/{slug}/` y `app/play/{slug}/`
- Registro en `STATIC_GAME_ROUTES`
- Cover CSS `.cover-{slug}` en `app/arcade-vault.css` (paleta temática {tema})
- Seed en `public.games` + `{slug}` en `SUPABASE_GAMES`
- Guardar puntuación vía `saveScore` al pulsar **GUARDAR PUNTUACIÓN**

**Fuera de alcance (para specs futuros):**

- Audio / efectos de sonido
- Controles táctiles u on-screen para móvil
- Supabase Auth, realtime, tests automatizados
- Registry genérico de engines
- {otros deferidos específicos del juego}
```

---

## Section 2 — Modelo de datos

### Catálogo — `app/data/games.ts`

```ts
{
  id: "{slug}",
  title: "{TÍTULO}",
  short: "…",
  long: "…",
  cat: "{ARCADE|PUZZLE|SHOOTER|VERSUS}",
  cover: "cover-{slug}",
  color: "{cyan|magenta|yellow|green}",
  best: 0,
  plays: "0",
}
```

### API del engine — `lib/games/{slug}/types.ts`

```ts
export type {Pascal}Phase = "playing" | "gameover";
// Añadir "win" o "dead" si aplica

export interface {Pascal}GameState {
  score: number;
  // lives, level, speed, etc. según el juego
  phase: {Pascal}Phase;
}

export interface {Pascal}Engine {
  mount(canvas: HTMLCanvasElement): void;
  unmount(): void;
  pause(): void;
  resume(): void;
  reset(): void;
  onStateChange(cb: (state: {Pascal}GameState) => void): () => void;
}
```

### Estado interno del engine (no expuesto a React)

Constantes (`lib/games/{slug}/constants.ts`):

| Constante | Valor | Uso |
|-----------|-------|-----|
| `W` | `{W}` | Ancho del canvas |
| `H` | `{H}` | Alto del canvas |
| … | … | … |

Entidades / módulos en `lib/games/{slug}/`:

- `{entity}.ts` — {descripción}
- `engine.ts` — loop, input, colisiones, render

Estado en closure del engine:

- {lista de variables de estado}

### Notificación a React

El engine llama `onStateChange` cuando cambian métricas o `phase`. `{Pascal}Player` refleja el estado en `GamePlayerShell`. Con `phase === "gameover"`, overlay CRT del shell (no en canvas del engine).

### Supabase — seed

```sql
insert into public.games (id, title, short, long, cat, cover, color)
values (
  '{slug}',
  '{TÍTULO}',
  '…',
  '…',
  '{CAT}',
  'cover-{slug}',
  '{color}'
);
```

### Ramificación híbrida — `lib/data/supabase-games.ts`

```ts
// Añadir "{slug}" a SUPABASE_GAMES
```

Sin nueva Server Action ni archivos de query por juego.

---

## Section 3 — Patrón de integración

### Checklist (orden de trabajo)

1. **Catálogo** — Entrada `{slug}` en `app/data/games.ts`
2. **Cover CSS** — `.cover-{slug}` en `app/arcade-vault.css`
3. **Engine** — `lib/games/{slug}/` (`types.ts`, `constants.ts`, `engine.ts`, …)
4. **Canvas** — `components/games/{slug}-canvas.tsx`
5. **Player** — `components/games/{slug}-player.tsx` con `saveScore` + `usePlayerName()`
6. **Rutas estáticas** — `app/games/{slug}/page.tsx`, `app/play/{slug}/page.tsx`
7. **Registro** — `"{slug}"` en `STATIC_GAME_ROUTES`
8. **Supabase** — migración seed + `SUPABASE_GAMES`
9. **Smoke test** — verificación manual

**No hacer:** `if (game.id === "{slug}")` en `GamePlayer`.

### Diagrama de capas

```
app/games/{slug}/page.tsx          app/play/{slug}/page.tsx
         │                                    │
         ▼                                    ▼
  GameDetailView                      {Pascal}Player
                                              │
                         ┌────────────────────┼────────────────────┐
                         ▼                    ▼                    ▼
                 GamePlayerShell      {Pascal}Canvas          engineRef → reset()
                   (HUD + CRT)              │
                         │                  ▼
                         │         lib/games/{slug}/engine.ts
                         ▼
              overlays: PAUSA / FIN DEL JUEGO (dentro del CRT)
```

### Estructura de archivos

```
app/
  data/games.ts
  data/static-game-routes.ts
  games/{slug}/page.tsx
  play/{slug}/page.tsx

components/
  games/{slug}-canvas.tsx
  games/{slug}-player.tsx

lib/games/{slug}/
  types.ts
  constants.ts
  engine.ts
  {entities}/

app/arcade-vault.css              # .cover-{slug}

supabase/migrations/…             # seed public.games
lib/data/supabase-games.ts        # + "{slug}" en SUPABASE_GAMES
```

**Fuente:** {`references/started-games/…` o "engine desde cero"}.

---

## Section 4 — Plan de implementación

```markdown
## Plan de implementación

1. **Catálogo y cover** — Entrada + `.cover-{slug}` temática
2. **Fundamentos del engine** — `types.ts`, `constants.ts`, utilidades puras
3. **Entidades / lógica** — {módulos específicos}
4. **Engine core** — loop rAF, input, colisiones, `onStateChange`, pause/resume/reset
5. **Componente canvas** — mount/unmount, `engineRef`, `onStateChangeRef`
6. **Player y rutas** — `{slug}-player.tsx`, páginas estáticas, `STATIC_GAME_ROUTES`
7. **Supabase** — migración seed + `SUPABASE_GAMES`
8. **Smoke test manual** — criterios de aceptación
```

Each step leaves the system **functional and runnable**.

---

## Section 5 — Criterios de aceptación

```markdown
## Criterios de aceptación

### Catálogo
- [ ] `{slug}` aparece en `/games` con título **{TÍTULO}**, categoría `{CAT}` y cover `.cover-{slug}`
- [ ] `/games/{slug}` muestra detalle con CTA **JUGAR** → `/play/{slug}`

### Juego jugable
- [ ] `/play/{slug}` carga canvas {W}×{H} dentro del marco CRT
- [ ] Controles: …
- [ ] Estética temática "{tema}" coherente en sprites/colores
- [ ] Reglas de puntuación: …
- [ ] Condición de game over: …

### HUD y shell
- [ ] Shell externo muestra métricas correctas (puntuación, vidas/nivel según aplique)
- [ ] PAUSA detiene el loop; REANUDAR lo reanida
- [ ] Game over muestra overlay dentro del CRT (no en canvas del engine)
- [ ] **JUGAR DE NUEVO** llama a `engine.reset()`
- [ ] SALIR navega a `/games/{slug}`

### Leaderboard
- [ ] `/games/{slug}` muestra ranking desde Supabase
- [ ] `/hall-of-fame` tab **{TÍTULO}** muestra ranking real
- [ ] **GUARDAR PUNTUACIÓN** inserta en `scores` con `game_id = "{slug}"` y `user_id = null`
- [ ] Nombre recordado en `localStorage` (`av_player_name`)

### Regresión
- [ ] Asteroids, tetris, arkanoid, snake sin regresiones
- [ ] Placeholders existentes sin cambios de comportamiento

### Técnico
- [ ] Sin errores de consola relevantes en `/play/{slug}`
- [ ] Sin errores TypeScript/ESLint en archivos del juego
- [ ] Engine se desmonta limpiamente (rAF cancelado, listeners eliminados)
- [ ] `npm run build` sin errores
```

---

## Section 6 — Decisiones

```markdown
## Decisiones

### Heredadas de SPEC 05 / SPEC 06
- **Sí:** Ruta estática + `{Pascal}Player` + `{Pascal}Canvas` (sin branch en `GamePlayer`)
- **Sí:** `GamePlayerShell` para HUD, pausa y game over en CRT
- **Sí:** `saveScore` genérico + `SUPABASE_GAMES`
- **Sí:** `onStateChange` + `usePlayerName()` + `onStateChangeRef`
- **No:** Registry genérico de engines
- **No:** Guardado automático al game over

### Específicas de este juego (tema: {tema})
- **Sí:** …
- **No:** …
```

---

## Section 7 — Riesgos

```markdown
## Riesgos

| Riesgo | Mitigación |
|--------|------------|
| rAF sigue corriendo tras desmontar | `unmount()` cancela rAF y elimina listeners |
| … | … |
```

---

## Section 8 — Lo que NO está en este spec

```markdown
## Lo que NO está en este spec

- …

Cada uno de estos, si llega, va en su propio spec.
```

---

## README.md template (folder index)

```markdown
# Game Jam — {tema}

> **Fecha:** YYYY-MM-DD
> **Carpeta:** `specs/game-jam/{folder-slug}/`
> **Tema:** {tema}

## Variantes

| Archivo | Slug catálogo | Género | Hook | Recomendación |
|---------|---------------|--------|------|---------------|
| `01-{id}-{hook-a}.md` | `{id}` | … | … | ⭐ Principal |
| `02-{id}-{hook-b}.md` | `{id}` | … | … | Alternativa |

En modo **solo tema**, `{id}` puede variar por fila y los archivos pueden ser `{variant-slug}.md`.

## Próximos pasos

1. Releer ambos specs fuera del chat
2. Elegir una variante
3. Copiar el archivo elegido a `specs/NN-{slug}.md` (asignar siguiente `NN`)
4. Cambiar `Estado` a `Aprobado` manualmente
5. Ejecutar `@spec-impl NN-{slug}`
```

---

## Global rules

- **One sentence per idea.** No TODOs — resolve in Phase 2 or document deferrals.
- **Concrete names.** Real paths, slugs, constants with values.
- **No full implementations.** Type snippets and constant tables only.
- **Theme coherence.** Visual palette and copy must reflect the jam theme in Alcance and Decisions.
- **Independent variants.** Each file is a complete, standalone integration spec.
