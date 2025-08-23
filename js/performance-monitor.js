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
