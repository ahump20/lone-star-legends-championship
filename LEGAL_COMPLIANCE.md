# BlazeSportsIntel Original Asset Compliance

BlazeSportsIntel maintains a zero-tolerance policy for unlicensed assets, especially content reminiscent of the Backyard Baseball franchise. All characters, stadiums, sounds, fonts, UI elements, and gameplay logic contained in this repository are original works created for BlazeSportsIntel or permissively licensed placeholders.

## Policy Overview

1. **No legacy IP references** – Do not import, copy, trace, or describe specific Backyard Baseball characters, teams, names, logos, or storylines.
2. **Original characters only** – When commissioning or generating art, require stylized, generic, “kid-friendly, cartoony baseball” visuals that avoid real individuals or trademarks.
3. **Documentation required** – Every new asset must include provenance notes in `assets/LICENSES.md`, pointing to the creation method (hand-authored, AI-generated prompt, etc.) and license terms.
4. **Review before merge** – Run `pnpm ci:blocklist` to ensure no disallowed terms appear in source or assets prior to pull request merge.
5. **Future replacements** – Placeholder assets ship by default. Any upgrades must preserve originality and comply with this policy.

## Asset Intake Checklist

- [ ] Confirm no references to Backyard Baseball or similar proprietary franchises.
- [ ] Store prompts and generation metadata inside `docs/ai-assets/`.
- [ ] Record license, author, and replacement status in `assets/LICENSES.md`.
- [ ] Capture accessibility considerations (alt text, color contrast targets) alongside each asset entry.
- [ ] Ensure exported files are optimized (prefer vector/SVG or AVIF/WebP when raster is required).

## Escalation

If a potential infringement is discovered, immediately remove the asset, notify the legal/compliance contact, and file an incident in the compliance tracker. Resubmit only after a documented review that affirms originality.
