/**
 * Blaze Intelligence OG Remaster
 * Online Multiplayer Matchmaking System
 * Real-time competitive baseball
 */

import { MLBTeam } from '../data/MLBDataLoader';

export interface Player {
  id: string;
  username: string;
  rating: number;
  wins: number;
  losses: number;
  team?: MLBTeam;
  connectionId?: string;
  status: 'idle' | 'searching' | 'in_match' | 'offline';
  lastSeen: Date;
}

export interface Match {
  id: string;
  player1: Player;
  player2: Player;
  status: 'waiting' | 'ready' | 'in_progress' | 'completed';
  gameRoom: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  winner?: string;
  score?: { home: number; away: number };
}

export interface MatchmakingQueue {
  casual: Player[];
  ranked: Player[];
  tournament: Player[];
  private: Map<string, Player[]>;
}

export class MatchmakingSystem {
  private ws: WebSocket | null = null;
  private currentPlayer: Player | null = null;
  private queue: MatchmakingQueue = {
    casual: [],
    ranked: [],
    tournament: [],
    private: new Map()
  };
  private activeMatches: Map<string, Match> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private matchFoundCallback?: (match: Match) => void;
  private connectionStatusCallback?: (status: string) => void;
  
  constructor(serverUrl: string = 'wss://blaze-intelligence.com/matchmaking') {
    this.serverUrl = serverUrl;
    console.log('🎮 Matchmaking System initialized');
  }
  
  private serverUrl: string;
  
  public async connect(player: Player): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.currentPlayer = player;
        this.ws = new WebSocket(this.serverUrl);
        
        this.ws.onopen = () => {
          console.log('✅ Connected to matchmaking server');
          this.reconnectAttempts = 0;
          this.authenticate(player);
          this.updateConnectionStatus('connected');
          resolve();
        };
        
