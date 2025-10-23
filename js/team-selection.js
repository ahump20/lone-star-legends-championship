/**
 * Team Selection UI Logic
 */

class TeamSelectionUI {
    constructor() {
        this.charManager = new CharacterManager();
        this.selectedTeam = null;
        this.selectedCharacters = [];
        this.currentPhase = 'team';

        this.init();
    }

    async init() {
        // Load character roster
        const loaded = await this.charManager.loadRoster();

        if (!loaded) {
            alert('Failed to load character roster!');
            return;
        }

        // Hide loading, show team selection
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('team-selection').classList.remove('hidden');

        // Render teams
        this.renderTeams();

        // Setup event listeners
        this.setupEventListeners();
    }

    renderTeams() {
        const teamGrid = document.getElementById('team-grid');
        const teams = this.charManager.getAllTeams();

        teamGrid.innerHTML = teams.map(team => `
            <div class="team-card" data-team-id="${team.id}">
                <div class="team-logo">${team.logo}</div>
                <div class="team-name">${team.name}</div>
                <div class="team-color-bar" style="background: linear-gradient(90deg, ${team.color}, ${team.secondaryColor});"></div>
                <p style="color: #666; margin-top: 10px; font-size: 0.9rem;">
                    Click to select this team
                </p>
            </div>
        `).join('');
    }

