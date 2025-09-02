/**
 * Head-Up Display for OG Remaster
 * Brand-aware UI using Blaze Intelligence design tokens
 */

import type { GameState } from '../../../packages/rules/gameState';
import { readTheme, getFont } from '../theme';

interface HUDElement {
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  opacity: number;
}

export class HUD {
  private ctx: CanvasRenderingContext2D;
  private state: GameState;
  private theme = readTheme();
  
  private elements: Map<string, HUDElement> = new Map();
  private animations: Map<string, number> = new Map();
  
  constructor(ctx: CanvasRenderingContext2D, state: GameState) {
    this.ctx = ctx;
    this.state = state;
    this.initializeElements();
  }

  private initializeElements(): void {
    this.elements.set('scoreboard', {
      x: 20, y: 20, width: 240, height: 100,
      visible: true, opacity: 1
    });
    
    this.elements.set('countDisplay', {
      x: 1024 - 180, y: 20, width: 160, height: 80,
      visible: true, opacity: 1
    });
    
    this.elements.set('playResult', {
      x: 512, y: 150, width: 400, height: 60,
      visible: false, opacity: 0
    });
    
    this.elements.set('gameStatus', {
      x: 0, y: 0, width: 1024, height: 768,
      visible: false, opacity: 0
    });
  }

  render(): void {
    this.ctx.save();
    
    // Update theme if needed
    this.theme = readTheme();
    
    // Render all visible elements
    if (this.elements.get('scoreboard')?.visible) {
      this.drawScoreboard();
    }
    
    if (this.elements.get('countDisplay')?.visible) {
      this.drawCountDisplay();
    }
    
    if (this.elements.get('playResult')?.visible) {
      this.drawPlayResult();
    }
    
    if (this.elements.get('gameStatus')?.visible) {
      this.drawGameStatus();
    }
    
    // Update animations
    this.updateAnimations();
    
    this.ctx.restore();
  }

  private drawScoreboard(): void {
    const element = this.elements.get('scoreboard')!;
    
    this.ctx.save();
    this.ctx.globalAlpha = element.opacity;
    
    // Background with glassmorphic effect
    this.drawCard(element.x, element.y, element.width, element.height, 'Scoreboard');
    
    // Score content
    const contentY = element.y + 35;
    const leftX = element.x + 40;
    const rightX = element.x + element.width - 40;
    
    // Away team
    this.drawText('AWAY', leftX, contentY, {
      font: `600 14px ${getFont('primary')}`,
      fillStyle: this.theme.uiText,
      align: 'center'
    });
    
    this.drawText(this.state.awayScore.toString(), leftX, contentY + 25, {
      font: `bold 24px ${getFont('mono')}`,
      fillStyle: this.theme.primary,
      align: 'center'
    });
    
    // Home team
    this.drawText('HOME', rightX, contentY, {
      font: `600 14px ${getFont('primary')}`,
      fillStyle: this.theme.uiText,
      align: 'center'
    });
    
    this.drawText(this.state.homeScore.toString(), rightX, contentY + 25, {
      font: `bold 24px ${getFont('mono')}`,
      fillStyle: this.theme.primary,
      align: 'center'
    });
    
    // Inning indicator
    const inningText = `${this.state.topHalf ? '▲' : '▼'} ${this.state.inning}`;
    this.drawText(inningText, element.x + element.width/2, element.y + element.height - 15, {
      font: `600 16px ${getFont('secondary')}`,
      fillStyle: this.theme.secondary,
      align: 'center'
    });
    
    this.ctx.restore();
  }

  private drawCountDisplay(): void {
    const element = this.elements.get('countDisplay')!;
    
    this.ctx.save();
    this.ctx.globalAlpha = element.opacity;
    
    // Background
    this.drawCard(element.x, element.y, element.width, element.height, 'Count');
    
    // Count display
    const centerX = element.x + element.width / 2;
    const centerY = element.y + 35;
    
    this.drawText(`${this.state.balls} - ${this.state.strikes}`, centerX, centerY, {
      font: `bold 20px ${getFont('mono')}`,
      fillStyle: this.theme.uiText,
      align: 'center'
    });
    
    // Outs display
    const outsText = `${this.state.outs} OUT${this.state.outs === 1 ? '' : 'S'}`;
    this.drawText(outsText, centerX, centerY + 25, {
      font: `600 12px ${getFont('secondary')}`,
      fillStyle: this.theme.teal,
      align: 'center'
    });
    
    this.ctx.restore();
  }

  private drawPlayResult(): void {
    const element = this.elements.get('playResult')!;
    if (!this.state.lastPlay) return;
    
    this.ctx.save();
    this.ctx.globalAlpha = element.opacity;
    
    // Animated background
    const pulseScale = 1 + Math.sin(Date.now() * 0.005) * 0.05;
    const bgWidth = element.width * pulseScale;
    const bgHeight = element.height * pulseScale;
    
    this.ctx.fillStyle = 'rgba(191, 87, 0, 0.2)';
    this.ctx.fillRect(
      element.x - bgWidth/2, 
      element.y - bgHeight/2, 
      bgWidth, 
      bgHeight
    );
    
    // Play result text with shadow
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    this.ctx.shadowBlur = 8;
    this.ctx.shadowOffsetX = 2;
    this.ctx.shadowOffsetY = 2;
    
    this.drawText(this.state.lastPlay, element.x, element.y, {
      font: `bold 28px ${getFont('primary')}`,
      fillStyle: this.theme.primary,
      align: 'center',
      baseline: 'middle'
    });
    
    this.ctx.restore();
  }

