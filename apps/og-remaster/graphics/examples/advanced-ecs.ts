/**
 * Advanced ECS Example - Custom components and systems
 */

import { createGame } from '../index';
import { Component, Entity, System, VelocityComponent } from '../index';

// Custom component
class BouncingComponent extends Component {
  constructor(
    public bounds: { width: number; height: number },
    public bounceFactor: number = 0.8
  ) {
    super();
  }

  update(deltaTime: number): void {
    if (!this.entity) return;

    const pos = this.entity.transform.position;
    const vel = this.entity.getComponent(VelocityComponent);
    if (!vel) return;

    // Bounce off edges
    if (pos.x < 0 || pos.x > this.bounds.width) {
      vel.velocity.x *= -this.bounceFactor;
      pos.x = Math.max(0, Math.min(this.bounds.width, pos.x));
    }

    if (pos.y < 0 || pos.y > this.bounds.height) {
      vel.velocity.y *= -this.bounceFactor;
      pos.y = Math.max(0, Math.min(this.bounds.height, pos.y));
    }
  }
}

// Custom system
class GravitySystem extends System {
  constructor(private gravity: number = 200) {
    super();
  }

  protected shouldProcess(entity: Entity): boolean {
    return entity.hasComponent(VelocityComponent) && entity.hasTag('gravity');
  }

  update(deltaTime: number, entities: Entity[]): void {
    const dt = deltaTime / 1000;

    for (const entity of this.filter(entities)) {
      const vel = entity.getComponent(VelocityComponent)!;
      vel.velocity.y += this.gravity * dt;
    }
  }
}

async function main() {
  const game = createGame('#gameCanvas', {
    width: 800,
    height: 600,
    autoResize: false
  });

  await game.load('/assets/sprites/manifest.json');

  // Add custom gravity system
  game.scene.addSystem(new GravitySystem(300));

  // Create bouncing balls
  for (let i = 0; i < 10; i++) {
    const ball = game.createCharacter('ace', {
      position: {
        x: 100 + i * 60,
        y: 100 + Math.random() * 200
      },
      scale: 0.5
    });

    ball.addTag('gravity');
    ball.addComponent(new VelocityComponent({
      x: (Math.random() - 0.5) * 200,
      y: (Math.random() - 0.5) * 200
    }));
    ball.addComponent(new BouncingComponent({ width: 800, height: 600 }));

    // Add trail effect
    game.effects.addTrail(ball, {
      r: Math.random(),
      g: Math.random(),
      b: Math.random(),
      a: 1
    });
  }

  game.start();

  console.log('Custom ECS demo running...');
  console.log('10 bouncing balls with gravity and trails');
}

main().catch(console.error);
