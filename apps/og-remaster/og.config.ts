/**
 * Central configuration for the OG remaster mode. Tweaking these values allows
 * experimentation without touching other parts of the code. All fields are
 * optional; defaults will apply if omitted.
 */
export default {
  render: "2D-canvas",
  style: "cartoon-flat",
  inputMode: "simple",
  difficulty: "adaptive-lite",
  audio: {
    commentary: "arcade",
    sfxPack: "toy",
  },
  camera: "fixed-broadcast",
  offlineOnly: true,
};