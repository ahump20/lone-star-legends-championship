/**
 * BlazeRenderer - Multi-backend rendering engine
 *
 * Automatically selects the best available rendering backend:
 * WebGL2 → WebGL → Canvas2D (fallback)
 *
 * Provides a unified API regardless of backend
 */

import type {
  RenderBackend,
  RendererConfig,
  Transform,
  Texture,
  SpriteFrame,
  RenderOptions,
  Camera,
  Bounds,
  Color
} from './types';

export interface IRenderer {
  readonly backend: RenderBackend;
  readonly canvas: HTMLCanvasElement;

  clear(color?: Color): void;
  resize(width: number, height: number): void;
  setCamera(camera: Camera): void;

  drawSprite(
    texture: Texture,
    frame: SpriteFrame,
    transform: Transform,
    options?: RenderOptions
  ): void;

  drawRect(bounds: Bounds, color: Color, options?: RenderOptions): void;
  drawCircle(center: Vector2, radius: number, color: Color, options?: RenderOptions): void;

  beginBatch(): void;
  endBatch(): void;
  flush(): void;
}

export class BlazeRenderer {
  private renderer: IRenderer;
  public readonly backend: RenderBackend;
  public readonly canvas: HTMLCanvasElement;

  constructor(config: RendererConfig) {
    this.canvas = config.canvas;

    // Detect best available backend
    this.backend = this.detectBackend(config.powerPreference || 'default');

    // Create appropriate renderer
    this.renderer = this.createRenderer(this.backend, config);

    console.log(`[BlazeRenderer] Initialized with ${this.backend} backend`);
  }

  private detectBackend(powerPreference: 'high-performance' | 'low-power' | 'default'): RenderBackend {
    const canvas = this.canvas;

    // Try WebGL2
    try {
      const gl2 = canvas.getContext('webgl2', { powerPreference });
      if (gl2) return 'webgl2';
    } catch (e) {
      // WebGL2 not supported
    }

    // Try WebGL
    try {
      const gl = canvas.getContext('webgl', { powerPreference }) ||
                 canvas.getContext('experimental-webgl', { powerPreference });
      if (gl) return 'webgl';
    } catch (e) {
      // WebGL not supported
    }

    // Fallback to Canvas2D
    return 'canvas2d';
  }

  private createRenderer(backend: RenderBackend, config: RendererConfig): IRenderer {
    switch (backend) {
      case 'webgl2':
      case 'webgl':
        return new WebGLRenderer(config, backend);
      case 'canvas2d':
      default:
        return new Canvas2DRenderer(config);
    }
  }

  // Proxy methods to underlying renderer
  clear(color?: Color): void {
    this.renderer.clear(color);
  }

  resize(width: number, height: number): void {
    this.renderer.resize(width, height);
  }

  setCamera(camera: Camera): void {
    this.renderer.setCamera(camera);
  }

  drawSprite(
    texture: Texture,
    frame: SpriteFrame,
    transform: Transform,
    options?: RenderOptions
  ): void {
    this.renderer.drawSprite(texture, frame, transform, options);
  }

  drawRect(bounds: Bounds, color: Color, options?: RenderOptions): void {
    this.renderer.drawRect(bounds, color, options);
  }

  drawCircle(center: { x: number; y: number }, radius: number, color: Color, options?: RenderOptions): void {
    this.renderer.drawCircle(center, radius, color, options);
  }

  beginBatch(): void {
    this.renderer.beginBatch();
  }

  endBatch(): void {
    this.renderer.endBatch();
  }

  flush(): void {
    this.renderer.flush();
  }
}

/**
 * Canvas2D Renderer - Fallback implementation
 * Compatible with existing CanvasRenderer
 */
class Canvas2DRenderer implements IRenderer {
  readonly backend: RenderBackend = 'canvas2d';
  readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private camera: Camera = { position: { x: 0, y: 0 }, zoom: 1, rotation: 0 };

  constructor(config: RendererConfig) {
    this.canvas = config.canvas;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;

    if (config.width && config.height) {
      this.resize(config.width, config.height);
    }
  }

