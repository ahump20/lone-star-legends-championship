# Mobile Performance Improvements - Implementation Guide

This document contains code improvements for mobile performance. Apply these changes to the OG Remaster game.

## 1. Enhanced Canvas Scaling with DPI Support

**File: `apps/og-remaster/main.ts`**

Update `setupResponsiveCanvas()` method:

```typescript
private setupResponsiveCanvas(): void {
  const resizeCanvas = () => {
    const container = this.canvas.parentElement;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const aspectRatio = 1024 / 768;

    // Get device pixel ratio for HiDPI displays
    const dpr = window.devicePixelRatio || 1;

    let canvasWidth = containerRect.width;
    let canvasHeight = containerRect.height;

    // Maintain aspect ratio
    if (canvasWidth / canvasHeight > aspectRatio) {
      canvasWidth = canvasHeight * aspectRatio;
    } else {
      canvasHeight = canvasWidth / aspectRatio;
    }

    // Set display size (CSS pixels)
    this.canvas.style.width = canvasWidth + 'px';
    this.canvas.style.height = canvasHeight + 'px';

    // Set actual canvas resolution (physical pixels)
    this.canvas.width = canvasWidth * dpr;
    this.canvas.height = canvasHeight * dpr;

    // Scale context to match DPR
    this.ctx.scale(dpr, dpr);

    // Notify renderer of resize
    this.renderer.resize(canvasWidth, canvasHeight);
  };

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas(); // Initial sizing
}
```

## 2. Fix Analytics Memory Leak

**File: `apps/og-remaster/analytics/BlazeAnalytics.ts`**

Add visibility change handling to pause FPS tracking when tab is hidden:

```typescript
export class BlazeAnalytics {
  // ... existing code ...

  private rafId: number | null = null;
  private isTracking: boolean = true;

  constructor() {
    // ... existing initialization ...

    // Add visibility change listener
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseTracking();
      } else {
        this.resumeTracking();
      }
    });

    // Cleanup on unload
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });
  }

  private setupPerformanceTracking(): void {
    // Track FPS
    let lastTime = performance.now();
    let frames = 0;

    const measureFPS = () => {
      if (!this.isTracking) return;

      frames++;
      const currentTime = performance.now();

      if (currentTime >= lastTime + 1000) {
        const fps = Math.round((frames * 1000) / (currentTime - lastTime));
        this.performanceMetrics.fps.push(fps);

        // Keep only last 60 samples (1 minute at 1 sample/second)
        if (this.performanceMetrics.fps.length > 60) {
          this.performanceMetrics.fps.shift();
        }

        frames = 0;
        lastTime = currentTime;
      }

      // Store RAF ID for cleanup
      this.rafId = requestAnimationFrame(measureFPS);
    };

    measureFPS();

    // Track memory (if available)
    if ((performance as any).memory) {
      setInterval(() => {
        if (this.isTracking) {
          this.performanceMetrics.memoryUsage = (performance as any).memory.usedJSHeapSize;
        }
      }, 5000);
    }
  }

  public pauseTracking(): void {
    this.isTracking = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  public resumeTracking(): void {
    if (!this.isTracking) {
      this.isTracking = true;
      this.setupPerformanceTracking();
    }
  }

  public cleanup(): void {
    this.pauseTracking();
    if (this.batchTimer !== null) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }
    // Flush any remaining events
    this.flushEvents();
  }

  // ... rest of existing code ...
}
```

## 3. Add INP and FCP Tracking

**File: Create `apps/og-remaster/analytics/WebVitals.ts`**

