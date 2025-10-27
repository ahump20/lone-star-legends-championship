/**
 * Save/Load System for Sandlot Superstars
 * Handles game state persistence using localStorage and optional cloud sync
 */

class SaveSystem {
    constructor() {
        this.storageKey = 'sandlot_superstars_save';
        this.autosaveInterval = null;
        this.autosaveEnabled = true;
        this.autosaveFrequency = 30000; // 30 seconds

        this.defaultSaveData = {
            version: '1.0.0',
            lastSaved: null,
            playerProfile: {
                name: 'Player',
                createdAt: Date.now(),
                totalPlayTime: 0
            },
            statistics: {
                gamesPlayed: 0,
                wins: 0,
                losses: 0,
                homeRuns: 0,
                hits: 0,
                strikeouts: 0,
                runsBattedIn: 0,
                stolenBases: 0,
                perfectGames: 0
            },
            currentGame: {
                active: false,
                gameMode: null,
                homeTeam: null,
                awayTeam: null,
                homeScore: 0,
                awayScore: 0,
                inning: 1,
                inningHalf: 'top',
                outs: 0,
                bases: [false, false, false],
                currentBatter: null,
                currentPitcher: null,
                timestamp: null
            },
            season: {
                active: false,
                currentGame: 0,
                wins: 0,
                losses: 0,
                games: []
            },
            tournament: {
                active: false,
                round: 0,
                bracket: []
            },
            achievements: {
                unlocked: [],
                progress: {}
            },
            settings: {
                soundEffects: true,
                music: true,
                difficulty: 'medium',
                stadium: 'sunny_park',
                controlScheme: 'default'
            },
            unlockedContent: {
                characters: [],
                stadiums: ['sunny_park'],
                teams: []
            }
        };
    }

    /**
     * Initialize the save system and start autosave
     */
    initialize() {
        console.log('🎮 Save System: Initializing...');

        // Load existing save or create new one
        const existingSave = this.loadGame();
        if (!existingSave) {
            console.log('💾 No existing save found, creating new save file');
            this.createNewSave();
        } else {
            console.log('💾 Loaded existing save from', new Date(existingSave.lastSaved).toLocaleString());
        }

        // Start autosave
        if (this.autosaveEnabled) {
            this.startAutosave();
        }

        // Listen for page unload to save
        window.addEventListener('beforeunload', () => {
            if (this.hasActiveGame()) {
                this.saveGame();
            }
        });

        return this.loadGame();
    }

    /**
     * Create a new save file with default data
     */
    createNewSave() {
        const newSave = JSON.parse(JSON.stringify(this.defaultSaveData));
        newSave.lastSaved = Date.now();
        newSave.playerProfile.createdAt = Date.now();

        try {
            localStorage.setItem(this.storageKey, JSON.stringify(newSave));
            console.log('✅ New save file created');
            return newSave;
        } catch (error) {
            console.error('❌ Failed to create save file:', error);
            return null;
        }
    }

    /**
     * Save current game state
     */
    saveGame(data = null) {
        try {
            const currentSave = this.loadGame() || this.defaultSaveData;

            // Merge new data if provided
            if (data) {
                Object.keys(data).forEach(key => {
                    if (typeof data[key] === 'object' && !Array.isArray(data[key])) {
                        currentSave[key] = { ...currentSave[key], ...data[key] };
                    } else {
                        currentSave[key] = data[key];
                    }
                });
            }

            currentSave.lastSaved = Date.now();

            localStorage.setItem(this.storageKey, JSON.stringify(currentSave));
            console.log('💾 Game saved successfully');

            // Dispatch save event
            window.dispatchEvent(new CustomEvent('gameSaved', {
                detail: { timestamp: currentSave.lastSaved }
            }));

            return true;
        } catch (error) {
            console.error('❌ Failed to save game:', error);
            return false;
        }
    }

    /**
     * Load game state from localStorage
     */
    loadGame() {
        try {
            const saveData = localStorage.getItem(this.storageKey);
            if (!saveData) {
                return null;
            }

            const parsed = JSON.parse(saveData);

            // Validate save data structure
            if (!parsed.version || !parsed.playerProfile) {
                console.warn('⚠️ Invalid save data structure');
                return null;
            }

            return parsed;
        } catch (error) {
            console.error('❌ Failed to load game:', error);
            return null;
        }
    }

    /**
     * Update player statistics
     */
    updateStats(stats) {
        const save = this.loadGame();
        if (!save) return false;

        Object.keys(stats).forEach(key => {
            if (save.statistics.hasOwnProperty(key)) {
                save.statistics[key] += stats[key];
            }
        });

        return this.saveGame(save);
    }

    /**
     * Save current game in progress
     */
    saveCurrentGame(gameState) {
        const save = this.loadGame();
        if (!save) return false;

        save.currentGame = {
            ...gameState,
            active: true,
            timestamp: Date.now()
        };

        return this.saveGame(save);
    }

    /**
     * Load current game in progress
     */
    loadCurrentGame() {
        const save = this.loadGame();
        if (!save || !save.currentGame.active) {
            return null;
        }

        return save.currentGame;
    }

    /**
     * Clear current game (after completion)
     */
    clearCurrentGame() {
        const save = this.loadGame();
        if (!save) return false;

        save.currentGame = this.defaultSaveData.currentGame;
        return this.saveGame(save);
    }

    /**
     * Check if there's an active game
     */
    hasActiveGame() {
        const save = this.loadGame();
        return save && save.currentGame.active;
    }

