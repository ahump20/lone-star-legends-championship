# Hyperrealistic Busch Stadium II Scene

A production-grade, procedurally-generated Three.js environment that rebuilds Busch Stadium II for BlazeSportsIntel experiences. The scene is authored entirely in TypeScript, optimised for Cloudflare delivery, and integrates live scoreboard overlays plus atmospheric control hooks for data-driven baseball storytelling.

## Highlights

- **Multi-tier seating bowl** with instanced crowd population, club levels, and suite glass.
- **Precision infield geometry** featuring procedural textures for turf, dirt, base paths, and foul territory.
- **Signature skyline** including the Gateway Arch, scoreboard tower, and downtown high-rises.
- **Dynamic lighting rig** with volumetric towers, skylight simulation, and day/night transitions.
- **Data interfaces** to drive scoreboard, lighting, and crowd density directly from BlazeSportsIntel feeds.

## Usage

```ts
import { initializeBuschStadium } from './dist/index.js';

const canvas = document.querySelector('canvas#stadium');
const stadium = initializeBuschStadium(canvas, {
  timeOfDay: 'night',
  scoreboard: {
    awayTeam: 'Visitors',
    homeTeam: 'Cardinals',
    away: { innings: [1, 0, 2], totals: 3 },
    home: { innings: [0, 1, 0], totals: 1 },
    count: { balls: 2, strikes: 2, outs: 1 },
    pitchSpeedMph: 99.1,
    batter: 'S. Musial',
    pitcher: 'B. Gibson',
  },
});
```

Call `stadium.updateOptions()` with new telemetry to update the render without re-instantiating the scene. Use `stadium.destroy()` to dispose WebGL resources.

## Build & Deployment

```bash
npm run build:stadium
# -> Outputs compiled modules and demo shell to public/games/busch-stadium-ii
```

The build script compiles TypeScript, mirrors the demo shell, and places artefacts in `public/games/busch-stadium-ii` for Cloudflare Pages distribution.

## Accessibility & Performance

- Canvas is labelled for assistive technology.
- HUD uses semantic regions and live updates.
- Procedural textures minimise asset weight (<200 KB for core modules).
- Instanced crowd geometry keeps GPU draw calls low while preserving fidelity.

## Next Steps

- Integrate live telemetry pipeline from BlazeSportsIntel edge workers.
- Streamline scoreboard updates via WebSockets.
- Extend crowd agent palette with team-branded accessories.
