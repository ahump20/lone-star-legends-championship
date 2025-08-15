/**
 * Multiplayer WebSocket Server for Lone Star Legends Championship
 * Real-time multiplayer baseball simulator with AI player coordination
 */

const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

class MultiplayerBaseballServer {
    constructor(port = 8081) {
        this.port = port;
        this.clients = new Map();
        this.games = new Map();
        this.playerQueue = [];
        this.server = null;
        this.wss = null;
        
        // Game state management
        this.gameIdCounter = 1;
        this.maxPlayersPerGame = 2; // 1v1 for now, can expand
        
        this.initializeServer();
    }

    initializeServer() {
        // Create HTTP server for serving static files
        this.server = http.createServer((req, res) => {
            this.handleHttpRequest(req, res);
        });

        // Create WebSocket server
        this.wss = new WebSocket.Server({ 
            server: this.server,
            path: '/baseball-multiplayer'
        });

        this.wss.on('connection', (ws, req) => {
            this.handleNewConnection(ws, req);
        });

        this.server.listen(this.port, () => {
            console.log(`🚀 Lone Star Legends Multiplayer Server`);
            console.log(`===========================================`);
            console.log(`🌐 HTTP Server: http://localhost:${this.port}`);
            console.log(`⚡ WebSocket: ws://localhost:${this.port}/baseball-multiplayer`);
            console.log(`⚾ Multiplayer Baseball: READY`);
            console.log(`🤖 AI Player Integration: ACTIVE`);
            console.log(`===========================================`);
        });

        // Cleanup on process termination
        process.on('SIGTERM', () => this.shutdown());
        process.on('SIGINT', () => this.shutdown());
    }

    handleHttpRequest(req, res) {
        let filePath = '.' + req.url;
        if (filePath === './') {
            filePath = './multiplayer-client.html';
        }

        // Security: prevent directory traversal
        const safePath = path.normalize(filePath).replace(/^(\.\.[\/\\])+/, '');
        
        if (fs.existsSync(safePath)) {
            const ext = path.extname(safePath);
            const contentType = this.getContentType(ext);
            
            fs.readFile(safePath, (err, content) => {
                if (err) {
                    res.writeHead(500);
                    res.end('Server Error');
                } else {
                    res.writeHead(200, { 'Content-Type': contentType });
                    res.end(content, 'utf-8');
                }
            });
        } else {
            res.writeHead(404);
            res.end('File not found');
        }
    }

    getContentType(ext) {
        const contentTypes = {
            '.html': 'text/html',
            '.js': 'text/javascript',
            '.css': 'text/css',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.gif': 'image/gif'
        };
        return contentTypes[ext] || 'application/octet-stream';
    }

    handleNewConnection(ws, req) {
        const clientId = this.generateClientId();
        
        const client = {
            id: clientId,
            ws: ws,
            playerName: null,
            gameId: null,
            isReady: false,
            stats: this.initializeClientStats(),
            lastPing: Date.now()
        };

        this.clients.set(clientId, client);
        console.log(`🔗 New player connected: ${clientId}`);

        // Setup message handlers
        ws.on('message', (data) => {
            this.handleMessage(clientId, data);
        });

        ws.on('close', () => {
            this.handleDisconnection(clientId);
        });

        ws.on('error', (error) => {
            console.error(`❌ WebSocket error for ${clientId}:`, error);
        });

        // Send welcome message
        this.sendToClient(clientId, {
            type: 'connected',
            clientId: clientId,
            serverInfo: {
                name: 'Lone Star Legends Multiplayer',
                version: '1.0.0',
                features: ['Real-time Multiplayer', 'AI Players', 'Live Stats', 'Spectator Mode']
            }
        });
    }

    generateClientId() {
        return 'client_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5);
    }

    initializeClientStats() {
        return {
            gamesPlayed: 0,
            wins: 0,
            losses: 0,
            totalAtBats: 0,
            hits: 0,
            homeRuns: 0,
            battingAverage: 0.000,
            joinTime: Date.now()
        };
    }

