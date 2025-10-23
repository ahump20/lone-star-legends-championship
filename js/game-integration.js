/**
 * Game Integration Script
 * Integrates all new systems into the baseball game
 */

class SandlotSuperstarsGame {
    constructor() {
        this.characterManager = new CharacterManager();
        this.stadiumManager = new StadiumManager();
        this.audioManager = new AudioManager();
        this.gameEngine = null;
        this.abilitiesManager = null;
        this.enhancedUI = null;
        this.characterRenderer = null;

        this.init();
    }

    async init() {
        console.log('🎮 Initializing Sandlot Superstars...');

        // Load character roster
        await this.characterManager.loadRoster();

        // Check if teams were selected
        const selectedTeamData = sessionStorage.getItem('selectedTeam');
        const playerLineup = sessionStorage.getItem('playerLineup');
        const opponentLineup = sessionStorage.getItem('opponentLineup');

        if (selectedTeamData && playerLineup && opponentLineup) {
            // Use selected teams
            this.loadSelectedTeams(
                JSON.parse(selectedTeamData),
                JSON.parse(playerLineup),
                JSON.parse(opponentLineup)
            );
        } else {
            // Use default teams
            this.loadDefaultTeams();
        }

        // Initialize stadium (random or selected)
        const stadium = this.stadiumManager.getRandomStadium();
        console.log(`🏟️ Playing at: ${stadium.name}`);

        // Initialize audio
        this.audioManager.play('whistle', 0.5);

        // Setup game UI
        this.setupGameUI();

        // Add keyboard shortcuts
        this.setupKeyboardControls();

        console.log('✅ Game initialized successfully!');
    }

    loadSelectedTeams(selectedTeam, playerLineup, opponentLineup) {
        console.log(`Selected team: ${selectedTeam.name}`);

        // Override the game engine's generateLineup to use our selected players
        if (window.BaseballGameEngine) {
            const originalGenerateLineup = BaseballGameEngine.prototype.generateLineup;

            BaseballGameEngine.prototype.generateLineup = function(teamName) {
                // Check if this is one of our custom teams
                if (teamName === selectedTeam.name) {
                    return playerLineup;
                } else {
                    return opponentLineup;
                }
            };
        }
    }

    loadDefaultTeams() {
        console.log('Loading default teams...');

        // Generate random teams from character roster
        const team1Data = this.characterManager.getTeamById('team_sandlot');
        const team2Data = this.characterManager.getTeamById('team_backyard');

        const team1Chars = this.characterManager.getRandomCharacters(9);
        const team2Chars = this.characterManager.getRandomCharacters(9, team1Chars.map(c => c.id));

        const team1Lineup = this.characterManager.createBalancedLineup(team1Chars, team1Data);
        const team2Lineup = this.characterManager.createBalancedLineup(team2Chars, team2Data);

        // Override game engine lineup generation
        if (window.BaseballGameEngine) {
            BaseballGameEngine.prototype.generateLineup = function(teamName) {
                if (teamName === team1Data.name) {
                    return team1Lineup;
                } else {
                    return team2Lineup;
                }
            };
        }
    }

    setupGameUI() {
        // Add CSS file
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = '/css/game-ui.css';
        document.head.appendChild(cssLink);

        // Wait for game engine to be initialized
        const checkEngine = setInterval(() => {
            if (window.gameEngine) {
                this.gameEngine = window.gameEngine;

                // Initialize abilities manager
                this.abilitiesManager = new SpecialAbilitiesManager(this.gameEngine);

                // Initialize enhanced UI
                this.enhancedUI = new EnhancedGameUI(
                    this.gameEngine,
                    this.abilitiesManager,
                    this.audioManager
                );

                // Hook into game engine events
                this.hookGameEngineEvents();

                clearInterval(checkEngine);
                console.log('✅ Game UI and systems hooked successfully!');
            }
        }, 100);
    }

