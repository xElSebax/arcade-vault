# Game Jam — Frogger

> **Fecha:** 2026-09-12
> **Carpeta:** `specs/game-jam/frogger/`
> **Tema / tagline:** cruza la carretera y el río sin convertirte en papilla
> **Modo:** juego nombrado — todas las variantes comparten `id: "frogger"`

## Variantes

| Archivo | Slug catálogo | Género | Hook | Recomendación |
|---------|---------------|--------|------|---------------|
| `01-frogger-classic.md` | `frogger` | ARCADE | Frogger clásico por niveles: carretera + río + nenúfares + vidas + timer | ⭐ Principal |
| `02-frogger-log-rush.md` | `frogger` | ARCADE | Score attack endless solo río: troncos, combo y supervivencia | Alternativa |

**Recomendación:** variante **01 — Classic**. Cumple el tagline al pie de la letra, encaja con la expectativa del catálogo retro y diversifica ARCADE sin solaparse con Snake.

> **Nota:** Solo **una** variante se implementa bajo `id: "frogger"`. El humano elige el spec a promover; la otra queda como referencia descartada o para un spec futuro con otro `id`.

## Contexto de la sesión

- Engine desde cero (sin prototipo en `references/started-games/`).
- Canvas **480×640**, categoría **ARCADE**, esfuerzo **medio**.
- Nueva entrada de catálogo `frogger` / **FROGGER** con cover `.cover-frogger`.
- Placeholder **`ranaria`** queda intacto en `app/data/games.ts`.
- Promoción prevista: `specs/10-frogger.md` → `Aprobado` → `@spec-impl 10-frogger`.

## Próximos pasos

1. Releer ambos specs fuera del chat.
2. Elegir variante (Classic o Log Rush).
3. Copiar el archivo elegido a `specs/10-frogger.md`.
4. Actualizar header: `# SPEC 10 — FROGGER en Arcade Vault` (añadir número).
5. Cambiar `Estado` a **Aprobado** manualmente.
6. Ejecutar `@spec-impl 10-frogger`.
