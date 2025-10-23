/**
 * Season Manager
 * Handles season mode, tournaments, standings, and playoffs
 */

class SeasonManager {
    constructor(teams, options = {}) {
        this.teams = teams;
        this.season Length = options.seasonLength || 10;
        this.playoffTeams = options.playoffTeams || 4;
        this.currentSeason = null;
        this.savedSeasons = this.loadSeasons();
    }

    /**
     * Start new season
     */
    startNewSeason(playerTeam) {
        this.currentSeason = {
            id: `season_${Date.now()}`,
            startDate: Date.now(),
            playerTeam: playerTeam,
            teams: this.teams.map(team => ({
                ...team,
                wins: 0,
                losses: 0,
                runsScored: 0,
                runsAllowed: 0,
                streak: 0,
            })),
            schedule: this.generateSchedule(),
            gamesPlayed: 0,
            currentGameIndex: 0,
            standings: [],
            playoffBracket: null,
            champion: null,
        };

        this.updateStandings();
        this.saveSeason();
        return this.currentSeason;
    }

    /**
     * Generate season schedule
     */
    generateSchedule() {
        const schedule = [];
        const playerTeam = this.currentSeason.playerTeam;

        // Player plays each team multiple times
        const gamesPerOpponent = Math.floor(this.seasonLength / (this.teams.length - 1));

        this.teams.forEach(opponent => {
            if (opponent.id === playerTeam.id) {
                return;
            }

            for (let i = 0; i < gamesPerOpponent; i++) {
                schedule.push({
                    gameNumber: schedule.length + 1,
                    homeTeam: i % 2 === 0 ? playerTeam : opponent,
                    awayTeam: i % 2 === 0 ? opponent : playerTeam,
                    stadium: this.getRandomStadium(),
                    played: false,
                    result: null,
                });
            }
        });

        // Shuffle schedule
        return this.shuffleArray(schedule);
    }

    /**
     * Get next scheduled game
     */
    getNextGame() {
        if (!this.currentSeason) {
            return null;
        }

        const game = this.currentSeason.schedule[this.currentSeason.currentGameIndex];
        return game && !game.played ? game : null;
    }

    /**
     * Record game result
     */
    recordGameResult(gameResult) {
        const game = this.currentSeason.schedule[this.currentSeason.currentGameIndex];

        if (!game) {
            console.error('No game to record');
            return;
        }

        // Update game record
        game.played = true;
        game.result = gameResult;
        game.datePlayed = Date.now();

        // Update team stats
        const homeTeam = this.getTeamById(game.homeTeam.id);
        const awayTeam = this.getTeamById(game.awayTeam.id);

        homeTeam.runsScored += gameResult.homeScore;
        homeTeam.runsAllowed += gameResult.awayScore;
        awayTeam.runsScored += gameResult.awayScore;
        awayTeam.runsAllowed += gameResult.homeScore;

        if (gameResult.homeScore > gameResult.awayScore) {
            homeTeam.wins++;
            awayTeam.losses++;
            homeTeam.streak = homeTeam.streak > 0 ? homeTeam.streak + 1 : 1;
            awayTeam.streak = awayTeam.streak < 0 ? awayTeam.streak - 1 : -1;
        } else {
            awayTeam.wins++;
            homeTeam.losses++;
            awayTeam.streak = awayTeam.streak > 0 ? awayTeam.streak + 1 : 1;
            homeTeam.streak = homeTeam.streak < 0 ? homeTeam.streak - 1 : -1;
        }

        this.currentSeason.gamesPlayed++;
        this.currentSeason.currentGameIndex++;

        this.updateStandings();
        this.saveSeason();

        // Check if season is complete
        if (this.isSeasonComplete()) {
            this.endRegularSeason();
        }
    }

    /**
     * Update standings
     */
    updateStandings() {
        this.currentSeason.standings = this.currentSeason.teams
            .map(team => ({
                ...team,
                gamesPlayed: team.wins + team.losses,
                winPercentage: team.wins / (team.wins + team.losses) || 0,
                runDifferential: team.runsScored - team.runsAllowed,
            }))
            .sort((a, b) => {
                // Sort by win percentage, then run differential
                if (b.winPercentage !== a.winPercentage) {
                    return b.winPercentage - a.winPercentage;
                }
                return b.runDifferential - a.runDifferential;
            });
    }

    /**
     * Check if regular season is complete
     */
    isSeasonComplete() {
        return this.currentSeason.schedule.every(game => game.played);
    }

    /**
     * End regular season and setup playoffs
     */
    endRegularSeason() {
        console.info('🏆 Regular season complete! Setting up playoffs...');

        // Top teams make playoffs
        const playoffTeams = this.currentSeason.standings.slice(0, this.playoffTeams);

        this.currentSeason.playoffBracket = this.generatePlayoffBracket(playoffTeams);
        this.saveSeason();

        return {
            standings: this.currentSeason.standings,
            playoffTeams: playoffTeams,
        };
    }

