# SPEC 11 — Rendimiento del loop de Frogger

> **Estado:** Implementado
> **Depende de:** Frogger jugable en `/play/frogger` (engine + skins + shell táctil, SPEC 10)
> **Fecha:** 2026-09-13
> **Objetivo:** Subir Frogger a ≥55 FPS estables en partida activa (desktop y viewport táctil ~390px), en classic/retro/neon, midiendo primero y optimizando React HUD + draw de skins sin bajar la calidad visual de forma perceptible.

## Alcance

**Dentro:**

- Diagnóstico medible del cuello de botella en Frogger (Chrome Performance / FPS meter; viewport ~390px; CPU throttling 4×–6× en DevTools para simular máquina débil).
- Optimización del HUD React de Frogger: notificar a React solo cuando cambie un campo visible; refs para lo que no pinta UI; evitar `setState` redundantes. Tocar `GamePlayerShell` solo si Frogger lo necesita.
- Optimización del draw canvas de Frogger, con foco en **retro** y **neon** (`shadowBlur`, glows, scanlines, trabajo por entidad/frame), manteniendo los tres skins distinguibles y el look neon/retro *casi* igual (no pixel-perfect).
- Criterio de éxito: ≥55 FPS estables en partida activa, skins classic / retro / neon, desktop y viewport táctil ~390px, gameplay y controles (teclado + táctil) sin cambios de diseño.
- Verificación en navegador (incluido throttling) como parte del trabajo, no solo “se ve bien en un PC potente”.

**Fuera de alcance (para specs futuros):**

- Asteroids, Tetris, Arkanoid, Snake u otros juegos (se replicará por juego más adelante).
- Overlay de FPS en producción.
- Reescribir el engine de Frogger desde cero.
- Recortar features, bajar la resolución del canvas de forma permanente, o quitar skins.
- Cambiar mecánica, niveles, audio, leaderboard, o el design system del CRT.
- Tests E2E automatizados de FPS.
- Un sistema genérico de “performance runtime” compartido por todos los engines.

## Modelo de datos

No hay tablas, localStorage ni APIs nuevas. El leaderboard y `av_player_name` no cambian.

### Estado de HUD (React) — `lib/games/frogger/types.ts` (existente)

`FroggerGameState` sigue siendo la fuente que emite el engine. El player deja de hacer N `setState` por evento si los valores no cambiaron.

Si conviene un único estado de UI:

```ts
interface FroggerHudState {
  score: number;
  lives: number;
  level: number;
  timeLeft: number;
  frogsHome: number;
  phase: FroggerPhase;
}
```

Regla: `setHud` (o setters actuales) **solo** si algún campo visible cambió (comparación por valor). `paused` / overlays / save siguen en el shell como ahora.

### Caché de render (canvas, no persistida)

Estructuras internas en `lib/games/frogger/` (nombres exactos al implementar), por ejemplo:

- cache de glow/neon (offscreen o sprite pre-blureado por tipo: rana, vehículo)
- tokens de skin ya resueltos (`FroggerSkinTokens` actual; no se persisten)

Se invalidan al cambiar de skin. No se guardan entre sesiones.

### Medición

No hay modelo de datos de FPS. Se mide con DevTools (Performance, FPS meter, CPU 4×–6×). Sin overlay en producción.

## Plan de implementación

1. **Baseline.** Medir Frogger en Chrome: FPS meter + Performance (main thread vs canvas), classic / retro / neon, desktop y viewport ~390px, CPU 4× y 6×. Anotar en el PR/notas de implementación qué cuesta más (React commit vs `render.ts` / `shadowBlur`). El juego no cambia.

2. **HUD React.** En `frogger-player.tsx` / canvas: un estado de HUD o setters que no disparen render si el snapshot es igual; refs para engine y callbacks. Verificar que score, vidas, nivel, tiempo y ranas en casa siguen actualizándose cuando sí cambian. Teclado y táctil intactos.

3. **Draw retro/neon.** En `lib/games/frogger/render.ts` (+ skins si hace falta): reducir coste de `shadowBlur`/glow/scanlines (caché offscreen, menos blur por entidad, reutilizar paths). Classic no debe verse peor. Visual neon/retro equivalente, no idéntico al píxel.

