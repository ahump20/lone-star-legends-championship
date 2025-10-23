/**
 * UI Screens
 * All game UI screens (Main Menu, Game Modes, Achievements, etc.)
 */

/**
 * Main Menu Screen
 */
class MainMenuScreen extends BaseScreen {
    create() {
        const screen = document.createElement('div');
        screen.className = 'screen main-menu-screen';
        screen.id = 'main-menu';

        screen.innerHTML = `
            <div class="main-menu-container">
                <div class="game-logo">
                    <h1 class="logo-text">⚾ SANDLOT SUPERSTARS ⚾</h1>
                    <p class="logo-subtitle">Ultimate Baseball Championship</p>
                </div>

                <div class="menu-buttons">
                    <button class="menu-btn" data-action="continue" id="continue-btn" style="display: none;">
                        <span class="menu-icon">▶️</span>
                        <div class="menu-text">
                            <div class="menu-title">Continue Game</div>
                            <div class="menu-desc">Resume your saved game</div>
                        </div>
                    </button>

                    <button class="menu-btn" data-action="quickplay">
                        <span class="menu-icon">⚾</span>
                        <div class="menu-text">
                            <div class="menu-title">Quick Play</div>
                            <div class="menu-desc">Play a single 9-inning game</div>
                        </div>
                    </button>

                    <button class="menu-btn" data-action="season">
                        <span class="menu-icon">🏆</span>
                        <div class="menu-text">
                            <div class="menu-title">Season Mode</div>
                            <div class="menu-desc">Play through a full season with playoffs</div>
                        </div>
                    </button>

                    <button class="menu-btn" data-action="derby">
                        <span class="menu-icon">🚀</span>
                        <div class="menu-text">
                            <div class="menu-title">Home Run Derby</div>
                            <div class="menu-desc">Hit as many home runs as you can!</div>
                        </div>
                    </button>

                    <button class="menu-btn" data-action="practice">
                        <span class="menu-icon">🎯</span>
                        <div class="menu-text">
                            <div class="menu-title">Batting Practice</div>
                            <div class="menu-desc">Practice your hitting skills</div>
                        </div>
                    </button>

                    <button class="menu-btn" data-action="tournament">
                        <span class="menu-icon">🥇</span>
                        <div class="menu-text">
                            <div class="menu-title">Tournament</div>
                            <div class="menu-desc">Single elimination bracket</div>
                        </div>
                    </button>

                    <button class="menu-btn" data-action="achievements">
                        <span class="menu-icon">⭐</span>
                        <div class="menu-text">
                            <div class="menu-title">Achievements</div>
                            <div class="menu-desc">View your accomplishments</div>
                        </div>
                    </button>

                    <button class="menu-btn" data-action="statistics">
                        <span class="menu-icon">📊</span>
                        <div class="menu-text">
                            <div class="menu-title">Statistics</div>
                            <div class="menu-desc">View your career stats</div>
                        </div>
                    </button>

                    <button class="menu-btn" data-action="settings">
                        <span class="menu-icon">⚙️</span>
                        <div class="menu-text">
                            <div class="menu-title">Settings</div>
                            <div class="menu-desc">Customize your experience</div>
                        </div>
                    </button>
                </div>

                <div class="menu-footer">
                    <div class="version-info">Version 2.0.0</div>
                    <div class="player-stats" id="player-quick-stats"></div>
                </div>
            </div>
        `;

        // Add event listeners
        screen.querySelectorAll('.menu-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.getAttribute('data-action');
                this.handleAction(action);
            });
        });

        return screen;
    }

    onShow(options) {
        // Check for saved game
        if (window.gameStateManager && window.gameStateManager.hasSavedGame()) {
            document.getElementById('continue-btn').style.display = 'flex';
        }

        // Show quick stats
        this.updateQuickStats();
    }

    updateQuickStats() {
        if (!window.gameStateManager) return;

        const stats = window.gameStateManager.getStatistics();
        const quickStatsEl = document.getElementById('player-quick-stats');

        if (quickStatsEl && stats.gamesPlayed > 0) {
            const winRate = ((stats.wins / stats.gamesPlayed) * 100).toFixed(1);
            quickStatsEl.innerHTML = `
                Games: ${stats.gamesPlayed} |
                Win Rate: ${winRate}% |
                Home Runs: ${stats.totalHomeRuns}
            `;
        }
    }

    handleAction(action) {
        switch (action) {
            case 'continue':
                this.uiManager.showScreen('game-setup', { mode: 'continue' });
                break;
            case 'quickplay':
                this.uiManager.showScreen('game-setup', { mode: 'quickplay' });
                break;
            case 'season':
                this.uiManager.showScreen('season-setup');
                break;
            case 'derby':
                this.uiManager.showScreen('derby-setup');
                break;
            case 'practice':
                this.uiManager.showScreen('practice-setup');
                break;
            case 'tournament':
                this.uiManager.showScreen('tournament-setup');
                break;
            case 'achievements':
                this.uiManager.showScreen('achievements');
                break;
            case 'statistics':
                this.uiManager.showScreen('statistics');
                break;
            case 'settings':
                this.uiManager.showScreen('settings');
                break;
        }
    }
}

