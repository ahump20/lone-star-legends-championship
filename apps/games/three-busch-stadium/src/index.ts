import {
  ACESFilmicToneMapping,
  Clock,
  Color,
  type ColorRepresentation,
  PCFSoftShadowMap,
  SRGBColorSpace,
  WebGLRenderer,
} from 'three';

import { buildBuschStadiumScene } from './buschStadiumScene';
import type { BuschStadiumSceneOptions } from './types';

export interface StadiumInstance {
  renderer: WebGLRenderer;
  destroy: () => void;
  updateOptions: (options: Partial<BuschStadiumSceneOptions>) => void;
}

const DEFAULT_OPTIONS: BuschStadiumSceneOptions = {
  timeOfDay: 'goldenHour',
  crowd: {
    density: 0.85,
    palette: ['#b5121b', '#14213d', '#ffb703', '#2563eb'],
  },
  scoreboard: {
    awayTeam: 'Visitors',
    homeTeam: 'Cardinals',
    away: { innings: [0, 1, 0, 2], totals: 3 },
    home: { innings: [1, 0, 2, 1], totals: 4 },
    count: { balls: 2, strikes: 1, outs: 1 },
    pitchSpeedMph: 97.4,
    batter: 'H. Walker',
    pitcher: 'B. Gibson',
    notes: 'BlazeSportsIntel Simulation · Hyperrealistic Busch Stadium II',
  },
  lighting: {
    intensity: 1.2,
    color: '#ffffff',
    spread: 0.7,
  },
  enableDowntownBackdrop: true,
  enableArch: true,
  animateAtmosphere: true,
};

function configureRenderer(canvas: HTMLCanvasElement): WebGLRenderer {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  return renderer;
}

function mergeOptions(base: BuschStadiumSceneOptions, overrides: Partial<BuschStadiumSceneOptions>): BuschStadiumSceneOptions {
  return {
    ...base,
    ...overrides,
    crowd: { ...base.crowd, ...overrides.crowd },
    scoreboard: { ...base.scoreboard, ...overrides.scoreboard },
    lighting: { ...base.lighting, ...overrides.lighting },
  };
}

export function initializeBuschStadium(canvas: HTMLCanvasElement, overrides: Partial<BuschStadiumSceneOptions> = {}): StadiumInstance {
  const renderer = configureRenderer(canvas);
  let mergedOptions = mergeOptions(DEFAULT_OPTIONS, overrides);
  const { scene, camera, hooks } = buildBuschStadiumScene(canvas, mergedOptions);
  const clock = new Clock();
  let frameId = 0;

  const renderLoop = (): void => {
    const delta = clock.getDelta();
    hooks.update(delta * 1000);
    renderer.render(scene, camera);
    frameId = window.requestAnimationFrame(renderLoop);
  };
  renderLoop();

  const handleResize = (): void => {
    const { clientWidth, clientHeight } = canvas;
    renderer.setSize(clientWidth, clientHeight, false);
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
  };

  window.addEventListener('resize', handleResize);

  return {
    renderer,
    destroy: () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      hooks.dispose();
      renderer.dispose();
    },
    updateOptions: (options: Partial<BuschStadiumSceneOptions>) => {
      mergedOptions = mergeOptions(mergedOptions, options);
      const normalizedPalette = mergedOptions.crowd.palette.map((value: ColorRepresentation) => new Color(value).getStyle());
      mergedOptions = {
        ...mergedOptions,
        crowd: { ...mergedOptions.crowd, palette: normalizedPalette },
      };
      hooks.setOptions({
        ...mergedOptions,
      });
    },
  };
}

export type { BuschStadiumSceneOptions } from './types';