  private drawGameStatus(): void {
    const element = this.elements.get('gameStatus')!;
    
    if (this.state.gamePhase !== 'complete') return;
    
    this.ctx.save();
    this.ctx.globalAlpha = element.opacity;
    
    // Overlay background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, 1024, 768);
    
    // Determine winner
    let resultText = 'TIE GAME!';
    let resultColor = this.theme.teal;
    
    if (this.state.homeScore > this.state.awayScore) {
      resultText = 'HOME TEAM WINS!';
      resultColor = this.theme.primary;
    } else if (this.state.awayScore > this.state.homeScore) {
      resultText = 'AWAY TEAM WINS!';
      resultColor = this.theme.secondary;
    }
    
    // Championship-style result display
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    this.ctx.shadowBlur = 12;
    this.ctx.shadowOffsetX = 4;
    this.ctx.shadowOffsetY = 4;
    
    this.drawText(resultText, 512, 300, {
      font: `black 56px ${getFont('primary')}`,
      fillStyle: resultColor,
      strokeStyle: this.theme.navy,
      lineWidth: 3,
      align: 'center',
      baseline: 'middle'
    });
    
    // Final score
    const finalScore = `Final Score: ${this.state.awayScore} - ${this.state.homeScore}`;
    this.drawText(finalScore, 512, 380, {
      font: `600 32px ${getFont('secondary')}`,
      fillStyle: this.theme.uiText,
      align: 'center',
      baseline: 'middle'
    });
    
    // Instruction text
    this.drawText('Press SPACE to play again', 512, 450, {
      font: `500 24px ${getFont('secondary')}`,
      fillStyle: this.theme.teal,
      align: 'center',
      baseline: 'middle'
    });
    
    this.ctx.restore();
  }

  private drawCard(x: number, y: number, width: number, height: number, title?: string): void {
    // Glassmorphic card background
    this.ctx.fillStyle = this.theme.uiBackground;
    this.ctx.fillRect(x, y, width, height);
    
    // Border with brand accent
    this.ctx.strokeStyle = this.theme.primary;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x, y, width, height);
    
    // Accent bar
    this.ctx.fillStyle = this.theme.primary;
    this.ctx.fillRect(x, y, width, 4);
    
    // Title
    if (title) {
      this.drawText(title, x + 12, y + 18, {
        font: `600 12px ${getFont('primary')}`,
        fillStyle: this.theme.uiText,
        align: 'left'
      });
    }
  }

  private drawText(text: string, x: number, y: number, options: {
    font: string;
    fillStyle: string;
    strokeStyle?: string;
    lineWidth?: number;
    align?: CanvasTextAlign;
    baseline?: CanvasTextBaseline;
  }): void {
    this.ctx.font = options.font;
    this.ctx.fillStyle = options.fillStyle;
    this.ctx.textAlign = options.align || 'left';
    this.ctx.textBaseline = options.baseline || 'top';
    
    if (options.strokeStyle && options.lineWidth) {
      this.ctx.strokeStyle = options.strokeStyle;
      this.ctx.lineWidth = options.lineWidth;
      this.ctx.strokeText(text, x, y);
    }
    
    this.ctx.fillText(text, x, y);
  }

  private updateAnimations(): void {
    // Animate play result display
    const playResultElement = this.elements.get('playResult')!;
    if (this.state.lastPlay && !playResultElement.visible) {
      this.showPlayResult();
    }
    
    // Auto-hide play result after 3 seconds
    if (playResultElement.visible) {
      const animation = this.animations.get('playResult') || 0;
      if (animation > 3000) {
        this.hidePlayResult();
      } else {
        this.animations.set('playResult', animation + 16); // ~60fps
      }
    }
    
    // Show game status when game ends
    const gameStatusElement = this.elements.get('gameStatus')!;
    if (this.state.gamePhase === 'complete' && !gameStatusElement.visible) {
      this.showGameStatus();
    }
  }

  private showPlayResult(): void {
    const element = this.elements.get('playResult')!;
    element.visible = true;
    element.opacity = 1;
    this.animations.set('playResult', 0);
  }

  private hidePlayResult(): void {
    const element = this.elements.get('playResult')!;
    element.visible = false;
    element.opacity = 0;
    this.animations.delete('playResult');
  }

  private showGameStatus(): void {
    const element = this.elements.get('gameStatus')!;
    element.visible = true;
    element.opacity = 1;
  }

  // Public methods for controlling HUD
  public showElement(name: string): void {
    const element = this.elements.get(name);
    if (element) {
      element.visible = true;
      element.opacity = 1;
    }
  }

  public hideElement(name: string): void {
    const element = this.elements.get(name);
    if (element) {
      element.visible = false;
      element.opacity = 0;
    }
  }

  public setElementOpacity(name: string, opacity: number): void {
    const element = this.elements.get(name);
    if (element) {
      element.opacity = Math.max(0, Math.min(1, opacity));
    }
  }

  public reset(): void {
    // Reset all animations and visibility states
    this.animations.clear();
    
    this.elements.get('scoreboard')!.visible = true;
    this.elements.get('countDisplay')!.visible = true;
    this.elements.get('playResult')!.visible = false;
    this.elements.get('gameStatus')!.visible = false;
  }
}