    handleMessage(clientId, data) {
        try {
            const message = JSON.parse(data.toString());
            const client = this.clients.get(clientId);
            
            if (!client) {
                console.warn(`⚠️ Message from unknown client: ${clientId}`);
                return;
            }

            console.log(`📨 Message from ${clientId}:`, message.type);

            switch (message.type) {
                case 'setPlayerName':
                    this.handleSetPlayerName(clientId, message);
                    break;
                case 'joinQueue':
                    this.handleJoinQueue(clientId, message);
                    break;
                case 'leaveQueue':
                    this.handleLeaveQueue(clientId);
                    break;
                case 'gameAction':
                    this.handleGameAction(clientId, message);
                    break;
                case 'spectateGame':
                    this.handleSpectateGame(clientId, message);
                    break;
                case 'chatMessage':
                    this.handleChatMessage(clientId, message);
                    break;
                case 'ping':
                    this.handlePing(clientId, message);
                    break;
                default:
                    console.warn(`⚠️ Unknown message type: ${message.type}`);
            }
        } catch (error) {
            console.error(`❌ Error handling message from ${clientId}:`, error);
        }
    }

    handleSetPlayerName(clientId, message) {
        const client = this.clients.get(clientId);
        if (client && message.playerName) {
            client.playerName = message.playerName.substring(0, 20); // Limit length
            
            this.sendToClient(clientId, {
                type: 'playerNameSet',
                playerName: client.playerName
            });
            
            console.log(`👤 Player ${clientId} set name: ${client.playerName}`);
        }
    }

    handleJoinQueue(clientId, message) {
        const client = this.clients.get(clientId);
        if (!client || !client.playerName) {
            this.sendToClient(clientId, {
                type: 'error',
                message: 'Please set a player name first'
            });
            return;
        }

        // Add to matchmaking queue
        if (!this.playerQueue.includes(clientId)) {
            this.playerQueue.push(clientId);
            console.log(`🎯 Player ${client.playerName} joined matchmaking queue`);
            
            this.sendToClient(clientId, {
                type: 'queueJoined',
                position: this.playerQueue.indexOf(clientId) + 1,
                estimatedWait: this.calculateEstimatedWait()
            });

            // Try to match players
            this.attemptMatchmaking();
        }
    }

    handleLeaveQueue(clientId) {
        const index = this.playerQueue.indexOf(clientId);
        if (index > -1) {
            this.playerQueue.splice(index, 1);
            
            this.sendToClient(clientId, {
                type: 'queueLeft'
            });
            
            console.log(`🚪 Player left matchmaking queue: ${clientId}`);
        }
    }

    attemptMatchmaking() {
        if (this.playerQueue.length >= this.maxPlayersPerGame) {
            // Create new game with first players in queue
            const players = this.playerQueue.splice(0, this.maxPlayersPerGame);
            this.createGame(players);
        }
    }

    createGame(playerIds) {
        const gameId = `game_${this.gameIdCounter++}`;
        
        const game = {
            id: gameId,
            players: playerIds.map(id => ({
                clientId: id,
                playerName: this.clients.get(id).playerName,
                isReady: false,
                team: null,
                aiPlayers: [] // Each human controls AI players
            })),
            spectators: [],
            state: 'waiting', // waiting, playing, finished
            inning: 1,
            score: { home: 0, away: 0 },
            currentBatter: null,
            gameSettings: {
                innings: 9,
                difficulty: 'normal',
                aiAssist: true
            },
            startTime: null,
            endTime: null,
            gameHistory: []
        };

        this.games.set(gameId, game);

        // Assign teams
        game.players[0].team = 'away';
        game.players[1].team = 'home';

        // Update client game assignments
        playerIds.forEach(clientId => {
            const client = this.clients.get(clientId);
            client.gameId = gameId;
        });

        // Notify players about game creation
        this.broadcastToGame(gameId, {
            type: 'gameCreated',
            gameId: gameId,
            players: game.players.map(p => ({
                playerName: p.playerName,
                team: p.team
            })),
            settings: game.gameSettings
        });

        console.log(`🎮 Created game ${gameId} with players: ${game.players.map(p => p.playerName).join(', ')}`);
        
        // Initialize AI players for each human player
        this.initializeGameAI(gameId);
    }

