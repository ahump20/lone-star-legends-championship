/**
 * Arcade-Style Audio Engine
 * Handles SFX, commentary, and background music with Blaze Intelligence polish
 * Integrates with AudioBus for simple audio playback
 */

import { AudioBus } from './index';

interface AudioClip {
  id: string;
  element: HTMLAudioElement;
  volume: number;
  category: string;
  loaded: boolean;
}

interface CommentaryClip {
  id: string;
  files: string[];
  elements: HTMLAudioElement[];
  volume: number;
  category: string;
  triggers: string[];
  lastUsed: number;
}

interface AudioManifest {
  version: string;
  sfx: Array<{
    id: string;
    file: string;
    volume: number;
    category: string;
    description: string;
  }>;
  commentary: Array<{
    id: string;
    files: string[];
    volume: number;
    category: string;
    triggers: string[];
  }>;
  music: Array<{
    id: string;
    file: string;
    volume: number;
    loop: boolean;
    category: string;
  }>;
}

export class AudioEngine {
  private audioBus: AudioBus;
  private sfxBank = new Map<string, AudioClip>();
  private commentaryBank = new Map<string, CommentaryClip>();
  private musicBank = new Map<string, AudioClip>();
  private currentMusic: AudioClip | null = null;
  
  private masterVolume = 1.0;
  private sfxVolume = 1.0;
  private commentaryVolume = 1.0;
  private musicVolume = 1.0;
  
  private isInitialized = false;
  private audioContext: AudioContext | null = null;

  constructor() {
    this.audioBus = new AudioBus();
    this.initializeAudioContext();
  }

  private initializeAudioContext() {
    try {
      // Create audio context for advanced audio processing
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Handle browser autoplay policies
      document.addEventListener('click', this.resumeAudioContext.bind(this), { once: true });
      document.addEventListener('touchstart', this.resumeAudioContext.bind(this), { once: true });
    } catch (error) {
      console.warn('AudioContext not supported, falling back to basic audio');
    }
  }

  private async resumeAudioContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // First try to load manifest, fall back to AudioBus if needed
      let manifest: AudioManifest | null = null;
      try {
        const manifestResponse = await fetch('./assets/audio/manifest.json');
        manifest = await manifestResponse.json();
      } catch (e) {
        // If manifest doesn't exist, use AudioBus with default sounds
        console.log('Using AudioBus for audio loading');
        const defaultSounds = ['hit.wav', 'catch.wav', 'cheer.wav', 'strike.wav'];
        await this.audioBus.load(defaultSounds);
      }
      
