/**
 * Mobile Utilities
 * Device detection, performance optimization, and mobile-specific helpers
 */

class MobileUtils {
    constructor() {
        this.deviceInfo = this.detectDevice();
        this.performance = this.detectPerformance();
    }

    /**
     * Detect device type and capabilities
     */
    detectDevice() {
        const ua = navigator.userAgent;

        return {
            // Device type
            isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua),
            isTablet: /iPad|Android(?!.*Mobile)/i.test(ua),
            isDesktop: !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua),

            // OS
            isIOS: /iPad|iPhone|iPod/.test(ua),
            isAndroid: /Android/.test(ua),

            // Browser
            isSafari: /^((?!chrome|android).)*safari/i.test(ua),
            isChrome: /Chrome/.test(ua),
            isFirefox: /Firefox/.test(ua),

            // Screen
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            pixelRatio: window.devicePixelRatio || 1,
            orientation: window.screen.orientation?.type || 'unknown',

            // Capabilities
            hasTouchScreen: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
            hasGyroscope: 'DeviceOrientationEvent' in window,
            hasAccelerometer: 'DeviceMotionEvent' in window,
            hasVibration: 'vibrate' in navigator,
            hasServiceWorker: 'serviceWorker' in navigator,
            hasWebGL: this.checkWebGLSupport(),
            hasWebGL2: this.checkWebGL2Support(),

            // Memory
            deviceMemory: navigator.deviceMemory || null,
            hardwareConcurrency: navigator.hardwareConcurrency || null,

