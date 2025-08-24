#!/usr/bin/env node

/**
 * Pre-commit hook: Block secret patterns
 */

import fs from 'fs';

const SECRET_PATTERNS = [
    { name: 'OpenAI API Key', pattern: /sk-[A-Za-z0-9]{48}/ },
    { name: 'GitHub Token', pattern: /ghp_[A-Za-z0-9]{36}/ },
    { name: 'Stripe Key', pattern: /sk_(test|live)_[A-Za-z0-9]{24}/ },
    { name: 'Generic Secret', pattern: /(password|secret|key|token)\s*[:=]\s*["'][^"']{8,}["']/ },
];

function scanFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const violations = [];
        
        for (const { name, pattern } of SECRET_PATTERNS) {
            if (pattern.test(content)) {
                // Skip known safe patterns
                const lines = content.split('\n');
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    if (pattern.test(line)) {
                        // Skip comments and examples
                        if (line.includes('//') || line.includes('example') || line.includes('YOUR_')) {
                            continue;
                        }
                        violations.push({ file: filePath, line: i + 1, type: name });
                    }
                }
            }
        }
        
        return violations;
    } catch (error) {
        return [];
    }
}

function main() {
    const files = process.argv.slice(2);
    const allViolations = [];
    
    for (const file of files) {
        const violations = scanFile(file);
        allViolations.push(...violations);
    }
    
    if (allViolations.length > 0) {
        console.error('❌ COMMIT BLOCKED: Secret patterns detected');
        for (const v of allViolations) {
            console.error(`  ${v.file}:${v.line} - ${v.type}`);
        }
        console.error('');
        console.error('Before committing:');
        console.error('1. Remove or replace secrets with env variables');
        console.error('2. Add secrets to .env (not .env.example)');
        console.error('3. Ensure .env is in .gitignore');
        process.exit(1);
    }
    
    console.log('✅ No secret patterns detected');
}

main();