import { GameState } from "../../../packages/rules/gameState";
import { readTheme, Theme } from "../theme";

/**
 * The CanvasRenderer encapsulates all drawing logic for the OG mode. It
 * accesses the current theme for colors and draws the field, players,
 * and ball. Entities are currently represented as circles; sprite
 * integration can be added via the theme or asset pipeline.
 */
export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  private state: GameState;
  private theme: Theme;

  constructor(ctx: CanvasRenderingContext2D, state: GameState) {
    this.ctx = ctx;
    this.state = state;
    this.theme = readTheme();
  }

  /**
   * Render the entire frame: clear, draw the field, players, and ball.
   */
  render() {
    this.ctx.clearRect(0, 0, 1024, 768);
    this.drawField();
    this.drawPlayers();
    this.drawBall();
  }

  /**
   * Draw the sandlot field, including grass, dirt infield, and foul lines.
   */
  private drawField() {
    // Background grass
    this.ctx.fillStyle = this.theme.field;
    this.ctx.fillRect(0, 0, 1024, 768);
    // Infield dirt ellipse
    this.ctx.fillStyle = this.theme.dirt;
    this.ctx.beginPath();
    this.ctx.ellipse(512, 420, 220, 120, 0, 0, Math.PI * 2);
    this.ctx.fill();
    // Foul lines
    this.ctx.strokeStyle = this.theme.lines;
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    this.ctx.moveTo(512, 420);
    this.ctx.lineTo(1024, 700);
    this.ctx.moveTo(512, 420);
    this.ctx.lineTo(0, 700);
    this.ctx.stroke();
    // Bases: simple white squares for now
    const drawBase = (x: number, y: number) => {
      this.ctx.fillStyle = this.theme.lines;
      this.ctx.fillRect(x - 10, y - 10, 20, 20);
    };
    drawBase(512, 420); // home
    drawBase(880, 700); // first
    drawBase(512, 980); // second (off-canvas for demonstration)
    drawBase(80, 700); // third
  }

  /**
   * Draw players as simple circles using the UI accent color.
   */
  private drawPlayers() {
    this.ctx.fillStyle = this.theme.uiAccent;
    // Fallback if players array missing
    const players = (this.state as any).players || [];
    for (const p of players) {
      this.ctx.beginPath();
      this.ctx.arc(p.x || 0, p.y || 0, 12, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  /**
   * Draw the ball as a white circle. Uses hardcoded radius for now.
   */
  private drawBall() {
    const ball = (this.state as any).ball || { x: 512, y: 384 };
    this.ctx.fillStyle = "#ffffff";
    this.ctx.beginPath();
    this.ctx.arc(ball.x, ball.y, 6, 0, Math.PI * 2);
    this.ctx.fill();
  }
}