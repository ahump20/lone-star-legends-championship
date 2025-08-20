/**
 * GameRoom Durable Object
 * Handles multiplayer game state and WebSocket connections
 */

export class GameRoom {
    constructor(state, env) {
        this.state = state;
        this.env = env;
        this.sessions = [];
        this.gameState = {
            inning: 1,
            topBottom: 'top',
            outs: 0,
            balls: 0,
            strikes: 0,
            score: { home: 0, away: 0 },
            bases: { first: null, second: null, third: null },
            currentBatter: null,
            currentPitcher: null,
            players: []
        };
    }

    async fetch(request) {
        const url = new URL(request.url);
        const webSocketPair = new WebSocketPair();
        const [client, server] = Object.values(webSocketPair);

        await this.handleSession(server, request);
        
        return new Response(null, {
            status: 101,
            webSocket: client
        });
    }

    async handleSession(webSocket, request) {
        const url = new URL(request.url);
        const playerId = url.searchParams.get('player') || `player_${Date.now()}`;
        const team = url.searchParams.get('team') || 'home';
        
        webSocket.accept();
        
        const session = {
            webSocket,
            playerId,
            team,
            joined: new Date().toISOString(),
            quit: false
        };
        
        this.sessions.push(session);
        
        // Send initial state
        webSocket.send(JSON.stringify({
            type: 'connected',
            playerId,
            team,
            gameState: this.gameState,
            players: this.sessions.map(s => ({
                id: s.playerId,
                team: s.team,
                joined: s.joined
            }))
        }));
        
        // Broadcast join to others
        this.broadcast({
            type: 'playerJoined',
            playerId,
            team,
            totalPlayers: this.sessions.length
        }, session);
        
        // Listen for messages
        webSocket.addEventListener('message', async (msg) => {
            try {
                const data = JSON.parse(msg.data);
                await this.handleMessage(session, data);
            } catch (err) {
                webSocket.send(JSON.stringify({
                    type: 'error',
                    message: err.toString()
                }));
            }
        });
        
        // Handle close
        const closeHandler = () => {
            session.quit = true;
            this.sessions = this.sessions.filter(s => s !== session);
            
            if (this.sessions.length > 0) {
                this.broadcast({
                    type: 'playerLeft',
                    playerId,
                    totalPlayers: this.sessions.length
                });
            }
        };
        
        webSocket.addEventListener('close', closeHandler);
        webSocket.addEventListener('error', closeHandler);
    }
    
    async handleMessage(session, data) {
        switch(data.type) {
            case 'pitch':
                await this.handlePitch(session, data);
                break;
                
            case 'swing':
                await this.handleSwing(session, data);
                break;
                
            case 'move':
                await this.handleMove(session, data);
                break;
                
            case 'chat':
                this.broadcast({
                    type: 'chat',
                    playerId: session.playerId,
                    message: data.message,
                    timestamp: new Date().toISOString()
                });
                break;
                
            case 'ping':
                session.webSocket.send(JSON.stringify({
                    type: 'pong',
                    timestamp: Date.now()
                }));
                break;
                
            default:
                // Broadcast game actions to all
                this.broadcast({
                    ...data,
                    playerId: session.playerId,
                    timestamp: new Date().toISOString()
                });
        }
    }
    
    async handlePitch(session, data) {
        // Simulate pitch outcome
        const outcomes = ['strike', 'ball', 'hit', 'foul'];
        const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
        
        if (outcome === 'strike') {
            this.gameState.strikes++;
            if (this.gameState.strikes >= 3) {
                this.gameState.outs++;
                this.gameState.strikes = 0;
                this.gameState.balls = 0;
            }
        } else if (outcome === 'ball') {
            this.gameState.balls++;
            if (this.gameState.balls >= 4) {
                // Walk
                this.gameState.balls = 0;
                this.gameState.strikes = 0;
            }
        }
        
        this.broadcast({
            type: 'pitchResult',
            pitch: data.pitch,
            outcome,
            gameState: this.gameState
        });
        
        // Check for inning change
        if (this.gameState.outs >= 3) {
            this.advanceInning();
        }
    }
    
    async handleSwing(session, data) {
        const hitTypes = ['single', 'double', 'triple', 'homerun', 'out', 'foul'];
        const result = hitTypes[Math.floor(Math.random() * hitTypes.length)];
        
        if (result === 'homerun') {
            this.gameState.score[session.team]++;
        } else if (result === 'out') {
            this.gameState.outs++;
        }
        
        this.broadcast({
            type: 'swingResult',
            playerId: session.playerId,
            result,
            gameState: this.gameState
        });
        
        if (this.gameState.outs >= 3) {
            this.advanceInning();
        }
    }
    
    async handleMove(session, data) {
        // Update player position
        this.broadcast({
            type: 'playerMove',
            playerId: session.playerId,
            position: data.position,
            velocity: data.velocity
        });
    }
    
    advanceInning() {
        this.gameState.outs = 0;
        this.gameState.balls = 0;
        this.gameState.strikes = 0;
        this.gameState.bases = { first: null, second: null, third: null };
        
        if (this.gameState.topBottom === 'top') {
            this.gameState.topBottom = 'bottom';
        } else {
            this.gameState.topBottom = 'top';
            this.gameState.inning++;
        }
        
        this.broadcast({
            type: 'inningChange',
            gameState: this.gameState
        });
        
        // Check for game end
        if (this.gameState.inning > 9) {
            const winner = this.gameState.score.home > this.gameState.score.away ? 'home' : 'away';
            this.broadcast({
                type: 'gameEnd',
                winner,
                finalScore: this.gameState.score
            });
        }
    }
    
    broadcast(message, exclude = null) {
        const msg = JSON.stringify(message);
        this.sessions.forEach(session => {
            if (session !== exclude && !session.quit) {
                try {
                    session.webSocket.send(msg);
                } catch (err) {
                    // Session might be disconnected
                    session.quit = true;
                }
            }
        });
    }
}