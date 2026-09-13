# Patrones de rendimiento — juegos canvas (referencia reutilizable)

> Origen: SPEC 11 (Frogger), 2026-09-13. Usar como checklist al replicar en Asteroids, Snake, Tetris, Arkanoid u otro jugable, o al diseñar una skill/subagente de performance.

## Cuándo aplicar

- Partida activa <55 FPS en viewport ~390px o con CPU DevTools 4×.
- Lag perceptible al jugar en móvil aunque el FPS del canvas sea bueno.
- Skins retro/neon con `shadowBlur`, scanlines o glow por entidad cada frame.

## Protocolo de medición (obligatorio antes/después)

1. Chrome → `/play/{slug}`, partida activa (no pausa).
2. Viewports: desktop ~1280px y móvil ~390px.
3. CPU throttling: **4×** (aceptación), **6×** (estrés).
4. Skins: classic, retro, neon (o equivalentes del juego).
5. Anotar en `references/{slug}/performance-baseline.md`: FPS, frame gaps, dropped frames, cuellos (canvas vs React vs CSS).

Hook fiable para el loop del engine: inyectar patch de `requestAnimationFrame` con `addInitScript` **antes** de cargar la página.

---

## Capa 1 — HUD React (`{slug}-player.tsx`)

**Problema:** N `setState` por evento del engine aunque los valores no cambien.

**Patrón:**

```ts
interface {Game}HudState { /* solo campos visibles en GamePlayerShell */ }

function hudFromGameState(state): HudState { ... }
function hudEquals(a, b): boolean { ... }

const [hud, setHud] = useState(createInitialHud);

const handleStateChange = useCallback((state) => {
  setHud((prev) => {
    const next = hudFromGameState(state);
    return hudEquals(prev, next) ? prev : next;
  });
  // phase overlays (game over / win) aparte
}, []);

const prefillRef = useRef(prefillPlayerName);
useEffect(() => { prefillRef.current = prefillPlayerName; }, [prefillPlayerName]);
```

**Reglas:**

- `handleStateChange` estable (sin deps) + refs para callbacks que no pintan UI.
- `engineRef` y `onStateChangeRef` en canvas (patrón Asteroids).
- No tocar `GamePlayerShell` salvo necesidad real.

---

## Capa 2 — Draw canvas (`lib/games/{slug}/render-cache.ts`)

**Problema:** Redibujado completo del terreno, scanlines con cientos de `fillRect`, `shadowBlur` por entidad en neon.

**Patrón `RenderCache` por engine:**

| Recurso | Cuándo | Invalidación |
|---------|--------|--------------|
| Capa estática (terreno, grid, fondo) | `drawImage` 1×/frame | `setSkin` / `unmount` |
| Scanlines retro | `CanvasPattern` 1× `fillRect`/frame | mismo |
| Glow vehículos/entidades rectangulares | sprite offscreen con `fillRect` + blur **una vez** | mismo |
| Glow entidades **redondas** (rana, orb, etc.) | sprite offscreen con **`ellipse`**, no `fillRect` | mismo |

**API mínima:**

```ts
class {Game}RenderCache {
  ensure(ctx, skinId, tokens): void  // rebuild si skinId cambió
  invalidate(): void
  blitStaticLayer(ctx): void
  drawScanlines(ctx): void
  drawEntityGlow(ctx, ...): boolean   // false → fallback draw inline
}
```

**Trampas visuales:**

- Cachear glow con `fillRect` en formas elípticas → se ve **cuadrado**. Usar la misma primitiva que el draw original (`ellipse`, `arc`, etc.).
- Comparar capturas classic/retro/neon antes de cerrar; ajustar alpha/borde, no apagar el glow.

**Archivos típicos:** `render.ts`, `render-cache.ts`, `engine.ts` (`createRenderCache`, invalidar en `setSkin`/`unmount`).

---

## Capa 3 — Controles táctiles (plataforma, SPEC 10)

**Problema:** Lag al pulsar D-pad en móvil aunque el canvas vaya fluido. Tres causas medidas en Frogger:

1. **React:** `useState` en `VirtualGameControls` por cada `--pressed` → re-render de 6 botones a 60 FPS del juego.
2. **CSS pressed:** `box-shadow: 0 0 12px` (blur) + `filter: brightness()` en cada toque.
3. **Barra fija:** `backdrop-filter: blur(10px)` en `.av-touch-bar` repintando sobre el CRT animado.

**Patrón (respeta SPEC 10: clase `--pressed`, sin `:active`):**

```tsx
// virtual-game-controls.tsx — refs + classList, sin setState visual
const buttonRefs = useRef<Map<VirtualButton, HTMLButtonElement>>(new Map());
const setPressedVisual = (button, active) => {
  buttonRefs.current.get(button)?.classList.toggle("virtual-controls__btn--pressed", active);
};
```

```css
/* arcade-vault.css — glow neon sin blur en pressed */
.virtual-controls__btn--dpad.virtual-controls__btn--pressed:not(:disabled) {
  border-color: #66ffff;
  box-shadow:
    0 0 0 2px rgba(0, 245, 255, 0.55),
    0 0 0 1px rgba(0, 245, 255, 0.4) inset,
    0 1px 0 rgba(0, 0, 0, 0.45);
}

@media (max-width: 768px) {
  .av-touch-bar { backdrop-filter: none; }
  .virtual-controls__btn { transition: none; contain: layout style paint; }
}
```

**Alcance:** un cambio en `VirtualGameControls` + CSS beneficia **todos** los jugables con barra táctil; no hace falta repetir por juego.

---

## Checklist de regresión (por juego)

- [ ] Teclado: mecánica y puntuación intactas.
- [ ] Móvil ~390px: D-pad responde, sin lag perceptible al pulsar.
- [ ] Pausa / game over / restart / guardar score.
- [ ] Cambio de skin en caliente; caché invalidada.
- [ ] ≥55 FPS @ CPU 4×, classic + retro + neon.

---

## Árbol de archivos (Frogger, referencia)

```
lib/games/frogger/
  types.ts              # HudState + hudEquals
  render-cache.ts       # FroggerRenderCache
  render.ts             # renderWorld(..., cache)
  engine.ts             # cache lifecycle
components/games/
  frogger-player.tsx    # hud unificado
components/
  virtual-game-controls.tsx   # pressed vía DOM (plataforma)
app/arcade-vault.css          # touch bar + pressed sin blur
references/frogger/
  performance-baseline.md
```

---

## Qué NO centralizar aún

- Un `RenderCache` genérico para todos los engines (cada juego tiene primitivas distintas).
- Overlay FPS en producción.
- Cambiar mecánica (p. ej. duración del hop) disfrazado de “performance”.

Para el siguiente juego: copiar **protocolo + checklist**, reimplementar cache/HUD **en su carpeta** y reutilizar **capa 3** tal cual.
