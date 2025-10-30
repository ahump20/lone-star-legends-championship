/**
 * Blaze Intelligence Performance Monitor
 * Real-time performance tracking and optimization
 */

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            lcp: 0,
            fid: 0,
            cls: 0,
            ttfb: 0,
            fps: 0
        };
        this.init();
    }

    init() {

        // Largest Contentful Paint
        new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            this.metrics.lcp = lastEntry.startTime;

        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay
        new PerformanceObserver((list) => {
            const firstInput = list.getEntries()[0];
            if (firstInput) {
                this.metrics.fid = firstInput.processingStart - firstInput.startTime;
            }
        }).observe({ entryTypes: ['first-input'] });

        // Cumulative Layout Shift
        new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (!entry.hadRecentInput) {
                    this.metrics.cls += entry.value;
                }
            }
        }).observe({ entryTypes: ['layout-shift'] });

        // Time to First Byte
        const navTiming = performance.getEntriesByType('navigation')[0];
        if (navTiming) {
            this.metrics.ttfb = navTiming.responseStart - navTiming.requestStart;
        }
    }

    getMetrics() {
        return this.metrics;
    }

    reportMetrics() {
        console.log('Performance Metrics:', this.metrics);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceMonitor;
}
