# SPEC 06 — Catálogo de juegos y leaderboard en Supabase

> **Estado:** Implementado
> **Depende de:** SPEC 04 — Integración de Supabase en Next.js
> **Fecha:** 2026-08-04
> **Objetivo:** Crear tablas `games` y `scores` en Supabase, sembrar Asteroids, y conectar la UI existente para leer rankings y guardar puntuaciones reales (con nombre recordado en localStorage) vía Server Action.

## Alcance

**Dentro:**

- Tablas en Supabase:
  - `games` — catálogo persistido (por ahora solo `asteroids`).
  - `scores` — historial de partidas: `id`, `game_id`, `player_name`, `score`, `user_id` (nullable, FK a `auth.users` opcional), `created_at`.
- Migración SQL aplicable vía Supabase (CLI o MCP): creación de tablas, índices, RLS y seed de la fila `asteroids` en `games`.
- Capa de datos en la app:
  - `lib/supabase/queries/` (o equivalente) para leer rankings y resolver juegos desde Supabase.
  - Server Action para insertar scores con validación server-side.
- Híbrido por juego:
  - **asteroids** — leaderboard desde Supabase (`/hall-of-fame`, detalle lateral, guardar al game over).
  - **Resto de juegos** — siguen con `seededScores` mock; sin cambios de comportamiento.
- Guardar puntuación al pulsar **GUARDAR PUNTUACIÓN** en el modal de game over (no automático al terminar la partida).
  - `player_name` = texto del input (máx. 10 caracteres, mayúsculas).
  - `user_id` = `null` (sin auth Supabase por ahora).
- Recordar `player_name` en `localStorage` (clave dedicada, p. ej. `av_player_name`) para pre-rellenar el input en futuros game overs.
- Fila **TU MEJOR MARCA** en `/hall-of-fame` para asteroids: mejor score en Supabase donde `player_name` coincide con el nombre guardado en `localStorage` (o nombre del auth mock si hay sesión mock activa).
- Solo **AsteroidsPlayer** cableado al guardado real; `GamePlayer` placeholder sigue con mock local.

**Fuera de alcance (para specs futuros):**

- Supabase Auth real (login/registro/OAuth); reemplazar auth mock.
- Migrar el catálogo completo de `app/data/games.ts` a Supabase (solo seed de `asteroids`; el resto sigue en mock).
- Leer todos los juegos solo desde Supabase (objetivo futuro, no este spec).
- Scores de demo en seed (el leaderboard se llena con partidas reales).
- Inserción directa desde el cliente Supabase (sin Server Action).
- Guardado automático al detectar `gameover` sin pulsar el botón.
- Realtime, Edge Functions, tipos generados con `supabase gen types`.
- Tests automatizados.
- Cablear guardado real en juegos distintos de asteroids.
- Actualizar `plays` / `best` global en `games` desde triggers o agregados (stats del detalle siguen mock para asteroids salvo lo que derive del query de scores).

## Modelo de datos

### SQL — Supabase

```sql
-- games: catálogo persistido (spec 06 solo seed de asteroids)
create table public.games (
  id          text primary key,
  title       text not null,
  short       text not null,
  long        text not null,
  cat         text not null check (cat in ('ARCADE', 'PUZZLE', 'SHOOTER', 'VERSUS')),
  cover       text not null,
  color       text not null check (color in ('cyan', 'magenta', 'yellow', 'green')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- scores: historial de partidas
create table public.scores (
  id           uuid primary key default gen_random_uuid(),
  game_id      text not null references public.games (id) on delete restrict,
  player_name  text not null check (char_length(player_name) between 1 and 10),
  score        integer not null check (score >= 0),
  user_id      uuid null references auth.users (id) on delete set null,
  created_at   timestamptz not null default now()
);

create index scores_game_id_created_at_idx
  on public.scores (game_id, created_at desc);

create index scores_game_id_score_idx
  on public.scores (game_id, score desc);

-- RLS
alter table public.games enable row level security;
alter table public.scores enable row level security;

create policy "games_select_anon"
  on public.games for select to anon, authenticated using (true);

create policy "scores_select_anon"
  on public.scores for select to anon, authenticated using (true);

-- Inserción solo vía service role (Server Action); sin policy INSERT para anon
```

**Seed** (misma migración o archivo separado):

