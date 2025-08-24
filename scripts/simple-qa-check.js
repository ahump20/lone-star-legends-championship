#!/usr/bin/env node

/**
 * /qa - Simple QA verification for production deployment
 */

const PROD_URL = 'https://fe5b775f.blaze-intelligence-lsl.pages.dev';

async function checkEndpoint(url, description) {
    try {
        const response = await fetch(url);
        const ok = response.ok;
        console.log(`${ok ? '✅' : '❌'} ${description}: ${response.status}`);
        return ok;
    } catch (error) {
        console.log(`❌ ${description}: ${error.message}`);
        return false;
    }
}

async function main() {
    console.log('STATUS:');
    console.log('🔍 Running QA checks on production deployment...');
    
    const checks = [
        [`${PROD_URL}`, 'Main site'],
        [`${PROD_URL}/health`, 'Health endpoint'],
        [`${PROD_URL}/api/champion-enigma/live-score`, 'Champion Enigma API'],
        [`${PROD_URL}/data/analytics/readiness.json`, 'Cardinals Readiness data'],
        [`${PROD_URL}/competitive-analysis.html`, 'Competitive analysis page'],
        [`${PROD_URL}/cardinals-intelligence.html`, 'Cardinals landing page'],
        [`${PROD_URL}/privacy-policy.html`, 'Privacy policy'],
    ];
    
    let passed = 0;
    const total = checks.length;
    
    for (const [url, description] of checks) {
        if (await checkEndpoint(url, description)) {
            passed++;
        }
    }
    
    console.log('\nMETRICS:');
    console.log(`QA Score: ${passed}/${total} (${Math.round(passed/total*100)}%)`);
    console.log(`Production URL: ${PROD_URL}`);
    console.log(`Check Time: ${new Date().toISOString()}`);
    
    console.log('\nNEXT:');
    if (passed === total) {
        console.log('🎉 All QA checks passed - deployment verified');
        console.log('• Run /scan for security validation');
        console.log('• Monitor with /enigma and /readiness pulses');
    } else {
        console.log('⚠️  Some checks failed - investigate endpoints');
        console.log('• Check Wrangler deployment logs');
        console.log('• Verify DNS propagation');
        process.exit(1);
    }
}

main().catch(console.error);