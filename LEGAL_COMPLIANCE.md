# Legal Compliance & Intellectual Property Policy

## Purpose

This document establishes the legal compliance framework for BlazeSportsIntel (Lone Star Legends Championship) to ensure all game content, assets, and features are original and do not infringe on third-party intellectual property rights.

## Intellectual Property (IP) Policy

### Prohibited Content

**We strictly prohibit the use of:**

1. **Backyard Baseball IP**
   - Character names, likenesses, or distinctive appearances from Backyard Baseball
   - Audio files, music, or sound effects from Backyard Baseball
   - Logos, branding, or trade dress from Atari/Humongous Entertainment
   - Code, algorithms, or proprietary mechanics from Backyard Baseball
   - Fonts specifically associated with Backyard Baseball
   - Stadium designs or unique visual elements

2. **Real-Person Likenesses**
   - Professional athlete names without proper licensing
   - Recognizable likenesses of real individuals
   - Team names, logos, or branding from MLB, NCAA, or other leagues
   - Trademarked uniform designs

3. **Third-Party Assets**
   - Stock assets without proper licensing
   - Code copied from proprietary sources
   - Music or sound effects without clear licensing
   - Fonts without commercial use rights

### Allowed Content

**We permit and encourage:**

1. **Original Creations**
   - Custom-designed characters with unique names and appearances
   - Original artwork created by contributors
   - AI-generated assets with appropriate prompts (see AI Asset Guidelines)
   - Public domain assets (properly verified)

2. **Licensed Assets**
   - Assets from royalty-free libraries (with licenses documented)
   - Creative Commons licensed content (attribution provided)
   - Open-source code (license compliance verified)

3. **Generic Elements**
   - Common baseball mechanics and rules (not proprietary)
   - Generic 2D/3D art styles (cartoony, pixel art, etc.)
   - Standard UI patterns and conventions
   - Generic sound effects (bat hit, crowd cheer, etc.)

## Asset Creation Guidelines

### Character Design

**DO:**
- Create unique, original character designs
- Use generic descriptive names (e.g., "Ace", "Nova", "Flash")
- Develop distinct color palettes
- Design simple, cartoony styles without copying specific IPs

**DON'T:**
- Copy character designs from Backyard Baseball or other games
- Use real athlete names or likenesses without licensing
- Replicate distinctive character traits from copyrighted characters

### AI-Generated Assets

When using AI tools to generate assets:

**Prompt Guidelines:**
```
✅ GOOD: "Original kid-friendly cartoony baseball player character,
         simple design, bright colors, generic 1990s/2000s aesthetic"

❌ BAD:  "Character like Pablo Sanchez from Backyard Baseball"
❌ BAD:  "Create Mike Trout baseball card"
```

**Requirements:**
1. Use generic style descriptions only
2. Avoid mentioning specific games, characters, or franchises
3. Review output for inadvertent similarities
4. Document the prompt used (see `docs/ai-assets/`)
5. Verify no recognizable IP elements appear in output

### Audio Assets

**DO:**
- Use royalty-free sound libraries (freesound.org, etc.)
- Generate synthetic sound effects
- Create original commentary scripts
- Use generic music styles (8-bit, chiptune, etc.)

**DON'T:**
- Extract audio from Backyard Baseball or other games
- Use copyrighted music without licensing
- Copy distinctive audio signatures

## Asset Manifest & Licensing

All project assets must be documented in `/assets/LICENSES.md` with:

1. **Asset filename and location**
2. **Source/origin** (created by, generated with, sourced from)
3. **License type** (MIT, CC0, CC-BY, etc.)
4. **Attribution requirements** (if any)
5. **Date added**
6. **Added by** (contributor name/username)

### Example Entry

```markdown
## Character Sprites

### ace-sprite.png
- **Location:** `/apps/games/phaser-bbp-web/assets/characters/ace-sprite.png`
- **Source:** AI-generated via Stable Diffusion 2.1
- **Prompt:** "Original cartoony baseball player character, kid-friendly, simple design"
- **License:** CC0 (Public Domain)
- **Created:** 2025-11-02
- **By:** developer-username
- **Notes:** Reviewed for IP conflicts, no recognizable elements
```

## Verification Process

### Pre-Commit Checklist

Before committing new assets:

- [ ] Asset is original or properly licensed
- [ ] License documented in `/assets/LICENSES.md`
- [ ] No recognizable third-party IP elements
- [ ] AI prompt (if applicable) uses generic descriptions only
- [ ] Visual review completed for similarity to existing IP
- [ ] Attribution provided (if required by license)

### Automated Checks

