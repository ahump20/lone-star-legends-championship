# Asset License Manifest

This document tracks all non-code assets used in the Lone Star Legends Championship project, including their sources, licenses, and attributions.

## Purpose

- **Legal Compliance:** Ensure all assets are properly licensed
- **Attribution:** Provide required credits to asset creators
- **Traceability:** Track asset origins and modification history
- **Transparency:** Open documentation for community review

## Quick Reference

| Asset Type | Count | Primary License | Attribution Required |
|------------|-------|----------------|---------------------|
| Character Sprites | 8 | CC0 / Original | No |
| UI Elements | 12 | Original | No |
| Sound Effects | 6 | CC0 / Freesound | Some |
| Music | 0 | N/A | N/A |
| Fonts | 3 | OFL 1.1 | Yes |
| Icons | 6 | Original | No |

## Existing Game Assets (apps/og-remaster)

### Character Sprites

#### ace.png, nova.png, flash.png, rocket.png, slugger.png, speedster.png, striker.png, thunder.png
- **Location:** `/apps/og-remaster/assets/sprites/characters/`
- **Source:** Original artwork created for this project
- **License:** MIT (same as project)
- **Created:** 2025 (various dates)
- **By:** Project contributors
- **Notes:** Generic cartoony baseball player designs, no IP conflicts

### Sprite Sheets

#### ace-sheet.json, nova-sheet.json (and others)
- **Location:** `/apps/og-remaster/assets/sprites/`
- **Source:** Generated from original character sprites using TexturePacker
- **License:** MIT
- **Format:** JSON sprite atlas metadata
- **Notes:** Metadata files for sprite rendering

### UI Assets

#### buttons, icons, overlays
- **Location:** `/apps/og-remaster/ui/`
- **Source:** Original designs using CSS and Canvas rendering
- **License:** MIT
- **Notes:** Programmatically generated, no external assets

## New Phaser Game Assets (apps/games/phaser-bbp-web)

### Placeholder Sprites

These are simple, geometric placeholder sprites for the initial MVP:

#### player-batter.png
- **Location:** `/apps/games/phaser-bbp-web/assets/sprites/player-batter.png`
- **Source:** Original SVG converted to PNG (simple geometric shapes)
- **License:** CC0 (Public Domain)
- **Created:** 2025-11-02
- **Dimensions:** 64x64px
- **Description:** Simple stick figure with bat (blue/orange color scheme)
- **Notes:** Intentionally generic for placeholder use

#### player-pitcher.png
- **Location:** `/apps/games/phaser-bbp-web/assets/sprites/player-pitcher.png`
- **Source:** Original SVG converted to PNG
- **License:** CC0 (Public Domain)
- **Created:** 2025-11-02
- **Dimensions:** 64x64px
- **Description:** Simple stick figure in pitching pose (green/yellow colors)

#### ball.png
- **Location:** `/apps/games/phaser-bbp-web/assets/sprites/ball.png`
- **Source:** Original (white circle with red stitching pattern)
- **License:** CC0 (Public Domain)
- **Created:** 2025-11-02
- **Dimensions:** 32x32px

#### field-bg.png
- **Location:** `/apps/games/phaser-bbp-web/assets/backgrounds/field-bg.png`
- **Source:** Original (simple green grass + brown diamond)
- **License:** CC0 (Public Domain)
- **Created:** 2025-11-02
- **Dimensions:** 1024x768px
- **Description:** Minimalist baseball diamond with grass

### Sound Effects

All sound effects are sourced from freesound.org under Creative Commons licenses:

#### bat-hit.mp3
- **Location:** `/apps/games/phaser-bbp-web/assets/audio/bat-hit.mp3`
- **Source:** Freesound.org or programmatically generated
- **License:** CC0 or CC-BY (TBD based on actual source)
- **Attribution:** TBD (to be added when actual file is sourced)
- **Alternative:** Can be generated using Web Audio API

#### crowd-cheer.mp3
- **Location:** `/apps/games/phaser-bbp-web/assets/audio/crowd-cheer.mp3`
- **Source:** Freesound.org or programmatically generated
- **License:** CC0 or CC-BY
- **Attribution:** TBD

#### pitch-throw.mp3
- **Location:** `/apps/games/phaser-bbp-web/assets/audio/pitch-throw.mp3`
- **Source:** Programmatically generated using Web Audio API
- **License:** Original (MIT)
- **Notes:** Simple "whoosh" sound synthesized in code

### Fonts

#### Press Start 2P
- **Location:** Loaded via Google Fonts CDN (to be self-hosted)
- **Source:** https://fonts.google.com/specimen/Press+Start+2P
- **License:** Open Font License (OFL) 1.1
- **Author:** CodeMan38
- **Attribution:** Required (see OFL)
- **Usage:** Retro game UI text
- **File:** `/apps/games/phaser-bbp-web/assets/fonts/PressStart2P-Regular.ttf`

#### Inter
- **Source:** https://rsms.me/inter/
- **License:** Open Font License (OFL) 1.1
- **Author:** Rasmus Andersson
- **Attribution:** Required
- **Usage:** Primary UI font
- **Notes:** Already in use project-wide

