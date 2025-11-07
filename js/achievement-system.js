/**
 * Achievement System
 * Tracks player milestones, badges, and unlockables
 */

class AchievementSystem {
    constructor(gameStateManager) {
        this.gameStateManager = gameStateManager;
        this.achievements = this.initializeAchievements();
        this.unlockedAchievements = this.loadUnlocked();
        this.listeners = [];
    }

    /**
     * Initialize all achievements
     */
    initializeAchievements() {
        return {
            // First Steps
            first_game: {
                id: 'first_game',
                name: 'First Game',
                description: 'Complete your first game',
                category: 'milestone',
                icon: '⚾',
                points: 10,
                requirement: { type: 'games_played', value: 1 },
            },
            rookie: {
                id: 'rookie',
                name: 'Rookie Season',
                description: 'Play 10 games',
                category: 'milestone',
                icon: '🎯',
                points: 25,
                requirement: { type: 'games_played', value: 10 },
            },
            veteran: {
                id: 'veteran',
                name: 'Veteran Player',
                description: 'Play 50 games',
                category: 'milestone',
                icon: '🏆',
                points: 100,
                requirement: { type: 'games_played', value: 50 },
            },

            // Hitting Achievements
            first_hit: {
                id: 'first_hit',
                name: 'First Contact',
                description: 'Get your first hit',
                category: 'hitting',
                icon: '💥',
                points: 10,
                requirement: { type: 'total_hits', value: 1 },
            },
            slugger: {
                id: 'slugger',
                name: 'Slugger',
                description: 'Hit 5 home runs in a single game',
                category: 'hitting',
                icon: '🚀',
                points: 50,
                requirement: { type: 'home_runs_per_game', value: 5 },
            },
            contact_hitter: {
                id: 'contact_hitter',
                name: 'Contact Hitter',
                description: 'Accumulate 100 hits',
                category: 'hitting',
                icon: '🎯',
                points: 75,
                requirement: { type: 'total_hits', value: 100 },
            },
            power_hitter: {
                id: 'power_hitter',
                name: 'Power Hitter',
                description: 'Hit 25 home runs total',
                category: 'hitting',
                icon: '💪',
                points: 100,
                requirement: { type: 'total_home_runs', value: 25 },
            },
            cycle: {
                id: 'cycle',
                name: 'Hit for the Cycle',
                description: 'Hit single, double, triple, and home run in one game',
                category: 'hitting',
                icon: '🔄',
                points: 150,
                requirement: { type: 'cycle', value: 1 },
            },

            // Winning Achievements
            first_win: {
                id: 'first_win',
                name: 'Taste of Victory',
                description: 'Win your first game',
                category: 'winning',
                icon: '✅',
                points: 15,
                requirement: { type: 'wins', value: 1 },
            },
            winning_streak: {
                id: 'winning_streak',
                name: 'Hot Streak',
                description: 'Win 5 games in a row',
                category: 'winning',
                icon: '🔥',
                points: 75,
                requirement: { type: 'win_streak', value: 5 },
            },
            champion: {
                id: 'champion',
                name: 'Champion',
                description: 'Win 25 games',
                category: 'winning',
                icon: '👑',
                points: 150,
                requirement: { type: 'wins', value: 25 },
            },
            shutout: {
                id: 'shutout',
                name: 'Shutout Victory',
                description: "Win a game without allowing opponent to score",
                category: 'winning',
                icon: '🛡️',
                points: 100,
                requirement: { type: 'shutout', value: 1 },
            },

            // Pitching Achievements
            strikeout_king: {
                id: 'strikeout_king',
                name: 'Strikeout King',
                description: 'Record 10 strikeouts in one game',
                category: 'pitching',
                icon: 'K',
                points: 75,
                requirement: { type: 'strikeouts_per_game', value: 10 },
            },
            perfect_game: {
                id: 'perfect_game',
                name: 'Perfect Game',
                description: 'Complete a perfect game (no hits, walks, or runs)',
                category: 'pitching',
                icon: '💎',
                points: 250,
                requirement: { type: 'perfect_game', value: 1 },
            },

            // Special Abilities
            ability_master: {
                id: 'ability_master',
                name: 'Ability Master',
                description: 'Use 50 special abilities',
                category: 'abilities',
                icon: '⚡',
                points: 100,
                requirement: { type: 'abilities_used', value: 50 },
            },
            all_abilities: {
                id: 'all_abilities',
                name: 'Jack of All Trades',
                description: 'Use every type of special ability at least once',
                category: 'abilities',
                icon: '🎭',
                points: 150,
                requirement: { type: 'unique_abilities', value: 18 },
            },

            // Collection
            full_roster: {
                id: 'full_roster',
                name: 'Collector',
                description: 'Play as all 18 characters',
                category: 'collection',
                icon: '📋',
                points: 200,
                requirement: { type: 'unique_characters', value: 18 },
            },
            stadium_explorer: {
                id: 'stadium_explorer',
                name: 'Stadium Explorer',
                description: 'Play in all 6 stadiums',
                category: 'collection',
                icon: '🏟️',
                points: 100,
                requirement: { type: 'unique_stadiums', value: 6 },
            },

            // Season Mode
            season_complete: {
                id: 'season_complete',
                name: 'Season Complete',
                description: 'Complete a full season',
                category: 'season',
                icon: '📅',
                points: 200,
                requirement: { type: 'seasons_completed', value: 1 },
            },
            championship: {
                id: 'championship',
                name: 'World Champion',
                description: 'Win a championship',
                category: 'season',
                icon: '🏆',
                points: 300,
                requirement: { type: 'championships', value: 1 },
            },

            // Milestones
            century: {
                id: 'century',
                name: 'Century Club',
                description: 'Score 100 runs',
                category: 'milestone',
                icon: '💯',
                points: 100,
                requirement: { type: 'total_runs', value: 100 },
            },
            dedication: {
                id: 'dedication',
                name: 'Dedication',
                description: 'Play for 10 hours total',
                category: 'milestone',
                icon: '⏱️',
                points: 150,
                requirement: { type: 'play_time_hours', value: 10 },
            },
        };
    }

