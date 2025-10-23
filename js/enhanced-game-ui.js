/**
 * Enhanced Game UI
 * Character portraits, ability buttons, and improved HUD
 */

class EnhancedGameUI {
    constructor(gameEngine, abilitiesManager, audioManager) {
        this.gameEngine = gameEngine;
        this.abilitiesManager = abilitiesManager;
        this.audioManager = audioManager;
        this.init();
    }

    init() {
        this.createHUD();
        this.createAbilityUI();
        this.createCharacterPortraits();
        this.createGameLog();
    }

    createHUD() {
        // Enhanced scoreboard
        const scoreboard = document.getElementById('scoreboard');
        if (scoreboard) {
            scoreboard.innerHTML = `
                <div class="enhanced-scoreboard">
                    <div class="team-score away-team">
                        <div class="team-logo" id="awayLogo">⚾</div>
                        <div class="team-info">
                            <div class="team-name" id="awayTeamName">Away</div>
                            <div class="team-score-value" id="awayScore">0</div>
                        </div>
                    </div>

                    <div class="game-status">
                        <div class="inning-display" id="inningDisplay">Top 1st</div>
                        <div class="count-display">
                            <span class="count-label">Balls:</span>
                            <span class="count-value" id="ballCount">0</span>
                            <span class="count-label">Strikes:</span>
                            <span class="count-value" id="strikeCount">0</span>
                            <span class="count-label">Outs:</span>
                            <span class="count-value" id="outCount">0</span>
                        </div>
                        <div class="bases-display" id="basesDisplay">
                            <div class="base" id="base1"></div>
                            <div class="base" id="base2"></div>
                            <div class="base" id="base3"></div>
                        </div>
                    </div>

                    <div class="team-score home-team">
                        <div class="team-info">
                            <div class="team-name" id="homeTeamName">Home</div>
                            <div class="team-score-value" id="homeScore">0</div>
                        </div>
                        <div class="team-logo" id="homeLogo">⚾</div>
                    </div>
                </div>
            `;
        }
    }

    createAbilityUI() {
        const container = document.createElement('div');
        container.id = 'ability-container';
        container.className = 'ability-container';
        container.innerHTML = `
            <div class="ability-panel">
                <h3>Special Ability</h3>
                <button id="activate-ability" class="ability-button" disabled>
                    <div class="ability-icon">⚡</div>
                    <div class="ability-name" id="abilityName">No Ability</div>
                    <div class="ability-desc" id="abilityDesc">N/A</div>
                    <div class="ability-cooldown" id="abilityCooldown">Ready!</div>
                </button>
                <div class="ability-hint">Press 'A' to activate</div>
            </div>
        `;

        document.body.appendChild(container);

        // Add event listener
        document.getElementById('activate-ability').addEventListener('click', () => {
            this.activateCurrentPlayerAbility();
        });

        // Keyboard shortcut
        document.addEventListener('keydown', (e) => {
            if (e.key === 'a' || e.key === 'A') {
                this.activateCurrentPlayerAbility();
            }
        });
    }

