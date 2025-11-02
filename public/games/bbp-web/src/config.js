/**
 * Phaser Game Configuration
 * Original baseball game - legally compliant
 */

const GAME_CONFIG = {
  // Game constants
  WIDTH: 1024,
  HEIGHT: 768,
  INNINGS: 3,
  OUTS_PER_INNING: 3,

  // Timing (milliseconds)
  PITCH_DURATION: 800,
  SWING_WINDOW: 200,
  RESULT_DISPLAY: 2000,

  // Hit timing windows (ms tolerance)
  PERFECT_WINDOW: 50,
  GOOD_WINDOW: 100,
  OK_WINDOW: 150,

  // Ball speeds
  FASTBALL_SPEED: 600,
  CURVEBALL_SPEED: 400,
  CHANGEUP_SPEED: 300,

  // Colors (original palette)
  COLORS: {
    PRIMARY: 0xBF5700,     // Orange
    SECONDARY: 0x00B2A9,   // Teal
    GRASS: 0x4CAF50,       // Green
    DIRT: 0x8B6F47,        // Brown
    SKY: 0x87CEEB,         // Sky blue
    WHITE: 0xFFFFFF,
    BLACK: 0x000000
  },

  // Player config
  PLAYER: {
    BATTER_X: 512,
    BATTER_Y: 600,
    PITCHER_X: 512,
    PITCHER_Y: 200,
    SIZE: 64
  },

  // Physics
  GRAVITY: 800,
  BALL_BOUNCE: 0.6
};
