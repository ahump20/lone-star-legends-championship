'use client';

import { useEffect, useState } from 'react';
import { detectCapabilities } from '@/lib/capabilities';
import type { CapabilityState } from '@/lib/capabilities';

export function LeiDashboard() {
  const [enabled, setEnabled] = useState(false);
  const [capabilities, setCapabilities] = useState<CapabilityState>(() => ({
    supportsWebGL: false,
    supportsWebGPU: false,
    prefersReducedMotion: true,
    deviceClass: 'mobile',
  }));

  useEffect(() => {
    const cap = detectCapabilities();
    setCapabilities(cap);
    if (cap.deviceClass === 'desktop' && !cap.prefersReducedMotion && (cap.supportsWebGL || cap.supportsWebGPU)) {
      setEnabled(true);
    }
  }, []);

  if (!enabled) {
    return (
      <div className="card">
        <h3>Live Edge Insights</h3>
        <p className="text-muted">
          Tap “Enable 3D View” to render interactive pitch tunnels. We default to a lightweight summary on mobile to protect
          performance.
        </p>
        <button className="button" onClick={() => setEnabled(true)}>
          Enable 3D View
        </button>
      </div>
    );
  }

  return (
    <div className="card" role="region" aria-label="3D pitch tunnel">
      <h3>3D Pitch Tunnel</h3>
      <canvas style={{ width: '100%', aspectRatio: '16 / 9', borderRadius: 16, background: 'rgba(15, 23, 42, 0.7)' }} />
      <p className="text-muted" style={{ marginTop: 12 }}>
        WebGL placeholder canvas. Hook into the production renderer once capability checks pass. WebGPU available: {String(
          capabilities.supportsWebGPU,
        )}
      </p>
    </div>
  );
}

export default LeiDashboard;