    /**
     * Load unlocked achievements
     */
    loadUnlocked() {
        try {
            const saved = localStorage.getItem('sandlot_achievements');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (error) {
            console.error('Failed to load achievements:', error);
        }
        return {};
    }

    /**
     * Save unlocked achievements
     */
    saveUnlocked() {
        localStorage.setItem('sandlot_achievements', JSON.stringify(this.unlockedAchievements));
    }

    /**
     * Check and unlock achievements based on stats
     */
    checkAchievements(stats) {
        const newlyUnlocked = [];

        Object.values(this.achievements).forEach(achievement => {
            // Skip if already unlocked
            if (this.unlockedAchievements[achievement.id]) {
                return;
            }

            // Check if requirement is met
            if (this.checkRequirement(achievement.requirement, stats)) {
                this.unlockAchievement(achievement.id);
                newlyUnlocked.push(achievement);
            }
        });

        return newlyUnlocked;
    }

    /**
     * Check if achievement requirement is met
     */
    checkRequirement(requirement, stats) {
        const { type, value } = requirement;

        switch (type) {
            case 'games_played':
                return stats.gamesPlayed >= value;
            case 'wins':
                return stats.wins >= value;
            case 'win_streak':
                return stats.currentWinStreak >= value;
            case 'total_hits':
                return stats.totalHits >= value;
            case 'total_home_runs':
                return stats.totalHomeRuns >= value;
            case 'total_runs':
                return stats.totalRuns >= value;
            case 'home_runs_per_game':
                return stats.gameHomeRuns >= value;
            case 'strikeouts_per_game':
                return stats.gameStrikeouts >= value;
            case 'abilities_used':
                return stats.totalAbilitiesUsed >= value;
            case 'unique_abilities':
                return Object.keys(stats.abilitiesUsed || {}).length >= value;
            case 'unique_characters':
                return Object.keys(stats.charactersPlayed || {}).length >= value;
            case 'unique_stadiums':
                return Object.keys(stats.stadiumsPlayed || {}).length >= value;
            case 'seasons_completed':
                return stats.seasonsCompleted >= value;
            case 'championships':
                return stats.championships >= value;
            case 'play_time_hours':
                return (stats.playTimeMinutes || 0) / 60 >= value;
            case 'cycle':
                return stats.gameCycles >= value;
            case 'shutout':
                return stats.gameShutout === true;
            case 'perfect_game':
                return stats.gamePerfect === true;
            default:
                return false;
        }
    }

    /**
     * Unlock an achievement
     */
    unlockAchievement(achievementId) {
        if (this.unlockedAchievements[achievementId]) {
            return false; // Already unlocked
        }

        const achievement = this.achievements[achievementId];
        if (!achievement) {
            return false;
        }

        this.unlockedAchievements[achievementId] = {
            unlockedAt: Date.now(),
            achievement: achievement,
        };

        this.saveUnlocked();
        this.notifyUnlock(achievement);

        console.info(`🏆 Achievement Unlocked: ${achievement.name}`);
        return true;
    }

    /**
     * Get all achievements
     */
    getAllAchievements() {
        return Object.values(this.achievements).map(achievement => ({
            ...achievement,
            unlocked: !!this.unlockedAchievements[achievement.id],
            unlockedAt: this.unlockedAchievements[achievement.id]?.unlockedAt,
        }));
    }

    /**
     * Get achievements by category
     */
    getAchievementsByCategory(category) {
        return this.getAllAchievements().filter(a => a.category === category);
    }

    /**
     * Get unlocked achievements
     */
    getUnlockedAchievements() {
        return this.getAllAchievements().filter(a => a.unlocked);
    }

    /**
     * Get progress statistics
     */
    getProgress() {
        const total = Object.keys(this.achievements).length;
        const unlocked = Object.keys(this.unlockedAchievements).length;
        const totalPoints = Object.values(this.achievements).reduce(
            (sum, a) => sum + a.points,
            0
        );
        const earnedPoints = Object.values(this.unlockedAchievements).reduce(
            (sum, u) => sum + u.achievement.points,
            0
        );

        return {
            total,
            unlocked,
            locked: total - unlocked,
            percentComplete: ((unlocked / total) * 100).toFixed(1),
            totalPoints,
            earnedPoints,
            pointsRemaining: totalPoints - earnedPoints,
        };
    }

    /**
     * Register achievement listener
     */
    onAchievementUnlocked(callback) {
        this.listeners.push(callback);
    }

    /**
     * Notify listeners of new achievement
     */
    notifyUnlock(achievement) {
        this.listeners.forEach(callback => {
            try {
                callback(achievement);
            } catch (error) {
                console.error('Achievement listener error:', error);
            }
        });
    }

    /**
     * Reset all achievements (for testing)
     */
    resetAchievements() {
        this.unlockedAchievements = {};
        this.saveUnlocked();
        console.info('✅ Achievements reset');
    }
}

// Export for ES modules
export default AchievementSystem;
