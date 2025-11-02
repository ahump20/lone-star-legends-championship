/**
 * UI Scene - Scoreboard and game statistics overlay
 */

class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
  }

  create() {
    const width = this.cameras.main.width;

    // Semi-transparent scoreboard background
    const scoreboardBg = this.add.rectangle(width / 2, 50, 600, 80, 0x000000, 0.7);
    scoreboardBg.setScrollFactor(0);

    // Create text elements
    this.inningText = this.add.text(width / 2, 30, 'INNING 1', {
      font: 'bold 20px Arial',
      fill: '#ffffff'
    });
    this.inningText.setOrigin(0.5);
    this.inningText.setScrollFactor(0);

    this.scoreText = this.add.text(width / 2, 60, 'YOU: 0  CPU: 0', {
      font: 'bold 24px Arial',
      fill: '#ffffff'
    });
    this.scoreText.setOrigin(0.5);
    this.scoreText.setScrollFactor(0);

    // Count display (balls, strikes, outs)
    this.countText = this.add.text(width / 2, 90, 'B: 0  S: 0  O: 0', {
      font: '18px Arial',
      fill: '#ffff00'
    });
    this.countText.setOrigin(0.5);
    this.countText.setScrollFactor(0);

    // Pause button
    this.createPauseButton();
  }

  createPauseButton() {
    const pauseBtn = this.add.rectangle(50, 30, 80, 40, GAME_CONFIG.COLORS.PRIMARY);
    pauseBtn.setStrokeStyle(2, 0xFFFFFF);
    pauseBtn.setScrollFactor(0);
    pauseBtn.setInteractive({ useHandCursor: true });

    const pauseText = this.add.text(50, 30, 'MENU', {
      font: 'bold 16px Arial',
      fill: '#ffffff'
    });
    pauseText.setOrigin(0.5);
    pauseText.setScrollFactor(0);

    pauseBtn.on('pointerup', () => {
      this.showPauseMenu();
    });
  }

  showPauseMenu() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Pause game
    this.scene.pause('GameScene');

    // Overlay
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0);
    overlay.setScrollFactor(0);
    overlay.setDepth(200);

    // Menu panel
    const panel = this.add.rectangle(width / 2, height / 2, 400, 300, 0x1a1a1a);
    panel.setStrokeStyle(4, GAME_CONFIG.COLORS.PRIMARY);
    panel.setScrollFactor(0);
    panel.setDepth(201);

    const title = this.add.text(width / 2, height / 2 - 100, 'PAUSED', {
      font: 'bold 32px Arial',
      fill: '#ffffff'
    });
    title.setOrigin(0.5);
    title.setScrollFactor(0);
    title.setDepth(202);

    // Resume button
    const resumeBtn = this.createMenuButton(
      width / 2,
      height / 2 - 20,
      'RESUME',
      () => {
        this.scene.resume('GameScene');
        overlay.destroy();
        panel.destroy();
        title.destroy();
        resumeBtn.bg.destroy();
        resumeBtn.text.destroy();
        quitBtn.bg.destroy();
        quitBtn.text.destroy();
      }
    );

    // Quit button
    const quitBtn = this.createMenuButton(
      width / 2,
      height / 2 + 60,
      'QUIT TO MENU',
      () => {
        this.scene.stop('GameScene');
        this.scene.stop('UIScene');
        this.scene.start('MenuScene');
      }
    );
  }

  createMenuButton(x, y, text, callback) {
    const bg = this.add.rectangle(x, y, 250, 50, GAME_CONFIG.COLORS.PRIMARY);
    bg.setStrokeStyle(3, 0xFFFFFF);
    bg.setScrollFactor(0);
    bg.setDepth(202);
    bg.setInteractive({ useHandCursor: true });

    const label = this.add.text(x, y, text, {
      font: 'bold 20px Arial',
      fill: '#ffffff'
    });
    label.setOrigin(0.5);
    label.setScrollFactor(0);
    label.setDepth(203);

    bg.on('pointerover', () => bg.setScale(1.05));
    bg.on('pointerout', () => bg.setScale(1.0));
    bg.on('pointerup', callback);

    return { bg, text: label };
  }

  updateStats(gameState) {
    this.inningText.setText(`INNING ${gameState.inning}`);
    this.scoreText.setText(`YOU: ${gameState.playerScore}  CPU: ${gameState.cpuScore}`);
    this.countText.setText(`B: ${gameState.balls}  S: ${gameState.strikes}  O: ${gameState.outs}`);
  }
}
