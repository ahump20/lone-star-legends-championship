/**
 * Cloudflare Durable Object for Multiplayer Baseball Games
 * Handles WebSocket connections and game state synchronization
 */

export class GameRoom {
    constructor(state, env) {
        this.state = state;
        this.env = env;
        this.sessions = [];
        this.gameState = null;
    }

    async fetch(request) {
        const url = new URL(request.url);
        
        if (url.pathname === '/websocket') {
            return this.handleWebSocket(request);
        } else if (url.pathname === '/state') {
            return this.getGameState();
        } else if (url.pathname === '/reset') {
            return this.resetGame();
        }
        
        return new Response('Not found', { status: 404 });
    }

    async handleWebSocket(request) {
        if (request.headers.get('Upgrade') !== 'websocket') {
            return new Response('Expected websocket', { status: 400 });
        }

        const pair = new WebSocketPair();
        const [client, server] = Object.values(pair);

        await this.handleSession(server);

        return new Response(null, {
            status: 101,
            webSocket: client,
        });
    }

    async handleSession(webSocket) {
        webSocket.accept();
        
        const session = {
            id: crypto.randomUUID(),
            webSocket,
            playerId: null,
            team: null
        };
        
        this.sessions.push(session);

        // Send initial game state
        const initMessage = {
            type: 'init',
            sessionId: session.id,
            gameState: await this.state.storage.get('gameState') || null,
            players: this.sessions.length
        };
        
        webSocket.send(JSON.stringify(initMessage));

        // Broadcast player joined
        this.broadcast({
            type: 'playerJoined',
            players: this.sessions.length
        }, session.id);

        webSocket.addEventListener('message', async (msg) => {
            try {
                const data = JSON.parse(msg.data);
                await this.handleMessage(session, data);
            } catch (err) {
                webSocket.send(JSON.stringify({
                    type: 'error',
                    message: 'Invalid message format'
                }));
            }
        });

        webSocket.addEventListener('close', () => {
            this.sessions = this.sessions.filter(s => s.id !== session.id);
            
            // Broadcast player left
            this.broadcast({
                type: 'playerLeft',
                players: this.sessions.length
            });
        });
    }

    async handleMessage(session, data) {
        switch (data.type) {
            case 'joinTeam':
                session.team = data.team;
                session.playerId = data.playerId;
                
                this.broadcast({
                    type: 'teamJoined',
                    playerId: session.playerId,
                    team: session.team
                });
                break;

            case 'pitch':
                // Only allow the fielding team to pitch
                if (this.canPlayerPitch(session)) {
                    const gameState = await this.processPitch(data);
                    await this.state.storage.put('gameState', gameState);
                    
                    this.broadcast({
                        type: 'gameUpdate',
                        gameState,
                        action: 'pitch',
                        result: data.result
                    });
                }
                break;

            case 'swing':
                // Only allow the batting team to swing
                if (this.canPlayerSwing(session)) {
                    const gameState = await this.processSwing(data);
                    await this.state.storage.put('gameState', gameState);
                    
                    this.broadcast({
                        type: 'gameUpdate',
                        gameState,
                        action: 'swing',
                        result: data.result
                    });
                }
                break;

            case 'chat':
                this.broadcast({
                    type: 'chat',
                    playerId: session.playerId,
                    message: data.message,
                    timestamp: new Date().toISOString()
                });
                break;

            case 'sync':
                // Request full game state sync
                const currentState = await this.state.storage.get('gameState');
                session.webSocket.send(JSON.stringify({
                    type: 'sync',
                    gameState: currentState
                }));
                break;
        }
    }

    canPlayerPitch(session) {
        const gameState = this.gameState;
        if (!gameState || !session.team) return false;
        
        // Check if it's this team's turn to field
        const isTopInning = gameState.isTopInning;
        const isHomeTeam = session.team === 'home';
        
        return (isTopInning && isHomeTeam) || (!isTopInning && !isHomeTeam);
    }

    canPlayerSwing(session) {
        const gameState = this.gameState;
        if (!gameState || !session.team) return false;
        
        // Check if it's this team's turn to bat
        const isTopInning = gameState.isTopInning;
        const isHomeTeam = session.team === 'home';
        
        return (isTopInning && !isHomeTeam) || (!isTopInning && isHomeTeam);
    }

    async processPitch(data) {
        // Update game state based on pitch
        let gameState = await this.state.storage.get('gameState') || this.createNewGame();
        
        // Process pitch logic here
        // This would integrate with the baseball game engine
        
        return gameState;
    }

    async processSwing(data) {
        // Update game state based on swing
        let gameState = await this.state.storage.get('gameState') || this.createNewGame();
        
        // Process swing logic here
        
        return gameState;
    }

    createNewGame() {
        return {
            inning: 1,
            isTopInning: true,
            outs: 0,
            strikes: 0,
            balls: 0,
            bases: [null, null, null],
            teams: {
                home: { score: 0, hits: 0, errors: 0 },
                away: { score: 0, hits: 0, errors: 0 }
            },
            startTime: new Date().toISOString()
        };
    }

    broadcast(message, excludeId = null) {
        const msg = JSON.stringify(message);
        this.sessions.forEach(session => {
            if (session.id !== excludeId) {
                try {
                    session.webSocket.send(msg);
                } catch (err) {
                    // Handle closed connections
                }
            }
        });
    }

    async getGameState() {
        const gameState = await this.state.storage.get('gameState');
        return new Response(JSON.stringify({
            gameState,
            players: this.sessions.length
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    async resetGame() {
        const newGame = this.createNewGame();
        await this.state.storage.put('gameState', newGame);
        
        this.broadcast({
            type: 'gameReset',
            gameState: newGame
        });
        
        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Worker handler for Durable Objects
export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        
        // CORS headers
        const headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        };

        if (request.method === 'OPTIONS') {
            return new Response(null, { headers });
        }

        // Route to game room
        if (url.pathname.startsWith('/game/')) {
            const roomId = url.pathname.split('/')[2];
            const id = env.GAME_ROOMS.idFromName(roomId);
            const room = env.GAME_ROOMS.get(id);
            
            // Forward request to Durable Object
            const newUrl = new URL(request.url);
            newUrl.pathname = url.pathname.replace(`/game/${roomId}`, '');
            
            return room.fetch(new Request(newUrl, request));
        }

        // List active games
        if (url.pathname === '/games') {
            // In production, you'd store this in a database
            return new Response(JSON.stringify({
                games: ['room1', 'room2', 'room3']
            }), {
                headers: { ...headers, 'Content-Type': 'application/json' }
            });
        }

        return new Response('Multiplayer API', { headers });
    }
};