/**
 * Achievements Screen
 */
class AchievementsScreen extends BaseScreen {
    create() {
        const screen = document.createElement('div');
        screen.className = 'screen achievements-screen';
        screen.id = 'achievements';

        screen.innerHTML = `
            <div class="screen-header">
                <button class="back-btn" data-action="back">← Back</button>
                <h2>🏆 Achievements</h2>
                <div class="achievement-progress" id="achievement-progress"></div>
            </div>

            <div class="achievement-filter">
                <button class="filter-btn active" data-filter="all">All</button>
                <button class="filter-btn" data-filter="milestone">Milestone</button>
                <button class="filter-btn" data-filter="hitting">Hitting</button>
                <button class="filter-btn" data-filter="winning">Winning</button>
                <button class="filter-btn" data-filter="pitching">Pitching</button>
                <button class="filter-btn" data-filter="abilities">Abilities</button>
                <button class="filter-btn" data-filter="collection">Collection</button>
            </div>

            <div class="achievements-grid" id="achievements-grid"></div>
        `;

        // Event listeners
        screen.querySelector('[data-action="back"]').addEventListener('click', () => {
            this.uiManager.showScreen('main-menu');
        });

        screen.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                screen.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.filterAchievements(btn.getAttribute('data-filter'));
            });
        });

        return screen;
    }

    onShow() {
        this.loadAchievements();
    }

    loadAchievements() {
        if (!window.achievementSystem) return;

        const progress = window.achievementSystem.getProgress();
        const achievements = window.achievementSystem.getAllAchievements();

        // Update progress
        document.getElementById('achievement-progress').textContent =
            `${progress.unlocked}/${progress.total} Unlocked (${progress.percentComplete}%) • ${progress.earnedPoints}/${progress.totalPoints} Points`;

        // Render achievements
        const grid = document.getElementById('achievements-grid');
        grid.innerHTML = '';

        achievements.forEach(achievement => {
            const card = this.createAchievementCard(achievement);
            grid.appendChild(card);
        });
    }

    createAchievementCard(achievement) {
        const card = document.createElement('div');
        card.className = `achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`;
        card.setAttribute('data-category', achievement.category);

        const unlockedDate = achievement.unlockedAt
            ? new Date(achievement.unlockedAt).toLocaleDateString()
            : '';

        card.innerHTML = `
            <div class="achievement-icon">${achievement.unlocked ? achievement.icon : '🔒'}</div>
            <div class="achievement-info">
                <div class="achievement-name">${achievement.unlocked ? achievement.name : '???'}</div>
                <div class="achievement-description">
                    ${achievement.unlocked ? achievement.description : 'Hidden achievement'}
                </div>
                <div class="achievement-meta">
                    <span class="achievement-points">${achievement.points} pts</span>
                    ${achievement.unlocked ? `<span class="achievement-date">${unlockedDate}</span>` : ''}
                </div>
            </div>
        `;

        return card;
    }

    filterAchievements(category) {
        const cards = document.querySelectorAll('.achievement-card');
        cards.forEach(card => {
            if (category === 'all' || card.getAttribute('data-category') === category) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    }
}

/**
 * Statistics Screen
 */
class StatisticsScreen extends BaseScreen {
    create() {
        const screen = document.createElement('div');
        screen.className = 'screen statistics-screen';
        screen.id = 'statistics';

        screen.innerHTML = `
            <div class="screen-header">
                <button class="back-btn" data-action="back">← Back</button>
                <h2>📊 Career Statistics</h2>
            </div>

            <div class="stats-container">
                <div class="stats-section">
                    <h3>📈 Overview</h3>
                    <div class="stats-grid" id="overview-stats"></div>
                </div>

                <div class="stats-section">
                    <h3>⚾ Batting</h3>
                    <div class="stats-grid" id="batting-stats"></div>
                </div>

                <div class="stats-section">
                    <h3>🏆 Records</h3>
                    <div class="stats-grid" id="records-stats"></div>
                </div>

                <div class="stats-section">
                    <h3>🎮 Usage</h3>
                    <div class="stats-grid" id="usage-stats"></div>
                </div>
            </div>
        `;

        screen.querySelector('[data-action="back"]').addEventListener('click', () => {
            this.uiManager.showScreen('main-menu');
        });

        return screen;
    }

    onShow() {
        this.loadStatistics();
    }

    loadStatistics() {
        if (!window.gameStateManager) return;

        const stats = window.gameStateManager.getStatistics();

        // Overview
        this.renderStatGroup('overview-stats', [
            { label: 'Games Played', value: stats.gamesPlayed },
            { label: 'Wins', value: stats.wins },
            { label: 'Losses', value: stats.losses },
            { label: 'Win Rate', value: stats.gamesPlayed > 0 ? `${((stats.wins / stats.gamesPlayed) * 100).toFixed(1)}%` : '0%' },
        ]);

        // Batting
        const battingAvg = stats.gamesPlayed > 0 ? (stats.totalHits / (stats.gamesPlayed * 30)).toFixed(3) : '.000';
        this.renderStatGroup('batting-stats', [
            { label: 'Total Hits', value: stats.totalHits },
            { label: 'Home Runs', value: stats.totalHomeRuns },
            { label: 'Runs Scored', value: stats.totalRuns },
            { label: 'Batting Average', value: battingAvg },
            { label: 'Strikeouts', value: stats.totalStrikeouts },
        ]);

        // Records
        this.renderStatGroup('records-stats', [
            { label: 'Highest Score', value: stats.highestScore || 0 },
            { label: 'Most HRs in Game', value: this.getMostInGame(stats, 'homeRuns') },
            { label: 'Last Played', value: stats.lastPlayed ? new Date(stats.lastPlayed).toLocaleDateString() : 'Never' },
        ]);

        // Usage
        const favoriteChar = this.getMostUsed(stats.characterUsage);
        this.renderStatGroup('usage-stats', [
            { label: 'Favorite Character', value: favoriteChar || 'None' },
            { label: 'Total Play Time', value: this.formatPlayTime(stats.totalPlayTime || 0) },
        ]);
    }

    renderStatGroup(elementId, stats) {
        const grid = document.getElementById(elementId);
        grid.innerHTML = '';

        stats.forEach(stat => {
            const item = document.createElement('div');
            item.className = 'stat-item';
            item.innerHTML = `
                <div class="stat-label">${stat.label}</div>
                <div class="stat-value">${stat.value}</div>
            `;
            grid.appendChild(item);
        });
    }

    getMostUsed(usage) {
        if (!usage || Object.keys(usage).length === 0) return null;
        return Object.entries(usage).reduce((a, b) => a[1] > b[1] ? a : b)[0];
    }

    getMostInGame(stats, field) {
        // Placeholder - would track per-game records
        return 0;
    }

    formatPlayTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = Math.floor(minutes % 60);
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    }
}