```sql
insert into public.games (id, title, short, long, cat, cover, color)
values (
  'asteroids',
  'ASTEROIDS',
  'Destruye asteroides y sobrevive en el vacío.',
  'Pilota una nave triangular en gravedad cero. Rota, propúlsate y dispara para pulverizar rocas que se fragmentan en piezas más pequeñas. Cada nivel trae más asteroides. ¿Cuánto aguantas?',
  'SHOOTER',
  'cover-asteroids',
  'yellow'
);
```

### Tipos en la app — `lib/supabase/types.ts` (nuevo)

```ts
export interface DbGame {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
  cover: string;
  color: "cyan" | "magenta" | "yellow" | "green";
  created_at: string;
  updated_at: string;
}

export interface DbScore {
  id: string;
  game_id: string;
  player_name: string;
  score: number;
  user_id: string | null;
  created_at: string;
}
```

### UI — reutiliza `ScoreRow` de `app/data/scores.ts`

```ts
export interface ScoreRow {
  rank: number;
  name: string;   // maps from player_name
  score: number;
  date: string;     // formato es-ES desde created_at
}
```

No se cambia la interfaz; los queries de Supabase mapean a este shape.

### localStorage — nombre del jugador

```ts
const PLAYER_NAME_KEY = "av_player_name";

// Valor: string, máx. 10 chars, mayúsculas (misma normalización que auth mock)
// Se escribe al guardar puntuación con éxito
// Se lee al abrir el modal de game over para pre-rellenar el input
```

Prioridad al pre-rellenar: `localStorage` → auth mock `user.name` → `"INVITADO"`.

### Server Action — `app/actions/save-score.ts`

```ts
export interface SaveScoreInput {
  gameId: string;
  playerName: string;
  score: number;
}

export interface SaveScoreResult {
  ok: true;
} | {
  ok: false;
  error: string;
}
```

Validación server-side:

- `gameId` debe existir en `public.games`.
- `playerName`: trim, uppercase, 1–10 caracteres, solo alfanumérico (o la misma regla que el input UI).
- `score`: entero ≥ 0.
- `user_id`: siempre `null` en este spec.
- Insert con cliente server Supabase (`service_role` o cliente server con bypass RLS documentado en SPEC 04).

### Queries — `lib/supabase/queries/scores.ts`

```ts
// Top N por juego, ordenado por score DESC, created_at ASC como desempate
export async function getLeaderboard(
  gameId: string,
  limit = 12,
): Promise<ScoreRow[]>;

// Mejor marca del jugador + rango estimado en el leaderboard del juego
export async function getPlayerBestInGame(
  gameId: string,
  playerName: string,
): Promise<{ score: number; rank: number; date: string } | null>;
```

### Híbrido — `lib/data/leaderboard.ts` (nuevo helper)

```ts
const SUPABASE_GAMES = new Set(["asteroids"]);

export async function getLeaderboardForGame(
  gameId: string,
  limit?: number,
): Promise<ScoreRow[]> {
  if (SUPABASE_GAMES.has(gameId)) {
    return getLeaderboard(gameId, limit);
  }
  return seededScores(gameId.length * 17 + 3, limit ?? 10);
}
```

Misma lógica de ramificación para `getPlayerBestInGame` (solo asteroids; resto mock o `null`).

### Archivos nuevos / modificados (referencia)

| Archivo | Rol |
|---------|-----|
| `supabase/migrations/YYYYMMDD_games_scores.sql` | Esquema + RLS + seed |
| `lib/supabase/types.ts` | Tipos DB |
| `lib/supabase/queries/scores.ts` | Lecturas |
| `lib/data/leaderboard.ts` | Ramificación mock vs Supabase |
| `app/actions/save-score.ts` | Inserción validada |
| `lib/player-name.ts` | `PLAYER_NAME_KEY`, read/write/normalize |
| `components/games/asteroids-player.tsx` | Llama Server Action + localStorage |
| `app/hall-of-fame/page.tsx` | Tabs asteroids desde Supabase |
| `components/game-detail-view.tsx` | Leaderboard lateral híbrido |

`app/data/games.ts` **no se elimina**; sigue siendo la fuente del catálogo UI para los 8 juegos.

## Plan de implementación

1. **Migración Supabase** — Crear `supabase/migrations/…_games_scores.sql` con tablas `games` y `scores`, índices, RLS (SELECT público; sin INSERT para `anon`), y seed de `asteroids`. Aplicar en el proyecto remoto (MCP `apply_migration` o `supabase db push`). Verificar en el dashboard que existen las tablas y la fila seed.

