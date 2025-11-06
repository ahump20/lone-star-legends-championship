'use client';

import type {
  GamePhase,
  GameSnapshot,
  PlaySummary,
  SluggerProfile,
  StadiumProfile,
} from '../../lib/gameTypes';

interface PitchState {
  launchTime: number;
  travelTime: number;
  arcHeight: number;
  releaseX: number;
  releaseY: number;
  targetX: number;
  targetY: number;
  resolved: boolean;
}

interface InternalState {
  slugger: SluggerProfile;
  stadium: StadiumProfile;
  inning: number;
  outs: number;
  playerScore: number;
  cpuScore: number;
  phase: GamePhase;
  message: string;
  countdownTarget: number | null;
  pitch: PitchState | null;
  history: PlaySummary[];
  resultBanner?: string;
  streak: number;
  difficultyNote: string;
  playId: number;
}

interface SettleOptions {
  runs: number;
  label: string;
  detail: string;
  message: string;
  now: number;
}

export function createInitialSnapshot(
  slugger: SluggerProfile,
  stadium: StadiumProfile,
): GameSnapshot {
  return {
    inning: 1,
    outs: 0,
    playerScore: 0,
    cpuScore: 0,
    phase: 'idle',
    message: 'Pick a slugger, choose a stadium, and press Play Ball to start the sandlot showdown.',
    countdown: null,
    canSwing: false,
    selectedSlugger: slugger,
    selectedStadium: stadium,
    history: [],
    streak: 0,
    difficultyNote: buildDifficultyNote(slugger, stadium),
  };
}

function buildDifficultyNote(slugger: SluggerProfile, stadium: StadiumProfile) {
  const baseWindow = slugger.timingWindow + stadium.timingBonus;
  const powerMultiplier = 1 + stadium.powerBonus + (slugger.power - 3) * 0.08;
  return `Timing cushion ${Math.round(baseWindow)}ms • Power x${powerMultiplier.toFixed(2)} • Confidence streak ${slugger.confidence}/5`;
}

export class GameEngine {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly onUpdate: (snapshot: GameSnapshot) => void;
  private frameId: number | null = null;
  private state: InternalState;
  private width = 960;
  private height = 540;
  private pixelRatio = 1;

  constructor(
    canvas: HTMLCanvasElement,
    onUpdate: (snapshot: GameSnapshot) => void,
    options: { slugger: SluggerProfile; stadium: StadiumProfile },
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Unable to acquire 2D context for game canvas');
    }

    this.canvas = canvas;
    this.ctx = ctx;
    this.onUpdate = onUpdate;
    this.state = {
      slugger: options.slugger,
      stadium: options.stadium,
      inning: 1,
      outs: 0,
      playerScore: 0,
      cpuScore: 0,
      phase: 'idle',
      message: 'Lineup locked. Tap Play Ball when you are ready.',
      countdownTarget: null,
      pitch: null,
      history: [],
      resultBanner: undefined,
      streak: 0,
      difficultyNote: buildDifficultyNote(options.slugger, options.stadium),
      playId: 0,
    };

