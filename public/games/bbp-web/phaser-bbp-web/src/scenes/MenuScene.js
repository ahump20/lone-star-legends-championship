/**
 * Menu Scene - Main menu with game modes
 */

class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background
    this.add.rectangle(0, 0, width, height, GAME_CONFIG.COLORS.SKY).setOrigin(0);

    // Title
    const title = this.add.text(width / 2, 150, 'BACKYARD PLAY', {
      font: 'bold 64px Arial',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 6
    });
    title.setOrigin(0.5);

    // Subtitle
    const subtitle = this.add.text(width / 2, 220, 'Original Baseball Game', {
      font: '24px Arial',
      fill: '#ffffff'
    });
    subtitle.setOrigin(0.5);

    // Play button
    const playButton = this.createButton(width / 2, 350, 'PLAY GAME', () => {
      this.startGame();
    });

    // How to Play button
    const howToButton = this.createButton(width / 2, 450, 'HOW TO PLAY', () => {
      this.showInstructions();
    });

    // Legal/Credits button
    const creditsButton = this.createButton(width / 2, 550, 'LEGAL & CREDITS', () => {
      this.showCredits();
    });

    // Add baseball decorations
    this.addDecorations();

    // Mobile touch prompt
    if (this.game.device.input.touch) {
      const touchPrompt = this.add.text(width / 2, height - 50, 'Tap buttons to play', {
        font: '18px Arial',
        fill: '#ffffff'
      });
      touchPrompt.setOrigin(0.5);
    }
  }

  createButton(x, y, text, callback) {
    const buttonWidth = 300;
    const buttonHeight = 60;

    // Button background
    const bg = this.add.rectangle(x, y, buttonWidth, buttonHeight, GAME_CONFIG.COLORS.PRIMARY);
    bg.setStrokeStyle(4, 0xFFFFFF);

    // Button text
    const label = this.add.text(x, y, text, {
      font: 'bold 24px Arial',
      fill: '#ffffff'
    });
    label.setOrigin(0.5);

    // Make interactive
    bg.setInteractive({ useHandCursor: true });

    bg.on('pointerover', () => {
      bg.setFillStyle(GAME_CONFIG.COLORS.SECONDARY);
      bg.setScale(1.05);
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(GAME_CONFIG.COLORS.PRIMARY);
      bg.setScale(1.0);
    });

    bg.on('pointerdown', () => {
      bg.setScale(0.95);
    });

    bg.on('pointerup', () => {
      bg.setScale(1.0);
      callback();
    });

    return { bg, label };
  }

  addDecorations() {
    // Add some baseballs as decoration
    for (let i = 0; i < 5; i++) {
      const x = Phaser.Math.Between(50, this.cameras.main.width - 50);
      const y = Phaser.Math.Between(50, this.cameras.main.height - 50);
      const ball = this.add.circle(x, y, 20, 0xFFFFFF, 0.3);
    }
  }

  startGame() {
    // Track game start
    if (typeof trackEvent === 'function') {
      trackEvent('phaser_game_started_from_menu', { mode: 'quick_play' });
    }

    this.scene.start('GameScene');
    this.scene.launch('UIScene');
  }

  showInstructions() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Overlay
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0);
    overlay.setDepth(100);

    // Instructions panel
    const panel = this.add.rectangle(width / 2, height / 2, 600, 500, 0x1a1a1a);
    panel.setStrokeStyle(4, GAME_CONFIG.COLORS.PRIMARY);
    panel.setDepth(101);

    const instructionsText = `HOW TO PLAY

🎯 OBJECTIVE
Score more runs than the opponent in 3 innings.

⚾ BATTING
• Watch the pitcher throw the ball
• Tap SWING when the ball is in the strike zone
• Perfect timing = Home Run!
• Good timing = Hit
• Bad timing = Miss/Out

🎮 CONTROLS
Desktop: SPACEBAR to swing
Mobile: Tap SWING button

📊 SCORING
• 3 outs per inning
• Score runs by hitting the ball
• Perfect hits score more runs

Good luck!`;

    const text = this.add.text(width / 2, height / 2, instructionsText, {
      font: '16px Arial',
      fill: '#ffffff',
      align: 'center',
      lineSpacing: 8
    });
    text.setOrigin(0.5);
    text.setDepth(102);

    // Close button
    const closeBtn = this.createButton(width / 2, height - 150, 'CLOSE', () => {
      overlay.destroy();
      panel.destroy();
      text.destroy();
      closeBtn.bg.destroy();
      closeBtn.label.destroy();
    });
    closeBtn.bg.setDepth(102);
    closeBtn.label.setDepth(103);
  }

  showCredits() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Overlay
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0);
    overlay.setDepth(100);

    // Credits panel
    const panel = this.add.rectangle(width / 2, height / 2, 600, 400, 0x1a1a1a);
    panel.setStrokeStyle(4, GAME_CONFIG.COLORS.PRIMARY);
    panel.setDepth(101);

    const creditsText = `LEGAL & CREDITS

This is an ORIGINAL game created for
Blaze Sports Intelligence.

⚖️ NO IP INFRINGEMENT
• No third-party licensed content
• All characters and assets are original
• Generic baseball mechanics only

🎨 ASSETS
• Placeholder sprites: Original
• Colors: Unique palette
• Code: MIT License

📜 License: MIT
See LEGAL_COMPLIANCE.md for details.

Made with ❤️ using Phaser 3`;

    const text = this.add.text(width / 2, height / 2, creditsText, {
      font: '16px Arial',
      fill: '#ffffff',
      align: 'center',
      lineSpacing: 8
    });
    text.setOrigin(0.5);
    text.setDepth(102);

    // Close button
    const closeBtn = this.createButton(width / 2, height - 120, 'CLOSE', () => {
      overlay.destroy();
      panel.destroy();
      text.destroy();
      closeBtn.bg.destroy();
      closeBtn.label.destroy();
    });
    closeBtn.bg.setDepth(102);
    closeBtn.label.setDepth(103);
  }
}
