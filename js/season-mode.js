/**
 * Season Mode Manager
 * Handles 10-game season with standings and playoffs
 */

class SeasonMode {
    constructor() {
        this.games = 10;
        this.currentGame = 0;
        this.playerTeam = null;
        this.schedule = [];
        this.standings = [];
        this.seasonStats = {
            wins: 0,
            losses: 0,
            runsScored: 0,
            runsAllowed: 0,
            homeRuns: 0,
            strikeouts: 0
        };
        this.init();
    }

    async init() {
        const savedSeason = this.loadSeason();
        if (savedSeason) {
            Object.assign(this, savedSeason);
        }
    }

    startNewSeason(playerTeam, selectedCharacters) {
        this.playerTeam = playerTeam;
        this.currentGame = 0;
        this.seasonStats = {
            wins: 0,
            losses: 0,
            runsScored: 0,
            runsAllowed: 0,
            homeRuns: 0,
            strikeouts: 0
        };

        // Generate schedule
        this.generateSchedule(playerTeam);

        // Save season
        this.saveSeason();

        return this.schedule[0];
    }

    generateSchedule(playerTeam) {
        const teams = ['Sandlot Sluggers', 'Backyard Bombers', 'Diamond Dogs',
                      'Neighborhood Legends', 'Rebel Runners', 'Thunder Strikers'];

        const opponents = teams.filter(t => t !== playerTeam.name);

        this.schedule = [];
        for (let i = 0; i < this.games; i++) {
            const opponent = opponents[i % opponents.length];
            const isHome = i % 2 === 0;

            this.schedule.push({
                gameNumber: i + 1,
                opponent: opponent,
                isHome: isHome,
                result: null,
                playerScore: null,
                opponentScore: null,
                date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toLocaleDateString()
            });
        }
    }

    recordGameResult(gameNumber, playerScore, opponentScore) {
        const game = this.schedule[gameNumber - 1];
        const won = playerScore > opponentScore;

        game.result = won ? 'W' : 'L';
        game.playerScore = playerScore;
        game.opponentScore = opponentScore;

        if (won) {
            this.seasonStats.wins++;
        } else {
            this.seasonStats.losses++;
        }

        this.seasonStats.runsScored += playerScore;
        this.seasonStats.runsAllowed += opponentScore;

        this.currentGame = gameNumber;
        this.saveSeason();
    }

    getNextGame() {
        if (this.currentGame >= this.games) {
            return null; // Season over
        }
        return this.schedule[this.currentGame];
    }

    isSeasonComplete() {
        return this.currentGame >= this.games;
    }

    getStandings() {
        return {
            wins: this.seasonStats.wins,
            losses: this.seasonStats.losses,
            winPercentage: (this.seasonStats.wins / Math.max(this.currentGame, 1)).toFixed(3),
            runsPerGame: (this.seasonStats.runsScored / Math.max(this.currentGame, 1)).toFixed(1),
            runsAllowedPerGame: (this.seasonStats.runsAllowed / Math.max(this.currentGame, 1)).toFixed(1)
        };
    }

    saveSeason() {
        localStorage.setItem('currentSeason', JSON.stringify({
            playerTeam: this.playerTeam,
            currentGame: this.currentGame,
            schedule: this.schedule,
            seasonStats: this.seasonStats
        }));
    }

    loadSeason() {
        const saved = localStorage.getItem('currentSeason');
        return saved ? JSON.parse(saved) : null;
    }

    deleteSeason() {
        localStorage.removeItem('currentSeason');
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SeasonMode;
}
