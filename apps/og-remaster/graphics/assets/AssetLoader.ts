/**
 * AssetLoader - Loads and manages game assets
 * Integrates with existing sprite manifest system
 */

import type { Texture, SpriteFrame, Animation } from '../core/types';

export interface SpriteManifest {
  characters: CharacterSprite[];
}

export interface CharacterSprite {
  id: string;
  name: string;
  spriteSheet: string;
  colorPalette: string;
  stats: {
    speed: number;
    contact: number;
    power: number;
    arm: number;
    fielding: number;
  };
  sprites: {
    type: string;
    frameCount: number;
    frames: SpriteFrameData[];
  }[];
}

export interface SpriteFrameData {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export class AssetLoader {
  private textures: Map<string, Texture> = new Map();
  private spriteData: Map<string, { frames: SpriteFrame[]; animations: Map<string, Animation> }> = new Map();
  private loadingPromises: Map<string, Promise<any>> = new Map();

  /**
   * Load a sprite manifest (compatible with existing format)
   */
  async loadSpriteManifest(manifestPath: string): Promise<void> {
    const response = await fetch(manifestPath);
    const manifest: SpriteManifest = await response.json();

    const promises = manifest.characters.map(char => this.loadCharacter(char));
    await Promise.all(promises);
  }

  /**
   * Load a single character sprite sheet
   */
  private async loadCharacter(character: CharacterSprite): Promise<void> {
    // Load sprite sheet image
    const texture = await this.loadTexture(character.id, character.spriteSheet);

    // Parse sprite frames
    const frames: SpriteFrame[] = [];
    const animations = new Map<string, Animation>();

    for (const spriteGroup of character.sprites) {
      const frameIndices: number[] = [];

      for (const frame of spriteGroup.frames) {
        frames.push({
          x: frame.x,
          y: frame.y,
          width: frame.width,
          height: frame.height,
          pivotX: 0.5,
          pivotY: 0.5
        });
        frameIndices.push(frames.length - 1);
      }

      // Create animation from sprite group
      const fps = this.getFpsForAnimationType(spriteGroup.type);
      animations.set(spriteGroup.type, {
        name: spriteGroup.type,
        frames: frameIndices,
        fps,
        loop: spriteGroup.type === 'running' || spriteGroup.type === 'idle'
      });
    }

    this.spriteData.set(character.id, { frames, animations });
  }

  /**
   * Load an image as a texture
   */
  async loadTexture(id: string, path: string): Promise<Texture> {
    // Check if already loaded
    if (this.textures.has(id)) {
      return this.textures.get(id)!;
    }

    // Check if currently loading
    if (this.loadingPromises.has(id)) {
      return this.loadingPromises.get(id)!;
    }

    // Load image
    const promise = new Promise<Texture>((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        const texture: Texture = {
          width: img.width,
          height: img.height,
          source: img,
          id
        };
        this.textures.set(id, texture);
        this.loadingPromises.delete(id);
        resolve(texture);
      };

      img.onerror = () => {
        this.loadingPromises.delete(id);
        reject(new Error(`Failed to load texture: ${path}`));
      };

      img.src = path;
    });

    this.loadingPromises.set(id, promise);
    return promise;
  }

  /**
   * Get texture by ID
   */
  getTexture(id: string): Texture | undefined {
    return this.textures.get(id);
  }

  /**
   * Get sprite frames for a character
   */
  getSpriteFrames(id: string): SpriteFrame[] | undefined {
    return this.spriteData.get(id)?.frames;
  }

  /**
   * Get animations for a character
   */
  getAnimations(id: string): Map<string, Animation> | undefined {
    return this.spriteData.get(id)?.animations;
  }

  /**
   * Get FPS based on animation type
   */
  private getFpsForAnimationType(type: string): number {
    const fpsMap: Record<string, number> = {
      'batting': 12,
      'pitching': 10,
      'fielding': 8,
      'running': 8,
      'idle': 4
    };
    return fpsMap[type] || 8;
  }

  /**
   * Clear all loaded assets
   */
  clear(): void {
    this.textures.clear();
    this.spriteData.clear();
    this.loadingPromises.clear();
  }
}
