# Frogger — baseline de rendimiento (SPEC 11, paso 1)

> Fecha: 2026-09-13 · Rama: `spec-11-rendimiento-frogger` · Sin cambios de código en el juego.

## Protocolo de medición

| Parámetro | Valor |
|-----------|-------|
| URL | `http://localhost:3000/play/frogger` |
| Navegador | Chromium (Playwright MCP + CDP `Emulation.setCPUThrottlingRate`) |
| Viewports | Desktop 1280×800 · Móvil 390×844 |
| CPU throttling | 1× (sin throttle), 4× (aceptación), 6× (estrés) |
| Skins | classic · retro · neon |
| Escenario | Partida activa en dock (vehículos/plataformas en movimiento, timer corriendo) |
| Duración muestra | 4–5 s por combinación |
| Herramientas | rAF frame budget (hook inyectado), conteo estático de operaciones draw |

## Resultados rAF (frame budget del callback)

Mide tiempo de ejecución del callback de `requestAnimationFrame` (ms). **Nota:** el engine captura `requestAnimationFrame` al montar; el hook inyectado posterior mide callbacks tardíos y subestima el coste real del loop del juego en algunas muestras (`samples` bajos). Los datos fiables son las filas con `samples ≥ 180`.

### Desktop 1280×800

| Skin | CPU | avg ms | p95 ms | max ms | dropped | muestras |
|------|-----|--------|--------|--------|---------|----------|
| classic | 1× | 0.13 | 0.20 | 0.8 | 0 | 299 |
| retro | 1× | 0.21 | 0.50 | 1.1 | 0 | 299 |
| neon | 1× | 0.33 | 0.70 | 1.1 | 0 | 299 |
| classic | 4× | 0.70 | 1.20 | 1.6 | 0 | 300 |
| retro | 4× | 0.84 | 1.50 | 1.9 | 2 | 184 |
| neon | 4× | 0.96 | 1.30 | 1.3 | 4 | 5* |
| classic | 6× | 0.84 | 1.20 | 1.2 | 4 | 5* |
| retro | 6× | 1.46 | 2.20 | 2.2 | 4 | 5* |
| neon | 6× | 1.60 | 2.40 | 2.4 | 3 | 4* |

\* Muestra incompleta por limitación del hook (ver nota arriba).

### Móvil 390×844

| Skin | CPU | avg ms | p95 ms | max ms | dropped |
|------|-----|--------|--------|--------|---------|
| classic | 1× | 0.23 | 0.40 | 0.4 | 3 |
| retro | 1× | 0.35 | 0.50 | 0.5 | 3 |
| neon | 1× | 0.20 | 0.40 | 0.4 | 3 |
| classic | 4× | 0.75 | 1.20 | 1.2 | 3 |
| retro | 4× | 1.28 | 1.70 | 1.7 | 4 |
| neon | 4× | 0.94 | 1.20 | 1.2 | 4 |
| classic | 6× | 1.17 | 1.60 | 1.6 | 3 |
| retro | 6× | 1.58 | 2.70 | 2.7 | 4 |
| neon | 6× | 1.62 | 3.20 | 3.2 | 4 |

En el entorno de desarrollo actual (PC potente + headless Chromium) **todas las combinaciones mantienen ~60 FPS** en rAF global. El orden de coste por skin en 1× desktop confirma: **neon > retro > classic** (avg 0.33 > 0.21 > 0.13 ms en callbacks medidos).

## Inventario estático de draw por frame (`render.ts`)

Estimación nivel 1, partida activa:

| Operación | Classic | Retro | Neon |
|-----------|---------|-------|------|
| `fillRect` filas + fondo | ~16 | ~16 | ~16 |
| Tramos carretera (dash) | ~80 | ~80 | ~80 |
| Grid vertical (`stroke`) | 13 | 13 | 13 |
| Vehículos (~30) | 30× fill + detalle | 30× fill + detalle | 30× fill + **`shadowBlur: 8`** |
| Plataformas (~25) | ~25–40 primitivas | idem | idem |
| Rana | 1 ellipse | 1 ellipse | 1 ellipse + **`shadowBlur: 14`** |
| Scanlines (`drawScanlines`) | — | **~320 `fillRect`** | — |
| **`shadowBlur` toggles/frame** | **0** | **0** | **~31** |

**Conclusión canvas:** el cuello de botella principal es **`render.ts`**, no React:

1. **Neon:** `vehicleGlowBlur: 8` por vehículo + `frogGlowBlur: 14` → ~31 operaciones con blur por frame (muy caras en CPU).
2. **Retro:** `drawScanlines` → 320 `fillRect` de 1 px de alto cada frame.
3. **Classic:** sin blur ni scanlines; coste base más bajo.

## React HUD (`frogger-player.tsx`)

| Aspecto | Estado actual |
|---------|---------------|
| `onStateChange` | 5 `setState` separados (`score`, `lives`, `level`, `timeLeft`, `frogsHome`) sin comparación previa |
| Frecuencia engine | `emitState()` **no** cada frame; solo en eventos (muerte, meta, fin, cambio de segundo en `timeLeft`) |
| Presión React en partida | **Baja** (~1 commit/s por timer + eventos puntuales) |
| Riesgo | Si se añade telemetría por frame o se emite estado más a menudo, el HUD actual escalaría mal |
| Objetivo paso 2 | Guard comparativo (`FroggerHudState`) para evitar commits redundantes |

## CSS / CRT

