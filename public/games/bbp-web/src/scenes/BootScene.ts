import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'boot' });
  }

  preload() {
    this.load.svg('diamond', 'src/assets/placeholders/diamond.svg', { width: 512, height: 512 });
    this.load.svg('players', 'src/assets/placeholders/players.svg', { width: 256, height: 128 });
    this.load.svg('ui', 'src/assets/placeholders/ui.svg', { width: 256, height: 128 });
  }

  create() {
    this.scene.start('menu');
  }
}
