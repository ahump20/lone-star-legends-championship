import Phaser from 'phaser';

interface UIState {
  inning: number;
  top: boolean;
  score: {
    player: number;
    cpu: number;
  };
  balls: number;
  strikes: number;
  outs: number;
}

export class UIScene extends Phaser.Scene {
  private scoreText?: Phaser.GameObjects.Text;
  private inningText?: Phaser.GameObjects.Text;
  private countText?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'ui' });
  }

  create(data: UIState) {
    this.scoreText = this.add
      .text(12, 12, '', {
        fontFamily: 'Inter, sans-serif',
        fontSize: '18px',
        color: '#ffffff',
      })
      .setScrollFactor(0);

    this.inningText = this.add
      .text(12, 44, '', {
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        color: '#cbd5f5',
      })
      .setScrollFactor(0);

    this.countText = this.add
      .text(12, 70, '', {
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        color: '#f8fafc',
      })
      .setScrollFactor(0);

    this.events.on('state:update', (state: UIState) => {
      this.refresh(state);
    });

    this.refresh(data);
  }

  private refresh(state: UIState) {
    this.scoreText?.setText(`You ${state.score.player} — CPU ${state.score.cpu}`);
    const half = state.top ? 'Top' : 'Bottom';
    this.inningText?.setText(`${half} of Inning ${state.inning}`);
    this.countText?.setText(`Balls ${state.balls}  Strikes ${state.strikes}  Outs ${state.outs}`);
  }
}
