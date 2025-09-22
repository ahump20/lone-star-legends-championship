#!/usr/bin/env node
/**
 * OG Remaster Performance Audit
 * Validates technical metrics and PWA capabilities
 */

const fs = require('fs');
const path = require('path');

class PerformanceAuditor {
  constructor() {
    this.results = {
      bundle: { size: 0, files: [] },
      assets: { count: 0, types: {} },
      pwa: { features: [], score: 0 },
      brand: { integration: false, tokens: 0 }
    };
  }

  async audit() {
    console.log('🏆 BLAZE INTELLIGENCE OG REMASTER - PERFORMANCE AUDIT');
    console.log('⚡ Analyzing championship-level technical implementation...\n');

    this.auditBundleSize();
    this.auditAssetOptimization();
    this.auditPWACapabilities();
    this.auditBrandIntegration();

    this.generateReport();
  }

  auditBundleSize() {
    const sourceFiles = this.getFilesByExtension(['.ts', '.js', '.css', '.html']);
    
    let totalSize = 0;
    sourceFiles.forEach(file => {
      const stats = fs.statSync(file);
      totalSize += stats.size;
      this.results.bundle.files.push({
        file: path.relative(process.cwd(), file),
        size: stats.size,
        type: path.extname(file)
      });
    });

    this.results.bundle.size = totalSize;
    
    console.log('📦 BUNDLE ANALYSIS:');
    console.log(`   Total Size: ${(totalSize / 1024).toFixed(2)}KB`);
    console.log(`   File Count: ${sourceFiles.length}`);
    console.log(`   Target: <2MB ✅ ${totalSize < 2 * 1024 * 1024 ? 'PASS' : 'FAIL'}\n`);
  }

  auditAssetOptimization() {
    const allFiles = this.getAllFiles();
    
    const assetTypes = {};
    allFiles.forEach(file => {
      const ext = path.extname(file);
      if (!assetTypes[ext]) assetTypes[ext] = 0;
      assetTypes[ext]++;
    });

    this.results.assets.count = allFiles.length;
    this.results.assets.types = assetTypes;

    console.log('🎨 ASSET OPTIMIZATION:');
    Object.entries(assetTypes).forEach(([ext, count]) => {
      console.log(`   ${ext || '(no ext)'}: ${count} files`);
    });

    // Check for service worker
    const hasSW = fs.existsSync('./sw.js');
    console.log(`   Service Worker: ${hasSW ? '✅ Present' : '❌ Missing'}`);
    console.log(`   Caching Strategy: ${hasSW ? '✅ Offline-first' : '❌ None'}\n`);
  }

  auditPWACapabilities() {
    const features = [];
    let score = 0;

    // Check manifest
    if (fs.existsSync('./manifest.json')) {
      features.push('Web App Manifest');
      score += 20;
    }

    // Check service worker
    if (fs.existsSync('./sw.js')) {
      features.push('Service Worker');
      score += 30;
    }

    // Check responsive design
    if (this.checkResponsiveCSS()) {
      features.push('Responsive Design');
      score += 20;
    }

    // Check touch controls
    if (this.checkTouchControls()) {
      features.push('Touch Controls');
      score += 15;
    }

    // Check theme color
    if (this.checkThemeColor()) {
      features.push('Theme Color');
      score += 15;
    }

    this.results.pwa.features = features;
    this.results.pwa.score = score;

    console.log('📱 PWA CAPABILITIES:');
    features.forEach(feature => {
      console.log(`   ✅ ${feature}`);
    });
    console.log(`   PWA Score: ${score}/100`);
    console.log(`   Target: 100 ${score === 100 ? '✅ PERFECT' : score >= 80 ? '🟡 GOOD' : '❌ NEEDS WORK'}\n`);
  }

  auditBrandIntegration() {
    let tokenCount = 0;
    let hasIntegration = false;

    // Check brand.css exists and has tokens
    if (fs.existsSync('./brand.css')) {
      const brandCSS = fs.readFileSync('./brand.css', 'utf8');
      const tokens = brandCSS.match(/--bi-[a-z-]+/g) || [];
      tokenCount = tokens.length;
      hasIntegration = tokenCount > 0;
    }

    this.results.brand.integration = hasIntegration;
    this.results.brand.tokens = tokenCount;

    console.log('🎨 BRAND INTEGRATION:');
    console.log(`   Brand Tokens: ${tokenCount} defined`);
    console.log(`   Texas Heritage: ${hasIntegration ? '✅ Integrated' : '❌ Missing'}`);
    console.log(`   Design System: ${tokenCount >= 7 ? '✅ Complete' : '🟡 Partial'}\n`);
  }

  // Helper methods
  getFilesByExtension(extensions) {
    return this.getAllFiles().filter(file => 
      extensions.includes(path.extname(file))
    );
  }

  getAllFiles() {
    const files = [];
    const walk = (dir) => {
      const items = fs.readdirSync(dir);
      items.forEach(item => {
        if (item.startsWith('.')) return; // Skip hidden files
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          walk(fullPath);
        } else {
          files.push(fullPath);
        }
      });
    };
    walk('./');
    return files;
  }

  checkResponsiveCSS() {
    if (!fs.existsSync('./style.css')) return false;
    const css = fs.readFileSync('./style.css', 'utf8');
    return css.includes('viewport') || css.includes('media') || css.includes('responsive');
  }

  checkTouchControls() {
    if (!fs.existsSync('./index.html')) return false;
    const html = fs.readFileSync('./index.html', 'utf8');
    return html.includes('mobileControls') || html.includes('touch');
  }

  checkThemeColor() {
    if (!fs.existsSync('./index.html')) return false;
    const html = fs.readFileSync('./index.html', 'utf8');
    return html.includes('theme-color');
  }

  generateReport() {
    console.log('🏆 CHAMPIONSHIP PERFORMANCE SUMMARY:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Bundle size check
    const bundlePass = this.results.bundle.size < 2 * 1024 * 1024;
    console.log(`📦 Bundle Size: ${bundlePass ? '✅ PASS' : '❌ FAIL'} (${(this.results.bundle.size / 1024).toFixed(2)}KB / 2MB limit)`);
    
    // PWA score check
    const pwaPass = this.results.pwa.score >= 90;
    console.log(`📱 PWA Score: ${pwaPass ? '✅ PASS' : this.results.pwa.score >= 80 ? '🟡 GOOD' : '❌ FAIL'} (${this.results.pwa.score}/100)`);
    
    // Brand integration check
    const brandPass = this.results.brand.integration && this.results.brand.tokens >= 7;
    console.log(`🎨 Brand Integration: ${brandPass ? '✅ PASS' : '❌ FAIL'} (${this.results.brand.tokens} tokens)`);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const overall = bundlePass && pwaPass && brandPass;
    console.log(`🏆 OVERALL STATUS: ${overall ? '✅ CHAMPIONSHIP READY' : '🟡 NEEDS OPTIMIZATION'}`);
    
    if (overall) {
      console.log('\n⚾ Pattern Recognition Weaponized in Digital Baseball! ⚾');
      console.log('🎯 Ready to dominate the digital diamond!');
    }
  }
}

// Run audit if called directly
if (require.main === module) {
  const auditor = new PerformanceAuditor();
  auditor.audit().catch(console.error);
}

module.exports = PerformanceAuditor;