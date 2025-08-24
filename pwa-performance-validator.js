/**
 * PWA & Performance Validation Tool
 * Comprehensive testing for Lone Star Legends Championship
 */

class PWAPerformanceValidator {
    constructor(baseUrl = 'https://fe5b775f.blaze-intelligence-lsl.pages.dev') {
        this.baseUrl = baseUrl;
        this.results = new Map();
        this.startTime = Date.now();
    }

    async validateAll() {
        console.log('🔥 PWA & Performance Validation - Lone Star Legends Championship');
        console.log('================================================================');
        
        await this.checkPWAManifest();
        await this.checkServiceWorker();
        await this.checkPerformanceMetrics();
        await this.checkSEOBasics();
        await this.checkAccessibility();
        
        this.generateReport();
    }

    async checkPWAManifest() {
        console.log('\n📱 PWA Manifest Validation');
        console.log('--------------------------');
        
        try {
            const response = await fetch(`${this.baseUrl}/manifest.json`);
            const manifest = await response.json();
            
            const requirements = {
                name: 'App name',
                short_name: 'Short name',
                start_url: 'Start URL',
                display: 'Display mode',
                icons: 'Icons array',
                theme_color: 'Theme color',
                background_color: 'Background color'
            };
            
            let score = 0;
            let total = Object.keys(requirements).length;
            
            for (const [key, desc] of Object.entries(requirements)) {
                if (manifest[key]) {
                    console.log(`  ✅ ${desc}: ${Array.isArray(manifest[key]) ? `${manifest[key].length} items` : manifest[key]}`);
                    score++;
                } else {
                    console.log(`  ❌ ${desc}: Missing`);
                }
            }
            
            // Check icons specifically
            if (manifest.icons && manifest.icons.length > 0) {
                const iconSizes = manifest.icons.map(icon => icon.sizes).join(', ');
                console.log(`  ✅ Icon sizes available: ${iconSizes}`);
            }
            
            const pwaScore = Math.round((score / total) * 100);
            console.log(`\n📊 PWA Manifest Score: ${pwaScore}%`);
            this.results.set('pwa_manifest', pwaScore);
            
        } catch (error) {
            console.log(`  ❌ Manifest validation failed: ${error.message}`);
            this.results.set('pwa_manifest', 0);
        }
    }

    async checkServiceWorker() {
        console.log('\n🔧 Service Worker Validation');
        console.log('----------------------------');
        
        try {
            const response = await fetch(`${this.baseUrl}/sw.js`);
            const swCode = await response.text();
            
            const features = {
                'CACHE_NAME': 'Cache versioning',
                'install': 'Install event',
                'activate': 'Activate event', 
                'fetch': 'Fetch intercepting',
                'caches.open': 'Cache API usage',
                'indexedDB': 'IndexedDB usage'
            };
            
            let score = 0;
            let total = Object.keys(features).length;
            
            for (const [pattern, desc] of Object.entries(features)) {
                if (swCode.includes(pattern)) {
                    console.log(`  ✅ ${desc}: Implemented`);
                    score++;
                } else {
                    console.log(`  ❌ ${desc}: Missing`);
                }
            }
            
            const swScore = Math.round((score / total) * 100);
            console.log(`\n📊 Service Worker Score: ${swScore}%`);
            this.results.set('service_worker', swScore);
            
        } catch (error) {
            console.log(`  ❌ Service Worker validation failed: ${error.message}`);
            this.results.set('service_worker', 0);
        }
    }

    async checkPerformanceMetrics() {
        console.log('\n⚡ Performance Metrics');
        console.log('---------------------');
        
        const startTime = Date.now();
        
        try {
            const response = await fetch(this.baseUrl);
            const loadTime = Date.now() - startTime;
            const contentLength = parseInt(response.headers.get('content-length') || '0');
            
            console.log(`  📊 Page Load Time: ${loadTime}ms`);
            console.log(`  📦 Content Size: ${Math.round(contentLength/1024)}KB`);
            console.log(`  🌐 Response Status: ${response.status}`);
            console.log(`  🔒 HTTPS Enabled: ${response.url.startsWith('https') ? 'Yes' : 'No'}`);
            
            // Performance scoring
            let perfScore = 100;
            if (loadTime > 3000) perfScore -= 20;
            if (loadTime > 2000) perfScore -= 10;
            if (contentLength > 500000) perfScore -= 10; // 500KB
            if (!response.url.startsWith('https')) perfScore -= 20;
            
            console.log(`\n📊 Performance Score: ${perfScore}%`);
            this.results.set('performance', perfScore);
            
        } catch (error) {
            console.log(`  ❌ Performance check failed: ${error.message}`);
            this.results.set('performance', 0);
        }
    }