4. **Re-medir.** Repetir el protocolo del paso 1. Objetivo: ≥55 FPS en partida activa en los tres skins, desktop y ~390px, con CPU 4×; 6× como estrés (si 6× no llega, documentar el número y no recortar features).

5. **Regresión de juego.** Jugar un cruce de carretera + río + home en teclado y, en viewport táctil, un cruce con D-pad. Pausa, game over y cambio de skin en caliente. Sin cambiar mecánica.

## Criterios de aceptación

- [x] Existe una baseline anotada (classic / retro / neon × desktop y ~390px, CPU 4× como mínimo) antes de dar por cerradas las optimizaciones.
- [x] Tras el cambio, partida activa de Frogger mantiene **≥55 FPS** (FPS meter, sin caídas largas a <50) en classic, retro y neon, en desktop y viewport ~390px, con CPU throttling **4×**.
- [x] El HUD (puntuación, vidas, nivel, tiempo, ranas en casa) se actualiza cuando esos valores cambian y **no** fuerza re-render de React en cada frame del canvas.
- [x] Classic, retro y neon siguen distinguibles; neon/retro no se perciben “apagados” respecto al look actual (glow/scanlines presentes, aunque el método de dibujo cambie).
- [x] Gameplay, colisiones, tiempos, teclado y controles táctiles (SPEC 10) se comportan igual.
- [x] Cambio de skin en caliente sigue funcionando; la caché de glow, si existe, se invalida.
- [x] Pausa, reanudar, fin de partida y guardar puntuación siguen iguales.
- [x] No hay overlay de FPS en producción.
- [x] No se modifican engines ni skins de otros juegos.

## Decisiones

- **Sí:** Solo Frogger en este spec; el mismo patrón se copiará juego a juego más adelante.
- **Sí:** Medir antes de optimizar (Performance + FPS meter + CPU 4×–6×). 6× es estrés; el umbral de aceptación es 4× y ≥55 FPS.
- **Sí:** Simular máquina débil con throttling de DevTools, no con un dispositivo físico obligatorio. El implementador verifica en el navegador, incluido viewport móvil.
- **Sí:** Pase de HUD React aunque el profiler acabe culpando al canvas: barato y alineado a “React solo se entera de cambios”.
- **Sí:** Optimizar glow/scanlines de retro y neon **sin** perder calidad perceptible (caché / menos blur por sprite, no apagar el look).
- **Sí:** `GamePlayerShell` solo se toca si Frogger lo necesita; no un refactor genérico de todos los players.
- **No:** Overlay de FPS en producción (DevTools basta; overlay `development` no es requisito).
- **No:** Reescribir el engine, bajar resolución permanente del canvas, quitar skins o recortar features.
- **No:** Aplicar el arreglo al resto de jugables en este spec.
- **No:** Tests E2E automatizados de FPS.

## Riesgos

| Riesgo | Mitigación |
|--------|------------|
| El PC de desarrollo es demasiado potente y “todo da 60 FPS” sin throttling | Aceptación con CPU 4× + viewport ~390px; 6× solo como estrés documentado. |
| Cachear glow cambia el look neon (bordes duros, menos bloom) | Comparar capturas classic/retro/neon antes/después; ajustar radio/alpha, no eliminar el glow. |
| Un solo `setHud` mal comparado oculta un cambio de tiempo o ranas en casa | Comparar todos los campos visibles; probar cuenta atrás y ocupación de homes a mano. |
| Tocar `GamePlayerShell` rompe HUD de otros juegos | Evitar el shell salvo necesidad; si se toca, comprobar un juego más (p. ej. Snake) en smoke. |
| El cuello está en CSS del CRT (scanlines globales), no en el canvas | El diagnóstico del paso 1 lo confirma; si es CSS, optimizar solo clases usadas por Frogger, no el design system entero. |

## Lo que NO está en este spec

- Optimización de otros juegos.
- Overlay de FPS en producción.
- Reescritura del engine o recorte de calidad/features de Frogger.
