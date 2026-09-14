# Protocolo de medición — rendimiento por juego

> Usar en Fase 2 (baseline) y Fase 5 (post-optimización). Referencia canónica: SPEC 11 y `references/frogger/performance-baseline.md`.

## Parámetros fijos

| Parámetro | Valor |
|-----------|--------|
| URL | `http://localhost:3000/play/{slug}` |
| Navegador | Chrome / Chromium (DevTools o Playwright MCP + CDP si está disponible) |
| Viewports | Desktop ~1280×800 · Móvil ~390×844 |
| CPU throttling | **4×** (umbral de aceptación) · **6×** (estrés, documentar si no llega a 55 FPS) |
| Skins | classic · retro · neon (o equivalentes del juego) |
| Escenario | Partida **activa** (no pausa, no game over): máxima carga visual típica |
| Duración muestra | 4–5 s por combinación skin × viewport × CPU |
| Criterio | **≥55 FPS** estables (FPS meter); sin caídas largas a &lt;50 |

## Herramientas

1. **Rendering → FPS meter** (Chrome DevTools).
2. **Performance** panel: distinguir main thread (React commits) vs canvas (`render.ts`, `shadowBlur`).
3. **CPU throttling:** Performance → gear → 4× o 6×; o CDP `Emulation.setCPUThrottlingRate`.
4. **Opcional:** hook `requestAnimationFrame` vía `addInitScript` **antes** de cargar la página (ver nota en baseline Frogger: el engine puede capturar rAF al montar; preferir medición con FPS meter si el hook subestima).

## Qué anotar por combinación

Para cada fila (skin × viewport × CPU):

- FPS promedio / perceptible (meter)
- Si hubo frame drops o jank al pulsar D-pad en móvil
- Cuello de botella observado: `react` | `canvas` | `css_touch` | `mixed` | `ok`

## Plantilla — `references/{slug}/performance-baseline.md`

```markdown
# {Title} — baseline de rendimiento (@game-performance-booster)

> Fecha: YYYY-MM-DD · Rama: … · Fase: baseline | post-optimización

## Protocolo de medición

(Copiar tabla de parámetros de este archivo.)

## Resultados

### Desktop 1280×800

| Skin | CPU | FPS ~ | Notas |
|------|-----|-------|-------|
| classic | 4× | | |
| retro | 4× | | |
| neon | 4× | | |

### Móvil 390×844

| Skin | CPU | FPS ~ | Notas |
|------|-----|-------|-------|
| classic | 4× | | |
| retro | 4× | | |
| neon | 4× | | |

## Cuellos de botella (diagnóstico)

- React HUD: …
- Canvas draw: …
- Touch / CSS: …

## Cambios aplicados (solo en post-optimización)

- …

## Regresión manual

- [ ] Teclado / mecánica
- [ ] Touch D-pad sin lag al pulsar
- [ ] Pausa / game over / guardar score
- [ ] Cambio de skin en caliente
```

## Reglas

- **Medir antes** de cambiar código (salvo hotfix crítico acordado con el usuario).
- No usar overlay FPS en producción.
- Si el PC de desarrollo da 60 FPS sin throttle, **igual** aplicar 4× + ~390px para aceptación.
- Documentar 6× como estrés; no recortar features solo porque 6× falle si 4× cumple.
