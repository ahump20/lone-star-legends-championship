/**
 * Blaze Intelligence - Lone Star Legends Multiplayer Server
 * WebSocket server for real-time multiplayer baseball games
 * Deploy to Cloudflare Workers or Node.js
 */

// For Cloudflare Workers Durable Objects
export class GameRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sessions = [];
    this.gameState = {
      inning: 1,
      isTopInning: true,
      homeScore: 0,
      awayScore: 0,
      balls: 0,
      strikes: 0,
      outs: 0,
      bases: [false, false, false],
      currentBatter: null,
      currentPitcher: null,
      ballPosition: { x: 0, y: 0, z: 0 },
      players: {}
    };
  }

  async fetch(request) {
    const upgradeHeader = request.headers.get('Upgrade');
    if (!upgradeHeader || upgradeHeader !== 'websocket') {
      return new Response('Expected Upgrade: websocket', { status: 426 });
    }

    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    this.handleSession(server, request);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  handleSession(webSocket, request) {
    webSocket.accept();
    
    const sessionId = crypto.randomUUID();
    const session = {
      id: sessionId,
      webSocket: webSocket,
      playerId: null,
      team: this.sessions.length === 0 ? 'home' : 'away',
      isHost: this.sessions.length === 0
    };

    this.sessions.push(session);

    // Send initial connection data
    this.send(session, {
      type: 'connected',
      sessionId: sessionId,
      team: session.team,
      isHost: session.isHost,
      gameState: this.gameState
    });

    // Notify other players
    this.broadcast({
      type: 'player-joined',
      playerId: sessionId,
      team: session.team,
      playerCount: this.sessions.length
    }, session);

    // Handle messages
    webSocket.addEventListener('message', async (msg) => {
      try {
        const data = JSON.parse(msg.data);
        await this.handleMessage(session, data);
      } catch (err) {
        console.error('Error handling message:', err);
      }
    });

    // Handle disconnect
    webSocket.addEventListener('close', () => {
      this.sessions = this.sessions.filter(s => s.id !== sessionId);
      
      this.broadcast({
        type: 'player-left',
        playerId: sessionId,
        playerCount: this.sessions.length
      });

      // Reset game if no players
      if (this.sessions.length === 0) {
        this.resetGame();
      }
    });
  }

  async handleMessage(session, data) {
    switch (data.type) {
      case 'game-action':
        await this.handleGameAction(session, data);
        break;
      
      case 'pitch':
        await this.handlePitch(session, data);
        break;
      
      case 'swing':
        await this.handleSwing(session, data);
        break;
      
      case 'field':
        await this.handleFielding(session, data);
        break;
      
      case 'run':
        await this.handleBaseRunning(session, data);
        break;
      
      case 'chat':
        this.broadcast({
          type: 'chat',
          playerId: session.id,
          team: session.team,
          message: data.message,
          timestamp: Date.now()
        });
        break;
      
      case 'sync-request':
        this.send(session, {
          type: 'sync-response',
          gameState: this.gameState,
          timestamp: Date.now()
        });
        break;
    }
  }

  async handleGameAction(session, data) {
    // Validate action based on game state
    if (!this.validateAction(session, data)) {
      this.send(session, {
        type: 'action-rejected',
        reason: 'Invalid action for current game state'
      });
      return;
    }

    // Update game state
    const result = this.updateGameState(data);

    // Broadcast to all players
    this.broadcast({
      type: 'game-update',
      action: data.action,
      playerId: session.id,
      result: result,
      gameState: this.gameState,
      timestamp: Date.now()
    });
  }

  async handlePitch(session, data) {
    if (session.team !== this.getCurrentPitchingTeam()) {
      return;
    }

    const pitch = {
      speed: data.speed || 90 + Math.random() * 10,
      type: data.pitchType || 'fastball',
      location: data.location || { x: 0, y: 0 },
      spin: data.spin || 0,
      timestamp: Date.now()
    };

    this.gameState.currentPitch = pitch;

    this.broadcast({
      type: 'pitch-thrown',
      pitch: pitch,
      pitcher: session.id
    });
  }

  async handleSwing(session, data) {
    if (session.team !== this.getCurrentBattingTeam()) {
      return;
    }

    const swing = {
      power: data.power || 0.5,
      timing: data.timing || Date.now(),
      angle: data.angle || 0,
      location: data.location || { x: 0, y: 0 }
    };

    // Calculate hit result
    const result = this.calculateHitResult(this.gameState.currentPitch, swing);

    if (result.contact) {
      // Ball was hit
      this.gameState.ballInPlay = true;
      this.gameState.ballTrajectory = result.trajectory;
      
      this.broadcast({
        type: 'ball-hit',
        swing: swing,
        result: result,
        batter: session.id
      });
    } else {
      // Strike or ball
      if (result.strike) {
        this.gameState.strikes++;
        if (this.gameState.strikes >= 3) {
          this.handleStrikeout();
        }
      } else {
        this.gameState.balls++;
        if (this.gameState.balls >= 4) {
          this.handleWalk();
        }
      }

      this.broadcast({
        type: 'swing-result',
        swing: swing,
        result: result,
        gameState: this.gameState
      });
    }
  }

  async handleFielding(session, data) {
    if (!this.gameState.ballInPlay) return;

    const fielder = {
      playerId: session.id,
      position: data.position,
      action: data.action // catch, throw, tag
    };

    if (data.action === 'catch') {
      const caught = this.checkCatch(fielder.position, this.gameState.ballPosition);
      
      if (caught) {
        this.gameState.ballInPlay = false;
        this.gameState.outs++;
        
        this.broadcast({
          type: 'ball-caught',
          fielder: fielder,
          gameState: this.gameState
        });

        if (this.gameState.outs >= 3) {
          this.endInning();
        }
      }
    } else if (data.action === 'throw') {
      this.gameState.ballThrowTarget = data.target;
      
      this.broadcast({
        type: 'ball-thrown',
        fielder: fielder,
        target: data.target
      });
    }
  }

  async handleBaseRunning(session, data) {
    const runner = {
      playerId: session.id,
      fromBase: data.fromBase,
      toBase: data.toBase,
      speed: data.speed || 1
    };

    // Update base status
    if (runner.fromBase >= 0 && runner.fromBase < 3) {
      this.gameState.bases[runner.fromBase] = false;
    }
    if (runner.toBase > 0 && runner.toBase <= 3) {
      this.gameState.bases[runner.toBase - 1] = true;
    }

    // Check for scoring
    if (runner.toBase === 0 || runner.toBase > 3) {
      if (session.team === 'home') {
        this.gameState.homeScore++;
      } else {
        this.gameState.awayScore++;
      }
      
      this.broadcast({
        type: 'run-scored',
        runner: runner,
        gameState: this.gameState
      });
    } else {
      this.broadcast({
        type: 'runner-advanced',
        runner: runner,
        gameState: this.gameState
      });
    }
  }

  calculateHitResult(pitch, swing) {
    if (!pitch) return { contact: false, strike: true };

    const timingWindow = 100; // milliseconds
    const timingDiff = Math.abs(swing.timing - pitch.timestamp);
    
    if (timingDiff > timingWindow) {
      return { contact: false, strike: true };
    }

    // Calculate contact quality
    const locationDiff = Math.sqrt(
      Math.pow(swing.location.x - pitch.location.x, 2) +
      Math.pow(swing.location.y - pitch.location.y, 2)
    );

    if (locationDiff > 2) {
      return { contact: false, strike: true };
    }

    // Successful contact
    const contactQuality = 1 - (locationDiff / 2);
    const power = swing.power * contactQuality;
    
    // Calculate trajectory
    const launchAngle = 15 + Math.random() * 30;
    const exitVelocity = 70 + power * 40;
    const direction = swing.angle + (Math.random() - 0.5) * 30;

    return {
      contact: true,
      trajectory: {
        velocity: exitVelocity,
        angle: launchAngle,
        direction: direction
      },
      quality: contactQuality
    };
  }

  checkCatch(fielderPos, ballPos) {
    const catchRadius = 3; // meters
    const distance = Math.sqrt(
      Math.pow(fielderPos.x - ballPos.x, 2) +
      Math.pow(fielderPos.y - ballPos.y, 2) +
      Math.pow(fielderPos.z - ballPos.z, 2)
    );
    
    return distance <= catchRadius;
  }

  validateAction(session, data) {
    // Check if it's the player's turn
    const currentTeam = this.gameState.isTopInning ? 'away' : 'home';
    
    switch (data.action) {
      case 'pitch':
        return session.team !== currentTeam;
      case 'swing':
        return session.team === currentTeam;
      case 'field':
        return this.gameState.ballInPlay && session.team !== currentTeam;
      case 'run':
        return this.gameState.ballInPlay && session.team === currentTeam;
      default:
        return false;
    }
  }

  updateGameState(data) {
    const result = {
      success: true,
      changes: []
    };

    // Update based on action
    switch (data.action) {
      case 'strike':
        this.gameState.strikes++;
        result.changes.push('strike');
        break;
      case 'ball':
        this.gameState.balls++;
        result.changes.push('ball');
        break;
      case 'hit':
        this.gameState.ballInPlay = true;
        result.changes.push('hit');
        break;
      case 'out':
        this.gameState.outs++;
        result.changes.push('out');
        break;
    }

    // Check for inning change
    if (this.gameState.outs >= 3) {
      this.endInning();
      result.changes.push('inning-change');
    }

    return result;
  }

  getCurrentPitchingTeam() {
    return this.gameState.isTopInning ? 'home' : 'away';
  }

  getCurrentBattingTeam() {
    return this.gameState.isTopInning ? 'away' : 'home';
  }

  handleStrikeout() {
    this.gameState.outs++;
    this.gameState.strikes = 0;
    this.gameState.balls = 0;
    
    this.broadcast({
      type: 'strikeout',
      gameState: this.gameState
    });

    if (this.gameState.outs >= 3) {
      this.endInning();
    }
  }

  handleWalk() {
    // Advance runners
    this.advanceRunners(1);
    this.gameState.balls = 0;
    this.gameState.strikes = 0;
    
    this.broadcast({
      type: 'walk',
      gameState: this.gameState
    });
  }

  advanceRunners(bases) {
    // Move all runners forward
    for (let i = 2; i >= 0; i--) {
      if (this.gameState.bases[i]) {
        if (i + bases >= 3) {
          // Score run
          if (this.gameState.isTopInning) {
            this.gameState.awayScore++;
          } else {
            this.gameState.homeScore++;
          }
        } else {
          this.gameState.bases[i + bases] = true;
        }
        this.gameState.bases[i] = false;
      }
    }
    
    // Put batter on first
    this.gameState.bases[0] = true;
  }

  endInning() {
    this.gameState.outs = 0;
    this.gameState.balls = 0;
    this.gameState.strikes = 0;
    this.gameState.bases = [false, false, false];
    this.gameState.isTopInning = !this.gameState.isTopInning;
    
    if (!this.gameState.isTopInning) {
      this.gameState.inning++;
    }

    this.broadcast({
      type: 'inning-ended',
      gameState: this.gameState
    });

    // Check for game end
    if (this.gameState.inning > 9) {
      this.endGame();
    }
  }

  endGame() {
    const winner = this.gameState.homeScore > this.gameState.awayScore ? 'home' : 'away';
    
    this.broadcast({
      type: 'game-ended',
      winner: winner,
      finalScore: {
        home: this.gameState.homeScore,
        away: this.gameState.awayScore
      }
    });

    // Reset after delay
    setTimeout(() => this.resetGame(), 5000);
  }

  resetGame() {
    this.gameState = {
      inning: 1,
      isTopInning: true,
      homeScore: 0,
      awayScore: 0,
      balls: 0,
      strikes: 0,
      outs: 0,
      bases: [false, false, false],
      currentBatter: null,
      currentPitcher: null,
      ballPosition: { x: 0, y: 0, z: 0 },
      players: {}
    };

    this.broadcast({
      type: 'game-reset',
      gameState: this.gameState
    });
  }

  send(session, data) {
    try {
      session.webSocket.send(JSON.stringify(data));
    } catch (err) {
      console.error('Error sending to session:', err);
    }
  }

  broadcast(data, exclude = null) {
    const message = JSON.stringify(data);
    
    this.sessions.forEach(session => {
      if (session !== exclude) {
        try {
          session.webSocket.send(message);
        } catch (err) {
          console.error('Error broadcasting to session:', err);
        }
      }
    });
  }
}

// Cloudflare Worker handler
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Handle CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }

    // WebSocket upgrade
    if (url.pathname === '/ws') {
      const roomId = url.searchParams.get('room') || 'default';
      const id = env.GAME_ROOMS.idFromName(roomId);
      const room = env.GAME_ROOMS.get(id);
      
      return room.fetch(request);
    }

    // API endpoints
    if (url.pathname === '/api/rooms') {
      // List active rooms
      return new Response(JSON.stringify({
        rooms: ['default', 'competitive', 'practice']
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    if (url.pathname === '/api/stats') {
      // Get player stats
      return new Response(JSON.stringify({
        totalPlayers: 0,
        activeGames: 0
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Default response
    return new Response('Blaze Intelligence Multiplayer Server', {
      headers: {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};