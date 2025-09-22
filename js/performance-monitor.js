/**
 * Blaze Intelligence Performance Monitor
 * Real-time performance tracking and optimization
 */
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