/**
 * Arcade-Style Audio Engine
 * Handles SFX, commentary, and background music with Blaze Intelligence polish
 * Integrates with AudioBus for simple audio playback
 */
import { AudioBus } from './index';
export class AudioEngine {
    constructor() {
        this.sfxBank = new Map();
        this.commentaryBank = new Map();
        this.musicBank = new Map();
        this.currentMusic = null;
        this.masterVolume = 1.0;
        this.sfxVolume = 1.0;
        this.commentaryVolume = 1.0;
        this.musicVolume = 1.0;
        this.isInitialized = false;
        this.audioContext = null;
        this.audioBus = new AudioBus();
        this.initializeAudioContext();
    }
    initializeAudioContext() {
        try {
            // Create audio context for advanced audio processing
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            // Handle browser autoplay policies
            document.addEventListener('click', this.resumeAudioContext.bind(this), { once: true });
            document.addEventListener('touchstart', this.resumeAudioContext.bind(this), { once: true });
        }
        catch (error) {
            console.warn('AudioContext not supported, falling back to basic audio');
        }
    }
    async resumeAudioContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }
    async initialize() {
        if (this.isInitialized)
            return;
        try {
            // First try to load manifest, fall back to AudioBus if needed
            let manifest = null;
            try {
                const manifestResponse = await fetch('./assets/audio/manifest.json');
                manifest = await manifestResponse.json();
            }
            catch (e) {
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
            }
            try { }
            catch (error) {
                console.error('Failed to initialize audio system:', error);
                // Continue without audio - graceful degradation
            }
        }
        finally {
        }
    }
    async loadSFX(sfxData) {
        return new Promise((resolve) => {
            const audio = new Audio(`./assets/audio/sfx/${sfxData.file}`);
            audio.preload = 'auto';
            const clip = {
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
    async loadCommentary(commentaryData) {
        const elements = [];
        const promises = commentaryData.files.map((file) => {
            return new Promise((resolve) => {
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
        const clip = {
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
    async loadMusic(musicData) {
        return new Promise((resolve) => {
            const audio = new Audio(`./assets/audio/music/${musicData.file}`);
            audio.preload = 'auto';
            audio.loop = musicData.loop;
            const clip = {
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
    playSFX(id, volumeOverride) {
        const clip = this.sfxBank.get(id);
        if (!clip || !clip.loaded)
            return;
        try {
            clip.element.currentTime = 0;
            clip.element.volume = (volumeOverride ?? clip.volume) * this.sfxVolume * this.masterVolume;
            clip.element.play().catch(e => console.warn(`SFX play failed: ${id}`, e));
        }
        catch (error) {
            console.warn(`Error playing SFX ${id}:`, error);
        }
    }
    playCommentary(trigger, force = false) {
        // Find commentary that matches this trigger
        for (const [id, clip] of this.commentaryBank) {
            if (clip.triggers.includes(trigger)) {
                // Avoid repetition unless forced
                const timeSinceLastUse = Date.now() - clip.lastUsed;
                if (!force && timeSinceLastUse < 5000)
                    continue; // 5 second cooldown
                // Pick a random variation
                const randomIndex = Math.floor(Math.random() * clip.elements.length);
                const element = clip.elements[randomIndex];
                if (element) {
                    try {
                        element.currentTime = 0;
                        element.volume = clip.volume * this.commentaryVolume * this.masterVolume;
                        element.play().catch(e => console.warn(`Commentary play failed: ${id}`, e));
                        clip.lastUsed = Date.now();
                    }
                    catch (error) {
                        console.warn(`Error playing commentary ${id}:`, error);
                    }
                }
                break; // Only play one commentary at a time
            }
        }
    }
    playMusic(id, fadeIn = true) {
        const clip = this.musicBank.get(id);
        if (!clip || !clip.loaded)
            return;
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
        }
        catch (error) {
            console.warn(`Error playing music ${id}:`, error);
        }
    }
    stopMusic(fadeOut = true) {
        if (!this.currentMusic)
            return;
        if (fadeOut) {
            this.fadeVolume(this.currentMusic.element, 0, 1000, () => {
                this.currentMusic?.element.pause();
                this.currentMusic = null;
            });
        }
        else {
            this.currentMusic.element.pause();
            this.currentMusic = null;
        }
    }
    fadeVolume(element, targetVolume, duration, callback) {
        const startVolume = element.volume;
        const volumeChange = targetVolume - startVolume;
        const startTime = Date.now();
        const fade = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            element.volume = startVolume + (volumeChange * progress);
            if (progress < 1) {
                requestAnimationFrame(fade);
            }
            else {
                callback?.();
            }
        };
        fade();
    }
    // Volume controls
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        this.updateAllVolumes();
    }
    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        this.updateAllVolumes();
    }
    setCommentaryVolume(volume) {
        this.commentaryVolume = Math.max(0, Math.min(1, volume));
        this.updateAllVolumes();
    }
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.currentMusic) {
            this.currentMusic.element.volume = this.currentMusic.volume * this.musicVolume * this.masterVolume;
        }
    }
    updateAllVolumes() {
        // Update current music volume
        if (this.currentMusic) {
            this.currentMusic.element.volume = this.currentMusic.volume * this.musicVolume * this.masterVolume;
        }
    }
    // Game event handlers
    onBatContact(hitType) {
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
    onFieldingPlay(playType) {
        this.playSFX('glove_thump');
        if (playType === 'spectacular') {
            this.playCommentary('defense');
            this.playSFX('crowd_cheer');
        }
    }
    onStrikeout() {
        this.playCommentary('strikeout');
        this.playSFX('crowd_ooh');
    }
    onHomeRun() {
        this.playSFX('crowd_cheer', 1.0);
        this.playCommentary('big_hit', true);
    }
    onError() {
        this.playSFX('error_oops');
        this.playCommentary('encouragement');
    }
    onGameStart() {
        this.playSFX('whistle_play');
        this.playMusic('game_theme');
    }
    onGameEnd(won) {
        this.stopMusic(true);
        setTimeout(() => {
            if (won) {
                this.playMusic('victory_theme', false);
                this.playSFX('crowd_cheer', 1.0);
            }
        }, 1000);
    }
    // Utility methods
    preloadAll() {
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
    cleanup() {
        // Stop all audio
        this.stopMusic(false);
        // Clear all banks
        this.sfxBank.clear();
        this.commentaryBank.clear();
        this.musicBank.clear();
        this.isInitialized = false;
    }
}