            // Network
            connection: this.getConnectionInfo()
        };
    }

    /**
     * Check WebGL support
     */
    checkWebGLSupport() {
        try {
            const canvas = document.createElement('canvas');
            return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
        } catch (e) {
            return false;
        }
    }

    /**
     * Check WebGL 2 support
     */
    checkWebGL2Support() {
        try {
            const canvas = document.createElement('canvas');
            return !!canvas.getContext('webgl2');
        } catch (e) {
            return false;
        }
    }

    /**
     * Get connection information
     */
    getConnectionInfo() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

        if (!connection) return null;

        return {
            effectiveType: connection.effectiveType,
            downlink: connection.downlink,
            rtt: connection.rtt,
            saveData: connection.saveData,
            type: connection.type
        };
    }

    /**
     * Detect device performance tier
     */
    detectPerformance() {
        const device = this.deviceInfo;

        let tier = 'medium';

        // High-end criteria
        if (
            device.hardwareConcurrency >= 8 &&
            device.deviceMemory >= 8 &&
            device.hasWebGL2 &&
            device.pixelRatio <= 2
        ) {
            tier = 'high';
        }

        // Low-end criteria
        else if (
            device.hardwareConcurrency <= 2 ||
            device.deviceMemory <= 2 ||
            !device.hasWebGL ||
            (device.connection && device.connection.saveData)
        ) {
            tier = 'low';
        }

        return {
            tier,
            ...this.getPerformanceMetrics()
        };
    }

    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        if (!window.performance) {
            return {};
        }

        const navigation = performance.getEntriesByType('navigation')[0];
        const paint = performance.getEntriesByType('paint');

        return {
            loadTime: navigation?.loadEventEnd - navigation?.fetchStart,
            domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.fetchStart,
            firstPaint: paint?.find(entry => entry.name === 'first-paint')?.startTime,
            firstContentfulPaint: paint?.find(entry => entry.name === 'first-contentful-paint')?.startTime,
            memory: performance.memory ? {
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
            } : null
        };
    }

    /**
     * Get recommended quality settings based on device
     */
    getRecommendedQuality() {
        const tier = this.performance.tier;
        const device = this.deviceInfo;

        const settings = {
            high: {
                resolution: 1.0,
                particles: true,
                shadows: true,
                antialiasing: true,
                maxParticles: 1000,
                textureQuality: 'high',
                effectsQuality: 'high'
            },
            medium: {
                resolution: 0.8,
                particles: true,
                shadows: false,
                antialiasing: true,
                maxParticles: 500,
                textureQuality: 'medium',
                effectsQuality: 'medium'
            },
            low: {
                resolution: 0.6,
                particles: false,
                shadows: false,
                antialiasing: false,
                maxParticles: 100,
                textureQuality: 'low',
                effectsQuality: 'low'
            }
        };

        // Adjust for high DPI screens
        if (device.pixelRatio > 2) {
            settings[tier].resolution *= 0.8;
        }

        // Adjust for small screens
        if (device.isMobile && device.screenWidth < 768) {
            settings[tier].resolution *= 0.9;
        }

        return settings[tier];
    }

    /**
     * Vibrate device
     */
    vibrate(pattern) {
        if (navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    }

    /**
     * Request wake lock to prevent screen sleep
     */
    async requestWakeLock() {
        if ('wakeLock' in navigator) {
            try {
                const wakeLock = await navigator.wakeLock.request('screen');
                console.log('Wake lock acquired');

                wakeLock.addEventListener('release', () => {
                    console.log('Wake lock released');
                });

                return wakeLock;

            } catch (error) {
                console.error('Wake lock request failed:', error);
                return null;
            }
        }

        return null;
    }

    /**
     * Request device orientation permission (iOS 13+)
     */
    async requestOrientationPermission() {
        if (typeof DeviceOrientationEvent !== 'undefined' &&
            typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                const permission = await DeviceOrientationEvent.requestPermission();
                return permission === 'granted';
            } catch (error) {
                console.error('Orientation permission request failed:', error);
                return false;
            }
        }

        return true; // No permission needed on non-iOS devices
    }

    /**
     * Get device orientation
     */
    getOrientation() {
        return window.screen.orientation?.type || (
            window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
        );
    }

    /**
     * Check if in fullscreen
     */
    isFullscreen() {
        return !!(
            document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement
        );
    }

    /**
     * Request fullscreen
     */
    async requestFullscreen(element = document.documentElement) {
        try {
            if (element.requestFullscreen) {
                await element.requestFullscreen();
            } else if (element.webkitRequestFullscreen) {
                await element.webkitRequestFullscreen();
            } else if (element.mozRequestFullScreen) {
                await element.mozRequestFullScreen();
            } else if (element.msRequestFullscreen) {
                await element.msRequestFullscreen();
            }

            return true;

        } catch (error) {
            console.error('Fullscreen request failed:', error);
            return false;
        }
    }

    /**
     * Exit fullscreen
     */
    async exitFullscreen() {
        try {
            if (document.exitFullscreen) {
                await document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                await document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                await document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                await document.msExitFullscreen();
            }

            return true;

        } catch (error) {
            console.error('Exit fullscreen failed:', error);
            return false;
        }
    }

    /**
     * Prevent mobile scrolling
     */
    preventScrolling() {
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.height = '100%';
    }

    /**
     * Allow mobile scrolling
     */
    allowScrolling() {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.height = '';
    }

    /**
     * Get safe area insets (for notches, rounded corners)
     */
    getSafeAreaInsets() {
        const style = getComputedStyle(document.documentElement);

        return {
            top: parseInt(style.getPropertyValue('env(safe-area-inset-top)')) || 0,
            right: parseInt(style.getPropertyValue('env(safe-area-inset-right)')) || 0,
            bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)')) || 0,
            left: parseInt(style.getPropertyValue('env(safe-area-inset-left)')) || 0
        };
    }

    /**
     * Optimize images based on device
     */
    optimizeImage(imageUrl, options = {}) {
        const device = this.deviceInfo;
        const quality = options.quality || this.getRecommendedQuality();

        // Calculate optimal dimensions
        const maxWidth = options.maxWidth || Math.min(device.screenWidth * device.pixelRatio, 2048);

        // Add query parameters for image optimization (if using CDN)
        const url = new URL(imageUrl, window.location.href);
        url.searchParams.set('w', maxWidth);
        url.searchParams.set('q', quality.textureQuality === 'high' ? 90 : quality.textureQuality === 'medium' ? 75 : 60);

        if (options.format) {
            url.searchParams.set('fm', options.format);
        }

        return url.toString();
    }

    /**
     * Load image with lazy loading
     */
    lazyLoadImage(img, src) {
        if ('loading' in HTMLImageElement.prototype) {
            // Native lazy loading
            img.loading = 'lazy';
            img.src = src;
        } else {
            // Intersection Observer fallback
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        img.src = src;
                        observer.unobserve(img);
                    }
                });
            });

            observer.observe(img);
        }
    }

    /**
     * Measure frame rate
     */
    measureFPS(duration = 1000) {
        return new Promise((resolve) => {
            let frames = 0;
            const startTime = performance.now();

            function tick() {
                frames++;
                const currentTime = performance.now();

                if (currentTime - startTime < duration) {
                    requestAnimationFrame(tick);
                } else {
                    const fps = Math.round((frames / duration) * 1000);
                    resolve(fps);
                }
            }

            requestAnimationFrame(tick);
        });
    }

    /**
     * Detect low battery
     */
    async getBatteryInfo() {
        if ('getBattery' in navigator) {
            try {
                const battery = await navigator.getBattery();

                return {
                    level: battery.level,
                    charging: battery.charging,
                    chargingTime: battery.chargingTime,
                    dischargingTime: battery.dischargingTime
                };

            } catch (error) {
                console.error('Battery API not available:', error);
                return null;
            }
        }

        return null;
    }

    /**
     * Should reduce performance based on battery
     */
    async shouldReducePerformance() {
        const battery = await this.getBatteryInfo();

        if (!battery) return false;

        // Reduce performance if:
        // - Battery is low (<20%) and not charging
        // - Save data mode is enabled
        return (battery.level < 0.2 && !battery.charging) ||
               (this.deviceInfo.connection && this.deviceInfo.connection.saveData);
    }

    /**
     * Copy to clipboard
     */
    async copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            try {
                await navigator.clipboard.writeText(text);
                return true;
            } catch (error) {
                console.error('Clipboard write failed:', error);
            }
        }

        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();

        try {
            const success = document.execCommand('copy');
            document.body.removeChild(textarea);
            return success;
        } catch (error) {
            document.body.removeChild(textarea);
            return false;
        }
    }

    /**
     * Share with Web Share API
     */
    async share(data) {
        if (!navigator.share) {
            console.warn('Web Share API not supported');
            return false;
        }

        try {
            await navigator.share(data);
            return true;
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Share failed:', error);
            }
            return false;
        }
    }

    /**
     * Log device info for debugging
     */
    logDeviceInfo() {
        console.group('Device Information');
        console.table(this.deviceInfo);
        console.groupEnd();

        console.group('Performance');
        console.table(this.performance);
        console.groupEnd();

        console.group('Recommended Quality');
        console.table(this.getRecommendedQuality());
        console.groupEnd();
    }
}

