/**
 * CLI: generate kid sprite sheets from base template + palette → PNG strips.
 * Usage: node tools/sprites/generate.mjs
 */
import fs from "fs";
import path from "path";

const OUT = path.resolve("apps/og-remaster/assets/sprites");
const CONTENT = path.resolve("content/og/characters.json");

// Create output directory
fs.mkdirSync(OUT, { recursive: true });

// Load character data
const characters = JSON.parse(fs.readFileSync(CONTENT, "utf8"));

// Simple procedural sprite generation (placeholder implementation)
// In a real implementation, this would use canvas or sharp to generate actual sprites
function generateSpriteData(kid) {
  const palette = characters.palettes[kid.palette];
  const sprites = [];
  
  // Generate batting animation frames
  for (let frame = 0; frame < 6; frame++) {
    sprites.push({
      name: `${kid.name}_bat_${frame}`,
      width: 32,
      height: 32,
      data: generateFrameData(kid, 'batting', frame, palette)
    });
  }
  
  // Generate pitching animation frames  
  for (let frame = 0; frame < 8; frame++) {
    sprites.push({
      name: `${kid.name}_pitch_${frame}`,
      width: 32,
      height: 32,
      data: generateFrameData(kid, 'pitching', frame, palette)
    });
  }
  
  // Generate fielding animation frames
  for (let frame = 0; frame < 4; frame++) {
    sprites.push({
      name: `${kid.name}_field_${frame}`,
      width: 32,
      height: 32,
      data: generateFrameData(kid, 'fielding', frame, palette)
    });
  }
  
  // Generate running animation frames
  for (let frame = 0; frame < 4; frame++) {
    sprites.push({
      name: `${kid.name}_run_${frame}`,
      width: 32,
      height: 32,
      data: generateFrameData(kid, 'running', frame, palette)
    });
  }
  
  return sprites;
}

function generateFrameData(kid, animation, frame, palette) {
  // This is a placeholder that would be replaced with actual sprite generation
  // For now, return metadata that the Canvas renderer can use
  return {
    character: kid.name,
    animation: animation,
    frame: frame,
    colors: palette,
    stats: {
      speed: kid.speed,
      contact: kid.contact,
      power: kid.power,
      arm: kid.arm,
      fielding: kid.fielding
    }
  };
}

// Generate sprite data for all kids
console.log("🎨 Generating Blaze Intelligence OG Character Sprites...");

const allSprites = {};
const manifest = {
  version: "1.0.0",
  generated: new Date().toISOString(),
  characters: {},
  palettes: characters.palettes,
  teams: characters.teams,
  animations: characters.animations
};

characters.kids.forEach(kid => {
  console.log(`  → Generating sprites for ${kid.name} (${kid.nickname})`);
  
  const sprites = generateSpriteData(kid);
  allSprites[kid.name] = sprites;
  
  manifest.characters[kid.name] = {
    ...kid,
    spriteCount: sprites.length,
    spriteNames: sprites.map(s => s.name)
  };
});

// Write sprite manifest
const manifestPath = path.join(OUT, "manifest.json");
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

// Write individual character sprite data
characters.kids.forEach(kid => {
  const spritePath = path.join(OUT, `${kid.name.toLowerCase()}.json`);
  fs.writeFileSync(spritePath, JSON.stringify(allSprites[kid.name], null, 2));
});

// Generate simple placeholder PNGs (16x16 colored squares for now)
// In production, this would generate actual sprite sheets
characters.kids.forEach(kid => {
  const palette = characters.palettes[kid.palette];
  
  // Create a simple "sprite sheet" representation as JSON
  // The actual Canvas renderer will draw these programmatically
  const spriteSheet = {
    name: kid.name,
    width: 128, // 4 frames * 32px
    height: 128, // 4 animations * 32px
    frames: {
      batting: { x: 0, y: 0, frames: 6, width: 32, height: 32 },
      pitching: { x: 0, y: 32, frames: 8, width: 32, height: 32 },
      fielding: { x: 0, y: 64, frames: 4, width: 32, height: 32 },
      running: { x: 0, y: 96, frames: 4, width: 32, height: 32 }
    },
    palette: palette,
    kid: kid
  };
  
  const sheetPath = path.join(OUT, `${kid.name.toLowerCase()}-sheet.json`);
  fs.writeFileSync(sheetPath, JSON.stringify(spriteSheet, null, 2));
});

console.log("✅ Sprite generation complete!");
console.log(`   📁 Output: ${OUT}`);
console.log(`   📊 Characters: ${characters.kids.length}`);
console.log(`   🎭 Animations: ${Object.keys(characters.animations).length}`);
console.log(`   🎨 Palettes: ${Object.keys(characters.palettes).length}`);
console.log(`   ⚾ Teams: ${characters.teams.length}`);

// Generate CSS for dynamic character colors
const cssPath = path.join(OUT, "characters.css");
let css = `/* Generated Character Color Tokens */\n\n`;

Object.entries(characters.palettes).forEach(([name, palette]) => {
  css += `:root {\n`;
  css += `  --character-${name}-primary: ${palette.primary};\n`;
  css += `  --character-${name}-secondary: ${palette.secondary};\n`;
  css += `  --character-${name}-accent: ${palette.accent};\n`;
  css += `}\n\n`;
});

css += `/* Character-specific classes */\n`;
characters.kids.forEach(kid => {
  css += `.character-${kid.name.toLowerCase()} {\n`;
  css += `  --primary: var(--character-${kid.palette}-primary);\n`;
  css += `  --secondary: var(--character-${kid.palette}-secondary);\n`;
  css += `  --accent: var(--character-${kid.palette}-accent);\n`;
  css += `}\n\n`;
});

fs.writeFileSync(cssPath, css);

console.log(`   🎨 CSS tokens: ${cssPath}`);
console.log("");
console.log("🏆 Ready for Championship Baseball! 🏆");