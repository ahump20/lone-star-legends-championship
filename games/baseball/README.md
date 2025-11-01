# Sandlot Showdown – Timing-Based Three-Inning Demo

Sandlot Showdown now plays like a true sandlot battle: you command the home-side Roadrunners through a full three-inning game while the CPU manages the visiting Orbiters. Every pitch and swing runs through a timing meter, so you earn contact instead of watching a dice roll.

## Quick Start

1. **Install dependencies** (only required once if you have not previously):
   ```bash
   npm install
   ```
2. **Run the dev server**:
   ```bash
   npm run dev
   ```
3. **Open the demo** at [http://localhost:3000/games/baseball/](http://localhost:3000/games/baseball/) and tap **Start Game**.

This build ships as static assets, so any HTTP server (Vercel preview, Cloudflare Pages, `npx serve`) will work.

## Gameplay Loop

- **Role split** – You pitch and hit for the Roadrunners (bottom halves). The CPU controls every Orbiters plate appearance.
- **Timing meter** – Press space (or click) in the gold band to paint the corner or barrel the ball.
- **Pitch mix** – Choose among Heater, Change, and Hook when you’re on the mound. Command matters: missing wide means free passes.
- **Counts & outs** – Traditional four balls, three strikes logic with foul balls, strikeouts, grounders, and big-time extra-base hits.
- **Fast forward** – Want a broadcast-style sim? Hit **Fast Forward** and let both sides auto-resolve the remaining action instantly.

## Controls

| Action | Keyboard | Pointer |
| --- | --- | --- |
| Start game | `Enter` / click | Click **Start Game** |
| Swing / stop timing meter | `Space` | Click **Swing** / **Release** |
| Select Heater / Change / Hook | `H` / `C` / `K` | Tap the pitch buttons |
| Reset game | `R` | Click **Reset** |
| Fast forward | Click **Fast Forward** | Tap **Fast Forward** |

The timing HUD is fully touch-friendly. The slider loops until you stop it, so mobile taps work without race conditions.

## Presentation

- **Backyard aesthetic** – Dark-mode sandlot with glowing bases, custom team gradients, and bold serif headers.
- **Dynamic lineups** – Live batting-order cards update AVG, RBI, and HR after every plate appearance.
- **Score ribbon** – Animated banner narrates key plays, while the play log keeps the last twelve moments with inning/outs context.
- **Accessible narration** – Critical labels (`aria-live` on state chips, play log, and ribbon) keep screen readers in sync.

## Extending the Build

- **Add more pitch types** – Introduce a slider or knuckleball by tweaking `preparePitch` / `resolveUserPitch` probabilities.
- **New teams** – Duplicate the roster objects in `js/backyard-showdown.js`, then wire a selector into the HTML controls.
- **Persistent seasons** – Feed the stats object into `localStorage` or a backend so repeat games build a record book.
- **Audio & FX** – Hook Web Audio cues inside `resolveUserSwing` and `resolveUserPitch` to deliver crowd pops and strike calls.

The entire experience avoids protected Backyard Baseball IP—names, logos, audio, and likenesses are original. Drop it into a booth, pitch deck, or sales walkthrough without legal risk.