      if (manifest) {
      
      console.log('🎵 Loading Blaze Intelligence Audio System...');
      
      // Load SFX
      const sfxPromises = manifest.sfx.map(sfx => this.loadSFX(sfx));
      await Promise.all(sfxPromises);
      
      // Load Commentary
      const commentaryPromises = manifest.commentary.map(commentary => this.loadCommentary(commentary));
      await Promise.all(commentaryPromises);
      
      // Load Music
      const musicPromises = manifest.music.map(music => this.loadMusic(music));
      await Promise.all(musicPromises);
      
      this.isInitialized = true;
      console.log('🎵 Audio system ready!');
      console.log(`   🔊 SFX: ${this.sfxBank.size} sounds`);
      console.log(`   🎙️ Commentary: ${this.commentaryBank.size} variations`);
      console.log(`   🎼 Music: ${this.musicBank.size} tracks`);
      
    } catch (error) {
      console.error('Failed to initialize audio system:', error);
      // Continue without audio - graceful degradation
    }
  }

  private async loadSFX(sfxData: any): Promise<void> {
    return new Promise((resolve) => {
      const audio = new Audio(`./assets/audio/sfx/${sfxData.file}`);
      audio.preload = 'auto';
      
      const clip: AudioClip = {
        id: sfxData.id,
        element: audio,
        volume: sfxData.volume,
        category: sfxData.category,
        loaded: false
      };

      audio.onloadeddata = () => {
        clip.loaded = true;
        resolve();
      };
      
      audio.onerror = () => {
        console.warn(`Failed to load SFX: ${sfxData.file}`);
        resolve(); // Don't block initialization
      };

      this.sfxBank.set(sfxData.id, clip);
    });
  }

  private async loadCommentary(commentaryData: any): Promise<void> {
    const elements: HTMLAudioElement[] = [];
    
    const promises = commentaryData.files.map((file: string) => {
      return new Promise<void>((resolve) => {
        const audio = new Audio(`./assets/audio/commentary/${file}`);
        audio.preload = 'auto';
        
        audio.onloadeddata = () => resolve();
        audio.onerror = () => {
          console.warn(`Failed to load commentary: ${file}`);
          resolve();
        };
        
        elements.push(audio);
      });
    });

    await Promise.all(promises);

    const clip: CommentaryClip = {
      id: commentaryData.id,
      files: commentaryData.files,
      elements: elements,
      volume: commentaryData.volume,
      category: commentaryData.category,
      triggers: commentaryData.triggers,
      lastUsed: 0
    };

    this.commentaryBank.set(commentaryData.id, clip);
  }

  private async loadMusic(musicData: any): Promise<void> {
    return new Promise((resolve) => {
      const audio = new Audio(`./assets/audio/music/${musicData.file}`);
      audio.preload = 'auto';
      audio.loop = musicData.loop;
      
      const clip: AudioClip = {
        id: musicData.id,
        element: audio,
        volume: musicData.volume,
        category: musicData.category,
        loaded: false
      };

      audio.onloadeddata = () => {
        clip.loaded = true;
        resolve();
      };
      
      audio.onerror = () => {
        console.warn(`Failed to load music: ${musicData.file}`);
        resolve();
      };

      this.musicBank.set(musicData.id, clip);
    });
  }

  playSFX(id: string, volumeOverride?: number): void {
    const clip = this.sfxBank.get(id);
    if (!clip || !clip.loaded) return;

    try {
      clip.element.currentTime = 0;
      clip.element.volume = (volumeOverride ?? clip.volume) * this.sfxVolume * this.masterVolume;
      clip.element.play().catch(e => console.warn(`SFX play failed: ${id}`, e));
    } catch (error) {
      console.warn(`Error playing SFX ${id}:`, error);
    }
  }

  playCommentary(trigger: string, force: boolean = false): void {
    // Find commentary that matches this trigger
    for (const [id, clip] of this.commentaryBank) {
      if (clip.triggers.includes(trigger)) {
        // Avoid repetition unless forced
        const timeSinceLastUse = Date.now() - clip.lastUsed;
        if (!force && timeSinceLastUse < 5000) continue; // 5 second cooldown
        
        // Pick a random variation
        const randomIndex = Math.floor(Math.random() * clip.elements.length);
        const element = clip.elements[randomIndex];
        
        if (element) {
          try {
            element.currentTime = 0;
            element.volume = clip.volume * this.commentaryVolume * this.masterVolume;
            element.play().catch(e => console.warn(`Commentary play failed: ${id}`, e));
            clip.lastUsed = Date.now();
          } catch (error) {
            console.warn(`Error playing commentary ${id}:`, error);
          }
        }
        
        break; // Only play one commentary at a time
      }
    }
  }

  playMusic(id: string, fadeIn: boolean = true): void {
    const clip = this.musicBank.get(id);
    if (!clip || !clip.loaded) return;

    // Stop current music
    if (this.currentMusic && this.currentMusic !== clip) {
      this.stopMusic(fadeIn);
    }

    try {
      clip.element.currentTime = 0;
      clip.element.volume = fadeIn ? 0 : clip.volume * this.musicVolume * this.masterVolume;
      
      clip.element.play().then(() => {
        if (fadeIn) {
          this.fadeVolume(clip.element, clip.volume * this.musicVolume * this.masterVolume, 1000);
        }
      }).catch(e => console.warn(`Music play failed: ${id}`, e));
      
      this.currentMusic = clip;
    } catch (error) {
      console.warn(`Error playing music ${id}:`, error);
    }
  }

  stopMusic(fadeOut: boolean = true): void {
    if (!this.currentMusic) return;

    if (fadeOut) {
      this.fadeVolume(this.currentMusic.element, 0, 1000, () => {
        this.currentMusic?.element.pause();
        this.currentMusic = null;
      });
    } else {
      this.currentMusic.element.pause();
      this.currentMusic = null;
    }
  }

  private fadeVolume(element: HTMLAudioElement, targetVolume: number, duration: number, callback?: () => void): void {
    const startVolume = element.volume;
    const volumeChange = targetVolume - startVolume;
    const startTime = Date.now();

    const fade = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      element.volume = startVolume + (volumeChange * progress);
      
      if (progress < 1) {
        requestAnimationFrame(fade);
      } else {
        callback?.();
      }
    };

    fade();
  }

  // Volume controls
  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    this.updateAllVolumes();
  }

  setSFXVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    this.updateAllVolumes();
  }

  setCommentaryVolume(volume: number): void {
    this.commentaryVolume = Math.max(0, Math.min(1, volume));
    this.updateAllVolumes();
  }

  setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.currentMusic) {
      this.currentMusic.element.volume = this.currentMusic.volume * this.musicVolume * this.masterVolume;
    }
  }

  private updateAllVolumes(): void {
    // Update current music volume
    if (this.currentMusic) {
      this.currentMusic.element.volume = this.currentMusic.volume * this.musicVolume * this.masterVolume;
    }
  }

  // Game event handlers
  onBatContact(hitType: 'weak' | 'solid' | 'crushing'): void {
    switch (hitType) {
      case 'weak':
        this.playSFX('bat_ping', 0.5);
        break;
      case 'solid':
        this.playSFX('bat_ping', 0.8);
        this.playCommentary('nice_hit');
        break;
      case 'crushing':
        this.playSFX('bat_ping', 1.0);
        this.playCommentary('big_hit');
        break;
    }
  }

  onFieldingPlay(playType: 'routine' | 'good' | 'spectacular'): void {
    this.playSFX('glove_thump');
    
    if (playType === 'spectacular') {
      this.playCommentary('defense');
      this.playSFX('crowd_cheer');
    }
  }

  onStrikeout(): void {
    this.playCommentary('strikeout');
    this.playSFX('crowd_ooh');
  }

  onHomeRun(): void {
    this.playSFX('crowd_cheer', 1.0);
    this.playCommentary('big_hit', true);
  }

  onError(): void {
    this.playSFX('error_oops');
    this.playCommentary('encouragement');
  }

  onGameStart(): void {
    this.playSFX('whistle_play');
    this.playMusic('game_theme');
  }

  onGameEnd(won: boolean): void {
    this.stopMusic(true);
    
    setTimeout(() => {
      if (won) {
        this.playMusic('victory_theme', false);
        this.playSFX('crowd_cheer', 1.0);
      }
    }, 1000);
  }

  // Utility methods
  preloadAll(): Promise<void> {
    return this.initialize();
  }

  getLoadedStatus() {
    const sfxLoaded = Array.from(this.sfxBank.values()).filter(clip => clip.loaded).length;
    const musicLoaded = Array.from(this.musicBank.values()).filter(clip => clip.loaded).length;
    const commentaryLoaded = this.commentaryBank.size;

    return {
      sfx: `${sfxLoaded}/${this.sfxBank.size}`,
      commentary: `${commentaryLoaded}/${this.commentaryBank.size}`,
      music: `${musicLoaded}/${this.musicBank.size}`,
      isReady: this.isInitialized
    };
  }

  cleanup(): void {
    // Stop all audio
    this.stopMusic(false);
    
    // Clear all banks
    this.sfxBank.clear();
    this.commentaryBank.clear(); 
    this.musicBank.clear();
    
    this.isInitialized = false;
  }
}