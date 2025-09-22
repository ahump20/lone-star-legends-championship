#!/usr/bin/env python3
"""
🔥 BLAZE INTELLIGENCE REAL-TIME PROCESSING SERVER
Live Pattern Detection & Intelligence Processing Engine
Austin Humphrey - Blaze Intelligence
"""

import asyncio
import websockets
import json
import logging
from datetime import datetime
from typing import Dict, List, Any
import threading
import time
from pathlib import Path
import os
import signal
import sys

# Import our pattern engine
from blaze_pattern_engine import BlazePatternEngine

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('realtime_intelligence')

class RealTimeIntelligenceServer:
    """
    🧠 REAL-TIME INTELLIGENCE PROCESSING SERVER
    Continuously processes data and broadcasts live intelligence insights
    """
    
    def __init__(self, port: int = 8765, data_directory: str = "public/data"):
        self.port = port
        self.data_directory = data_directory
        self.pattern_engine = BlazePatternEngine(data_directory)
        self.connected_clients = set()
        self.processing_active = False
        self.latest_intelligence = {}
        
        # Server statistics
        self.server_stats = {
            'start_time': datetime.now(),
            'total_patterns_discovered': 0,
            'total_insights_generated': 0,
            'connected_clients': 0,
            'processing_cycles_completed': 0,
            'uptime_seconds': 0
        }
        
        logger.info("🔥 Real-Time Intelligence Server initializing...")
        logger.info(f"   📂 Data Directory: {data_directory}")
        logger.info(f"   🌐 WebSocket Port: {port}")
        
    async def start_server(self):
        """Start the real-time intelligence processing server"""
        logger.info("🚀 Starting Real-Time Intelligence Server...")
        
        # Start background intelligence processing
        asyncio.create_task(self.continuous_intelligence_processing())
        
        # Start WebSocket server
        start_server = websockets.serve(
            self.handle_client_connection, 
            "localhost", 
            self.port,
            ping_interval=30,
            ping_timeout=10
        )
        
        await start_server
        logger.info(f"🌐 WebSocket server running on ws://localhost:{self.port}")
        logger.info("🧠 Continuous intelligence processing active")
        logger.info("🎯 Server ready to process live intelligence")
        
        # Keep server running
        await asyncio.Future()  # Run forever
    
    async def handle_client_connection(self, websocket, path):
        """Handle new client connections"""
        client_id = f"{websocket.remote_address[0]}:{websocket.remote_address[1]}"
        logger.info(f"🔌 New client connected: {client_id}")
        
        self.connected_clients.add(websocket)
        self.server_stats['connected_clients'] = len(self.connected_clients)
        
        try:
            # Send initial intelligence data
            if self.latest_intelligence:
                await websocket.send(json.dumps({
                    'type': 'intelligence_update',
                    'data': self.latest_intelligence,
                    'timestamp': datetime.now().isoformat()
                }))
            
            # Send welcome message
            welcome_message = {
                'type': 'connection_established',
                'message': '🔥 Connected to Blaze Intelligence Live Processing',
                'server_stats': self.server_stats,
                'capabilities': [
                    'Real-time pattern detection',
                    'Hidden insight discovery',
                    'Cross-domain analysis',
                    'Predictive intelligence',
                    'Competitive advantage tracking'
                ]
            }
            await websocket.send(json.dumps(welcome_message))
            
            # Handle incoming messages
            async for message in websocket:
                try:
                    data = json.loads(message)
                    await self.process_client_message(websocket, data)
                except json.JSONDecodeError:
                    logger.warning(f"Invalid JSON received from {client_id}")
                
        except websockets.exceptions.ConnectionClosed:
            logger.info(f"🔌 Client disconnected: {client_id}")
        except Exception as e:
            logger.error(f"❌ Error handling client {client_id}: {e}")
        finally:
            self.connected_clients.discard(websocket)
            self.server_stats['connected_clients'] = len(self.connected_clients)
    
    async def process_client_message(self, websocket, data: Dict):
        """Process incoming client messages"""
        message_type = data.get('type', 'unknown')
        
        if message_type == 'request_intelligence_update':
            # Send latest intelligence
            if self.latest_intelligence:
                response = {
                    'type': 'intelligence_update',
                    'data': self.latest_intelligence,
                    'timestamp': datetime.now().isoformat()
                }
                await websocket.send(json.dumps(response))
        
        elif message_type == 'request_server_stats':
            # Send server statistics
            current_uptime = (datetime.now() - self.server_stats['start_time']).total_seconds()
            self.server_stats['uptime_seconds'] = current_uptime
            
            response = {
                'type': 'server_stats',
                'data': self.server_stats,
                'timestamp': datetime.now().isoformat()
            }
            await websocket.send(json.dumps(response))
        
        elif message_type == 'trigger_immediate_analysis':
            # Trigger immediate intelligence analysis
            logger.info("⚡ Immediate analysis triggered by client")
            intelligence_data = await self.pattern_engine.discover_hidden_patterns()
            
            response = {
                'type': 'immediate_analysis_complete',
                'data': intelligence_data,
                'timestamp': datetime.now().isoformat()
            }
            await websocket.send(json.dumps(response))
    
    async def continuous_intelligence_processing(self):
        """Continuously process intelligence and broadcast updates"""
        logger.info("🔄 Starting continuous intelligence processing...")
        self.processing_active = True
        
        while self.processing_active:
            try:
                # Run pattern discovery
                logger.info("🧠 Running intelligence discovery cycle...")
                intelligence_data = await self.pattern_engine.discover_hidden_patterns()
                
                self.latest_intelligence = intelligence_data
                self.server_stats['processing_cycles_completed'] += 1
                self.server_stats['total_patterns_discovered'] += intelligence_data['report_metadata']['processing_stats']['patterns_discovered']
                self.server_stats['total_insights_generated'] += len(intelligence_data['pattern_insights'])
                
                # Broadcast to all connected clients
                if self.connected_clients:
                    broadcast_message = {
                        'type': 'live_intelligence_update',
                        'data': intelligence_data,
                        'timestamp': datetime.now().isoformat(),
                        'cycle_number': self.server_stats['processing_cycles_completed']
                    }
                    
                    # Send to all clients
                    disconnected_clients = []
                    for client in self.connected_clients:
                        try:
                            await client.send(json.dumps(broadcast_message))
                        except websockets.exceptions.ConnectionClosed:
                            disconnected_clients.append(client)
                    
                    # Remove disconnected clients
                    for client in disconnected_clients:
                        self.connected_clients.discard(client)
                        self.server_stats['connected_clients'] = len(self.connected_clients)
                    
                    logger.info(f"📡 Intelligence broadcast to {len(self.connected_clients)} clients")
                
                # Wait before next cycle (30 seconds for live intelligence)
                await asyncio.sleep(30)
                
            except Exception as e:
                logger.error(f"❌ Error in intelligence processing cycle: {e}")
                await asyncio.sleep(10)  # Wait before retrying
    
    def stop_processing(self):
        """Stop continuous processing"""
        logger.info("🛑 Stopping intelligence processing...")
        self.processing_active = False

def signal_handler(signum, frame):
    """Handle shutdown signals"""
    logger.info("🛑 Shutdown signal received")
    sys.exit(0)

async def main():
    """Main server startup"""
    # Set up signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Create and start server
    server = RealTimeIntelligenceServer(port=8765)
    
    try:
        await server.start_server()
    except KeyboardInterrupt:
        logger.info("🛑 Server stopped by user")
        server.stop_processing()
    except Exception as e:
        logger.error(f"❌ Server error: {e}")
        server.stop_processing()

if __name__ == "__main__":
    asyncio.run(main())