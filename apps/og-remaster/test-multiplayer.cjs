#!/usr/bin/env node
/**
 * Multiplayer Server Test Client
 * Tests WebSocket connectivity and game functions
 */

const WebSocket = require('ws');

class MultiplayerTestClient {
  constructor(playerName) {
    this.playerName = playerName;
    this.playerId = null;
    this.ws = null;
  }

  connect() {
    console.log(`🎮 ${this.playerName} connecting to server...`);
    
    this.ws = new WebSocket('ws://localhost:8787');
    
    this.ws.on('open', () => {
      console.log(`✅ ${this.playerName} connected!`);
    });
    
    this.ws.on('message', (data) => {
      const message = JSON.parse(data);
      this.handleMessage(message);
    });
    
    this.ws.on('error', (error) => {
      console.error(`❌ ${this.playerName} error:`, error.message);
    });
    
    this.ws.on('close', () => {
      console.log(`👋 ${this.playerName} disconnected`);
    });
  }

  handleMessage(message) {
    console.log(`📨 ${this.playerName} received:`, message.type);
    
    switch(message.type) {
      case 'welcome':
        this.playerId = message.playerId;
        console.log(`   Player ID: ${this.playerId}`);
        console.log(`   Server stats:`, message.serverStats);
        
        // Auto-join matchmaking after welcome
        setTimeout(() => this.joinMatchmaking(), 1000);
        break;
        
      case 'matchmaking_status':
        console.log(`   Matchmaking: ${message.status}`);
        if (message.position) {
          console.log(`   Queue position: ${message.position}`);
        }
        break;
        
      case 'game_start':
        console.log(`   🏟️ Game started!`);
        console.log(`   Opponent: ${message.opponent.username}`);
        console.log(`   Your role: ${message.yourRole}`);
        
        // Simulate some game actions
        setTimeout(() => this.simulateGamePlay(), 2000);
        break;
        
      case 'game_update':
        console.log(`   Game action: ${message.action}`);
        console.log(`   New state:`, {
          inning: message.newState.inning,
          score: `${message.newState.awayScore}-${message.newState.homeScore}`,
          outs: message.newState.outs
        });
        break;
        
      case 'game_end':
        console.log(`   🏁 Game ended!`);
        console.log(`   Winner: ${message.winner}`);
        console.log(`   Final score: ${message.finalScore.away}-${message.finalScore.home}`);
        
        // Disconnect after game
        setTimeout(() => this.disconnect(), 2000);
        break;
        
      case 'error':
        console.log(`   ⚠️ Error: ${message.message}`);
        break;
    }
  }

  joinMatchmaking() {
    console.log(`🎯 ${this.playerName} joining matchmaking...`);
    this.send({
      type: 'join_matchmaking',
      username: this.playerName,
      team: 'Texas Legends',
      skillLevel: 1000 + Math.floor(Math.random() * 500)
    });
  }

  simulateGamePlay() {
    // Simulate a few game actions
    const actions = [
      { type: 'game_action', action: 'pitch', data: { type: 'fastball' } },
      { type: 'game_action', action: 'swing', data: {} },
      { type: 'chat', text: 'Great game!' }
    ];
    
    let index = 0;
    const interval = setInterval(() => {
      if (index < actions.length) {
        console.log(`🎮 ${this.playerName} action: ${actions[index].type}`);
        this.send(actions[index]);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 3000);
  }

  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  disconnect() {
    if (this.ws) {
      console.log(`👋 ${this.playerName} disconnecting...`);
      this.ws.close();
    }
  }
}

// Test with multiple clients
async function runTest() {
  console.log('🏆 BLAZE INTELLIGENCE MULTIPLAYER TEST');
  console.log('⚾ Testing WebSocket server with multiple clients...\n');
  
  // Create test players
  const player1 = new MultiplayerTestClient('BlazeBot Alpha');
  const player2 = new MultiplayerTestClient('BlazeBot Beta');
  
  // Connect players with delay
  player1.connect();
  
  setTimeout(() => {
    player2.connect();
  }, 2000);
  
  // Keep test running for 30 seconds
  setTimeout(() => {
    console.log('\n✅ Test completed!');
    process.exit(0);
  }, 30000);
}

// Run test
runTest().catch(console.error);