    initializeGameAI(gameId) {
        const game = this.games.get(gameId);
        if (!game) return;

        // Create AI players for each human player's team
        game.players.forEach(player => {
            // Each player gets a team of 9 AI players
            player.aiPlayers = this.createAITeam(player.team);
        });

        // Broadcast AI team info
        this.broadcastToGame(gameId, {
            type: 'aiTeamsInitialized',
            teams: game.players.map(p => ({
                team: p.team,
                playerName: p.playerName,
                roster: p.aiPlayers.map(ai => ({
                    name: ai.name,
                    position: ai.position,
                    championQuotient: ai.getChampionQuotient(),
                    personality: ai.personality.name
                }))
            }))
        });

        console.log(`🤖 Initialized AI teams for game ${gameId}`);
    }

    createAITeam(teamName) {
        // Create team based on Advanced AI Player system
        const positions = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];
        const teamNames = {
            'home': ['Rodriguez', 'Martinez', 'Johnson', 'Williams', 'Davis', 'Garcia', 'Wilson', 'Anderson', 'Taylor'],
            'away': ['Jackson', 'Thompson', 'White', 'Brown', 'Miller', 'Jones', 'Smith', 'Moore', 'Clark']
        };

        return positions.map((pos, index) => {
            // This would use the AdvancedAIPlayer class if available
            return {
                name: teamNames[teamName][index],
                position: pos,
                skillLevel: 0.7 + Math.random() * 0.3,
                getChampionQuotient: () => Math.floor(70 + Math.random() * 30),
                personality: { name: 'Developing Talent' }
            };
        });
    }

    handleGameAction(clientId, message) {
        const client = this.clients.get(clientId);
        if (!client || !client.gameId) {
            this.sendToClient(clientId, {
                type: 'error',
                message: 'You are not in a game'
            });
            return;
        }

        const game = this.games.get(client.gameId);
        if (!game) return;

        console.log(`⚾ Game action from ${client.playerName}:`, message.action);

        switch (message.action) {
            case 'ready':
                this.handlePlayerReady(clientId, game);
                break;
            case 'swing':
                this.handleSwing(clientId, game, message);
                break;
            case 'pitch':
                this.handlePitch(clientId, game, message);
                break;
            case 'fieldingChoice':
                this.handleFieldingChoice(clientId, game, message);
                break;
            default:
                console.warn(`Unknown game action: ${message.action}`);
        }
    }

    handlePlayerReady(clientId, game) {
        const player = game.players.find(p => p.clientId === clientId);
        if (player) {
            player.isReady = true;
            
            // Check if all players are ready
            if (game.players.every(p => p.isReady)) {
                this.startGame(game.id);
            } else {
                this.broadcastToGame(game.id, {
                    type: 'playerReady',
                    playerName: player.playerName,
                    allReady: false
                });
            }
        }
    }

    startGame(gameId) {
        const game = this.games.get(gameId);
        if (!game) return;

        game.state = 'playing';
        game.startTime = Date.now();
        
        // Set initial batter
        game.currentBatter = game.players.find(p => p.team === 'away');

        this.broadcastToGame(gameId, {
            type: 'gameStarted',
            gameId: gameId,
            initialState: {
                inning: game.inning,
                score: game.score,
                currentBatter: game.currentBatter.playerName
            }
        });

        console.log(`🚀 Game started: ${gameId}`);
        
        // Start game simulation loop
        this.startGameLoop(gameId);
    }

    startGameLoop(gameId) {
        const game = this.games.get(gameId);
        if (!game || game.state !== 'playing') return;

        // Simulate at-bat
        setTimeout(() => {
            this.simulateAtBat(gameId);
            
            // Continue game loop
            if (game.state === 'playing') {
                this.startGameLoop(gameId);
            }
        }, 3000); // 3 second intervals
    }

    simulateAtBat(gameId) {
        const game = this.games.get(gameId);
        if (!game) return;

        // Simulate at-bat result
        const outcomes = ['single', 'double', 'homerun', 'out', 'strikeout', 'walk'];
        const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
        
        const atBatResult = {
            batter: game.currentBatter.playerName,
            outcome: outcome,
            inning: game.inning,
            exitVelocity: outcome.includes('hit') ? 85 + Math.random() * 30 : null,
            launchAngle: outcome.includes('hit') ? 10 + Math.random() * 30 : null
        };

        // Update score
        if (outcome === 'homerun') {
            if (game.currentBatter.team === 'home') {
                game.score.home++;
            } else {
                game.score.away++;
            }
        }

        // Broadcast at-bat result
        this.broadcastToGame(gameId, {
            type: 'atBatResult',
            result: atBatResult,
            gameState: {
                inning: game.inning,
                score: game.score
            }
        });

        // Update game history
        game.gameHistory.push({
            timestamp: Date.now(),
            ...atBatResult
        });

        // Check for inning/game end
        this.checkGameProgress(gameId);
        
        console.log(`⚾ At-bat simulated in ${gameId}: ${outcome}`);
    }

    checkGameProgress(gameId) {
        const game = this.games.get(gameId);
        if (!game) return;

        // Simple progression logic - advance inning every 6 at-bats
        if (game.gameHistory.length % 6 === 0) {
            game.inning++;
            
            if (game.inning > game.gameSettings.innings) {
                this.endGame(gameId);
                return;
            }

            this.broadcastToGame(gameId, {
                type: 'newInning',
                inning: game.inning
            });
        }

        // Switch batter
        const currentIndex = game.players.findIndex(p => p === game.currentBatter);
        game.currentBatter = game.players[(currentIndex + 1) % game.players.length];
    }

    endGame(gameId) {
        const game = this.games.get(gameId);
        if (!game) return;

        game.state = 'finished';
        game.endTime = Date.now();

        // Determine winner
        const winner = game.score.home > game.score.away ? 'home' : 
                      game.score.away > game.score.home ? 'away' : 'tie';

        // Update player stats
        game.players.forEach(player => {
            const client = this.clients.get(player.clientId);
            if (client) {
                client.stats.gamesPlayed++;
                if ((winner === 'home' && player.team === 'home') || 
                    (winner === 'away' && player.team === 'away')) {
                    client.stats.wins++;
                } else if (winner !== 'tie') {
                    client.stats.losses++;
                }
            }
        });

        this.broadcastToGame(gameId, {
            type: 'gameEnded',
            finalScore: game.score,
            winner: winner,
            gameStats: {
                duration: game.endTime - game.startTime,
                totalAtBats: game.gameHistory.length,
                highlights: this.generateGameHighlights(game)
            }
        });

        console.log(`🏁 Game ended: ${gameId}, Winner: ${winner}`);

        // Clean up game after 5 minutes
        setTimeout(() => {
            this.cleanupGame(gameId);
        }, 5 * 60 * 1000);
    }

    generateGameHighlights(game) {
        const highlights = [];
        
        // Find home runs
        const homeRuns = game.gameHistory.filter(h => h.outcome === 'homerun');
        homeRuns.forEach(hr => {
            highlights.push(`💥 ${hr.batter} crushes a home run in inning ${hr.inning}!`);
        });

        // Add other highlights
        if (game.gameHistory.length > 20) {
            highlights.push(`📊 Epic battle with ${game.gameHistory.length} at-bats!`);
        }

        return highlights;
    }

    handleSpectateGame(clientId, message) {
        const gameId = message.gameId;
        const game = this.games.get(gameId);
        
        if (!game) {
            this.sendToClient(clientId, {
                type: 'error',
                message: 'Game not found'
            });
            return;
        }

        // Add as spectator
        game.spectators.push(clientId);
        const client = this.clients.get(clientId);
        client.gameId = gameId;

        this.sendToClient(clientId, {
            type: 'spectatingGame',
            gameId: gameId,
            gameState: {
                players: game.players.map(p => p.playerName),
                inning: game.inning,
                score: game.score,
                state: game.state
            }
        });

        console.log(`👁️ ${client.playerName} is now spectating game ${gameId}`);
    }

    handleChatMessage(clientId, message) {
        const client = this.clients.get(clientId);
        if (!client || !client.gameId) return;

        const chatMessage = {
            type: 'chatMessage',
            from: client.playerName,
            message: message.text.substring(0, 200), // Limit message length
            timestamp: Date.now()
        };

        this.broadcastToGame(client.gameId, chatMessage, clientId);
        console.log(`💬 Chat from ${client.playerName}: ${message.text}`);
    }

    handlePing(clientId, message) {
        const client = this.clients.get(clientId);
        if (client) {
            client.lastPing = Date.now();
            this.sendToClient(clientId, {
                type: 'pong',
                timestamp: message.timestamp
            });
        }
    }

    handleDisconnection(clientId) {
        const client = this.clients.get(clientId);
        if (!client) return;

        console.log(`🔌 Player disconnected: ${client.playerName || clientId}`);

        // Remove from queue
        this.handleLeaveQueue(clientId);

        // Handle game disconnection
        if (client.gameId) {
            const game = this.games.get(client.gameId);
            if (game) {
                this.broadcastToGame(client.gameId, {
                    type: 'playerDisconnected',
                    playerName: client.playerName
                }, clientId);

                // If in active game, pause or end it
                if (game.state === 'playing') {
                    game.state = 'paused';
                    console.log(`⏸️ Game ${client.gameId} paused due to disconnection`);
                }
            }
        }

        this.clients.delete(clientId);
    }

    sendToClient(clientId, message) {
        const client = this.clients.get(clientId);
        if (client && client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(JSON.stringify(message));
        }
    }

    broadcastToGame(gameId, message, excludeClientId = null) {
        const game = this.games.get(gameId);
        if (!game) return;

        // Send to all players and spectators in the game
        const recipients = [...game.players.map(p => p.clientId), ...game.spectators];
        
        recipients.forEach(clientId => {
            if (clientId !== excludeClientId) {
                this.sendToClient(clientId, message);
            }
        });
    }

    calculateEstimatedWait() {
        const queueLength = this.playerQueue.length;
        return Math.max(30, queueLength * 15); // Seconds
    }

    cleanupGame(gameId) {
        const game = this.games.get(gameId);
        if (!game) return;

        // Remove game reference from all clients
        [...game.players.map(p => p.clientId), ...game.spectators].forEach(clientId => {
            const client = this.clients.get(clientId);
            if (client) {
                client.gameId = null;
            }
        });

        this.games.delete(gameId);
        console.log(`🧹 Cleaned up game: ${gameId}`);
    }

    // Server management
    getServerStats() {
        return {
            connectedClients: this.clients.size,
            activeGames: this.games.size,
            queueLength: this.playerQueue.length,
            uptime: process.uptime()
        };
    }

    shutdown() {
        console.log('🛑 Shutting down multiplayer server...');
        
        // Notify all clients
        this.clients.forEach((client, clientId) => {
            this.sendToClient(clientId, {
                type: 'serverShutdown',
                message: 'Server is shutting down'
            });
        });

        // Close WebSocket server
        this.wss.close(() => {
            console.log('✅ WebSocket server closed');
        });

        // Close HTTP server
        this.server.close(() => {
            console.log('✅ HTTP server closed');
            process.exit(0);
        });
    }
}

// Start server if this file is run directly
if (require.main === module) {
    const server = new MultiplayerBaseballServer(8081);
}

module.exports = MultiplayerBaseballServer;