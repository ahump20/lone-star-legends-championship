export class ModdingAPI {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.registeredMods = new Map();
        this.hooks = new Map();
        this.resourceOverrides = new Map();
        this.validators = new Map();
        this.modManager = new ModManager();
        this.sandbox = new ModSandbox();
        
        this.initializeAPI();
    }

    initializeAPI() {
        this.registerCoreHooks();
        this.setupSecurityPolicies();
        this.initializeModLoader();
    }

    registerCoreHooks() {
        const coreHooks = [
            'gameStart', 'gameEnd', 'inningStart', 'inningEnd',
            'playerTurn', 'pitchThrown', 'ballHit', 'playerOut',
            'runScored', 'gameStateChange', 'playerAction',
            'aiDecision', 'menuOpen', 'settingsChange',
            'playerCreated', 'teamCreated', 'seasonStart',
            'statisticsUpdate', 'saveGame', 'loadGame'
        ];

        coreHooks.forEach(hook => {
            this.hooks.set(hook, []);
        });
    }

    // MOD REGISTRATION
    registerMod(modInfo) {
        try {
            this.validateModInfo(modInfo);
            
            const mod = {
                id: modInfo.id,
                name: modInfo.name,
                version: modInfo.version,
                author: modInfo.author,
                description: modInfo.description,
                permissions: modInfo.permissions || [],
                dependencies: modInfo.dependencies || [],
                files: new Map(),
                hooks: new Map(),
                resources: new Map(),
                enabled: false,
                loadOrder: modInfo.loadOrder || 1000,
                apiVersion: modInfo.apiVersion || '1.0.0'
            };

            this.registeredMods.set(modInfo.id, mod);
            return { success: true, modId: modInfo.id };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    validateModInfo(modInfo) {
        const required = ['id', 'name', 'version', 'author'];
        for (const field of required) {
            if (!modInfo[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        if (this.registeredMods.has(modInfo.id)) {
            throw new Error(`Mod with ID '${modInfo.id}' already registered`);
        }

        if (!this.isValidVersion(modInfo.version)) {
            throw new Error('Invalid version format');
        }
    }

    isValidVersion(version) {
        return /^\d+\.\d+\.\d+$/.test(version);
    }

    // HOOK SYSTEM
    registerHook(modId, hookName, callback, priority = 100) {
        if (!this.registeredMods.has(modId)) {
            throw new Error('Mod not registered');
        }

        if (!this.hooks.has(hookName)) {
            this.hooks.set(hookName, []);
        }

        const hookEntry = {
            modId,
            callback: this.sandbox.wrapCallback(callback, modId),
            priority,
            enabled: true
        };

        this.hooks.get(hookName).push(hookEntry);
        this.hooks.get(hookName).sort((a, b) => a.priority - b.priority);

        // Store in mod's hook registry
        const mod = this.registeredMods.get(modId);
        if (!mod.hooks.has(hookName)) {
            mod.hooks.set(hookName, []);
        }
        mod.hooks.get(hookName).push(hookEntry);
    }

    triggerHook(hookName, data = {}) {
        if (!this.hooks.has(hookName)) return data;

        const hookEntries = this.hooks.get(hookName);
        let result = { ...data };

        for (const entry of hookEntries) {
            if (!entry.enabled) continue;

            try {
                const hookResult = entry.callback(result);
                if (hookResult !== undefined) {
                    result = { ...result, ...hookResult };
                }
            } catch (error) {
                console.error(`Hook error in mod ${entry.modId}:`, error);
                this.handleModError(entry.modId, error);
            }
        }

        return result;
    }

    // RESOURCE SYSTEM
    registerResource(modId, resourceType, resourceId, data) {
        if (!this.registeredMods.has(modId)) {
            throw new Error('Mod not registered');
        }

        const resourceKey = `${resourceType}:${resourceId}`;
        const resource = {
            modId,
            type: resourceType,
            id: resourceId,
            data,
            overrides: null
        };

        this.resourceOverrides.set(resourceKey, resource);

        const mod = this.registeredMods.get(modId);
        mod.resources.set(resourceKey, resource);
    }

    getResource(resourceType, resourceId) {
        const resourceKey = `${resourceType}:${resourceId}`;
        
        if (this.resourceOverrides.has(resourceKey)) {
            return this.resourceOverrides.get(resourceKey).data;
        }

        return this.gameEngine.getOriginalResource(resourceType, resourceId);
    }

    // GAME STATE ACCESS
    getGameState() {
        return this.sandbox.createProxy(this.gameEngine.gameState);
    }

    modifyGameState(modId, changes) {
        if (!this.hasPermission(modId, 'MODIFY_GAME_STATE')) {
            throw new Error('Insufficient permissions');
        }

        return this.gameEngine.applyStateChanges(changes);
    }

    // PLAYER/TEAM CREATION
    createCustomPlayer(modId, playerData) {
        if (!this.hasPermission(modId, 'CREATE_PLAYERS')) {
            throw new Error('Insufficient permissions');
        }

        const validatedData = this.validatePlayerData(playerData);
        return this.gameEngine.createPlayer(validatedData);
    }

    createCustomTeam(modId, teamData) {
        if (!this.hasPermission(modId, 'CREATE_TEAMS')) {
            throw new Error('Insufficient permissions');
        }

        const validatedData = this.validateTeamData(teamData);
        return this.gameEngine.createTeam(validatedData);
    }

    validatePlayerData(data) {
        const required = ['name', 'position', 'stats'];
        for (const field of required) {
            if (!data[field]) {
                throw new Error(`Missing required player field: ${field}`);
            }
        }

        // Validate stat ranges
        const stats = data.stats;
        const statLimits = { power: [0, 100], speed: [0, 100], contact: [0, 100] };
        
        for (const [stat, value] of Object.entries(stats)) {
            if (statLimits[stat]) {
                const [min, max] = statLimits[stat];
                if (value < min || value > max) {
                    throw new Error(`${stat} must be between ${min} and ${max}`);
                }
            }
        }

        return data;
    }

    validateTeamData(data) {
        const required = ['name', 'city', 'colors'];
        for (const field of required) {
            if (!data[field]) {
                throw new Error(`Missing required team field: ${field}`);
            }
        }
        return data;
    }

    // UI EXTENSION
    addUIElement(modId, elementConfig) {
        if (!this.hasPermission(modId, 'MODIFY_UI')) {
            throw new Error('Insufficient permissions');
        }

        const element = this.createUIElement(elementConfig);
        this.gameEngine.ui.addElement(element);
        return element.id;
    }

    createUIElement(config) {
        return {
            id: `mod_ui_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: config.type || 'button',
            position: config.position || { x: 0, y: 0 },
            size: config.size || { width: 100, height: 30 },
            text: config.text || '',
            style: config.style || {},
            events: config.events || {},
            visible: true
        };
    }

    // EVENTS SYSTEM
    addEventListener(modId, eventType, callback) {
        if (!this.registeredMods.has(modId)) {
            throw new Error('Mod not registered');
        }

        const wrappedCallback = this.sandbox.wrapCallback(callback, modId);
        this.gameEngine.addEventListener(eventType, wrappedCallback);
    }

    dispatchEvent(modId, eventType, data) {
        if (!this.hasPermission(modId, 'DISPATCH_EVENTS')) {
            throw new Error('Insufficient permissions');
        }

        this.gameEngine.dispatchEvent(eventType, data);
    }

    // PERMISSION SYSTEM
    hasPermission(modId, permission) {
        const mod = this.registeredMods.get(modId);
        if (!mod) return false;
        
        return mod.permissions.includes(permission) || 
               mod.permissions.includes('ALL');
    }

    grantPermission(modId, permission) {
        const mod = this.registeredMods.get(modId);
        if (mod && !mod.permissions.includes(permission)) {
            mod.permissions.push(permission);
        }
    }

    // MOD MANAGEMENT
    enableMod(modId) {
        const mod = this.registeredMods.get(modId);
        if (!mod) throw new Error('Mod not found');
        
        if (!this.checkDependencies(modId)) {
            throw new Error('Missing dependencies');
        }

        mod.enabled = true;
        this.triggerHook('modEnabled', { modId });
    }

    disableMod(modId) {
        const mod = this.registeredMods.get(modId);
        if (!mod) throw new Error('Mod not found');

        mod.enabled = false;
        this.disableModHooks(modId);
        this.triggerHook('modDisabled', { modId });
    }

    disableModHooks(modId) {
        for (const [hookName, hooks] of this.hooks) {
            hooks.forEach(hook => {
                if (hook.modId === modId) {
                    hook.enabled = false;
                }
            });
        }
    }

    checkDependencies(modId) {
        const mod = this.registeredMods.get(modId);
        if (!mod.dependencies.length) return true;

        return mod.dependencies.every(depId => {
            const dependency = this.registeredMods.get(depId);
            return dependency && dependency.enabled;
        });
    }

    // ERROR HANDLING
    handleModError(modId, error) {
        console.error(`Mod ${modId} error:`, error);
        
        const mod = this.registeredMods.get(modId);
        if (mod) {
            mod.errors = mod.errors || [];
            mod.errors.push({
                timestamp: Date.now(),
                error: error.message,
                stack: error.stack
            });

            if (mod.errors.length > 10) {
                console.warn(`Mod ${modId} has too many errors, disabling...`);
                this.disableMod(modId);
            }
        }
    }

    // SECURITY
    setupSecurityPolicies() {
        this.securityPolicies = {
            allowFileAccess: false,
            allowNetworkAccess: false,
            allowEval: false,
            maxMemoryUsage: 50 * 1024 * 1024, // 50MB
            maxExecutionTime: 5000 // 5 seconds
        };
    }

    // DEVELOPER TOOLS
    getModList() {
        return Array.from(this.registeredMods.values()).map(mod => ({
            id: mod.id,
            name: mod.name,
            version: mod.version,
            author: mod.author,
            enabled: mod.enabled,
            description: mod.description,
            permissions: mod.permissions,
            dependencies: mod.dependencies,
            loadOrder: mod.loadOrder
        }));
    }

    getModInfo(modId) {
        const mod = this.registeredMods.get(modId);
        if (!mod) return null;

        return {
            ...mod,
            hookCount: mod.hooks.size,
            resourceCount: mod.resources.size,
            errors: mod.errors || []
        };
    }

    // DEBUGGING
    debugMod(modId) {
        const mod = this.registeredMods.get(modId);
        if (!mod) return null;

        return {
            id: mod.id,
            enabled: mod.enabled,
            hooks: Array.from(mod.hooks.keys()),
            resources: Array.from(mod.resources.keys()),
            permissions: mod.permissions,
            dependencies: mod.dependencies,
            errors: mod.errors || [],
            performance: this.getModPerformance(modId)
        };
    }

    getModPerformance(modId) {
        // Mock performance data
        return {
            executionTime: Math.random() * 100,
            memoryUsage: Math.random() * 10 * 1024 * 1024,
            hookCalls: Math.floor(Math.random() * 1000),
            lastActivity: Date.now()
        };
    }

    initializeModLoader() {
        this.modLoader = {
            loadFromFile: async (file) => {
                try {
                    const modData = await this.parseModFile(file);
                    return this.registerMod(modData);
                } catch (error) {
                    return { success: false, error: error.message };
                }
            },
            
            loadFromURL: async (url) => {
                try {
                    const response = await fetch(url);
                    const modData = await response.json();
                    return this.registerMod(modData);
                } catch (error) {
                    return { success: false, error: error.message };
                }
            }
        };
    }

    async parseModFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const modData = JSON.parse(e.target.result);
                    resolve(modData);
                } catch (error) {
                    reject(new Error('Invalid mod file format'));
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    // EXPORT/IMPORT
    exportMod(modId) {
        const mod = this.registeredMods.get(modId);
        if (!mod) throw new Error('Mod not found');

        return {
            id: mod.id,
            name: mod.name,
            version: mod.version,
            author: mod.author,
            description: mod.description,
            permissions: mod.permissions,
            dependencies: mod.dependencies,
            loadOrder: mod.loadOrder,
            apiVersion: mod.apiVersion,
            exportDate: new Date().toISOString()
        };
    }

    // CLEANUP
    unregisterMod(modId) {
        const mod = this.registeredMods.get(modId);
        if (!mod) return false;

        this.disableMod(modId);
        this.cleanupModResources(modId);
        this.registeredMods.delete(modId);
        
        return true;
    }

    cleanupModResources(modId) {
        // Remove hooks
        for (const [hookName, hooks] of this.hooks) {
            this.hooks.set(hookName, hooks.filter(hook => hook.modId !== modId));
        }

        // Remove resource overrides
        for (const [key, resource] of this.resourceOverrides) {
            if (resource.modId === modId) {
                this.resourceOverrides.delete(key);
            }
        }
    }
}

class ModManager {
    constructor() {
        this.loadOrder = [];
        this.conflictResolver = new ConflictResolver();
    }

    calculateLoadOrder(mods) {
        const sorted = [];
        const visited = new Set();
        const visiting = new Set();

        const visit = (modId) => {
            if (visited.has(modId)) return;
            if (visiting.has(modId)) {
                throw new Error(`Circular dependency detected: ${modId}`);
            }

            visiting.add(modId);
            const mod = mods.get(modId);
            
            if (mod.dependencies) {
                mod.dependencies.forEach(depId => {
                    if (mods.has(depId)) {
                        visit(depId);
                    }
                });
            }

            visiting.delete(modId);
            visited.add(modId);
            sorted.push(modId);
        };

        Array.from(mods.keys()).forEach(modId => visit(modId));
        return sorted;
    }
}

class ModSandbox {
    constructor() {
        this.contexts = new Map();
    }

    wrapCallback(callback, modId) {
        return (...args) => {
            try {
                const start = performance.now();
                const result = callback.apply(this.getContext(modId), args);
                const end = performance.now();
                
                this.trackPerformance(modId, end - start);
                return result;
            } catch (error) {
                throw new Error(`Mod ${modId}: ${error.message}`);
            }
        };
    }

    getContext(modId) {
        if (!this.contexts.has(modId)) {
            this.contexts.set(modId, this.createSandboxContext(modId));
        }
        return this.contexts.get(modId);
    }

    createSandboxContext(modId) {
        return {
            modId,
            console: {
                log: (...args) => console.log(`[${modId}]`, ...args),
                error: (...args) => console.error(`[${modId}]`, ...args),
                warn: (...args) => console.warn(`[${modId}]`, ...args)
            },
            setTimeout: (fn, delay) => setTimeout(() => fn(), Math.min(delay, 10000)),
            setInterval: (fn, delay) => setInterval(() => fn(), Math.max(delay, 100))
        };
    }

    createProxy(object) {
        return new Proxy(object, {
            set: () => {
                throw new Error('Cannot modify game state directly');
            },
            get: (target, prop) => {
                const value = target[prop];
                if (typeof value === 'object' && value !== null) {
                    return this.createProxy(value);
                }
                return value;
            }
        });
    }

    trackPerformance(modId, executionTime) {
        // Implementation for performance tracking
    }
}

class ConflictResolver {
    resolveConflicts(conflicts) {
        return conflicts.map(conflict => ({
            type: conflict.type,
            mods: conflict.mods,
            resolution: this.getResolution(conflict)
        }));
    }

    getResolution(conflict) {
        switch (conflict.type) {
            case 'resource_override':
                return 'Use load order priority';
            case 'hook_conflict':
                return 'Execute in load order';
            default:
                return 'Manual resolution required';
        }
    }
}