El marco CRT (`app/arcade-vault.css`) aplica scanlines vía pseudo-elementos en el contenedor. **No se midió como cuello principal** en esta sesión; el coste dominante está en el canvas (sobre todo neon blur + retro scanlines internas).

## Diagnóstico resumido

| Área | Impacto estimado | Acción en spec |
|------|------------------|----------------|
| `render.ts` neon `shadowBlur` | **Alto** | Paso 3: caché offscreen / pre-blur |
| `render.ts` retro scanlines | **Medio-alto** | Paso 3: capa estática o patrón reutilizado |
| React HUD | **Bajo hoy**, preventivo | Paso 2: setHud con igualdad |
| CSS CRT global | Bajo (pendiente confirmar en máquina débil) | Solo si el paso 1 lo confirma |

## Objetivo post-optimización

≥55 FPS estables con CPU **4×**, classic / retro / neon, desktop y ~390px, sin caídas largas a <50 FPS.

---

*Generado en el paso 1 de SPEC 11. Re-medición obligatoria tras pasos 2–3 (paso 4 del plan).*

---

## Re-medición post-optimización (paso 4)

> Fecha: 2026-09-13 · Tras pasos 2 (HUD React) y 3 (render-cache). Hook `requestAnimationFrame` inyectado vía `addInitScript` **antes** de cargar la página (mide el loop real del engine).

### CPU 4× — criterio de aceptación (≥55 FPS)

| Viewport | Skin | FPS | avg ms | p95 ms | dropped |
|----------|------|-----|--------|--------|---------|
| desktop-1280 | classic | **60** | 0.71 | 1.4 | 0 |
| desktop-1280 | retro | **60** | 0.71 | 1.2 | 0 |
| desktop-1280 | neon | **60** | 0.80 | 1.5 | 0 |
| mobile-390 | classic | **60** | 0.67 | 1.3 | 0 |
| mobile-390 | retro | **60** | 0.64 | 1.2 | 0 |
| mobile-390 | neon | **60** | 0.71 | 1.4 | 0 |

**Resultado:** ✅ Todas las combinaciones ≥55 FPS, sin frames dropped (>20 ms gap).

### Comparativa vs baseline (CPU 4× desktop, muestras fiables)

| Skin | avg ms antes | avg ms después | dropped antes | dropped después |
|------|--------------|----------------|---------------|-----------------|
| classic | 0.70 | 0.71 | 0 | 0 |
| retro | 0.84 | **0.71** | 2 | **0** |
| neon | ~0.96* | **0.80** | 4* | **0** |

### CPU 6× — estrés (desktop)

| Skin | FPS | avg ms | p95 ms | dropped |
|------|-----|--------|--------|---------|
| classic | 60 | 0.85 | 1.5 | 0 |
| retro | 60 | 0.80 | 1.5 | 0 |
| neon | 60 | 0.99 | 1.8 | 0 |

Antes (baseline incompleto): retro ~1.46 ms, neon ~1.60 ms con dropped frames.

### CPU 1× — desktop (sanity check)

| Skin | avg ms antes | avg ms después |
|------|--------------|----------------|
| classic | 0.13 | 0.34 |
| retro | 0.21 | 0.36 |
| neon | 0.33 | **0.32** |

Los valores absolutos en 1× no son comparables 1:1 (metodología distinta del hook), pero **neon ya no es el skin más caro** en 1×; retro y neon quedan alineados gracias a caché/pattern.

### Draw por frame tras optimización

| Operación | Classic | Retro | Neon |
|-----------|---------|-------|------|
| Terreno + grid | 1× `drawImage` (caché) | 1× `drawImage` | 1× `drawImage` |
| Scanlines | — | 1× `fillRect` (pattern) | — |
| Vehículos glow | — | — | 30× `drawImage` (sin `shadowBlur` runtime) |
| Rana glow | — | — | 1× `drawImage` (sin `shadowBlur` runtime) |
| **`shadowBlur` runtime** | **0** | **0** | **0** |

### Veredicto paso 4

✅ Criterio SPEC 11 cumplido: **≥55 FPS** en partida activa, classic/retro/neon, desktop y ~390px, CPU **4×**, sin caídas largas a <50 FPS.

---

## Regresión de juego (paso 5)

> Fecha: 2026-09-13 · Chromium/Playwright · Sin cambios de mecánica.

| Prueba | Viewport | Resultado | Detalle |
|--------|----------|-----------|---------|
| Pausa / reanudar | desktop | ✅ | Overlay EN PAUSA; REANUDAR limpia overlay |
| Cambio skin en caliente | desktop | ✅ | CLÁSICO → RETRO → NEÓN → CLÁSICO sin crash |
| Cruce teclado (↑×14) | desktop | ✅ | score=60 (filas/carretera/río); colisión/muerte al final esperable |
| Game over (FIN) | desktop | ✅ | Overlay FIN DEL JUEGO |
| Restart (JUGAR DE NUEVO) | desktop | ✅ | score=0, 3 vidas, meta 0/5, sin overlay |
| Barra táctil visible | mobile 390 | ✅ | `virtual-controls` + toolbar compacta |
| D-pad ↑ (PointerEvent touch) | mobile 390 | ✅ | score 0→20; 1 vida menos (tráfico/río) |
| Pausa táctil | mobile 390 | ✅ | Overlay EN PAUSA |

**Veredicto paso 5:** ✅ Gameplay, colisiones, HUD, teclado, táctil (SPEC 10), pausa, fin de partida y restart se comportan igual tras las optimizaciones.


