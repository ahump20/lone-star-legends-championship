#!/usr/bin/env node

/**
 * Blaze Intelligence - Production Validation Script
 * Comprehensive testing and validation for deployment readiness
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class BlazeProductionValidator {
    constructor() {
        this.testResults = [];
        this.errors = [];
        this.warnings = [];
        this.passed = 0;
        this.failed = 0;
        
        this.requiredFiles = [
            'index.html',
            'blaze-branded-game.html',
            'blaze-analytics-integration.html',
            'blaze-portfolio-showcase.html',
            'fbs-coverage-integration.html',
            'sync-ai-data.js',
            'security-validation.js',
            'manifest.json',
            'sw.js',
            'wrangler.toml',
            '.editorconfig',
            '.env.example',
            '.gitleaks.toml',
            '.gitignore'
        ];
        
        this.dataFiles = [
            'data/blaze-analytics-feed.json'
        ];
        
        this.brandingRequirements = [
            'Blaze Intelligence',
            'FF6B35', // Orange color
            'Three.js',
            'Cardinals',
            'Titans',
            'Longhorns',
            'Grizzlies'
        ];
    }
    
    async runAllTests() {
        console.log('🔥 Starting Blaze Intelligence Production Validation...\n');
        
        try {
            await this.testFileStructure();
            await this.testBrandingConsistency();
            await this.testDataIntegrity();
            await this.testSecurityConfiguration();
            await this.testPerformanceMetrics();
            await this.testResponsiveDesign();
            await this.testAccessibility();
            await this.testSEOOptimization();
            
            this.generateReport();
            
        } catch (error) {
            this.logError('CRITICAL_ERROR', `Validation failed: ${error.message}`);
            process.exit(1);
        }
    }
    
    // === FILE STRUCTURE TESTS ===
    
    async testFileStructure() {
        console.log('📁 Testing file structure...');
        
        for (const file of this.requiredFiles) {
            try {
                await fs.access(file);
                this.logSuccess('FILE_EXISTS', `Required file exists: ${file}`);
            } catch (error) {
                this.logError('MISSING_FILE', `Required file missing: ${file}`);
            }
        }
        
        for (const file of this.dataFiles) {
            try {
                await fs.access(file);
                this.logSuccess('DATA_FILE_EXISTS', `Data file exists: ${file}`);
            } catch (error) {
                this.logWarning('MISSING_DATA_FILE', `Data file missing: ${file}`);
            }
        }
        
        // Check for proper directory structure
        const requiredDirs = ['data'];
        for (const dir of requiredDirs) {
            try {
                const stats = await fs.stat(dir);
                if (stats.isDirectory()) {
                    this.logSuccess('DIRECTORY_EXISTS', `Directory exists: ${dir}`);
                } else {
                    this.logError('INVALID_DIRECTORY', `Expected directory: ${dir}`);
                }
            } catch (error) {
                this.logError('MISSING_DIRECTORY', `Directory missing: ${dir}`);
            }
        }
    }
    
    // === BRANDING CONSISTENCY TESTS ===
    
    async testBrandingConsistency() {
        console.log('🎨 Testing branding consistency...');
        
        for (const file of this.requiredFiles.filter(f => f.endsWith('.html'))) {
            try {
                const content = await fs.readFile(file, 'utf8');
                
                // Check for Blaze Intelligence branding
                if (content.includes('Blaze Intelligence')) {
                    this.logSuccess('BRANDING_PRESENT', `Blaze Intelligence branding found in ${file}`);
                } else {
                    this.logError('MISSING_BRANDING', `Blaze Intelligence branding missing in ${file}`);
                }
                
                // Check for orange color scheme
                if (content.includes('#FF6B35') || content.includes('--blaze-orange')) {
                    this.logSuccess('COLOR_SCHEME', `Orange color scheme found in ${file}`);
                } else {
                    this.logWarning('MISSING_COLOR', `Orange color scheme not found in ${file}`);
                }
                
                // Check for Three.js integration
                if (content.includes('three.js') || content.includes('THREE.')) {
                    this.logSuccess('THREEJS_INTEGRATION', `Three.js integration found in ${file}`);
                } else if (file !== 'index.html') {
                    this.logWarning('MISSING_THREEJS', `Three.js integration not found in ${file}`);
                }
                
                // Check for sports team references
                const sportsTeams = ['Cardinals', 'Titans', 'Longhorns', 'Grizzlies'];
                const foundTeams = sportsTeams.filter(team => content.includes(team));
                if (foundTeams.length > 0) {
                    this.logSuccess('SPORTS_TEAMS', `Sports teams found in ${file}: ${foundTeams.join(', ')}`);
                }
                
            } catch (error) {
                this.logError('BRANDING_TEST_ERROR', `Failed to test branding in ${file}: ${error.message}`);
            }
        }
    }
    
    // === DATA INTEGRITY TESTS ===
    
    async testDataIntegrity() {
        console.log('📊 Testing data integrity...');
        
        try {
            const dataContent = await fs.readFile('data/blaze-analytics-feed.json', 'utf8');
            const data = JSON.parse(dataContent);
            
            // Validate data structure
            const requiredFields = ['metadata', 'team_analytics', 'live_feed', 'ai_model_stats'];
            for (const field of requiredFields) {
                if (data.hasOwnProperty(field)) {
                    this.logSuccess('DATA_STRUCTURE', `Required field exists: ${field}`);
                } else {
                    this.logError('MISSING_DATA_FIELD', `Required field missing: ${field}`);
                }
            }
            
            // Validate team data
            const expectedTeams = ['cardinals', 'titans', 'longhorns', 'grizzlies'];
            for (const team of expectedTeams) {
                if (data.team_analytics && data.team_analytics[team]) {
                    this.logSuccess('TEAM_DATA', `Team data exists: ${team}`);
                    
                    // Validate team structure
                    const teamData = data.team_analytics[team];
                    const requiredTeamFields = ['sport', 'current_stats', 'predictive_metrics', 'readiness_score'];
                    for (const field of requiredTeamFields) {
                        if (teamData.hasOwnProperty(field)) {
                            this.logSuccess('TEAM_STRUCTURE', `${team} has ${field}`);
                        } else {
                            this.logError('MISSING_TEAM_FIELD', `${team} missing ${field}`);
                        }
                    }
                } else {
                    this.logError('MISSING_TEAM_DATA', `Team data missing: ${team}`);
                }
            }
            
            // Validate accuracy metrics
            if (data.metadata && data.metadata.accuracy) {
                const accuracy = data.metadata.accuracy;
                if (accuracy >= 94.6) {
                    this.logSuccess('ACCURACY_BENCHMARK', `Accuracy meets benchmark: ${accuracy}%`);
                } else {
                    this.logWarning('LOW_ACCURACY', `Accuracy below benchmark: ${accuracy}%`);
                }
            }
            
        } catch (error) {
            this.logError('DATA_INTEGRITY_ERROR', `Data integrity test failed: ${error.message}`);
        }
    }
    
    // === SECURITY CONFIGURATION TESTS ===
    
    async testSecurityConfiguration() {
        console.log('🔒 Testing security configuration...');
        
        try {
            // Test .env.example exists and has required fields
            const envContent = await fs.readFile('.env.example', 'utf8');
            const requiredEnvVars = [
                'CLOUDFLARE_ACCOUNT_ID',
                'CLOUDFLARE_API_TOKEN',
                'JWT_SECRET',
                'ENCRYPTION_KEY',
                'SENTRY_DSN'
            ];
            
            for (const envVar of requiredEnvVars) {
                if (envContent.includes(envVar)) {
                    this.logSuccess('ENV_VAR', `Environment variable template exists: ${envVar}`);
                } else {
                    this.logError('MISSING_ENV_VAR', `Environment variable template missing: ${envVar}`);
                }
            }
            
            // Test gitleaks configuration
            const gitleaksContent = await fs.readFile('.gitleaks.toml', 'utf8');
            if (gitleaksContent.includes('[[rules]]')) {
                this.logSuccess('GITLEAKS_CONFIG', 'Gitleaks security rules configured');
            } else {
                this.logError('INVALID_GITLEAKS', 'Gitleaks configuration invalid');
            }
            
            // Test security validation script
            const securityContent = await fs.readFile('security-validation.js', 'utf8');
            const securityFeatures = ['CSP', 'rate limiting', 'input validation', 'XSS protection'];
            for (const feature of securityFeatures) {
                if (securityContent.toLowerCase().includes(feature.toLowerCase())) {
                    this.logSuccess('SECURITY_FEATURE', `Security feature implemented: ${feature}`);
                } else {
                    this.logWarning('MISSING_SECURITY', `Security feature not found: ${feature}`);
                }
            }
            
        } catch (error) {
            this.logError('SECURITY_TEST_ERROR', `Security configuration test failed: ${error.message}`);
        }
    }
    
    // === PERFORMANCE METRICS TESTS ===
    
    async testPerformanceMetrics() {
        console.log('⚡ Testing performance configuration...');
        
        try {
            // Check for PWA configuration
            const manifestContent = await fs.readFile('manifest.json', 'utf8');
            const manifest = JSON.parse(manifestContent);
            
            const requiredManifestFields = ['name', 'short_name', 'start_url', 'theme_color'];
            for (const field of requiredManifestFields) {
                if (manifest.hasOwnProperty(field)) {
                    this.logSuccess('PWA_CONFIG', `Manifest field exists: ${field}`);
                } else {
                    this.logError('MISSING_MANIFEST_FIELD', `Manifest field missing: ${field}`);
                }
            }
            
            // Check service worker
            const swContent = await fs.readFile('sw.js', 'utf8');
            if (swContent.includes('cache') && swContent.includes('fetch')) {
                this.logSuccess('SERVICE_WORKER', 'Service worker configured for caching');
            } else {
                this.logWarning('INCOMPLETE_SW', 'Service worker may be incomplete');
            }
            
            // Check for lazy loading and optimization
            for (const file of this.requiredFiles.filter(f => f.endsWith('.html'))) {
                const content = await fs.readFile(file, 'utf8');
                
                if (content.includes('loading="lazy"')) {
                    this.logSuccess('LAZY_LOADING', `Lazy loading found in ${file}`);
                }
                
                if (content.includes('viewport')) {
                    this.logSuccess('RESPONSIVE_META', `Viewport meta tag found in ${file}`);
                } else {
                    this.logError('MISSING_VIEWPORT', `Viewport meta tag missing in ${file}`);
                }
            }
            
        } catch (error) {
            this.logError('PERFORMANCE_TEST_ERROR', `Performance test failed: ${error.message}`);
        }
    }
    
    // === RESPONSIVE DESIGN TESTS ===
    
    async testResponsiveDesign() {
        console.log('📱 Testing responsive design...');
        
        for (const file of this.requiredFiles.filter(f => f.endsWith('.html'))) {
            try {
                const content = await fs.readFile(file, 'utf8');
                
                // Check for responsive CSS
                const responsivePatterns = [
                    '@media',
                    'max-width',
                    'min-width',
                    'flex-direction: column',
                    'grid-template-columns'
                ];
                
                for (const pattern of responsivePatterns) {
                    if (content.includes(pattern)) {
                        this.logSuccess('RESPONSIVE_CSS', `Responsive pattern found in ${file}: ${pattern}`);
                        break;
                    }
                }
                
                // Check for mobile-friendly elements
                if (content.includes('touch')) {
                    this.logSuccess('TOUCH_SUPPORT', `Touch support found in ${file}`);
                }
                
            } catch (error) {
                this.logWarning('RESPONSIVE_TEST_ERROR', `Responsive test failed for ${file}`);
            }
        }
    }
    
    // === ACCESSIBILITY TESTS ===
    
    async testAccessibility() {
        console.log('♿ Testing accessibility...');
        
        for (const file of this.requiredFiles.filter(f => f.endsWith('.html'))) {
            try {
                const content = await fs.readFile(file, 'utf8');
                
                // Check for alt attributes
                if (content.includes('alt=')) {
                    this.logSuccess('ALT_ATTRIBUTES', `Alt attributes found in ${file}`);
                }
                
                // Check for ARIA labels
                if (content.includes('aria-')) {
                    this.logSuccess('ARIA_LABELS', `ARIA labels found in ${file}`);
                }
                
                // Check for semantic HTML
                const semanticTags = ['header', 'nav', 'main', 'section', 'article', 'footer'];
                const foundTags = semanticTags.filter(tag => content.includes(`<${tag}`));
                if (foundTags.length > 0) {
                    this.logSuccess('SEMANTIC_HTML', `Semantic HTML found in ${file}: ${foundTags.join(', ')}`);
                }
                
            } catch (error) {
                this.logWarning('ACCESSIBILITY_TEST_ERROR', `Accessibility test failed for ${file}`);
            }
        }
    }
    
    // === SEO OPTIMIZATION TESTS ===
    
    async testSEOOptimization() {
        console.log('🔍 Testing SEO optimization...');
        
        for (const file of this.requiredFiles.filter(f => f.endsWith('.html'))) {
            try {
                const content = await fs.readFile(file, 'utf8');
                
                // Check for meta tags
                const metaTags = ['description', 'keywords', 'author', 'theme-color'];
                for (const tag of metaTags) {
                    if (content.includes(`name="${tag}"`)) {
                        this.logSuccess('SEO_META', `Meta tag found in ${file}: ${tag}`);
                    }
                }
                
                // Check for Open Graph tags
                if (content.includes('og:')) {
                    this.logSuccess('OPEN_GRAPH', `Open Graph tags found in ${file}`);
                }
                
                // Check for structured data
                if (content.includes('application/ld+json')) {
                    this.logSuccess('STRUCTURED_DATA', `Structured data found in ${file}`);
                }
                
                // Check for proper heading structure
                if (content.includes('<h1>')) {
                    this.logSuccess('H1_TAG', `H1 tag found in ${file}`);
                } else {
                    this.logWarning('MISSING_H1', `H1 tag missing in ${file}`);
                }
                
            } catch (error) {
                this.logWarning('SEO_TEST_ERROR', `SEO test failed for ${file}`);
            }
        }
    }
    
    // === LOGGING METHODS ===
    
    logSuccess(type, message) {
        this.testResults.push({ type, status: 'PASS', message });
        this.passed++;
        console.log(`✅ ${message}`);
    }
    
    logError(type, message) {
        this.testResults.push({ type, status: 'FAIL', message });
        this.errors.push({ type, message });
        this.failed++;
        console.log(`❌ ${message}`);
    }
    
    logWarning(type, message) {
        this.testResults.push({ type, status: 'WARN', message });
        this.warnings.push({ type, message });
        console.log(`⚠️  ${message}`);
    }
    
    // === REPORT GENERATION ===
    
    generateReport() {
        console.log('\n' + '='.repeat(60));
        console.log('🔥 BLAZE INTELLIGENCE PRODUCTION VALIDATION REPORT');
        console.log('='.repeat(60));
        
        console.log(`\n📊 Test Summary:`);
        console.log(`   ✅ Passed: ${this.passed}`);
        console.log(`   ❌ Failed: ${this.failed}`);
        console.log(`   ⚠️  Warnings: ${this.warnings.length}`);
        console.log(`   📋 Total Tests: ${this.testResults.length}`);
        
        const successRate = ((this.passed / this.testResults.length) * 100).toFixed(1);
        console.log(`   🎯 Success Rate: ${successRate}%`);
        
        if (this.errors.length > 0) {
            console.log(`\n❌ Critical Issues (${this.errors.length}):`);
            this.errors.forEach((error, index) => {
                console.log(`   ${index + 1}. ${error.message}`);
            });
        }
        
        if (this.warnings.length > 0) {
            console.log(`\n⚠️  Warnings (${this.warnings.length}):`);
            this.warnings.slice(0, 5).forEach((warning, index) => {
                console.log(`   ${index + 1}. ${warning.message}`);
            });
            if (this.warnings.length > 5) {
                console.log(`   ... and ${this.warnings.length - 5} more warnings`);
            }
        }
        
        console.log('\n🔥 Blaze Intelligence Quality Standards:');
        console.log('   📊 Data Accuracy: 94.6% benchmark');
        console.log('   ⚡ Response Time: <100ms target');
        console.log('   🔒 Security: CSP + Input validation');
        console.log('   📱 Mobile: PWA ready');
        console.log('   🎨 Branding: Consistent orange theme');
        
        if (this.failed === 0) {
            console.log('\n🎉 PRODUCTION READY! All critical tests passed.');
            console.log('🚀 Ready for deployment to Blaze Intelligence platform.');
        } else {
            console.log(`\n🚫 NOT PRODUCTION READY! ${this.failed} critical issues must be fixed.`);
            process.exit(1);
        }
        
        console.log('\n' + '='.repeat(60));
    }
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const validator = new BlazeProductionValidator();
    validator.runAllTests().catch(error => {
        console.error('❌ Validation failed:', error);
        process.exit(1);
    });
}

export default BlazeProductionValidator;