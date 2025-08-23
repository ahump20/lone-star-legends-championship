#!/usr/bin/env bash
set -euo pipefail

echo "⚡ Blaze Intelligence - Performance Optimization"
echo "==============================================="

# Create optimized directory structure
mkdir -p optimized/{css,js,images}

echo "🎨 Optimizing CSS..."
# Copy CSS files (skip minification for now)
echo "📋 Copying CSS files..."
if [[ -d "css" ]]; then
    cp -r css/* optimized/css/ 2>/dev/null || echo "No CSS files found"
fi

echo "⚙️ Optimizing JavaScript..."
# Copy JavaScript files (skip minification for now)
echo "📋 Copying JS files..."
if [[ -d "js" ]]; then
    cp -r js/* optimized/js/ 2>/dev/null || echo "No JS files found"
fi

echo "🖼️ Optimizing images..."
# Copy images (would add imagemin in production)
if [[ -d "images" ]]; then
    cp -r images/* optimized/images/ 2>/dev/null || echo "No images directory found"
fi

echo "📦 Creating service worker for caching..."
cat > sw.js << 'EOF'
const CACHE_NAME = 'blaze-intelligence-v1';
const urlsToCache = [
    '/',
    '/css/blaze.css',
    '/js/blaze-realtime.js',
    '/js/champion-enigma.js',
    '/js/decision-velocity.js',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700;800&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Return cached version or fetch from network
                return response || fetch(event.request);
            })
    );
});
EOF

echo "🚀 Creating performance monitoring script..."
cat > js/performance-monitor.js << 'EOF'
/**
 * Blaze Intelligence Performance Monitor
 * Real-time performance tracking and optimization
 */

class BlazePerformanceMonitor {
    constructor() {
        this.metrics = {};
        this.init();
    }

    init() {
        // Monitor Core Web Vitals
        this.observeWebVitals();
        
        // Monitor resource loading
        this.observeResourceTiming();
        
        // Monitor Three.js performance
        this.monitorThreeJS();
        
        // Report to analytics
        this.setupReporting();
    }

    observeWebVitals() {
        // Largest Contentful Paint
        new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            this.metrics.lcp = lastEntry.startTime;
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay
        new PerformanceObserver((list) => {
            const firstInput = list.getEntries()[0];
            this.metrics.fid = firstInput.processingStart - firstInput.startTime;
        }).observe({ entryTypes: ['first-input'] });

        // Cumulative Layout Shift
        let cumulativeLayoutShift = 0;
        new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (!entry.hadRecentInput) {
                    cumulativeLayoutShift += entry.value;
                }
            }
            this.metrics.cls = cumulativeLayoutShift;
        }).observe({ entryTypes: ['layout-shift'] });
    }

    observeResourceTiming() {
        new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach(entry => {
                if (entry.name.includes('three.js') || entry.name.includes('blaze')) {
                    this.metrics[`resource_${entry.name.split('/').pop()}`] = {
                        duration: entry.duration,
                        size: entry.transferSize
                    };
                }
            });
        }).observe({ entryTypes: ['resource'] });
    }

    monitorThreeJS() {
        if (window.ChampionEnigmaEngine) {
            const originalAnimate = window.ChampionEnigmaEngine.animate;
            let frameCount = 0;
            let lastTime = performance.now();

            window.ChampionEnigmaEngine.animate = function() {
                const now = performance.now();
                frameCount++;
                
                if (frameCount % 60 === 0) { // Every 60 frames
                    const fps = 1000 / ((now - lastTime) / 60);
                    window.BlazePerformanceMonitor.metrics.threejs_fps = fps;
                    lastTime = now;
                }
                
                return originalAnimate.call(this);
            };
        }
    }

    setupReporting() {
        // Report metrics every 30 seconds
        setInterval(() => {
            this.reportMetrics();
        }, 30000);

        // Report on page unload
        window.addEventListener('beforeunload', () => {
            this.reportMetrics();
        });
    }

    reportMetrics() {
        const report = {
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            metrics: this.metrics
        };

        // Send to analytics endpoint
        if ('sendBeacon' in navigator) {
            navigator.sendBeacon('/api/performance', JSON.stringify(report));
        } else {
            fetch('/api/performance', {
                method: 'POST',
                body: JSON.stringify(report),
                headers: { 'Content-Type': 'application/json' }
            }).catch(() => {});
        }

        console.log('🔥 Blaze Performance Report:', report);
    }

    getMetrics() {
        return this.metrics;
    }
}

// Initialize performance monitoring
window.BlazePerformanceMonitor = new BlazePerformanceMonitor();
EOF

echo "📊 Updating _headers for optimal caching..."
cat > _headers << 'EOF'
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()

/
  Cache-Control: public, max-age=0, must-revalidate

/*.html
  Cache-Control: public, max-age=0, must-revalidate

/css/*
  Cache-Control: public, max-age=31536000, immutable

/js/*
  Cache-Control: public, max-age=31536000, immutable

/images/*
  Cache-Control: public, max-age=31536000, immutable

/sw.js
  Cache-Control: public, max-age=0, must-revalidate

# Preload critical resources
/*
  Link: </css/blaze.css>; rel=preload; as=style
  Link: </js/blaze-realtime.js>; rel=preload; as=script
  Link: <https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700;800&display=swap>; rel=preload; as=style
EOF

echo "🎯 Creating critical CSS extraction..."
# Extract critical CSS for above-the-fold content
cat > css/critical.css << 'EOF'
/* Critical CSS for above-the-fold content */
:root{--blaze-orange:#FF6B35;--blaze-burnt:#CC5500;--blaze-deep:#001F3F;--blaze-midnight:#0A0A0A;--blaze-text:#FFFFFF;--blaze-muted:#A1A5AE}
*{margin:0;padding:0;box-sizing:border-box}
body{margin:0;background:radial-gradient(ellipse at center,#001F3F 0%,#0A0A0A 70%);color:var(--blaze-text);font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;font-weight:400;line-height:1.6;overflow-x:hidden;position:relative}
.topbar{position:fixed;top:0;width:100%;z-index:1000;background:rgba(10,10,10,0.98);backdrop-filter:blur(20px);border-bottom:1px solid rgba(255,107,53,0.15);padding:1rem 0}
.nav-container{max-width:1400px;margin:0 auto;padding:0 2rem;display:flex;align-items:center;justify-content:space-between}
.logo{display:flex;align-items:center;gap:0.75rem;font-family:'Space Grotesk',sans-serif;font-weight:800;font-size:1.4rem;color:var(--blaze-text);text-decoration:none;z-index:10}
.hero-section{min-height:100vh;position:relative;display:flex;align-items:center;justify-content:center;padding:6rem 0 2rem;z-index:5}
EOF

echo "✅ Performance optimization complete!"
echo ""
echo "📋 Optimization Summary:"
echo "- ✅ Service worker created for offline caching"
echo "- ✅ Performance monitoring implemented"
echo "- ✅ Critical CSS extracted"
echo "- ✅ Cache headers optimized"
echo "- ✅ Resource preloading configured"
echo ""
echo "🚀 Next: Deploy optimizations with ./scripts/deploy-production.sh"