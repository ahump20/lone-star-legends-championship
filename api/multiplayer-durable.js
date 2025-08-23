// Durable Object for game rooms
export class GameRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sessions = new Map();
    this.gameState = {
      homeScore: 0,
      awayScore: 0,
      inning: 1,
      balls: [],
      players: new Map(),
      lastUpdate: Date.now()
    };
  }

  async fetch(request) {
    const url = new URL(request.url);
    
    if (url.pathname === '/websocket') {
      return this.handleWebSocket(request);
    }
    
    if (url.pathname === '/state') {
      return new Response(JSON.stringify(this.gameState), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response('Not found', { status: 404 });
  }

  async handleWebSocket(request) {
    const upgradeHeader = request.headers.get('Upgrade');
    if (!upgradeHeader || upgradeHeader !== 'websocket') {
      return new Response('Expected Upgrade: websocket', { status: 426 });
    }

    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);
    
    await this.handleSession(server, request);
    
    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }

  async handleSession(webSocket, request) {
    const sessionId = crypto.randomUUID();
    const url = new URL(request.url);
    const playerId = url.searchParams.get('playerId') || `player_${sessionId}`;
    const playerName = url.searchParams.get('name') || 'Anonymous';
    
    // Accept the WebSocket connection
    webSocket.accept();
    
    // Store session
    this.sessions.set(sessionId, {
      webSocket,
      playerId,
      playerName,
      joinedAt: Date.now()
    });
    
    // Add player to game state
    this.gameState.players.set(playerId, {
      name: playerName,
      team: this.gameState.players.size % 2 === 0 ? 'home' : 'away',
      position: { x: 0, y: 0, z: 0 },
      stats: {
        hits: 0,
        runs: 0,
        strikes: 0
      }
    });
    
    // Send initial state
    webSocket.send(JSON.stringify({
      type: 'init',
      sessionId,
      playerId,
      gameState: this.gameState
    }));
    
    // Broadcast player joined
    this.broadcast({
      type: 'playerJoined',
      playerId,
      playerName,
      totalPlayers: this.sessions.size
    }, sessionId);
    
    // Handle messages
    webSocket.addEventListener('message', async (event) => {
      try {
        const message = JSON.parse(event.data);
        await this.handleMessage(sessionId, message);
      } catch (error) {
        console.error('Message handling error:', error);
        webSocket.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }));
      }
    });
    
    // Handle disconnection
    webSocket.addEventListener('close', () => {
      const session = this.sessions.get(sessionId);
      if (session) {
        this.gameState.players.delete(session.playerId);
        this.sessions.delete(sessionId);
        
        // Broadcast player left
        this.broadcast({
          type: 'playerLeft',
          playerId: session.playerId,
          playerName: session.playerName,
          totalPlayers: this.sessions.size
        });
      }
    });
  }

  async handleMessage(sessionId, message) {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    
    switch (message.type) {
      case 'move':
        this.handlePlayerMove(session.playerId, message.position);
        break;
        
      case 'swing':
        this.handleSwing(session.playerId);
        break;
        
      case 'pitch':
        this.handlePitch(session.playerId);
        break;
        
      case 'chat':
        this.handleChat(session.playerId, session.playerName, message.text);
        break;
        
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  handlePlayerMove(playerId, position) {
    const player = this.gameState.players.get(playerId);
    if (player) {
      player.position = position;
      this.gameState.lastUpdate = Date.now();
      
      // Broadcast position update
      this.broadcast({
        type: 'playerMove',
        playerId,
        position
      });
    }
  }

  handleSwing(playerId) {
    const player = this.gameState.players.get(playerId);
    if (!player) return;
    
    // Check for hit (simplified physics)
    const hitSuccess = Math.random() > 0.6;
    
    if (hitSuccess) {
      player.stats.hits++;
      
      // Determine hit type
      const hitType = Math.random();
      let result = 'single';
      let runsScored = 0;
      
      if (hitType > 0.9) {
        result = 'homerun';
        runsScored = 1 + Math.floor(Math.random() * 3);
      } else if (hitType > 0.7) {
        result = 'triple';
      } else if (hitType > 0.5) {
        result = 'double';
      }
      
      // Update score
      if (player.team === 'home') {
        this.gameState.homeScore += runsScored;
      } else {
        this.gameState.awayScore += runsScored;
      }
      
      // Broadcast hit
      this.broadcast({
        type: 'hit',
        playerId,
        result,
        runsScored,
        gameState: this.gameState
      });
    } else {
      player.stats.strikes++;
      
      // Broadcast miss
      this.broadcast({
        type: 'miss',
        playerId,
        strikes: player.stats.strikes
      });
    }
  }

  handlePitch(playerId) {
    // Create new ball
    const ball = {
      id: crypto.randomUUID(),
      pitcher: playerId,
      position: { x: 0, y: 3, z: -18 },
      velocity: { x: 0, y: 0, z: 0.8 },
      timestamp: Date.now()
    };
    
    this.gameState.balls.push(ball);
    
    // Remove old balls (keep last 10)
    if (this.gameState.balls.length > 10) {
      this.gameState.balls = this.gameState.balls.slice(-10);
    }
    
    // Broadcast pitch
    this.broadcast({
      type: 'pitch',
      playerId,
      ball
    });
    
    // Schedule ball removal
    setTimeout(() => {
      const index = this.gameState.balls.findIndex(b => b.id === ball.id);
      if (index !== -1) {
        this.gameState.balls.splice(index, 1);
      }
    }, 5000);
  }

  handleChat(playerId, playerName, text) {
    // Sanitize message
    const sanitized = text.substring(0, 200).replace(/[<>]/g, '');
    
    // Broadcast chat message
    this.broadcast({
      type: 'chat',
      playerId,
      playerName,
      text: sanitized,
      timestamp: Date.now()
    });
  }

  broadcast(message, excludeSessionId = null) {
    const messageStr = JSON.stringify(message);
    
    for (const [sessionId, session] of this.sessions) {
      if (sessionId !== excludeSessionId) {
        try {
          session.webSocket.send(messageStr);
        } catch (error) {
          console.error(`Failed to send to ${sessionId}:`, error);
        }
      }
    }
  }
}

// Worker script to handle WebSocket upgrades
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Handle room creation/joining
    if (url.pathname.startsWith('/room/')) {
      const roomId = url.pathname.slice(6);
      
      // Get or create room
      const id = env.GAME_ROOMS.idFromName(roomId);
      const room = env.GAME_ROOMS.get(id);
      
      // Forward request to Durable Object
      return room.fetch(request);
    }
    
    // List active rooms
    if (url.pathname === '/rooms') {
      // This would typically query a database or KV store
      // For now, return sample data
      return new Response(JSON.stringify({
        rooms: [
          { id: 'main', players: 12, maxPlayers: 20 },
          { id: 'competitive', players: 8, maxPlayers: 10 },
          { id: 'practice', players: 3, maxPlayers: 20 }
        ]
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'healthy',
        service: 'multiplayer',
        timestamp: new Date().toISOString()
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response('Blaze Intelligence Multiplayer API', {
      headers: { 'Content-Type': 'text/plain' }
    });
  }
};