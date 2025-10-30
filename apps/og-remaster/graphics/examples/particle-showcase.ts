/**
 * Particle Showcase - Demonstrates all particle effects
 */

import { createGame } from '../index';

async function main() {
  const game = createGame('#gameCanvas', {
    autoResize: true,
    antialias: true
  });

  await game.load('/assets/sprites/manifest.json');

  game.start();

  const colors = {
    orange: game.theme.getColor('primary'),
    teal: game.theme.getColor('secondary'),
    yellow: game.theme.getColor('accent')
  };

  // Demo different effects every 2 seconds
  const effects = [
    () => {
      console.log('Explosion');
      game.effects.hitImpact({ x: 400, y: 300 }, colors.orange);
    },
    () => {
      console.log('Home Run');
      game.effects.homeRun({ x: 400, y: 300 });
    },
    () => {
      console.log('Slide Effect');
      game.effects.slideEffect({ x: 400, y: 300 });
    },
    () => {
      console.log('Strikeout');
      game.effects.strikeout({ x: 400, y: 300 });
    },
    () => {
      console.log('Custom Sparkles');
      const emitter = game.effects.getParticleEmitter();
      emitter.sparkle({ x: 400, y: 300 }, colors.teal);
    }
  ];

  let index = 0;
  setInterval(() => {
    effects[index % effects.length]();
    index++;
  }, 2000);
}

main().catch(console.error);
