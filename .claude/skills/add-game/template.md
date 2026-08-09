# Unified spec template — game integration + leaderboard

This file is the **domain extension** of the generic spec template. Before using it, read `.claude/skills/spec/template.md` and `specs/README.md` — `@add-game` follows the `/spec` method first, then applies this structure.

This template merges patterns from SPEC 05 (Asteroids integration) and SPEC 06 (Supabase leaderboard). **Do not copy verbatim** — fill placeholders with game-specific content confirmed in Phase 2.

Generated specs are written in **Spanish**, matching specs 05 and 06.

---

## Header

```markdown
# SPEC NN — {Título del juego} en Arcade Vault

> **Estado:** Borrador
> **Depende de:** SPEC 05 — Juego Asteroids, SPEC 06 — Catálogo y leaderboard en Supabase
> **Fecha:** YYYY-MM-DD
> **Objetivo:** Integrar el juego {TÍTULO} en `/play/{slug}` con engine TypeScript modular, shell del reproductor (HUD, pausa, fin de partida en CRT) y leaderboard real en Supabase.
```

**Objective rule:** one sentence. If it needs two, the feature is too big.

---

## Section 1 — Alcance

Two explicit sub-blocks. **Both are mandatory.**

```markdown
## Alcance

**Dentro:**

- Entrada en `app/data/games.ts` con `id: "{slug}"`, …
- Engine en `lib/games/{slug}/` (port desde `references/…` **o** desde cero)
- API del engine: `mount`, `unmount`, `pause`, `resume`, `reset`, `onStateChange`
- Componentes `{slug}-canvas.tsx` y `{slug}-player.tsx`
- Rutas estáticas `app/games/{slug}/` y `app/play/{slug}/`
- Registro en `STATIC_GAME_ROUTES`
- Cover CSS `.cover-{slug}` en `app/arcade-vault.css`
- Seed en `public.games` (misma fila que `games.ts`)
- `{slug}` en `SUPABASE_GAMES` — leaderboard real en detalle y hall-of-fame
- Guardar puntuación vía `saveScore` al pulsar **GUARDAR PUNTUACIÓN**

**Fuera de alcance (para specs futuros):**

- …
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
export type {Pascal}Phase = "playing" | "dead" | "gameover";
// Ajustar fases si el juego no usa vidas (ej. solo "playing" | "gameover")

export interface {Pascal}GameState {
  score: number;
  lives: number;   // omitir si no aplica
  level: number;   // omitir si no aplica
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

Document constants (`W`, `H`, `MAX_DT`, game-specific arrays) and module-level state from the reference or design. Keep it concise — names and purposes, not full implementations.

### Notificación a React

The engine calls `onStateChange` when relevant fields change. `{Pascal}Player` mirrors state to `GamePlayerShell`. When `phase === "gameover"`, show CRT overlay — **not** on the canvas.

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

### Ramificación híbrida — `lib/data/leaderboard.ts`

```ts
const SUPABASE_GAMES = new Set(["asteroids", "{slug}"]);
```

No new Server Action or query files per game.

---

## Section 3 — Patrón de integración

### Checklist (order of work)

1. **Catálogo** — Entry in `app/data/games.ts`
2. **Cover CSS** — `.cover-{slug}` in `app/arcade-vault.css`
3. **Engine** — `lib/games/{slug}/` (`types.ts`, `constants.ts`, `utils.ts`, `engine.ts`, `entities/`)
4. **Canvas** — `components/games/{slug}-canvas.tsx`
5. **Player** — `components/games/{slug}-player.tsx` with `saveScore` + `usePlayerName()`
6. **Rutas estáticas** — `app/games/{slug}/page.tsx`, `app/play/{slug}/page.tsx`
7. **Registro** — `"{slug}"` in `STATIC_GAME_ROUTES`
8. **Supabase** — migration seed + `SUPABASE_GAMES`
9. **Smoke test** — manual verification (see acceptance criteria)

**No hacer:** `if (game.id === "…")` en `GamePlayer`.

### Diagrama de capas

```markdown
app/games/{slug}/page.tsx          app/play/{slug}/page.tsx
         │                                    │
         ▼                                    ▼
  GameDetailView                      {Pascal}Player
                                              │
                         ┌────────────────────┼────────────────────┐
                         ▼                    ▼                    ▼
                 GamePlayerShell      {Pascal}Canvas      engineRef → reset()
                   (HUD + CRT)              │
                         │                  ▼
                         │         lib/games/{slug}/engine.ts
                         ▼
              overlays: PAUSA / FIN DEL JUEGO (dentro del CRT)
