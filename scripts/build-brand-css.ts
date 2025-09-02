import fs from "fs";
import path from "path";

type Hex = string;
type Brand = {
  blazeIntelligence: {
    colorPalette: {
      primary: { texasLegacy: { hex: Hex }, cardinalClarity: { hex: Hex } };
      secondary: { oilerNavy: { hex: Hex }, grizzlyTeal: { hex: Hex } };
      supporting: { platinum: Hex; graphite: Hex; pearl: Hex };
    };
    typography: {
      primary: { family: string };
      secondary: { family: string };
      technical: { family: string };
    };
    experientialElements?: { motion?: { transitions?: string } };
  };
};

const src = path.resolve("brand/bi-brand.json");
const out = path.resolve("apps/og-remaster/brand.css");

const brand: Brand = JSON.parse(fs.readFileSync(src, "utf8"));

const p = brand.blazeIntelligence.colorPalette.primary;
const s = brand.blazeIntelligence.colorPalette.secondary;
const u = brand.blazeIntelligence.colorPalette.supporting;

const trans =
  brand.blazeIntelligence.experientialElements?.motion?.transitions ??
  "cubic-bezier(0.4, 0, 0.2, 1)";

const css = `:root{
  --bi-burnt-orange:${p.texasLegacy.hex};
  --bi-sky-blue:${p.cardinalClarity.hex};
  --bi-navy:${s.oilerNavy.hex};
  --bi-teal:${s.grizzlyTeal.hex};
  --bi-platinum:${u.platinum};
  --bi-graphite:${u.graphite};
  --bi-pearl:${u.pearl};

  --bi-font-primary:"Neue Haas Grotesk Display","Inter","Helvetica Neue",Arial,sans-serif;
  --bi-font-secondary:"Inter","Helvetica Neue",Arial,sans-serif;
  --bi-font-mono:"JetBrains Mono",ui-monospace,Consolas,Monaco,monospace;

  --bi-ease:${trans};

  /* OG mode derived tokens */
  --og-bg: var(--bi-platinum);
  --og-field: #6ab150; /* sandlot green */
  --og-dirt: #c49a6c;
  --og-lines: var(--bi-pearl);
  --og-ui-bg: rgba(0,0,0,0.65);
  --og-ui-accent: var(--bi-burnt-orange);
  --og-ui-text: var(--bi-pearl);
}
`;
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, css);
console.log(`Wrote ${out}`);