  clear(color?: Color): void {
    if (color) {
      this.ctx.fillStyle = `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, ${color.a})`;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } else {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  setCamera(camera: Camera): void {
    this.camera = camera;
  }

  drawSprite(
    texture: Texture,
    frame: SpriteFrame,
    transform: Transform,
    options?: RenderOptions
  ): void {
    this.ctx.save();

    // Apply camera transform
    this.ctx.translate(-this.camera.position.x, -this.camera.position.y);
    this.ctx.scale(this.camera.zoom, this.camera.zoom);

    // Apply sprite transform
    this.ctx.translate(transform.position.x, transform.position.y);
    this.ctx.rotate(transform.rotation);
    this.ctx.scale(transform.scale.x, transform.scale.y);

    // Apply render options
    if (options?.opacity !== undefined) {
      this.ctx.globalAlpha = options.opacity;
    }

    if (options?.blend) {
      this.ctx.globalCompositeOperation = this.getBlendMode(options.blend);
    }

    // Draw sprite
    const pivotX = frame.pivotX || 0.5;
    const pivotY = frame.pivotY || 0.5;

    this.ctx.drawImage(
      texture.source,
      frame.x, frame.y, frame.width, frame.height,
      -frame.width * pivotX, -frame.height * pivotY, frame.width, frame.height
    );

    this.ctx.restore();
  }

  drawRect(bounds: Bounds, color: Color, options?: RenderOptions): void {
    this.ctx.save();

    this.ctx.fillStyle = `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, ${color.a})`;

    if (options?.opacity !== undefined) {
      this.ctx.globalAlpha = options.opacity;
    }

    this.ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);

    this.ctx.restore();
  }

  drawCircle(center: { x: number; y: number }, radius: number, color: Color, options?: RenderOptions): void {
    this.ctx.save();

    this.ctx.fillStyle = `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, ${color.a})`;

    if (options?.opacity !== undefined) {
      this.ctx.globalAlpha = options.opacity;
    }

    this.ctx.beginPath();
    this.ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();
  }

  beginBatch(): void {
    // No-op for Canvas2D (no batching)
  }

  endBatch(): void {
    // No-op for Canvas2D
  }

  flush(): void {
    // No-op for Canvas2D
  }

  private getBlendMode(blend: string): GlobalCompositeOperation {
    const blendMap: Record<string, GlobalCompositeOperation> = {
      'normal': 'source-over',
      'add': 'lighter',
      'multiply': 'multiply',
      'screen': 'screen'
    };
    return blendMap[blend] || 'source-over';
  }
}

/**
 * WebGL Renderer - High-performance GPU-accelerated rendering
 * Includes automatic batching and sprite sheet support
 */
class WebGLRenderer implements IRenderer {
  readonly backend: RenderBackend;
  readonly canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext | WebGL2RenderingContext;
  private camera: Camera = { position: { x: 0, y: 0 }, zoom: 1, rotation: 0 };

  // Batching
  private batchSize = 0;
  private maxBatchSize = 2000;
  private currentTexture: Texture | null = null;

  // WebGL resources
  private program: WebGLProgram | null = null;
  private vertexBuffer: WebGLBuffer | null = null;
  private vertices: Float32Array;
  private vertexData: number[] = [];

  constructor(config: RendererConfig, backend: RenderBackend) {
    this.backend = backend;
    this.canvas = config.canvas;

    const gl = backend === 'webgl2'
      ? this.canvas.getContext('webgl2', { antialias: config.antialias })
      : this.canvas.getContext('webgl', { antialias: config.antialias });

    if (!gl) throw new Error('Could not get WebGL context');
    this.gl = gl;

    this.vertices = new Float32Array(this.maxBatchSize * 6 * 8); // 6 vertices per sprite, 8 floats per vertex

    this.initWebGL();

    if (config.width && config.height) {
      this.resize(config.width, config.height);
    }
  }

  private initWebGL(): void {
    const gl = this.gl;

    // Create shader program
    const vertexShader = this.createShader(gl.VERTEX_SHADER, `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      attribute vec4 a_color;

      uniform mat3 u_matrix;

      varying vec2 v_texCoord;
      varying vec4 v_color;

      void main() {
        vec3 position = u_matrix * vec3(a_position, 1.0);
        gl_Position = vec4(position.xy, 0.0, 1.0);
        v_texCoord = a_texCoord;
        v_color = a_color;
      }
    `);

    const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, `
      precision mediump float;

      varying vec2 v_texCoord;
      varying vec4 v_color;

      uniform sampler2D u_texture;

      void main() {
        gl_FragColor = texture2D(u_texture, v_texCoord) * v_color;
      }
    `);

    this.program = gl.createProgram()!;
    gl.attachShader(this.program, vertexShader);
    gl.attachShader(this.program, fragmentShader);
    gl.linkProgram(this.program);

    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      throw new Error('Shader program failed to link');
    }

    // Create vertex buffer
    this.vertexBuffer = gl.createBuffer();

    // Enable blending
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  private createShader(type: number, source: string): WebGLShader {
    const gl = this.gl;
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(`Shader compilation failed: ${info}`);
    }