/**
 * Settings Screen
 */
class SettingsScreen extends BaseScreen {
    create() {
        const screen = document.createElement('div');
        screen.className = 'screen settings-screen';
        screen.id = 'settings';

        screen.innerHTML = `
            <div class="screen-header">
                <button class="back-btn" data-action="back">← Back</button>
                <h2>⚙️ Settings</h2>
            </div>

            <div class="settings-container">
                <div class="setting-group">
                    <h3>🔊 Audio</h3>
                    <div class="setting-item">
                        <label for="master-volume">Master Volume</label>
                        <input type="range" id="master-volume" min="0" max="100" value="70">
                        <span class="setting-value" id="master-volume-value">70%</span>
                    </div>
                    <div class="setting-item">
                        <label for="music-toggle">Music</label>
                        <input type="checkbox" id="music-toggle" checked>
                    </div>
                    <div class="setting-item">
                        <label for="sfx-toggle">Sound Effects</label>
                        <input type="checkbox" id="sfx-toggle" checked>
                    </div>
                </div>

                <div class="setting-group">
                    <h3>🎮 Gameplay</h3>
                    <div class="setting-item">
                        <label for="difficulty">Difficulty</label>
                        <select id="difficulty">
                            <option value="easy">Easy</option>
                            <option value="medium" selected>Medium</option>
                            <option value="hard">Hard</option>
                            <option value="expert">Expert</option>
                        </select>
                    </div>
                    <div class="setting-item">
                        <label for="auto-save">Auto Save</label>
                        <input type="checkbox" id="auto-save" checked>
                    </div>
                    <div class="setting-item">
                        <label for="show-tutorial">Show Tutorials</label>
                        <input type="checkbox" id="show-tutorial" checked>
                    </div>
                </div>

                <div class="setting-group">
                    <h3>🎨 Graphics</h3>
                    <div class="setting-item">
                        <label for="graphics-quality">Quality</label>
                        <select id="graphics-quality">
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high" selected>High</option>
                        </select>
                    </div>
                    <div class="setting-item">
                        <label for="visual-effects">Visual Effects</label>
                        <input type="checkbox" id="visual-effects" checked>
                    </div>
                </div>

                <div class="setting-group">
                    <h3>📊 Data</h3>
                    <div class="setting-actions">
                        <button class="btn btn-secondary" id="export-data">Export Data</button>
                        <button class="btn btn-secondary" id="import-data">Import Data</button>
                        <button class="btn btn-danger" id="reset-data">Reset All Data</button>
                    </div>
                </div>
            </div>
        `;

        this.addEventListeners(screen);
        return screen;
    }

