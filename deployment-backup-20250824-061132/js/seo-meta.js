/**
 * SEO Meta Tags Manager
 * Dynamically updates meta tags for better SEO
 */

const SEOMeta = {
    pages: {
        '/': {
            title: 'Blaze Intelligence - Championship Sports Analytics Platform',
            description: 'Experience the future of sports analytics with AI-powered performance insights, NIL valuation, and championship-level intelligence. Where cognitive performance meets quarterly performance.',
            keywords: 'sports analytics, AI, NIL valuation, championship analytics, baseball simulation, sports intelligence',
            ogImage: '/images/og-home-1200x630.jpg'
        },
        '/index-corporate': {
            title: 'Enterprise Sports Analytics | Blaze Intelligence',
            description: 'Transform your organization with championship-level sports analytics. 94.6% prediction accuracy, real-time insights, and AI-powered decision making for enterprise clients.',
            keywords: 'enterprise sports analytics, business intelligence, AI analytics, sports data platform, championship performance',
            ogImage: '/images/og-corporate-1200x630.jpg'
        },
        '/nil-trust-dashboard': {
            title: 'NIL Valuation Dashboard | Blaze Intelligence',
            description: 'Track Name, Image, Likeness (NIL) valuations with AI-powered champion trait analysis. Real-time athlete performance metrics and market insights.',
            keywords: 'NIL valuation, athlete analytics, sports marketing, champion traits, college athletics',
            ogImage: '/images/og-nil-1200x630.jpg'
        },
        '/client-onboarding': {
            title: 'Get Started | Blaze Intelligence',
            description: 'Join the revolution in sports analytics. Start your free trial and unlock championship-level insights for your organization.',
            keywords: 'sports analytics trial, client onboarding, sports intelligence platform',
            ogImage: '/images/og-onboarding-1200x630.jpg'
        },
        '/statistics-dashboard': {
            title: 'Live Statistics Dashboard | Blaze Intelligence',
            description: 'Real-time sports statistics powered by Champion Enigma Engine. Live game data, performance metrics, and predictive analytics.',
            keywords: 'live sports statistics, real-time analytics, game data, baseball statistics',
            ogImage: '/images/og-stats-1200x630.jpg'
        },
        '/multiplayer-client': {
            title: 'Multiplayer Baseball Game | Blaze Intelligence',
            description: 'Play championship-level baseball with AI-powered opponents. Multiplayer simulation with real analytics and performance tracking.',
            keywords: 'baseball game, multiplayer sports, AI opponents, sports simulation',
            ogImage: '/images/og-game-1200x630.jpg'
        }
    },

    init() {
        const path = window.location.pathname;
        const pageData = this.pages[path] || this.pages['/'];
        
        this.updateMetaTags(pageData);
        this.addStructuredData(pageData);
    },

    updateMetaTags(data) {
        // Update title
        document.title = data.title;
        
        // Update or create meta tags
        this.setMetaTag('description', data.description);
        this.setMetaTag('keywords', data.keywords);
        
        // Open Graph tags
        this.setMetaProperty('og:title', data.title);
        this.setMetaProperty('og:description', data.description);
        this.setMetaProperty('og:image', data.ogImage);
        this.setMetaProperty('og:url', window.location.href);
        this.setMetaProperty('og:type', 'website');
        this.setMetaProperty('og:site_name', 'Blaze Intelligence');
        
        // Twitter Card tags
        this.setMetaProperty('twitter:card', 'summary_large_image');
        this.setMetaProperty('twitter:title', data.title);
        this.setMetaProperty('twitter:description', data.description);
        this.setMetaProperty('twitter:image', data.ogImage);
        
        // Additional SEO tags
        this.setMetaTag('robots', 'index, follow');
        this.setMetaTag('author', 'Austin Humphrey');
        this.setMetaTag('viewport', 'width=device-width, initial-scale=1.0');
        this.setMetaProperty('article:publisher', 'https://blaze-intelligence.pages.dev');
    },

    setMetaTag(name, content) {
        let meta = document.querySelector(`meta[name="${name}"]`);
        if (!meta) {
            meta = document.createElement('meta');
            meta.name = name;
            document.head.appendChild(meta);
        }
        meta.content = content;
    },

    setMetaProperty(property, content) {
        let meta = document.querySelector(`meta[property="${property}"]`);
        if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute('property', property);
            document.head.appendChild(meta);
        }
        meta.content = content;
    },

    addStructuredData(data) {
        const structuredData = {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Blaze Intelligence",
            "description": data.description,
            "url": window.location.href,
            "applicationCategory": "SportsApplication",
            "operatingSystem": "Web",
            "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
            },
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "ratingCount": "127"
            },
            "creator": {
                "@type": "Person",
                "name": "Austin Humphrey",
                "email": "ahump20@outlook.com"
            }
        };

        // Remove existing structured data
        const existingScript = document.querySelector('script[type="application/ld+json"]');
        if (existingScript && existingScript.textContent.includes('SoftwareApplication')) {
            existingScript.remove();
        }

        // Add new structured data
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(structuredData);
        document.head.appendChild(script);
    }
};

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SEOMeta.init());
} else {
    SEOMeta.init();
}