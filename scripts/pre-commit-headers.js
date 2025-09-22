#!/usr/bin/env node

/**
 * Pre-commit hook: Enforce _headers presence and content
 */

import fs from 'fs';

const REQUIRED_HEADERS = [
    'Content-Security-Policy',
    'X-Content-Type-Options',
    'X-Frame-Options',
    'Strict-Transport-Security'
];

function checkHeaders() {
    if (!fs.existsSync('_headers')) {
        return {
            valid: false,
            issues: ['_headers file is missing']
        };
    }
    
    const content = fs.readFileSync('_headers', 'utf8');
    const issues = [];
    
    for (const header of REQUIRED_HEADERS) {
        if (!content.includes(header)) {
            issues.push(`Missing required header: ${header}`);
        }
    }
    
    // Check for basic CSP structure
    if (content.includes('Content-Security-Policy')) {
        if (!content.includes("default-src 'self'")) {
            issues.push('CSP should include default-src directive');
        }
    }
    
    return {
        valid: issues.length === 0,
        issues
    };
}

function main() {
    const result = checkHeaders();
    
    if (!result.valid) {
        console.error('❌ COMMIT BLOCKED: Security headers issues');
        for (const issue of result.issues) {
            console.error(`  ${issue}`);
        }
        console.error('');
        console.error('Required _headers template:');
        console.error('/*');
        console.error('  Content-Security-Policy: default-src \'self\'');
        console.error('  X-Content-Type-Options: nosniff');
        console.error('  X-Frame-Options: DENY');  
        console.error('  Strict-Transport-Security: max-age=31536000');
        process.exit(1);
    }
    
    console.log('✅ Security headers configuration valid');
}

main();