import Phaser from 'phaser';

type Handlers = {
  onTap: () => void;
};

export function registerInputHandlers(scene: Phaser.Scene, handlers: Handlers) {
  const pointerUp = () => {
    handlers.onTap();
  };

  scene.input.on('pointerup', pointerUp);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.input.off('pointerup', pointerUp);
  });
}

export function unregisterInputHandlers(scene: Phaser.Scene) {
  scene.input.removeAllListeners('pointerup');
}
