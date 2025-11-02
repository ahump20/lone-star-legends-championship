import Phaser from 'phaser';
import { sendAnalyticsEvent } from '../systems/analytics';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'menu' });
  }

  create() {
    sendAnalyticsEvent('menu:show');

    this.add.image(180, 320, 'diamond').setDisplaySize(360, 360).setAlpha(0.15);

    this.add
      .text(180, 200, 'Sandlot Sluggers', {
        fontFamily: 'Inter, sans-serif',
        fontSize: '28px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.add
      .text(180, 240, 'Tap to start a 3-inning showdown', {
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        color: '#cbd5f5',
      })
      .setOrigin(0.5);

    const button = this.add
      .rectangle(180, 320, 200, 54, 0xff6b35, 1)
      .setStrokeStyle(3, 0xffffff, 0.6)
      .setInteractive({ useHandCursor: true });

    this.add
      .text(180, 320, 'Play Ball', {
        fontFamily: 'Inter, sans-serif',
        fontWeight: '700',
        fontSize: '20px',
        color: '#0f172a',
      })
      .setOrigin(0.5);

    button.on('pointerup', () => {
      sendAnalyticsEvent('game:start');
      this.scene.start('game', { inning: 1, top: true, score: { player: 0, cpu: 0 } });
    });
  }
}