2. **Tipos y queries** — Crear `lib/supabase/types.ts` y `lib/supabase/queries/scores.ts` con `getLeaderboard` y `getPlayerBestInGame`. Probar manualmente desde una ruta temporal o script que devuelve JSON para `game_id = 'asteroids'` (puede ser vacío).

3. **Helper híbrido** — Crear `lib/data/leaderboard.ts` con `getLeaderboardForGame` y `getPlayerBestForGame` (ramificación `asteroids` → Supabase, resto → `seededScores` / mock). Eliminar ruta temporal de prueba si se creó en el paso 2.

4. **localStorage del nombre** — Crear `lib/player-name.ts` con `PLAYER_NAME_KEY`, `readPlayerName()`, `writePlayerName()`, `normalizePlayerName()` (misma lógica que auth mock: uppercase, máx. 10). Sin UI todavía.

5. **Server Action** — Crear `app/actions/save-score.ts` con validación e inserción vía cliente server Supabase. Verificar insert manual (p. ej. desde un botón de prueba o llamada directa) y confirmar fila en el dashboard.

6. **Detalle del juego** — Actualizar `components/game-detail-view.tsx` para usar `getLeaderboardForGame` (Server Component async o fetch en server). Asteroids muestra datos reales (vacío o con scores); otros juegos siguen con mock. Verificar `/games/asteroids` y un juego mock.

7. **Salón de la fama** — Actualizar `app/hall-of-fame/page.tsx`: tab asteroids carga leaderboard desde Supabase; otros tabs mock. Fila **TU MEJOR MARCA** para asteroids vía `getPlayerBestForGame` + nombre de `readPlayerName()` (client) o auth mock. Verificar `/hall-of-fame` con tab asteroids.

8. **Guardar en Asteroids** — Actualizar `components/games/asteroids-player.tsx`: pre-rellenar input con `readPlayerName()` al game over; en **GUARDAR PUNTUACIÓN** llamar Server Action, escribir localStorage al éxito, mostrar toast. Verificar flujo completo: jugar → game over → guardar → ver score en detalle/salón.

9. **Limpieza** — Quitar código de prueba temporal. Confirmar que `GamePlayer` placeholder no cambió. `npm run build` sin errores.

## Criterios de aceptación

### Supabase

- [x] Existen las tablas `public.games` y `public.scores` en el proyecto remoto.
- [x] `games` contiene una fila con `id = 'asteroids'`.
- [x] RLS activo: `anon` puede `SELECT` en ambas tablas.
- [x] `anon` no puede `INSERT` en `scores` (inserción solo vía Server Action).

### Lectura (híbrido)

- [x] `/games/asteroids` muestra el leaderboard lateral desde Supabase (vacío o con datos reales).
- [x] `/games/bloque-buster` (u otro mock) sigue mostrando leaderboard generado por `seededScores`.
- [x] `/hall-of-fame` con tab **ASTEROIDS** muestra ranking desde Supabase.
- [x] `/hall-of-fame` con otro tab sigue mostrando datos mock.
- [x] En tab asteroids, si hay nombre en `localStorage` (`av_player_name`) y scores en BD, aparece la fila **TU MEJOR MARCA** con score y rango correctos.
- [x] Sin nombre guardado ni auth mock, no aparece la fila **TU MEJOR MARCA** en asteroids (o muestra mock solo en tabs no-asteroids como hoy).

### Guardar puntuación (Asteroids)

- [x] Al game over, el input de nombre se pre-rellena con el valor de `localStorage` si existe.
- [x] Si no hay `localStorage`, se usa auth mock `user.name` o `INVITADO`.
- [x] Pulsar **GUARDAR PUNTUACIÓN** inserta una fila en `scores` con `game_id`, `player_name`, `score` y `user_id = null`.
- [x] Tras guardar con éxito, el nombre queda en `localStorage`.
- [x] Tras guardar, se muestra el toast **PUNTUACIÓN GUARDADA_** (sin segundo insert al pulsar de nuevo si `saved` ya es true).
- [x] La puntuación guardada aparece en `/games/asteroids` y en `/hall-of-fame` (tab asteroids) tras recargar.

### Validación server

- [x] `gameId` inválido o no existente en `games` → Server Action devuelve error sin insertar.
- [x] `playerName` vacío o > 10 caracteres → error sin insertar.
- [x] `score` negativo → error sin insertar.

### Regresión

- [x] `/play/asteroids` juega con normalidad (pausa, reinicio, game over).
- [x] `GamePlayer` placeholder en `/play/[id]` no guarda en Supabase.
- [x] `npm run build` termina sin errores de TypeScript.

