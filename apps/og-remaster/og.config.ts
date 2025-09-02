/**
 * OG Remaster Configuration
 * Backyard Baseball-style settings for kid-friendly gameplay
 */

export default {
  render: "2D-canvas",
  style: "cartoon-flat", 
  inputMode: "simple",
  difficulty: "adaptive-lite",
  audio: {
    commentary: "arcade",
    sfxPack: "toy",
    volume: {
      master: 0.8,
      sfx: 1.0,
      music: 0.6,
      commentary: 0.9
    }
  },
  camera: "fixed-broadcast",
  offlineOnly: true,
  
  // Visual settings
  visuals: {
    fieldStyle: "sandlot-chalk",
    playerSize: "oversized-cute",
    ballTrail: true,
    comicEffects: true,
    colorPalette: "bright-saturated"
  },
  
  // Gameplay settings
  gameplay: {
    autoRunners: true,
    simplifiedPitching: true,
    biggerHitZones: true,
    encouragingFeedback: true,
    maxInnings: 6,
    mercyRule: 10
  },
  
  // Performance settings
  performance: {
    targetFPS: 60,
    maxSprites: 100,
    enableVSync: true,
    lowPowerMode: false
  }
} as const;

export type OGConfig = typeof default;