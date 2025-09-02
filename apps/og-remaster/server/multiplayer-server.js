#!/usr/bin/env node
/**
 * Blaze Intelligence OG Remaster - Multiplayer Server
 * Real-time WebSocket server for competitive online baseball
 */

const WebSocket = require('ws');
const http = require('http');
const crypto = require('crypto');

class MultiplayerServer {
  constructor(port = 8787) {
    this.port = port;
    this.server = http.createServer();
    this.wss = new WebSocket.Server({ server: this.server });
    
    // Game state management
    this.games = new Map(); // gameId -> GameRoom
    this.players = new Map(); // playerId -> PlayerSession
    this.matchmaking = []; // Players waiting for match
    
    // Server stats
    this.stats = {
      totalGames: 0,
      activeGames: 0,
      totalPlayers: 0,
      activePlayers: 0,
      messagesProcessed: 0,
      startTime: Date.now()
    };
    
    this.setupWebSocketHandlers();
    this.startMatchmakingLoop();
    this.startHealthCheck();
  }

  setupWebSocketHandlers() {
    this.wss.on('connection', (ws, req) => {
      const playerId = this.generatePlayerId();
      const playerSession = {
        id: playerId,
        ws: ws,
        gameId: null,
        username: null,
        team: null,
        stats: {
          wins: 0,
          losses: 0,
          homeRuns: 0,
          strikeouts: 0
        },
        ping: 0,
        lastActivity: Date.now()
      };
      
      this.players.set(playerId, playerSession);
      this.stats.activePlayers++;
      this.stats.totalPlayers++;
      
      console.log(`⚾ Player connected: ${playerId}`);
      
      // Send welcome message
      this.sendToPlayer(playerId, {
        type: 'welcome',
        playerId: playerId,
        serverTime: Date.now(),
        serverStats: this.getPublicStats()
      });
      
      // Handle player messages
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handlePlayerMessage(playerId, data);
          this.stats.messagesProcessed++;
        } catch (error) {
          console.error('Invalid message from player:', playerId, error);
          this.sendError(playerId, 'Invalid message format');
        }
      });
      
      // Handle disconnection
      ws.on('close', () => {
        this.handlePlayerDisconnect(playerId);
      });
      
      // Handle errors
      ws.on('error', (error) => {
        console.error(`WebSocket error for player ${playerId}:`, error);
      });
      
