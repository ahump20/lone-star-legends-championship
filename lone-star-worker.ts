/**
 * Lone Star Legends Championship - Edge State Worker
 * Defensive core: Memphis-tight state management at the edge
 * Offensive capability: Texas-scale player coordination
 */

export interface Env {
  PLAYER_STATE: KVNamespace;
  LEADERBOARDS: KVNamespace;
  GAME_ANALYTICS: D1Database;
  GITHUB_PAGES_URL: string; // Your GitHub Pages base URL
}

interface PlayerState {
  id: string;
  username: string;
  level: number;
  experience: number;
  achievements: string[];
  inventory: Record<string, any>;
  lastSeen: number;
  sessionToken?: string;
}

interface LeaderboardEntry {
  playerId: string;
  username: string;
  score: number;
  timestamp: number;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    // CORS headers for GitHub Pages integration
    const corsHeaders = {
      'Access-Control-Allow-Origin': env.GITHUB_PAGES_URL || '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token'
    };
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    try {
      switch (true) {
        case path === '/api/player/state' && request.method === 'GET':
          return await this.getPlayerState(request, env, corsHeaders);
        case path === '/api/player/state' && request.method === 'PUT':
          return await this.updatePlayerState(request, env, corsHeaders);
        case path === '/api/player/create' && request.method === 'POST':
          return await this.createPlayer(request, env, corsHeaders);
        case path === '/api/leaderboard' && request.method === 'GET':
          return await this.getLeaderboard(env, corsHeaders);
        case path === '/api/leaderboard/submit' && request.method === 'POST':
          return await this.submitScore(request, env, ctx, corsHeaders);
        case path === '/api/analytics/event' && request.method === 'POST':
          return await this.trackEvent(request, env, ctx, corsHeaders);
        case path.startsWith('/game/'):
          return await this.proxyWithState(request, env, corsHeaders);
        default:
          return new Response('Route not found', { status: 404, headers: corsHeaders });
      }
    } catch (error) {
      console.error('Worker error:', error);
      return new Response('Internal error', { status: 500, headers: corsHeaders });
    }
  },
  async getPlayerState(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
    const sessionToken = request.headers.get('X-Session-Token');
    if (!sessionToken) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }
    const playerId = await this.validateSession(sessionToken, env);
    if (!playerId) {
      return new Response('Invalid session', { status: 403, headers: corsHeaders });
    }
    const state = (await env.PLAYER_STATE.get(playerId, 'json')) as PlayerState;
    if (!state) {
      return new Response('Player not found', { status: 404, headers: corsHeaders });
    }
    return new Response(JSON.stringify(state), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  },
  async updatePlayerState(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
    const sessionToken = request.headers.get('X-Session-Token');
    if (!sessionToken) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }
    const playerId = await this.validateSession(sessionToken, env);
    if (!playerId) {
      return new Response('Invalid session', { status: 403, headers: corsHeaders });
    }
    const updates = (await request.json()) as Partial<PlayerState>;
    const currentState = (await env.PLAYER_STATE.get(playerId, 'json')) as PlayerState;
    if (!currentState) {
      return new Response('Player not found', { status: 404, headers: corsHeaders });
    }
    const newState: PlayerState = {
      ...currentState,
      ...updates,
      id: playerId,
      lastSeen: Date.now()
    };
    await env.PLAYER_STATE.put(playerId, JSON.stringify(newState), { expirationTtl: 60 * 60 * 24 * 30 });
    return new Response(JSON.stringify(newState), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  },
  async createPlayer(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
    const { username } = (await request.json()) as { username: string };
    if (!username || username.length < 3) {
      return new Response('Invalid username', { status: 400, headers: corsHeaders });
    }
    const playerId = crypto.randomUUID();
    const sessionToken = crypto.randomUUID();
    const newPlayer: PlayerState = {
      id: playerId,
      username,
      level: 1,
      experience: 0,
      achievements: ['frontier_arrival'],
      inventory: { gold: 100, provisions: 10 },
      lastSeen: Date.now(),
      sessionToken
    };
    await env.PLAYER_STATE.put(playerId, JSON.stringify(newPlayer), { expirationTtl: 60 * 60 * 24 * 30 });
    await env.PLAYER_STATE.put(`session:${sessionToken}`, playerId, { expirationTtl: 60 * 60 * 24 * 7 });
    await env.GAME_ANALYTICS.prepare('INSERT INTO players (id, username, created_at) VALUES (?, ?, ?)').bind(playerId, username, new Date().toISOString()).run();
    return new Response(JSON.stringify({ playerId, sessionToken, player: newPlayer }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  },
  async getLeaderboard(env: Env, corsHeaders: Record<string, string>): Promise<Response> {
    const leaderboard = (await env.LEADERBOARDS.get('global:top100', 'json')) as LeaderboardEntry[];
    if (!leaderboard) {
      return new Response(JSON.stringify([]), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify(leaderboard), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  },
  async submitScore(request: Request, env: Env, ctx: ExecutionContext, corsHeaders: Record<string, string>): Promise<Response> {
    const sessionToken = request.headers.get('X-Session-Token');
    if (!sessionToken) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }
    const playerId = await this.validateSession(sessionToken, env);
    if (!playerId) {
      return new Response('Invalid session', { status: 403, headers: corsHeaders });
    }
    const { score, context } = (await request.json()) as { score: number; context?: any };
    const player = (await env.PLAYER_STATE.get(playerId, 'json')) as PlayerState;
    const entry: LeaderboardEntry = {
      playerId,
      username: player.username,
      score,
      timestamp: Date.now()
    };
    ctx.waitUntil(this.updateLeaderboard(entry, env));
    ctx.waitUntil(env.GAME_ANALYTICS.prepare('INSERT INTO scores (player_id, score, context, submitted_at) VALUES (?, ?, ?, ?)').bind(playerId, score, JSON.stringify(context), new Date().toISOString()).run());
    return new Response(JSON.stringify({ success: true, entry }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  },
  async trackEvent(request: Request, env: Env, ctx: ExecutionContext, corsHeaders: Record<string, string>): Promise<Response> {
    const { event, properties } = (await request.json()) as { event: string; properties?: Record<string, any> };
    const sessionToken = request.headers.get('X-Session-Token');
    const playerId = sessionToken ? await this.validateSession(sessionToken, env) : 'anonymous';
    ctx.waitUntil(
      env.GAME_ANALYTICS.prepare('INSERT INTO events (player_id, event_type, properties, created_at) VALUES (?, ?, ?, ?)')
        .bind(playerId, event, JSON.stringify(properties), new Date().toISOString())
        .run()
    );
    return new Response(JSON.stringify({ tracked: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  },
  async proxyWithState(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
    const githubUrl = new URL(request.url);
    githubUrl.hostname = new URL(env.GITHUB_PAGES_URL).hostname;
    const response = await fetch(githubUrl);
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      const html = await response.text();
      const sessionToken = request.headers.get('X-Session-Token');
      let stateScript = '<script>window.__GAME_STATE__ = null;</script>';
      if (sessionToken) {
        const playerId = await this.validateSession(sessionToken, env);
        if (playerId) {
          const state = await env.PLAYER_STATE.get(playerId, 'json');
          stateScript = `<script>window.__GAME_STATE__ = ${JSON.stringify(state)};</script>`;
        }
      }
      const modifiedHtml = html.replace('</body>', `${stateScript}</body>`);
      return new Response(modifiedHtml, { headers: { ...corsHeaders, 'Content-Type': 'text/html' } });
    }
    return new Response(response.body, { headers: { ...corsHeaders, ...Object.fromEntries(response.headers.entries()) } });
  },
  async validateSession(token: string, env: Env): Promise<string | null> {
    return await env.PLAYER_STATE.get(`session:${token}`, 'text');
  },
  async updateLeaderboard(entry: LeaderboardEntry, env: Env): Promise<void> {
    let leaderboard = (await env.LEADERBOARDS.get('global:top100', 'json')) as LeaderboardEntry[] || [];
    leaderboard.push(entry);
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 100);
    await env.LEADERBOARDS.put('global:top100', JSON.stringify(leaderboard));
  }
};