/**
 * Integration Example - Using new graphics engine with existing game
 */

import { createGame } from '../index';
import type { BlazeGame } from '../BlazeGame';

/**
 * Wrapper to integrate graphics engine with existing game loop
 */
class GameIntegration {
  private blazeGame: BlazeGame;
  private characterEntities: Map<string, any> = new Map();

  constructor(canvas: HTMLCanvasElement) {
    this.blazeGame = createGame(canvas, {
      autoResize: true,
      antialias: true
    });
  }

  async initialize(manifestPath: string): Promise<void> {
    await this.blazeGame.load(manifestPath);
    console.log('[Integration] Graphics engine initialized');
  }

  /**
   * Create a player character
   */
  createPlayer(id: string, characterType: string, position: { x: number; y: number }): void {
    const entity = this.blazeGame.createCharacter(characterType, {
      position,
      scale: 2
    });

    entity.name = id;
    this.characterEntities.set(id, entity);

    console.log(`[Integration] Created player: ${id}`);
  }

  /**
   * Update character animation
   */
  playAnimation(id: string, animationName: string): void {
    const entity = this.characterEntities.get(id);
    if (!entity) return;

    const animComponent = entity.getComponent(AnimationComponent);
    if (animComponent) {
      animComponent.play(animationName);
    }
  }

  /**
   * Move character
   */
  moveCharacter(id: string, x: number, y: number): void {
    const entity = this.characterEntities.get(id);
    if (entity) {
      entity.transform.position.x = x;
      entity.transform.position.y = y;
    }
  }

  /**
   * Trigger hit effect
   */
  showHitEffect(position: { x: number; y: number }): void {
    this.blazeGame.effects.hitImpact(
      position,
      this.blazeGame.theme.getColor('primary')
    );
  }

  /**
   * Trigger home run effect
   */
  showHomeRunEffect(position: { x: number; y: number }): void {
    this.blazeGame.effects.homeRun(position);
  }

  /**
   * Add power-up effect to character
   */
  addPowerUp(id: string): void {
    const entity = this.characterEntities.get(id);
    if (entity) {
      this.blazeGame.effects.powerUp(
        entity,
        this.blazeGame.theme.getColor('accent')
      );
    }
  }

  /**
   * Start rendering
   */
  start(): void {
    this.blazeGame.start();
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.blazeGame.destroy();
    this.characterEntities.clear();
  }
}

// Usage example
async function main() {
  const canvas = document.querySelector('#gameCanvas') as HTMLCanvasElement;
  const integration = new GameIntegration(canvas);

  await integration.initialize('/assets/sprites/manifest.json');

  // Create players
  integration.createPlayer('batter', 'ace', { x: 400, y: 400 });
  integration.createPlayer('pitcher', 'skye', { x: 400, y: 200 });

  integration.start();

  // Simulate game events
  setTimeout(() => {
    integration.playAnimation('pitcher', 'pitching');
  }, 500);

  setTimeout(() => {
    integration.playAnimation('batter', 'batting');
  }, 1000);

  setTimeout(() => {
    integration.showHitEffect({ x: 450, y: 380 });
  }, 1500);

  setTimeout(() => {
    integration.showHomeRunEffect({ x: 500, y: 350 });
  }, 2000);
}

// Import for AnimationComponent
import { AnimationComponent } from '../index';

export { GameIntegration };

if (typeof window !== 'undefined') {
  main().catch(console.error);
}