```

### Estructura de archivos

```
app/
  data/static-game-routes.ts
  games/{slug}/page.tsx
  play/{slug}/page.tsx

components/
  games/{slug}-canvas.tsx
  games/{slug}-player.tsx

lib/games/{slug}/
  types.ts
  constants.ts
  utils.ts
  engine.ts
  entities/

app/arcade-vault.css            # .cover-{slug}

supabase/migrations/…           # seed public.games
```

If porting from reference, note source: `references/started-games/{NN-name}/game.js`.

---

## Section 4 — Plan de implementación

Numbered steps. Each step leaves the system **functional and runnable**.

```markdown
## Plan de implementación

1. Catálogo y cover — …
2. Fundamentos del engine — …
3. Entidades — …
4. Engine core — loop, input, colisiones, `onStateChange`, pause/resume/reset
5. Componente canvas — mount/unmount, `engineRef`, `onStateChangeRef`
6. Player + rutas estáticas + `GamePlayerShell`
7. Supabase — migración seed + `SUPABASE_GAMES`
8. Smoke test manual
```

**Rules:**

- Each step must be committable on its own.
- Split steps larger than ~50 lines of code.
- Last step is smoke test reference, not "test everything" (that is acceptance criteria).

---

## Section 5 — Criterios de aceptación

Boolean checklist grouped by area:

```markdown
## Criterios de aceptación

### Catálogo
- [ ] `{slug}` aparece en `/games` con título, categoría y cover correctos
- [ ] `/games/{slug}` muestra detalle con CTA **JUGAR** → `/play/{slug}`

### Juego jugable
- [ ] `/play/{slug}` carga canvas {W}×{H} dentro del marco CRT
- [ ] Controles: …
- [ ] Reglas de puntuación: …
- [ ] Condición de game over: …

### HUD y shell
- [ ] PAUSA detiene el loop; REANUDAR lo reanida
- [ ] Game over muestra overlay dentro del CRT (no en canvas del engine)
- [ ] **JUGAR DE NUEVO** llama a `engine.reset()`
- [ ] SALIR navega a `/games/{slug}`

### Leaderboard
- [ ] `/games/{slug}` muestra ranking desde Supabase
- [ ] `/hall-of-fame` tab **{TÍTULO}** muestra ranking real
- [ ] **GUARDAR PUNTUACIÓN** inserta en `scores` con `user_id = null`
- [ ] Nombre recordado en `localStorage` (`av_player_name`)
- [ ] Fila **TU MEJOR MARCA** si hay nombre guardado y scores en BD

### Regresión
- [ ] Otro juego placeholder (ej. `/play/bloque-buster`) sin cambios si aún no implementado
- [ ] Asteroids sigue funcionando con normalidad

### Técnico
- [ ] Sin errores de consola relevantes
- [ ] Sin errores TypeScript/ESLint en archivos del juego
- [ ] Engine se desmonta limpiamente al salir de `/play/{slug}`
- [ ] `npm run build` sin errores
```

---

## Section 6 — Decisiones

Capture inherited defaults and game-specific choices:

```markdown
## Decisiones

### Heredadas de SPEC 05 / SPEC 06
- **Sí:** Ruta estática + `{Pascal}Player` + `{Pascal}Canvas` (sin branch en `GamePlayer`)
- **Sí:** `GamePlayerShell` para HUD, pausa y game over en CRT
- **Sí:** `saveScore` genérico + `SUPABASE_GAMES`
- **Sí:** RLS deshabilitado en `scores` (patrón del curso)
- **No:** Registry genérico de engines
- **No:** Inserción directa desde cliente Supabase

### Específicas de este juego
- **Sí/No:** …
```

---

## Section 7 — Riesgos (optional)

```markdown
## Riesgos

| Riesgo | Mitigación |
|--------|------------|
| rAF sigue corriendo tras desmontar | `unmount()` cancela rAF y elimina listeners |
| … | … |
```

Omit if no relevant risks.

---

## Section 8 — Lo que NO está en este spec

Repeat deferred items explicitly:

```markdown
## Lo que NO está en este spec

- …

Cada uno de estos, si llega, va en su propio spec.
```

---

## Global rules

Inherited from `.claude/skills/spec/template.md`:

- **One sentence per idea.** Split long sentences.
- **No TODOs.** Resolve pending decisions in Phase 2 or note with reason.
- **Standard markdown.** Must render on GitHub without surprises.

Additional rules for game specs:

- **Concrete names.** Use real file paths and `{slug}` values.
- **No full function implementations.** Short type snippets are fine.
- **Reference analysis.** If porting, list entity classes and key constants from `game.js` — do not paste the whole file.
