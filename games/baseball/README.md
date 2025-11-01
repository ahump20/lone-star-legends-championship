# Sandlot Showdown – Three-Inning Backyard Demo

Sandlot Showdown delivers a fully playable three-inning baseball game starring two all-original neighborhood teams. The presentation nods to classic backyard baseball while steering clear of any protected characters, trademarks, or audio/visual assets from existing franchises.

## Quick Start

1. **Serve the site locally**
   ```bash
   npm install
   npm run dev
   # or use any static server
   ```
2. **Navigate to the demo** – open [`http://localhost:3000/games/baseball/`](http://localhost:3000/games/baseball/) (or your chosen port).
3. **Play ball** – the Orbiters bat automatically; when the Roadrunners come up, ride the timing meter and swing.

## Game Flow

- **Length** – three innings, top and bottom halves. Home team (Roadrunners) walks off when leading in the 3rd.
- **Teams** – Oakdale Orbiters vs. Cactus Gulch Roadrunners. Each squad features 9 custom players with contact, power, speed, discipline, and pitching traits.
- **Top halves (Orbiters)** – CPU-driven plate appearances. Tap **Next Play / Pitch** (or press Space) to advance each matchup.
- **Bottom halves (Roadrunners)** – you control every at-bat. Launch a pitch with **Next Play / Pitch**, then time your swing in the gold zone for solid contact.
- **Scoring** – bases advance automatically with full tracking of runs, hits, RBIs, walks, home runs, and runners left on base.
- **Finish** – ties remain ties after three innings to honor sandlot rules; no extras.

## Controls

| Action | Desktop | Mobile/Tablet |
| --- | --- | --- |
| Start pitch / advance play | `Space` (when meter idle) | Tap **Next Play / Pitch** |
| Swing | `Space` (when meter live) or `J` | Tap **Swing!** |
| Reset game | `R` | Tap **Reset Game** |

> Space handles both duties: when no pitch is live it starts the next offering, and when the pointer glows it unleashes your swing.

## Timing Meter 101

- The gold window represents the hittable zone. Its width adjusts based on batter discipline vs. pitcher command.
- A live pitch lights the teal pointer. Fire the **Swing!** button (or Space/J) when the pointer overlaps the gold for hard contact.
- Perfect timing powers doubles, triples, and backyard bombs. Late or early swings turn into weak contact or fouls.
- Lay off the pitch and you’ll either take a strike or watch ball four force in a run depending on the pitcher’s accuracy.

## UI Highlights

- **Scoreboard** – inning-by-inning table with hits column and color-coded swatches for each club.
- **Lineups** – kid-sized baseball cards on the rails show batting order, emoji badges, and live stat lines. The current batter glows gold.
- **Field & Meter** – stylized sandlot diamond sits above the interactive timing meter so you can track the situation and the next pitch simultaneously.
- **Play Log** – rolling feed of the last twelve moments with tags for hits, outs, walks, and scoring plays.
- **Game Over Modal** – walk-off wins, visiting victories, and ties each surface a tailored message.

## Gameplay Notes

- **CPU swings** still use weighted outcomes built from batter power/contact/speed vs. pitcher skill, so the Orbiters feel alive.
- **Manual swings** factor the Roadrunners’ attributes—better contact widens the sweet spot, elite power turns green bars into souvenirs.
- **Base running** implements forced advancement on walks plus proper scoring on singles through home runs.
- **Accessibility** – aria-live regions announce inning/outs, meter instructions, and big-moment banners for assistive tech.

## File Structure

```
games/baseball/
├── index.html              # Main game surface and UI scaffolding
├── README.md               # This document

css/
└── backyard-showdown.css   # Backyard-inspired visual theme

js/
└── backyard-showdown.js    # Game state machine, timing meter, and logic
```

## Extending the Demo

- **Add more teams** – duplicate a roster block in `js/backyard-showdown.js`, then expose a selector in the HTML.
- **Tune the meter** – adjust pitch duration, target width, or contact weighting in `startUserPitch` and `resolveSwingResult`.
- **Animations & audio** – integrate CSS transitions or Web Audio cues inside `showHighlight` and the timing-meter callbacks.
- **Persist results** – hook into localStorage to track win/loss records or notable performances across play sessions.

Have fun tinkering—this sandlot is safe to share in presentations, product demos, or trade show booths.
