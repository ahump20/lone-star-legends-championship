/**
 * Game Modes Hub
 * Handles different game modes: Quick Play, Season, Home Run Derby, etc.
 */

class GameModesManager {
    constructor() {
        this.modes = this.initializeGameModes();
        this.currentMode = null;
    }

    initializeGameModes() {
        return {
            quickplay: {
                id: 'quickplay',
                name: 'Quick Play',
                description: 'Play a single game against the CPU',
                icon: '⚾',
                config: {
                    innings: 9,
                    difficulty: 'medium',
                    teamSelection: true,
                    stadiumSelection: true,
                },
            },
            season: {
                id: 'season',
                name: 'Season Mode',
                description: 'Play through a full season with playoffs',
                icon: '🏆',
                config: {
                    seasonLength: 10,
                    playoffs: true,
                    standings: true,
                },
            },
            homerun_derby: {
                id: 'homerun_derby',
                name: 'Home Run Derby',
                description: 'Hit as many home runs as you can!',
                icon: '🚀',
                config: {
                    outs: 10,
                    timeLimit: 180, // 3 minutes
                    scoringOnly: true,
                },
            },
            batting_practice: {
                id: 'batting_practice',
                name: 'Batting Practice',
                description: 'Practice your hitting with unlimited pitches',
                icon: '🎯',
                config: {
                    unlimitedPitches: true,
                    noOuts: true,
                    statsTracking: true,
                },
            },
            tournament: {
                id: 'tournament',
                name: 'Tournament',
                description: 'Single elimination tournament bracket',
                icon: '🥇',
                config: {
                    teams: 8,
                    bracket: 'single_elimination',
                    bestOf: 1,
                },
            },
            challenge: {
                id: 'challenge',
                name: 'Daily Challenge',
                description: 'Complete daily challenges for rewards',
                icon: '⭐',
                config: {
                    daily: true,
                    rewards: true,
                    leaderboard: true,
                },
            },
        };
    }

    /**
     * Home Run Derby Mode
     */
    startHomeRunDerby(player, stadium) {
        const mode = {
            type: 'homerun_derby',
            player: player,
            stadium: stadium,
            homeRuns: 0,
            outs: 0,
            maxOuts: 10,
            timeRemaining: 180,
            score: 0,
            active: true,
        };

        this.currentMode = mode;
        return mode;
    }

    /**
     * Process Home Run Derby hit
     */
    processHomeRunDerbyHit(result) {
        if (!this.currentMode || this.currentMode.type !== 'homerun_derby') {
            return;
        }

        if (result === 'home_run') {
            this.currentMode.homeRuns++;
            this.currentMode.score += 1;

            // Bonus points for consecutive home runs
            if (this.currentMode.homeRuns > 5) {
                this.currentMode.score += Math.floor(this.currentMode.homeRuns / 5);
            }
        } else if (result === 'out') {
            this.currentMode.outs++;

            if (this.currentMode.outs >= this.currentMode.maxOuts) {
                this.endHomeRunDerby();
            }
        }

        return this.currentMode;
    }

    /**
     * Update Home Run Derby timer
     */
    updateHomeRunDerbyTimer(deltaSeconds) {
        if (!this.currentMode || this.currentMode.type !== 'homerun_derby') {
            return;
        }

        this.currentMode.timeRemaining -= deltaSeconds;

        if (this.currentMode.timeRemaining <= 0) {
            this.endHomeRunDerby();
        }

        return this.currentMode;
    }

    /**
     * End Home Run Derby
     */
    endHomeRunDerby() {
        if (!this.currentMode) {
            return null;
        }

        this.currentMode.active = false;

        const results = {
            homeRuns: this.currentMode.homeRuns,
            score: this.currentMode.score,
            player: this.currentMode.player.name,
        };

        this.saveHomeRunDerbyScore(results);
        return results;
    }

    /**
     * Save Home Run Derby score
     */
    saveHomeRunDerbyScore(results) {
        try {
            const scores = JSON.parse(localStorage.getItem('sandlot_derby_scores') || '[]');
            scores.push({
                ...results,
                date: Date.now(),
            });

            // Keep only top 10 scores
            scores.sort((a, b) => b.score - a.score);
            if (scores.length > 10) {
                scores.length = 10;
            }

            localStorage.setItem('sandlot_derby_scores', JSON.stringify(scores));
        } catch (error) {
            console.error('Failed to save derby score:', error);
        }
    }

    /**
     * Get Home Run Derby leaderboard
     */
    getHomeRunDerbyLeaderboard() {
        try {
            return JSON.parse(localStorage.getItem('sandlot_derby_scores') || '[]');
        } catch (error) {
            console.error('Failed to load derby scores:', error);
            return [];
        }
    }

