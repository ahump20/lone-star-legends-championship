/**
 * Blaze Intelligence OG Remaster
 * Replay System - Capture and playback game highlights
 * Pattern Recognition Weaponized ⚾
 */

import { GameState } from '../GameState';
import { AudioBus } from '../audio/AudioBus';

export interface ReplayFrame {
  timestamp: number;
  gameState: Partial<GameState>;
  canvas?: ImageData;
  audio?: AudioData;
}

export interface Highlight {
  id: string;
  type: HighlightType;
  title: string;
  description: string;
  frames: ReplayFrame[];
  metadata: HighlightMetadata;
  shareUrl?: string;
}

export enum HighlightType {
  HOME_RUN = 'home_run',
  STRIKEOUT = 'strikeout',
  DOUBLE_PLAY = 'double_play',
  DIVING_CATCH = 'diving_catch',
  STOLEN_BASE = 'stolen_base',
  WALK_OFF = 'walk_off',
  PERFECT_GAME = 'perfect_game',
  NO_HITTER = 'no_hitter',
  GRAND_SLAM = 'grand_slam',
  COMEBACK = 'comeback'
}

interface HighlightMetadata {
  inning: number;
  score: { home: number; away: number };
  batter: string;
  pitcher: string;
  runners: number;
  outs: number;
  timestamp: Date;
  importance: number; // 0-100 score for highlight significance
}

interface AudioData {
  commentary: string;
  soundEffects: string[];
  crowdNoise: number;
}

