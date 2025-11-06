'use client';

import { useEffect } from 'react';

export function WebVitals() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('web-vitals/attribution').then(({ onLCP, onCLS, onINP }) => {
        const handler = (metric: any) => {
          window.dispatchEvent(new CustomEvent('web-vitals', { detail: metric }));
          if (navigator.sendBeacon) {
            navigator.sendBeacon('/api/vitals', JSON.stringify(metric));
          }
        };
        onLCP(handler);
        onCLS(handler);
        onINP(handler);
      });
    }
  }, []);

  return null;
}
