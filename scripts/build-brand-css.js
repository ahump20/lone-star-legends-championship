const fs = require("fs");
const path = require("path");

// Read brand specification from JSON
const src = path.resolve("brand/bi-brand.json");
const out = path.resolve("apps/og-remaster/brand.css");
const brand = JSON.parse(fs.readFileSync(src, "utf8"));

const p = brand.blazeIntelligence.colorPalette.primary;
const s = brand.blazeIntelligence.colorPalette.secondary;
const u = brand.blazeIntelligence.colorPalette.supporting;
const trans =
  (brand.blazeIntelligence.experientialElements &&
    brand.blazeIntelligence.experientialElements.motion &&
    brand.blazeIntelligence.experientialElements.motion.transitions) ||
  "cubic-bezier(0.4, 0, 0.2, 1)";

const css = `:root{\n  --bi-burnt-orange:${p.texasLegacy.hex};\n  --bi-sky-blue:${p.cardinalClarity.hex};\n  --bi-navy:${s.oilerNavy.hex};\n  --bi-teal:${s.grizzlyTeal.hex};\n  --bi-platinum:${u.platinum};\n  --bi-graphite:${u.graphite};\n  --bi-pearl:${u.pearl};\n\n  --bi-font-primary:"Neue Haas Grotesk Display","Inter","Helvetica Neue",Arial,sans-serif;\n  --bi-font-secondary:"Inter","Helvetica Neue",Arial,sans-serif;\n  --bi-font-mono:"JetBrains Mono",ui-monospace,Consolas,Monaco,monospace;\n\n  --bi-ease:${trans};\n\n  /* OG mode derived tokens */\n  --og-bg: var(--bi-platinum);\n  --og-field: #6ab150; /* sandlot green */\n  --og-dirt: #c49a6c;\n  --og-lines: var(--bi-pearl);\n  --og-ui-bg: rgba(0,0,0,0.65);\n  --og-ui-accent: var(--bi-burnt-orange);\n  --og-ui-text: var(--bi-pearl);\n}\n`;

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, css);
console.log(`Wrote ${out}`);