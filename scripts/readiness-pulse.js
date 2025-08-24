#!/usr/bin/env node

/**
 * /readiness - Cardinals Readiness pulse check
 * Hits readiness.json and renders single-line badge
 */

import fs from 'fs';

const PROD_URL = 'https://fe5b775f.blaze-intelligence-lsl.pages.dev';
const PULSE_DIR = './dist/.pulse';

async function main() {
    console.log('STATUS:');
    console.log('⚾ Checking Cardinals Readiness pulse...');
    
    try {
        const response = await fetch(`${PROD_URL}/data/analytics/readiness.json`);
        
        if (!response.ok) {
            throw new Error(`Data endpoint returned ${response.status}`);
        }
        
        const data = await response.json();
        const readiness = data.readiness || data.overall_readiness || '--';
        const leverage = data.leverage || data.championship_leverage || '--';
        const timestamp = new Date().toISOString();
        
        // Create pulse badge
        const badge = `⚾ Cardinals Readiness: ${readiness}% | Leverage: ${leverage} (${new Date().toLocaleTimeString()})`;
        
        // Cache to pulse directory
        if (!fs.existsSync(PULSE_DIR)) {
            fs.mkdirSync(PULSE_DIR, { recursive: true });
        }
        fs.writeFileSync(`${PULSE_DIR}/readiness.md`, `# Cardinals Readiness Status\n\n${badge}\n\nLast Updated: ${timestamp}\n\nFull Data:\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\`\n`);
        
        console.log('\nMETRICS:');
        console.log(`Readiness Score: ${readiness}%`);
        console.log(`Championship Leverage: ${leverage}`);
        console.log(`Data Response: ${response.status}`);
        console.log(`Cache Updated: ${timestamp}`);
        
        console.log('\nNEXT:');
        console.log(badge);
        console.log('• Badge cached to dist/.pulse/readiness.md');
        console.log('• Run /enigma for Champion traits status');
        
    } catch (error) {
        console.error('❌ Readiness pulse failed:', error.message);
        console.log('\nNEXT:');
        console.log('• Check Cardinals Readiness Board agent');
        console.log('• Verify data pipeline worker');
        process.exit(1);
    }
}

main().catch(console.error);