    this.ctx.imageSmoothingEnabled = true;
    this.startLoop();
    this.publishSnapshot(performance.now());
  }

  dispose() {
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
  }

  setDimensions(width: number, height: number, ratio: number) {
    this.width = width;
    this.height = height;
    this.pixelRatio = ratio;
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.ctx.imageSmoothingEnabled = true;
  }

  setLoadout(slugger: SluggerProfile, stadium: StadiumProfile) {
    this.state.slugger = slugger;
    this.state.stadium = stadium;
    this.state.difficultyNote = buildDifficultyNote(slugger, stadium);
    if (this.state.phase === 'idle') {
      this.state.message = 'Lineup updated. Hit Play Ball to begin a new series.';
    }
    this.publishSnapshot(performance.now());
  }

  startSeason() {
    const now = performance.now();
    this.state.inning = 1;
    this.state.outs = 0;
    this.state.playerScore = 0;
    this.state.cpuScore = 0;
    this.state.phase = 'prePitch';
    this.state.message = 'Opening pitch winding up. Watch the pitcher and prep your timing!';
    this.state.countdownTarget = now + 1400;
    this.state.pitch = null;
    this.state.history = [];
    this.state.resultBanner = undefined;
    this.state.streak = 0;
    this.state.playId = 0;
    this.publishSnapshot(now);
  }

  swing() {
    if (this.state.phase !== 'pitching' || !this.state.pitch) {
      return;
    }
    if (this.state.pitch.resolved) {
      return;
    }

    const now = performance.now();
    const expectedContact = this.state.pitch.launchTime + this.state.pitch.travelTime;
    const delta = now - expectedContact;
    const absDelta = Math.abs(delta);
    const { perfect, solid, spray } = this.getTimingWindows();
    let runs = 0;
    let label: string;
    let detail: string;
    let message: string;

    if (absDelta <= perfect) {
      runs = 2;
      if (Math.random() < this.perfectBonusChance()) {
        runs += 1;
      }
      label = 'Perfect Launch';
      detail = `Barrel finds the sweet spot ${delta >= 0 ? 'a beat late' : 'with early thunder'} (${absDelta.toFixed(0)}ms).`;
      message = `${this.state.slugger.nickname} detonates a ${runs}-run moonshot!`;
    } else if (absDelta <= solid) {
      runs = 1;
      if (Math.random() < this.solidBonusChance()) {
        runs += 1;
      }
      label = 'Line-Drive Laser';
      detail = `Squared it up ${delta >= 0 ? 'just behind' : 'just ahead'} of the pitch (${absDelta.toFixed(0)}ms).`;
      message = `${this.state.slugger.nickname} ropes a clutch RBI!`;
    } else if (absDelta <= spray) {
      runs = 0;
      label = delta < 0 ? 'Pulled Foul' : 'Opposite-Field Pop';
      detail = `Timing drifted ${absDelta.toFixed(0)}ms ${delta < 0 ? 'early' : 'late'} — recorded as an out.`;
      message = 'Fielder squeezes it. One away.';
    } else {
      runs = 0;
      label = 'Swing & Miss';
      detail = `Whiffed by ${absDelta.toFixed(0)}ms.`;
      message = 'Strike! Crowd gasps as the ball hits the mitt.';
    }

    this.settleAtBat({ runs, label, detail, message, now });
  }

  private startLoop() {
    const loop = (time: number) => {
      this.advance(time);
      this.draw(time);
      this.publishSnapshot(time);
      this.frameId = requestAnimationFrame(loop);
    };

    this.frameId = requestAnimationFrame(loop);
  }

  private advance(time: number) {
    if (this.state.phase === 'prePitch' && this.state.countdownTarget && time >= this.state.countdownTarget) {
      this.beginPitch(time);
    }

    if (this.state.phase === 'pitching' && this.state.pitch && !this.state.pitch.resolved) {
      const strikeWindow = this.getTimingWindows().spray + 140;
      if (time >= this.state.pitch.launchTime + this.state.pitch.travelTime + strikeWindow) {
        const detail = 'Watched it all the way. Strike called.';
        this.settleAtBat({ runs: 0, label: 'Called Strike', detail, message: 'Strike looking. Two more chances in the inning.', now: time });
      }
    }

    if (this.state.phase === 'resolving' && this.state.countdownTarget && time >= this.state.countdownTarget) {
      if (this.state.outs >= 3) {
        this.finishInning(time);
      } else {
        this.state.phase = 'prePitch';
        this.state.countdownTarget = time + 1000;
        this.state.message = 'Pitcher resets with a new grip. Stay ready!';
        this.state.pitch = null;
      }
    }

    if (this.state.phase === 'betweenInnings' && this.state.countdownTarget && time >= this.state.countdownTarget) {
      if (this.state.inning > 3) {
        this.state.phase = 'gameOver';
        this.state.countdownTarget = null;
        this.state.message = this.state.resultBanner ?? 'Series complete! Tap Play Ball to run it back.';
      } else {
        this.state.phase = 'prePitch';
        this.state.countdownTarget = time + 1300;
        this.state.message = `Top of inning ${this.state.inning}. Crowd is buzzing.`;
        this.state.pitch = null;
      }
    }
  }

  private beginPitch(time: number) {
    const travel = 900 - this.state.slugger.confidence * 35;
    this.state.pitch = {
      launchTime: time,
      travelTime: Math.max(520, travel),
      arcHeight: 42 + Math.random() * 18,
      releaseX: this.width * 0.2,
      releaseY: this.height * 0.42,
      targetX: this.width * 0.78,
      targetY: this.height * 0.62,
      resolved: false,
    };
    this.state.phase = 'pitching';
    this.state.message = 'Pitch on the way! Tap the Swing button or press Space at the plate.';
    this.state.countdownTarget = null;
  }

  private settleAtBat({ runs, label, detail, message, now }: SettleOptions) {
    if (!this.state.pitch) {
      return;
    }

    this.state.pitch.resolved = true;
    const entryRuns = runs > 0 ? this.calculateRuns(runs) : 0;
    const play: PlaySummary = {
      id: ++this.state.playId,
      inning: this.state.inning,
      label: runs > 0 ? `${label} (+${entryRuns})` : label,
      runsScored: entryRuns,
      detail,
    };
    this.pushHistory(play);

    if (entryRuns > 0) {
      this.state.playerScore += entryRuns;
      this.state.streak += 1;
      this.state.message = `${message} Blaze now leads ${this.state.playerScore}-${this.state.cpuScore}.`;
    } else {
      this.state.outs += 1;
      this.state.streak = 0;
      const outsLeft = 3 - this.state.outs;
      this.state.message = `${message} ${outsLeft > 0 ? `${outsLeft} ${outsLeft === 1 ? 'out' : 'outs'} remaining.` : 'Side retired!'}`;
    }

    this.state.phase = 'resolving';
    this.state.countdownTarget = now + 1200;
  }

  private finishInning(time: number) {
    const cpuRuns = this.simulateCpuHalf();
    const summary: PlaySummary = {
      id: ++this.state.playId,
      inning: this.state.inning,
      label: 'CPU Half Inning',
      runsScored: cpuRuns,
      detail: cpuRuns
        ? `CPU strings together rallies for ${cpuRuns} run${cpuRuns === 1 ? '' : 's'}.`
        : 'Defense holds firm with a scoreless frame.',
    };

    this.pushHistory(summary);
    this.state.cpuScore += cpuRuns;
    this.state.inning += 1;
    this.state.outs = 0;
    this.state.pitch = null;

    const scoreboard = `${this.state.playerScore}-${this.state.cpuScore}`;
    this.state.message = `CPU posts ${cpuRuns}. Score now ${scoreboard}.`;
    this.state.phase = 'betweenInnings';
    this.state.countdownTarget = time + 2200;

    if (this.state.inning > 3) {
      const diff = this.state.playerScore - this.state.cpuScore;
      if (diff > 0) {
        this.state.resultBanner = 'Championship secured! Your crew storms the field.';
      } else if (diff < 0) {
        this.state.resultBanner = 'CPU edges the series. Time for adjustments and a rematch.';
      } else {
        this.state.resultBanner = 'Extra-inning vibes! Treat it as a tie or rerun the showdown.';
      }
    }
  }

  private simulateCpuHalf(): number {
    const [zero, one, two, three] = this.state.stadium.cpuRunDistribution;
    const adjustment = (3 - this.state.slugger.confidence) * 0.025;
    const distribution = [
      Math.max(0.1, zero - adjustment),
      one + adjustment * 0.6,
      two + adjustment * 0.3,
      three + adjustment * 0.1,
    ];
    const total = distribution.reduce((sum, value) => sum + value, 0);
    const roll = Math.random() * total;

    let cumulative = 0;
    for (let runs = 0; runs < distribution.length; runs += 1) {
      cumulative += distribution[runs];
      if (roll <= cumulative) {
        return runs;
      }
    }

    return 0;
  }

  private calculateRuns(baseRuns: number) {
    const confidenceBoost = 1 + this.state.streak * 0.1;
    const powerBoost = 1 + this.state.stadium.powerBonus + (this.state.slugger.power - 3) * 0.08;
    const total = Math.max(1, Math.round(baseRuns * powerBoost * confidenceBoost));
    return total;
  }

  private perfectBonusChance() {
    return Math.min(0.65, 0.18 + this.state.stadium.powerBonus + this.state.slugger.power * 0.07);
  }

  private solidBonusChance() {
    return Math.min(0.4, 0.08 + this.state.stadium.powerBonus * 0.8 + this.state.slugger.power * 0.05);
  }

  private getTimingWindows() {
    const base = this.state.slugger.timingWindow + this.state.stadium.timingBonus;
    const contactModifier = 1 + (this.state.slugger.contact - 3) * 0.09;
    const perfect = Math.max(35, base * 0.45);
    const solid = base * contactModifier;
    const spray = solid + 100 - this.state.slugger.contact * 6;
    return { perfect, solid, spray };
  }

  private pushHistory(entry: PlaySummary) {
    const updated = [entry, ...this.state.history];
    this.state.history = updated.slice(0, 6);
  }

  private publishSnapshot(time: number) {
    const countdown = this.state.countdownTarget ? Math.max(0, this.state.countdownTarget - time) : null;
    const snapshot: GameSnapshot = {
      inning: this.state.inning,
      outs: this.state.outs,
      playerScore: this.state.playerScore,
      cpuScore: this.state.cpuScore,
      phase: this.state.phase,
      message: this.state.message,
      countdown,
      canSwing: this.state.phase === 'pitching' && !!this.state.pitch && !this.state.pitch.resolved,
      selectedSlugger: this.state.slugger,
      selectedStadium: this.state.stadium,
      history: this.state.history,
      resultBanner: this.state.resultBanner,
      streak: this.state.streak,
      difficultyNote: this.state.difficultyNote,
    };

    this.onUpdate(snapshot);
  }

  private draw(time: number) {
    this.ctx.save();
    this.ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.drawBackground();
    this.drawInfield();
    this.drawCharacters(time);
    this.drawBall(time);
    this.ctx.restore();
  }

  private drawBackground() {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, this.state.stadium.skyColor);
    gradient.addColorStop(0.7, this.state.stadium.skyColor);
    gradient.addColorStop(1, this.state.stadium.turfColor);
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  private drawInfield() {
    this.ctx.fillStyle = this.state.stadium.infieldColor;
    const diamondSize = this.width * 0.24;
    const centerX = this.width * 0.5;
    const centerY = this.height * 0.62;
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, centerY - diamondSize);
    this.ctx.lineTo(centerX + diamondSize, centerY);
    this.ctx.lineTo(centerX, centerY + diamondSize);
    this.ctx.lineTo(centerX - diamondSize, centerY);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.fillStyle = this.state.stadium.accentColor;
    const baseSize = this.width * 0.025;
    const basePositions = [
      [centerX - diamondSize, centerY],
      [centerX, centerY - diamondSize],
      [centerX + diamondSize, centerY],
      [centerX, centerY + diamondSize],
    ];
    basePositions.forEach(([x, y]) => {
      this.ctx.beginPath();
      this.ctx.rect(x - baseSize / 2, y - baseSize / 2, baseSize, baseSize);
      this.ctx.fill();
    });
  }

  private drawCharacters(time: number) {
    // Pitcher
    this.ctx.fillStyle = this.state.stadium.accentColor;
    const pitcherX = this.width * 0.32;
    const pitcherY = this.height * 0.46;
    const wobble = Math.sin(time / 180) * 6;
    this.ctx.beginPath();
    this.ctx.ellipse(pitcherX, pitcherY - 42, 16, 22, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillRect(pitcherX - 6, pitcherY - 22, 12, 50);
    this.ctx.save();
    this.ctx.translate(pitcherX, pitcherY);
    this.ctx.rotate((-15 + wobble) * (Math.PI / 180));
    this.ctx.fillRect(0, -4, 48, 8);
    this.ctx.restore();

    // Batter
    this.ctx.fillStyle = this.state.slugger.primaryColor;
    const batterX = this.width * 0.78;
    const batterY = this.height * 0.66;
    this.ctx.beginPath();
    this.ctx.arc(batterX, batterY - 48, 20, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillRect(batterX - 8, batterY - 48, 16, 64);
    this.ctx.save();
    this.ctx.translate(batterX, batterY - 12);
    const swingProgress = this.state.phase === 'pitching' && this.state.pitch && !this.state.pitch.resolved
      ? Math.min(1, (time - this.state.pitch.launchTime) / this.state.pitch.travelTime)
      : this.state.phase === 'resolving'
        ? 1
        : 0;
    const swingAngle = -Math.PI / 3 + swingProgress * Math.PI * 0.9;
    this.ctx.rotate(swingAngle);
    this.ctx.fillStyle = this.state.slugger.accentColor;
    this.ctx.fillRect(0, -5, 72, 10);
    this.ctx.restore();
  }

  private drawBall(time: number) {
    if (!this.state.pitch) {
      return;
    }

    const pitch = this.state.pitch;
    const progress = Math.min(1, (time - pitch.launchTime) / pitch.travelTime);
    const eased = Math.sin((progress * Math.PI) / 2);
    const x = pitch.releaseX + (pitch.targetX - pitch.releaseX) * progress;
    const y =
      pitch.releaseY + (pitch.targetY - pitch.releaseY) * progress - Math.sin(progress * Math.PI) * pitch.arcHeight;

    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(x, y, 8, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.strokeStyle = '#ff4d4d';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(x, y, 6, eased * Math.PI, eased * Math.PI + Math.PI);
    this.ctx.stroke();
  }
}