    renderCharacters() {
        const characterGrid = document.getElementById('character-grid');
        const characters = this.charManager.getAllCharacters();

        characterGrid.innerHTML = characters.map(char => {
            const isSelected = this.selectedCharacters.find(c => c.id === char.id);
            const isDisabled = this.selectedCharacters.length >= 9 && !isSelected;
            const stats = this.charManager.getCharacterStatsSummary(char);

            return `
                <div class="character-card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}"
                     data-char-id="${char.id}">
                    <div class="character-number">${char.favoriteNumber}</div>
                    <div class="character-name">${char.name}</div>
                    <div class="character-nickname">"${char.nickname}"</div>
                    <div class="character-position">${char.position}</div>

                    <div class="stat-bars">
                        <div class="stat-bar">
                            <span class="stat-label">Batting</span>
                            <div class="stat-value-container">
                                <div class="stat-value" style="width: ${char.stats.batting * 10}%"></div>
                            </div>
                            <span class="stat-number">${char.stats.batting}</span>
                        </div>
                        <div class="stat-bar">
                            <span class="stat-label">Power</span>
                            <div class="stat-value-container">
                                <div class="stat-value" style="width: ${char.stats.power * 10}%"></div>
                            </div>
                            <span class="stat-number">${char.stats.power}</span>
                        </div>
                        <div class="stat-bar">
                            <span class="stat-label">Speed</span>
                            <div class="stat-value-container">
                                <div class="stat-value" style="width: ${char.stats.speed * 10}%"></div>
                            </div>
                            <span class="stat-number">${char.stats.speed}</span>
                        </div>
                        <div class="stat-bar">
                            <span class="stat-label">Fielding</span>
                            <div class="stat-value-container">
                                <div class="stat-value" style="width: ${char.stats.fielding * 10}%"></div>
                            </div>
                            <span class="stat-number">${char.stats.fielding}</span>
                        </div>
                        <div class="stat-bar">
                            <span class="stat-label">Pitching</span>
                            <div class="stat-value-container">
                                <div class="stat-value" style="width: ${char.stats.pitching * 10}%"></div>
                            </div>
                            <span class="stat-number">${char.stats.pitching}</span>
                        </div>
                    </div>

                    <div class="overall-rating">${stats.rating}</div>

                    <div class="special-ability">
                        <div class="ability-name">⚡ ${char.specialAbility.name}</div>
                        <div class="ability-desc">${char.specialAbility.description}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderSelectedRoster() {
        const rosterList = document.getElementById('roster-list');
        const positions = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'];

        if (this.selectedCharacters.length === 0) {
            rosterList.innerHTML = `
                <p style="grid-column: 1/-1; text-align: center; color: #999;">
                    Select 9 players to build your roster...
                </p>
            `;
            return;
        }

        rosterList.innerHTML = this.selectedCharacters.map((char, index) => {
            const position = positions[index] || char.position;
            return `
                <div class="roster-item" data-char-id="${char.id}">
                    <div class="roster-position">${position}</div>
                    <div class="roster-player-name">${char.name}</div>
                    <button class="remove-btn" data-remove-id="${char.id}">✕</button>
                </div>
            `;
        }).join('');

        // Update selected count
        document.getElementById('selected-count').textContent = `${this.selectedCharacters.length} / 9`;
    }

    renderLineupOrder() {
        const lineupList = document.getElementById('lineup-list');
        const positions = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'];

        lineupList.innerHTML = this.selectedCharacters.map((char, index) => {
            const position = positions[index] || char.position;
            return `
                <div class="roster-item" draggable="true" data-lineup-index="${index}" data-char-id="${char.id}">
                    <div style="font-weight: bold; font-size: 1.2rem; color: #667eea; min-width: 30px;">
                        ${index + 1}.
                    </div>
                    <div class="roster-position">${position}</div>
                    <div class="roster-player-name">${char.name} "${char.nickname}"</div>
                    <div style="margin-left: auto; color: #666; font-size: 0.85rem;">
                        ⚡ ${char.specialAbility.name}
                    </div>
                </div>
            `;
        }).join('');

        // Add drag and drop functionality
        this.setupDragAndDrop();
    }

    setupEventListeners() {
        // Team selection
        document.getElementById('team-grid').addEventListener('click', (e) => {
            const teamCard = e.target.closest('.team-card');
            if (teamCard) {
                this.selectTeam(teamCard.dataset.teamId);
            }
        });

        // Continue to players
        document.getElementById('continue-to-players').addEventListener('click', () => {
            this.showPlayerSelection();
        });

        // Character selection
        document.getElementById('character-grid').addEventListener('click', (e) => {
            const charCard = e.target.closest('.character-card');
            if (charCard && !charCard.classList.contains('disabled')) {
                this.toggleCharacter(charCard.dataset.charId);
            }
        });

        // Remove character from roster
        document.getElementById('roster-list').addEventListener('click', (e) => {
            const removeBtn = e.target.closest('.remove-btn');
            if (removeBtn) {
                this.removeCharacter(removeBtn.dataset.removeId);
            }
        });

        // Back to teams
        document.getElementById('back-to-teams').addEventListener('click', () => {
            this.showTeamSelection();
        });

        // Continue to lineup
        document.getElementById('continue-to-lineup').addEventListener('click', () => {
            this.showLineupOrder();
        });

        // Back to players
        document.getElementById('back-to-players').addEventListener('click', () => {
            this.showPlayerSelection();
        });

        // Start game
        document.getElementById('start-game').addEventListener('click', () => {
            this.startGame();
        });
    }

    selectTeam(teamId) {
        // Remove previous selection
        document.querySelectorAll('.team-card').forEach(card => {
            card.classList.remove('selected');
        });

        // Select new team
        const teamCard = document.querySelector(`[data-team-id="${teamId}"]`);
        teamCard.classList.add('selected');

        this.selectedTeam = this.charManager.getTeamById(teamId);

        // Enable continue button
        document.getElementById('continue-to-players').disabled = false;
    }

    toggleCharacter(charId) {
        const existingIndex = this.selectedCharacters.findIndex(c => c.id === charId);

        if (existingIndex >= 0) {
            // Deselect
            this.selectedCharacters.splice(existingIndex, 1);
        } else {
            // Select (if not at max)
            if (this.selectedCharacters.length < 9) {
                const character = this.charManager.getCharacterById(charId);
                this.selectedCharacters.push(character);
            }
        }

        // Re-render
        this.renderCharacters();
        this.renderSelectedRoster();

        // Enable/disable continue button
        document.getElementById('continue-to-lineup').disabled = this.selectedCharacters.length !== 9;
    }

    removeCharacter(charId) {
        const index = this.selectedCharacters.findIndex(c => c.id === charId);
        if (index >= 0) {
            this.selectedCharacters.splice(index, 1);
        }

        this.renderCharacters();
        this.renderSelectedRoster();
        document.getElementById('continue-to-lineup').disabled = this.selectedCharacters.length !== 9;
    }

    showTeamSelection() {
        document.getElementById('player-selection').classList.add('hidden');
        document.getElementById('team-selection').classList.remove('hidden');
        document.getElementById('lineup-order').classList.add('hidden');
        this.currentPhase = 'team';
    }

    showPlayerSelection() {
        document.getElementById('team-selection').classList.add('hidden');
        document.getElementById('player-selection').classList.remove('hidden');
        document.getElementById('lineup-order').classList.add('hidden');
        this.currentPhase = 'player';

        // Render characters
        this.renderCharacters();
        this.renderSelectedRoster();
    }

    showLineupOrder() {
        document.getElementById('team-selection').classList.add('hidden');
        document.getElementById('player-selection').classList.add('hidden');
        document.getElementById('lineup-order').classList.remove('hidden');
        this.currentPhase = 'lineup';

        // Render lineup
        this.renderLineupOrder();
    }

    setupDragAndDrop() {
        const items = document.querySelectorAll('.roster-item[draggable="true"]');
        let draggedItem = null;

        items.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                draggedItem = item;
                item.style.opacity = '0.5';
            });

            item.addEventListener('dragend', (e) => {
                item.style.opacity = '1';
            });

            item.addEventListener('dragover', (e) => {
                e.preventDefault();
            });

            item.addEventListener('drop', (e) => {
                e.preventDefault();

                if (draggedItem !== item) {
                    const draggedIndex = parseInt(draggedItem.dataset.lineupIndex);
                    const targetIndex = parseInt(item.dataset.lineupIndex);

                    // Swap characters in array
                    const temp = this.selectedCharacters[draggedIndex];
                    this.selectedCharacters[draggedIndex] = this.selectedCharacters[targetIndex];
                    this.selectedCharacters[targetIndex] = temp;

                    // Re-render
                    this.renderLineupOrder();
                }
            });
        });
    }

    startGame() {
        // Save team selection
        const characterIds = this.selectedCharacters.map(c => c.id);
        this.charManager.saveTeamSelection(this.selectedTeam.id, characterIds);

        // Create player lineup
        const playerLineup = this.charManager.createBalancedLineup(
            this.selectedCharacters,
            this.selectedTeam
        );

        // Save to sessionStorage for game to use
        sessionStorage.setItem('selectedTeam', JSON.stringify(this.selectedTeam));
        sessionStorage.setItem('playerLineup', JSON.stringify(playerLineup));
        sessionStorage.setItem('selectedCharacters', JSON.stringify(this.selectedCharacters));

        // Generate opponent team
        const opponentTeamData = this.charManager.getAllTeams().find(t => t.id !== this.selectedTeam.id);
        const opponentCharacters = this.charManager.getRandomCharacters(9, characterIds);
        const opponentLineup = this.charManager.createBalancedLineup(opponentCharacters, opponentTeamData);

        sessionStorage.setItem('opponentTeam', JSON.stringify(opponentTeamData));
        sessionStorage.setItem('opponentLineup', JSON.stringify(opponentLineup));

        // Redirect to game
        window.location.href = '/games/baseball/index.html';
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new TeamSelectionUI();
});
