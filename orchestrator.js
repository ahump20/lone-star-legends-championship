/**
 * Platform Orchestrator
 * Coordinates all external services into unified game intelligence
 */

export class PlatformOrchestrator {
  constructor(config) {
    this.config = config;
    this.services = {};
    this.featureFlags = {};
    this.initialized = false;
  }

  async initialize() {
    console.log('Initializing platform services...');
    
    // Initialize Cloudflare integration
    this.services.cloudflare = new CloudflareService(this.config);
    await this.services.cloudflare.init();
    
    // Initialize HuggingFace if available
    if (this.config.huggingFaceApiKey) {
      this.services.ai = new HuggingFaceService(this.config);
    }
    
    // Initialize Notion for community features
    if (this.config.notionApiKey) {
      this.services.community = new NotionService(this.config);
    }
    
    // Load feature flags for A/B testing
    await this.loadFeatureFlags();
    
    this.initialized = true;
    console.log('Platform services ready');
  }

  async loadFeatureFlags() {
    try {
      const endpoint = this.config.environment === 'preview'
        ? `${this.config.netlifyPreviewUrl}/game-api/features`
        : `${this.config.cloudflareWorkerUrl}/api/features`;
      
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        this.featureFlags = data.features.reduce((acc, flag) => {
          acc[flag.name] = flag.enabled;
          return acc;
        }, {});
      }
    } catch (error) {
      console.error('Failed to load feature flags:', error);
    }
  }

  getServices() {
    return this.services;
  }

  isFeatureEnabled(featureName) {
    return this.featureFlags[featureName] || false;
  }

  // Unified analytics tracking
  async trackEvent(eventName, properties = {}) {
    const enrichedProperties = {
      ...properties,
      timestamp: Date.now(),
      environment: this.config.environment,
      version: this.config.version,
      featureFlags: this.featureFlags
    };
    
    // Send to Cloudflare D1 for persistence
    if (this.services.cloudflare) {
      await this.services.cloudflare.trackEvent(eventName, enrichedProperties);
    }
    
    // Send to preview analytics if in preview mode
    if (this.config.environment === 'preview' && this.config.netlifyPreviewUrl) {
      await fetch(`${this.config.netlifyPreviewUrl}/game-api/analytics/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: eventName, properties: enrichedProperties })
      });
    }
  }

  // Dynamic content generation via AI
  async generateContent(type, context) {
    if (!this.services.ai || !this.isFeatureEnabled('ai_content')) {
      return this.getFallbackContent(type, context);
    }
    
    try {
      return await this.services.ai.generate(type, context);
    } catch (error) {
      console.error('AI generation failed:', error);
      return this.getFallbackContent(type, context);
    }
  }

  getFallbackContent(type, context) {
    const fallbacks = {
      npc_dialogue: [
        'The frontier holds many secrets, partner.',
        'Keep your wits about you out there.',
        "Legends aren't born, they're forged."
      ],
      quest_description: [
        'Explore the mysterious caverns to the west.',
        'Help the townspeople defend against bandits.',
        'Discover the truth behind the ancient legend.'
      ]
    };
    
    const options = fallbacks[type] || ['...'];
    return options[Math.floor(Math.random() * options.length)];
  }

  // Community feedback submission
  async submitFeedback(category, message, context = {}) {
    if (this.services.community) {
      return await this.services.community.submitFeedback({
        category,
        message,
        playerContext: context,
        timestamp: new Date().toISOString()
      });
    }
    
    // Fallback to console logging
    console.log('Community feedback:', { category, message, context });
    return { success: true, method: 'local' };
  }
}

// Cloudflare Service Integration
class CloudflareService {
  constructor(config) {
    this.config = config;
    this.sessionToken = localStorage.getItem('lone_star_session');
    this.playerId = localStorage.getItem('lone_star_player_id');
    this.playerState = null;
  }

  async init() {
    if (this.sessionToken) {
      await this.validateSession();
    }
  }

  async validateSession() {
    try {
      const response = await fetch(`${this.config.cloudflareWorkerUrl}/api/player/state`, {
        headers: { 'X-Session-Token': this.sessionToken }
      });
      
      if (!response.ok) {
        this.clearSession();
        return false;
      }
      
      const state = await response.json();
      this.playerState = state;
      return true;
    } catch (error) {
      console.error('Session validation failed:', error);
      return false;
    }
  }

  async createPlayer(username) {
    const response = await fetch(`${this.config.cloudflareWorkerUrl}/api/player/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });
    const data = await response.json();
    this.sessionToken = data.sessionToken;
    this.playerId = data.playerId;
    this.playerState = data.player;
    
    localStorage.setItem('lone_star_session', this.sessionToken);
    localStorage.setItem('lone_star_player_id', this.playerId);
    
    return data;
  }

  async updateState(updates) {
    const response = await fetch(`${this.config.cloudflareWorkerUrl}/api/player/state`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': this.sessionToken
      },
      body: JSON.stringify(updates)
    });
    this.playerState = await response.json();
    return this.playerState;
  }

  async submitScore(score, context = {}) {
    const response = await fetch(`${this.config.cloudflareWorkerUrl}/api/leaderboard/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': this.sessionToken
      },
      body: JSON.stringify({ score, context })
    });
    return await response.json();
  }

  async getLeaderboard() {
    const response = await fetch(`${this.config.cloudflareWorkerUrl}/api/leaderboard`);
    return await response.json();
  }

  async trackEvent(eventName, properties) {
    await fetch(`${this.config.cloudflareWorkerUrl}/api/analytics/event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': this.sessionToken
      },
      body: JSON.stringify({ event: eventName, properties })
    });
  }

  clearSession() {
    this.sessionToken = null;
    this.playerId = null;
    this.playerState = null;
    localStorage.removeItem('lone_star_session');
    localStorage.removeItem('lone_star_player_id');
  }
}

