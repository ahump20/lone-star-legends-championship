/**
 * Pitching System - Helper functions for pitching mechanics
 */

class PitchingSystem {
  /**
   * Get random pitch type
   */
  static getRandomPitchType() {
    const pitchTypes = ['fastball', 'curveball', 'changeup'];
    return Phaser.Utils.Array.GetRandom(pitchTypes);
  }

  /**
   * Get pitch characteristics
   */
  static getPitchCharacteristics(pitchType) {
    const characteristics = {
      fastball: {
        speed: GAME_CONFIG.FASTBALL_SPEED,
        curveX: 0,
        curveY: 0,
        difficulty: 'hard'
      },
      curveball: {
        speed: GAME_CONFIG.CURVEBALL_SPEED,
        curveX: Phaser.Math.Between(-50, 50),
        curveY: Phaser.Math.Between(-20, 20),
        difficulty: 'medium'
      },
      changeup: {
        speed: GAME_CONFIG.CHANGEUP_SPEED,
        curveX: Phaser.Math.Between(-30, 30),
        curveY: 0,
        difficulty: 'easy'
      }
    };

    return characteristics[pitchType] || characteristics.fastball;
  }

  /**
   * Determine if pitch is a strike (simplified)
   */
  static isStrike(targetX, homeX, curveX) {
    const distance = Math.abs((targetX + curveX) - homeX);
    return distance < 30;
  }

  /**
   * Get AI pitch selection based on count
   */
  static getAIPitchSelection(balls, strikes) {
    // Strategy: throw more strikes when behind in count
    if (balls >= 3) {
      // Must throw strike - use fastball
      return 'fastball';
    } else if (strikes >= 2) {
      // Try to fool batter - use off-speed
      return Math.random() > 0.5 ? 'curveball' : 'changeup';
    } else {
      // Random selection
      return this.getRandomPitchType();
    }
  }

  /**
   * Get pitch location strategy
   */
  static getPitchLocation(balls, strikes) {
    const locations = {
      safe: { x: 0, y: 0 },           // Middle of zone
      risky: { x: 25, y: 15 },        // Edge of zone
      waste: { x: 50, y: 30 }         // Outside zone
    };

    if (balls >= 3) {
      return locations.safe;
    } else if (strikes >= 2) {
      return locations.risky;
    } else {
      return Math.random() > 0.5 ? locations.safe : locations.risky;
    }
  }
}
