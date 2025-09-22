#!/usr/bin/env node

/**
 * Multiplayer WebSocket Load Testing Script
 * Tests concurrent connections and game state synchronization
 */

import WebSocket from 'ws';

class MultiplayerLoadTester {
    constructor(options = {}) {
        this.baseUrl = options.baseUrl || 'wss://lone-star-legends-multiplayer.humphrey-austin20.workers.dev';
        this.maxConcurrentUsers = options.maxUsers || 50;
        this.testDuration = options.duration || 60000; // 1 minute
        this.connections = [];
        this.stats = {
            connected: 0,
            disconnected: 0,
            messagesReceived: 0,
            messagesSent: 0,
            errors: 0,
            latencySum: 0,
            latencyCount: 0
        };
    }

    async runLoadTest() {
        console.log(`🚀 Starting multiplayer load test...`);
        console.log(`   Target: ${this.baseUrl}`);
        console.log(`   Concurrent users: ${this.maxConcurrentUsers}`);
        console.log(`   Duration: ${this.testDuration / 1000}s`);
        console.log('');

        // Create multiple game rooms for testing
        const roomIds = ['room-1', 'room-2', 'room-3', 'room-4', 'room-5'];
        
        const startTime = Date.now();
        
        // Connect users in waves
        for (let i = 0; i < this.maxConcurrentUsers; i++) {
            const roomId = roomIds[i % roomIds.length];
            this.createConnection(roomId, i);
            
            // Stagger connections to avoid overwhelming the server
            if (i % 10 === 9) {
                await this.sleep(500);
            }
        }

        // Let the test run for the specified duration
        await this.sleep(this.testDuration);

        // Close all connections
        console.log('\n🔌 Closing all connections...');
        this.connections.forEach(conn => {
            if (conn.ws.readyState === WebSocket.OPEN) {
                conn.ws.close();
            }
        });

        // Wait for cleanup
        await this.sleep(2000);

        // Generate report
        this.generateReport(Date.now() - startTime);
    }

    createConnection(roomId, playerId) {
        try {
            const wsUrl = `${this.baseUrl}/room/${roomId}/websocket`;
            const ws = new WebSocket(wsUrl);
            const connection = {
                id: playerId,
                roomId,
                ws,
                connectTime: Date.now(),
                messageCount: 0
            };

            ws.on('open', () => {
                this.stats.connected++;
                console.log(`✓ Player ${playerId} connected to ${roomId}`);
                
                // Send initial player data
                const joinMessage = {
                    type: 'join',
                    playerId: playerId,
                    playerName: `Player_${playerId}`,
                    timestamp: Date.now()
                };
                
                ws.send(JSON.stringify(joinMessage));
                this.stats.messagesSent++;

                // Start sending periodic game actions
                connection.actionInterval = setInterval(() => {
                    if (ws.readyState === WebSocket.OPEN) {
                        const actions = ['pitch', 'swing', 'field', 'run'];
                        const randomAction = actions[Math.floor(Math.random() * actions.length)];
                        
                        const actionMessage = {
                            type: 'action',
                            action: randomAction,
                            playerId: playerId,
                            timestamp: Date.now()
                        };
                        
                        ws.send(JSON.stringify(actionMessage));
                        this.stats.messagesSent++;
                    }
                }, Math.random() * 5000 + 2000); // Random interval 2-7 seconds
            });

            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    connection.messageCount++;
                    this.stats.messagesReceived++;

                    // Calculate latency if message has timestamp
                    if (message.timestamp) {
                        const latency = Date.now() - message.timestamp;
                        this.stats.latencySum += latency;
                        this.stats.latencyCount++;
                    }

                    // Log interesting messages
                    if (connection.messageCount === 1) {
                        console.log(`📨 Player ${playerId} received first message: ${message.type}`);
                    }
                } catch (err) {
                    console.error(`❌ Failed to parse message for player ${playerId}:`, err.message);
                    this.stats.errors++;
                }
            });

            ws.on('close', () => {
                this.stats.disconnected++;
                if (connection.actionInterval) {
                    clearInterval(connection.actionInterval);
                }
                console.log(`❌ Player ${playerId} disconnected from ${roomId}`);
            });

            ws.on('error', (error) => {
                this.stats.errors++;
                console.error(`🚨 Player ${playerId} WebSocket error:`, error.message);
            });

            this.connections.push(connection);

        } catch (error) {
            console.error(`❌ Failed to create connection for player ${playerId}:`, error.message);
            this.stats.errors++;
        }
    }

    generateReport(testDuration) {
        const avgLatency = this.stats.latencyCount > 0 ? 
            (this.stats.latencySum / this.stats.latencyCount).toFixed(2) : 'N/A';

        console.log('\n📊 MULTIPLAYER LOAD TEST RESULTS');
        console.log('=====================================');
        console.log(`Test Duration: ${(testDuration / 1000).toFixed(1)}s`);
        console.log(`Target Concurrent Users: ${this.maxConcurrentUsers}`);
        console.log(`Successful Connections: ${this.stats.connected}`);
        console.log(`Disconnections: ${this.stats.disconnected}`);
        console.log(`Total Messages Sent: ${this.stats.messagesSent}`);
        console.log(`Total Messages Received: ${this.stats.messagesReceived}`);
        console.log(`Connection Success Rate: ${((this.stats.connected / this.maxConcurrentUsers) * 100).toFixed(1)}%`);
        console.log(`Average Latency: ${avgLatency}ms`);
        console.log(`Total Errors: ${this.stats.errors}`);
        console.log(`Messages/Second (Sent): ${(this.stats.messagesSent / (testDuration / 1000)).toFixed(1)}`);
        console.log(`Messages/Second (Received): ${(this.stats.messagesReceived / (testDuration / 1000)).toFixed(1)}`);

        // Performance assessment
        console.log('\n🎯 PERFORMANCE ASSESSMENT');
        console.log('========================');
        if (this.stats.connected >= this.maxConcurrentUsers * 0.95) {
            console.log('✅ Connection Success: EXCELLENT');
        } else if (this.stats.connected >= this.maxConcurrentUsers * 0.8) {
            console.log('⚠️  Connection Success: GOOD');
        } else {
            console.log('❌ Connection Success: NEEDS IMPROVEMENT');
        }

        if (avgLatency !== 'N/A' && parseFloat(avgLatency) < 100) {
            console.log('✅ Latency: EXCELLENT');
        } else if (avgLatency !== 'N/A' && parseFloat(avgLatency) < 250) {
            console.log('⚠️  Latency: GOOD');
        } else {
            console.log('❌ Latency: NEEDS IMPROVEMENT');
        }

        if (this.stats.errors < this.maxConcurrentUsers * 0.05) {
            console.log('✅ Error Rate: EXCELLENT');
        } else if (this.stats.errors < this.maxConcurrentUsers * 0.1) {
            console.log('⚠️  Error Rate: ACCEPTABLE');
        } else {
            console.log('❌ Error Rate: NEEDS IMPROVEMENT');
        }

        console.log('\n🏆 Overall multiplayer system performance appears', 
            this.stats.connected >= this.maxConcurrentUsers * 0.9 && this.stats.errors < this.maxConcurrentUsers * 0.1 
                ? 'EXCELLENT' : 'SATISFACTORY');
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Run the load test if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const tester = new MultiplayerLoadTester({
        maxUsers: process.argv[2] ? parseInt(process.argv[2]) : 25,
        duration: process.argv[3] ? parseInt(process.argv[3]) * 1000 : 30000
    });
    
    tester.runLoadTest().catch(console.error);
}

export default MultiplayerLoadTester;