    /**
     * Generate playoff bracket
     */
    generatePlayoffBracket(teams) {
        // Simple single-elimination bracket
        return {
            semifinals: [
                { home: teams[0], away: teams[3], winner: null, played: false },
                { home: teams[1], away: teams[2], winner: null, played: false },
            ],
            finals: { home: null, away: null, winner: null, played: false },
        };
    }

    /**
     * Get next playoff game
     */
    getNextPlayoffGame() {
        if (!this.currentSeason?.playoffBracket) {
            return null;
        }

        const bracket = this.currentSeason.playoffBracket;

        // Check semifinals
        for (const game of bracket.semifinals) {
            if (!game.played) {
                return { round: 'semifinals', game };
            }
        }

        // Check if finals are ready
        if (bracket.semifinals.every(g => g.played)) {
            if (!bracket.finals.played) {
                // Set up finals
                bracket.finals.home = bracket.semifinals[0].winner;
                bracket.finals.away = bracket.semifinals[1].winner;
                return { round: 'finals', game: bracket.finals };
            }
        }

        return null; // Playoffs complete
    }

    /**
     * Record playoff result
     */
    recordPlayoffResult(round, gameResult) {
        const bracket = this.currentSeason.playoffBracket;

        if (round === 'semifinals') {
            const game = bracket.semifinals.find(g => !g.played);
            if (game) {
                game.played = true;
                game.winner =
                    gameResult.homeScore > gameResult.awayScore ? game.home : game.away;
                game.result = gameResult;
            }
        } else if (round === 'finals') {
            bracket.finals.played = true;
            bracket.finals.winner =
                gameResult.homeScore > gameResult.awayScore
                    ? bracket.finals.home
                    : bracket.finals.away;
            bracket.finals.result = gameResult;

            // Season complete!
            this.currentSeason.champion = bracket.finals.winner;
            this.currentSeason.endDate = Date.now();
            console.info(`🏆 ${bracket.finals.winner.name} wins the championship!`);
        }

        this.saveSeason();
    }

    /**
     * Get team by ID
     */
    getTeamById(id) {
        return this.currentSeason.teams.find(t => t.id === id);
    }

    /**
     * Get random stadium
     */
    getRandomStadium() {
        const stadiums = ['sunny_park', 'sandy_shores', 'urban_lot', 'night_game', 'winter_field', 'dusty_diamond'];
        return stadiums[Math.floor(Math.random() * stadiums.length)];
    }

    /**
     * Shuffle array
     */
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * Save season
     */
    saveSeason() {
        if (!this.currentSeason) {
            return;
        }
        localStorage.setItem('sandlot_current_season', JSON.stringify(this.currentSeason));
    }

    /**
     * Load current season
     */
    loadCurrentSeason() {
        try {
            const saved = localStorage.getItem('sandlot_current_season');
            if (saved) {
                this.currentSeason = JSON.parse(saved);
                return this.currentSeason;
            }
        } catch (error) {
            console.error('Failed to load season:', error);
        }
        return null;
    }

    /**
     * Save completed seasons
     */
    loadSeasons() {
        try {
            const saved = localStorage.getItem('sandlot_completed_seasons');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Failed to load seasons:', error);
            return [];
        }
    }

    /**
     * Archive completed season
     */
    archiveSeason() {
        if (!this.currentSeason) {
            return;
        }

        this.savedSeasons.push({
            ...this.currentSeason,
            archivedAt: Date.now(),
        });

        localStorage.setItem('sandlot_completed_seasons', JSON.stringify(this.savedSeasons));
        localStorage.removeItem('sandlot_current_season');
        this.currentSeason = null;
    }

    /**
     * Get season summary
     */
    getSeasonSummary() {
        if (!this.currentSeason) {
            return null;
        }

        const playerTeam = this.getTeamById(this.currentSeason.playerTeam.id);
        const playerRank = this.currentSeason.standings.findIndex(t => t.id === playerTeam.id) + 1;

        return {
            gamesPlayed: this.currentSeason.gamesPlayed,
            gamesRemaining: this.currentSeason.schedule.length - this.currentSeason.gamesPlayed,
            playerRecord: `${playerTeam.wins}-${playerTeam.losses}`,
            playerRank: playerRank,
            winPercentage: (playerTeam.winPercentage * 100).toFixed(1) + '%',
            streak: playerTeam.streak,
            playoffsStarted: !!this.currentSeason.playoffBracket,
            champion: this.currentSeason.champion,
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SeasonManager;
}
