# Reference — dark mode checklist for game skins

Arcade Vault is **dark-first**. The CRT shell (`.crt-screen`) uses a black canvas area. Every skin must pass this checklist before `game-with-themes.md` marks a skin as `completo`.

## Environment

- Verify in `/play/{slug}` with the site default theme (no light-mode toggle).
- Canvas background target: `#000000` to `#0a0a12`.
- HUD outside canvas uses `app/arcade-vault.css` tokens — skin selector must remain readable.

## Contrast

- [ ] Primary playable entities (ship, snake, paddle, active piece) contrast ≥ **4.5:1** against canvas background (WCAG AA for large graphics).
- [ ] Grid lines stay **subtle** — must not compete with entities (opacity ≤ ~15% of entity luminance).
- [ ] Bullets, fruits, and power-ups distinguishable from background and from grid at a glance.
- [ ] Game-over and pause overlays unchanged in legibility when skin switches mid-session.

## Per skin

### classic

- [ ] Matches pre-skin implementation (visual regression baseline).
- [ ] Default on first visit (`classic` when no `localStorage`).

### retro

- [ ] Limited palette (≤ 4 dominant hues + black).
- [ ] No pure `#ffffff` fills larger than small highlights (phosphor feel).
- [ ] Readable without looking washed out on black.

### neon

- [ ] Uses brand hues (`#00f5ff`, `#ff006e`, `#f5ff00`, `#00ff88`) intentionally — not random saturated colors.
- [ ] Glow effects optional; must not blur gameplay readability or drop FPS noticeably.

## Interaction

- [ ] Skin selector switches all three skins without remount glitches.
- [ ] Choice persists: `localStorage` key `av_game_skin_{gameId}` survives reload.
- [ ] `setSkin()` or equivalent applies without resetting score mid-game (prefer hot swap on pause menu only if engine requires reset — document in session notes).

## Sign-off

Before Phase 5, mentally answer:

1. Can a new player tell entities apart in each skin within 2 seconds?
2. Would any color-blind user lose track of the snake/tetromino/ball? (avoid red/green-only distinction for critical states)

If any box fails, fix before updating `game-with-themes.md` to `completo`.