## Decisiones

- **Sí:** Tablas `games` + `scores` en el mismo spec. El catálogo en BD y el leaderboard comparten `game_id`; separarlos dejaría el guardado sin referencia válida.
- **Sí:** Seed solo de `asteroids` en `games`. Es el único juego real implementado; el resto del catálogo sigue en `app/data/games.ts`.
- **Sí:** Híbrido por juego (`SUPABASE_GAMES = ["asteroids"]`). No rompe la UI de los 7 juegos mock; migración gradual al catálogo en BD queda para otro spec.
- **Sí:** Server Action para insertar scores. Valida en servidor y evita INSERT directo desde el cliente con `anon`.
- **Sí:** Sin policy INSERT para `anon` en `scores`. La inserción usa cliente server (service role o patrón documentado en SPEC 04).
- **Sí:** `user_id` nullable y siempre `null` en este spec. Auth Supabase es otro spec; la columna queda lista para cuando exista sesión real.
- **Sí:** Guardar solo al pulsar **GUARDAR PUNTUACIÓN**, no automático en `gameover`. Respeta la UX actual y evita inserts por partidas abandonadas.
- **Sí:** `player_name` en `localStorage` (`av_player_name`). Permite re-guardar con un clic; coherente con invitados sin auth.
- **Sí:** **TU MEJOR MARCA** por match de `player_name` contra `localStorage` (prioridad) o auth mock. Sin auth Supabase no hay `user_id` fiable; el nombre escrito es la identidad de sesión.
- **No:** Seed de scores de demo. El leaderboard vacío inicial es aceptable; datos reales salen de partidas.
- **No:** Inserción directa con `createBrowserClient`. Más expuesta y duplica validación.
- **No:** Migrar los 8 juegos a Supabase ahora. Alcance explícito futuro; este spec solo conecta asteroids.
- **No:** Actualizar `best` / `plays` en `games` o en el detalle vía triggers. Stats del detalle de asteroids siguen mock (`best: 0`, `plays: "0"`) salvo lo que muestre el leaderboard lateral.
- **No:** Supabase Auth en este spec. El usuario confirmó que no hace falta autenticación para guardar.
- **Definición rápida:** El usuario respondió bloques de preguntas en una sesión; no se saltó Phase 2.

## Riesgos

| Riesgo | Mitigación |
|--------|------------|
| `SERVICE_ROLE_KEY` usada en Server Action con validación insuficiente | Validar estrictamente `gameId`, `playerName` y `score` antes de insertar; nunca exponer la key al cliente. |
| Spam de inserts (botón guardar o scripts) | Aceptable en MVP; rate limiting o CAPTCHA en spec futuro si hace falta. |
| Leaderboard con muchas filas del mismo jugador | Este spec muestra top N por score (no deduplica por jugador); comportamiento tipo arcade clásico. |
| `localStorage` deshabilitado o vacío | Pre-relleno cae a auth mock o `INVITADO`; guardar sigue funcionando con el nombre del input. |
| Hall of fame es Client Component; queries Supabase son server-only | Server Component wrapper, `use()` con promise, o fetch a Route Handler interno; no importar queries server en client directamente. |
| Tab asteroids vacío al inicio (sin seed de scores) | UI debe renderizar tabla vacía sin error; criterio de aceptación explícito. |
| Desincronización `games.ts` mock vs fila `asteroids` en BD | Seed copia los mismos strings que `app/data/games.ts`; cambios futuros requieren actualizar ambos hasta migración completa. |
| SPEC 05 dice "GUARDAR PUNTUACIÓN mock" — este spec lo reemplaza para asteroids | Documentado en alcance; criterio de regresión actualizado para asteroids con persistencia real. |

## Lo que NO está en este spec

- Supabase Auth (login, registro, OAuth, sesión real).
- Migración del catálogo completo (`app/data/games.ts` → solo Supabase).
- Seed de scores de demo en la base de datos.
- Guardado real en juegos distintos de **asteroids** (`GamePlayer` placeholder y otros ids).
- Inserción de scores desde el cliente con `createBrowserClient`.
- Guardado automático al `gameover` sin pulsar el botón.
- Actualización de `best` / `plays` en detalle vía triggers o agregados en `games`.
- Realtime, Edge Functions, tipos generados (`supabase gen types`).
- Rate limiting, anti-spam o CAPTCHA en guardado de scores.
- Tests automatizados.
- Deduplicación del leaderboard (una fila por jugador).

Cada uno de estos, si llega, va en su propio spec.