        this.ws.onmessage = (event) => {
          this.handleMessage(JSON.parse(event.data));
        };
        
        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.updateConnectionStatus('error');
          reject(error);
        };
        
        this.ws.onclose = () => {
          console.log('🔌 Disconnected from matchmaking server');
          this.updateConnectionStatus('disconnected');
          this.attemptReconnect();
        };
        
      } catch (error) {
        console.error('Failed to connect to matchmaking server:', error);
        reject(error);
      }
    });
  }
  
  private authenticate(player: Player): void {
    this.sendMessage({
      type: 'authenticate',
      player: {
        id: player.id,
        username: player.username,
        rating: player.rating,
        team: player.team?.id
      }
    });
  }
  
  private handleMessage(message: any): void {
    switch (message.type) {
      case 'authenticated':
        console.log('✅ Player authenticated');
        if (this.currentPlayer) {
          this.currentPlayer.connectionId = message.connectionId;
        }
        break;
        
      case 'queue_update':
        this.updateQueue(message.queue);
        break;
        
      case 'match_found':
        this.handleMatchFound(message.match);
        break;
        
      case 'match_ready':
        this.handleMatchReady(message.match);
        break;
        
      case 'match_started':
        this.handleMatchStarted(message.match);
        break;
        
      case 'match_completed':
        this.handleMatchCompleted(message.match);
        break;
        
      case 'opponent_disconnected':
        this.handleOpponentDisconnected(message.match);
        break;
        
      case 'ping':
        this.sendMessage({ type: 'pong' });
        break;
        
      default:
        console.log('Unknown message type:', message.type);
    }
  }
  
  private updateQueue(queueData: any): void {
    this.queue.casual = queueData.casual || [];
    this.queue.ranked = queueData.ranked || [];
    this.queue.tournament = queueData.tournament || [];
    
    console.log(`📊 Queue Update - Casual: ${this.queue.casual.length}, Ranked: ${this.queue.ranked.length}`);
  }
  
  private handleMatchFound(matchData: any): void {
    const match: Match = {
      id: matchData.id,
      player1: matchData.player1,
      player2: matchData.player2,
      status: 'waiting',
      gameRoom: matchData.gameRoom,
      createdAt: new Date(matchData.createdAt)
    };
    
    this.activeMatches.set(match.id, match);
    
    console.log(`🎮 Match found! ${match.player1.username} vs ${match.player2.username}`);
    
    if (this.matchFoundCallback) {
      this.matchFoundCallback(match);
    }
    
    // Auto-accept match (can be made manual)
    this.acceptMatch(match.id);
  }
  
  private handleMatchReady(matchData: any): void {
    const match = this.activeMatches.get(matchData.id);
    if (match) {
      match.status = 'ready';
      console.log(`✅ Match ${match.id} is ready to start!`);
      
      // Transition to game
      this.startGame(match);
    }
  }
  
  private handleMatchStarted(matchData: any): void {
    const match = this.activeMatches.get(matchData.id);
    if (match) {
      match.status = 'in_progress';
      match.startedAt = new Date();
      console.log(`⚾ Match ${match.id} has started!`);
    }
  }
  
  private handleMatchCompleted(matchData: any): void {
    const match = this.activeMatches.get(matchData.id);
    if (match) {
      match.status = 'completed';
      match.completedAt = new Date();
      match.winner = matchData.winner;
      match.score = matchData.score;
      
      console.log(`🏆 Match completed! Winner: ${match.winner}`);
      
      // Update player stats
      if (this.currentPlayer) {
        if (match.winner === this.currentPlayer.id) {
          this.currentPlayer.wins++;
          this.currentPlayer.rating += this.calculateRatingChange(true, match);
        } else {
          this.currentPlayer.losses++;
          this.currentPlayer.rating += this.calculateRatingChange(false, match);
        }
      }
      
      this.activeMatches.delete(match.id);
    }
  }
  
  private handleOpponentDisconnected(matchData: any): void {
    const match = this.activeMatches.get(matchData.id);
    if (match) {
      console.log('⚠️ Opponent disconnected! Waiting for reconnection...');
      
      // Start reconnection timer (give opponent 60 seconds)
      setTimeout(() => {
        if (match.status === 'in_progress') {
          // Award win if opponent doesn't reconnect
          this.claimVictory(match.id);
        }
      }, 60000);
    }
  }
  
  public searchMatch(mode: 'casual' | 'ranked' | 'tournament'): void {
    if (!this.currentPlayer || !this.ws) {
      console.error('Not connected to matchmaking server');
      return;
    }
    
    this.currentPlayer.status = 'searching';
    
    this.sendMessage({
      type: 'search_match',
      mode: mode,
      player: this.currentPlayer
    });
    
    console.log(`🔍 Searching for ${mode} match...`);
    
    // Show searching UI
    this.showSearchingUI(mode);
  }
  
  public cancelSearch(): void {
    if (!this.currentPlayer) return;
    
    this.currentPlayer.status = 'idle';
    
    this.sendMessage({
      type: 'cancel_search',
      player: this.currentPlayer
    });
    
    console.log('❌ Search cancelled');
    this.hideSearchingUI();
  }
  
  public acceptMatch(matchId: string): void {
    this.sendMessage({
      type: 'accept_match',
      matchId: matchId,
      player: this.currentPlayer
    });
  }
  
  public declineMatch(matchId: string): void {
    this.sendMessage({
      type: 'decline_match',
      matchId: matchId,
      player: this.currentPlayer
    });
    
    this.activeMatches.delete(matchId);
  }
  
  public createPrivateRoom(roomCode?: string): string {
    const code = roomCode || this.generateRoomCode();
    
    this.sendMessage({
      type: 'create_private_room',
      roomCode: code,
      player: this.currentPlayer
    });
    
    console.log(`🏠 Private room created: ${code}`);
    return code;
  }
  
  public joinPrivateRoom(roomCode: string): void {
    this.sendMessage({
      type: 'join_private_room',
      roomCode: roomCode,
      player: this.currentPlayer
    });
    
    console.log(`🚪 Joining private room: ${roomCode}`);
  }
  
  private generateRoomCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  
  private startGame(match: Match): void {
    // Connect to game room
    const gameWs = new WebSocket(`${this.serverUrl}/game/${match.gameRoom}`);
    
    gameWs.onopen = () => {
      console.log(`🎮 Connected to game room: ${match.gameRoom}`);
      
      // Notify game that player is ready
      gameWs.send(JSON.stringify({
        type: 'player_ready',
        playerId: this.currentPlayer?.id,
        team: this.currentPlayer?.team
      }));
    };
    
    // Handle game messages
    gameWs.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleGameMessage(message, match);
    };
    
    // Store game connection
    (match as any).gameConnection = gameWs;
  }
  
  private handleGameMessage(message: any, match: Match): void {
    // This would be handled by the main game engine
    // Forward messages to game state manager
    console.log('Game message:', message.type);
  }
  
  private calculateRatingChange(won: boolean, match: Match): number {
    if (!this.currentPlayer) return 0;
    
    const opponent = match.player1.id === this.currentPlayer.id ? match.player2 : match.player1;
    const ratingDiff = opponent.rating - this.currentPlayer.rating;
    
    // ELO-like rating calculation
    const expectedScore = 1 / (1 + Math.pow(10, ratingDiff / 400));
    const actualScore = won ? 1 : 0;
    const kFactor = 32; // K-factor for rating volatility
    
    return Math.round(kFactor * (actualScore - expectedScore));
  }
  
  private claimVictory(matchId: string): void {
    this.sendMessage({
      type: 'claim_victory',
      matchId: matchId,
      player: this.currentPlayer
    });
  }
  
  private sendMessage(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }
  
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }
    
    this.reconnectAttempts++;
    console.log(`Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);
    
    setTimeout(() => {
      if (this.currentPlayer) {
        this.connect(this.currentPlayer);
      }
    }, 2000 * this.reconnectAttempts);
  }
  
  private updateConnectionStatus(status: string): void {
    if (this.connectionStatusCallback) {
      this.connectionStatusCallback(status);
    }
  }
  
  private showSearchingUI(mode: string): void {
    const searchUI = document.createElement('div');
    searchUI.id = 'matchmaking-search';
    searchUI.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, #1a1a2e, #16213e);
      border: 3px solid #FF6B35;
      border-radius: 15px;
      padding: 30px;
      z-index: 10000;
      text-align: center;
      font-family: 'Press Start 2P', monospace;
      animation: pulse 2s infinite;
    `;
    
    searchUI.innerHTML = `
      <h3 style="color: white; font-size: 16px; margin-bottom: 20px;">
        SEARCHING FOR ${mode.toUpperCase()} MATCH
      </h3>
      <div class="spinner" style="
        width: 50px;
        height: 50px;
        border: 4px solid rgba(255, 107, 53, 0.3);
        border-top: 4px solid #FF6B35;
        border-radius: 50%;
        margin: 20px auto;
        animation: spin 1s linear infinite;
      "></div>
      <p style="color: #888; font-size: 10px; margin: 15px 0;">
        Players in queue: <span id="queue-count">0</span>
      </p>
      <p style="color: #888; font-size: 10px; margin: 15px 0;">
        Estimated wait: <span id="wait-time">< 1 min</span>
      </p>
      <button onclick="window.blazeGame?.matchmaking?.cancelSearch()" style="
        background: #FF6B35;
        border: none;
        color: white;
        padding: 10px 20px;
        font-family: 'Press Start 2P', monospace;
        font-size: 10px;
        cursor: pointer;
        border-radius: 5px;
        margin-top: 20px;
      ">CANCEL</button>
    `;
    
    document.body.appendChild(searchUI);
    
    // Add animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.9; }
      }
    `;
    document.head.appendChild(style);
  }
  
  private hideSearchingUI(): void {
    const searchUI = document.getElementById('matchmaking-search');
    if (searchUI) {
      searchUI.remove();
    }
  }
  
  public onMatchFound(callback: (match: Match) => void): void {
    this.matchFoundCallback = callback;
  }
  
  public onConnectionStatus(callback: (status: string) => void): void {
    this.connectionStatusCallback = callback;
  }
  
  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.currentPlayer = null;
    this.activeMatches.clear();
  }
  
  public getQueueStats(): { casual: number; ranked: number; tournament: number } {
    return {
      casual: this.queue.casual.length,
      ranked: this.queue.ranked.length,
      tournament: this.queue.tournament.length
    };
  }
  
  public getCurrentMatch(): Match | undefined {
    if (!this.currentPlayer) return undefined;
    
    for (const match of this.activeMatches.values()) {
      if (match.player1.id === this.currentPlayer.id || 
          match.player2.id === this.currentPlayer.id) {
        return match;
      }
    }
    
    return undefined;
  }
}