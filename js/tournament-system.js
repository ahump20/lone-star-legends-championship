/**
 * Tournament Bracket System
 * Handles tournament creation, progression, and custom venue selection
 */

class TournamentSystem {
    constructor() {
        this.currentTournament = null;
        this.storageKey = 'sandlot_tournaments';
        this.loadTournaments();
    }

    /**
     * Create a new tournament
     * @param {Object} config - Tournament configuration
     * @returns {Object} Tournament data
     */
    createTournament(config) {
        const {
            name = 'Championship Tournament',
            type = 'single-elimination', // 'single-elimination' or 'double-elimination'
            teams = [], // Array of team objects or character IDs
            customVenues = true, // Use custom stadiums
            difficulty = 'medium'
        } = config;

        // Validate team count (must be power of 2 for bracket)
        const validCounts = [2, 4, 8, 16, 32];
        if (!validCounts.includes(teams.length)) {
            throw new Error(`Invalid team count. Must be one of: ${validCounts.join(', ')}`);
        }

        const tournament = {
            id: `tournament_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name,
            type,
            teams: this.shuffleTeams(teams),
            customVenues,
            difficulty,
            createdAt: Date.now(),
            status: 'active', // 'active', 'completed', 'abandoned'
            currentRound: 0,
            rounds: this.generateBracket(teams.length, type),
            venues: customVenues ? this.assignVenues(teams.length, type) : {},
            winner: null,
            history: [] // Game results
        };

        this.currentTournament = tournament;
        this.saveTournaments();
        return tournament;
    }

    /**
     * Generate tournament bracket structure
     * @param {number} teamCount - Number of teams
     * @param {string} type - Tournament type
     * @returns {Array} Rounds array
     */
    generateBracket(teamCount, type) {
        const rounds = [];
        const roundCount = Math.log2(teamCount);

        if (type === 'single-elimination') {
            for (let r = 0; r < roundCount; r++) {
                const matchCount = teamCount / Math.pow(2, r + 1);
                const roundName = this.getRoundName(r, roundCount);

                rounds.push({
                    roundNumber: r,
                    name: roundName,
                    matchCount,
                    matches: this.createMatches(matchCount, r),
                    completed: false
                });
            }
        } else if (type === 'double-elimination') {
            // Winner's bracket
            for (let r = 0; r < roundCount; r++) {
                const matchCount = teamCount / Math.pow(2, r + 1);
                rounds.push({
                    roundNumber: r,
                    name: `Winner's ${this.getRoundName(r, roundCount)}`,
                    bracket: 'winners',
                    matchCount,
                    matches: this.createMatches(matchCount, r),
                    completed: false
                });
            }

            // Loser's bracket
            for (let r = 0; r < roundCount * 2 - 1; r++) {
                rounds.push({
                    roundNumber: r,
                    name: `Loser's Round ${r + 1}`,
                    bracket: 'losers',
                    matchCount: Math.ceil(teamCount / Math.pow(2, r + 2)),
                    matches: this.createMatches(Math.ceil(teamCount / Math.pow(2, r + 2)), r),
                    completed: false
                });
            }

            // Grand Finals
            rounds.push({
                roundNumber: rounds.length,
                name: 'Grand Finals',
                bracket: 'finals',
                matchCount: 1,
                matches: this.createMatches(1, rounds.length),
                completed: false
            });
        }

        return rounds;
    }

    /**
     * Create matches for a round
     * @param {number} matchCount - Number of matches
     * @param {number} roundNumber - Current round number
     * @returns {Array} Matches array
     */
    createMatches(matchCount, roundNumber) {
        const matches = [];

        for (let m = 0; m < matchCount; m++) {
            matches.push({
                matchId: `R${roundNumber}_M${m}`,
                team1: null, // Will be populated when bracket is filled
                team2: null,
                venue: null,
                score1: 0,
                score2: 0,
                winner: null,
                completed: false,
                gameData: null
            });
        }

        return matches;
    }

    /**
     * Get round name based on position
     * @param {number} roundIndex - Round index (0-based)
     * @param {number} totalRounds - Total number of rounds
     * @returns {string} Round name
     */
    getRoundName(roundIndex, totalRounds) {
        const roundsFromEnd = totalRounds - roundIndex;

        switch (roundsFromEnd) {
            case 1: return 'Finals';
            case 2: return 'Semi-Finals';
            case 3: return 'Quarter-Finals';
            case 4: return 'Round of 16';
            case 5: return 'Round of 32';
            default: return `Round ${roundIndex + 1}`;
        }
    }

    /**
     * Assign venues to matches
     * @param {number} teamCount - Number of teams
     * @param {string} type - Tournament type
     * @returns {Object} Venue assignments
     */
    assignVenues(teamCount, type) {
        const venues = {};
        const stadiumSystem = window.stadiumCustomization;

        if (!stadiumSystem) {
            console.warn('Stadium customization system not available');
            return venues;
        }

        const availableStadiums = Object.values(stadiumSystem.stadiums);
        let stadiumIndex = 0;

        const roundCount = Math.log2(teamCount);

        for (let r = 0; r < roundCount; r++) {
            const matchCount = teamCount / Math.pow(2, r + 1);

            for (let m = 0; m < matchCount; m++) {
                const matchId = `R${r}_M${m}`;

                // Assign more prestigious stadiums to later rounds
                if (r >= roundCount - 2) {
                    // Finals and Semi-Finals get special venues
                    venues[matchId] = availableStadiums.find(s =>
                        s.difficulty === 'Hard' || s.specialFeatures?.length > 2
                    )?.id || 'space_station';
                } else {
                    // Earlier rounds rotate through available stadiums
                    venues[matchId] = availableStadiums[stadiumIndex % availableStadiums.length].id;
                    stadiumIndex++;
                }
            }
        }

        return venues;
    }

    /**
     * Shuffle teams for random bracket seeding
     * @param {Array} teams - Teams array
     * @returns {Array} Shuffled teams
     */
    shuffleTeams(teams) {
        const shuffled = [...teams];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * Populate initial bracket matchups
     * @param {string} tournamentId - Tournament ID
     */
    populateBracket(tournamentId) {
        const tournament = this.getTournament(tournamentId);
        if (!tournament) return;

        const firstRound = tournament.rounds[0];
        const teams = tournament.teams;

        // Fill first round matches
        for (let i = 0; i < firstRound.matches.length; i++) {
            const match = firstRound.matches[i];
            match.team1 = teams[i * 2];
            match.team2 = teams[i * 2 + 1];
            match.venue = tournament.venues[match.matchId];
        }

        this.saveTournaments();
    }

    /**
     * Record match result and advance winner
     * @param {string} tournamentId - Tournament ID
     * @param {number} roundNumber - Round number
     * @param {number} matchIndex - Match index in round
     * @param {Object} result - Match result
     */
    recordMatchResult(tournamentId, roundNumber, matchIndex, result) {
        const tournament = this.getTournament(tournamentId);
        if (!tournament) return;

        const round = tournament.rounds[roundNumber];
        const match = round.matches[matchIndex];

        // Update match data
        match.score1 = result.score1;
        match.score2 = result.score2;
        match.winner = result.winner;
        match.completed = true;
        match.gameData = result.gameData;

        // Add to history
        tournament.history.push({
            timestamp: Date.now(),
            roundNumber,
            matchIndex,
            result
        });

        // Check if round is complete
        if (round.matches.every(m => m.completed)) {
            round.completed = true;
            tournament.currentRound++;
            this.advanceWinners(tournament, roundNumber);
        }

        // Check if tournament is complete
        const finalRound = tournament.rounds[tournament.rounds.length - 1];
        if (finalRound.completed) {
            tournament.status = 'completed';
            tournament.winner = finalRound.matches[0].winner;
            this.awardTournamentPrizes(tournament);
        }

        this.saveTournaments();
    }

    /**
     * Advance winners to next round
     * @param {Object} tournament - Tournament object
     * @param {number} completedRound - Completed round number
     */
    advanceWinners(tournament, completedRound) {
        const currentRound = tournament.rounds[completedRound];
        const nextRound = tournament.rounds[completedRound + 1];

        if (!nextRound) return; // Tournament complete

        if (tournament.type === 'single-elimination') {
            // Simple advancement
            currentRound.matches.forEach((match, i) => {
                const nextMatchIndex = Math.floor(i / 2);
                const nextMatch = nextRound.matches[nextMatchIndex];

                if (i % 2 === 0) {
                    nextMatch.team1 = match.winner;
                } else {
                    nextMatch.team2 = match.winner;
                }

                nextMatch.venue = tournament.venues[nextMatch.matchId];
            });
        } else if (tournament.type === 'double-elimination') {
            // Complex double-elimination logic
            this.advanceDoubleElimination(tournament, completedRound);
        }
    }

    /**
     * Handle double elimination bracket advancement
     * @param {Object} tournament - Tournament object
     * @param {number} completedRound - Completed round number
     */
    advanceDoubleElimination(tournament, completedRound) {
        const currentRound = tournament.rounds[completedRound];

        currentRound.matches.forEach((match, i) => {
            const winner = match.winner;
            const loser = match.team1 === winner ? match.team2 : match.team1;

            if (currentRound.bracket === 'winners') {
                // Winner advances in winner's bracket
                const nextWinnerRound = tournament.rounds.find(r =>
                    r.bracket === 'winners' && r.roundNumber === completedRound + 1
                );
                if (nextWinnerRound) {
                    const nextMatchIndex = Math.floor(i / 2);
                    const nextMatch = nextWinnerRound.matches[nextMatchIndex];
                    if (i % 2 === 0) {
                        nextMatch.team1 = winner;
                    } else {
                        nextMatch.team2 = winner;
                    }
                }

                // Loser drops to loser's bracket
                const loserRound = tournament.rounds.find(r =>
                    r.bracket === 'losers' && r.roundNumber === completedRound
                );
                if (loserRound && loser) {
                    // Find appropriate match in loser's bracket
                    const loserMatch = loserRound.matches.find(m => !m.team1 || !m.team2);
                    if (loserMatch) {
                        if (!loserMatch.team1) loserMatch.team1 = loser;
                        else if (!loserMatch.team2) loserMatch.team2 = loser;
                    }
                }
            } else if (currentRound.bracket === 'losers') {
                // Winner stays in loser's bracket
                const nextLoserRound = tournament.rounds.find(r =>
                    r.bracket === 'losers' && r.roundNumber === completedRound + 1
                );
                if (nextLoserRound) {
                    const nextMatchIndex = Math.floor(i / 2);
                    const nextMatch = nextLoserRound.matches[nextMatchIndex];
                    if (i % 2 === 0) {
                        nextMatch.team1 = winner;
                    } else {
                        nextMatch.team2 = winner;
                    }
                }
                // Loser is eliminated
            }
        });
    }

    /**
     * Award prizes for tournament completion
     * @param {Object} tournament - Completed tournament
     */
    awardTournamentPrizes(tournament) {
        const winner = tournament.winner;

        // Award XP to winner
        if (window.characterLeveling && winner) {
            const xpReward = tournament.teams.length * 100; // More teams = more XP
            window.characterLeveling.addXP(winner.id || winner, xpReward, 'Tournament Victory');
        }

        // Unlock achievement
        if (window.saveSystem) {
            window.saveSystem.unlockAchievement(`tournament_${tournament.type}_${tournament.teams.length}`);
        }

        // Display celebration
        console.log(`🏆 Tournament Winner: ${winner.name || winner}!`);
    }

    /**
     * Get tournament by ID
     * @param {string} tournamentId - Tournament ID
     * @returns {Object|null} Tournament object
     */
    getTournament(tournamentId) {
        if (this.currentTournament?.id === tournamentId) {
            return this.currentTournament;
        }

        const saved = this.loadTournaments();
        return saved.find(t => t.id === tournamentId) || null;
    }

    /**
     * Get current active tournament
     * @returns {Object|null} Current tournament
     */
    getCurrentTournament() {
        return this.currentTournament;
    }

    /**
     * Get all tournaments
     * @returns {Array} All tournaments
     */
    getAllTournaments() {
        return this.loadTournaments();
    }

    /**
     * Delete tournament
     * @param {string} tournamentId - Tournament ID
     */
    deleteTournament(tournamentId) {
        const tournaments = this.loadTournaments();
        const filtered = tournaments.filter(t => t.id !== tournamentId);
        localStorage.setItem(this.storageKey, JSON.stringify(filtered));

        if (this.currentTournament?.id === tournamentId) {
            this.currentTournament = null;
        }
    }

    /**
     * Save tournaments to localStorage
     */
    saveTournaments() {
        const tournaments = this.loadTournaments();
        const index = tournaments.findIndex(t => t.id === this.currentTournament?.id);

        if (index >= 0) {
            tournaments[index] = this.currentTournament;
        } else if (this.currentTournament) {
            tournaments.push(this.currentTournament);
        }

        localStorage.setItem(this.storageKey, JSON.stringify(tournaments));
    }

    /**
     * Load tournaments from localStorage
     * @returns {Array} Tournaments array
     */
    loadTournaments() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error loading tournaments:', error);
            return [];
        }
    }

    /**
     * Generate bracket visualization HTML
     * @param {string} tournamentId - Tournament ID
     * @returns {string} HTML string
     */
    generateBracketHTML(tournamentId) {
        const tournament = this.getTournament(tournamentId);
        if (!tournament) return '<p>Tournament not found</p>';

        let html = `<div class="tournament-bracket">`;
        html += `<h2>${tournament.name}</h2>`;
        html += `<div class="tournament-info">`;
        html += `<span>Type: ${tournament.type}</span>`;
        html += `<span>Teams: ${tournament.teams.length}</span>`;
        html += `<span>Status: ${tournament.status}</span>`;
        html += `</div>`;

        // Generate rounds
        tournament.rounds.forEach((round, rIndex) => {
            if (tournament.type === 'double-elimination' && round.bracket === 'losers') {
                return; // Skip loser's bracket for now (complex visualization)
            }

            html += `<div class="bracket-round" data-round="${rIndex}">`;
            html += `<h3>${round.name}</h3>`;

            round.matches.forEach((match, mIndex) => {
                const team1Name = match.team1?.name || match.team1 || 'TBD';
                const team2Name = match.team2?.name || match.team2 || 'TBD';
                const venue = match.venue || 'TBD';

                html += `<div class="bracket-match ${match.completed ? 'completed' : ''}" data-match="${mIndex}">`;
                html += `<div class="match-header">`;
                html += `<span class="match-id">${match.matchId}</span>`;
                html += `<span class="match-venue">📍 ${venue}</span>`;
                html += `</div>`;

                html += `<div class="match-team ${match.winner === match.team1 ? 'winner' : ''}">`;
                html += `<span class="team-name">${team1Name}</span>`;
                html += `<span class="team-score">${match.score1}</span>`;
                html += `</div>`;

                html += `<div class="match-team ${match.winner === match.team2 ? 'winner' : ''}">`;
                html += `<span class="team-name">${team2Name}</span>`;
                html += `<span class="team-score">${match.score2}</span>`;
                html += `</div>`;

                if (!match.completed && match.team1 && match.team2) {
                    html += `<button class="play-match-btn" onclick="playTournamentMatch('${tournamentId}', ${rIndex}, ${mIndex})">Play Match</button>`;
                }

                html += `</div>`; // match
            });

            html += `</div>`; // round
        });

        if (tournament.status === 'completed' && tournament.winner) {
            html += `<div class="tournament-winner">`;
            html += `<h2>🏆 Champion: ${tournament.winner.name || tournament.winner}</h2>`;
            html += `</div>`;
        }

        html += `</div>`; // bracket

        return html;
    }
}

// Global initialization
if (typeof window !== 'undefined') {
    window.tournamentSystem = new TournamentSystem();

    // Helper function for playing tournament matches
    window.playTournamentMatch = function(tournamentId, roundNumber, matchIndex) {
        const tournament = window.tournamentSystem.getTournament(tournamentId);
        if (!tournament) return;

        const match = tournament.rounds[roundNumber].matches[matchIndex];

        // Store match info for game to use
        sessionStorage.setItem('tournamentMatch', JSON.stringify({
            tournamentId,
            roundNumber,
            matchIndex,
            team1: match.team1,
            team2: match.team2,
            venue: match.venue
        }));

        // Navigate to game
        window.location.href = '/games/baseball/index.html';
    };
}
