#!/usr/bin/env node

/**
 * Visual validation - Test CSS framework loading and styling
 */

const PROD_URL = 'https://e6b0d1ec.blaze-intelligence-lsl.pages.dev';

async function validatePage() {
    try {
        console.log('STATUS:');
        console.log('🎨 Validating visual design elements...');
        
        const response = await fetch(PROD_URL);
        if (!response.ok) {
            throw new Error(`Site not accessible: ${response.status}`);
        }
        
        const html = await response.text();
        
        // Check Tailwind CSS configuration
        const hasTailwindConfig = html.includes('tailwind.config = {');
        console.log(`${hasTailwindConfig ? '✅' : '❌'} Tailwind configuration: ${hasTailwindConfig ? 'Present' : 'Missing'}`);
        
        // Check custom font definitions
        const hasOrbitron = html.includes("'orbitron': ['Orbitron'");
        const hasInter = html.includes("'inter': ['Inter'");
        console.log(`${hasOrbitron ? '✅' : '❌'} Orbitron font: ${hasOrbitron ? 'Configured' : 'Missing'}`);
        console.log(`${hasInter ? '✅' : '❌'} Inter font: ${hasInter ? 'Configured' : 'Missing'}`);
        
        // Check custom color definitions
        const hasBlazeColors = html.includes("'blaze-orange': '#FF6B35'") || html.includes("'blaze-orange': '#ff6b35'");
        console.log(`${hasBlazeColors ? '✅' : '❌'} Brand colors: ${hasBlazeColors ? 'Configured' : 'Missing'}`);
        
        // Check command center styling
        const hasCommandPanels = html.includes('command-panel');
        const hasGlassPanes = html.includes('glass-pane');
        console.log(`${hasCommandPanels ? '✅' : '❌'} Command panels: ${hasCommandPanels ? 'Applied' : 'Missing'}`);
        console.log(`${hasGlassPanes ? '✅' : '❌'} Glass panes: ${hasGlassPanes ? 'Applied' : 'Missing'}`);
        
        // Check font class usage
        const usesFontOrbitron = html.includes('font-orbitron');
        const usesFontInter = html.includes('font-inter');
        console.log(`${usesFontOrbitron ? '✅' : '❌'} Orbitron usage: ${usesFontOrbitron ? 'Applied' : 'Missing'}`);
        console.log(`${usesFontInter ? '✅' : '❌'} Inter font usage: ${usesFontInter ? 'Applied' : 'Missing'}`);
        
        // Check gradient text styling
        const hasGradientText = html.includes('gradient-text');
        console.log(`${hasGradientText ? '✅' : '❌'} Gradient text: ${hasGradientText ? 'Applied' : 'Missing'}`);
        
        // Count visual elements
        const commandPanels = (html.match(/command-panel/g) || []).length;
        const statusIndicators = (html.match(/status-indicator/g) || []).length;
        
        console.log('');
        console.log('METRICS:');
        console.log(`Command panels: ${commandPanels}`);
        console.log(`Status indicators: ${statusIndicators}`);
        console.log(`Page size: ${Math.round(html.length / 1024)}KB`);
        
        // Overall score
        const checks = [hasTailwindConfig, hasOrbitron, hasInter, hasBlazeColors, hasCommandPanels, hasGlassPanes, usesFontOrbitron, hasGradientText];
        const passed = checks.filter(Boolean).length;
        const score = Math.round((passed / checks.length) * 100);
        
        console.log('');
        console.log('NEXT:');
        console.log(`🎨 Visual validation: ${passed}/${checks.length} (${score}%)`);
        console.log(`Site URL: ${PROD_URL}`);
        
        return score === 100;
        
    } catch (error) {
        console.error('❌ Visual validation failed:', error.message);
        return false;
    }
}

validatePage().then(success => {
    process.exit(success ? 0 : 1);
});