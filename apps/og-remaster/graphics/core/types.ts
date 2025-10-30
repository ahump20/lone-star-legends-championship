/**
 * Core types for the Blaze Graphics Engine
 * Provides type safety across the rendering pipeline
 */

export type RenderBackend = 'webgl2' | 'webgl' | 'canvas2d';
export type Quality = 'high' | 'medium' | 'low' | 'auto';

export interface Vector2 {
  x: number;
  y: number;
}

export interface Vector3 extends Vector2 {
  z: number;
}

export interface Transform {
  position: Vector2;
  rotation: number; // radians
  scale: Vector2;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Color {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface RenderOptions {
  opacity?: number;
  blend?: BlendMode;
  tint?: Color;
  smooth?: boolean;
}

export type BlendMode = 'normal' | 'add' | 'multiply' | 'screen';

export interface Texture {
  width: number;
  height: number;
  source: HTMLImageElement | HTMLCanvasElement | ImageBitmap;
  id: string;
}

export interface SpriteFrame {
  x: number;
  y: number;
  width: number;
  height: number;
  pivotX?: number;
  pivotY?: number;
}

export interface Animation {
  name: string;
  frames: number[];
  fps: number;
  loop?: boolean;
}

export interface RendererConfig {
  canvas: HTMLCanvasElement;
  width?: number;
  height?: number;
  resolution?: number;
  backgroundColor?: Color;
  antialias?: boolean;
  powerPreference?: 'high-performance' | 'low-power' | 'default';
}

export interface Camera {
  position: Vector2;
  zoom: number;
  rotation: number;
  bounds?: Bounds;
}