      // Ping/pong for connection health
      ws.on('pong', () => {
        playerSession.ping = Date.now() - playerSession.lastPing;
      });
    });
  }

  handlePlayerMessage(playerId, message) {
    const player = this.players.get(playerId);
    if (!player) return;
    
    player.lastActivity = Date.now();
    
    switch (message.type) {
      case 'join_matchmaking':
        this.joinMatchmaking(playerId, message);
        break;
        
      case 'create_private_game':
        this.createPrivateGame(playerId, message);
        break;
        
      case 'join_private_game':
        this.joinPrivateGame(playerId, message);
        break;
        
      case 'game_action':
        this.handleGameAction(playerId, message);
        break;
        
      case 'chat':
        this.handleChat(playerId, message);
        break;
        
      case 'get_leaderboard':
        this.sendLeaderboard(playerId);
        break;
        
      case 'ping':
        this.sendToPlayer(playerId, { type: 'pong', timestamp: Date.now() });
        break;
        
      default:
        this.sendError(playerId, `Unknown message type: ${message.type}`);
    }
  }

  joinMatchmaking(playerId, message) {
    const player = this.players.get(playerId);
    player.username = message.username || `Player${playerId.substr(0, 6)}`;
    player.team = message.team || 'random';
    player.skillLevel = message.skillLevel || 1000; // ELO-style rating
    
    // Check if already in matchmaking
    if (this.matchmaking.includes(playerId)) {
      this.sendToPlayer(playerId, {
        type: 'matchmaking_status',
        status: 'already_queued',
        position: this.matchmaking.indexOf(playerId) + 1
      });
      return;
    }
    
    // Add to matchmaking queue
    this.matchmaking.push(playerId);
    
    this.sendToPlayer(playerId, {
      type: 'matchmaking_status',
      status: 'queued',
      position: this.matchmaking.length,
      estimatedWait: this.estimateWaitTime()
    });
    
    console.log(`🎮 ${player.username} joined matchmaking (${this.matchmaking.length} in queue)`);
  }

  startMatchmakingLoop() {
    setInterval(() => {
      this.processMatchmaking();
    }, 2000); // Check every 2 seconds
  }

  processMatchmaking() {
    if (this.matchmaking.length < 2) return;
    
    // Simple FIFO matching for now (could implement skill-based later)
    while (this.matchmaking.length >= 2) {
      const player1Id = this.matchmaking.shift();
      const player2Id = this.matchmaking.shift();
      
      const player1 = this.players.get(player1Id);
      const player2 = this.players.get(player2Id);
      
      // Verify both players still connected
      if (!player1 || !player2) {
        // Re-add valid player to queue
        if (player1) this.matchmaking.unshift(player1Id);
        if (player2) this.matchmaking.unshift(player2Id);
        continue;
      }
      
      // Create game
      this.createGame(player1Id, player2Id);
    }
  }

  createGame(player1Id, player2Id) {
    const gameId = this.generateGameId();
    const player1 = this.players.get(player1Id);
    const player2 = this.players.get(player2Id);
    
    const gameRoom = {
      id: gameId,
      players: [player1Id, player2Id],
      homePlayer: player1Id,
      awayPlayer: player2Id,
      state: {
        inning: 1,
        topHalf: true,
        homeScore: 0,
        awayScore: 0,
        balls: 0,
        strikes: 0,
        outs: 0,
        bases: { first: false, second: false, third: false },
        currentBatter: player2Id, // Away team bats first
        currentPitcher: player1Id
      },
      chat: [],
      startTime: Date.now(),
      lastUpdate: Date.now(),
      isPrivate: false
    };
    
    this.games.set(gameId, gameRoom);
    player1.gameId = gameId;
    player2.gameId = gameId;
    
    this.stats.activeGames++;
    this.stats.totalGames++;
    
    // Notify both players
    const gameStartMessage = {
      type: 'game_start',
      gameId: gameId,
      opponent: {
        [player1Id]: {
          id: player2Id,
          username: player2.username,
          team: player2.team,
          stats: player2.stats
        },
        [player2Id]: {
          id: player1Id,
          username: player1.username,
          team: player1.team,
          stats: player1.stats
        }
      },
      yourRole: {
        [player1Id]: 'home',
        [player2Id]: 'away'
      },
      initialState: gameRoom.state
    };
    
    this.sendToPlayer(player1Id, {
      ...gameStartMessage,
      opponent: gameStartMessage.opponent[player1Id],
      yourRole: gameStartMessage.yourRole[player1Id]
    });
    
    this.sendToPlayer(player2Id, {
      ...gameStartMessage,
      opponent: gameStartMessage.opponent[player2Id],
      yourRole: gameStartMessage.yourRole[player2Id]
    });
    
    console.log(`🏟️ Game started: ${player1.username} vs ${player2.username} (${gameId})`);
  }

  handleGameAction(playerId, message) {
    const player = this.players.get(playerId);
    if (!player || !player.gameId) {
      this.sendError(playerId, 'Not in a game');
      return;
    }
    
    const game = this.games.get(player.gameId);
    if (!game) {
      this.sendError(playerId, 'Game not found');
      return;
    }
    
    // Validate it's player's turn
    const isPlayerTurn = this.validatePlayerTurn(game, playerId, message.action);
    if (!isPlayerTurn) {
      this.sendError(playerId, 'Not your turn');
      return;
    }
    
    // Process game action
    const result = this.processGameAction(game, playerId, message.action, message.data);
    
    // Update game state
    game.state = result.newState;
    game.lastUpdate = Date.now();
    
    // Broadcast update to both players
    this.broadcastToGame(game.id, {
      type: 'game_update',
      action: message.action,
      result: result.actionResult,
      newState: game.state,
      timestamp: Date.now()
    });
    
    // Check for game end
    if (result.gameEnded) {
      this.endGame(game.id, result.winner);
    }
  }

  processGameAction(game, playerId, action, data) {
    const result = {
      newState: { ...game.state },
      actionResult: {},
      gameEnded: false,
      winner: null
    };
    
    switch (action) {
      case 'pitch':
        // Simulate pitch result
        const pitchTypes = ['fastball', 'curveball', 'slider', 'changeup'];
        const pitchType = data.type || pitchTypes[Math.floor(Math.random() * pitchTypes.length)];
        const isStrike = Math.random() > 0.4;
        
        if (isStrike) {
          result.newState.strikes++;
          result.actionResult = { type: 'strike', pitch: pitchType };
          
          if (result.newState.strikes >= 3) {
            result.newState.outs++;
            result.newState.strikes = 0;
            result.newState.balls = 0;
            result.actionResult.strikeout = true;
          }
        } else {
          result.newState.balls++;
          result.actionResult = { type: 'ball', pitch: pitchType };
          
          if (result.newState.balls >= 4) {
            result.actionResult.walk = true;
            this.advanceRunners(result.newState, 1);
            result.newState.balls = 0;
            result.newState.strikes = 0;
          }
        }
        break;
        
      case 'swing':
        // Simulate swing result
        const contact = Math.random() > 0.3;
        
        if (contact) {
          const hitPower = Math.random();
          
          if (hitPower > 0.9) {
            // Home run!
            result.actionResult = { type: 'homerun' };
            const runsScored = this.scoreHomeRun(result.newState);
            
            if (result.newState.topHalf) {
              result.newState.awayScore += runsScored;
            } else {
              result.newState.homeScore += runsScored;
            }
          } else if (hitPower > 0.7) {
            // Double
            result.actionResult = { type: 'double' };
            this.advanceRunners(result.newState, 2);
          } else if (hitPower > 0.4) {
            // Single
            result.actionResult = { type: 'single' };
            this.advanceRunners(result.newState, 1);
          } else {
            // Groundout
            result.actionResult = { type: 'groundout' };
            result.newState.outs++;
          }
          
          result.newState.balls = 0;
          result.newState.strikes = 0;
        } else {
          // Strike
          result.newState.strikes++;
          result.actionResult = { type: 'miss' };
          
          if (result.newState.strikes >= 3) {
            result.newState.outs++;
            result.newState.strikes = 0;
            result.newState.balls = 0;
            result.actionResult.strikeout = true;
          }
        }
        break;
    }
    
    // Check for inning change
    if (result.newState.outs >= 3) {
      result.newState.outs = 0;
      result.newState.balls = 0;
      result.newState.strikes = 0;
      result.newState.bases = { first: false, second: false, third: false };
      
      if (result.newState.topHalf) {
        result.newState.topHalf = false;
      } else {
        result.newState.topHalf = true;
        result.newState.inning++;
      }
      
      // Swap batter/pitcher
      const temp = result.newState.currentBatter;
      result.newState.currentBatter = result.newState.currentPitcher;
      result.newState.currentPitcher = temp;
    }
    
    // Check for game end (9 innings)
    if (result.newState.inning > 9 && !result.newState.topHalf) {
      if (result.newState.homeScore !== result.newState.awayScore) {
        result.gameEnded = true;
        result.winner = result.newState.homeScore > result.newState.awayScore
          ? game.homePlayer
          : game.awayPlayer;
      }
    }
    
    return result;
  }

  advanceRunners(state, bases) {
    const scored = [];
    
    // Move existing runners
    if (state.bases.third && bases >= 1) {
      scored.push('third');
      state.bases.third = false;
    }
    if (state.bases.second) {
      if (bases >= 2) {
        scored.push('second');
        state.bases.second = false;
      } else if (bases === 1) {
        state.bases.third = true;
        state.bases.second = false;
      }
    }
    if (state.bases.first) {
      if (bases >= 3) {
        scored.push('first');
        state.bases.first = false;
      } else if (bases === 2) {
        state.bases.third = true;
        state.bases.first = false;
      } else if (bases === 1) {
        state.bases.second = true;
        state.bases.first = false;
      }
    }
    
    // Place new runner
    if (bases === 1) state.bases.first = true;
    else if (bases === 2) state.bases.second = true;
    else if (bases === 3) state.bases.third = true;
    
    // Score runs
    const runsScored = scored.length;
    if (state.topHalf) {
      state.awayScore += runsScored;
    } else {
      state.homeScore += runsScored;
    }
    
    return runsScored;
  }

  scoreHomeRun(state) {
    let runs = 1; // Batter scores
    
    if (state.bases.first) runs++;
    if (state.bases.second) runs++;
    if (state.bases.third) runs++;
    
    // Clear bases
    state.bases = { first: false, second: false, third: false };
    
    return runs;
  }

  validatePlayerTurn(game, playerId, action) {
    if (action === 'pitch') {
      return playerId === game.state.currentPitcher;
    } else if (action === 'swing') {
      return playerId === game.state.currentBatter;
    }
    return false;
  }

  endGame(gameId, winnerId) {
    const game = this.games.get(gameId);
    if (!game) return;
    
    const winner = this.players.get(winnerId);
    const loserId = game.players.find(p => p !== winnerId);
    const loser = this.players.get(loserId);
    
    // Update stats
    if (winner) {
      winner.stats.wins++;
    }
    if (loser) {
      loser.stats.losses++;
    }
    
    // Send game end message
    this.broadcastToGame(gameId, {
      type: 'game_end',
      winner: winnerId,
      finalScore: {
        home: game.state.homeScore,
        away: game.state.awayScore
      },
      duration: Date.now() - game.startTime,
      stats: {
        [winnerId]: winner ? winner.stats : {},
        [loserId]: loser ? loser.stats : {}
      }
    });
    
    // Clean up
    game.players.forEach(playerId => {
      const player = this.players.get(playerId);
      if (player) {
        player.gameId = null;
      }
    });
    
    this.games.delete(gameId);
    this.stats.activeGames--;
    
    console.log(`🏁 Game ended: ${winnerId} wins (${gameId})`);
  }

  handleChat(playerId, message) {
    const player = this.players.get(playerId);
    if (!player || !player.gameId) return;
    
    const game = this.games.get(player.gameId);
    if (!game) return;
    
    const chatMessage = {
      playerId: playerId,
      username: player.username,
      text: message.text.substring(0, 200), // Limit message length
      timestamp: Date.now()
    };
    
    game.chat.push(chatMessage);
    
    // Keep only last 50 messages
    if (game.chat.length > 50) {
      game.chat.shift();
    }
    
    // Broadcast to both players
    this.broadcastToGame(game.id, {
      type: 'chat',
      message: chatMessage
    });
  }

  sendLeaderboard(playerId) {
    const leaderboard = Array.from(this.players.values())
      .map(player => ({
        username: player.username,
        wins: player.stats.wins,
        losses: player.stats.losses,
        winRate: player.stats.wins / (player.stats.wins + player.stats.losses) || 0,
        homeRuns: player.stats.homeRuns,
        strikeouts: player.stats.strikeouts
      }))
      .sort((a, b) => b.wins - a.wins)
      .slice(0, 10);
    
    this.sendToPlayer(playerId, {
      type: 'leaderboard',
      data: leaderboard,
      timestamp: Date.now()
    });
  }

  handlePlayerDisconnect(playerId) {
    const player = this.players.get(playerId);
    if (!player) return;
    
    console.log(`⚾ Player disconnected: ${playerId}`);
    
    // Remove from matchmaking
    const matchIndex = this.matchmaking.indexOf(playerId);
    if (matchIndex > -1) {
      this.matchmaking.splice(matchIndex, 1);
    }
    
    // Handle game abandonment
    if (player.gameId) {
      const game = this.games.get(player.gameId);
      if (game) {
        const opponentId = game.players.find(p => p !== playerId);
        
        // Notify opponent
        this.sendToPlayer(opponentId, {
          type: 'opponent_disconnected',
          message: 'Your opponent has disconnected'
        });
        
        // End game with opponent as winner
        this.endGame(game.id, opponentId);
      }
    }
    
    // Clean up
    this.players.delete(playerId);
    this.stats.activePlayers--;
  }

  broadcastToGame(gameId, message) {
    const game = this.games.get(gameId);
    if (!game) return;
    
    game.players.forEach(playerId => {
      this.sendToPlayer(playerId, message);
    });
  }

  sendToPlayer(playerId, message) {
    const player = this.players.get(playerId);
    if (!player || player.ws.readyState !== WebSocket.OPEN) return;
    
    try {
      player.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error(`Failed to send message to player ${playerId}:`, error);
    }
  }

  sendError(playerId, error) {
    this.sendToPlayer(playerId, {
      type: 'error',
      message: error,
      timestamp: Date.now()
    });
  }

  generatePlayerId() {
    return `player_${crypto.randomBytes(8).toString('hex')}`;
  }

  generateGameId() {
    return `game_${crypto.randomBytes(8).toString('hex')}`;
  }

  estimateWaitTime() {
    // Simple estimate based on queue size
    return Math.max(5, this.matchmaking.length * 3);
  }

  getPublicStats() {
    return {
      activePlayers: this.stats.activePlayers,
      activeGames: this.stats.activeGames,
      totalGames: this.stats.totalGames,
      uptime: Date.now() - this.stats.startTime
    };
  }

  startHealthCheck() {
    // Ping all connected players
    setInterval(() => {
      this.players.forEach((player, playerId) => {
        if (player.ws.readyState === WebSocket.OPEN) {
          player.lastPing = Date.now();
          player.ws.ping();
        }
      });
    }, 30000); // Every 30 seconds
    
    // Clean up inactive players
    setInterval(() => {
      const now = Date.now();
      const timeout = 60000; // 1 minute
      
      this.players.forEach((player, playerId) => {
        if (now - player.lastActivity > timeout) {
          console.log(`Removing inactive player: ${playerId}`);
          this.handlePlayerDisconnect(playerId);
        }
      });
    }, 60000); // Every minute
  }

  start() {
    this.server.listen(this.port, () => {
      console.log('🏆 Blaze Intelligence Multiplayer Server');
      console.log(`⚾ Listening on port ${this.port}`);
      console.log(`🌐 WebSocket endpoint: ws://localhost:${this.port}`);
      console.log('');
      console.log('Server ready for championship baseball!');
    });
  }
}

// Start server if run directly
if (require.main === module) {
  const port = process.env.PORT || 8787;
  const server = new MultiplayerServer(port);
  server.start();
}

module.exports = MultiplayerServer;