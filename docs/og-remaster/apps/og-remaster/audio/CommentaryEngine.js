/**
 * Championship Commentary Engine
 * Dynamic voice commentary with contextual awareness
 */
export class CommentaryEngine {
    constructor() {
        this.commentaryLines = [];
        this.voices = [];
        this.selectedVoice = null;
        this.queue = [];
        this.isSpeaking = false;
        this.volume = 1.0;
        this.enabled = true;
        this.emotionModifiers = {
            calm: { rate: 0.9, pitch: 1.0 },
            excited: { rate: 1.2, pitch: 1.1 },
            intense: { rate: 1.1, pitch: 1.05 },
            disappointed: { rate: 0.8, pitch: 0.95 },
            celebratory: { rate: 1.3, pitch: 1.15 }
        };
        this.speechSynthesis = window.speechSynthesis;
        this.initializeVoices();
        this.loadCommentaryDatabase();
    }
    async initializeVoices() {
        // Wait for voices to load
        await new Promise((resolve) => {
            if (speechSynthesis.getVoices().length > 0) {
                resolve();
            }
            else {
                speechSynthesis.addEventListener('voiceschanged', () => resolve(), { once: true });
            }
        });
        this.voices = speechSynthesis.getVoices();
        // Select best voice for commentary (prefer male sports announcer style)
        const preferredVoices = [
            'Google US English',
            'Microsoft David',
            'Alex',
            'Daniel'
        ];
        for (const name of preferredVoices) {
            const voice = this.voices.find(v => v.name.includes(name));
            if (voice) {
                this.selectedVoice = voice;
                break;
            }
        }
        // Fallback to first English voice
        if (!this.selectedVoice) {
            this.selectedVoice = this.voices.find(v => v.lang.startsWith('en')) || this.voices[0];
        }
        console.log('🎙️ Commentary voice selected:', this.selectedVoice?.name);
    }
    loadCommentaryDatabase() {
        // Comprehensive commentary lines for all situations
        this.commentaryLines = [
            // Game start
            {
                id: 'game_start',
                text: "Welcome to championship baseball! We've got an exciting matchup for you today!",
                emotion: 'excited',
                priority: 10,
                conditions: [
                    { type: 'event', operator: 'equals', value: 'game_start' }
                ],
                cooldown: 0
            },
            // Strikeouts
            {
                id: 'strikeout_looking',
                text: "Strike three called! He watched that one go by!",
                emotion: 'intense',
                priority: 8,
                conditions: [
                    { type: 'event', operator: 'equals', value: 'strikeout_looking' }
                ],
                cooldown: 5000
            },
            {
                id: 'strikeout_swinging',
                text: "Swing and a miss! Strike three! That's a nasty pitch!",
                emotion: 'excited',
                priority: 8,
                conditions: [
                    { type: 'event', operator: 'equals', value: 'strikeout_swinging' }
                ],
                cooldown: 5000
            },
            // Home runs
            {
                id: 'homerun_solo',
                text: "It's going... going... GONE! A solo home run!",
                emotion: 'celebratory',
                priority: 10,
                conditions: [
                    { type: 'event', operator: 'equals', value: 'homerun' },
                    { type: 'runners', operator: 'equals', value: { first: false, second: false, third: false } }
                ],
                cooldown: 0
            },
            {
                id: 'homerun_grand_slam',
                text: "OH MY! GRAND SLAM! The crowd is going absolutely wild!",
                emotion: 'celebratory',
                priority: 10,
                conditions: [
                    { type: 'event', operator: 'equals', value: 'homerun' },
                    { type: 'runners', operator: 'equals', value: { first: true, second: true, third: true } }
                ],
                cooldown: 0
            },
            // Hits
            {
                id: 'single',
                text: "Base hit! Runner aboard!",
                emotion: 'excited',
                priority: 6,
                conditions: [
                    { type: 'event', operator: 'equals', value: 'single' }
                ],
                cooldown: 3000
            },
            {
                id: 'double',
                text: "Driven to the gap! That's a double!",
                emotion: 'excited',
                priority: 7,
                conditions: [
                    { type: 'event', operator: 'equals', value: 'double' }
                ],
                cooldown: 3000
            },
            {
                id: 'triple',
                text: "He's racing around the bases! Triple! What speed!",
                emotion: 'celebratory',
                priority: 9,
                conditions: [
                    { type: 'event', operator: 'equals', value: 'triple' }
                ],
                cooldown: 0
            },
            // Count situations
            {
                id: 'full_count',
                text: "Full count. The tension is building here.",
                emotion: 'intense',
                priority: 5,
                conditions: [
                    { type: 'count', operator: 'equals', value: { balls: 3, strikes: 2 } }
                ],
                cooldown: 10000
            },
            {
                id: 'two_strikes',
                text: "Two strikes. Batter needs to protect the plate.",
                emotion: 'calm',
                priority: 4,
                conditions: [
                    { type: 'count', operator: 'equals', value: { balls: 0, strikes: 2 } }
                ],
                cooldown: 15000
            },
            // Clutch situations
            {
                id: 'bases_loaded',
                text: "Bases loaded! The pressure is on!",
                emotion: 'intense',
                priority: 8,
                conditions: [
                    { type: 'runners', operator: 'equals', value: { first: true, second: true, third: true } }
                ],
                cooldown: 20000
            },
            {
                id: 'winning_run_on',
                text: "The winning run is on base!",
                emotion: 'intense',
                priority: 9,
                conditions: [
                    { type: 'inning', operator: 'greater', value: 8 },
                    { type: 'score', operator: 'less', value: 1 }
                ],
                cooldown: 30000
            },
            // Inning changes
            {
                id: 'seventh_stretch',
                text: "Time for the seventh inning stretch!",
                emotion: 'calm',
                priority: 7,
                conditions: [
                    { type: 'inning', operator: 'equals', value: 7 },
                    { type: 'event', operator: 'equals', value: 'inning_change' }
                ],
                cooldown: 0
            },
            {
                id: 'final_inning',
                text: "Bottom of the ninth. This is it, folks!",
                emotion: 'intense',
                priority: 9,
                conditions: [
                    { type: 'inning', operator: 'equals', value: 9 }
                ],
                cooldown: 0
            },
            // Game end
            {
                id: 'game_end_close',
                text: "What a game! That was baseball at its finest!",
                emotion: 'celebratory',
                priority: 10,
                conditions: [
                    { type: 'event', operator: 'equals', value: 'game_end' },
                    { type: 'score', operator: 'less', value: 3 }
                ],
                cooldown: 0
            },
            {
                id: 'game_end_blowout',
                text: "And that'll do it. A dominant performance today.",
                emotion: 'calm',
                priority: 10,
                conditions: [
                    { type: 'event', operator: 'equals', value: 'game_end' },
                    { type: 'score', operator: 'greater', value: 5 }
                ],
                cooldown: 0
            },
            // Special plays
            {
                id: 'double_play',
                text: "Double play! They turn two! Beautiful execution!",
                emotion: 'excited',
                priority: 9,
                conditions: [
                    { type: 'event', operator: 'equals', value: 'double_play' }
                ],
                cooldown: 0
            },
            {
                id: 'stolen_base',
                text: "He's stealing! Safe! What speed on the base paths!",
                emotion: 'excited',
                priority: 7,
                conditions: [
                    { type: 'event', operator: 'equals', value: 'stolen_base' }
                ],
                cooldown: 10000
            },
            {
                id: 'caught_stealing',
                text: "Caught stealing! The catcher guns him down!",
                emotion: 'excited',
                priority: 7,
                conditions: [
                    { type: 'event', operator: 'equals', value: 'caught_stealing' }
                ],
                cooldown: 10000
            },
            // Pitching achievements
            {
                id: 'perfect_game_alert',
                text: "Through six innings, we have a perfect game going!",
                emotion: 'intense',
                priority: 10,
                conditions: [
                    { type: 'inning', operator: 'equals', value: 6 },
                    { type: 'event', operator: 'equals', value: 'perfect_game' }
                ],
                cooldown: 0
            },
            {
                id: 'no_hitter_alert',
                text: "We're in the eighth inning of a no-hitter!",
                emotion: 'intense',
                priority: 10,
                conditions: [
                    { type: 'inning', operator: 'equals', value: 8 },
                    { type: 'event', operator: 'equals', value: 'no_hitter' }
                ],
                cooldown: 0
            },
            // Weather/atmosphere
            {
                id: 'great_day',
                text: "What a beautiful day for baseball!",
                emotion: 'calm',
                priority: 3,
                conditions: [
                    { type: 'inning', operator: 'equals', value: 1 }
                ],
                cooldown: 60000
            },
            // Player-specific
            {
                id: 'ace_pitching',
                text: "Ace is dealing today! Unhittable stuff!",
                emotion: 'excited',
                priority: 6,
                conditions: [
                    { type: 'player', operator: 'equals', value: 'Ace' },
                    { type: 'event', operator: 'equals', value: 'strikeout' }
                ],
                cooldown: 20000
            },
            {
                id: 'blaze_speed',
                text: "Blaze showing off that lightning speed!",
                emotion: 'excited',
                priority: 6,
                conditions: [
                    { type: 'player', operator: 'equals', value: 'Blaze' },
                    { type: 'event', operator: 'contains', value: 'steal' }
                ],
                cooldown: 20000
            }
        ];
    }
    async commentate(situation) {
        if (!this.enabled || this.isSpeaking)
            return;
        // Find applicable commentary lines
        const applicable = this.commentaryLines.filter(line => this.checkConditions(line.conditions, situation) &&
            this.checkCooldown(line));
        if (applicable.length === 0)
            return;
        // Sort by priority and select highest
        applicable.sort((a, b) => b.priority - a.priority);
        const selected = applicable[0];
        // Add to queue
        this.queue.push(selected);
        // Process queue if not already speaking
        if (!this.isSpeaking) {
            this.processQueue();
        }
    }
    checkConditions(conditions, situation) {
        return conditions.every(condition => {
            const value = this.getSituationValue(condition.type, situation);
            switch (condition.operator) {
                case 'equals':
                    return JSON.stringify(value) === JSON.stringify(condition.value);
                case 'greater':
                    return value > condition.value;
                case 'less':
                    return value < condition.value;
                case 'contains':
                    return String(value).includes(String(condition.value));
                default:
                    return false;
            }
        });
    }
    getSituationValue(type, situation) {
        switch (type) {
            case 'event':
                return situation.event;
            case 'score':
                return Math.abs(situation.score.home - situation.score.away);
            case 'inning':
                return situation.inning;
            case 'count':
                return situation.count;
            case 'runners':
                return situation.runners;
            case 'player':
                return situation.batter || situation.pitcher;
            default:
                return null;
        }
    }
    checkCooldown(line) {
        if (!line.lastPlayed)
            return true;
        return Date.now() - line.lastPlayed >= line.cooldown;
    }
    async processQueue() {
        if (this.queue.length === 0) {
            this.isSpeaking = false;
            return;
        }
        this.isSpeaking = true;
        const line = this.queue.shift();
        // Update last played time
        line.lastPlayed = Date.now();
        // If audio file exists, play it
        if (line.audioFile) {
            await this.playAudioFile(line.audioFile);
        }
        else {
            // Use text-to-speech
            await this.speak(line.text, line.emotion);
        }
        // Process next in queue
        this.processQueue();
    }
    async speak(text, emotion) {
        return new Promise((resolve) => {
            const utterance = new SpeechSynthesisUtterance(text);
            if (this.selectedVoice) {
                utterance.voice = this.selectedVoice;
            }
            // Apply emotion modifiers
            const modifiers = this.emotionModifiers[emotion];
            utterance.rate = modifiers.rate;
            utterance.pitch = modifiers.pitch;
            utterance.volume = this.volume;
            utterance.onend = () => resolve();
            utterance.onerror = () => resolve();
            this.speechSynthesis.speak(utterance);
        });
    }
    async playAudioFile(file) {
        return new Promise((resolve) => {
            const audio = new Audio(file);
            audio.volume = this.volume;
            audio.onended = () => resolve();
            audio.onerror = () => resolve();
            audio.play().catch(() => resolve());
        });
    }
    // Instant commentary for special moments
    async commentateInstant(text, emotion = 'excited') {
        if (!this.enabled)
            return;
        // Cancel current speech for instant commentary
        this.speechSynthesis.cancel();
        this.queue = [];
        this.isSpeaking = false;
        await this.speak(text, emotion);
    }
    // Generate dynamic commentary based on stats
    generateStatCommentary(stats) {
        const comments = [];
        if (stats.battingAverage > 0.300) {
            comments.push(`Batting ${(stats.battingAverage * 1000).toFixed(0)}! Hot at the plate!`);
        }
        if (stats.homeRuns > 10) {
            comments.push(`${stats.homeRuns} home runs this season! Power threat!`);
        }
        if (stats.era && stats.era < 3.00) {
            comments.push(`ERA under 3! Dominant on the mound!`);
        }
        return comments[Math.floor(Math.random() * comments.length)] || "Let's see what happens here.";
    }
    // Control methods
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }
    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.speechSynthesis.cancel();
            this.queue = [];
            this.isSpeaking = false;
        }
    }
    pause() {
        this.speechSynthesis.pause();
    }
    resume() {
        this.speechSynthesis.resume();
    }
    stop() {
        this.speechSynthesis.cancel();
        this.queue = [];
        this.isSpeaking = false;
    }
    // Add custom commentary line
    addCustomLine(line) {
        this.commentaryLines.push(line);
    }
    // Get voice options for settings
    getAvailableVoices() {
        return this.voices;
    }
    setVoice(voice) {
        this.selectedVoice = voice;
    }
}
