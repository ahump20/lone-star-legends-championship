#!/usr/bin/env node

/**
 * /mp:probe - Multiplayer WebSocket routing probe
 * Tests both WebSocket URL patterns and suggests fixes
 */

import WebSocket from 'ws';

const BASE_URL = 'https://lone-star-legends-multiplayer.humphrey-austin20.workers.dev';

function testWebSocket(url, description) {
    return new Promise((resolve) => {
        console.log(`🔌 Testing ${description}: ${url}`);
        
        const ws = new WebSocket(url);
        let resolved = false;
        
        const timeout = setTimeout(() => {
            if (!resolved) {
                resolved = true;
                ws.terminate();
                resolve({ success: false, error: 'Timeout' });
            }
        }, 5000);
        
        ws.on('open', () => {
            if (!resolved) {
                resolved = true;
                clearTimeout(timeout);
                ws.close();
                resolve({ success: true });
            }
        });
        
        ws.on('error', (error) => {
            if (!resolved) {
                resolved = true;
                clearTimeout(timeout);
                resolve({ success: false, error: error.message });
            }
        });
        
        ws.on('upgrade', (response) => {
            if (!resolved && response.statusCode === 101) {
                resolved = true;
                clearTimeout(timeout);
                ws.close();
                resolve({ success: true, status: 101 });
            }
        });
    });
}

async function checkHTTPEndpoint(url, description) {
    try {
        const response = await fetch(url);
        console.log(`📡 ${description}: ${response.status} ${response.statusText}`);
        return { success: response.ok, status: response.status };
    } catch (error) {
        console.log(`❌ ${description}: ${error.message}`);
        return { success: false, error: error.message };
    }
}

async function main() {
    console.log('STATUS:');
    console.log('🎮 Probing multiplayer WebSocket routing...');
    
    const testRoomId = 'test-room-' + Date.now();
    
    // Test HTTP endpoints first
    console.log('\n📡 HTTP Endpoint Tests:');
    const httpResults = await Promise.all([
        checkHTTPEndpoint(`${BASE_URL}`, 'Base worker'),
        checkHTTPEndpoint(`${BASE_URL}/health`, 'Health check'),
        checkHTTPEndpoint(`${BASE_URL}/room/${testRoomId}`, 'Room endpoint'),
    ]);
    
    // Test WebSocket patterns
    console.log('\n🔌 WebSocket Pattern Tests:');
    const wsResults = await Promise.all([
        testWebSocket(`${BASE_URL.replace('https://', 'wss://')}/room/${testRoomId}/websocket`, 'Durable Object pattern'),
        testWebSocket(`${BASE_URL.replace('https://', 'wss://')}/?room=${testRoomId}`, 'Query parameter pattern'),
        testWebSocket(`${BASE_URL.replace('https://', 'wss://')}/ws`, 'Simple WebSocket endpoint'),
    ]);
    
    console.log('\nMETRICS:');
    const httpPassed = httpResults.filter(r => r.success).length;
    const wsPassed = wsResults.filter(r => r.success).length;
    console.log(`HTTP Endpoints: ${httpPassed}/${httpResults.length} working`);
    console.log(`WebSocket Patterns: ${wsPassed}/${wsResults.length} working`);
    console.log(`Worker URL: ${BASE_URL}`);
    
    console.log('\nNEXT:');
    if (wsPassed === 0) {
        console.log('⚠️  No WebSocket connections successful');
        console.log('• Check Durable Objects binding in wrangler.toml:');
        console.log('  [[durable_objects.bindings]]');
        console.log('  name = "MULTIPLAYER_ROOM"');
        console.log('  class_name = "MultiplayerRoom"');
        console.log('• Verify WebSocket upgrade handling in worker');
        console.log('• Run: npx wrangler tail --format pretty');
    } else {
        console.log(`✅ ${wsPassed} WebSocket pattern(s) working`);
        console.log('• Multiplayer infrastructure is functional');
        console.log('• Test with actual game client connection');
    }
}

main().catch(console.error);