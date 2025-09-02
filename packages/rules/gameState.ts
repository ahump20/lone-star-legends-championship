/**
 * Stub implementation of GameState for the OG remaster. This class holds
 * simple representations of players and the ball and exposes methods
 * expected by the input handlers and renderer. Real game logic should
 * replace these placeholders.
 */
export class GameState {
  public players: { x: number; y: number }[];
  public ball: { x: number; y: number };
  public inning: number;
  public inningHalf: string;
  public balls: number;
  public strikes: number;
  public outs: number;

  constructor() {
    // Initialize with one player on field for demonstration
    this.players = [{ x: 400, y: 500 }];
    this.ball = { x: 512, y: 384 };
    this.inning = 1;
    this.inningHalf = "top";
    this.balls = 0;
    this.strikes = 0;
    this.outs = 0;
  }

  /**
   * Placeholder update method. In a real game, this would advance
   * simulation time, handle physics, AI, etc.
   */
  update() {
    // For now, move the ball slowly across the screen
    this.ball.x = (this.ball.x + 1) % 1024;
  }

  /**
   * Swing the bat: simply log and increment strikes.
   */
  swingBat() {
    console.log("Swing!");
    this.strikes = (this.strikes + 1) % 3;
    if (this.strikes === 0) {
      this.outs = (this.outs + 1) % 3;
    }
  }

  /**
   * Pitch: adjust ball position based on direction string. This is a stub.
   */
  pitch(dir: string) {
    console.log(`Pitch ${dir}`);
    // Adjust ball y coordinate by direction
    if (dir === "up") this.ball.y -= 5;
    if (dir === "down") this.ball.y += 5;
  }

  /**
   * Advance or retreat a runner. Stub: move the first player on x-axis.
   */
  advanceRunner(delta: number) {
    if (this.players.length > 0) {
      this.players[0].x += delta * 10;
    }
  }
}