#!/usr/bin/env node

/**
 * /enigma - Champion Enigma pulse check
 * Hits live-score API and renders single-line badge
 */

import fs from 'fs';

const PROD_URL = 'https://3eca9ea9.blaze-intelligence-lsl.pages.dev';
const PULSE_DIR = './dist/.pulse';

async function main() {
    console.log('STATUS:');
    console.log('🏆 Checking Champion Enigma pulse...');
    
    try {
        const response = await fetch(`${PROD_URL}/api/champion-enigma/live-score`);
        
        if (!response.ok) {
            throw new Error(`API returned ${response.status}`);
        }
        
        const data = await response.json();
        const score = data.score || data.enigma_score || '--';
        const timestamp = new Date().toISOString();
        
        // Create pulse badge
        const badge = `🏆 Champion Enigma: ${score}/100 (${new Date().toLocaleTimeString()})`;
        
        // Cache to pulse directory
        if (!fs.existsSync(PULSE_DIR)) {
            fs.mkdirSync(PULSE_DIR, { recursive: true });
        }
        fs.writeFileSync(`${PULSE_DIR}/enigma.md`, `# Champion Enigma Status\n\n${badge}\n\nLast Updated: ${timestamp}\n`);
        
        console.log('\nMETRICS:');
        console.log(`Enigma Score: ${score}/100`);
        console.log(`API Response: ${response.status}`);
        console.log(`Cache Updated: ${timestamp}`);
        
        console.log('\nNEXT:');
        console.log(badge);
        console.log('• Badge cached to dist/.pulse/enigma.md');
        console.log('• Run /readiness for Cardinals team status');
        
    } catch (error) {
        console.error('❌ Enigma pulse failed:', error.message);
        console.log('\nNEXT:');
        console.log('• Check Champion Enigma API deployment');
        console.log('• Verify worker configuration');
        process.exit(1);
    }
}

main().catch(console.error);