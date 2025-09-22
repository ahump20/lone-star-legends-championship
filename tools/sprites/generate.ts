import fs from "fs";
import path from "path";
import { createCanvas } from "canvas";

/**
 * CLI script to generate placeholder sprite sheets for each kid defined in
 * content/og/characters.json. At present, each kid's spritesheet consists of
 * four colored circles arranged horizontally. You can extend this to load
 * custom SVG or PNG bases and recolor them per palette.
 */
async function main() {
  const data = JSON.parse(
    fs.readFileSync(path.resolve("content/og/characters.json"), "utf8")
  );
  const OUT_DIR = path.resolve("apps/og-remaster/assets/sprites");
  fs.mkdirSync(OUT_DIR, { recursive: true });
  // Extract palettes in the same order as defined in characters.json
  const paletteOrder = data.kids.map((kid: any) => kid.palette);
  const paletteColors = data.palettes;
  for (const kid of data.kids) {
    const canvas = createCanvas(256, 64);
    const ctx = canvas.getContext("2d");
    // Fill background white for clarity
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 256, 64);
    // For each of 4 frames draw a colored circle
    for (let i = 0; i < 4; i++) {
      const paletteName = paletteOrder[i % paletteOrder.length];
      const palette = paletteColors[paletteName];
      ctx.fillStyle = palette.primary ?? "#cccccc";
      ctx.beginPath();
      ctx.arc(32 + i * 64, 32, 20, 0, Math.PI * 2);
      ctx.fill();
    }
    const outPath = path.join(OUT_DIR, `${kid.name}.png`);
    fs.writeFileSync(outPath, canvas.toBuffer("image/png"));
    console.log(`Generated ${outPath}`);
  }
}

main().catch((err) => {
  console.error(err);
});