// HuggingFace Service Integration
class HuggingFaceService {
  constructor(config) {
    this.config = config;
    this.apiKey = config.huggingFaceApiKey;
    this.modelEndpoint = 'https://api-inference.huggingface.co/models/';
  }

  async generate(type, context) {
    const prompts = {
      npc_dialogue: this.buildNPCPrompt(context),
      quest_description: this.buildQuestPrompt(context),
      item_lore: this.buildItemPrompt(context)
    };
    const prompt = prompts[type];
    if (!prompt) throw new Error(`Unknown content type: ${type}`);
    const response = await fetch(`${this.modelEndpoint}mistralai/Mistral-7B-Instruct-v0.1`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 100,
          temperature: 0.8,
          top_p: 0.9
        }
      })
    });
    const result = await response.json();
    return result[0]?.generated_text || '';
  }

  buildNPCPrompt(context) {
    return `You are ${context.npcName}, an NPC in \"Lone Star Legends Championship\", a Texas frontier game.\nPlayer level: ${context.playerLevel}\nLocation: ${context.location}\nPrevious interaction: ${context.lastInteraction || 'None'}\n\nRespond in character with one line of frontier dialogue (max 20 words):\n${context.npcName}:`;
  }

  buildQuestPrompt(context) {
    return `Generate a quest description for \"Lone Star Legends Championship\" (Texas frontier setting).\nDifficulty: ${context.difficulty}\nPlayer level: ${context.playerLevel}\nLocation: ${context.location}\n\nQuest description (max 30 words):`;
  }

  buildItemPrompt(context) {
    return `Create lore for an item in \"Lone Star Legends Championship\" (Texas frontier setting).\nItem type: ${context.itemType}\nRarity: ${context.rarity}\n\nItem lore (max 25 words):`;
  }
}

// Notion Service Integration
class NotionService {
  constructor(config) {
    this.config = config;
    this.apiKey = config.notionApiKey;
    this.databaseId = config.notionDatabaseId;
  }

  async submitFeedback(data) {
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        parent: { database_id: this.databaseId },
        properties: {
          Category: { select: { name: data.category } },
          Message: {
            rich_text: [
              {
                text: { content: data.message }
              }
            ]
          },
          'Player ID': {
            rich_text: [
              {
                text: { content: data.playerContext?.playerId || 'anonymous' }
              }
            ]
          },
          Timestamp: {
            date: { start: data.timestamp }
          }
        }
      })
    });
    return await response.json();
  }
}