/**
 * Game Mode Screens
 * UI for Home Run Derby, Season, Practice, Tournament modes
 */

/**
 * Home Run Derby Screen
 */
class DerbyScreen extends BaseScreen {
    create() {
        const screen = document.createElement('div');
        screen.className = 'screen derby-screen';
        screen.id = 'derby-screen';

        screen.innerHTML = `
            <div class="game-hud">
                <div class="hud-top">
                    <div class="derby-stats">
                        <div class="stat-box">
                            <div class="stat-label">TIME</div>
                            <div class="stat-value" id="derby-time">3:00</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-label">OUTS</div>
                            <div class="stat-value" id="derby-outs">0/10</div>
                        </div>
                        <div class="stat-box highlight">
                            <div class="stat-label">HOME RUNS</div>
                            <div class="stat-value" id="derby-hrs">0</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-label">SCORE</div>
                            <div class="stat-value" id="derby-score">0</div>
                        </div>
                    </div>

                    <div class="combo-display" id="combo-display" style="display: none;">
                        <div class="combo-text">COMBO!</div>
                        <div class="combo-count" id="combo-count">0x</div>
                    </div>
                </div>

                <div class="hud-bottom">
                    <button class="hud-btn" id="derby-pause">⏸ Pause</button>
                    <button class="hud-btn" id="derby-quit">❌ Quit</button>
                </div>
            </div>

            <!-- Results Modal (hidden initially) -->
            <div class="derby-results" id="derby-results" style="display: none;">
                <div class="results-panel">
                    <h2>🏆 Derby Complete!</h2>
                    <div class="final-stats">
                        <div class="final-stat">
                            <span class="final-label">Home Runs:</span>
                            <span class="final-value" id="final-hrs">0</span>
                        </div>
                        <div class="final-stat">
                            <span class="final-label">Final Score:</span>
                            <span class="final-value" id="final-score">0</span>
                        </div>
                    </div>

                    <div class="leaderboard" id="derby-leaderboard">
                        <h3>🏅 Leaderboard</h3>
                        <div class="leaderboard-list" id="leaderboard-list"></div>
                    </div>

                    <div class="results-actions">
                        <button class="btn btn-primary" id="play-again">Play Again</button>
                        <button class="btn btn-secondary" id="back-to-menu">Main Menu</button>
                    </div>
                </div>
            </div>
        `;

        this.addEventListeners(screen);
        return screen;
    }

    addEventListeners(screen) {
        screen.querySelector('#derby-pause').addEventListener('click', () => this.pauseDerby());
        screen.querySelector('#derby-quit').addEventListener('click', () => this.quitDerby());
        screen.querySelector('#play-again').addEventListener('click', () => this.playAgain());
        screen.querySelector('#back-to-menu').addEventListener('click', () => {
            this.uiManager.showScreen('main-menu');
        });
    }

    onShow(options = {}) {
        this.derbyActive = true;
        this.startDerby(options);
    }

    startDerby(options) {
        // Initialize derby mode
        if (window.gameModesManager) {
            this.derby = window.gameModesManager.startHomeRunDerby(
                options.player,
                options.stadium
            );
            this.startTimer();
        }
    }

    startTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        this.timerInterval = setInterval(() => {
            if (!this.derby || !this.derby.active) {
                this.stopTimer();
                return;
            }

            // Update timer
            const derby = window.gameModesManager.updateHomeRunDerbyTimer(1);
            const timeEl = document.getElementById('derby-time');
            if (timeEl) {
                const minutes = Math.floor(derby.timeRemaining / 60);
                const seconds = Math.floor(derby.timeRemaining % 60);
                timeEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }

            // Check if time's up
            if (derby.timeRemaining <= 0 || !derby.active) {
                this.endDerby();
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateStats() {
        if (!this.derby) return;

        document.getElementById('derby-outs').textContent = `${this.derby.outs}/${this.derby.maxOuts}`;
        document.getElementById('derby-hrs').textContent = this.derby.homeRuns;
        document.getElementById('derby-score').textContent = this.derby.score;

        // Show combo if applicable
        if (this.derby.homeRuns > 0 && this.derby.homeRuns % 3 === 0) {
            this.showCombo(Math.floor(this.derby.homeRuns / 3));
        }
    }

    showCombo(multiplier) {
        const comboEl = document.getElementById('combo-display');
        const countEl = document.getElementById('combo-count');

        if (comboEl && countEl) {
            countEl.textContent = `${multiplier}x`;
            comboEl.style.display = 'block';

            setTimeout(() => {
                comboEl.style.display = 'none';
            }, 2000);
        }
    }

    pauseDerby() {
        this.stopTimer();
        this.uiManager.showModal({
            title: '⏸ Paused',
            content: 'Derby paused. Ready to continue?',
            buttons: [
                {
                    text: 'Resume',
                    class: 'btn-primary',
                    onClick: () => {
                        this.startTimer();
                    }
                },
                {
                    text: 'Quit',
                    class: 'btn-secondary',
                    onClick: () => {
                        this.quitDerby();
                    }
                }
            ]
        });
    }

    async quitDerby() {
        this.stopTimer();
        const confirmed = await this.uiManager.confirm(
            'Are you sure you want to quit? Your progress will be lost.',
            { title: 'Quit Derby' }
        );

        if (confirmed) {
            this.uiManager.showScreen('main-menu');
        } else {
            this.startTimer();
        }
    }

    endDerby() {
        this.stopTimer();
        this.derbyActive = false;

        const results = window.gameModesManager.endHomeRunDerby();

        // Show results
        document.getElementById('final-hrs').textContent = results.homeRuns;
        document.getElementById('final-score').textContent = results.score;

        // Load and display leaderboard
        this.displayLeaderboard();

        // Show results panel
        document.getElementById('derby-results').style.display = 'flex';
    }

    displayLeaderboard() {
        const leaderboard = window.gameModesManager.getHomeRunDerbyLeaderboard();
        const listEl = document.getElementById('leaderboard-list');

        if (!listEl) return;

        listEl.innerHTML = '';

        leaderboard.forEach((entry, index) => {
            const item = document.createElement('div');
            item.className = 'leaderboard-item';
            item.innerHTML = `
                <span class="rank">#${index + 1}</span>
                <span class="player">${entry.player}</span>
                <span class="score">${entry.score} pts (${entry.homeRuns} HRs)</span>
            `;
            listEl.appendChild(item);
        });

        if (leaderboard.length === 0) {
            listEl.innerHTML = '<div class="no-entries">No entries yet. Be the first!</div>';
        }
    }

    playAgain() {
        document.getElementById('derby-results').style.display = 'none';
        this.startDerby({ player: this.derby.player, stadium: this.derby.stadium });
    }
}

/**
 * Season Dashboard Screen
 */
class SeasonDashboardScreen extends BaseScreen {
    create() {
        const screen = document.createElement('div');
        screen.className = 'screen season-screen';
        screen.id = 'season-screen';

        screen.innerHTML = `
            <div class="screen-header">
                <button class="back-btn" data-action="back">← Back</button>
                <h2>🏆 Season Mode</h2>
                <div class="season-progress" id="season-progress"></div>
            </div>

            <div class="season-container">
                <div class="season-main">
                    <div class="standings-panel">
                        <h3>📊 Standings</h3>
                        <div class="standings-table" id="standings-table"></div>
                    </div>

                    <div class="schedule-panel">
                        <h3>📅 Schedule</h3>
                        <div class="next-game" id="next-game"></div>
                        <div class="upcoming-games" id="upcoming-games"></div>
                    </div>
                </div>

                <div class="season-sidebar">
                    <div class="team-card" id="player-team-card"></div>

                    <div class="action-panel">
                        <button class="btn btn-primary btn-large" id="play-next-game" disabled>
                            ⚾ Play Next Game
                        </button>
                        <button class="btn btn-secondary" id="simulate-game">
                            ⏩ Simulate Game
                        </button>
                    </div>

                    <div class="playoff-bracket" id="playoff-bracket" style="display: none;">
                        <h3>🏆 Playoffs</h3>
                        <div id="bracket-display"></div>
                    </div>
                </div>
            </div>
        `;

        this.addEventListeners(screen);
        return screen;
    }

    addEventListeners(screen) {
        screen.querySelector('[data-action="back"]').addEventListener('click', () => {
            this.uiManager.showScreen('main-menu');
        });

        screen.querySelector('#play-next-game').addEventListener('click', () => {
            this.playNextGame();
        });

        screen.querySelector('#simulate-game').addEventListener('click', () => {
            this.simulateGame();
        });
    }

    onShow() {
        this.loadSeason();
    }

    loadSeason() {
        if (!window.seasonManager) return;

        const season = window.seasonManager.loadCurrentSeason() || window.seasonManager.currentSeason;

        if (!season) {
            // No season - show setup
            this.uiManager.showScreen('season-setup');
            return;
        }

        // Update progress
        const summary = window.seasonManager.getSeasonSummary();
        document.getElementById('season-progress').textContent =
            `Game ${summary.gamesPlayed}/${summary.gamesPlayed + summary.gamesRemaining} • Record: ${summary.playerRecord}`;

        // Render standings
        this.renderStandings(season.standings);

        // Render schedule
        this.renderSchedule(season);

        // Render player team
        this.renderPlayerTeam(season);

        // Check for playoffs
        if (summary.playoffsStarted) {
            this.renderPlayoffs(season);
        }
    }

    renderStandings(standings) {
        const table = document.getElementById('standings-table');
        if (!table) return;

        table.innerHTML = `
            <div class="standings-header">
                <span>Rank</span>
                <span>Team</span>
                <span>W-L</span>
                <span>Win%</span>
                <span>Diff</span>
            </div>
        `;

        standings.forEach((team, index) => {
            const row = document.createElement('div');
            row.className = `standings-row ${team.id === window.seasonManager.currentSeason.playerTeam.id ? 'player-team' : ''}`;
            row.innerHTML = `
                <span class="rank">${index + 1}</span>
                <span class="team">${team.name}</span>
                <span class="record">${team.wins}-${team.losses}</span>
                <span class="pct">${team.winPercentage.toFixed(3)}</span>
                <span class="diff ${team.runDifferential >= 0 ? 'positive' : 'negative'}">
                    ${team.runDifferential >= 0 ? '+' : ''}${team.runDifferential}
                </span>
            `;
            table.appendChild(row);
        });
    }

    renderSchedule(season) {
        const nextGame = window.seasonManager.getNextGame();

        if (nextGame) {
            const nextGameEl = document.getElementById('next-game');
            if (nextGameEl) {
                nextGameEl.innerHTML = `
                    <div class="game-card next">
                        <div class="game-label">Next Game #${nextGame.gameNumber}</div>
                        <div class="game-matchup">
                            <span>${nextGame.homeTeam.name}</span>
                            <span class="vs">vs</span>
                            <span>${nextGame.awayTeam.name}</span>
                        </div>
                        <div class="game-stadium">@ ${nextGame.stadium}</div>
                    </div>
                `;
            }

            // Enable play button
            document.getElementById('play-next-game').disabled = false;
        } else {
            document.getElementById('next-game').innerHTML =
                '<div class="no-games">Regular season complete!</div>';
            document.getElementById('play-next-game').disabled = true;
        }

        // Show upcoming games
        this.renderUpcomingGames(season);
    }

    renderUpcomingGames(season) {
        const upcomingEl = document.getElementById('upcoming-games');
        if (!upcomingEl) return;

        const upcoming = season.schedule
            .filter(g => !g.played)
            .slice(1, 4); // Next 3 games after current

        upcomingEl.innerHTML = '<h4>Upcoming</h4>';

        upcoming.forEach(game => {
            const card = document.createElement('div');
            card.className = 'game-card';
            card.innerHTML = `
                <div class="game-mini">
                    Game ${game.gameNumber}: ${game.homeTeam.name} vs ${game.awayTeam.name}
                </div>
            `;
            upcomingEl.appendChild(card);
        });
    }

    renderPlayerTeam(season) {
        const cardEl = document.getElementById('player-team-card');
        if (!cardEl) return;

        const playerTeam = season.teams.find(t => t.id === season.playerTeam.id);

        cardEl.innerHTML = `
            <h3>${playerTeam.name}</h3>
            <div class="team-stats">
                <div class="team-stat">
                    <div class="stat-label">Record</div>
                    <div class="stat-value">${playerTeam.wins}-${playerTeam.losses}</div>
                </div>
                <div class="team-stat">
                    <div class="stat-label">Streak</div>
                    <div class="stat-value ${playerTeam.streak > 0 ? 'positive' : 'negative'}">
                        ${playerTeam.streak > 0 ? 'W' : 'L'}${Math.abs(playerTeam.streak)}
                    </div>
                </div>
                <div class="team-stat">
                    <div class="stat-label">Runs For</div>
                    <div class="stat-value">${playerTeam.runsScored}</div>
                </div>
                <div class="team-stat">
                    <div class="stat-label">Runs Against</div>
                    <div class="stat-value">${playerTeam.runsAllowed}</div>
                </div>
            </div>
        `;
    }

    renderPlayoffs(season) {
        const playoffEl = document.getElementById('playoff-bracket');
        if (!playoffEl || !season.playoffBracket) return;

        playoffEl.style.display = 'block';

        const bracketEl = document.getElementById('bracket-display');
        // Render playoff bracket (simplified)
        bracketEl.innerHTML = '<div class="bracket-placeholder">Playoff bracket coming soon!</div>';
    }

    playNextGame() {
        // Transition to game
        this.uiManager.showLoading('Starting game...');

        setTimeout(() => {
            // This would launch the actual game
            // For now, simulate
            this.simulateGame();
            this.uiManager.hideLoading();
        }, 1000);
    }

    simulateGame() {
        const nextGame = window.seasonManager.getNextGame();
        if (!nextGame) return;

        // Simulate result
        const homeScore = Math.floor(Math.random() * 8) + 1;
        const awayScore = Math.floor(Math.random() * 8) + 1;

        window.seasonManager.recordGameResult({
            homeScore,
            awayScore,
        });

        this.uiManager.showSuccess(`Game simulated: ${homeScore}-${awayScore}`);
        this.loadSeason();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        DerbyScreen,
        SeasonDashboardScreen
    };
}
