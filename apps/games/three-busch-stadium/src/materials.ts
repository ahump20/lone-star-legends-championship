import {
  CanvasTexture,
  Color,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  RepeatWrapping,
  Texture,
  Vector2,
} from 'three';

function createCanvasTexture(width: number, height: number, painter: (ctx: CanvasRenderingContext2D) => void): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Unable to create 2D context for procedural texture');
  }
  painter(ctx);
  const texture = new CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat = new Vector2(1, 1);
  texture.anisotropy = 16;
  texture.needsUpdate = true;
  return texture;
}

export function createGrassTexture(): Texture {
  return createCanvasTexture(1024, 1024, (ctx) => {
    ctx.fillStyle = '#1f6b3b';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    const stripeWidth = ctx.canvas.width / 16;
    for (let i = 0; i < 16; i += 1) {
      ctx.fillStyle = i % 2 === 0 ? '#267f45' : '#1c5d35';
      ctx.globalAlpha = 0.9;
      ctx.fillRect(i * stripeWidth, 0, stripeWidth, ctx.canvas.height);
    }
    ctx.globalAlpha = 1;
    const radialGradient = ctx.createRadialGradient(
      ctx.canvas.width / 2,
      ctx.canvas.height / 2,
      0,
      ctx.canvas.width / 2,
      ctx.canvas.height / 2,
      ctx.canvas.width / 2,
    );
    radialGradient.addColorStop(0, 'rgba(255,255,255,0.08)');
    radialGradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = radialGradient;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  });
}

export function createInfieldTexture(): Texture {
  return createCanvasTexture(1024, 1024, (ctx) => {
    const baseColor = ctx.createLinearGradient(0, 0, ctx.canvas.width, ctx.canvas.height);
    baseColor.addColorStop(0, '#b4804a');
    baseColor.addColorStop(1, '#80522b');
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 2;
    for (let y = 32; y < ctx.canvas.height; y += 28) {
      ctx.beginPath();
      ctx.moveTo(0, y + Math.sin(y * 0.1) * 4);
      ctx.lineTo(ctx.canvas.width, y + Math.cos(y * 0.07) * 4);
      ctx.stroke();
    }
  });
}

export function createSeatingMaterial(primaryColor: string, secondaryColor: string): MeshStandardMaterial {
  const texture = createCanvasTexture(1024, 1024, (ctx) => {
    ctx.fillStyle = primaryColor;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = secondaryColor;
    for (let row = 0; row < 64; row += 1) {
      const rowY = (row / 64) * ctx.canvas.height;
      ctx.fillRect(0, rowY, ctx.canvas.width, 6);
    }
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  });

  return new MeshStandardMaterial({
    map: texture,
    metalness: 0.05,
    roughness: 0.55,
    color: new Color(primaryColor).multiplyScalar(0.9),
  });
}

export function createConcreteMaterial(): MeshStandardMaterial {
  return new MeshStandardMaterial({
    color: '#a3a3a3',
    roughness: 0.8,
    metalness: 0.05,
  });
}

export function createSteelMaterial(): MeshPhysicalMaterial {
  return new MeshPhysicalMaterial({
    color: '#d4d6db',
    roughness: 0.35,
    metalness: 0.95,
    reflectivity: 0.9,
    clearcoat: 0.6,
    clearcoatRoughness: 0.2,
  });
}

export function createGlassMaterial(color: string, opacity = 0.55): MeshPhysicalMaterial {
  return new MeshPhysicalMaterial({
    color,
    roughness: 0.05,
    metalness: 0,
    transparent: true,
    opacity,
    transmission: 0.9,
    thickness: 0.35,
  });
}
