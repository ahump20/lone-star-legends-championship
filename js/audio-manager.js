/**
 * Audio Manager
 * Handles sound effects and background music using Web Audio API
 */

class AudioManager {
    constructor() {
        this.enabled = true;
        this.musicEnabled = true;
        this.sfxEnabled = true;
        this.volume = 0.7;
        this.musicVolume = 0.4;

        // Web Audio API context
        this.audioContext = null;
        this.sounds = {};
        this.currentMusic = null;

        this.loadSettings();
        this.initAudioContext();
        this.initSounds();
    }

    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported', e);
        }
    }

    /**
     * Initialize sound effects using oscillators (procedural audio)
     */
    initSounds() {
        // Sound effects will be generated procedurally
        this.soundDefinitions = {
            'bat_crack': { type: 'crack', duration: 0.1, freq: 200 },
            'glove_catch': { type: 'pop', duration: 0.08, freq: 150 },
            'crowd_cheer': { type: 'cheer', duration: 2.0, freq: 400 },
            'crowd_aww': { type: 'aww', duration: 1.5, freq: 250 },
            'umpire_strike': { type: 'voice', duration: 0.3, freq: 180 },
            'umpire_out': { type: 'voice', duration: 0.4, freq: 160 },
            'home_run': { type: 'fanfare', duration: 3.0, freq: 440 },
            'strikeout': { type: 'womp', duration: 0.5, freq: 100 },
            'ball_hit_ground': { type: 'thud', duration: 0.1, freq: 120 },
            'whistle': { type: 'whistle', duration: 0.5, freq: 800 },
            'button_click': { type: 'click', duration: 0.05, freq: 600 }
        };
    }

    /**
     * Play a sound effect
     */
    play(soundName, volume = 1.0) {
        if (!this.enabled || !this.sfxEnabled || !this.audioContext) return;

        const soundDef = this.soundDefinitions[soundName];
        if (!soundDef) {
            console.warn(`Sound ${soundName} not found`);
            return;
        }

        this.generateSound(soundDef, volume);
    }

    /**
     * Generate procedural sound effect
     */
    generateSound(soundDef, volume = 1.0) {
        const ctx = this.audioContext;
        const now = ctx.currentTime;

        switch (soundDef.type) {
            case 'crack':
                this.playBatCrack(now, volume);
                break;
            case 'pop':
                this.playPop(now, volume);
                break;
            case 'cheer':
                this.playCrowdCheer(now, volume);
                break;
            case 'aww':
                this.playCrowdAww(now, volume);
                break;
            case 'womp':
                this.playWomp(now, volume);
                break;
            case 'thud':
                this.playThud(now, volume);
                break;
            case 'whistle':
                this.playWhistle(now, volume);
                break;
            case 'click':
                this.playClick(now, volume);
                break;
            case 'fanfare':
                this.playFanfare(now, volume);
                break;
        }
    }

    playBatCrack(startTime, volume) {
        const ctx = this.audioContext;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(200, startTime);
        osc.frequency.exponentialRampToValueAtTime(50, startTime + 0.1);

        gain.gain.setValueAtTime(volume * this.volume, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.1);
    }

    playPop(startTime, volume) {
        const ctx = this.audioContext;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, startTime);
        osc.frequency.exponentialRampToValueAtTime(80, startTime + 0.08);

        gain.gain.setValueAtTime(volume * this.volume * 0.5, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.08);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.08);
    }

    playCrowdCheer(startTime, volume) {
        const ctx = this.audioContext;

        // Create noise for crowd
        for (let i = 0; i < 5; i++) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(300 + Math.random() * 200, startTime);

            filter.type = 'bandpass';
            filter.frequency.value = 1000;

            gain.gain.setValueAtTime(volume * this.volume * 0.1, startTime);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 2.0);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);

            osc.start(startTime + i * 0.1);
            osc.stop(startTime + 2.0);
        }
    }

    playCrowdAww(startTime, volume) {
        const ctx = this.audioContext;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, startTime);
        osc.frequency.linearRampToValueAtTime(250, startTime + 1.5);

        gain.gain.setValueAtTime(volume * this.volume * 0.3, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 1.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 1.5);
    }

    playWomp(startTime, volume) {
        const ctx = this.audioContext;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, startTime);
        osc.frequency.exponentialRampToValueAtTime(50, startTime + 0.5);

        gain.gain.setValueAtTime(volume * this.volume * 0.4, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.5);
    }

    playThud(startTime, volume) {
        const ctx = this.audioContext;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, startTime);
        osc.frequency.exponentialRampToValueAtTime(40, startTime + 0.1);

        gain.gain.setValueAtTime(volume * this.volume * 0.6, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.1);
    }

    playWhistle(startTime, volume) {
        const ctx = this.audioContext;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, startTime);
        osc.frequency.linearRampToValueAtTime(1200, startTime + 0.5);

        gain.gain.setValueAtTime(volume * this.volume * 0.3, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.5);
    }

    playClick(startTime, volume) {
        const ctx = this.audioContext;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.value = 600;

        gain.gain.setValueAtTime(volume * this.volume * 0.3, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.05);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.05);
    }

    playFanfare(startTime, volume) {
        const ctx = this.audioContext;
        const notes = [440, 554, 659, 880]; // A, C#, E, A (triumphant chord)

        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.value = freq;

            gain.gain.setValueAtTime(volume * this.volume * 0.2, startTime + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 3.0);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(startTime + i * 0.1);
            osc.stop(startTime + 3.0);
        });
    }

    /**
     * Announcer calls (text-to-speech simulation via tones)
     */
    announce(call) {
        if (!this.enabled || !this.sfxEnabled) return;

        const calls = {
            'strike': () => this.play('umpire_strike'),
            'ball': () => this.play('button_click'),
            'out': () => this.play('umpire_out'),
            'home_run': () => {
                this.play('bat_crack');
                setTimeout(() => this.play('home_run'), 200);
                setTimeout(() => this.play('crowd_cheer'), 400);
            },
            'strikeout': () => {
                this.play('strikeout');
                setTimeout(() => this.play('crowd_cheer'), 300);
            },
            'hit': () => {
                this.play('bat_crack');
                setTimeout(() => this.play('crowd_cheer', 0.5), 200);
            },
            'catch': () => {
                this.play('glove_catch');
            },
            'foul': () => {
                this.play('bat_crack', 0.6);
            }
        };

        const callFunc = calls[call];
        if (callFunc) {
            callFunc();
        }
    }

    /**
     * Toggle sound effects
     */
    toggleSFX() {
        this.sfxEnabled = !this.sfxEnabled;
        this.saveSettings();
        return this.sfxEnabled;
    }

    /**
     * Toggle music
     */
    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        this.saveSettings();
        return this.musicEnabled;
    }

    /**
     * Set volume
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        this.saveSettings();
    }

    /**
     * Save settings to localStorage
     */
    saveSettings() {
        localStorage.setItem('audioSettings', JSON.stringify({
            enabled: this.enabled,
            sfxEnabled: this.sfxEnabled,
            musicEnabled: this.musicEnabled,
            volume: this.volume
        }));
    }

    /**
     * Load settings from localStorage
     */
    loadSettings() {
        const saved = localStorage.getItem('audioSettings');
        if (saved) {
            const settings = JSON.parse(saved);
            this.enabled = settings.enabled ?? true;
            this.sfxEnabled = settings.sfxEnabled ?? true;
            this.musicEnabled = settings.musicEnabled ?? true;
            this.volume = settings.volume ?? 0.7;
        }
    }

    /**
     * Commentary system - returns text for announcer
     */
    getCommentary(event, context = {}) {
        const commentaryLines = {
            'game_start': [
                "Play ball! It's a beautiful day for baseball!",
                "Welcome to the ballpark, folks! Let's get this game started!",
                "And we're underway! Batter up!"
            ],
            'strike': [
                "Strike!",
                "Right down the middle!",
                "Swung on and missed!",
                "Called strike!"
            ],
            'ball': [
                "Ball!",
                "Outside!",
                "Too high!",
                "Batter holds up"
            ],
            'single': [
                `Base hit for ${context.player || 'the batter'}!`,
                "Into the outfield for a single!",
                "And that's a clean single!"
            ],
            'double': [
                `${context.player || 'The batter'} drives it deep! That's a double!`,
                "Into the gap! Standing up at second base!",
                "Extra base hit! A double!"
            ],
            'triple': [
                `All the way to the wall! ${context.player || 'The batter'} is flying! Triple!`,
                "That ball is smoked! Triple!",
                "Into the corner! Legging it out for three!"
            ],
            'home_run': [
                `GONE! HOME RUN for ${context.player || 'the batter'}!`,
                `That ball is OUTTA HERE! ${context.player || 'The batter'} sends it deep!`,
                `BOOM! TOUCH EM ALL! HOME RUN!`,
                `See ya later! That's a MONSTER shot!`
            ],
            'out': [
                `And that's out number ${context.outs || 'one'}!`,
                "Out!",
                "Caught for the out!",
                "That'll do it!"
            ],
            'strikeout': [
                `Strike three! ${context.player || 'The batter'} is OUT!`,
                "Struck him out looking!",
                "Swung through it! Strikeout!",
                "Caught looking! That's a K!"
            ],
            'walk': [
                `Ball four! ${context.player || 'The batter'} takes a walk!`,
                "Patient at-bat earns a walk!",
                "Free pass! That's a walk!"
            ],
            'inning_end': [
                `And that's the end of the inning!`,
                `Three up, three down!`,
                `Side retired!`
            ],
            'game_end': [
                `That's the game! Final score: ${context.awayScore}-${context.homeScore}!`,
                `And that's a ballgame! What a finish!`,
                `Game over! The ${context.winner} take this one!`
            ]
        };

        const lines = commentaryLines[event];
        if (!lines) return '';

        return lines[Math.floor(Math.random() * lines.length)];
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioManager;
}