/**
 * Performance Monitor
 * Track FPS, memory, and performance over time
 */
class PerformanceMonitor {
    constructor(options = {}) {
        this.enabled = options.enabled !== false;
        this.sampleInterval = options.sampleInterval || 1000;
        this.maxSamples = options.maxSamples || 60;

        this.samples = [];
        this.lastSampleTime = 0;
        this.frameCount = 0;
        this.lastFrameTime = performance.now();

        if (this.enabled) {
            this.start();
        }
    }

    start() {
        this.enabled = true;
        this.tick();
    }

    stop() {
        this.enabled = false;
    }

    tick() {
        if (!this.enabled) return;

        this.frameCount++;
        const now = performance.now();

        // Sample at interval
        if (now - this.lastSampleTime >= this.sampleInterval) {
            const fps = Math.round((this.frameCount / (now - this.lastSampleTime)) * 1000);

            const sample = {
                timestamp: now,
                fps,
                memory: performance.memory ? {
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize
                } : null
            };

            this.samples.push(sample);

            // Limit samples
            if (this.samples.length > this.maxSamples) {
                this.samples.shift();
            }

            this.frameCount = 0;
            this.lastSampleTime = now;
        }

        requestAnimationFrame(() => this.tick());
    }

    getAverage() {
        if (this.samples.length === 0) return null;

        const sum = this.samples.reduce((acc, sample) => acc + sample.fps, 0);
        return Math.round(sum / this.samples.length);
    }

    getMin() {
        if (this.samples.length === 0) return null;
        return Math.min(...this.samples.map(s => s.fps));
    }

    getMax() {
        if (this.samples.length === 0) return null;
        return Math.max(...this.samples.map(s => s.fps));
    }

    getSummary() {
        return {
            average: this.getAverage(),
            min: this.getMin(),
            max: this.getMax(),
            samples: this.samples.length
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MobileUtils, PerformanceMonitor };
}
