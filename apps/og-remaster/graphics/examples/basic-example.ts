/**
 * Basic Example - Simple character animation
 */

import { createGame } from '../index';

async function main() {
  // Create game instance
  const game = createGame('#gameCanvas', {
    autoResize: true,
    antialias: true
  });

  // Load sprites
  await game.load('/assets/sprites/manifest.json');

  // Create a batter
  const batter = game.createCharacter('ace', {
    position: { x: 400, y: 300 },
    animation: 'batting',
    scale: 2
  });

  // Add glow effect
  game.effects.addGlow(
    batter,
    game.theme.getColor('primary'),
    1.0,
    true // pulse
  );

  // Start game loop
  game.start();

  // Simulate hit after 1 second
  setTimeout(() => {
    game.effects.hitImpact(
      batter.transform.position,
      game.theme.getColor('accent')
    );
  }, 1000);

  // Show stats
  setInterval(() => {
    const stats = game.getStats();
    console.log(`FPS: ${stats.fps} | Entities: ${stats.entityCount}`);
  }, 1000);
}

main().catch(console.error);
