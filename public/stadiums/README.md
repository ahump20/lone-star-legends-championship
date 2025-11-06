# Historic Stadium Recreations

## Overview

This directory contains hyperrealistic 3D recreations of iconic baseball stadiums using Babylon.js and WebGPU rendering technology. Each stadium is meticulously crafted to match historical dimensions, architectural features, and visual aesthetics.

## Current Stadiums

### Busch Stadium II (1966-2005)
**File:** `busch-stadium-ii.html`

A faithful recreation of the St. Louis Cardinals' former home, the circular "cookie-cutter" multi-purpose stadium in downtown St. Louis.

#### Key Features:
- **Architecture:** Circular bowl design typical of 1960s-70s multi-purpose stadiums
- **Capacity:** 50,345
- **Dimensions:** Symmetrical outfield (330'-414'-330')
- **Surface:** Artificial turf (bright green, period-accurate)
- **Distinctive Elements:**
  - Cardinals red seats throughout the bowl
  - Three-deck seating structure (lower deck, club level, upper deck)
  - Concrete brutalist exterior
  - Four stadium lighting towers
  - Center field scoreboard with LED panels
  - Yellow foul poles
  - Dark blue outfield wall padding

## Technical Specifications

### Rendering Engine
- **Primary:** Babylon.js with WebGPU support
- **Fallback:** WebGL2 for broader compatibility
- **Performance Target:** <2 seconds load time on mobile devices

### Scale & Dimensions
- **Scale:** 1:1 (1 Babylon.js unit = 1 foot)
- **Field Dimensions:** Accurate to historical records
- **Stadium Structure:** Proportionally accurate to archival photos and blueprints

### Features
- Real-time dynamic lighting (hemispheric ambient + directional sunlight)
- Advanced shadow mapping (2048px resolution with exponential blur)
- Atmospheric fog for depth and realism
- Interactive arc-rotate camera with zoom/pan controls
- Mobile touch controls enabled
- CSG (Constructive Solid Geometry) for hollow stadium structure

### Materials
All materials use physically-based rendering properties:
- **Concrete:** Gray diffuse with low specular
- **Seats:** Cardinals red (#c41e3a) with appropriate ambient
- **Turf:** Bright artificial green (1980s-2000s era)
- **Dirt:** Brownish-tan infield material
- **Warning Track:** Lighter brown earthtone
- **Wall Padding:** Dark blue with minimal specular
- **Foul Poles:** Bright yellow with emissive glow

## Performance Optimization

### Geometry
- Optimized tessellation values for smooth curves without excess polygons
- LOD (Level of Detail) considerations for distant objects
- Efficient mesh instancing for repeated elements (seats, roof supports)

### Rendering
- Shadow map resolution balanced for quality vs. performance
- Fog reduces far-plane render distance requirements
- Smart material reuse across similar objects

### Mobile Optimization
- Touch action controls disabled on canvas for smooth panning
- Responsive canvas sizing
- Efficient render loop with automatic FPS monitoring

## Camera Controls

- **Rotate:** Left-click + drag (desktop) or single-finger drag (mobile)
- **Zoom:** Mouse wheel (desktop) or pinch (mobile)
- **Pan:** Right-click + drag (desktop) or two-finger drag (mobile)

### Camera Constraints
- **Radius:** 200-800 units (prevents too-close or too-far views)
- **Beta (vertical):** 0.1 to π/2.1 (prevents going below ground or straight overhead)
- **Precision:** Optimized for smooth, controlled movement

## Customization Guide

### Adjusting Camera Position
Edit lines 37-41 in `busch-stadium-ii.html`:
```javascript
const camera = new BABYLON.ArcRotateCamera(
    "camera",
    -Math.PI / 2,      // Alpha (horizontal angle)
    Math.PI / 3,       // Beta (vertical angle)
    450,               // Radius (distance from target)
    new BABYLON.Vector3(0, 0, 0),  // Target point
    scene
);
```

### Modifying Fog Intensity
Edit line 460 in `busch-stadium-ii.html`:
```javascript
scene.fogDensity = 0.0003;  // Lower = less fog, higher = more fog
```

### Changing Time of Day
Adjust sunlight direction (line 58-62):
```javascript
const sunLight = new BABYLON.DirectionalLight(
    "sun",
    new BABYLON.Vector3(-0.5, -1, 0.3),  // Direction vector
    scene
);
sunLight.intensity = 0.8;  // 0.0-1.0 (brightness)
```

## Deployment

### Local Testing
```bash
# Serve locally with any HTTP server
npx http-server public/stadiums -p 8080 -o
```

### Cloudflare Pages
The stadiums are automatically deployed to Cloudflare Pages as part of the main site deployment:

```bash
# Deploy entire site (includes stadiums)
npm run deploy
```

**Live URLs:**
- Index: `https://[your-domain]/stadiums/`
- Busch Stadium II: `https://[your-domain]/stadiums/busch-stadium-ii.html`

## Browser Compatibility

- **Chrome/Edge:** Full WebGPU support (recommended)
- **Firefox:** WebGL2 fallback
- **Safari:** WebGL2 fallback
- **Mobile Chrome/Safari:** Optimized WebGL2 with touch controls

**Minimum Requirements:**
- WebGL2 support
- JavaScript enabled
- Modern browser (released within last 2 years)

## Performance Metrics

Based on testing:
- **Load Time:** <2 seconds on 4G mobile
- **Target FPS:** 60 FPS on desktop, 30+ FPS on mobile
- **Asset Size:** ~15KB HTML + ~450KB Babylon.js CDN
- **Mesh Count:** ~100-150 active meshes (varies by camera view)

## Future Additions

Potential historic stadiums to recreate:
- Ebbets Field (Brooklyn Dodgers)
- Polo Grounds (New York Giants)
- Forbes Field (Pittsburgh Pirates)
- Sportsman's Park (St. Louis Cardinals/Browns)
- Tiger Stadium (Detroit Tigers)
- County Stadium (Milwaukee Braves)

## Credits

**Development:** Blaze Intelligence
**Technology:** Babylon.js, WebGPU, WebGL2
**Hosting:** Cloudflare Pages
**Project:** Lone Star Legends Championship

## License

MIT License - Part of the Lone Star Legends Championship project

## Support

For issues, questions, or contributions, please visit:
https://github.com/ahump20/lone-star-legends-championship/issues