Our CI/CD pipeline includes an automated blocklist check (`.github/scripts/check-ip-terms.js`) that scans for:

- Disallowed character names
- Trademarked terms
- Copyrighted franchise references
- Real athlete names without licensing

**Current Blocklist:**
```javascript
[
  // Backyard Baseball specific
  'Pablo Sanchez', 'Pete Wheeler', 'Stephanie Morgan',
  'Kenny Kawaguchi', 'Achmed Khan', 'Backyard Baseball',

  // Generic protected terms
  'MLB', 'Major League Baseball', 'Yankees', 'Red Sox',

  // Real athletes (unless specifically licensed)
  'Mike Trout', 'Aaron Judge', 'Shohei Ohtani'
]
```

### Manual Review

High-risk assets require manual review:

1. **Character designs:** Visual comparison with existing IP
2. **Audio assets:** Waveform and spectral analysis
3. **Code patterns:** Similarity detection tools
4. **UI/UX:** Layout comparison with potential IP sources

## License Compliance

### Open Source Software

All code dependencies must:

1. Have compatible licenses (MIT, Apache 2.0, BSD, etc.)
2. Be listed in `package.json` with version tracking
3. Include LICENSE files in `node_modules/` (auto-managed)
4. Comply with attribution requirements

### Asset Licenses

Accepted asset licenses:

- **CC0 (Public Domain):** No attribution required, unlimited use
- **CC-BY 4.0:** Attribution required, commercial use allowed
- **MIT/Apache 2.0:** For code/software assets
- **Royalty-Free:** Purchased or free with commercial use rights

**NOT accepted without explicit approval:**

- CC-BY-NC (Non-Commercial)
- CC-BY-SA (Share-Alike, may require derivative work to be open-sourced)
- GPL (for non-code assets)

## Liability & Indemnification

### Contributor Responsibility

By contributing assets to this project, contributors certify that:

1. They own the rights to the contributed asset, OR
2. The asset is properly licensed for our use, AND
3. The asset does not infringe on third-party IP rights

### Project Responsibility

The project maintainers will:

1. Review all asset submissions for IP compliance
2. Maintain accurate license documentation
3. Remove infringing content if discovered
4. Respond to takedown requests within 48 hours

### Takedown Procedure

If you believe content in this project infringes your IP:

1. **Email:** [legal@blaze-intelligence.com] (or open a GitHub issue)
2. **Provide:**
   - Your contact information
   - Description of the copyrighted work
   - Location of infringing content in our repository
   - Good faith statement of unauthorized use
3. **Timeline:** We will respond within 48 hours and remove content within 7 days if valid

## Risk Mitigation

### High-Risk Areas

1. **Character Designs:** Most likely to inadvertently resemble existing IP
2. **UI Layouts:** Distinctive UI patterns may be trademarked
3. **Audio:** Copyrighted music or sound effects
4. **Names:** Trademarked names or real-person rights

### Mitigation Strategies

1. **Diverse Reference Pool:** Don't reference a single game/IP
2. **Generic Styling:** Use common artistic conventions
3. **Legal Review:** External counsel for high-profile releases
4. **Community Feedback:** Open-source review helps catch issues
5. **Insurance:** Consider E&O insurance for commercial releases

## Training & Education

### For Contributors

**Before contributing, review:**

1. This LEGAL_COMPLIANCE.md document
2. `/docs/ai-assets/prompts-and-guidelines.md`
3. `/assets/LICENSES.md` for examples

**Recommended Resources:**

- [Creative Commons License Chooser](https://creativecommons.org/choose/)
- [Copyright Basics (US Copyright Office)](https://www.copyright.gov/circs/circ01.pdf)
- [Fair Use Guidelines](https://www.copyright.gov/fair-use/)

### For Maintainers

**Required:**

1. Quarterly review of `/assets/LICENSES.md` for completeness
2. Annual legal compliance audit
3. Stay current on relevant IP law changes

## Updates to This Policy

This policy will be reviewed and updated:

- Annually (minimum)
- When adding new asset types
- In response to legal developments
- After any IP-related incidents

**Last Updated:** 2025-11-02
**Next Review:** 2026-11-02
**Policy Owner:** Project Maintainers
**Version:** 1.0

## Questions?

If you're unsure whether an asset is compliant:

1. **Ask first** - Open a discussion issue on GitHub
2. **Err on the side of caution** - Don't commit if uncertain
3. **Seek legal advice** - For complex questions
4. **Document your rationale** - In the asset manifest

---

**Remember:** When in doubt, create something original! It's always safer and often better than using questionable third-party content.
