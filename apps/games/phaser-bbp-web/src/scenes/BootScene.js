/**
 * Boot Scene - Asset loading and initialization
 */

class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Display loading progress
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

    const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
      font: '20px Arial',
      fill: '#ffffff'
    });
    loadingText.setOrigin(0.5, 0.5);

    const percentText = this.add.text(width / 2, height / 2, '0%', {
      font: '18px Arial',
      fill: '#ffffff'
    });
    percentText.setOrigin(0.5, 0.5);

    // Update progress bar
    this.load.on('progress', (value) => {
      progressBar.clear();
      progressBar.fillStyle(GAME_CONFIG.COLORS.PRIMARY, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
      percentText.setText(parseInt(value * 100) + '%');
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
    });

    // Load assets
    // TODO: Replace procedural graphics with actual sprite files in production.
    // this.load.image('batter', 'assets/sprites/batter.png');
    // this.load.image('pitcher', 'assets/sprites/pitcher.png');
    // this.load.image('ball', 'assets/sprites/ball.png');
  }

  create() {
    // Generate placeholder sprites programmatically
    this.generateSprites();

    // Start menu scene
    this.scene.start('MenuScene');
  }

  generateSprites() {
    // Generate batter sprite (simple stick figure)
    const batterGraphics = this.add.graphics();
    batterGraphics.fillStyle(GAME_CONFIG.COLORS.PRIMARY);
    batterGraphics.fillCircle(32, 20, 12); // Head
    batterGraphics.fillRect(26, 32, 12, 28); // Body
    batterGraphics.fillRect(38, 35, 20, 4); // Bat

    batterGraphics.generateTexture('batter', 64, 64);
    batterGraphics.destroy();

    // Generate pitcher sprite
    const pitcherGraphics = this.add.graphics();
    pitcherGraphics.fillStyle(GAME_CONFIG.COLORS.SECONDARY);
    pitcherGraphics.fillCircle(32, 20, 12); // Head
    pitcherGraphics.fillRect(26, 32, 12, 28); // Body
    pitcherGraphics.fillRect(18, 40, 8, 3); // Arm

    pitcherGraphics.generateTexture('pitcher', 64, 64);
    pitcherGraphics.destroy();

    // Generate ball sprite
    const ballGraphics = this.add.graphics();
    ballGraphics.fillStyle(0xFFFFFF);
    ballGraphics.fillCircle(16, 16, 14);
    ballGraphics.lineStyle(2, 0xFF0000);
    ballGraphics.arc(16, 16, 12, Phaser.Math.DegToRad(270), Phaser.Math.DegToRad(90));
    ballGraphics.strokePath();

    ballGraphics.generateTexture('ball', 32, 32);
    ballGraphics.destroy();

    // Generate field background
    const fieldGraphics = this.add.graphics();

    // Grass
    fieldGraphics.fillStyle(GAME_CONFIG.COLORS.GRASS);
    fieldGraphics.fillRect(0, 0, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);

    // Infield dirt (diamond shape)
    fieldGraphics.fillStyle(GAME_CONFIG.COLORS.DIRT);
    const diamond = new Phaser.Geom.Polygon([
      512, 500,  // Home plate
      300, 400,  // Third base
      512, 300,  // Second base
      724, 400   // First base
    ]);
    fieldGraphics.fillPoints(diamond.points, true);

    // Baselines (white)
    fieldGraphics.lineStyle(3, 0xFFFFFF);
    fieldGraphics.strokePoints(diamond.points, true);

    fieldGraphics.generateTexture('field', GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);
    fieldGraphics.destroy();
  }
}
