/**
 * Build script for Backyard Baseball Demo
 * Bundles TypeScript files into a single JavaScript file
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('⚾ Building Backyard Baseball Demo...');

// Read the roster data
const rosterData = fs.readFileSync(path.join(__dirname, '../../data/backyard-roster.json'), 'utf-8');

// Create an inline bundle
const bundle = `
// Roster Data
const rosterData = ${rosterData};

${fs.readFileSync(path.join(__dirname, '../../packages/rules/gameState.ts'), 'utf-8').replace('export ', '')}

${fs.readFileSync(path.join(__dirname, 'data/TeamBuilder.ts'), 'utf-8')
  .replace(/import.*from.*\n/g, '')
  .replace(/export /g, '')}

${fs.readFileSync(path.join(__dirname, 'input/InputManager.ts'), 'utf-8').replace(/export /g, '')}

${fs.readFileSync(path.join(__dirname, 'demo.ts'), 'utf-8')
  .replace(/import.*from.*\n/g, '')
  .replace(/export /g, '')}
`;

// Write the bundle
fs.writeFileSync(path.join(__dirname, 'demo.bundle.js'), bundle);

console.log('✅ Demo built successfully!');
console.log('   Open apps/og-remaster/demo.html in a browser to play');
