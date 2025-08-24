/**
 * Client-side redirect handler for legacy URLs
 * Handles 301 redirects when server-side redirects are not working
 */

const REDIRECT_MAP = {
  // Analytics Hub Redirects
  '/statistics-dashboard-enhanced.html': '/analytics/dashboard/',
  '/statistics-dashboard.html': '/analytics/dashboard/',
  '/nil-trust-dashboard.html': '/analytics/nil-valuation/',
  '/blaze-analytics-integration.html': '/analytics/real-time/',
  '/cee-scorecard.html': '/analytics/scorecard/',
  
  // Games & Interactive Demos Redirects
  '/game.html': '/games/baseball/',
  '/claude-baseball-demo.html': '/games/baseball/',
  '/blaze-branded-game.html': '/games/baseball/',
  '/lone-star-legends-game.html': '/games/baseball/',
  
  // Company & Presentations Redirects
  '/presentations.html': '/company/presentations/',
  '/blaze-portfolio-showcase.html': '/company/presentations/',
  
  // Client & Onboarding Redirects
  '/client-onboarding-enhanced.html': '/onboarding/',
  '/client-onboarding.html': '/onboarding/',
  
  // Capabilities Redirects
  '/ai-command-center.html': '/capabilities/',
  '/3d-biometric-viewer.html': '/capabilities/',
  
  // Pricing & Business Redirects
  '/pricing.html': '/pricing/',
  
  // CMS & Admin Redirects
  '/cms-admin.html': '/resources/',
  
  // Integration & API Redirects
  '/integration-hub.html': '/resources/integrations/',
  
  // Competitive Analysis Redirects
  '/competitive-analysis.html': '/company/competitive-analysis/',
  
  // Team & Contact Redirects
  '/team-showcase.html': '/company/team/',
  
  // Demo & Trial Redirects
  '/demo.html': '/games/',
  '/trial.html': '/pricing/',
};

function handleLegacyRedirects() {
  const currentPath = window.location.pathname;
  
  // Check if current path needs to be redirected
  if (REDIRECT_MAP[currentPath]) {
    const redirectTo = REDIRECT_MAP[currentPath];
    console.log(`Redirecting ${currentPath} -> ${redirectTo}`);
    
    // Track the redirect for analytics
    if (typeof gtag === 'function') {
      gtag('event', 'legacy_url_redirect', {
        from_url: currentPath,
        to_url: redirectTo,
        redirect_type: 'client_side_301'
      });
    }
    
    // Perform the redirect
    window.location.replace(redirectTo);
    return true;
  }
  
  return false;
}

// Handle redirects immediately when page loads
if (handleLegacyRedirects()) {
  // Redirect happened, stop further execution
  throw new Error('Redirecting...');
}

// Export for use in other modules if needed
window.BlazeRedirects = {
  handleLegacyRedirects,
  REDIRECT_MAP
};

console.log('Blaze Intelligence redirect handler initialized');