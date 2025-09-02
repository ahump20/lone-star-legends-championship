import { GameState } from "../../../packages/rules/gameState";
import { readTheme } from "../theme";

/**
 * HUD draws the scoreboard overlay for the OG mode. It reads
 * theme variables for accent colors and uses a semi-transparent
 * background panel. The GameState should expose inning, balls,
 * strikes and outs.
 */
export class HUD {
  private ctx: CanvasRenderingContext2D;
  private state: GameState;
  private theme = readTheme();

  constructor(ctx: CanvasRenderingContext2D, state: GameState) {
    this.ctx = ctx;
    this.state = state;
  }

  /**
   * Render the HUD at the top-left corner of the canvas.
   */
  render() {
    // Background panel
    this.ctx.save();
    this.ctx.globalAlpha = 0.9;
    this.ctx.fillStyle = "rgba(0,0,0,0.65)";
    this.ctx.fillRect(20, 20, 220, 130);
    // Accent bar
    this.ctx.fillStyle = this.theme.uiAccent;
    this.ctx.fillRect(20, 20, 220, 6);
    // Text
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "16px var(--bi-font-secondary), Inter, Arial";
    const inning = (this.state as any).inning || 1;
    const half = (this.state as any).inningHalf || "top";
    const balls = (this.state as any).balls || 0;
    const strikes = (this.state as any).strikes || 0;
    const outs = (this.state as any).outs || 0;
    this.ctx.fillText(`Inning: ${half} ${inning}`, 32, 54);
    this.ctx.fillText(`Balls: ${balls}`, 32, 76);
    this.ctx.fillText(`Strikes: ${strikes}`, 32, 98);
    this.ctx.fillText(`Outs: ${outs}`, 32, 120);
    this.ctx.restore();
  }
}