    addEventListeners(screen) {
        // Back button
        screen.querySelector('[data-action="back"]').addEventListener('click', () => {
            this.saveSettings();
            this.uiManager.showScreen('main-menu');
        });

        // Volume slider
        const volumeSlider = screen.querySelector('#master-volume');
        const volumeValue = screen.querySelector('#master-volume-value');
        volumeSlider.addEventListener('input', (e) => {
            volumeValue.textContent = e.target.value + '%';
        });

        // Data actions
        screen.querySelector('#export-data').addEventListener('click', () => this.exportData());
        screen.querySelector('#import-data').addEventListener('click', () => this.importData());
        screen.querySelector('#reset-data').addEventListener('click', () => this.resetData());
    }

    onShow() {
        this.loadSettings();
    }

    loadSettings() {
        if (!window.gameStateManager) return;

        const settings = window.gameStateManager.settings;

        // Apply settings to UI
        document.getElementById('master-volume').value = settings.volume * 100;
        document.getElementById('master-volume-value').textContent = (settings.volume * 100) + '%';
        document.getElementById('music-toggle').checked = settings.musicEnabled;
        document.getElementById('sfx-toggle').checked = settings.sfxEnabled;
        document.getElementById('difficulty').value = settings.difficulty;
        document.getElementById('auto-save').checked = settings.autoSave;
        document.getElementById('show-tutorial').checked = settings.showTutorial;
        document.getElementById('graphics-quality').value = settings.graphics;
        document.getElementById('visual-effects').checked = settings.visualEffects !== false;
    }

    saveSettings() {
        if (!window.gameStateManager) return;

        const settings = {
            volume: document.getElementById('master-volume').value / 100,
            musicEnabled: document.getElementById('music-toggle').checked,
            sfxEnabled: document.getElementById('sfx-toggle').checked,
            difficulty: document.getElementById('difficulty').value,
            autoSave: document.getElementById('auto-save').checked,
            showTutorial: document.getElementById('show-tutorial').checked,
            graphics: document.getElementById('graphics-quality').value,
            visualEffects: document.getElementById('visual-effects').checked,
        };

        window.gameStateManager.saveSettings(settings);
        this.uiManager.showSuccess('Settings saved!');
    }

    exportData() {
        if (!window.gameStateManager) return;

        const data = window.gameStateManager.exportData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sandlot-backup-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        this.uiManager.showSuccess('Data exported successfully!');
    }

    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const text = await file.text();
            const data = JSON.parse(text);

            if (window.gameStateManager && window.gameStateManager.importData(data)) {
                this.uiManager.showSuccess('Data imported successfully!');
                this.loadSettings();
            } else {
                this.uiManager.showError('Failed to import data');
            }
        };
        input.click();
    }

    async resetData() {
        const confirmed = await this.uiManager.confirm(
            'Are you sure you want to reset all data? This cannot be undone.',
            { title: 'Reset Data', confirmText: 'Reset', cancelText: 'Cancel' }
        );

        if (confirmed && window.gameStateManager) {
            window.gameStateManager.clearAllData();
            this.uiManager.showSuccess('All data has been reset');
            this.loadSettings();
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MainMenuScreen,
        AchievementsScreen,
        StatisticsScreen,
        SettingsScreen
    };
}