    createCharacterPortraits() {
        const container = document.createElement('div');
        container.id = 'character-portraits';
        container.className = 'character-portraits';
        container.innerHTML = `
            <div class="portrait-panel current-batter">
                <div class="portrait-header">At Bat</div>
                <div class="portrait-content">
                    <div class="portrait-avatar" id="batterAvatar">👤</div>
                    <div class="portrait-info">
                        <div class="portrait-name" id="batterName">Batter</div>
                        <div class="portrait-position" id="batterPosition">-</div>
                        <div class="portrait-stats">
                            <div class="stat-mini">AVG: <span id="batterAvg">.000</span></div>
                            <div class="stat-mini">HR: <span id="batterHR">0</span></div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="portrait-panel current-pitcher">
                <div class="portrait-header">Pitching</div>
                <div class="portrait-content">
                    <div class="portrait-avatar" id="pitcherAvatar">👤</div>
                    <div class="portrait-info">
                        <div class="portrait-name" id="pitcherName">Pitcher</div>
                        <div class="portrait-position" id="pitcherPosition">P</div>
                        <div class="portrait-stats">
                            <div class="stat-mini">K: <span id="pitcherK">0</span></div>
                            <div class="stat-mini">STA: <span id="pitcherStamina">100</span></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(container);
    }

    createGameLog() {
        let logContainer = document.getElementById('game-log');
        if (!logContainer) {
            logContainer = document.createElement('div');
            logContainer.id = 'game-log';
            logContainer.className = 'game-log';
            logContainer.innerHTML = `
                <div class="log-header">
                    <h3>Play-by-Play</h3>
                    <button id="clear-log" class="log-button">Clear</button>
                </div>
                <div class="log-content" id="log-content"></div>
            `;
            document.body.appendChild(logContainer);

            document.getElementById('clear-log').addEventListener('click', () => {
                this.clearLog();
            });
        }
    }

    updateHUD(gameState) {
        // Update scores
        document.getElementById('awayScore').textContent = gameState.teams.away.score;
        document.getElementById('homeScore').textContent = gameState.teams.home.score;

        // Update team names
        document.getElementById('awayTeamName').textContent = gameState.teams.away.name;
        document.getElementById('homeTeamName').textContent = gameState.teams.home.name;

        // Update count
        document.getElementById('ballCount').textContent = gameState.balls;
        document.getElementById('strikeCount').textContent = gameState.strikes;
        document.getElementById('outCount').textContent = gameState.outs;

        // Update inning
        const inningText = `${gameState.isTopInning ? 'Top' : 'Bottom'} ${this.getOrdinal(gameState.currentInning)}`;
        document.getElementById('inningDisplay').textContent = inningText;

        // Update bases
        this.updateBases(gameState.bases);

        // Update character portraits
        this.updatePortraits(gameState);

        // Update ability UI
        this.updateAbilityUI(gameState.currentBatter);
    }

    updateBases(bases) {
        ['base1', 'base2', 'base3'].forEach((id, index) => {
            const base = document.getElementById(id);
            if (base) {
                if (bases[index]) {
                    base.classList.add('occupied');
                    base.textContent = '👤';
                } else {
                    base.classList.remove('occupied');
                    base.textContent = '';
                }
            }
        });
    }

    updatePortraits(gameState) {
        const batter = gameState.currentBatter;
        const pitcher = gameState.currentPitcher;

        // Update batter
        if (batter) {
            document.getElementById('batterName').textContent = batter.name;
            document.getElementById('batterPosition').textContent = batter.position;
            document.getElementById('batterAvg').textContent = batter.battingAverage.toFixed(3);
            document.getElementById('batterHR').textContent = batter.homeRuns || 0;

            // Update avatar emoji based on character
            const batterEmoji = this.getCharacterEmoji(batter);
            document.getElementById('batterAvatar').textContent = batterEmoji;
        }

        // Update pitcher
        if (pitcher) {
            document.getElementById('pitcherName').textContent = pitcher.name;
            document.getElementById('pitcherPosition').textContent = pitcher.position;
            document.getElementById('pitcherK').textContent = pitcher.strikeouts || 0;
            document.getElementById('pitcherStamina').textContent = Math.round(pitcher.stamina);

            const pitcherEmoji = this.getCharacterEmoji(pitcher);
            document.getElementById('pitcherAvatar').textContent = pitcherEmoji;
        }
    }

    updateAbilityUI(player) {
        const abilityButton = document.getElementById('activate-ability');
        const abilityName = document.getElementById('abilityName');
        const abilityDesc = document.getElementById('abilityDesc');
        const abilityCooldown = document.getElementById('abilityCooldown');

        if (!player || !player.specialAbility) {
            abilityButton.disabled = true;
            abilityName.textContent = 'No Ability';
            abilityDesc.textContent = 'N/A';
            return;
        }

        const ability = player.specialAbility;
        abilityName.textContent = ability.name;
        abilityDesc.textContent = ability.description;

        if (ability.available) {
            abilityButton.disabled = false;
            abilityButton.classList.add('ready');
            abilityCooldown.textContent = 'READY!';
        } else {
            abilityButton.disabled = true;
            abilityButton.classList.remove('ready');
            abilityCooldown.textContent = `Used (${ability.usesRemaining || 0} left)`;
        }
    }

    activateCurrentPlayerAbility() {
        const player = this.gameEngine.currentBatter;
        if (!player) return;

        const result = this.abilitiesManager.activateAbility(player);

        if (result.success) {
            this.addLogEntry(result.message, 'ability');
            this.showAbilityActivation(player, result.message);
            this.audioManager.play('home_run', 0.5); // Special sound
        } else {
            this.audioManager.play('button_click');
        }

        this.updateAbilityUI(player);
    }

    showAbilityActivation(player, message) {
        const overlay = document.createElement('div');
        overlay.className = 'ability-activation-overlay';
        overlay.innerHTML = `
            <div class="ability-activation">
                <div class="activation-icon">⚡</div>
                <div class="activation-player">${player.name}</div>
                <div class="activation-ability">${player.specialAbility.name}</div>
                <div class="activation-message">${message}</div>
            </div>
        `;

        document.body.appendChild(overlay);

        setTimeout(() => {
            overlay.remove();
        }, 3000);
    }

    addLogEntry(message, type = 'info') {
        const logContent = document.getElementById('log-content');
        if (!logContent) return;

        const entry = document.createElement('div');
        entry.className = `log-entry log-${type}`;
        entry.innerHTML = `
            <span class="log-time">${new Date().toLocaleTimeString()}</span>
            <span class="log-message">${message}</span>
        `;

        logContent.insertBefore(entry, logContent.firstChild);

        // Keep only last 50 entries
        while (logContent.children.length > 50) {
            logContent.removeChild(logContent.lastChild);
        }
    }

    clearLog() {
        const logContent = document.getElementById('log-content');
        if (logContent) {
            logContent.innerHTML = '';
        }
    }

    getOrdinal(n) {
        const s = ['th', 'st', 'nd', 'rd'];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    }

    getCharacterEmoji(player) {
        // Return emoji based on player characteristics
        if (!player.appearance) return '👤';

        const emojiMap = {
            'short_spiky': '🧑',
            'long_ponytail': '👩',
            'afro': '👨🏿',
            'mohawk': '🧑‍🎤',
            'braids': '👧🏿',
            'high_ponytail': '👩',
            'buzzcut': '👨',
            'messy': '🧒',
            'shaggy': '🧑',
            'pigtails': '👧',
            'cornrows': '👨🏿',
            'short_pixie': '👧',
            'crew_cut': '👨',
            'slicked_back': '🧑'
        };

        return emojiMap[player.appearance.hairStyle] || '👤';
    }

    showHitIndicator(hitType) {
        let message = '';
        let className = '';

        switch (hitType) {
            case 'home_run':
                message = 'HOME RUN! 💥';
                className = 'homerun';
                break;
            case 'triple':
                message = 'TRIPLE! 🔥';
                className = 'triple';
                break;
            case 'double':
                message = 'DOUBLE! ⚡';
                className = 'double';
                break;
            case 'single':
                message = 'BASE HIT! ✓';
                className = 'single';
                break;
            case 'strikeout':
                message = 'STRIKE OUT! K';
                className = 'strikeout';
                break;
            case 'walk':
                message = 'WALK! 🚶';
                className = 'walk';
                break;
            case 'out':
                message = 'OUT!';
                className = 'out';
                break;
        }

        const indicator = document.createElement('div');
        indicator.className = `hit-indicator ${className}`;
        indicator.textContent = message;
        document.body.appendChild(indicator);

        setTimeout(() => indicator.remove(), 2000);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedGameUI;
}
