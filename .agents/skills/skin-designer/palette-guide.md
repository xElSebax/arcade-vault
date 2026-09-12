# Reference — skin palettes for `@skin-designer`

Read this file in Phase 3 when defining `lib/games/{slug}/skins.ts`. Also read `dark-mode-checklist.md` before marking skins as `completo`.

## The three skins

Every playable game must expose exactly these skins. **classic** is the default.

| Skin ID | Label UI | Role | Visual direction |
|---------|----------|------|------------------|
| `classic` | CLÁSICO | Default | Faithful to the original arcade look — use the game's **current** hardcoded colors as baseline |
| `retro` | RETRO | CRT / phosphor | Limited palette (amber, green phosphor, soft white), low glare, subtle grid |
| `neon` | NEÓN | Arcade Vault brand | Site tokens from `app/arcade-vault.css`: `--cyan`, `--magenta`, `--yellow`, `--green`; optional canvas glow |

All three skins are designed for **dark canvas backgrounds** (`#000`–`#0a0a12`), not light mode.

## Brand tokens (neon skin)

Map from CSS variables to hex for canvas use:

| Token | CSS var | Hex |
|-------|---------|-----|
| Cyan | `--cyan` | `#00f5ff` |
| Magenta | `--magenta` | `#ff006e` |
| Yellow | `--yellow` | `#f5ff00` |
| Green | `--green` | `#00ff88` |
| Background (site) | `--bg` | `#0a0a0f` |

Neon skin: high saturation on black; use `shadowBlur` on vector strokes where it reads well (avoid perf issues on dense particles).

## Retro skin palette (shared defaults)

Use as starting point; tune per game for contrast:

| Role | Hex | Notes |
|------|-----|-------|
| Background | `#050508` | Near black |
| Grid | `#1a1a22` | Very subtle |
| Primary (phosphor green) | `#33ff66` | Snake, ships, primary entities |
| Secondary (amber) | `#ffb000` | Accents, power-ups |
| Muted | `#8a8a70` | Asteroids, secondary lines |
| Highlight | `#ccffaa` | Head, bullets |

## Classic skin rule

**Do not invent new classic colors.** Read the engine and entities; extract existing `fillStyle` / `strokeStyle` / `COLORS` into the classic token set. That preserves today's look as default.

## Per-game token shapes (suggested)

Adapt names to the game; export a record keyed by `GameSkinId`.

### Vector games (e.g. asteroids)

`background`, `ship`, `shipThrust`, `asteroid`, `bullet`, `powerUp`, `particle`

### Grid + palette (e.g. tetris)

`background`, `grid`, `colors` (piece array 1–8), `ghostAlpha`

### Grid + sprites (e.g. snake)

`background`, `grid`, `body`, `head`, `headOutline` — fruits keep sprite atlas; optional per-skin tint only if needed

### Spritesheet (e.g. arkanoid)

`background`, `canvasFilter` or per-`BlockColor` tint map — classic = no filter; retro/neon = `ctx.filter` or composite tint at draw time

## File layout

```
lib/games/skins/types.ts          # GameSkinId, DEFAULT_GAME_SKIN, shared types (once)
lib/games/{slug}/skins.ts         # SKINS record for this game only
lib/player-skin.ts                # localStorage av_game_skin_{gameId} (once)
components/game-skin-selector.tsx # HUD selector (once)
```

## Anti-patterns

- Two skins that differ only in label but look identical
- Retro/neon with mid-gray entities on `#222` grid (invisible on CRT)
- Light canvas backgrounds (out of scope for Arcade Vault player)
- Changing gameplay or hitboxes when swapping skins