    /**
     * Save season progress
     */
    saveSeasonProgress(seasonData) {
        const save = this.loadGame();
        if (!save) return false;

        save.season = { ...save.season, ...seasonData };
        return this.saveGame(save);
    }

    /**
     * Save tournament progress
     */
    saveTournamentProgress(tournamentData) {
        const save = this.loadGame();
        if (!save) return false;

        save.tournament = { ...save.tournament, ...tournamentData };
        return this.saveGame(save);
    }

    /**
     * Unlock achievement
     */
    unlockAchievement(achievementId) {
        const save = this.loadGame();
        if (!save) return false;

        if (!save.achievements.unlocked.includes(achievementId)) {
            save.achievements.unlocked.push(achievementId);
            console.log(`🏆 Achievement unlocked: ${achievementId}`);

            // Dispatch achievement event
            window.dispatchEvent(new CustomEvent('achievementUnlocked', {
                detail: { achievementId }
            }));
        }

        return this.saveGame(save);
    }

    /**
     * Update achievement progress
     */
    updateAchievementProgress(achievementId, progress) {
        const save = this.loadGame();
        if (!save) return false;

        save.achievements.progress[achievementId] = progress;
        return this.saveGame(save);
    }

    /**
     * Update settings
     */
    updateSettings(settings) {
        const save = this.loadGame();
        if (!save) return false;

        save.settings = { ...save.settings, ...settings };
        return this.saveGame(save);
    }

    /**
     * Get settings
     */
    getSettings() {
        const save = this.loadGame();
        return save ? save.settings : this.defaultSaveData.settings;
    }

    /**
     * Unlock content (characters, stadiums, teams)
     */
    unlockContent(type, id) {
        const save = this.loadGame();
        if (!save) return false;

        const contentArray = save.unlockedContent[type];
        if (contentArray && !contentArray.includes(id)) {
            contentArray.push(id);
            console.log(`🔓 Unlocked ${type}: ${id}`);

            window.dispatchEvent(new CustomEvent('contentUnlocked', {
                detail: { type, id }
            }));
        }

        return this.saveGame(save);
    }

    /**
     * Check if content is unlocked
     */
    isContentUnlocked(type, id) {
        const save = this.loadGame();
        if (!save) return false;

        return save.unlockedContent[type]?.includes(id) || false;
    }

    /**
     * Start autosave timer
     */
    startAutosave() {
        if (this.autosaveInterval) {
            clearInterval(this.autosaveInterval);
        }

        this.autosaveInterval = setInterval(() => {
            if (this.hasActiveGame()) {
                console.log('💾 Autosaving...');
                this.saveGame();
            }
        }, this.autosaveFrequency);

        console.log('⏰ Autosave enabled (every 30s)');
    }

    /**
     * Stop autosave timer
     */
    stopAutosave() {
        if (this.autosaveInterval) {
            clearInterval(this.autosaveInterval);
            this.autosaveInterval = null;
            console.log('⏰ Autosave disabled');
        }
    }

    /**
     * Export save data as JSON for backup
     */
    exportSave() {
        const save = this.loadGame();
        if (!save) {
            console.error('❌ No save data to export');
            return null;
        }

        const blob = new Blob([JSON.stringify(save, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sandlot_superstars_save_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log('📤 Save data exported');
        return save;
    }

    /**
     * Import save data from JSON file
     */
    importSave(jsonData) {
        try {
            const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

            // Validate structure
            if (!data.version || !data.playerProfile) {
                throw new Error('Invalid save file structure');
            }

            localStorage.setItem(this.storageKey, JSON.stringify(data));
            console.log('📥 Save data imported successfully');

            window.dispatchEvent(new CustomEvent('saveImported'));
            return true;
        } catch (error) {
            console.error('❌ Failed to import save:', error);
            return false;
        }
    }

    /**
     * Delete save data (with confirmation)
     */
    deleteSave() {
        if (confirm('⚠️ Are you sure you want to delete all save data? This cannot be undone!')) {
            try {
                localStorage.removeItem(this.storageKey);
                console.log('🗑️ Save data deleted');

                window.dispatchEvent(new CustomEvent('saveDeleted'));

                // Create new save
                this.createNewSave();
                return true;
            } catch (error) {
                console.error('❌ Failed to delete save:', error);
                return false;
            }
        }
        return false;
    }

    /**
     * Get save file info
     */
    getSaveInfo() {
        const save = this.loadGame();
        if (!save) return null;

        return {
            version: save.version,
            lastSaved: new Date(save.lastSaved).toLocaleString(),
            playerName: save.playerProfile.name,
            gamesPlayed: save.statistics.gamesPlayed,
            totalPlayTime: this.formatPlayTime(save.playerProfile.totalPlayTime),
            hasActiveGame: save.currentGame.active
        };
    }

    /**
     * Format play time in human-readable format
     */
    formatPlayTime(milliseconds) {
        const hours = Math.floor(milliseconds / 3600000);
        const minutes = Math.floor((milliseconds % 3600000) / 60000);
        return `${hours}h ${minutes}m`;
    }

    /**
     * Update play time
     */
    updatePlayTime(milliseconds) {
        const save = this.loadGame();
        if (!save) return false;

        save.playerProfile.totalPlayTime += milliseconds;
        return this.saveGame(save);
    }
}

// Create global save system instance
window.saveSystem = new SaveSystem();

// Auto-initialize on DOM load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.saveSystem.initialize();
    });
} else {
    window.saveSystem.initialize();
}
