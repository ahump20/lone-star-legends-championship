export interface SluggerProfile {
  id: string;
  name: string;
  nickname: string;
  hometown: string;
  description: string;
  battingStyle: 'left' | 'right' | 'switch';
  timingWindow: number; // baseline timing forgiveness in milliseconds
  power: number; // 1-5 scale
  contact: number; // 1-5 scale
  confidence: number; // 1-5 scale (affects streak bonuses)
  primaryColor: string;
  accentColor: string;
  featuredEmoji: string;
  signatureMove: string;
}

export interface StadiumProfile {
  id: string;
  name: string;
  location: string;
  backdrop: string;
  vibe: string;
  weatherBias: string;
  timingBonus: number; // milliseconds added to timing window
  powerBonus: number; // multiplier applied to run rewards (0-0.4)
  cpuRunDistribution: [number, number, number, number]; // probability for scoring 0-3 runs
  skyColor: string;
  turfColor: string;
  infieldColor: string;
  accentColor: string;
  capacity: string;
}

export interface PlaySummary {
  id: number;
  inning: number;
  label: string;
  runsScored: number;
  detail: string;
}

export type GamePhase =
  | 'idle'
  | 'prePitch'
  | 'pitching'
  | 'resolving'
  | 'betweenInnings'
  | 'gameOver';

export interface GameSnapshot {
  inning: number;
  outs: number;
  playerScore: number;
  cpuScore: number;
  phase: GamePhase;
  message: string;
  countdown: number | null;
  canSwing: boolean;
  selectedSlugger: SluggerProfile;
  selectedStadium: StadiumProfile;
  history: PlaySummary[];
  resultBanner?: string;
  streak: number;
  difficultyNote: string;
}
