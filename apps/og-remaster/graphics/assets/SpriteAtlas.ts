/**
 * SpriteAtlas - Optimized sprite sheet manager
 * Packs multiple sprites into a single texture for efficient rendering
 */

import type { Texture, SpriteFrame } from '../core/types';

export interface AtlasFrame {
  name: string;
  frame: SpriteFrame;
}

export class SpriteAtlas {
  private frames: Map<string, SpriteFrame> = new Map();

  constructor(
    public readonly texture: Texture,
    frames: AtlasFrame[]
  ) {
    for (const { name, frame } of frames) {
      this.frames.set(name, frame);
    }
  }

  /**
   * Get a sprite frame by name
   */
  getFrame(name: string): SpriteFrame | undefined {
    return this.frames.get(name);
  }

  /**
   * Get all frame names
   */
  getFrameNames(): string[] {
    return Array.from(this.frames.keys());
  }

  /**
   * Get frames by prefix (useful for animations)
   */
  getFramesByPrefix(prefix: string): SpriteFrame[] {
    const frames: SpriteFrame[] = [];
    for (const [name, frame] of this.frames) {
      if (name.startsWith(prefix)) {
        frames.push(frame);
      }
    }
    return frames;
  }

  /**
   * Create an atlas from a sprite sheet grid
   */
  static fromGrid(
    texture: Texture,
    frameWidth: number,
    frameHeight: number,
    options?: {
      margin?: number;
      spacing?: number;
      startFrame?: number;
      endFrame?: number;
    }
  ): SpriteAtlas {
    const margin = options?.margin || 0;
    const spacing = options?.spacing || 0;

    const cols = Math.floor((texture.width - margin * 2 + spacing) / (frameWidth + spacing));
    const rows = Math.floor((texture.height - margin * 2 + spacing) / (frameHeight + spacing));

    const totalFrames = cols * rows;
    const startFrame = options?.startFrame || 0;
    const endFrame = options?.endFrame || totalFrames;

    const frames: AtlasFrame[] = [];

    for (let i = startFrame; i < endFrame; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;

      const x = margin + col * (frameWidth + spacing);
      const y = margin + row * (frameHeight + spacing);

      frames.push({
        name: `frame_${i}`,
        frame: {
          x,
          y,
          width: frameWidth,
          height: frameHeight,
          pivotX: 0.5,
          pivotY: 0.5
        }
      });
    }

    return new SpriteAtlas(texture, frames);
  }
}
