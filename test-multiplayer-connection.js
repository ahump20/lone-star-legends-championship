#!/usr/bin/env node

/**
 * Simple multiplayer connection test
 */

import WebSocket from 'ws';

async function testConnection() {
    console.log('🧪 Testing multiplayer WebSocket connection...');
    
    const wsUrl = 'wss://lone-star-legends-multiplayer.humphrey-austin20.workers.dev/room/test-room/websocket';
    console.log('Connecting to:', wsUrl);
    
    const ws = new WebSocket(wsUrl);
    
    ws.on('open', () => {
        console.log('✅ WebSocket connection opened successfully!');
        
        // Send test message
        const testMessage = {
            type: 'join',
            playerId: 'test-player-1',
            playerName: 'TestPlayer',
            timestamp: Date.now()
        };
        
        ws.send(JSON.stringify(testMessage));
        console.log('📤 Sent test message:', testMessage);
        
        // Close after 3 seconds
        setTimeout(() => {
            ws.close();
            console.log('🔌 Connection closed');
            process.exit(0);
        }, 3000);
    });
    
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data.toString());
            console.log('📨 Received message:', message);
        } catch (err) {
            console.log('📨 Received raw data:', data.toString());
        }
    });
    
    ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error.message);
        process.exit(1);
    });
    
    ws.on('close', (code, reason) => {
        console.log(`🔌 Connection closed with code ${code}:`, reason.toString());
    });
    
    // Timeout after 10 seconds
    setTimeout(() => {
        console.log('⏰ Test timeout - connection failed');
        ws.close();
        process.exit(1);
    }, 10000);
}

testConnection();