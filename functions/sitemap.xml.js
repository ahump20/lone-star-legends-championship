/**
 * Dynamic Sitemap Generator
 * Creates XML sitemap for better SEO
 */

export async function onRequest(context) {
    const baseURL = 'https://blaze-intelligence.pages.dev';
    
    const pages = [
        { url: '/', changefreq: 'daily', priority: '1.0' },
        { url: '/index-corporate', changefreq: 'weekly', priority: '0.9' },
        { url: '/client-onboarding', changefreq: 'monthly', priority: '0.8' },
        { url: '/nil-trust-dashboard', changefreq: 'daily', priority: '0.8' },
        { url: '/statistics-dashboard', changefreq: 'daily', priority: '0.7' },
        { url: '/presentations', changefreq: 'weekly', priority: '0.6' },
        { url: '/multiplayer-client', changefreq: 'weekly', priority: '0.6' },
        { url: '/game.html', changefreq: 'weekly', priority: '0.5' },
        { url: '/cms-admin', changefreq: 'monthly', priority: '0.3' }
    ];
    
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${pages.map(page => `    <url>
        <loc>${baseURL}${page.url}</loc>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
        <changefreq>${page.changefreq}</changefreq>
        <priority>${page.priority}</priority>
    </url>`).join('\n')}
</urlset>`;

    return new Response(sitemap, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
        }
    });
}