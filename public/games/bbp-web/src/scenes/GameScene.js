/**
 * Game Scene - Main baseball gameplay
 */

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init() {
    // Game state
    this.gameState = {
      inning: 1,
      outs: 0,
      playerScore: 0,
      cpuScore: 0,
      balls: 0,
      strikes: 0,
      isPlayerBatting: true
    };

    this.currentPitch = null;
    this.swingPressed = false;
  }

  create() {
    // Add field background
    this.add.image(512, 384, 'field');

    // Add players
    this.pitcher = this.add.sprite(
      GAME_CONFIG.PLAYER.PITCHER_X,
      GAME_CONFIG.PLAYER.PITCHER_Y,
      'pitcher'
    );

    this.batter = this.add.sprite(
      GAME_CONFIG.PLAYER.BATTER_X,
      GAME_CONFIG.PLAYER.BATTER_Y,
      'batter'
    );

    // Ball (initially hidden)
    this.ball = this.physics.add.sprite(-100, -100, 'ball');
    this.ball.setVisible(false);

    // Input handling
    this.setupInput();

    // Start first pitch after delay
    this.time.delayedCall(1500, () => {
      this.startPitch();
    });

    // Update UI scene
    this.updateUI();
  }

  setupInput() {
    // Keyboard input
    this.input.keyboard.on('keydown-SPACE', () => {
      this.handleSwing();
    });

    // Create touch button for mobile
    if (this.game.device.input.touch) {
      this.createTouchControls();
    }
  }

  createTouchControls() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Swing button
    const swingButton = this.add.rectangle(
      width / 2,
      height - 80,
      200,
      80,
      GAME_CONFIG.COLORS.PRIMARY
    );
    swingButton.setStrokeStyle(4, 0xFFFFFF);
    swingButton.setDepth(50);
    swingButton.setScrollFactor(0);

    const swingText = this.add.text(width / 2, height - 80, 'SWING', {
      font: 'bold 32px Arial',
      fill: '#ffffff'
    });
    swingText.setOrigin(0.5);
    swingText.setDepth(51);
    swingText.setScrollFactor(0);

    swingButton.setInteractive();
    swingButton.on('pointerdown', () => {
      swingButton.setScale(0.9);
      this.handleSwing();
    });
    swingButton.on('pointerup', () => {
      swingButton.setScale(1.0);
    });

    this.swingButton = swingButton;
    this.swingText = swingText;
  }

  startPitch() {
    if (this.gameState.inning > GAME_CONFIG.INNINGS) {
      this.endGame();
      return;
    }

    // Reset swing flag
    this.swingPressed = false;

    // Pitcher wind-up animation
    this.tweens.add({
      targets: this.pitcher,
      scaleX: 1.2,
      scaleY: 0.9,
      duration: 300,
      yoyo: true,
      onComplete: () => {
        this.throwPitch();
      }
    });
  }

  throwPitch() {
    // Randomize pitch type
    const pitchTypes = ['fastball', 'curveball', 'changeup'];
    const pitchType = Phaser.Utils.Array.GetRandom(pitchTypes);

    let speed, curveX;
    switch (pitchType) {
      case 'fastball':
        speed = GAME_CONFIG.FASTBALL_SPEED;
        curveX = 0;
        break;
      case 'curveball':
        speed = GAME_CONFIG.CURVEBALL_SPEED;
        curveX = Phaser.Math.Between(-50, 50);
        break;
      case 'changeup':
        speed = GAME_CONFIG.CHANGEUP_SPEED;
        curveX = Phaser.Math.Between(-30, 30);
        break;
    }

    // Show ball
    this.ball.setPosition(
      GAME_CONFIG.PLAYER.PITCHER_X,
      GAME_CONFIG.PLAYER.PITCHER_Y + 30
    );
    this.ball.setVisible(true);

    // Store pitch data
    this.currentPitch = {
      type: pitchType,
      startTime: this.time.now,
      speed: speed
    };

    // Animate ball to home plate
    this.tweens.add({
      targets: this.ball,
      x: GAME_CONFIG.PLAYER.BATTER_X + curveX,
      y: GAME_CONFIG.PLAYER.BATTER_Y,
      duration: speed,
      ease: 'Linear',
      onComplete: () => {
        if (!this.swingPressed) {
          // Didn't swing - determine ball or strike
          const isStrike = Math.abs(curveX) < 30;
          this.resolvePitch(isStrike ? 'strike' : 'ball', 0);
        }
      }
    });
  }

  handleSwing() {
    if (!this.currentPitch || this.swingPressed) return;

    this.swingPressed = true;

    // Swing animation
    this.tweens.add({
      targets: this.batter,
      angle: 45,
      duration: 100,
      yoyo: true
    });

    // Calculate timing
    const swingTime = this.time.now;
    const pitchTime = this.currentPitch.startTime;
    const optimalTime = pitchTime + this.currentPitch.speed - 100;
    const timingDiff = Math.abs(swingTime - optimalTime);

    // Determine hit quality
    let hitQuality = 'miss';
    let hitPower = 0;

    if (timingDiff < GAME_CONFIG.PERFECT_WINDOW) {
      hitQuality = 'perfect';
      hitPower = 100;
    } else if (timingDiff < GAME_CONFIG.GOOD_WINDOW) {
      hitQuality = 'good';
      hitPower = 70;
    } else if (timingDiff < GAME_CONFIG.OK_WINDOW) {
      hitQuality = 'ok';
      hitPower = 40;
    }

    this.resolvePitch(hitQuality, hitPower);
  }

  resolvePitch(result, power) {
    // Stop ball
    this.tweens.killTweensOf(this.ball);

    let message = '';

    switch (result) {
      case 'perfect':
        message = 'HOME RUN!';
        this.gameState.playerScore += 2;
        this.launchBall(power);
        break;

      case 'good':
        message = 'BASE HIT!';
        this.gameState.playerScore += 1;
        this.launchBall(power);
        break;

      case 'ok':
        message = 'Ground Ball';
        this.launchBall(power * 0.5);
        this.gameState.outs++;
        break;

      case 'miss':
        message = 'STRIKE!';
        this.gameState.strikes++;
        if (this.gameState.strikes >= 3) {
          this.gameState.outs++;
          this.gameState.strikes = 0;
          message = 'STRIKEOUT!';
        }
        break;

      case 'ball':
        message = 'BALL';
        this.gameState.balls++;
        if (this.gameState.balls >= 4) {
          this.gameState.balls = 0;
          this.gameState.playerScore++;
          message = 'WALK - Run Scored!';
        }
        break;

      case 'strike':
        message = 'STRIKE!';
        this.gameState.strikes++;
        if (this.gameState.strikes >= 3) {
          this.gameState.outs++;
          this.gameState.strikes = 0;
          message = 'STRIKEOUT!';
        }
        break;
    }

    // Display result
    this.showMessage(message);

    // Check for inning change
    if (this.gameState.outs >= GAME_CONFIG.OUTS_PER_INNING) {
      this.endInning();
    } else {
      // Next pitch
      this.time.delayedCall(GAME_CONFIG.RESULT_DISPLAY, () => {
        this.startPitch();
      });
    }

    this.updateUI();
  }

  launchBall(power) {
    const angle = Phaser.Math.Between(-60, -30);
    const velocity = power * 5;

    this.ball.setVelocity(
      Math.cos(Phaser.Math.DegToRad(angle)) * velocity,
      Math.sin(Phaser.Math.DegToRad(angle)) * velocity
    );

    this.ball.setBounce(GAME_CONFIG.BALL_BOUNCE);

    // Hide ball after flight
    this.time.delayedCall(1500, () => {
      this.ball.setVisible(false);
    });
  }

  showMessage(text) {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const message = this.add.text(width / 2, height / 3, text, {
      font: 'bold 48px Arial',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 8
    });
    message.setOrigin(0.5);
    message.setDepth(100);

    // Fade out
    this.tweens.add({
      targets: message,
      alpha: 0,
      duration: 1500,
      delay: 500,
      onComplete: () => {
        message.destroy();
      }
    });
  }

  endInning() {
    this.gameState.inning++;
    this.gameState.outs = 0;
    this.gameState.balls = 0;
    this.gameState.strikes = 0;

    if (this.gameState.inning <= GAME_CONFIG.INNINGS) {
      this.showMessage(`Inning ${this.gameState.inning}`);

      // CPU turn (simplified - just add random runs)
      const cpuRuns = Phaser.Math.Between(0, 2);
      this.gameState.cpuScore += cpuRuns;

      this.time.delayedCall(2500, () => {
        this.startPitch();
      });
    } else {
      this.endGame();
    }

    this.updateUI();
  }

  endGame() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const playerWon = this.gameState.playerScore > this.gameState.cpuScore;
    const message = playerWon ? 'YOU WIN!' : 'YOU LOSE!';

    const endText = this.add.text(width / 2, height / 2, message, {
      font: 'bold 64px Arial',
      fill: playerWon ? '#00ff00' : '#ff0000',
      stroke: '#000000',
      strokeThickness: 8
    });
    endText.setOrigin(0.5);

    const scoreText = this.add.text(
      width / 2,
      height / 2 + 80,
      `Final Score\nYou: ${this.gameState.playerScore}  CPU: ${this.gameState.cpuScore}`,
      {
        font: '24px Arial',
        fill: '#ffffff',
        align: 'center'
      }
    );
    scoreText.setOrigin(0.5);

    // Play again button
    this.time.delayedCall(2000, () => {
      const playAgainBtn = this.add.rectangle(
        width / 2,
        height / 2 + 160,
        250,
        60,
        GAME_CONFIG.COLORS.PRIMARY
      );
      playAgainBtn.setStrokeStyle(4, 0xFFFFFF);
      playAgainBtn.setInteractive({ useHandCursor: true });

      const btnText = this.add.text(width / 2, height / 2 + 160, 'PLAY AGAIN', {
        font: 'bold 24px Arial',
        fill: '#ffffff'
      });
      btnText.setOrigin(0.5);

      playAgainBtn.on('pointerup', () => {
        this.scene.restart();
        this.scene.get('UIScene').scene.restart();
      });
    });

    // Track game completion
    if (typeof trackEvent === 'function') {
      trackEvent('phaser_game_completed', {
        playerScore: this.gameState.playerScore,
        cpuScore: this.gameState.cpuScore,
        won: playerWon
      });
    }
  }

  updateUI() {
    const uiScene = this.scene.get('UIScene');
    if (uiScene && uiScene.updateStats) {
      uiScene.updateStats(this.gameState);
    }
  }
}