    return shader;
  }

  clear(color?: Color): void {
    const gl = this.gl;
    if (color) {
      gl.clearColor(color.r, color.g, color.b, color.a);
    } else {
      gl.clearColor(0, 0, 0, 0);
    }
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.gl.viewport(0, 0, width, height);
  }

  setCamera(camera: Camera): void {
    this.camera = camera;
  }

  drawSprite(
    texture: Texture,
    frame: SpriteFrame,
    transform: Transform,
    options?: RenderOptions
  ): void {
    // Check if we need to flush (texture change or batch full)
    if ((this.currentTexture && this.currentTexture.id !== texture.id) ||
        this.batchSize >= this.maxBatchSize) {
      this.flush();
    }

    this.currentTexture = texture;

    // Calculate vertices for sprite quad
    const w = frame.width * transform.scale.x;
    const h = frame.height * transform.scale.y;
    const pivotX = frame.pivotX || 0.5;
    const pivotY = frame.pivotY || 0.5;

    const x0 = -w * pivotX;
    const y0 = -h * pivotY;
    const x1 = x0 + w;
    const y1 = y0 + h;

    // Apply rotation
    const cos = Math.cos(transform.rotation);
    const sin = Math.sin(transform.rotation);
    const px = transform.position.x;
    const py = transform.position.y;

    // UV coordinates
    const u0 = frame.x / texture.width;
    const v0 = frame.y / texture.height;
    const u1 = (frame.x + frame.width) / texture.width;
    const v1 = (frame.y + frame.height) / texture.height;

    // Color/tint
    const color = options?.tint || { r: 1, g: 1, b: 1, a: options?.opacity || 1 };

    // Add two triangles (6 vertices)
    const verts = [
      // Triangle 1
      x0 * cos - y0 * sin + px, x0 * sin + y0 * cos + py, u0, v0, color.r, color.g, color.b, color.a,
      x1 * cos - y0 * sin + px, x1 * sin + y0 * cos + py, u1, v0, color.r, color.g, color.b, color.a,
      x0 * cos - y1 * sin + px, x0 * sin + y1 * cos + py, u0, v1, color.r, color.g, color.b, color.a,
      // Triangle 2
      x0 * cos - y1 * sin + px, x0 * sin + y1 * cos + py, u0, v1, color.r, color.g, color.b, color.a,
      x1 * cos - y0 * sin + px, x1 * sin + y0 * cos + py, u1, v0, color.r, color.g, color.b, color.a,
      x1 * cos - y1 * sin + px, x1 * sin + y1 * cos + py, u1, v1, color.r, color.g, color.b, color.a,
    ];

    this.vertexData.push(...verts);
    this.batchSize++;
  }

  drawRect(bounds: Bounds, color: Color, options?: RenderOptions): void {
    // Draw rectangle as a colored sprite (no texture)
    this.flush(); // Flush any pending sprites first

    const gl = this.gl;
    // TODO: Implement rectangle rendering
  }

  drawCircle(center: { x: number; y: number }, radius: number, color: Color, options?: RenderOptions): void {
    this.flush();
    // TODO: Implement circle rendering
  }

  beginBatch(): void {
    this.batchSize = 0;
    this.vertexData = [];
    this.currentTexture = null;
  }

  endBatch(): void {
    this.flush();
  }

  flush(): void {
    if (this.batchSize === 0) return;

    const gl = this.gl;

    // Upload vertex data
    this.vertices.set(this.vertexData);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.DYNAMIC_DRAW);

    // Set up shader
    gl.useProgram(this.program);

    // Set up attributes
    const posLoc = gl.getAttribLocation(this.program!, 'a_position');
    const texLoc = gl.getAttribLocation(this.program!, 'a_texCoord');
    const colorLoc = gl.getAttribLocation(this.program!, 'a_color');

    gl.enableVertexAttribArray(posLoc);
    gl.enableVertexAttribArray(texLoc);
    gl.enableVertexAttribArray(colorLoc);

    const stride = 8 * 4; // 8 floats per vertex
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, stride, 0);
    gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, stride, 2 * 4);
    gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, stride, 4 * 4);

    // Set up camera matrix
    const matrixLoc = gl.getUniformLocation(this.program!, 'u_matrix');
    const matrix = this.getCameraMatrix();
    gl.uniformMatrix3fv(matrixLoc, false, matrix);

    // Bind texture
    if (this.currentTexture) {
      const webglTexture = this.getWebGLTexture(this.currentTexture);
      gl.bindTexture(gl.TEXTURE_2D, webglTexture);
    }

    // Draw
    gl.drawArrays(gl.TRIANGLES, 0, this.batchSize * 6);

    // Reset batch
    this.batchSize = 0;
    this.vertexData = [];
  }

  private getCameraMatrix(): Float32Array {
    // Create projection matrix for camera
    const width = this.canvas.width;
    const height = this.canvas.height;

    // Orthographic projection
    const left = this.camera.position.x - width / 2 / this.camera.zoom;
    const right = this.camera.position.x + width / 2 / this.camera.zoom;
    const bottom = this.camera.position.y + height / 2 / this.camera.zoom;
    const top = this.camera.position.y - height / 2 / this.camera.zoom;

    return new Float32Array([
      2 / (right - left), 0, 0,
      0, 2 / (top - bottom), 0,
      -(right + left) / (right - left), -(top + bottom) / (top - bottom), 1
    ]);
  }

  private textureCache = new Map<string, WebGLTexture>();

  private getWebGLTexture(texture: Texture): WebGLTexture {
    if (this.textureCache.has(texture.id)) {
      return this.textureCache.get(texture.id)!;
    }

    const gl = this.gl;
    const webglTexture = gl.createTexture()!;

    gl.bindTexture(gl.TEXTURE_2D, webglTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.source);

    // Set texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    this.textureCache.set(texture.id, webglTexture);
    return webglTexture;
  }
}
