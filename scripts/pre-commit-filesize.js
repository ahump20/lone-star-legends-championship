#!/usr/bin/env node

/**
 * Pre-commit hook: Block oversized files
 */

import fs from 'fs';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_LINES = 10000; // 10k lines

function checkFile(filePath) {
    try {
        const stats = fs.statSync(filePath);
        const violations = [];
        
        // Check file size
        if (stats.size > MAX_SIZE) {
            violations.push({
                file: filePath,
                issue: `File size ${(stats.size / 1024 / 1024).toFixed(1)}MB exceeds 5MB limit`
            });
        }
        
        // Check line count for text files
        if (filePath.match(/\.(js|ts|jsx|tsx|html|css|md|json|yaml|yml)$/)) {
            const content = fs.readFileSync(filePath, 'utf8');
            const lineCount = content.split('\n').length;
            
            if (lineCount > MAX_LINES) {
                violations.push({
                    file: filePath,
                    issue: `Line count ${lineCount} exceeds ${MAX_LINES} limit`
                });
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
        const violations = checkFile(file);
        allViolations.push(...violations);
    }
    
    if (allViolations.length > 0) {
        console.error('❌ COMMIT BLOCKED: Oversized files detected');
        for (const v of allViolations) {
            console.error(`  ${v.file}: ${v.issue}`);
        }
        console.error('');
        console.error('Consider:');
        console.error('1. Splitting large files into modules');
        console.error('2. Moving large assets to external storage');
        console.error('3. Using Git LFS for binary files');
        process.exit(1);
    }
    
    console.log('✅ All files within size limits');
}

main();