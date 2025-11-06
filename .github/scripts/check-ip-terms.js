#!/usr/bin/env node

/**
 * IP Terms Blocklist Checker
 *
 * Scans source code and assets for prohibited intellectual property terms
 * to ensure legal compliance and prevent accidental IP infringement.
 *
 * Usage: node .github/scripts/check-ip-terms.js
 * Exit code: 0 if clean, 1 if violations found
 */

import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

// BLOCKLIST: Terms that should NOT appear in code or assets
const BLOCKLIST = {
  // Backyard Baseball specific terms
  characters: [
    'Pablo Sanchez',
    'Pete Wheeler',
    'Stephanie Morgan',
    'Kenny Kawaguchi',
    'Achmed Khan',
    'Angela Delvecchio',
    'Amir Khan',
    'Ernie Steele',
    'Jocinda Smith',
    'Jorge Garcia',
    'Keisha Phillips',
    'Luanne Lui',
    'Mikey Thomas',
    'Sally Dobbs',
    'Tony Delvecchio',
    'Vinnie the Gooch'
  ],

  // Game/franchise names
  franchises: [
    'Backyard Baseball',
    'Backyard Sports',
    'Humongous Entertainment',
    'Atari Interactive',
    'MVP Baseball',
    'MLB The Show',
    'RBI Baseball'
  ],

  // Real athlete names (unless properly licensed)
  athletes: [
    'Mike Trout',
    'Aaron Judge',
    'Shohei Ohtani',
    'Mookie Betts',
    'Fernando Tatis',
    'Ronald Acuna',
    'Bryce Harper',
    'Derek Jeter',
    'Barry Bonds',
    'Ken Griffey'
  ],

  // League/team trademarks
  leagues: [
    'Major League Baseball',
    'MLB',
    'NCAA Baseball',
    'New York Yankees',
    'Boston Red Sox',
    'Los Angeles Dodgers',
    'Chicago Cubs'
    // Add more as needed
  ]
};

// Files/directories to scan
const SCAN_TARGETS = [
  'apps/games/phaser-bbp-web/',
  'apps/games/godot-bbp-native/',
  'assets/',
  'docs/ai-assets/'
];

// Files/directories to exclude
const EXCLUDE_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'assets/third-party',  // Third-party libraries
  '.github/scripts/check-ip-terms.js',  // Don't flag ourselves
  'LEGAL_COMPLIANCE.md',                 // Legal docs can mention terms
  'assets/LICENSES.md',                  // License docs can mention terms
  'docs/ai-assets/prompts-and-guidelines.md',  // Guidelines explain what to avoid
  '.md$'  // Exclude documentation (use with caution)
];

// Flatten blocklist into single array
const allBlockedTerms = [
  ...BLOCKLIST.characters,
  ...BLOCKLIST.franchises,
  ...BLOCKLIST.athletes,
  ...BLOCKLIST.leagues
];

console.log('🔍 IP Terms Blocklist Checker');
console.log('================================\n');

// Get all files to check using git ls-files
let filesToCheck = [];

try {
  const gitFiles = execSync('git ls-files', { encoding: 'utf-8' })
    .split('\n')
    .filter(Boolean);

  // Filter to only scan target directories
  filesToCheck = gitFiles.filter(file => {
    // Check if file is in a target directory
    const inTarget = SCAN_TARGETS.some(target => file.startsWith(target));
    if (!inTarget) return false;

    // Check if file matches exclude pattern
    const excluded = EXCLUDE_PATTERNS.some(pattern => {
      if (pattern.endsWith('$')) {
        // Regex pattern
        return new RegExp(pattern).test(file);
      } else {
        // Simple string match
        return file.includes(pattern);
      }
    });

    return !excluded;
  });
} catch (error) {
  console.error('❌ Error getting git files:', error.message);
  console.log('\n⚠️  Falling back to scanning target directories directly...\n');

  // Fallback: scan directories manually
  // This is simplified; in production you'd use a proper file walker
  SCAN_TARGETS.forEach(target => {
    if (existsSync(target)) {
      try {
        const files = execSync(`find ${target} -type f ! -path '*/node_modules/*' ! -path '*/.git/*'`, {
          encoding: 'utf-8'
        }).split('\n').filter(Boolean);
        filesToCheck.push(...files);
      } catch (e) {
        // Ignore find errors
      }
    }
  });
}

console.log(`Scanning ${filesToCheck.length} files...\n`);

// Track violations
const violations = [];

// Scan each file
filesToCheck.forEach(file => {
  if (!existsSync(file)) return;

  try {
    const content = readFileSync(file, 'utf-8');
    const lowerContent = content.toLowerCase();

    // Check each blocked term
    allBlockedTerms.forEach(term => {
      const lowerTerm = term.toLowerCase();

      if (lowerContent.includes(lowerTerm)) {
        // Find line number
        const lines = content.split('\n');
        const lineNumbers = [];

        lines.forEach((line, index) => {
          if (line.toLowerCase().includes(lowerTerm)) {
            lineNumbers.push(index + 1);
          }
        });

        violations.push({
          file: file,
          term: term,
          lines: lineNumbers
        });
      }
    });
  } catch (error) {
    // Skip binary files or files that can't be read
    if (error.code !== 'EISDIR') {
      console.warn(`⚠️  Could not read ${file}:`, error.message);
    }
  }
});

// Report results
if (violations.length === 0) {
  console.log('✅ No IP violations found!\n');
  console.log('All scanned files are clear of blocked terms.');
  process.exit(0);
} else {
  console.log(`❌ Found ${violations.length} potential IP violations:\n`);

  violations.forEach(({ file, term, lines }) => {
    console.log(`📄 ${file}`);
    console.log(`   Term: "${term}"`);
    console.log(`   Lines: ${lines.join(', ')}`);
    console.log('');
  });

  console.log('═══════════════════════════════════════════════');
  console.log('⚠️  VIOLATIONS DETECTED - BUILD FAILED');
  console.log('═══════════════════════════════════════════════\n');

  console.log('These terms are blocked to prevent IP infringement.');
  console.log('See LEGAL_COMPLIANCE.md for details.\n');

  console.log('To fix:');
  console.log('1. Remove or rename the flagged terms');
  console.log('2. Ensure characters/assets are original');
  console.log('3. Run this check again: node .github/scripts/check-ip-terms.js\n');

  console.log('If this is a false positive (e.g., in documentation):');
  console.log('1. Update EXCLUDE_PATTERNS in this script');
  console.log('2. Add comment explaining why exclusion is safe\n');

  process.exit(1);
}
