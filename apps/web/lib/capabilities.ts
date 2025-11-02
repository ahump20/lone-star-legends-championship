export type CapabilityState = {
  supportsWebGL: boolean;
  supportsWebGPU: boolean;
  prefersReducedMotion: boolean;
  deviceClass: 'mobile' | 'desktop';
};

export function detectCapabilities(): CapabilityState {
  const prefersReducedMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const supportsWebGL = (() => {
    try {
      const canvas = document.createElement('canvas');
      return !!canvas.getContext('webgl') || !!canvas.getContext('experimental-webgl');
    } catch {
      return false;
    }
  })();

  const supportsWebGPU = typeof navigator !== 'undefined' && 'gpu' in navigator;
  const deviceClass = window.innerWidth < 900 ? 'mobile' : 'desktop';

  return {
    supportsWebGL,
    supportsWebGPU,
    prefersReducedMotion,
    deviceClass,
  };
}
