/**
 * Game State Manager
 * Handles save/load game progress, settings, and statistics
 */

class GameStateManager {
    constructor() {
        this.storagePrefix = 'sandlot_';
        this.currentGame = null;
        this.settings = this.loadSettings();
        this.statistics = this.loadStatistics();
    }

    /**
     * Save current game state
     */
    saveGame(gameData) {
        try {
            const saveData = {
                version: '2.0.0',
                timestamp: Date.now(),
                game: {
                    inning: gameData.inning,
                    homeScore: gameData.homeScore,
                    awayScore: gameData.awayScore,
                    homeTeam: gameData.homeTeam,
                    awayTeam: gameData.awayTeam,
                    outs: gameData.outs || 0,
                    balls: gameData.balls || 0,
                    strikes: gameData.strikes || 0,
                    currentBatter: gameData.currentBatter,
                    currentPitcher: gameData.currentPitcher,
                    bases: gameData.bases || [null, null, null],
                    stadium: gameData.stadium,
                    gameMode: gameData.gameMode || 'quickplay',
                },
                players: {
                    homeLineup: gameData.homeLineup,
                    awayLineup: gameData.awayLineup,
                },
            };

            localStorage.setItem(this.storagePrefix + 'current_game', JSON.stringify(saveData));
            console.info('✅ Game saved successfully');
            return true;
        } catch (error) {
            console.error('Failed to save game:', error);
            this.showError('Failed to save game. Check storage quota.');
            return false;
        }
    }

    /**
     * Load saved game
     */
    loadGame() {
        try {
            const saved = localStorage.getItem(this.storagePrefix + 'current_game');
            if (!saved) {
                return null;
            }

            const saveData = JSON.parse(saved);

            // Validate save data
            if (!saveData.version || !saveData.game) {
                throw new Error('Invalid save data');
            }

            console.info(`✅ Game loaded (saved ${this.formatTimestamp(saveData.timestamp)})`);
            this.currentGame = saveData;
            return saveData;
        } catch (error) {
            console.error('Failed to load game:', error);
            return null;
        }
    }

    /**
     * Delete saved game
     */
    deleteSave() {
        localStorage.removeItem(this.storagePrefix + 'current_game');
        this.currentGame = null;
        console.info('✅ Save deleted');
    }

    /**
     * Check if save exists
     */
    hasSavedGame() {
        return localStorage.getItem(this.storagePrefix + 'current_game') !== null;
    }

    /**
     * Save user settings
     */
    saveSettings(settings) {
        const mergedSettings = { ...this.settings, ...settings };
        localStorage.setItem(
            this.storagePrefix + 'settings',
            JSON.stringify(mergedSettings)
        );
        this.settings = mergedSettings;
        console.info('✅ Settings saved');
    }

    /**
     * Load user settings
     */
    loadSettings() {
        try {
            const saved = localStorage.getItem(this.storagePrefix + 'settings');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }

        // Default settings
        return {
            volume: 0.7,
            musicEnabled: true,
            sfxEnabled: true,
            difficulty: 'medium',
            autoSave: true,
            showTutorial: true,
            graphics: 'high',
            controls: 'keyboard',
        };
    }

    /**
     * Update player statistics
     */
    updateStatistics(stats) {
        this.statistics.gamesPlayed++;
        this.statistics.totalRuns += stats.runs || 0;
        this.statistics.totalHits += stats.hits || 0;
        this.statistics.totalHomeRuns += stats.homeRuns || 0;
        this.statistics.totalStrikeouts += stats.strikeouts || 0;

        if (stats.won) {
            this.statistics.wins++;
        } else {
            this.statistics.losses++;
        }

        // Track best scores
        if (!this.statistics.highestScore || stats.score > this.statistics.highestScore) {
            this.statistics.highestScore = stats.score;
        }

        // Track character usage
        if (stats.charactersUsed) {
            stats.charactersUsed.forEach(charId => {
                this.statistics.characterUsage[charId] =
                    (this.statistics.characterUsage[charId] || 0) + 1;
            });
        }

        this.statistics.lastPlayed = Date.now();
        this.saveStatistics();
    }

    /**
     * Load statistics
     */
    loadStatistics() {
        try {
            const saved = localStorage.getItem(this.storagePrefix + 'statistics');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (error) {
            console.error('Failed to load statistics:', error);
        }

        return {
            gamesPlayed: 0,
            wins: 0,
            losses: 0,
            totalRuns: 0,
            totalHits: 0,
            totalHomeRuns: 0,
            totalStrikeouts: 0,
            highestScore: 0,
            characterUsage: {},
            lastPlayed: null,
        };
    }

    /**
     * Save statistics
     */
    saveStatistics() {
        localStorage.setItem(
            this.storagePrefix + 'statistics',
            JSON.stringify(this.statistics)
        );
    }

    /**
     * Get statistics
     */
    getStatistics() {
        return { ...this.statistics };
    }

    /**
     * Reset statistics
     */
    resetStatistics() {
        this.statistics = this.loadStatistics();
        localStorage.removeItem(this.storagePrefix + 'statistics');
        console.info('✅ Statistics reset');
    }

    /**
     * Export all data
     */
    exportData() {
        return {
            settings: this.settings,
            statistics: this.statistics,
            currentGame: this.currentGame,
            exportDate: new Date().toISOString(),
        };
    }

    /**
     * Import data
     */
    importData(data) {
        try {
            if (data.settings) {
                this.saveSettings(data.settings);
            }
            if (data.statistics) {
                this.statistics = data.statistics;
                this.saveStatistics();
            }
            if (data.currentGame) {
                localStorage.setItem(
                    this.storagePrefix + 'current_game',
                    JSON.stringify(data.currentGame)
                );
            }
            console.info('✅ Data imported successfully');
            return true;
        } catch (error) {
            console.error('Failed to import data:', error);
            return false;
        }
    }

    /**
     * Get storage usage
     */
    getStorageUsage() {
        let total = 0;
        for (let key in localStorage) {
            if (key.startsWith(this.storagePrefix)) {
                total += localStorage[key].length + key.length;
            }
        }
        return {
            used: total,
            usedKB: (total / 1024).toFixed(2),
            percentOfQuota: ((total / 5242880) * 100).toFixed(2), // 5MB quota
        };
    }

    /**
     * Clear all game data
     */
    clearAllData() {
        const keys = Object.keys(localStorage).filter(key =>
            key.startsWith(this.storagePrefix)
        );
        keys.forEach(key => localStorage.removeItem(key));
        this.currentGame = null;
        this.settings = this.loadSettings();
        this.statistics = this.loadStatistics();
        console.info('✅ All data cleared');
    }

    /**
     * Format timestamp for display
     */
    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = Date.now();
        const diff = now - timestamp;

        if (diff < 60000) {
            return 'just now';
        }
        if (diff < 3600000) {
            return `${Math.floor(diff / 60000)} minutes ago`;
        }
        if (diff < 86400000) {
            return `${Math.floor(diff / 3600000)} hours ago`;
        }
        return date.toLocaleDateString();
    }

    /**
     * Show error message
     */
    showError(message) {
        // This will be called by the UI layer
        if (typeof window !== 'undefined' && window.gameUI) {
            window.gameUI.showError(message);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameStateManager;
}