```typescript
/**
 * Web Vitals Tracking
 * Tracks Core Web Vitals: LCP, FID, CLS, INP, FCP
 */

export interface WebVitalsMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

export class WebVitalsTracker {
  private metrics: Map<string, WebVitalsMetric> = new Map();
  private observers: Map<string, PerformanceObserver> = new Map();

  constructor() {
    this.initializeTracking();
  }

  private initializeTracking(): void {
    // Track FCP (First Contentful Paint)
    this.trackFCP();

    // Track LCP (Largest Contentful Paint)
    this.trackLCP();

    // Track CLS (Cumulative Layout Shift)
    this.trackCLS();

    // Track INP (Interaction to Next Paint)
    this.trackINP();

    // Track TTFB (Time to First Byte)
    this.trackTTFB();
  }

  private trackFCP(): void {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          const fcp = entry.startTime;
          this.recordMetric('FCP', fcp);
        }
      }
    });

    try {
      observer.observe({ type: 'paint', buffered: true });
      this.observers.set('FCP', observer);
    } catch (e) {
      console.warn('FCP tracking not supported');
    }
  }

  private trackLCP(): void {
    let lcpValue = 0;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as any;
      lcpValue = lastEntry.renderTime || lastEntry.loadTime;
      this.recordMetric('LCP', lcpValue);
    });

    try {
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
      this.observers.set('LCP', observer);
    } catch (e) {
      console.warn('LCP tracking not supported');
    }
  }

  private trackCLS(): void {
    let clsValue = 0;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as any) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          this.recordMetric('CLS', clsValue);
        }
      }
    });

    try {
      observer.observe({ type: 'layout-shift', buffered: true });
      this.observers.set('CLS', observer);
    } catch (e) {
      console.warn('CLS tracking not supported');
    }
  }

  private trackINP(): void {
    // INP (Interaction to Next Paint) - new metric replacing FID
    let worstINP = 0;

    // Track event timing
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as any) {
        // processingStart - startTime = input delay
        // processingEnd - processingStart = processing time
        // (next paint) - startTime = total interaction latency

        const interactionTime = entry.duration || 0;

        if (interactionTime > worstINP) {
          worstINP = interactionTime;
          this.recordMetric('INP', worstINP);
        }
      }
    });

    try {
      observer.observe({ type: 'event', buffered: true, durationThreshold: 16 });
      this.observers.set('INP', observer);
    } catch (e) {
      // Fallback to FID if INP not supported
      this.trackFID();
    }
  }

  private trackFID(): void {
    // FID (First Input Delay) - fallback for older browsers
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as any) {
        const fid = entry.processingStart - entry.startTime;
        this.recordMetric('FID', fid);
      }
    });

    try {
      observer.observe({ type: 'first-input', buffered: true });
      this.observers.set('FID', observer);
    } catch (e) {
      console.warn('FID tracking not supported');
    }
  }

  private trackTTFB(): void {
    const navTiming = performance.getEntriesByType('navigation')[0] as any;
    if (navTiming) {
      const ttfb = navTiming.responseStart - navTiming.requestStart;
      this.recordMetric('TTFB', ttfb);
    }
  }

  private recordMetric(name: string, value: number): void {
    const metric: WebVitalsMetric = {
      name,
      value,
      rating: this.getRating(name, value),
      delta: value - (this.metrics.get(name)?.value || 0),
      id: `${name}-${Date.now()}`
    };

    this.metrics.set(name, metric);

    console.log(`📊 ${name}:`, {
      value: value.toFixed(2),
      rating: metric.rating
    });
  }

  private getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = {
      FCP: { good: 1800, poor: 3000 },
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      INP: { good: 200, poor: 500 },
      CLS: { good: 0.1, poor: 0.25 },
      TTFB: { good: 800, poor: 1800 }
    };

    const threshold = thresholds[name as keyof typeof thresholds];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  public getMetrics(): Map<string, WebVitalsMetric> {
    return new Map(this.metrics);
  }

  public cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}
```

**Integration:** Add to `main.ts` constructor:

```typescript
import { WebVitalsTracker } from './analytics/WebVitals';

// In constructor:
this.webVitals = new WebVitalsTracker();
```

## 4. Improve Mobile Touch Controls

**File: `apps/og-remaster/index.html`**

Update mobile controls styling:

```html
<style>
#mobileControls {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 20px;
  z-index: 100;
}

#mobileControls button {
  min-width: 80px;
  min-height: 60px;  /* Increased from default for better touch targets */
  padding: 15px 30px;
  font-size: 18px;
  background: #BF5700;
  color: white;
  border: none;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.3);
  touch-action: manipulation;  /* Disable double-tap zoom */
  user-select: none;
}

#mobileControls button:active {
  transform: scale(0.95);
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

@media (max-width: 768px) {
  #mobileControls {
    gap: 15px;
    bottom: 15px;
  }

  #mobileControls button {
    min-width: 90px;
    min-height: 70px;  /* Even larger on mobile */
  }
}
</style>
```

## 5. Meta Tags for Mobile Optimization

**File: `apps/og-remaster/index.html`**

Add these meta tags to `<head>`:

```html
<!-- Prevent zoom on double-tap (improves touch responsiveness) -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">

<!-- iOS-specific optimizations -->
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-fullscreen">

<!-- Reduce motion for accessibility -->
<link rel="prefers-reduced-motion" media="(prefers-reduced-motion: reduce)">
```

## 6. Reduce Motion Support

**File: `apps/og-remaster/main.ts`**

Add reduced motion detection:

```typescript
private shouldReduceMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Use in renderer:
// if (!this.shouldReduceMotion()) {
//   // Complex animations
// } else {
//   // Simple animations or no animation
// }
```

## Summary of Improvements

### Performance Gains (Expected)

- **Canvas DPI scaling:** Crisp rendering on HiDPI displays
- **Analytics pause:** 10-15% CPU reduction when tab hidden
- **Web Vitals tracking:** Full Core Web Vitals monitoring
- **Touch targets:** 48x48px minimum (WCAG 2.1 AAA)
- **Reduced motion:** Accessibility compliance

### Implementation Priority

1. **High Priority:** Analytics memory leak fix, Web Vitals tracking
2. **Medium Priority:** Canvas DPI scaling, touch control improvements
3. **Low Priority:** Reduced motion support

### Testing Checklist

- [ ] Test canvas scaling on Retina display
- [ ] Verify analytics pauses when tab is hidden
- [ ] Check Web Vitals metrics in console
- [ ] Test touch controls on actual mobile device
- [ ] Verify reduced motion preference is respected
- [ ] Run Lighthouse audit (mobile mode)

---

**Apply these changes incrementally and test after each change.**
