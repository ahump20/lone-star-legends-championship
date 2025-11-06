import Phaser from 'phaser';
import { sendAnalyticsEvent } from '../systems/analytics';
import { registerInputHandlers, unregisterInputHandlers } from '../systems/input';

type Score = {
  player: number;
  cpu: number;
};

type GameData = {
  inning: number;
  top: boolean;
  score: Score;
};

const TOTAL_INNINGS = 3;

export class GameScene extends Phaser.Scene {
  private balls = 0;
  private strikes = 0;
  private outs = 0;
  private bases = [false, false, false];
  private data!: GameData;
  private ball?: Phaser.Physics.Arcade.Image;
  private swingWindow = 0;
  private swingText?: Phaser.GameObjects.Text;
  private ready = false;

  constructor() {
    super({ key: 'game' });
  }

  init(data: GameData) {
    this.data = data;
  }

  create() {
    this.scene.run('ui', {
      inning: this.data.inning,
      top: this.data.top,
      score: this.data.score,
      balls: this.balls,
      strikes: this.strikes,
      outs: this.outs,
    });

    this.add.image(180, 320, 'diamond').setDisplaySize(360, 360).setAlpha(0.35);
    this.add.image(180, 140, 'players').setDisplaySize(200, 90).setAlpha(0.7);

    this.swingText = this.add
      .text(180, 540, 'Tap to ready your swing', {
        fontFamily: 'Inter, sans-serif',
        fontSize: '16px',
        color: '#f8fafc',
      })
      .setOrigin(0.5);

    registerInputHandlers(this, {
      onTap: this.handleTap.bind(this),
    });

    this.time.delayedCall(600, () => {
      this.ready = true;
      this.swingText?.setText('Tap once to ready, again to swing!');
      this.beginPitchSequence();
    });
  }

  shutdown() {
    unregisterInputHandlers(this);
  }

  private beginPitchSequence() {
    if (!this.ready) {
      return;
    }

    this.time.delayedCall(700, () => {
      const speed = Phaser.Math.Between(240, 320);
      const curve = Phaser.Math.FloatBetween(-20, 20);
      this.spawnBall(speed, curve);
      this.swingWindow = this.time.now + Phaser.Math.Between(550, 800);
    });
  }

  private spawnBall(speed: number, curve: number) {
    if (this.ball) {
      this.ball.destroy();
    }
    this.ball = this.physics.add.image(180, 220, 'ui').setDisplaySize(18, 18);
    this.ball.setTint(0xffffff);
    this.ball.setCircle(9, 119, 55);
    this.ball.setVelocity(curve, speed);
    this.ball.setGravity(0);
    this.ball.setCollideWorldBounds(false);

    this.time.delayedCall(1800, () => {
      if (this.ball && this.ball.y > 620) {
        this.registerCalledStrike();
      }
    });
  }

  private handleTap() {
    if (!this.ready) {
      return;
    }
    const now = this.time.now;
    if (!this.ball) {
      // First tap primes the swing.
      this.swingText?.setText('Swing when the ball crosses the plate!');
      this.beginPitchSequence();
      return;
    }

    const delta = Math.abs(this.swingWindow - now);
    this.ball?.destroy();
    this.ball = undefined;

    if (delta < 80) {
      this.registerHit(2);
    } else if (delta < 160) {
      this.registerHit(1);
    } else if (delta < 260) {
      this.registerHit(0);
    } else {
      this.registerStrike();
    }
  }

  private registerHit(basesEarned: number) {
    sendAnalyticsEvent('swing:connect', { bases: basesEarned + 1 });
    this.strikes = 0;
    this.balls = 0;
    this.advanceRunners(basesEarned + 1);
    this.updateUI();
    this.beginPitchSequence();
  }

  private advanceRunners(basesEarned: number) {
    const newBases = [false, false, false];
    let runs = 0;

    const order = [2, 1, 0];
    for (const idx of order) {
      if (this.bases[idx]) {
        const target = idx + basesEarned;
        if (target >= 3) {
          runs += 1;
        } else {
          newBases[target] = true;
        }
      }
    }

    if (basesEarned >= 4) {
      runs += 1;
    } else {
      newBases[basesEarned - 1] = true;
    }

    this.bases = newBases;
    if (runs > 0) {
      this.data.score.player += runs;
      sendAnalyticsEvent('score:update', { runs });
    }
  }

  private registerStrike() {
    this.strikes += 1;
    if (this.strikes >= 3) {
      this.registerOut();
    } else {
      this.updateUI();
      this.beginPitchSequence();
    }
  }

  private registerCalledStrike() {
    this.strikes += 1;
    if (this.strikes >= 3) {
      this.registerOut();
    } else {
      this.updateUI();
      this.beginPitchSequence();
    }
  }

  private registerOut() {
    this.strikes = 0;
    this.balls = 0;
    this.outs += 1;
    this.bases = [false, false, false];
    sendAnalyticsEvent('atbat:out', { outs: this.outs });
    if (this.outs >= 3) {
      this.switchSides();
    } else {
      this.updateUI();
      this.beginPitchSequence();
    }
  }

  private switchSides() {
    this.outs = 0;
    this.strikes = 0;
    this.balls = 0;
    this.bases = [false, false, false];
    this.data.top = !this.data.top;

    if (!this.data.top) {
      sendAnalyticsEvent('inning:half', { inning: this.data.inning, half: 'bottom' });
      this.simulateCpuHalfInning();
    } else {
      this.data.inning += 1;
      if (this.data.inning > TOTAL_INNINGS) {
        this.endGame();
        return;
      }
      sendAnalyticsEvent('inning:half', { inning: this.data.inning, half: 'top' });
    }

    this.scene.get('ui')?.events.emit('state:update', {
      inning: this.data.inning,
      top: this.data.top,
      score: this.data.score,
      balls: this.balls,
      strikes: this.strikes,
      outs: this.outs,
    });
    this.beginPitchSequence();
  }

  private simulateCpuHalfInning() {
    // TODO: Simplified MVP placeholder. Replace with actual CPU batting logic to match player mechanics.
    const runs = Phaser.Math.Between(0, 2);
    if (runs > 0) {
      this.data.score.cpu += runs;
    }
    this.scene.get('ui')?.events.emit('state:update', {
      inning: this.data.inning,
      top: this.data.top,
      score: this.data.score,
      balls: this.balls,
      strikes: this.strikes,
      outs: this.outs,
    });

    this.time.delayedCall(1200, () => {
      this.switchSides();
    });
  }

  private endGame() {
    sendAnalyticsEvent('game:complete', {
      score: this.data.score,
    });
    this.scene.stop('ui');
    this.scene.start('menu');
  }

  private updateUI() {
    this.scene.get('ui')?.events.emit('state:update', {
      inning: this.data.inning,
      top: this.data.top,
      score: this.data.score,
      balls: this.balls,
      strikes: this.strikes,
      outs: this.outs,
    });
  }
}