    async checkSEOBasics() {
        console.log('\n🔍 SEO Validation');
        console.log('-----------------');
        
        try {
            const response = await fetch(this.baseUrl);
            const html = await response.text();
            
            const seoChecks = {
                '<title>': 'Page title',
                '<meta name="description"': 'Meta description',
                '<meta name="viewport"': 'Viewport meta tag',
                '<h1': 'H1 heading',
                'lang=': 'Language attribute',
                '<meta property="og:': 'Open Graph tags'
            };
            
            let score = 0;
            let total = Object.keys(seoChecks).length;
            
            for (const [pattern, desc] of Object.entries(seoChecks)) {
                if (html.includes(pattern)) {
                    console.log(`  ✅ ${desc}: Found`);
                    score++;
                } else {
                    console.log(`  ❌ ${desc}: Missing`);
                }
            }
            
            const seoScore = Math.round((score / total) * 100);
            console.log(`\n📊 SEO Score: ${seoScore}%`);
            this.results.set('seo', seoScore);
            
        } catch (error) {
            console.log(`  ❌ SEO validation failed: ${error.message}`);
            this.results.set('seo', 0);
        }
    }

    async checkAccessibility() {
        console.log('\n♿ Accessibility Validation');
        console.log('--------------------------');
        
        try {
            const response = await fetch(this.baseUrl);
            const html = await response.text();
            
            const a11yChecks = {
                'alt=': 'Image alt attributes',
                'aria-': 'ARIA attributes',
                '<label': 'Form labels',
                'role=': 'ARIA roles',
                'tabindex': 'Keyboard navigation',
                'focus': 'Focus management'
            };
            
            let score = 0;
            let total = Object.keys(a11yChecks).length;
            
            for (const [pattern, desc] of Object.entries(a11yChecks)) {
                if (html.includes(pattern)) {
                    console.log(`  ✅ ${desc}: Found`);
                    score++;
                } else {
                    console.log(`  ❌ ${desc}: Missing`);
                }
            }
            
            const a11yScore = Math.round((score / total) * 100);
            console.log(`\n📊 Accessibility Score: ${a11yScore}%`);
            this.results.set('accessibility', a11yScore);
            
        } catch (error) {
            console.log(`  ❌ Accessibility validation failed: ${error.message}`);
            this.results.set('accessibility', 0);
        }
    }

    generateReport() {
        const totalTime = Date.now() - this.startTime;
        
        console.log('\n🏆 OVERALL VALIDATION REPORT');
        console.log('=============================');
        
        let totalScore = 0;
        let categoryCount = 0;
        
        for (const [category, score] of this.results) {
            const status = score >= 90 ? '🟢' : score >= 70 ? '🟡' : '🔴';
            console.log(`${status} ${category.replace('_', ' ').toUpperCase()}: ${score}%`);
            totalScore += score;
            categoryCount++;
        }
        
        const overallScore = Math.round(totalScore / categoryCount);
        console.log(`\n🎯 OVERALL SCORE: ${overallScore}%`);
        
        if (overallScore >= 90) {
            console.log('🎉 EXCELLENT! Production ready for championship play!');
        } else if (overallScore >= 70) {
            console.log('✅ GOOD! Minor improvements recommended.');
        } else {
            console.log('⚠️  NEEDS IMPROVEMENT! Address critical issues before launch.');
        }
        
        console.log(`⏱️  Validation completed in ${totalTime}ms`);
        console.log('\n🚀 Ready to dominate the championship! ⚾');
    }
}

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PWAPerformanceValidator;
} else if (typeof window !== 'undefined') {
    window.PWAPerformanceValidator = PWAPerformanceValidator;
}

// Auto-run if called directly
if (require.main === module) {
    const validator = new PWAPerformanceValidator();
    validator.validateAll().catch(console.error);
}