    /**
     * Start Batting Practice
     */
    startBattingPractice(player, stadium) {
        const mode = {
            type: 'batting_practice',
            player: player,
            stadium: stadium,
            pitchesFaced: 0,
            hits: 0,
            misses: 0,
            homeRuns: 0,
            battingAverage: 0,
            active: true,
        };

        this.currentMode = mode;
        return mode;
    }

    /**
     * Process Batting Practice result
     */
    processBattingPracticeResult(result) {
        if (!this.currentMode || this.currentMode.type !== 'batting_practice') {
            return;
        }

        this.currentMode.pitchesFaced++;

        if (['single', 'double', 'triple', 'home_run'].includes(result)) {
            this.currentMode.hits++;

            if (result === 'home_run') {
                this.currentMode.homeRuns++;
            }
        } else if (['strike_swinging', 'strike_looking', 'out'].includes(result)) {
            this.currentMode.misses++;
        }

        this.currentMode.battingAverage = this.currentMode.hits / this.currentMode.pitchesFaced;
        return this.currentMode;
    }

    /**
     * End Batting Practice
     */
    endBattingPractice() {
        if (!this.currentMode) {
            return null;
        }

        this.currentMode.active = false;

        return {
            pitchesFaced: this.currentMode.pitchesFaced,
            hits: this.currentMode.hits,
            misses: this.currentMode.misses,
            homeRuns: this.currentMode.homeRuns,
            battingAverage: this.currentMode.battingAverage.toFixed(3),
        };
    }

    /**
     * Start Tournament
     */
    startTournament(teams) {
        // Create single-elimination bracket
        const bracket = this.generateTournamentBracket(teams);

        const mode = {
            type: 'tournament',
            teams: teams,
            bracket: bracket,
            currentRound: 0,
            currentGame: 0,
            champion: null,
            active: true,
        };

        this.currentMode = mode;
        return mode;
    }

    /**
     * Generate tournament bracket
     */
    generateTournamentBracket(teams) {
        const rounds = Math.ceil(Math.log2(teams.length));
        const bracket = [];

        // First round
        const firstRound = [];
        for (let i = 0; i < teams.length; i += 2) {
            firstRound.push({
                team1: teams[i],
                team2: teams[i + 1] || null,
                winner: null,
                played: false,
            });
        }

        bracket.push(firstRound);

        // Create empty subsequent rounds
        for (let r = 1; r < rounds; r++) {
            const roundGames = Math.ceil(bracket[r - 1].length / 2);
            const round = [];

            for (let g = 0; g < roundGames; g++) {
                round.push({
                    team1: null,
                    team2: null,
                    winner: null,
                    played: false,
                });
            }

            bracket.push(round);
        }

        return bracket;
    }

    /**
     * Get next tournament game
     */
    getNextTournamentGame() {
        if (!this.currentMode || this.currentMode.type !== 'tournament') {
            return null;
        }

        const round = this.currentMode.bracket[this.currentMode.currentRound];
        const game = round[this.currentMode.currentGame];

        if (game && !game.played && game.team1 && game.team2) {
            return {
                round: this.currentMode.currentRound,
                game: this.currentMode.currentGame,
                ...game,
            };
        }

        return null;
    }

    /**
     * Record tournament game result
     */
    recordTournamentResult(winner) {
        if (!this.currentMode || this.currentMode.type !== 'tournament') {
            return;
        }

        const round = this.currentMode.bracket[this.currentMode.currentRound];
        const game = round[this.currentMode.currentGame];

        game.winner = winner;
        game.played = true;

        // Advance winner to next round
        const nextRound = this.currentMode.currentRound + 1;
        if (nextRound < this.currentMode.bracket.length) {
            const nextGameIndex = Math.floor(this.currentMode.currentGame / 2);
            const nextGame = this.currentMode.bracket[nextRound][nextGameIndex];

            if (this.currentMode.currentGame % 2 === 0) {
                nextGame.team1 = winner;
            } else {
                nextGame.team2 = winner;
            }
        }

        // Move to next game
        this.currentMode.currentGame++;

        if (this.currentMode.currentGame >= round.length) {
            // Round complete
            this.currentMode.currentRound++;
            this.currentMode.currentGame = 0;

            // Check if tournament is complete
            if (this.currentMode.currentRound >= this.currentMode.bracket.length) {
                this.endTournament(winner);
            }
        }
    }

    /**
     * End tournament
     */
    endTournament(champion) {
        if (!this.currentMode) {
            return;
        }

        this.currentMode.champion = champion;
        this.currentMode.active = false;

        console.info(`🏆 ${champion.name} wins the tournament!`);
        return this.currentMode;
    }

    /**
     * Get mode info
     */
    getModeInfo(modeId) {
        return this.modes[modeId];
    }

    /**
     * Get all modes
     */
    getAllModes() {
        return Object.values(this.modes);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameModesManager;
}
