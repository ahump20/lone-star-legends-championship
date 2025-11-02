# AI Asset Generation Guidelines

All AI usage must reinforce originality. Use these prompts and guardrails when generating temporary assets for BlazeSportsIntel games.

## Visual Prompts

```
Create an original, kid-friendly, cartoony baseball character lineup in a generic late-90s / early-2000s style. Use bright colors and simple shapes. Avoid real people, professional team logos, or any reference to legacy backyard-era baseball franchises or their characters. Deliver front-facing sprites with transparent backgrounds suitable for animation.
```

```
Design a minimal baseball infield background for a mobile web game. Keep geometry simple, with stylized bases and outfield walls. Avoid using any real stadium markings or logos. Output as vector art or 2048x2048 PNG with transparency.
```

## Audio Prompts

```
Synthesize a cheerful, 8-bit inspired jingle for a baseball game menu. Keep it under 6 seconds. Avoid sampling or mimicking any existing franchise themes. Provide as 16-bit 44.1kHz WAV.
```

## Guardrails

- Never include or request legacy backyard-era baseball character names, likenesses, or quotes.
- Favor vector or layered exports to simplify recoloring and animation.
- Document each generation session: tool/service, prompt, date, and reviewer initials.
- Store raw exports outside of the repo and commit only optimized deliverables.
- Maintain accessibility: high contrast colors, captions or visual cues for critical audio.

## Submission Checklist

- [ ] Attach prompt and provenance notes to pull request.
- [ ] Update `assets/LICENSES.md` with the new asset entry.
- [ ] Run `pnpm ci:blocklist` after adding files.
