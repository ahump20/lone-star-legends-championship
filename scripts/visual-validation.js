#!/usr/bin/env node

/**
 * Visual validation - Test CSS framework loading and styling
 */

const PROD_URL = 'https://18adea55.blaze-intelligence-lsl.pages.dev';

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
        const hasSpaceGrotesk = html.includes("'space': ['Space Grotesk'");
        const hasInter = html.includes("'inter': ['Inter'");
        console.log(`${hasSpaceGrotesk ? '✅' : '❌'} Space Grotesk font: ${hasSpaceGrotesk ? 'Configured' : 'Missing'}`);
        console.log(`${hasInter ? '✅' : '❌'} Inter font: ${hasInter ? 'Configured' : 'Missing'}`);
        
        // Check custom color definitions
        const hasBlazeColors = html.includes("'blaze-orange': '#FF6B35'");
        console.log(`${hasBlazeColors ? '✅' : '❌'} Brand colors: ${hasBlazeColors ? 'Configured' : 'Missing'}`);
        
        // Check glass effect styling
        const hasGlassEffect = html.includes('glass-effect');
        console.log(`${hasGlassEffect ? '✅' : '❌'} Glass morphism: ${hasGlassEffect ? 'Applied' : 'Missing'}`);
        
        // Check font class usage
        const usesFontSpace = html.includes('font-space');
        const usesFontInter = html.includes('font-inter');
        console.log(`${usesFontSpace ? '✅' : '❌'} Space Grotesk usage: ${usesFontSpace ? 'Applied' : 'Missing'}`);
        console.log(`${usesFontInter ? '✅' : '❌'} Inter font usage: ${usesFontInter ? 'Applied' : 'Missing'}`);
        
        // Check gradient text styling
        const hasGradientText = html.includes('gradient-text');
        console.log(`${hasGradientText ? '✅' : '❌'} Gradient text: ${hasGradientText ? 'Applied' : 'Missing'}`);
        
        // Count visual elements
        const glassCards = (html.match(/glass-effect/g) || []).length;
        const metricCards = (html.match(/metric-card/g) || []).length;
        
        console.log('');
        console.log('METRICS:');
        console.log(`Glass effect elements: ${glassCards}`);
        console.log(`Metric cards: ${metricCards}`);
        console.log(`Page size: ${Math.round(html.length / 1024)}KB`);
        
        // Overall score
        const checks = [hasTailwindConfig, hasSpaceGrotesk, hasInter, hasBlazeColors, hasGlassEffect, usesFontSpace, usesFontInter, hasGradientText];
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