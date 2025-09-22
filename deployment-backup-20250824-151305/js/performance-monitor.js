/**
 * Blaze Intelligence Performance Monitor
 * Real-time performance tracking and optimization
 */

class PerformanceMonitor {
    constructor() {
        this.metrics = {};
        this.thresholds = {
            lcp: 2500,    // Largest Contentful Paint
            fid: 100,     // First Input Delay  
            cls: 0.1,     // Cumulative Layout Shift
            ttfb: 600,    // Time to First Byte
            fcp: 1800     // First Contentful Paint
        };
        this.alerts = [];
        this.init();
    }

    init() {
        this.measureWebVitals();
        this.monitorResourceLoading();
        this.trackMemoryUsage();
        this.monitorNetworkQuality();
        this.setupPerformanceReporting();
        console.log('🔥 Performance Monitor active');
    }

    measureWebVitals() {
        // Largest Contentful Paint
        new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            this.metrics.lcp = lastEntry.startTime;
            this.evaluateMetric('lcp', lastEntry.startTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay
        new PerformanceObserver((list) => {
            const firstInput = list.getEntries()[0];
            if (firstInput) {
                const fid = firstInput.processingStart - firstInput.startTime;
                this.metrics.fid = fid;
                this.evaluateMetric('fid', fid);
            }
        }).observe({ type: 'first-input', buffered: true });

        // Cumulative Layout Shift
        let cumulativeLayoutShiftScore = 0;
        new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (!entry.hadRecentInput) {
                    cumulativeLayoutShiftScore += entry.value;
                }
            }
            this.metrics.cls = cumulativeLayoutShiftScore;
            this.evaluateMetric('cls', cumulativeLayoutShiftScore);
        }).observe({ type: 'layout-shift', buffered: true });

        // First Contentful Paint
        new PerformanceObserver((list) => {
            const entries = list.getEntries();
            if (entries.length > 0) {
                this.metrics.fcp = entries[0].startTime;
                this.evaluateMetric('fcp', entries[0].startTime);
            }
        }).observe({ entryTypes: ['paint'] });
    }

    monitorResourceLoading() {
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                // Track slow resources
                if (entry.duration > 2000) {
                    this.addAlert('slow_resource', {
                        resource: entry.name,
                        duration: entry.duration,
                        type: entry.initiatorType,
                        size: entry.transferSize || 0
                    });
                }

                // Track failed resources
                if (entry.responseStatus >= 400) {
                    this.addAlert('failed_resource', {
                        resource: entry.name,
                        status: entry.responseStatus,
                        type: entry.initiatorType
                    });
                }

                // Track large resources
                if (entry.transferSize > 1024 * 1024) { // 1MB
                    this.addAlert('large_resource', {
                        resource: entry.name,
                        size: entry.transferSize,
                        type: entry.initiatorType,
                        duration: entry.duration
                    });
                }
            }
        });
        observer.observe({ entryTypes: ['resource'] });
    }

    trackMemoryUsage() {
        if ('memory' in performance) {
            setInterval(() => {
                const memory = performance.memory;
                this.metrics.memory = {
                    used: memory.usedJSHeapSize,
                    total: memory.totalJSHeapSize,
                    limit: memory.jsHeapSizeLimit,
                    usage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
                };

                // Alert if memory usage is high
                if (this.metrics.memory.usage > 80) {
                    this.addAlert('high_memory_usage', {
                        usage: this.metrics.memory.usage,
                        used: memory.usedJSHeapSize,
                        limit: memory.jsHeapSizeLimit
                    });
                }
            }, 10000); // Check every 10 seconds
        }
    }

    monitorNetworkQuality() {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            
            this.metrics.network = {
                effectiveType: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt,
                saveData: connection.saveData
            };

            // Adapt to network conditions
            if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
                this.addAlert('slow_network', {
                    type: connection.effectiveType,
                    downlink: connection.downlink,
                    rtt: connection.rtt
                });
                
                // Implement network-aware optimizations
                this.optimizeForSlowNetwork();
            }

            connection.addEventListener('change', () => {
                this.metrics.network.effectiveType = connection.effectiveType;
                this.metrics.network.downlink = connection.downlink;
                this.metrics.network.rtt = connection.rtt;
            });
        }
    }

    optimizeForSlowNetwork() {
        // Reduce image quality
        document.querySelectorAll('img').forEach(img => {
            if (img.dataset.lowBandwidth) {
                img.src = img.dataset.lowBandwidth;
            }
        });

        // Defer non-critical scripts
        document.querySelectorAll('script[data-defer-slow]').forEach(script => {
            script.defer = true;
        });

        // Disable autoplay videos
        document.querySelectorAll('video[autoplay]').forEach(video => {
            video.removeAttribute('autoplay');
            video.preload = 'none';
        });
    }

    setupPerformanceReporting() {
        // Send performance report on page unload
        window.addEventListener('beforeunload', () => {
            this.sendPerformanceReport();
        });

        // Send periodic reports
        setInterval(() => {
            this.sendPerformanceReport();
        }, 60000); // Every minute
    }

    evaluateMetric(metric, value) {
        const threshold = this.thresholds[metric];
        let status = 'good';
        
        switch (metric) {
            case 'lcp':
                if (value > 4000) status = 'poor';
                else if (value > threshold) status = 'needs_improvement';
                break;
            case 'fid':
                if (value > 300) status = 'poor';
                else if (value > threshold) status = 'needs_improvement';
                break;
            case 'cls':
                if (value > 0.25) status = 'poor';
                else if (value > threshold) status = 'needs_improvement';
                break;
            case 'fcp':
                if (value > 3000) status = 'poor';
                else if (value > threshold) status = 'needs_improvement';
                break;
        }

        this.metrics[metric + '_status'] = status;

        if (status === 'poor') {
            this.addAlert('poor_web_vital', {
                metric: metric.toUpperCase(),
                value: value,
                threshold: threshold,
                status: status
            });
        }
    }

    addAlert(type, data) {
        const alert = {
            type: type,
            data: data,
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent.split(' ')[0] // Simplified UA
        };
        
        this.alerts.push(alert);
        
        // Keep only last 50 alerts
        if (this.alerts.length > 50) {
            this.alerts = this.alerts.slice(-50);
        }

        console.warn(`Performance Alert [${type}]:`, data);
    }

    async sendPerformanceReport() {
        try {
            const report = {
                metrics: this.metrics,
                alerts: this.alerts,
                navigation: this.getNavigationTiming(),
                resources: this.getResourceTiming(),
                timestamp: Date.now(),
                page: {
                    url: window.location.href,
                    title: document.title,
                    referrer: document.referrer
                },
                device: {
                    viewport: {
                        width: window.innerWidth,
                        height: window.innerHeight
                    },
                    screen: {
                        width: screen.width,
                        height: screen.height
                    },
                    devicePixelRatio: window.devicePixelRatio,
                    connection: this.metrics.network
                }
            };

            // Send to analytics endpoint
            await fetch('/api/performance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(report),
                keepalive: true
            });

            // Clear alerts after sending
            this.alerts = [];
        } catch (error) {
            console.debug('Performance report failed:', error);
        }
    }

    getNavigationTiming() {
        const navigation = performance.getEntriesByType('navigation')[0];
        if (!navigation) return null;

        return {
            dns: navigation.domainLookupEnd - navigation.domainLookupStart,
            connection: navigation.connectEnd - navigation.connectStart,
            ttfb: navigation.responseStart - navigation.requestStart,
            download: navigation.responseEnd - navigation.responseStart,
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            load: navigation.loadEventEnd - navigation.loadEventStart,
            total: navigation.loadEventEnd - navigation.navigationStart
        };
    }

    getResourceTiming() {
        const resources = performance.getEntriesByType('resource');
        const summary = {
            total: resources.length,
            types: {},
            slowest: [],
            largest: []
        };

        resources.forEach(resource => {
            const type = resource.initiatorType || 'other';
            if (!summary.types[type]) {
                summary.types[type] = { count: 0, totalSize: 0, totalDuration: 0 };
            }
            
            summary.types[type].count++;
            summary.types[type].totalSize += resource.transferSize || 0;
            summary.types[type].totalDuration += resource.duration || 0;
        });

        // Get top 5 slowest resources
        summary.slowest = resources
            .sort((a, b) => b.duration - a.duration)
            .slice(0, 5)
            .map(r => ({
                name: r.name.split('/').pop(),
                duration: r.duration,
                size: r.transferSize || 0,
                type: r.initiatorType
            }));

        // Get top 5 largest resources
        summary.largest = resources
            .filter(r => r.transferSize > 0)
            .sort((a, b) => b.transferSize - a.transferSize)
            .slice(0, 5)
            .map(r => ({
                name: r.name.split('/').pop(),
                size: r.transferSize,
                duration: r.duration,
                type: r.initiatorType
            }));

        return summary;
    }

    // Public API methods
    getScore() {
        const scores = {
            lcp: this.getMetricScore('lcp'),
            fid: this.getMetricScore('fid'),
            cls: this.getMetricScore('cls'),
            fcp: this.getMetricScore('fcp')
        };
        
        const average = Object.values(scores).reduce((sum, score) => sum + score, 0) / 4;
        return Math.round(average);
    }

    getMetricScore(metric) {
        const status = this.metrics[metric + '_status'];
        switch (status) {
            case 'good': return 100;
            case 'needs_improvement': return 70;
            case 'poor': return 30;
            default: return 0;
        }
    }

    getRecommendations() {
        const recommendations = [];
        
        if (this.metrics.lcp_status === 'poor') {
            recommendations.push('Optimize images and reduce server response time to improve LCP');
        }
        
        if (this.metrics.fid_status === 'poor') {
            recommendations.push('Reduce JavaScript execution time to improve FID');
        }
        
        if (this.metrics.cls_status === 'poor') {
            recommendations.push('Set dimensions for images and ads to reduce CLS');
        }
        
        if (this.metrics.memory && this.metrics.memory.usage > 80) {
            recommendations.push('Optimize memory usage - consider lazy loading and cleanup');
        }
        
        return recommendations;
    }

    displayPerformanceWidget() {
        const widget = document.createElement('div');
        widget.id = 'performance-widget';
        widget.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 15px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 12px;
            z-index: 10000;
            min-width: 200px;
            backdrop-filter: blur(10px);
            border: 1px solid #FF6B35;
        `;
        
        const updateWidget = () => {
            const score = this.getScore();
            const scoreColor = score >= 90 ? '#4CAF50' : score >= 70 ? '#FF9800' : '#F44336';
            
            widget.innerHTML = `
                <div style="margin-bottom: 10px; font-weight: bold; color: ${scoreColor}">
                    Performance Score: ${score}/100
                </div>
                <div>LCP: ${(this.metrics.lcp || 0).toFixed(0)}ms</div>
                <div>FID: ${(this.metrics.fid || 0).toFixed(0)}ms</div>
                <div>CLS: ${(this.metrics.cls || 0).toFixed(3)}</div>
                <div>Memory: ${this.metrics.memory ? this.metrics.memory.usage.toFixed(1) + '%' : 'N/A'}</div>
                <div>Alerts: ${this.alerts.length}</div>
            `;
        };
        
        document.body.appendChild(widget);
        updateWidget();
        setInterval(updateWidget, 1000);
        
        // Click to hide/show
        widget.addEventListener('click', () => {
            widget.style.display = widget.style.display === 'none' ? 'block' : 'none';
        });
    }
}

// Initialize performance monitor
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.performanceMonitor = new PerformanceMonitor();
        
        // Show widget in development
        if (window.location.hostname === 'localhost' || window.location.search.includes('debug=true')) {
            setTimeout(() => window.performanceMonitor.displayPerformanceWidget(), 2000);
        }
    });
} else {
    window.performanceMonitor = new PerformanceMonitor();
    
    if (window.location.hostname === 'localhost' || window.location.search.includes('debug=true')) {
        setTimeout(() => window.performanceMonitor.displayPerformanceWidget(), 2000);
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceMonitor;
}