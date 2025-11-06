'use client';

import { useEffect } from 'react';
import type { Metric } from 'web-vitals';

export function WebVitals() {
  useEffect(() => {
    import('web-vitals/attribution')
      .then(({ onLCP, onCLS, onINP }) => {
        const handler = (metric: Metric) => {
          window.dispatchEvent(new CustomEvent('web-vitals', { detail: metric }));
          if (navigator.sendBeacon) {
            const success = navigator.sendBeacon('/api/vitals', JSON.stringify(metric));
            if (!success) {
              console.warn('Failed to send web-vitals metric:', metric.name);
            }
          }
        };
        onLCP(handler);
        onCLS(handler);
        onINP(handler);
      })
      .catch((error) => {
        console.error('Failed to load web-vitals:', error);
      });
  }, []);

  return null;
}
