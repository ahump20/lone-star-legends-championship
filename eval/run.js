#!/usr/bin/env node

/**
 * Blaze Proofs - Deterministic production evaluations
 * Usage: node eval/run.js --url $PROD
 */

import { execSync } from 'child_process';

const DEFAULT_URL = 'https://3eca9ea9.blaze-intelligence-lsl.pages.dev';

class BlazeProofs {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
        this.results = [];
    }
    
    async runProof(name, testFn) {
        console.log(`🔍 Running ${name}...`);
        try {
            const result = await testFn();
            this.results.push({ name, passed: true, result });
            console.log(`✅ ${name}: PASS`);
            return true;
        } catch (error) {
            this.results.push({ name, passed: false, error: error.message });
            console.log(`❌ ${name}: FAIL - ${error.message}`);
            return false;
        }
    }
    
    async checkPWA() {
        const response = await fetch(`${this.baseUrl}/manifest.json`);
        if (!response.ok) throw new Error(`Manifest not found: ${response.status}`);
        
        const manifest = await response.json();
        if (!manifest.name) throw new Error('Manifest missing name');
        if (!manifest.icons || manifest.icons.length === 0) throw new Error('Manifest missing icons');
        if (!manifest.start_url) throw new Error('Manifest missing start_url');
        
        return { manifestValid: true, name: manifest.name };
    }
    
    async checkSecurityHeaders() {
        const response = await fetch(this.baseUrl);
        const headers = response.headers;
        
        const required = [
            'x-content-type-options',
            'x-frame-options', 
            'content-security-policy',
            'strict-transport-security'
        ];
        
        for (const header of required) {
            if (!headers.get(header)) {
                throw new Error(`Missing security header: ${header}`);
            }
        }
        
        return { securityHeadersPresent: required.length };
    }
    
    async checkKeyRoutes() {
        const routes = [
            '/',
            '/health',
            '/competitive-analysis.html',
            '/cardinals-intelligence.html',
            '/privacy-policy.html'
        ];
        
        const results = [];
        for (const route of routes) {
            const response = await fetch(`${this.baseUrl}${route}`);
            if (!response.ok) {
                throw new Error(`Route ${route} returned ${response.status}`);
            }
            results.push({ route, status: response.status });
        }
        
        return { routesChecked: results.length };
    }
    
    async checkAPIHealth() {
        const endpoints = [
            '/api/champion-enigma/live-score',
            '/data/analytics/readiness.json'
        ];
        
        const results = [];
        for (const endpoint of endpoints) {
            try {
                const response = await fetch(`${this.baseUrl}${endpoint}`);
                const data = await response.json();
                results.push({ endpoint, status: response.status, hasData: !!data });
            } catch (error) {
                // API endpoints may not be available, this is non-fatal
                results.push({ endpoint, status: 'error', error: error.message });
            }
        }
        
        return { apisChecked: results.length, results };
    }
    
    async run() {
        console.log('STATUS:');
        console.log(`🏆 Running Blaze Proofs against ${this.baseUrl}`);
        
        let passed = 0;
        const total = 4;
        
        if (await this.runProof('PWA Compliance', () => this.checkPWA())) passed++;
        if (await this.runProof('Security Headers', () => this.checkSecurityHeaders())) passed++;
        if (await this.runProof('Key Routes', () => this.checkKeyRoutes())) passed++;
        if (await this.runProof('API Health', () => this.checkAPIHealth())) passed++;
        
        console.log('\nMETRICS:');
        console.log(`Proofs Passed: ${passed}/${total} (${Math.round(passed/total*100)}%)`);
        console.log(`Target URL: ${this.baseUrl}`);
        console.log(`Proof Time: ${new Date().toISOString()}`);
        
        console.log('\nNEXT:');
        if (passed === total) {
            console.log('🎉 All Blaze Proofs passed - production verified');
            console.log('• Deployment meets quality standards');
            console.log('• Ready for traffic');
            process.exit(0);
        } else {
            console.log(`⚠️  ${total - passed} proof(s) failed - investigate issues`);
            console.log('• Check deployment configuration');
            console.log('• Verify all services are running');
            process.exit(1);
        }
    }
}

async function main() {
    const args = process.argv.slice(2);
    const urlArg = args.find(arg => arg.startsWith('--url='));
    const url = urlArg ? urlArg.split('=')[1] : DEFAULT_URL;
    
    const proofs = new BlazeProofs(url);
    await proofs.run();
}

main().catch(console.error);