    hookGameEngineEvents() {
        // Override the pitch method to integrate abilities
        const originalPitch = this.gameEngine.pitch.bind(this.gameEngine);

        this.gameEngine.pitch = () => {
            const result = originalPitch();

            if (result) {
                // Apply ability modifications
                const modified = this.abilitiesManager.modifyPitchOutcome(
                    result.outcome,
                    this.gameEngine.currentPitcher,
                    this.gameEngine.currentBatter
                );

                if (modified.message) {
                    this.enhancedUI.addLogEntry(modified.message, 'ability');
                }

                // Play audio for outcome
                this.playOutcomeAudio(modified.outcome);

                // Show hit indicator
                if (['single', 'double', 'triple', 'home_run', 'strikeout', 'walk'].includes(modified.outcome)) {
                    this.enhancedUI.showHitIndicator(modified.outcome);
                }

                // Get commentary
                const commentary = this.audioManager.getCommentary(modified.outcome, {
                    player: this.gameEngine.currentBatter.name
                });
                if (commentary) {
                    this.enhancedUI.addLogEntry(commentary, 'info');
                }

                // Update UI
                this.enhancedUI.updateHUD(this.gameEngine.getGameState());
            }

            return result;
        };

        // Override endHalfInning to update abilities
        const originalEndHalfInning = this.gameEngine.endHalfInning.bind(this.gameEngine);

        this.gameEngine.endHalfInning = () => {
            this.abilitiesManager.updateEndOfInning();
            originalEndHalfInning();
        };

        // Override startGame to play audio
        const originalStartGame = this.gameEngine.startGame.bind(this.gameEngine);

        this.gameEngine.startGame = () => {
            const result = originalStartGame();
            this.audioManager.announce('game_start');
            const commentary = this.audioManager.getCommentary('game_start');
            this.enhancedUI.addLogEntry(commentary, 'info');
            return result;
        };

        // Override endGame to show results
        const originalEndGame = this.gameEngine.endGame.bind(this.gameEngine);

        this.gameEngine.endGame = () => {
            originalEndGame();

            const gameState = this.gameEngine.getGameState();
            const winner = gameState.teams.away.score > gameState.teams.home.score ?
                gameState.teams.away.name : gameState.teams.home.name;

            const commentary = this.audioManager.getCommentary('game_end', {
                awayScore: gameState.teams.away.score,
                homeScore: gameState.teams.home.score,
                winner: winner
            });

            this.enhancedUI.addLogEntry(commentary, 'success');

            // Play final audio
            setTimeout(() => {
                this.audioManager.play('crowd_cheer');
            }, 500);

            // Save stats
            this.saveGameStats(gameState);
        };
    }

    playOutcomeAudio(outcome) {
        switch (outcome) {
            case 'home_run':
                this.audioManager.announce('home_run');
                break;
            case 'single':
            case 'double':
            case 'triple':
                this.audioManager.announce('hit');
                break;
            case 'swing_miss':
            case 'called_strike':
                this.audioManager.announce('strike');
                break;
            case 'strikeout':
                this.audioManager.announce('strikeout');
                break;
            case 'ball':
                this.audioManager.announce('ball');
                break;
            case 'fly_out':
            case 'ground_out':
            case 'line_out':
            case 'foul_out':
                this.audioManager.announce('catch');
                break;
            case 'walk':
                this.audioManager.play('whistle', 0.3);
                break;
        }
    }

    setupKeyboardControls() {
        document.addEventListener('keydown', (e) => {
            switch (e.key.toLowerCase()) {
                case 'm':
                    // Toggle music
                    const musicState = this.audioManager.toggleMusic();
                    this.enhancedUI.addLogEntry(
                        `Music ${musicState ? 'ON' : 'OFF'}`,
                        'info'
                    );
                    break;

                case 's':
                    // Toggle sound effects
                    const sfxState = this.audioManager.toggleSFX();
                    this.enhancedUI.addLogEntry(
                        `Sound Effects ${sfxState ? 'ON' : 'OFF'}`,
                        'info'
                    );
                    break;

                case 'h':
                    // Show help
                    this.showHelp();
                    break;

                case 'escape':
                    // Pause menu
                    this.showPauseMenu();
                    break;
            }
        });
    }

    showHelp() {
        alert(`⚾ SANDLOT SUPERSTARS - Controls ⚾

GAMEPLAY:
• PITCH button or SPACE - Pitch the ball
• SWING button or Click - Swing the bat
• A key - Activate special ability
• RESET - Restart the game

AUDIO:
• M - Toggle music
• S - Toggle sound effects

OTHER:
• H - Show this help
• ESC - Pause menu

TIPS:
• Watch for special ability indicators!
• Each character has unique stats and abilities
• Different stadiums have different characteristics
• Try to build a balanced team!`);
    }

    showPauseMenu() {
        const response = confirm('Game Paused\n\nReturn to main menu?');
        if (response) {
            window.location.href = 'menu.html';
        }
    }

    saveGameStats(gameState) {
        const stats = JSON.parse(localStorage.getItem('playerStats') || '{}');

        stats.gamesPlayed = (stats.gamesPlayed || 0) + 1;

        const playerWon = gameState.teams.away.score > gameState.teams.home.score;
        if (playerWon) {
            stats.wins = (stats.wins || 0) + 1;
        }

        // Count home runs (would need to track this in game)
        stats.homeRuns = (stats.homeRuns || 0) + (gameState.stats?.homeRuns || 0);

        localStorage.setItem('playerStats', JSON.stringify(stats));
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 DOM loaded, initializing game...');

    // Small delay to ensure all scripts are loaded
    setTimeout(() => {
        window.sandlotGame = new SandlotSuperstarsGame();
    }, 500);
});

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SandlotSuperstarsGame;
}
