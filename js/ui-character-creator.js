/**
 * Character Creator UI Screen
 * Visual interface for creating and customizing characters
 */

class CharacterCreatorScreen extends BaseScreen {
    constructor(uiManager, characterCreator) {
        super(uiManager);
        this.characterCreator = characterCreator;
        this.currentTab = 'basic';
        this.updateInterval = null;

        // Listen to character creator events
        this.characterCreator.on('*', () => {
            if (this.isVisible) {
                this.refreshDisplay();
            }
        });
    }

    create() {
        const screen = document.createElement('div');
        screen.className = 'screen character-creator-screen';
        screen.id = 'character-creator';

        screen.innerHTML = `
            <div class="creator-container">
                <!-- Header -->
                <div class="creator-header">
                    <button class="back-btn" data-action="back">← Back</button>
                    <h2 class="creator-title">Create Character</h2>
                    <div class="creator-actions">
                        <button class="secondary-btn" data-action="preset">Load Preset</button>
                        <button class="primary-btn" data-action="save">Save Character</button>
                    </div>
                </div>

                <!-- Progress Bar -->
                <div class="creator-progress">
                    <div class="progress-item" data-step="basic">
                        <div class="progress-icon">1</div>
                        <div class="progress-label">Basic Info</div>
                    </div>
                    <div class="progress-line"></div>
                    <div class="progress-item" data-step="stats">
                        <div class="progress-icon">2</div>
                        <div class="progress-label">Stats</div>
                    </div>
                    <div class="progress-line"></div>
                    <div class="progress-item" data-step="appearance">
                        <div class="progress-icon">3</div>
                        <div class="progress-label">Appearance</div>
                    </div>
                    <div class="progress-line"></div>
                    <div class="progress-item" data-step="abilities">
                        <div class="progress-icon">4</div>
                        <div class="progress-label">Abilities</div>
                    </div>
                </div>

                <!-- Main Content -->
                <div class="creator-content">
                    <!-- Left Panel: Form -->
                    <div class="creator-form">
                        <!-- Basic Info Tab -->
                        <div class="creator-tab" data-tab="basic">
                            <h3>Basic Information</h3>

                            <div class="form-group">
                                <label for="char-name">Character Name *</label>
                                <input type="text" id="char-name" class="form-input" maxlength="30" placeholder="Enter name...">
                                <small>30 characters maximum</small>
                            </div>

                            <div class="form-group">
                                <label for="char-position">Primary Position</label>
                                <select id="char-position" class="form-select">
                                    <option value="P">Pitcher (P)</option>
                                    <option value="C">Catcher (C)</option>
                                    <option value="1B">First Base (1B)</option>
                                    <option value="2B">Second Base (2B)</option>
                                    <option value="3B">Third Base (3B)</option>
                                    <option value="SS">Shortstop (SS)</option>
                                    <option value="LF">Left Field (LF)</option>
                                    <option value="CF" selected>Center Field (CF)</option>
                                    <option value="RF">Right Field (RF)</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label for="char-number">Jersey Number</label>
                                <input type="number" id="char-number" class="form-input" min="0" max="99" value="0">
                                <small>0-99</small>
                            </div>

                            <div class="form-actions">
                                <button class="primary-btn" data-action="next-stats">Next: Stats →</button>
                            </div>
                        </div>

                        <!-- Stats Tab -->
                        <div class="creator-tab" data-tab="stats" style="display: none;">
                            <h3>Stat Allocation</h3>

                            <div class="stats-budget">
                                <div class="budget-info">
                                    <span class="budget-label">Points Remaining:</span>
                                    <span class="budget-value" id="points-remaining">200</span>
                                </div>
                                <button class="secondary-btn small-btn" data-action="auto-distribute">Auto Fill</button>
                            </div>

                            <div class="stats-grid">
                                <!-- Power -->
                                <div class="stat-row">
                                    <div class="stat-info">
                                        <label class="stat-label">💪 Power</label>
                                        <small>Home run hitting ability</small>
                                    </div>
                                    <div class="stat-controls">
                                        <button class="stat-btn" data-action="decrease" data-stat="power">-</button>
                                        <input type="number" id="stat-power" class="stat-input" min="1" max="90" value="50">
                                        <button class="stat-btn" data-action="increase" data-stat="power">+</button>
                                    </div>
                                    <div class="stat-bar">
                                        <div class="stat-fill" data-stat="power" style="width: 50%"></div>
                                    </div>
                                </div>

                                <!-- Contact -->
                                <div class="stat-row">
                                    <div class="stat-info">
                                        <label class="stat-label">🎯 Contact</label>
                                        <small>Ability to make solid contact</small>
                                    </div>
                                    <div class="stat-controls">
                                        <button class="stat-btn" data-action="decrease" data-stat="contact">-</button>
                                        <input type="number" id="stat-contact" class="stat-input" min="1" max="90" value="50">
                                        <button class="stat-btn" data-action="increase" data-stat="contact">+</button>
                                    </div>
                                    <div class="stat-bar">
                                        <div class="stat-fill" data-stat="contact" style="width: 50%"></div>
                                    </div>
                                </div>

                                <!-- Speed -->
                                <div class="stat-row">
                                    <div class="stat-info">
                                        <label class="stat-label">⚡ Speed</label>
                                        <small>Running and base stealing speed</small>
                                    </div>
                                    <div class="stat-controls">
                                        <button class="stat-btn" data-action="decrease" data-stat="speed">-</button>
                                        <input type="number" id="stat-speed" class="stat-input" min="1" max="90" value="50">
                                        <button class="stat-btn" data-action="increase" data-stat="speed">+</button>
                                    </div>
                                    <div class="stat-bar">
                                        <div class="stat-fill" data-stat="speed" style="width: 50%"></div>
                                    </div>
                                </div>

                                <!-- Defense -->
                                <div class="stat-row">
                                    <div class="stat-info">
                                        <label class="stat-label">🛡️ Defense</label>
                                        <small>Fielding and catching ability</small>
                                    </div>
                                    <div class="stat-controls">
                                        <button class="stat-btn" data-action="decrease" data-stat="defense">-</button>
                                        <input type="number" id="stat-defense" class="stat-input" min="1" max="90" value="50">
                                        <button class="stat-btn" data-action="increase" data-stat="defense">+</button>
                                    </div>
                                    <div class="stat-bar">
                                        <div class="stat-fill" data-stat="defense" style="width: 50%"></div>
                                    </div>
                                </div>

                                <!-- Arm -->
                                <div class="stat-row">
                                    <div class="stat-info">
                                        <label class="stat-label">💪 Arm Strength</label>
                                        <small>Throwing power and velocity</small>
                                    </div>
                                    <div class="stat-controls">
                                        <button class="stat-btn" data-action="decrease" data-stat="arm">-</button>
                                        <input type="number" id="stat-arm" class="stat-input" min="1" max="90" value="50">
                                        <button class="stat-btn" data-action="increase" data-stat="arm">+</button>
                                    </div>
                                    <div class="stat-bar">
                                        <div class="stat-fill" data-stat="arm" style="width: 50%"></div>
                                    </div>
                                </div>

                                <!-- Accuracy -->
                                <div class="stat-row">
                                    <div class="stat-info">
                                        <label class="stat-label">🎯 Accuracy</label>
                                        <small>Throwing precision and control</small>
                                    </div>
                                    <div class="stat-controls">
                                        <button class="stat-btn" data-action="decrease" data-stat="accuracy">-</button>
                                        <input type="number" id="stat-accuracy" class="stat-input" min="1" max="90" value="50">
                                        <button class="stat-btn" data-action="increase" data-stat="accuracy">+</button>
                                    </div>
                                    <div class="stat-bar">
                                        <div class="stat-fill" data-stat="accuracy" style="width: 50%"></div>
                                    </div>
                                </div>
                            </div>

                            <div class="form-actions">
                                <button class="secondary-btn" data-action="prev-basic">← Back</button>
                                <button class="primary-btn" data-action="next-appearance">Next: Appearance →</button>
                            </div>
                        </div>

                        <!-- Appearance Tab -->
                        <div class="creator-tab" data-tab="appearance" style="display: none;">
                            <h3>Appearance Customization</h3>

                            <!-- Skin Tone -->
                            <div class="form-group">
                                <label>Skin Tone</label>
                                <div class="appearance-grid" id="skin-tone-grid"></div>
                            </div>

                            <!-- Jersey Color -->
                            <div class="form-group">
                                <label>Jersey Color</label>
                                <div class="appearance-grid" id="jersey-color-grid"></div>
                            </div>

                            <!-- Batting Stance -->
                            <div class="form-group">
                                <label>Batting Stance</label>
                                <div class="stance-grid" id="batting-stance-grid"></div>
                            </div>

                            <!-- Pitching Motion -->
                            <div class="form-group">
                                <label>Pitching Motion</label>
                                <div class="stance-grid" id="pitching-motion-grid"></div>
                            </div>

                            <div class="form-actions">
                                <button class="secondary-btn" data-action="prev-stats">← Back</button>
                                <button class="primary-btn" data-action="next-abilities">Next: Abilities →</button>
                            </div>
                        </div>

                        <!-- Abilities Tab -->
                        <div class="creator-tab" data-tab="abilities" style="display: none;">
                            <h3>Special Abilities</h3>
                            <p class="abilities-info">Choose up to 3 abilities. Only one can be Ultimate tier.</p>

                            <div class="abilities-selected" id="abilities-selected">
                                <h4>Selected Abilities (<span id="ability-count">0</span>/3)</h4>
                                <div class="selected-abilities-list" id="selected-abilities-list">
                                    <div class="no-abilities">No abilities selected yet</div>
                                </div>
                            </div>

                            <div class="abilities-available">
                                <h4>Available Abilities</h4>

                                <!-- Ability Category Tabs -->
                                <div class="ability-category-tabs">
                                    <button class="category-tab active" data-category="batting">⚾ Batting</button>
                                    <button class="category-tab" data-category="fielding">🧤 Fielding</button>
                                    <button class="category-tab" data-category="pitching">🎯 Pitching</button>
                                    <button class="category-tab" data-category="baserunning">💨 Base Running</button>
                                </div>

                                <!-- Ability Lists -->
                                <div class="ability-lists" id="ability-lists"></div>
                            </div>

                            <div class="form-actions">
                                <button class="secondary-btn" data-action="prev-appearance">← Back</button>
                                <button class="primary-btn" data-action="finish">Finish & Save</button>
                            </div>
                        </div>
                    </div>

                    <!-- Right Panel: Preview -->
                    <div class="creator-preview">
                        <h3>Character Preview</h3>

                        <div class="preview-card">
                            <div class="preview-header">
                                <div class="preview-number" id="preview-number">0</div>
                                <div class="preview-name" id="preview-name">Unnamed</div>
                                <div class="preview-position" id="preview-position">CF</div>
                            </div>

                            <div class="preview-avatar" id="preview-avatar">
                                <div class="avatar-placeholder">⚾</div>
                            </div>

                            <div class="preview-ratings">
                                <h4>Overall Rating</h4>
                                <div class="overall-rating" id="overall-rating">50</div>

                                <div class="rating-breakdown">
                                    <div class="rating-item">
                                        <span class="rating-label">Batting</span>
                                        <span class="rating-value" id="rating-batting">50</span>
                                    </div>
                                    <div class="rating-item">
                                        <span class="rating-label">Power</span>
                                        <span class="rating-value" id="rating-power">50</span>
                                    </div>
                                    <div class="rating-item">
                                        <span class="rating-label">Fielding</span>
                                        <span class="rating-value" id="rating-fielding">50</span>
                                    </div>
                                    <div class="rating-item">
                                        <span class="rating-label">Speed</span>
                                        <span class="rating-value" id="rating-baserunning">50</span>
                                    </div>
                                </div>
                            </div>

                            <div class="preview-abilities" id="preview-abilities">
                                <h4>Abilities</h4>
                                <div class="abilities-preview-list">
                                    <div class="no-abilities-preview">No abilities selected</div>
                                </div>
                            </div>
                        </div>

                        <div class="validation-status" id="validation-status"></div>
                    </div>
                </div>
            </div>
        `;

        return screen;
    }

    show(options = {}) {
        super.show(options);

        // Start new character or load existing
        if (options.characterId) {
            const characters = this.characterCreator.getSavedCharacters();
            const character = characters.find(c => c.id === options.characterId);
            if (character) {
                this.characterCreator.loadCharacter(character);
            }
        } else {
            this.characterCreator.startNewCharacter();
        }

        this.setupEventListeners();
        this.renderAppearanceOptions();
        this.renderAbilityOptions();
        this.refreshDisplay();
        this.switchTab('basic');
    }

    hide() {
        super.hide();
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }

    setupEventListeners() {
        // Navigation
        this.element.querySelector('[data-action="back"]').onclick = () => this.handleBack();
        this.element.querySelector('[data-action="save"]').onclick = () => this.handleSave();
        this.element.querySelector('[data-action="preset"]').onclick = () => this.handlePreset();

        // Tab navigation
        this.element.querySelector('[data-action="next-stats"]').onclick = () => this.switchTab('stats');
        this.element.querySelector('[data-action="next-appearance"]').onclick = () => this.switchTab('appearance');
        this.element.querySelector('[data-action="next-abilities"]').onclick = () => this.switchTab('abilities');
        this.element.querySelector('[data-action="prev-basic"]').onclick = () => this.switchTab('basic');
        this.element.querySelector('[data-action="prev-stats"]').onclick = () => this.switchTab('stats');
        this.element.querySelector('[data-action="prev-appearance"]').onclick = () => this.switchTab('appearance');
        this.element.querySelector('[data-action="finish"]').onclick = () => this.handleSave();

        // Basic info
        this.element.querySelector('#char-name').oninput = (e) => {
            this.characterCreator.updateBasicInfo({ name: e.target.value });
        };

        this.element.querySelector('#char-position').onchange = (e) => {
            this.characterCreator.updateBasicInfo({ position: e.target.value });
        };

        this.element.querySelector('#char-number').onchange = (e) => {
            this.characterCreator.updateBasicInfo({ jerseyNumber: e.target.value });
        };

        // Stats
        this.element.querySelector('[data-action="auto-distribute"]').onclick = () => {
            this.characterCreator.autoDistributePoints();
        };

        // Stat buttons and inputs
        this.element.querySelectorAll('.stat-btn').forEach(btn => {
            btn.onclick = () => this.handleStatButton(btn);
        });

        this.element.querySelectorAll('.stat-input').forEach(input => {
            input.oninput = () => this.handleStatInput(input);
        });

        // Ability category tabs
        this.element.querySelectorAll('.category-tab').forEach(tab => {
            tab.onclick = () => this.switchAbilityCategory(tab.dataset.category);
        });
    }

    switchTab(tabName) {
        this.currentTab = tabName;

        // Update progress indicators
        this.element.querySelectorAll('.progress-item').forEach(item => {
            item.classList.remove('active', 'completed');
            const step = item.dataset.step;

            if (step === tabName) {
                item.classList.add('active');
            } else {
                const steps = ['basic', 'stats', 'appearance', 'abilities'];
                const currentIndex = steps.indexOf(tabName);
                const itemIndex = steps.indexOf(step);
                if (itemIndex < currentIndex) {
                    item.classList.add('completed');
                }
            }
        });

        // Show/hide tabs
        this.element.querySelectorAll('.creator-tab').forEach(tab => {
            tab.style.display = tab.dataset.tab === tabName ? 'block' : 'none';
        });
    }

    handleStatButton(button) {
        const stat = button.dataset.stat;
        const action = button.dataset.action;
        const input = this.element.querySelector(`#stat-${stat}`);
        const currentValue = parseInt(input.value);

        try {
            if (action === 'increase') {
                this.characterCreator.updateStat(stat, currentValue + 1);
            } else if (action === 'decrease') {
                this.characterCreator.updateStat(stat, currentValue - 1);
            }
        } catch (error) {
            this.uiManager.showNotification({
                type: 'error',
                message: error.message,
                duration: 3000
            });
        }
    }

    handleStatInput(input) {
        const stat = input.id.replace('stat-', '');
        const value = parseInt(input.value);

        try {
            this.characterCreator.updateStat(stat, value);
        } catch (error) {
            this.uiManager.showNotification({
                type: 'error',
                message: error.message,
                duration: 3000
            });
            // Revert to current value
            input.value = this.characterCreator.getCharacter().stats[stat];
        }
    }

    renderAppearanceOptions() {
        const character = this.characterCreator.getCharacter();
        const options = this.characterCreator.appearanceOptions;

        // Skin tone
        const skinToneGrid = this.element.querySelector('#skin-tone-grid');
        skinToneGrid.innerHTML = options.skinTones.map(tone => `
            <button class="appearance-option ${character.appearance.skinTone === tone.id ? 'selected' : ''}"
                    data-type="skinTone" data-value="${tone.id}"
                    style="background-color: ${tone.color}">
                <span class="option-name">${tone.name}</span>
            </button>
        `).join('');

        // Jersey color
        const jerseyGrid = this.element.querySelector('#jersey-color-grid');
        jerseyGrid.innerHTML = options.jerseyColors.map(color => `
            <button class="appearance-option ${character.appearance.jerseyColor === color.id ? 'selected' : ''}"
                    data-type="jerseyColor" data-value="${color.id}"
                    style="background-color: ${color.color}; color: ${color.id === 'white' ? '#000' : '#fff'}">
                <span class="option-name">${color.name}</span>
            </button>
        `).join('');

        // Batting stance
        const stanceGrid = this.element.querySelector('#batting-stance-grid');
        stanceGrid.innerHTML = options.battingStances.map(stance => `
            <button class="stance-option ${character.appearance.battingStance === stance.id ? 'selected' : ''}"
                    data-type="battingStance" data-value="${stance.id}">
                <div class="stance-name">${stance.name}</div>
                <div class="stance-desc">${stance.description}</div>
            </button>
        `).join('');

        // Pitching motion
        const motionGrid = this.element.querySelector('#pitching-motion-grid');
        motionGrid.innerHTML = options.pitchingMotions.map(motion => `
            <button class="stance-option ${character.appearance.pitchingMotion === motion.id ? 'selected' : ''}"
                    data-type="pitchingMotion" data-value="${motion.id}">
                <div class="stance-name">${motion.name}</div>
                <div class="stance-desc">${motion.description}</div>
            </button>
        `).join('');

        // Add click handlers
        this.element.querySelectorAll('.appearance-option, .stance-option').forEach(btn => {
            btn.onclick = () => {
                this.characterCreator.updateAppearance(btn.dataset.type, btn.dataset.value);
                this.renderAppearanceOptions(); // Re-render to update selected state
            };
        });
    }

    renderAbilityOptions() {
        const lists = this.element.querySelector('#ability-lists');
        const abilities = this.characterCreator.getAvailableAbilities();

        lists.innerHTML = Object.entries(abilities).map(([category, abilityList]) => `
            <div class="ability-category-list" data-category="${category}" style="display: ${category === 'batting' ? 'block' : 'none'}">
                ${abilityList.map(ability => this.renderAbilityCard(ability)).join('')}
            </div>
        `).join('');

        // Add click handlers
        this.element.querySelectorAll('.ability-card').forEach(card => {
            card.onclick = () => this.handleAbilityClick(card.dataset.abilityId);
        });
    }

    renderAbilityCard(ability) {
        const character = this.characterCreator.getCharacter();
        const isSelected = character.abilities.some(a => a.id === ability.id);
        const tierClass = `tier-${ability.tier}`;

        return `
            <div class="ability-card ${tierClass} ${isSelected ? 'selected' : ''}" data-ability-id="${ability.id}">
                <div class="ability-header">
                    <span class="ability-name">${ability.name}</span>
                    <span class="ability-tier">${ability.tier}</span>
                </div>
                <div class="ability-description">${ability.description}</div>
                <div class="ability-cooldown">Cooldown: ${ability.cooldown === 99 ? 'Once per game' : ability.cooldown + ' innings'}</div>
            </div>
        `;
    }

    switchAbilityCategory(category) {
        // Update tabs
        this.element.querySelectorAll('.category-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.category === category);
        });

        // Show/hide lists
        this.element.querySelectorAll('.ability-category-list').forEach(list => {
            list.style.display = list.dataset.category === category ? 'block' : 'none';
        });
    }

    handleAbilityClick(abilityId) {
        const character = this.characterCreator.getCharacter();
        const isSelected = character.abilities.some(a => a.id === abilityId);

        try {
            if (isSelected) {
                this.characterCreator.removeAbility(abilityId);
            } else {
                this.characterCreator.addAbility(abilityId);
            }
            this.renderAbilityOptions();
        } catch (error) {
            this.uiManager.showNotification({
                type: 'error',
                message: error.message,
                duration: 3000
            });
        }
    }

    refreshDisplay() {
        const character = this.characterCreator.getCharacter();

        // Update basic info
        this.element.querySelector('#char-name').value = character.name;
        this.element.querySelector('#char-position').value = character.position;
        this.element.querySelector('#char-number').value = character.jerseyNumber;

        // Update stats
        Object.entries(character.stats).forEach(([stat, value]) => {
            const input = this.element.querySelector(`#stat-${stat}`);
            if (input) {
                input.value = value;
                const fill = this.element.querySelector(`.stat-fill[data-stat="${stat}"]`);
                if (fill) {
                    fill.style.width = `${value}%`;
                }
            }
        });

        // Update points remaining
        const remaining = this.characterCreator.getRemainingPoints();
        this.element.querySelector('#points-remaining').textContent = remaining;
        this.element.querySelector('#points-remaining').classList.toggle('negative', remaining < 0);

        // Update ability count
        this.element.querySelector('#ability-count').textContent = character.abilities.length;

        // Update selected abilities list
        const selectedList = this.element.querySelector('#selected-abilities-list');
        if (character.abilities.length === 0) {
            selectedList.innerHTML = '<div class="no-abilities">No abilities selected yet</div>';
        } else {
            selectedList.innerHTML = character.abilities.map(ability => `
                <div class="selected-ability tier-${ability.tier}">
                    <span class="ability-name">${ability.name}</span>
                    <button class="remove-ability" data-ability-id="${ability.id}">×</button>
                </div>
            `).join('');

            selectedList.querySelectorAll('.remove-ability').forEach(btn => {
                btn.onclick = () => {
                    this.characterCreator.removeAbility(btn.dataset.abilityId);
                    this.renderAbilityOptions();
                };
            });
        }

        // Update preview
        this.updatePreview();

        // Update validation
        this.updateValidation();
    }

    updatePreview() {
        const character = this.characterCreator.getCharacter();
        const ratings = character.ratings;

        this.element.querySelector('#preview-name').textContent = character.name || 'Unnamed';
        this.element.querySelector('#preview-position').textContent = character.position;
        this.element.querySelector('#preview-number').textContent = character.jerseyNumber;

        this.element.querySelector('#overall-rating').textContent = ratings.overall || 50;
        this.element.querySelector('#rating-batting').textContent = ratings.batting || 50;
        this.element.querySelector('#rating-power').textContent = ratings.power || 50;
        this.element.querySelector('#rating-fielding').textContent = ratings.fielding || 50;
        this.element.querySelector('#rating-baserunning').textContent = ratings.baserunning || 50;

        // Update abilities preview
        const abilitiesPreview = this.element.querySelector('.abilities-preview-list');
        if (character.abilities.length === 0) {
            abilitiesPreview.innerHTML = '<div class="no-abilities-preview">No abilities selected</div>';
        } else {
            abilitiesPreview.innerHTML = character.abilities.map(ability => `
                <div class="ability-preview-item tier-${ability.tier}">${ability.name}</div>
            `).join('');
        }
    }

    updateValidation() {
        const validation = this.characterCreator.validateCharacter();
        const statusEl = this.element.querySelector('#validation-status');

        if (validation.valid) {
            statusEl.innerHTML = '<div class="validation-success">✓ Character is ready to save!</div>';
        } else {
            statusEl.innerHTML = `
                <div class="validation-errors">
                    <strong>Complete these steps:</strong>
                    <ul>
                        ${validation.errors.map(error => `<li>${error}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
    }

    handleBack() {
        this.uiManager.showScreen('main-menu');
    }

    async handleSave() {
        try {
            const character = this.characterCreator.saveCharacter();

            await this.uiManager.showNotification({
                type: 'success',
                title: 'Character Saved!',
                message: `${character.name} has been created successfully.`,
                duration: 3000
            });

            this.uiManager.showScreen('main-menu');

        } catch (error) {
            this.uiManager.showNotification({
                type: 'error',
                title: 'Save Failed',
                message: error.message,
                duration: 4000
            });
        }
    }

    async handlePreset() {
        const presets = [
            { id: 'powerHitter', name: '💪 Power Slugger', desc: 'Maximum home run hitting' },
            { id: 'contactHitter', name: '🎯 Contact Specialist', desc: 'High batting average' },
            { id: 'speedster', name: '⚡ Speed Demon', desc: 'Base stealing master' },
            { id: 'ace', name: '🎯 Ace Pitcher', desc: 'Dominant on the mound' },
            { id: 'goldGlove', name: '🧤 Gold Glove', desc: 'Defensive excellence' },
            { id: 'balanced', name: '⭐ All-Arounder', desc: 'Well-rounded player' }
        ];

        const html = `
            <div class="preset-selector">
                <p>Choose a preset to start with:</p>
                ${presets.map(preset => `
                    <button class="preset-btn" data-preset="${preset.id}">
                        <div class="preset-name">${preset.name}</div>
                        <div class="preset-desc">${preset.desc}</div>
                    </button>
                `).join('')}
            </div>
        `;

        const modal = this.uiManager.showModal({
            title: 'Load Preset',
            content: html,
            showCancel: true
        });

        modal.element.querySelectorAll('.preset-btn').forEach(btn => {
            btn.onclick = () => {
                this.characterCreator.createPreset(btn.dataset.preset);
                this.switchTab('basic');
                modal.close();
            };
        });
    }
}

// Saved Characters Screen
class SavedCharactersScreen extends BaseScreen {
    constructor(uiManager, characterCreator) {
        super(uiManager);
        this.characterCreator = characterCreator;
    }

    create() {
        const screen = document.createElement('div');
        screen.className = 'screen saved-characters-screen';
        screen.id = 'saved-characters';

        screen.innerHTML = `
            <div class="saved-characters-container">
                <div class="screen-header">
                    <button class="back-btn" data-action="back">← Back</button>
                    <h2>My Characters</h2>
                    <button class="primary-btn" data-action="create-new">+ Create New</button>
                </div>

                <div class="characters-grid" id="characters-grid">
                    <!-- Characters will be rendered here -->
                </div>
            </div>
        `;

        return screen;
    }

    show(options = {}) {
        super.show(options);
        this.setupEventListeners();
        this.renderCharacters();
    }

    setupEventListeners() {
        this.element.querySelector('[data-action="back"]').onclick = () => {
            this.uiManager.showScreen('main-menu');
        };

        this.element.querySelector('[data-action="create-new"]').onclick = () => {
            this.uiManager.showScreen('character-creator');
        };
    }

    renderCharacters() {
        const characters = this.characterCreator.getSavedCharacters();
        const grid = this.element.querySelector('#characters-grid');

        if (characters.length === 0) {
            grid.innerHTML = `
                <div class="no-characters">
                    <div class="no-characters-icon">⚾</div>
                    <h3>No Characters Yet</h3>
                    <p>Create your first custom character to get started!</p>
                    <button class="primary-btn" data-action="create-first">Create Character</button>
                </div>
            `;

            grid.querySelector('[data-action="create-first"]').onclick = () => {
                this.uiManager.showScreen('character-creator');
            };
            return;
        }

        grid.innerHTML = characters.map(char => `
            <div class="character-card" data-character-id="${char.id}">
                <div class="character-card-header">
                    <div class="character-number">${char.jerseyNumber}</div>
                    <div class="character-position">${char.position}</div>
                </div>
                <div class="character-name">${char.name}</div>
                <div class="character-overall">Overall: ${char.ratings.overall}</div>
                <div class="character-abilities">
                    ${char.abilities.slice(0, 3).map(a => `<span class="ability-badge">${a.name}</span>`).join('')}
                </div>
                <div class="character-actions">
                    <button class="edit-btn" data-action="edit" data-id="${char.id}">Edit</button>
                    <button class="delete-btn" data-action="delete" data-id="${char.id}">Delete</button>
                    <button class="export-btn" data-action="export" data-id="${char.id}">Export</button>
                </div>
            </div>
        `).join('');

        // Add event listeners
        grid.querySelectorAll('[data-action="edit"]').forEach(btn => {
            btn.onclick = () => {
                this.uiManager.showScreen('character-creator', { characterId: btn.dataset.id });
            };
        });

        grid.querySelectorAll('[data-action="delete"]').forEach(btn => {
            btn.onclick = () => this.handleDelete(btn.dataset.id);
        });

        grid.querySelectorAll('[data-action="export"]').forEach(btn => {
            btn.onclick = () => this.handleExport(btn.dataset.id);
        });
    }

    async handleDelete(characterId) {
        const confirmed = await this.uiManager.confirm(
            'Delete Character',
            'Are you sure you want to delete this character? This cannot be undone.'
        );

        if (confirmed) {
            this.characterCreator.deleteCharacter(characterId);
            this.renderCharacters();
            this.uiManager.showNotification({
                type: 'success',
                message: 'Character deleted',
                duration: 2000
            });
        }
    }

    handleExport(characterId) {
        const json = this.characterCreator.exportCharacter(characterId);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `character-${characterId}.json`;
        a.click();
        URL.revokeObjectURL(url);

        this.uiManager.showNotification({
            type: 'success',
            message: 'Character exported',
            duration: 2000
        });
    }
}
