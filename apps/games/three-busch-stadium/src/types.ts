import type { ColorRepresentation } from 'three';

export type TimeOfDay = 'day' | 'goldenHour' | 'night';

export interface ScoreByInning {
  innings: number[];
  totals: number;
}

export interface ScoreboardLineState {
  label: string;
  value: string;
}

export interface ScoreboardData {
  awayTeam: string;
  homeTeam: string;
  away: ScoreByInning;
  home: ScoreByInning;
  count: {
    balls: number;
    strikes: number;
    outs: number;
  };
  pitchSpeedMph: number;
  batter: string;
  pitcher: string;
  notes?: string;
}

export interface LightingRigOptions {
  intensity: number;
  color: ColorRepresentation;
  spread: number;
}

export interface CrowdOptions {
  density: number;
  palette: ColorRepresentation[];
}

export interface BuschStadiumSceneOptions {
  timeOfDay: TimeOfDay;
  crowd: CrowdOptions;
  scoreboard: ScoreboardData;
  lighting: LightingRigOptions;
  enableDowntownBackdrop: boolean;
  enableArch: boolean;
  animateAtmosphere: boolean;
}

export interface RenderHooks {
  update: (deltaMs: number) => void;
  dispose: () => void;
  setOptions: (options: BuschStadiumSceneOptions) => void;
}