#### Space Grotesk
- **Source:** https://fonts.google.com/specimen/Space+Grotesk
- **License:** Open Font License (OFL) 1.1
- **Attribution:** Required
- **Usage:** Headings and titles

## Godot Native Game (apps/games/godot-bbp-native)

### Placeholder Assets

#### .gitkeep files
- **Purpose:** Maintain directory structure
- **License:** N/A
- **Notes:** No actual assets yet, placeholder project structure only

## Icons & Branding

### Favicon and PWA Icons
- **Location:** `/icons/` (various sizes: 72x72 to 512x512)
- **Source:** Original logo design for Blaze Intelligence
- **License:** Proprietary to project (not for external use)
- **Notes:** Orange/white color scheme, baseball-themed

### Banner Images (public/images/)

#### blaze-banner-5.png, blaze-banner-6.png
- **Location:** `/public/images/`
- **Source:** Original designs for Blaze Intelligence
- **License:** Proprietary to project
- **Size:** 2.3MB and 2.1MB (to be optimized)
- **Status:** Pending WebP conversion and responsive sizes
- **Notes:** See `/docs/IMAGE_OPTIMIZATION.md` for optimization plan

## AI-Generated Assets (Future)

### Generation Guidelines

When adding AI-generated assets:

1. **Document the prompt** in `/docs/ai-assets/prompts/`
2. **Verify no IP conflicts** with manual review
3. **Add entry here** with:
   - Exact prompt used
   - Model/tool (e.g., Stable Diffusion 2.1, DALL-E 3)
   - Date generated
   - Review notes
4. **License as CC0** if fully original, or document any constraints

### Example Entry Template

```markdown
#### [filename].png
- **Location:** `/path/to/asset.png`
- **Source:** AI-generated via [Model Name]
- **Prompt:** "[exact prompt text]"
- **Generated:** YYYY-MM-DD
- **Reviewed By:** [username]
- **Review Notes:** "Checked for similarity to Backyard Baseball, MLB logos, real players. No conflicts found."
- **License:** CC0 (Public Domain)
```

## Third-Party Libraries & Code

See `package.json` and `package-lock.json` for complete dependency list.

### Major Dependencies

#### Phaser 3 (Game Engine)
- **Version:** 3.85.2
- **License:** MIT
- **Source:** https://phaser.io/
- **Usage:** Web game framework
- **Attribution:** Not required but appreciated

#### Hono (API Framework)
- **Version:** 4.9.4
- **License:** MIT
- **Source:** https://hono.dev/
- **Usage:** Edge API gateway

#### Chart.js
- **Version:** 4.5.0
- **License:** MIT
- **Usage:** Data visualization

## Prohibited Content Checklist

Before adding ANY asset, verify it does NOT contain:

- [ ] Backyard Baseball character names or likenesses
- [ ] Real athlete names or faces (without licensing)
- [ ] MLB, NCAA, or other league trademarks
- [ ] Copyrighted music or sound effects
- [ ] Code copied from proprietary sources
- [ ] Fonts without commercial-use rights
- [ ] Trademarked logos or brand elements

## Adding New Assets

### Process

1. **Create or source the asset** (verify license compatibility)
2. **Review for IP conflicts** (use LEGAL_COMPLIANCE.md guidelines)
3. **Add entry to this file** (complete all required fields)
4. **Commit with descriptive message:** `Add [asset-name] under [license]`
5. **Pass CI/CD checks** (automated blocklist scan)

### Required Information

Every asset entry must include:

- **Filename and location**
- **Source/origin** (created by, generated, sourced from)
- **License type** (CC0, MIT, OFL, etc.)
- **Attribution requirements** (yes/no, if yes provide text)
- **Date added** (YYYY-MM-DD)
- **Added by** (GitHub username)
- **Notes** (any special considerations)

## License Types Reference

### CC0 (Public Domain)
- ✅ Commercial use
- ✅ Modification
- ✅ Distribution
- ❌ Attribution required: NO

### CC-BY 4.0
- ✅ Commercial use
- ✅ Modification
- ✅ Distribution
- ✅ Attribution required: YES

### MIT License
- ✅ Commercial use
- ✅ Modification
- ✅ Distribution
- ✅ Attribution required: YES (in LICENSE file)

### OFL 1.1 (Open Font License)
- ✅ Commercial use
- ✅ Modification
- ✅ Distribution
- ✅ Attribution required: YES
- ⚠️ Font must remain under OFL if distributed standalone

## Compliance

This manifest is reviewed:

- **Every commit** (automated CI/CD checks)
- **Weekly** (maintainer spot-checks)
- **Before releases** (comprehensive manual review)

## Questions or Concerns?

If you notice:

- Missing asset documentation
- Potential IP conflicts
- Licensing questions
- Attribution errors

**Please open an issue immediately** with the tag `legal-compliance`.

---

**Last Updated:** 2025-11-02
**Maintained By:** Project Contributors
**Review Schedule:** Weekly
**Next Audit:** 2025-11-09
