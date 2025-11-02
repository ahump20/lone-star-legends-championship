# BlazeSportsIntel Baseball MVP

This document outlines how to build, test, and extend the BlazeSportsIntel original baseball game.

## Prerequisites

- Node.js 20+
- pnpm 8+
- Optional: Godot 4.x for native experimentation

## Build Workflow

```bash
pnpm install
pnpm build:games     # builds Phaser bundle and copies it into apps/web/public/games/bbp-web
pnpm --filter web dev # launch the Next.js front-end locally (http://localhost:3000)
```

The Phaser build is invoked automatically as part of `pnpm build` to ensure Cloudflare Pages receives the latest bundle.

## Local Game Development

```bash
pnpm --filter phaser-bbp-web dev
```

This starts Vite with hot-module replacement for rapid iteration. Assets live under `apps/games/phaser-bbp-web/src/assets` and are intentionally simple to encourage customization.

## Integration Points

- **Next.js route:** `/games/bbp` lazy-loads an iframe pointing to the static bundle (`/games/bbp-web/index.html`).
- **Legal notice:** `/games/bbp/legal` clarifies originality and links to asset manifest.
- **Analytics hook:** `apps/games/phaser-bbp-web/src/systems/analytics.ts` emits session start/end events through `postMessage`, which the Next.js shell forwards to the existing analytics pipeline.

## Replacing Assets

1. Generate or design new sprites/sound effects following the guidance in `docs/ai-assets/prompts-and-guidelines.md`.
2. Drop files into the `assets` directory, update import paths, and record provenance in `assets/LICENSES.md`.
3. Run `pnpm ci:blocklist` to ensure no disallowed IP references exist.

## Future Native Builds

A Godot 4 project lives in `apps/games/godot-bbp-native/`. It contains a menu and placeholder gameplay scene with documented extension points for desktop/mobile builds. Consult the README in that directory before integrating platform-specific SDKs.

## Performance Budgets

The Lighthouse CI workflow enforces:

- LCP ≤ 2.5s on mobile
- CLS ≤ 0.1
- INP classified as “good”
- TTFB ≤ 600ms via edge rendering

Budgets are defined in `lighthouserc.json`. Adjust only after benchmarking and documenting rationale in the project changelog.
