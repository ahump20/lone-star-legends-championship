/**
 * Batting System - Helper functions for batting mechanics
 */

class BattingSystem {
  /**
   * Calculate hit outcome based on timing
   */
  static calculateHitQuality(timingDiff) {
    if (timingDiff < GAME_CONFIG.PERFECT_WINDOW) {
      return { quality: 'perfect', power: 100, message: 'HOME RUN!' };
    } else if (timingDiff < GAME_CONFIG.GOOD_WINDOW) {
      return { quality: 'good', power: 70, message: 'BASE HIT!' };
    } else if (timingDiff < GAME_CONFIG.OK_WINDOW) {
      return { quality: 'ok', power: 40, message: 'Ground Ball' };
    } else {
      return { quality: 'miss', power: 0, message: 'MISS!' };
    }
  }

  /**
   * Calculate optimal swing time
   */
  static getOptimalSwingTime(pitchStartTime, pitchSpeed) {
    return pitchStartTime + pitchSpeed - 100;
  }

  /**
   * Determine if ball is in strike zone
   */
  static isInStrikeZone(ballX, ballY, targetX, targetY) {
    const distanceX = Math.abs(ballX - targetX);
    const distanceY = Math.abs(ballY - targetY);
    return distanceX < 30 && distanceY < 30;
  }

  /**
   * Calculate launch angle and velocity for hit ball
   */
  static calculateBallTrajectory(power) {
    const angle = Phaser.Math.Between(-60, -30);
    const velocity = power * 5;

    return {
      velocityX: Math.cos(Phaser.Math.DegToRad(angle)) * velocity,
      velocityY: Math.sin(Phaser.Math.DegToRad(angle)) * velocity,
      angle: angle
    };
  }

  /**
   * Get feedback message for swing result
   */
  static getSwingFeedback(quality, count) {
    const messages = {
      perfect: ['CRUSHED IT!', 'GONE!', 'SEE YA!', 'OUTTA HERE!'],
      good: ['NICE HIT!', 'BASE HIT!', 'WAY TO GO!'],
      ok: ['CONTACT!', 'GOT A PIECE!', 'WEAK HIT'],
      miss: ['WHIFF!', 'SWING AND A MISS!', 'STRIKE!']
    };

    const options = messages[quality] || messages.miss;
    return Phaser.Utils.Array.GetRandom(options);
  }
}