export class ReplaySystem {
  private canvas: HTMLCanvasElement;
  private recordingBuffer: ReplayFrame[] = [];
  private highlights: Highlight[] = [];
  private isRecording: boolean = false;
  private recordingStartTime: number = 0;
  private maxBufferSize: number = 600; // 10 seconds at 60fps
  private replayCanvas?: HTMLCanvasElement;
  private replayContext?: CanvasRenderingContext2D;
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.setupReplayCanvas();
  }
  
  private setupReplayCanvas(): void {
    this.replayCanvas = document.createElement('canvas');
    this.replayCanvas.width = this.canvas.width;
    this.replayCanvas.height = this.canvas.height;
    this.replayCanvas.style.display = 'none';
    this.replayContext = this.replayCanvas.getContext('2d')!;
    document.body.appendChild(this.replayCanvas);
  }
  
  public startRecording(): void {
    this.isRecording = true;
    this.recordingStartTime = performance.now();
    this.recordingBuffer = [];
  }
  
  public stopRecording(): void {
    this.isRecording = false;
  }
  
  public captureFrame(gameState: GameState, audio?: AudioData): void {
    if (!this.isRecording) return;
    
    // Circular buffer - keep only recent frames
    if (this.recordingBuffer.length >= this.maxBufferSize) {
      this.recordingBuffer.shift();
    }
    
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;
    
    const frame: ReplayFrame = {
      timestamp: performance.now() - this.recordingStartTime,
      gameState: this.extractGameState(gameState),
      canvas: ctx.getImageData(0, 0, this.canvas.width, this.canvas.height),
      audio
    };
    
    this.recordingBuffer.push(frame);
  }
  
  private extractGameState(state: GameState): Partial<GameState> {
    // Extract only essential state for replay
    return {
      score: { ...state.score },
      inning: state.inning,
      outs: state.outs,
      balls: state.balls,
      strikes: state.strikes,
      bases: [...state.bases],
      currentBatter: state.currentBatter,
      currentPitcher: state.currentPitcher
    };
  }
  
  public detectHighlight(gameState: GameState, eventType: string): void {
    const importance = this.calculateImportance(gameState, eventType);
    
    if (importance < 50) return; // Not significant enough
    
    const highlight = this.createHighlight(gameState, eventType, importance);
    
    if (highlight) {
      this.highlights.push(highlight);
      this.saveHighlight(highlight);
      
      // Trigger UI notification
      this.notifyHighlight(highlight);
    }
  }
  
  private calculateImportance(state: GameState, eventType: string): number {
    let importance = 0;
    
    // Base importance by event type
    const eventScores: Record<string, number> = {
      'home_run': 70,
      'grand_slam': 95,
      'strikeout': 40,
      'double_play': 60,
      'diving_catch': 65,
      'stolen_base': 45,
      'walk_off': 100,
      'perfect_game': 100,
      'no_hitter': 95
    };
    
    importance = eventScores[eventType] || 30;
    
    // Adjust for game situation
    if (state.inning >= 9) importance += 15; // Late game bonus
    if (Math.abs(state.score.home - state.score.away) <= 2) importance += 10; // Close game
    if (state.bases.filter(b => b).length >= 2) importance += 10; // Runners in scoring position
    if (state.outs === 2) importance += 5; // Two-out drama
    
    return Math.min(100, importance);
  }
  
  private createHighlight(state: GameState, eventType: string, importance: number): Highlight | null {
    if (this.recordingBuffer.length < 30) return null; // Need at least 0.5 seconds
    
    // Capture 3 seconds before and 2 seconds after the event
    const eventTime = performance.now() - this.recordingStartTime;
    const startTime = Math.max(0, eventTime - 3000);
    const endTime = eventTime + 2000;
    
    const frames = this.recordingBuffer.filter(
      frame => frame.timestamp >= startTime && frame.timestamp <= endTime
    );
    
    if (frames.length === 0) return null;
    
    const highlight: Highlight = {
      id: this.generateHighlightId(),
      type: this.mapEventToHighlightType(eventType),
      title: this.generateTitle(eventType, state),
      description: this.generateDescription(eventType, state),
      frames: frames,
      metadata: {
        inning: state.inning,
        score: { ...state.score },
        batter: state.currentBatter || 'Unknown',
        pitcher: state.currentPitcher || 'Unknown',
        runners: state.bases.filter(b => b).length,
        outs: state.outs,
        timestamp: new Date(),
        importance
      }
    };
    
    return highlight;
  }
  
  private mapEventToHighlightType(eventType: string): HighlightType {
    const mapping: Record<string, HighlightType> = {
      'home_run': HighlightType.HOME_RUN,
      'strikeout': HighlightType.STRIKEOUT,
      'double_play': HighlightType.DOUBLE_PLAY,
      'diving_catch': HighlightType.DIVING_CATCH,
      'stolen_base': HighlightType.STOLEN_BASE,
      'walk_off': HighlightType.WALK_OFF,
      'perfect_game': HighlightType.PERFECT_GAME,
      'no_hitter': HighlightType.NO_HITTER,
      'grand_slam': HighlightType.GRAND_SLAM,
      'comeback': HighlightType.COMEBACK
    };
    
    return mapping[eventType] || HighlightType.HOME_RUN;
  }
  
  private generateTitle(eventType: string, state: GameState): string {
    const titles: Record<string, string> = {
      'home_run': `💥 Home Run by ${state.currentBatter}!`,
      'grand_slam': `🚀 GRAND SLAM by ${state.currentBatter}!`,
      'strikeout': `🔥 Strikeout by ${state.currentPitcher}!`,
      'double_play': `⚡ Double Play!`,
      'diving_catch': `🤸 Incredible Diving Catch!`,
      'stolen_base': `💨 Stolen Base!`,
      'walk_off': `🏆 WALK-OFF WINNER!`,
      'perfect_game': `👑 PERFECT GAME!`,
      'no_hitter': `🎯 NO-HITTER!`
    };
    
    return titles[eventType] || 'Great Play!';
  }
  
  private generateDescription(eventType: string, state: GameState): string {
    const inningStr = this.getInningString(state.inning);
    const score = `${state.score.home}-${state.score.away}`;
    
    return `${inningStr}, ${state.outs} out${state.outs !== 1 ? 's' : ''}, Score: ${score}`;
  }
  
  private getInningString(inning: number): string {
    const ordinals = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th'];
    return inning <= 9 ? `${ordinals[inning]} inning` : `${inning}th inning`;
  }
  
  private generateHighlightId(): string {
    return `highlight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  public async playReplay(highlight: Highlight): Promise<void> {
    if (!this.replayContext || highlight.frames.length === 0) return;
    
    // Show replay canvas
    this.replayCanvas!.style.display = 'block';
    this.replayCanvas!.style.position = 'absolute';
    this.replayCanvas!.style.top = '0';
    this.replayCanvas!.style.left = '0';
    this.replayCanvas!.style.zIndex = '1000';
    
    // Add replay overlay
    this.addReplayOverlay();
    
    // Play frames
    for (let i = 0; i < highlight.frames.length; i++) {
      const frame = highlight.frames[i];
      
      if (frame.canvas) {
        this.replayContext.putImageData(frame.canvas, 0, 0);
      }
      
      // Play audio if available
      if (frame.audio) {
        AudioBus.playCommentary(frame.audio.commentary);
      }
      
      // Calculate delay to next frame
      const nextFrame = highlight.frames[i + 1];
      const delay = nextFrame ? nextFrame.timestamp - frame.timestamp : 16.67;
      
      await this.delay(delay);
    }
    
    // Hide replay canvas
    this.removeReplayOverlay();
    this.replayCanvas!.style.display = 'none';
  }
  
  private addReplayOverlay(): void {
    const overlay = document.createElement('div');
    overlay.id = 'replay-overlay';
    overlay.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      background: rgba(255, 0, 0, 0.8);
      color: white;
      padding: 5px 10px;
      border-radius: 5px;
      font-family: 'Press Start 2P', monospace;
      font-size: 12px;
      z-index: 1001;
      animation: blink 1s infinite;
    `;
    overlay.textContent = 'REPLAY';
    document.body.appendChild(overlay);
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes blink {
        0%, 50% { opacity: 1; }
        51%, 100% { opacity: 0.3; }
      }
    `;
    document.head.appendChild(style);
  }
  
  private removeReplayOverlay(): void {
    const overlay = document.getElementById('replay-overlay');
    if (overlay) overlay.remove();
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  public async shareHighlight(highlight: Highlight): Promise<string> {
    // Generate shareable video or GIF
    const blob = await this.exportHighlightAsVideo(highlight);
    
    // In production, upload to CDN
    // For now, create local blob URL
    const url = URL.createObjectURL(blob);
    highlight.shareUrl = url;
    
    // Copy share text to clipboard
    const shareText = `Check out this amazing play! ${highlight.title}\n${url}`;
    await navigator.clipboard.writeText(shareText);
    
    return url;
  }
  
  private async exportHighlightAsVideo(highlight: Highlight): Promise<Blob> {
    // Create video from frames
    const canvas = document.createElement('canvas');
    canvas.width = this.canvas.width;
    canvas.height = this.canvas.height;
    const ctx = canvas.getContext('2d')!;
    
    // For now, export as animated GIF using canvas frames
    // In production, use MediaRecorder API or server-side encoding
    const frames: string[] = [];
    
    for (const frame of highlight.frames) {
      if (frame.canvas) {
        ctx.putImageData(frame.canvas, 0, 0);
        frames.push(canvas.toDataURL('image/png'));
      }
    }
    
    // Convert to blob (simplified - would use proper video encoding in production)
    const response = await fetch(frames[0]);
    return await response.blob();
  }
  
  private saveHighlight(highlight: Highlight): void {
    // Save to localStorage for now
    const saved = localStorage.getItem('blaze_highlights');
    const highlights = saved ? JSON.parse(saved) : [];
    
    // Store metadata only, frames are too large for localStorage
    highlights.push({
      id: highlight.id,
      type: highlight.type,
      title: highlight.title,
      description: highlight.description,
      metadata: highlight.metadata
    });
    
    // Keep only last 10 highlights
    if (highlights.length > 10) {
      highlights.shift();
    }
    
    localStorage.setItem('blaze_highlights', JSON.stringify(highlights));
  }
  
  private notifyHighlight(highlight: Highlight): void {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'highlight-notification';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #FF6B35, #1E3A8A);
      color: white;
      padding: 15px 20px;
      border-radius: 10px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      font-family: 'Press Start 2P', monospace;
      font-size: 12px;
      z-index: 2000;
      animation: slideIn 0.5s ease-out;
      cursor: pointer;
    `;
    
    notification.innerHTML = `
      <div style="margin-bottom: 5px;">🎬 HIGHLIGHT!</div>
      <div style="font-size: 10px;">${highlight.title}</div>
      <div style="font-size: 8px; opacity: 0.8; margin-top: 5px;">Click to replay</div>
    `;
    
    notification.onclick = () => {
      this.playReplay(highlight);
      notification.remove();
    };
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideOut 0.5s ease-in';
        setTimeout(() => notification.remove(), 500);
      }
    }, 5000);
    
    // Add animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
  
  public getHighlights(): Highlight[] {
    return this.highlights;
  }
  
  public clearHighlights(): void {
    this.highlights = [];
    localStorage.removeItem('blaze_highlights');
  }
}