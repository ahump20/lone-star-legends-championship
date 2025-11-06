# Icons Directory

This directory should contain app icons for the PWA (Progressive Web App) installation.

## Required Icons

For optimal PWA support, create the following icon sizes:

### Standard Icons
- `icon-72x72.png` - 72x72 pixels
- `icon-96x96.png` - 96x96 pixels
- `icon-128x128.png` - 128x128 pixels
- `icon-144x144.png` - 144x144 pixels
- `icon-152x152.png` - 152x152 pixels
- `icon-192x192.png` - 192x192 pixels (maskable)
- `icon-384x384.png` - 384x384 pixels
- `icon-512x512.png` - 512x512 pixels (maskable)

### Apple Touch Icons
- `icon-180x180.png` - For iOS home screen
- `icon-32x32.png` - For favicon

### Shortcut Icons (Required for PWA shortcuts)
- `play-96.png` - 96x96 pixels - Quick Play shortcut icon
- `character-96.png` - 96x96 pixels - Character Creator shortcut icon
- `trophy-96.png` - 96x96 pixels - Tournament shortcut icon

## Design Guidelines

### Icon Design
- **Style**: Simple, recognizable baseball theme
- **Colors**: Use brand colors (Orange #FF6B35, Blue #1e3c72, Gold #FFD700)
- **Elements**: Baseball, bat, glove, or field diamond
- **Background**: Solid color or simple gradient
- **Maskable**: For 192x192 and 512x512, keep important elements in safe zone (80% center)

### Sample Icon Concept
```
[Baseball icon with bat and glove]
- Baseball (white with red stitching)
- Crossed bat and glove
- Orange/blue gradient background
- "SS" or "⚾" text overlay
```

## Creating Icons

### Option 1: Design Tool (Recommended)
1. Create a 1024x1024 base design in Figma, Adobe Illustrator, or Inkscape
2. Export at required sizes
3. Optimize with tools like ImageOptim or TinyPNG

### Option 2: AI Generation
Use tools like:
- DALL-E, Midjourney, or Stable Diffusion
- Prompt: "Simple app icon for baseball game, minimalist, orange and blue colors, baseball and bat"
- Generate 1024x1024, then resize

### Option 3: Icon Generator Services
- [https://realfavicongenerator.net/](https://realfavicongenerator.net/)
- [https://www.pwabuilder.com/](https://www.pwabuilder.com/)
- Upload a single 512x512 icon and generate all sizes

## Placeholder Icons

Until custom icons are created, you can use:
- Simple colored squares with "SS" text
- Unicode baseball emoji (⚾) as PNG
- Generic baseball clipart (public domain)

## Testing

After adding icons:
1. Validate manifest.json with Chrome DevTools (Application > Manifest)
2. Test installation on iOS and Android
3. Verify icons appear correctly on home screen
4. Check maskable icons don't get clipped

## Attribution

If using licensed or AI-generated icons, document here:
- Source:
- License:
- Date created:
- Attribution required:
