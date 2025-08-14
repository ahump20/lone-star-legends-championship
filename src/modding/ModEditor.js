export class ModEditor {
    constructor(moddingAPI) {
        this.api = moddingAPI;
        this.currentProject = null;
        this.templates = new Map();
        this.previewEngine = new PreviewEngine();
        this.codeEditor = null;
        
        this.initializeTemplates();
        this.setupEditor();
    }

    initializeTemplates() {
        this.templates.set('simple_player', {
            name: 'Simple Player Mod',
            description: 'Create a custom player with basic stats',
            files: {
                'main.js': this.getPlayerTemplate(),
                'manifest.json': this.getManifestTemplate('player')
            }
        });

        this.templates.set('team_mod', {
            name: 'Custom Team Mod',
            description: 'Create a new team with custom players',
            files: {
                'main.js': this.getTeamTemplate(),
                'manifest.json': this.getManifestTemplate('team')
            }
        });

        this.templates.set('gameplay_mod', {
            name: 'Gameplay Modification',
            description: 'Modify game mechanics and rules',
            files: {
                'main.js': this.getGameplayTemplate(),
                'manifest.json': this.getManifestTemplate('gameplay')
            }
        });

        this.templates.set('ui_mod', {
            name: 'UI Enhancement Mod',
            description: 'Add new UI elements and interfaces',
            files: {
                'main.js': this.getUITemplate(),
                'styles.css': this.getCSSTemplate(),
                'manifest.json': this.getManifestTemplate('ui')
            }
        });
    }

    setupEditor() {
        this.editorConfig = {
            theme: 'dark',
            language: 'javascript',
            autoIndent: true,
            lineNumbers: true,
            autoCompletion: true,
            syntaxHighlighting: true,
            errorChecking: true
        };
    }

    // PROJECT MANAGEMENT
    createNewProject(templateId, projectName) {
        const template = this.templates.get(templateId);
        if (!template) {
            throw new Error('Template not found');
        }

        this.currentProject = {
            id: this.generateProjectId(),
            name: projectName,
            template: templateId,
            files: new Map(),
            manifest: null,
            lastModified: Date.now(),
            created: Date.now()
        };

        // Copy template files
        for (const [filename, content] of Object.entries(template.files)) {
            this.currentProject.files.set(filename, {
                name: filename,
                content: content.replace('{{PROJECT_NAME}}', projectName),
                lastModified: Date.now(),
                saved: true
            });
        }

        this.parseManifest();
        return this.currentProject.id;
    }

    generateProjectId() {
        return `mod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    loadProject(projectData) {
        this.currentProject = {
            id: projectData.id || this.generateProjectId(),
            name: projectData.name,
            template: projectData.template || 'custom',
            files: new Map(),
            manifest: null,
            lastModified: Date.now(),
            created: projectData.created || Date.now()
        };

        // Load files
        for (const [filename, fileData] of Object.entries(projectData.files)) {
            this.currentProject.files.set(filename, {
                name: filename,
                content: fileData.content || fileData,
                lastModified: fileData.lastModified || Date.now(),
                saved: true
            });
        }

        this.parseManifest();
        return this.currentProject.id;
    }

    saveProject() {
        if (!this.currentProject) {
            throw new Error('No project loaded');
        }

        const projectData = {
            id: this.currentProject.id,
            name: this.currentProject.name,
            template: this.currentProject.template,
            files: {},
            created: this.currentProject.created,
            lastModified: Date.now()
        };

        for (const [filename, file] of this.currentProject.files) {
            projectData.files[filename] = {
                content: file.content,
                lastModified: file.lastModified
            };
        }

        // Save to localStorage
        localStorage.setItem(`mod_project_${this.currentProject.id}`, JSON.stringify(projectData));
        
        // Mark all files as saved
        for (const file of this.currentProject.files.values()) {
            file.saved = true;
        }

        return projectData;
    }

    // FILE MANAGEMENT
    createFile(filename, content = '') {
        if (!this.currentProject) {
            throw new Error('No project loaded');
        }

        if (this.currentProject.files.has(filename)) {
            throw new Error('File already exists');
        }

        this.currentProject.files.set(filename, {
            name: filename,
            content,
            lastModified: Date.now(),
            saved: false
        });

        return filename;
    }

    deleteFile(filename) {
        if (!this.currentProject) {
            throw new Error('No project loaded');
        }

        if (filename === 'manifest.json') {
            throw new Error('Cannot delete manifest file');
        }

        return this.currentProject.files.delete(filename);
    }

    getFile(filename) {
        if (!this.currentProject) {
            throw new Error('No project loaded');
        }

        return this.currentProject.files.get(filename);
    }

    updateFile(filename, content) {
        const file = this.getFile(filename);
        if (!file) {
            throw new Error('File not found');
        }

        file.content = content;
        file.lastModified = Date.now();
        file.saved = false;

        if (filename === 'manifest.json') {
            this.parseManifest();
        }

        this.validateFile(filename);
        return file;
    }

    // VALIDATION
    validateFile(filename) {
        const file = this.getFile(filename);
        if (!file) return { valid: false, errors: ['File not found'] };

        const errors = [];

        if (filename.endsWith('.js')) {
            errors.push(...this.validateJavaScript(file.content));
        } else if (filename === 'manifest.json') {
            errors.push(...this.validateManifest(file.content));
        } else if (filename.endsWith('.css')) {
            errors.push(...this.validateCSS(file.content));
        }

        file.errors = errors;
        return { valid: errors.length === 0, errors };
    }

    validateJavaScript(code) {
        const errors = [];
        
        try {
            // Basic syntax check
            new Function(code);
        } catch (error) {
            errors.push(`Syntax error: ${error.message}`);
        }

        // Check for forbidden functions
        const forbidden = ['eval', 'Function', 'fetch', 'XMLHttpRequest'];
        forbidden.forEach(fn => {
            if (code.includes(fn)) {
                errors.push(`Forbidden function: ${fn}`);
            }
        });

        return errors;
    }

    validateManifest(content) {
        const errors = [];
        
        try {
            const manifest = JSON.parse(content);
            
            const required = ['id', 'name', 'version', 'author'];
            required.forEach(field => {
                if (!manifest[field]) {
                    errors.push(`Missing required field: ${field}`);
                }
            });

            if (manifest.version && !/^\d+\.\d+\.\d+$/.test(manifest.version)) {
                errors.push('Invalid version format (use semantic versioning)');
            }

            if (manifest.permissions) {
                const validPermissions = [
                    'MODIFY_GAME_STATE', 'CREATE_PLAYERS', 'CREATE_TEAMS',
                    'MODIFY_UI', 'DISPATCH_EVENTS', 'FILE_ACCESS'
                ];
                manifest.permissions.forEach(perm => {
                    if (!validPermissions.includes(perm)) {
                        errors.push(`Invalid permission: ${perm}`);
                    }
                });
            }
        } catch (error) {
            errors.push('Invalid JSON format');
        }

        return errors;
    }

    validateCSS(content) {
        const errors = [];
        
        // Basic CSS validation
        if (content.includes('javascript:')) {
            errors.push('JavaScript URLs not allowed in CSS');
        }

        if (content.includes('@import')) {
            errors.push('@import rules not allowed');
        }

        return errors;
    }

    parseManifest() {
        const manifestFile = this.getFile('manifest.json');
        if (!manifestFile) return;

        try {
            this.currentProject.manifest = JSON.parse(manifestFile.content);
        } catch (error) {
            console.error('Invalid manifest:', error);
            this.currentProject.manifest = null;
        }
    }

    // TESTING & PREVIEW
    testMod() {
        if (!this.currentProject || !this.currentProject.manifest) {
            throw new Error('Project or manifest not loaded');
        }

        const validation = this.validateProject();
        if (!validation.valid) {
            return { success: false, errors: validation.errors };
        }

        try {
            const modPackage = this.buildModPackage();
            const result = this.previewEngine.loadMod(modPackage);
            
            return {
                success: true,
                modId: result.modId,
                preview: this.previewEngine.getPreview()
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    validateProject() {
        const errors = [];
        
        if (!this.currentProject) {
            errors.push('No project loaded');
            return { valid: false, errors };
        }

        // Validate all files
        for (const [filename] of this.currentProject.files) {
            const fileValidation = this.validateFile(filename);
            if (!fileValidation.valid) {
                errors.push(`${filename}: ${fileValidation.errors.join(', ')}`);
            }
        }

        // Check required files
        if (!this.currentProject.files.has('manifest.json')) {
            errors.push('Missing manifest.json');
        }

        if (!this.currentProject.files.has('main.js')) {
            errors.push('Missing main.js');
        }

        return { valid: errors.length === 0, errors };
    }

    buildModPackage() {
        const modPackage = {
            manifest: this.currentProject.manifest,
            files: {}
        };

        for (const [filename, file] of this.currentProject.files) {
            modPackage.files[filename] = file.content;
        }

        return modPackage;
    }

    // EXPORT/PUBLISHING
    exportMod() {
        const validation = this.validateProject();
        if (!validation.valid) {
            throw new Error(`Cannot export: ${validation.errors.join(', ')}`);
        }

        const modPackage = this.buildModPackage();
        const exportData = {
            ...modPackage,
            exported: new Date().toISOString(),
            exportVersion: '1.0.0'
        };

        return {
            data: exportData,
            filename: `${this.currentProject.manifest.id}_v${this.currentProject.manifest.version}.json`,
            blob: new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
        };
    }

    publishMod(options = {}) {
        const exportResult = this.exportMod();
        
        // Simulate publishing process
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    modId: this.currentProject.manifest.id,
                    version: this.currentProject.manifest.version,
                    publishDate: new Date().toISOString(),
                    downloadUrl: `https://example.com/mods/${this.currentProject.manifest.id}`
                });
            }, 2000);
        });
    }

    // TEMPLATES
    getPlayerTemplate() {
        return `// {{PROJECT_NAME}} - Custom Player Mod

// Register this mod with the game
const modInfo = {
    id: '{{PROJECT_NAME}}'.toLowerCase().replace(/\\s+/g, '_'),
    name: '{{PROJECT_NAME}}',
    version: '1.0.0',
    author: 'Your Name',
    description: 'A custom player modification',
    permissions: ['CREATE_PLAYERS']
};

// Register the mod
const result = window.moddingAPI.registerMod(modInfo);
if (!result.success) {
    console.error('Failed to register mod:', result.error);
    return;
}

// Create custom player
const playerData = {
    name: 'Custom Player',
    position: 'CF',
    stats: {
        power: 85,
        speed: 90,
        contact: 75,
        fielding: 80,
        arm: 70
    },
    appearance: {
        uniform: '#FF0000',
        skin: '#D4A574',
        height: 72, // inches
        weight: 185  // pounds
    }
};

// Hook into game start to add our player
window.moddingAPI.registerHook(modInfo.id, 'gameStart', (data) => {
    try {
        const player = window.moddingAPI.createCustomPlayer(modInfo.id, playerData);
        console.log('Custom player created:', player.name);
    } catch (error) {
        console.error('Failed to create player:', error);
    }
});

console.log('{{PROJECT_NAME}} mod loaded successfully!');`;
    }

    getTeamTemplate() {
        return `// {{PROJECT_NAME}} - Custom Team Mod

const modInfo = {
    id: '{{PROJECT_NAME}}'.toLowerCase().replace(/\\s+/g, '_'),
    name: '{{PROJECT_NAME}}',
    version: '1.0.0',
    author: 'Your Name',
    description: 'A custom team modification',
    permissions: ['CREATE_TEAMS', 'CREATE_PLAYERS']
};

window.moddingAPI.registerMod(modInfo);

// Custom team data
const teamData = {
    name: 'Custom Team',
    city: 'Mod City',
    abbreviation: 'MOD',
    colors: {
        primary: '#FF6B35',
        secondary: '#004E89',
        accent: '#FFFFFF'
    },
    logo: 'data:image/svg+xml;base64,...', // Base64 encoded logo
    stadium: 'Modder Stadium'
};

// Create roster
const roster = [
    { name: 'Player 1', position: 'C', stats: { power: 80, speed: 60, contact: 85 }},
    { name: 'Player 2', position: '1B', stats: { power: 90, speed: 50, contact: 75 }},
    { name: 'Player 3', position: '2B', stats: { power: 60, speed: 85, contact: 80 }},
    // Add more players...
];

window.moddingAPI.registerHook(modInfo.id, 'gameStart', (data) => {
    try {
        const team = window.moddingAPI.createCustomTeam(modInfo.id, teamData);
        
        roster.forEach(playerData => {
            const player = window.moddingAPI.createCustomPlayer(modInfo.id, playerData);
            team.addPlayer(player);
        });
        
        console.log('Custom team created:', team.name);
    } catch (error) {
        console.error('Failed to create team:', error);
    }
});`;
    }

    getGameplayTemplate() {
        return `// {{PROJECT_NAME}} - Gameplay Modification

const modInfo = {
    id: '{{PROJECT_NAME}}'.toLowerCase().replace(/\\s+/g, '_'),
    name: '{{PROJECT_NAME}}',
    version: '1.0.0',
    author: 'Your Name',
    description: 'Modifies core gameplay mechanics',
    permissions: ['MODIFY_GAME_STATE', 'DISPATCH_EVENTS']
};

window.moddingAPI.registerMod(modInfo);

// Modify pitch mechanics
window.moddingAPI.registerHook(modInfo.id, 'pitchThrown', (data) => {
    // Add wind effect to pitches
    if (data.pitch) {
        const windFactor = Math.random() * 0.1 - 0.05; // -5% to +5%
        data.pitch.velocity *= (1 + windFactor);
        
        console.log('Wind effect applied to pitch');
    }
    
    return data;
});

// Modify batting mechanics
window.moddingAPI.registerHook(modInfo.id, 'ballHit', (data) => {
    // Boost contact hits
    if (data.hit && data.hit.type === 'contact') {
        data.hit.power *= 1.1; // 10% power boost for contact hits
        console.log('Contact hit boosted');
    }
    
    return data;
});

// Add weather effects
window.moddingAPI.registerHook(modInfo.id, 'inningStart', (data) => {
    const weather = ['sunny', 'cloudy', 'windy', 'humid'][Math.floor(Math.random() * 4)];
    
    window.moddingAPI.modifyGameState(modInfo.id, {
        weather: weather,
        weatherEffects: getWeatherEffects(weather)
    });
    
    return data;
});

function getWeatherEffects(weather) {
    switch(weather) {
        case 'windy':
            return { flyBallReduction: 0.9, accuracyPenalty: 0.05 };
        case 'humid':
            return { fatigueIncrease: 1.2 };
        default:
            return {};
    }
}`;
    }

    getUITemplate() {
        return `// {{PROJECT_NAME}} - UI Enhancement

const modInfo = {
    id: '{{PROJECT_NAME}}'.toLowerCase().replace(/\\s+/g, '_'),
    name: '{{PROJECT_NAME}}',
    version: '1.0.0',
    author: 'Your Name',
    description: 'Adds new UI elements and enhancements',
    permissions: ['MODIFY_UI', 'DISPATCH_EVENTS']
};

window.moddingAPI.registerMod(modInfo);

// Add custom scoreboard element
window.moddingAPI.registerHook(modInfo.id, 'gameStart', (data) => {
    const scoreboardElement = {
        type: 'div',
        position: { x: 10, y: 10 },
        size: { width: 300, height: 80 },
        text: '',
        style: {
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '10px',
            borderRadius: '5px',
            fontFamily: 'monospace'
        },
        events: {
            click: () => console.log('Scoreboard clicked!')
        }
    };
    
    const elementId = window.moddingAPI.addUIElement(modInfo.id, scoreboardElement);
    console.log('Custom scoreboard added:', elementId);
});

// Update scoreboard on score changes
window.moddingAPI.registerHook(modInfo.id, 'runScored', (data) => {
    const gameState = window.moddingAPI.getGameState();
    updateScoreboard(gameState);
    return data;
});

function updateScoreboard(gameState) {
    const scoreText = \`
Inning: \${gameState.inning} \${gameState.isBottomInning ? '(Bot)' : '(Top)'}
Score: \${gameState.score.home} - \${gameState.score.away}
Outs: \${gameState.outs}
Count: \${gameState.count.balls}-\${gameState.count.strikes}
    \`.trim();
    
    // Update scoreboard element text
    // (This would require additional API methods to update existing elements)
    console.log('Scoreboard updated:', scoreText);
}`;
    }

    getCSSTemplate() {
        return `/* {{PROJECT_NAME}} - Custom Styles */

.mod-scoreboard {
    position: fixed;
    top: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 15px;
    border-radius: 8px;
    font-family: 'Courier New', monospace;
    font-size: 14px;
    z-index: 1000;
    border: 2px solid #00ff88;
    box-shadow: 0 0 20px rgba(0, 255, 136, 0.3);
}

.mod-button {
    background: linear-gradient(145deg, #00ff88, #00d4ff);
    color: black;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s;
}

.mod-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 255, 136, 0.4);
}

.mod-panel {
    background: rgba(0, 0, 0, 0.9);
    border: 1px solid #333;
    border-radius: 6px;
    padding: 20px;
    margin: 10px;
}

.mod-text {
    color: #ffffff;
    text-shadow: 0 0 5px rgba(255, 255, 255, 0.2);
}

.mod-highlight {
    color: #00ff88;
    font-weight: bold;
}`;
    }

    getManifestTemplate(type) {
        const permissions = {
            player: ['CREATE_PLAYERS'],
            team: ['CREATE_TEAMS', 'CREATE_PLAYERS'],
            gameplay: ['MODIFY_GAME_STATE', 'DISPATCH_EVENTS'],
            ui: ['MODIFY_UI', 'DISPATCH_EVENTS']
        };

        return JSON.stringify({
            id: '{{PROJECT_NAME}}'.toLowerCase().replace(/\s+/g, '_'),
            name: '{{PROJECT_NAME}}',
            version: '1.0.0',
            author: 'Your Name',
            description: `A ${type} modification for Lone Star Legends`,
            apiVersion: '1.0.0',
            permissions: permissions[type] || [],
            dependencies: [],
            loadOrder: 1000,
            main: 'main.js',
            assets: []
        }, null, 2);
    }
}

class PreviewEngine {
    constructor() {
        this.previewState = {
            loaded: false,
            modId: null,
            gameState: this.createMockGameState(),
            ui: []
        };
    }

    loadMod(modPackage) {
        try {
            // Simulate mod loading
            const modId = modPackage.manifest.id;
            
            // Execute main.js in sandbox
            this.executeMod(modPackage.files['main.js'], modId);
            
            this.previewState.loaded = true;
            this.previewState.modId = modId;
            
            return { modId, success: true };
        } catch (error) {
            throw new Error(`Preview failed: ${error.message}`);
        }
    }

    executeMod(code, modId) {
        // Create a sandboxed environment for preview
        const sandbox = {
            window: {
                moddingAPI: this.createMockAPI(modId)
            },
            console: {
                log: (...args) => console.log(`[Preview:${modId}]`, ...args),
                error: (...args) => console.error(`[Preview:${modId}]`, ...args)
            }
        };

        // Execute the mod code
        const func = new Function('window', 'console', code);
        func(sandbox.window, sandbox.console);
    }

    createMockAPI(modId) {
        return {
            registerMod: (info) => ({ success: true, modId: info.id }),
            registerHook: (id, hook, callback) => {
                console.log(`[Preview] Hook registered: ${hook}`);
            },
            createCustomPlayer: (id, data) => {
                console.log(`[Preview] Player created: ${data.name}`);
                return { id: 'preview_player', ...data };
            },
            createCustomTeam: (id, data) => {
                console.log(`[Preview] Team created: ${data.name}`);
                return { id: 'preview_team', ...data };
            },
            addUIElement: (id, config) => {
                this.previewState.ui.push(config);
                console.log(`[Preview] UI element added: ${config.type}`);
                return 'preview_ui_element';
            },
            getGameState: () => this.previewState.gameState,
            modifyGameState: (id, changes) => {
                Object.assign(this.previewState.gameState, changes);
                console.log(`[Preview] Game state modified:`, changes);
            }
        };
    }

    createMockGameState() {
        return {
            inning: 5,
            isBottomInning: false,
            outs: 1,
            count: { balls: 2, strikes: 1 },
            score: { home: 3, away: 2 },
            runners: [1],
            currentBatter: 'preview_player',
            currentPitcher: 'preview_ai'
        };
    }

    getPreview() {
        return {
            gameState: this.previewState.gameState,
            uiElements: this.previewState.ui,
            logs: [], // Would contain execution logs
            performance: {
                loadTime: Math.random() * 100,
                memoryUsage: Math.random() * 1024 * 1024
            }
        };
    }

    reset() {
        this.previewState = {
            loaded: false,
            modId: null,
            gameState: this.createMockGameState(),
            ui: []
        };
    }
}