# Mobile game checklist — Arcade Vault

Checklist accionable para auditorías `@mobile-porter`. Un juego por sesión. Marcar ✅ / ❌ / N/A.

## A. Detección y layout general

- [ ] En viewport ≥ 768px con `pointer: fine`, los controles virtuales **no** se muestran.
- [ ] En viewport < 768px o `pointer: coarse`, la barra inferior fija aparece en `/play/{slug}`.
- [ ] En modo táctil, navbar y footer del sitio están ocultos (`av-touch-play` en `<html>`).
- [ ] HUD superior muestra solo stats (jugador, puntuación, métricas del juego); sin PAUSA/FIN/SALIR.
- [ ] Separación visible entre HUD de stats y marco CRT (~14px).
- [ ] PAUSA, FIN, SALIR y selector de skins accesibles desde toolbar inferior, una sola fila.
- [ ] Barra de controles fija al borde inferior del viewport durante partida activa.
- [ ] Player en modo táctil ocupa `100dvh`; `.crt-bottom` oculto.

## B. Controles unificados (6 botones)

- [ ] D-pad a la izquierda, A y B en fila horizontal a la derecha (misma disposición en los 4 juegos).
- [ ] Gap amplio entre grupo D-pad y grupo A/B (~64px desktop / ~52px móvil).
- [ ] Gaps internos compactos: 4px dentro del D-pad, 8px entre A y B.
- [ ] Flechas usan glifo `↑` rotado con CSS (no `←` `→` unicode).
- [ ] Botones sin acción en el mapa del juego: atenuados y sin respuesta al toque.
- [ ] Botones con acción: feedback visual `--pressed` mientras el dedo está apoyado.

## C. Input táctil (tap + hold)

- [ ] Tap corto produce **exactamente un paso** (celda, nudge pala, giro, disparo, etc.).
- [ ] Mantener ≥ ~500 ms activa repetición continua comparable al teclado.
- [ ] No hay doble input por mouse sintético post-toque.
- [ ] No hay botones "pegados" tras soltar (liberación global en capture).
- [ ] No se emiten `KeyboardEvent` sintéticos desde controles táctiles.

## D. Overlays y scroll

- [ ] En pausa: controles de juego no montados; solo toolbar del shell.
- [ ] En game over: igual; panel compacto dentro del CRT.
- [ ] Si hay overflow en game over, scroll **dentro** del overlay (`.crt-gameover`), no en documento.
- [ ] Fondo del sitio no se despega del viewport al interactuar con game over.
- [ ] Partida activa: scroll/zoom bloqueado (`av-touch-play` + `touch-action: none` en `av-player--active-touch`).
- [ ] Input de iniciales en game over: altura fija (~34px), no estirado por flex.

## E. Desktop sin regresiones

- [ ] Teclado funciona exactamente como antes en desktop.
- [ ] Controles virtuales no se montan fuera de `touchMode`.
- [ ] Engine ignora `setVirtualInput` si no hay llamada activa.

## F. Skins en móvil

- [ ] Selector compacto (`SKIN` + `<select>`) visible en toolbar táctil.
- [ ] Cambio de skin no rompe layout de barra ni controles.

---

## Por juego — criterios específicos

### Snake

- [ ] ↑↓←→ cambian dirección (tap y hold).
- [ ] A y B atenuados, sin acción.
- [ ] Hold no encola giros erráticos (bloqueo 180° existente).

### Asteroids

- [ ] ↑ impulsa, ←→ rotan, A dispara.
- [ ] ↓ y B atenuados.
- [ ] `fire` en `PULSE_ACTIONS` → solo tap, nunca hold.
- [ ] Tap rotate: ±π/12; tap thrust: 42 px equiv.

### Tetris

- [ ] ←→ mueven (tap + hold).
- [ ] ↑ rota (solo tap).
- [ ] ↓ baja suave (tap + hold).
- [ ] A hard drop (solo tap).
- [ ] B atenuado.
- [ ] Hold repite cada 33 ms (`VIRTUAL_INPUT_REPEAT_MS`; `dt` en ms).
- [ ] Tablero completo (20 filas) visible sin recorte vertical.
- [ ] Panel NEXT compacto a la derecha del tablero.
- [ ] Lista de controles de teclado oculta en móvil.

### Arkanoid

- [ ] ←→ mueven pala (tap 32 px + hold continuo 400 px/s).
- [ ] ↑ ↓ A B atenuados.
- [ ] Pelota sigue auto-lanzándose (sin cambio de mecánica).

---

## Verificación manual sugerida

1. **Desktop:** `/play/{slug}` — teclado, sin barra táctil.
2. **DevTools:** emular iPhone/Android, viewport < 768px — barra táctil, chrome oculto.
3. **Flujos:** partida activa → pausa → reanudar → game over → guardar score.
4. **Dispositivo real (opcional):** LAN con `ALLOWED_DEV_ORIGINS`.

## Resultado de auditoría

Al cerrar la sesión, documentar en `coverage-log.md`:

- Columnas: `touch_map` | `engine_api` | `player_wiring` | `canvas_cleanup` | `layout_movil` | `verificado`
- Estado: `completo` | `parcial` (con gap) | `pendiente`
- Items ❌ pendientes y plan de fix si aplica
