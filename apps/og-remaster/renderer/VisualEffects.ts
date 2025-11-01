/**
 * Additional visual effects for the game
 */

export class VisualEffects {
  private stars: Star[] = [];
  private clouds: Cloud[] = [];

  constructor(private width: number, private height: number) {
    this.initializeStars();
    this.initializeClouds();
  }

  /**
   * Create starfield for nighttime atmosphere
   */
  private initializeStars(): void {
    const numStars = 100;
    for (let i = 0; i < numStars; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height * 0.5, // Only in upper half
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.3,
        twinkleSpeed: Math.random() * 0.02 + 0.01,
        twinklePhase: Math.random() * Math.PI * 2
      });
    }
  }

  /**
   * Create subtle clouds
   */
  private initializeClouds(): void {
    const numClouds = 8;
    for (let i = 0; i < numClouds; i++) {
      this.clouds.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height * 0.3,
        width: Math.random() * 150 + 100,
        height: Math.random() * 50 + 30,
        speed: Math.random() * 0.2 + 0.1,
        opacity: Math.random() * 0.15 + 0.05
      });
    }
  }

  /**
   * Draw starfield
   */
  public drawStars(ctx: CanvasRenderingContext2D, time: number): void {
    ctx.save();

    this.stars.forEach(star => {
      // Twinkle effect
      const twinkle = Math.sin(time * star.twinkleSpeed + star.twinklePhase);
      const opacity = star.opacity + twinkle * 0.2;

      ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();

      // Glow for larger stars
      if (star.size > 1.5) {
        const gradient = ctx.createRadialGradient(
          star.x, star.y, 0,
          star.x, star.y, star.size * 3
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, ${opacity * 0.3})`);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    ctx.restore();
  }

  /**
   * Draw clouds
   */
  public drawClouds(ctx: CanvasRenderingContext2D, deltaTime: number): void {
    ctx.save();

    this.clouds.forEach(cloud => {
      // Move cloud
      cloud.x += cloud.speed * deltaTime * 0.01;
      if (cloud.x > this.width + cloud.width) {
        cloud.x = -cloud.width;
      }

      // Draw cloud as soft ellipse
      const gradient = ctx.createRadialGradient(
        cloud.x, cloud.y, 0,
        cloud.x, cloud.y, cloud.width * 0.7
      );
      gradient.addColorStop(0, `rgba(255, 255, 255, ${cloud.opacity})`);
      gradient.addColorStop(0.5, `rgba(255, 255, 255, ${cloud.opacity * 0.5})`);
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(
        cloud.x, cloud.y,
        cloud.width, cloud.height,
        0, 0, Math.PI * 2
      );
      ctx.fill();
    });

    ctx.restore();
  }

  /**
   * Draw vignette effect around edges
   */
  public drawVignette(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    const gradient = ctx.createRadialGradient(
      this.width / 2, this.height / 2, this.height * 0.3,
      this.width / 2, this.height / 2, this.height * 0.8
    );
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.restore();
  }

  /**
   * Draw crowd in stands (simple silhouettes)
   */
  public drawCrowd(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // Left stands
    this.drawStandSection(ctx, 50, 200, 200, 150);

    // Right stands
    this.drawStandSection(ctx, this.width - 250, 200, 200, 150);

    ctx.restore();
  }

  private drawStandSection(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number): void {
    // Stand structure
    ctx.fillStyle = 'rgba(20, 30, 50, 0.7)';
    ctx.fillRect(x, y, width, height);

    // Crowd silhouettes
    const rows = 8;
    const cols = 15;
    const personWidth = width / cols;
    const personHeight = height / rows;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // Random crowd member presence
        if (Math.random() > 0.2) {
          const px = x + col * personWidth + personWidth / 2;
          const py = y + row * personHeight + personHeight;

          // Head
          ctx.fillStyle = `rgba(${Math.random() * 50 + 40}, ${Math.random() * 50 + 40}, ${Math.random() * 50 + 60}, 0.6)`;
          ctx.beginPath();
          ctx.arc(px, py - personHeight * 0.3, personWidth * 0.3, 0, Math.PI * 2);
          ctx.fill();

          // Body (simple rectangle)
          ctx.fillRect(
            px - personWidth * 0.25,
            py - personHeight * 0.2,
            personWidth * 0.5,
            personHeight * 0.5
          );
        }
      }
    }
  }

  /**
   * Resize effects when canvas size changes
   */
  public resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    // Reinitialize effects for new dimensions
    this.stars = [];
    this.clouds = [];
    this.initializeStars();
    this.initializeClouds();
  }
}

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
  twinklePhase: number;
}

interface Cloud {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  opacity: number;
}
