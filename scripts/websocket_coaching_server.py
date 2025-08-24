#!/usr/bin/env python3
"""
Blaze Intelligence - WebSocket Real-Time Coaching Server
High-performance server for delivering <50ms coaching feedback
"""

import asyncio
import websockets
import json
import time
import logging
import uuid
from datetime import datetime
from typing import Dict, List, Set, Optional, Any
from dataclasses import dataclass, asdict
import numpy as np
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('blaze_coaching_server')

@dataclass
class CoachingClient:
    """Represents a connected coaching interface client"""
    websocket: websockets.WebSocketServerProtocol
    client_id: str
    athlete_name: str
    sport: str
    session_start: float
    last_heartbeat: float
    subscription_level: str  # 'basic', 'pro', 'elite'

@dataclass
class CoachingMessage:
    """Real-time coaching message structure"""
    message_id: str
    timestamp: float
    urgency: str  # 'instant', 'immediate', 'quick', 'normal'
    category: str  # 'safety', 'performance', 'technique', 'mental'
    title: str
    message: str
    confidence: float
    duration_ms: int
    coaching_cue: str
    context: Dict[str, Any]

@dataclass
class SessionMetrics:
    """Live session performance metrics"""
    session_id: str
    athlete_name: str
    start_time: float
    total_frames: int
    avg_grit_index: float
    pressure_spikes: int
    coaching_interventions: int
    response_time_avg: float
    detection_accuracy: float

class BlazeCoachingServer:
    """High-performance WebSocket server for real-time coaching"""
    
    def __init__(self, host: str = "localhost", port: int = 8765):
        self.host = host
        self.port = port
        
        # Client management
        self.clients: Dict[str, CoachingClient] = {}
        self.active_sessions: Dict[str, SessionMetrics] = {}
        
        # Performance tracking
        self.message_count = 0
        self.avg_response_time = 0.0
        self.server_start_time = time.time()
        
        # Message queues for different urgency levels
        self.instant_queue: asyncio.Queue = asyncio.Queue()
        self.immediate_queue: asyncio.Queue = asyncio.Queue()
        self.quick_queue: asyncio.Queue = asyncio.Queue()
        self.normal_queue: asyncio.Queue = asyncio.Queue()
        
        # Coaching intelligence
        self.coaching_patterns = self._load_coaching_patterns()
        self.performance_baselines: Dict[str, float] = {}
        
        logger.info(f"🎯 Blaze Coaching Server initialized on {host}:{port}")
    
    def _load_coaching_patterns(self) -> Dict[str, Any]:
        """Load coaching pattern recognition templates"""
        return {
            'pressure_responses': {
                'jaw_tension_spike': {
                    'threshold': 7.0,
                    'message': 'Jaw tension detected - focus on breathing',
                    'cue': 'Deep breath, loose jaw',
                    'urgency': 'immediate'
                },
                'gaze_instability': {
                    'threshold': 6.5,
                    'message': 'Eye tracking scattered - find your focal point',
                    'cue': 'Lock eyes on target',
                    'urgency': 'quick'
                },
                'blink_burst': {
                    'threshold': 5.0,
                    'message': 'Stress blink pattern - mental reset needed',
                    'cue': 'Close eyes, count 3, refocus',
                    'urgency': 'immediate'
                }
            },
            'biomechanics_alerts': {
                'balance_deviation': {
                    'threshold': 6.0,
                    'message': 'Balance shifting - engage your core',
                    'cue': 'Center your weight',
                    'urgency': 'immediate'
                },
                'arm_slot_drift': {
                    'threshold': 5.5,
                    'message': 'Arm angle changing - maintain slot consistency',
                    'cue': 'Feel your arm slot',
                    'urgency': 'quick'
                },
                'hip_shoulder_timing': {
                    'threshold': 7.0,
                    'message': 'Timing sequence disrupted - slow down',
                    'cue': 'Hips then shoulders',
                    'urgency': 'immediate'
                }
            },
            'safety_warnings': {
                'injury_risk_high': {
                    'threshold': 8.0,
                    'message': '🚨 HIGH INJURY RISK - Stop and assess',
                    'cue': 'PAUSE - Check mechanics',
                    'urgency': 'instant'
                },
                'fatigue_excessive': {
                    'threshold': 8.5,
                    'message': 'Fatigue levels critical - consider rest',
                    'cue': 'Time for a break',
                    'urgency': 'immediate'
                }
            }
        }
    
    async def start_server(self):
        """Start the WebSocket server with message processing tasks"""
        logger.info(f"🚀 Starting Blaze Coaching Server on {self.host}:{self.port}")
        
        # Start message processing tasks
        message_tasks = [
            asyncio.create_task(self.process_instant_messages()),
            asyncio.create_task(self.process_immediate_messages()),
            asyncio.create_task(self.process_quick_messages()),
            asyncio.create_task(self.process_normal_messages()),
            asyncio.create_task(self.heartbeat_monitor()),
            asyncio.create_task(self.performance_monitor())
        ]
        
        # Start WebSocket server
        async with websockets.serve(
            self.handle_client, 
            self.host, 
            self.port,
            ping_interval=20,
            ping_timeout=10,
            close_timeout=10
        ):
            logger.info("✅ WebSocket server running - press Ctrl+C to stop")
            
            # Run message processing
            await asyncio.gather(*message_tasks)
    
    async def handle_client(self, websocket, path):
        """Handle new client connections"""
        client_id = str(uuid.uuid4())
        logger.info(f"🔗 New client connecting: {client_id}")
        
        try:
            # Wait for client registration
            registration = await asyncio.wait_for(websocket.recv(), timeout=10.0)
            reg_data = json.loads(registration)
            
            # Create client record
            client = CoachingClient(
                websocket=websocket,
                client_id=client_id,
                athlete_name=reg_data.get('athlete_name', 'Unknown'),
                sport=reg_data.get('sport', 'baseball'),
                session_start=time.time(),
                last_heartbeat=time.time(),
                subscription_level=reg_data.get('subscription', 'basic')
            )
            
            self.clients[client_id] = client
            
            # Create session metrics
            session_id = f"session_{client_id}_{int(time.time())}"
            self.active_sessions[session_id] = SessionMetrics(
                session_id=session_id,
                athlete_name=client.athlete_name,
                start_time=time.time(),
                total_frames=0,
                avg_grit_index=50.0,
                pressure_spikes=0,
                coaching_interventions=0,
                response_time_avg=0.0,
                detection_accuracy=0.0
            )
            
            # Send welcome message
            await self.send_to_client(client_id, {
                'type': 'welcome',
                'client_id': client_id,
                'session_id': session_id,
                'server_time': time.time(),
                'features_available': self._get_features_for_subscription(client.subscription_level)
            })
            
            logger.info(f"✅ Client registered: {client.athlete_name} ({client.sport}, {client.subscription_level})")
            
            # Handle client messages
            await self.client_message_loop(client)
            
        except asyncio.TimeoutError:
            logger.warning(f"⏱️ Client {client_id} registration timeout")
        except websockets.exceptions.ConnectionClosed:
            logger.info(f"🔌 Client {client_id} disconnected during handshake")
        except Exception as e:
            logger.error(f"❌ Error handling client {client_id}: {e}")
        finally:
            # Cleanup
            if client_id in self.clients:
                del self.clients[client_id]
                logger.info(f"🧹 Cleaned up client {client_id}")
    
    async def client_message_loop(self, client: CoachingClient):
        """Handle messages from a specific client"""
        try:
            async for message in client.websocket:
                client.last_heartbeat = time.time()
                
                try:
                    data = json.loads(message)
                    await self.process_client_message(client, data)
                except json.JSONDecodeError:
                    logger.warning(f"⚠️ Invalid JSON from {client.client_id}: {message}")
                    
        except websockets.exceptions.ConnectionClosed:
            logger.info(f"🔌 Client {client.client_id} disconnected")
        except Exception as e:
            logger.error(f"❌ Error in client message loop {client.client_id}: {e}")
    
    async def process_client_message(self, client: CoachingClient, data: Dict[str, Any]):
        """Process incoming message from client"""
        message_type = data.get('type')
        
        if message_type == 'tell_frame':
            # Process tell detection frame
            await self.process_tell_frame(client, data)
            
        elif message_type == 'heartbeat':
            # Update heartbeat timestamp
            client.last_heartbeat = time.time()
            await self.send_to_client(client.client_id, {'type': 'heartbeat_ack', 'server_time': time.time()})
            
        elif message_type == 'coaching_request':
            # Manual coaching request
            await self.handle_coaching_request(client, data)
            
        elif message_type == 'session_control':
            # Session start/stop/pause controls
            await self.handle_session_control(client, data)
            
        elif message_type == 'settings_update':
            # Update client settings
            await self.handle_settings_update(client, data)
            
        else:
            logger.warning(f"❓ Unknown message type from {client.client_id}: {message_type}")
    
    async def process_tell_frame(self, client: CoachingClient, data: Dict[str, Any]):
        """Process tell detection frame and generate coaching messages"""
        try:
            frame_start_time = time.time()
            
            # Extract frame data
            grit_index = data.get('grit_index', 50.0)
            pressure_level = data.get('pressure_level', 'green')
            facial_signals = data.get('facial_signals', {})
            biomechanics = data.get('biomechanics', {})
            context = data.get('context', {})
            
            # Update session metrics
            session = self._get_client_session(client.client_id)
            if session:
                session.total_frames += 1
                session.avg_grit_index = (session.avg_grit_index + grit_index) / 2
                if pressure_level in ['yellow', 'red']:
                    session.pressure_spikes += 1
            
            # Generate coaching messages based on signals
            coaching_messages = []
            
            # Check facial signal patterns
            for pattern_name, pattern in self.coaching_patterns['pressure_responses'].items():
                signal_value = self._extract_signal_value(facial_signals, pattern_name)
                if signal_value >= pattern['threshold']:
                    message = await self._create_coaching_message(
                        pattern_name, pattern, signal_value, context
                    )
                    coaching_messages.append(message)
            
            # Check biomechanics patterns
            for pattern_name, pattern in self.coaching_patterns['biomechanics_alerts'].items():
                signal_value = self._extract_signal_value(biomechanics, pattern_name)
                if signal_value >= pattern['threshold']:
                    message = await self._create_coaching_message(
                        pattern_name, pattern, signal_value, context
                    )
                    coaching_messages.append(message)
            
            # Check safety warnings
            for pattern_name, pattern in self.coaching_patterns['safety_warnings'].items():
                if self._check_safety_condition(pattern_name, biomechanics, facial_signals):
                    message = await self._create_coaching_message(
                        pattern_name, pattern, 10.0, context
                    )
                    coaching_messages.append(message)
            
            # Queue messages by urgency
            for message in coaching_messages:
                await self._queue_message_by_urgency(message)
            
            # Calculate response time
            response_time_ms = (time.time() - frame_start_time) * 1000
            if session:
                session.response_time_avg = (session.response_time_avg + response_time_ms) / 2
                session.coaching_interventions += len(coaching_messages)
            
            # Send frame acknowledgment
            await self.send_to_client(client.client_id, {
                'type': 'frame_processed',
                'grit_index': grit_index,
                'pressure_level': pressure_level,
                'coaching_messages_count': len(coaching_messages),
                'response_time_ms': response_time_ms
            })
            
            logger.debug(f"📊 Frame processed for {client.athlete_name}: {len(coaching_messages)} messages, {response_time_ms:.1f}ms")
            
        except Exception as e:
            logger.error(f"❌ Error processing tell frame from {client.client_id}: {e}")
    
    def _extract_signal_value(self, signals: Dict[str, Any], pattern_name: str) -> float:
        """Extract signal value for pattern matching"""
        signal_mappings = {
            'jaw_tension_spike': lambda s: s.get('au17_intensity', 0.0),
            'gaze_instability': lambda s: 10.0 - s.get('gaze_stability_score', 10.0),
            'blink_burst': lambda s: s.get('blink_burst_intensity', 0.0) * 10.0,
            'balance_deviation': lambda s: s.get('balance_deviation', 0.0),
            'arm_slot_drift': lambda s: 10.0 - s.get('arm_slot_consistency', 10.0),
            'hip_shoulder_timing': lambda s: 10.0 - s.get('hip_shoulder_separation', 10.0)
        }
        
        mapper = signal_mappings.get(pattern_name)
        return mapper(signals) if mapper else 0.0
    
    def _check_safety_condition(self, pattern_name: str, biomechanics: Dict, facial: Dict) -> bool:
        """Check safety-critical conditions"""
        if pattern_name == 'injury_risk_high':
            injury_risk = biomechanics.get('injury_risk_score', 0.0)
            return injury_risk >= 8.0
        
        elif pattern_name == 'fatigue_excessive':
            fatigue = biomechanics.get('fatigue_indicators', 0.0)
            return fatigue >= 8.5
        
        return False
    
    async def _create_coaching_message(self, pattern_name: str, pattern: Dict, value: float, context: Dict) -> CoachingMessage:
        """Create coaching message from pattern and context"""
        message_id = str(uuid.uuid4())
        timestamp = time.time()
        
        # Determine category based on pattern type
        if 'safety' in pattern_name:
            category = 'safety'
        elif 'pressure' in pattern_name:
            category = 'mental'
        elif 'biomechanics' in pattern_name:
            category = 'technique'
        else:
            category = 'performance'
        
        # Calculate confidence based on signal strength
        confidence = min(1.0, value / pattern['threshold'])
        
        # Determine message duration based on urgency
        duration_mapping = {
            'instant': 2000,   # 2 seconds
            'immediate': 3000, # 3 seconds
            'quick': 4000,     # 4 seconds
            'normal': 5000     # 5 seconds
        }
        
        return CoachingMessage(
            message_id=message_id,
            timestamp=timestamp,
            urgency=pattern['urgency'],
            category=category,
            title=pattern_name.replace('_', ' ').title(),
            message=pattern['message'],
            confidence=confidence,
            duration_ms=duration_mapping[pattern['urgency']],
            coaching_cue=pattern['cue'],
            context=context
        )
    
    async def _queue_message_by_urgency(self, message: CoachingMessage):
        """Queue message in appropriate urgency queue"""
        queues = {
            'instant': self.instant_queue,
            'immediate': self.immediate_queue,
            'quick': self.quick_queue,
            'normal': self.normal_queue
        }
        
        queue = queues.get(message.urgency, self.normal_queue)
        await queue.put(message)
    
    # Message Processing Tasks
    
    async def process_instant_messages(self):
        """Process instant priority messages (<10ms target)"""
        while True:
            try:
                message = await self.instant_queue.get()
                start_time = time.time()
                
                # Broadcast to all relevant clients immediately
                await self._broadcast_coaching_message(message)
                
                processing_time = (time.time() - start_time) * 1000
                if processing_time > 10:
                    logger.warning(f"⚡ Instant message took {processing_time:.1f}ms (target: <10ms)")
                
                self.instant_queue.task_done()
                
            except Exception as e:
                logger.error(f"❌ Error processing instant message: {e}")
    
    async def process_immediate_messages(self):
        """Process immediate priority messages (<25ms target)"""
        while True:
            try:
                message = await self.immediate_queue.get()
                start_time = time.time()
                
                await self._broadcast_coaching_message(message)
                
                processing_time = (time.time() - start_time) * 1000
                if processing_time > 25:
                    logger.warning(f"🟡 Immediate message took {processing_time:.1f}ms (target: <25ms)")
                
                self.immediate_queue.task_done()
                
            except Exception as e:
                logger.error(f"❌ Error processing immediate message: {e}")
    
    async def process_quick_messages(self):
        """Process quick priority messages (<50ms target)"""
        while True:
            try:
                message = await self.quick_queue.get()
                start_time = time.time()
                
                await self._broadcast_coaching_message(message)
                
                processing_time = (time.time() - start_time) * 1000
                if processing_time > 50:
                    logger.warning(f"🟠 Quick message took {processing_time:.1f}ms (target: <50ms)")
                
                self.quick_queue.task_done()
                
            except Exception as e:
                logger.error(f"❌ Error processing quick message: {e}")
    
    async def process_normal_messages(self):
        """Process normal priority messages (<100ms target)"""
        while True:
            try:
                message = await self.normal_queue.get()
                start_time = time.time()
                
                await self._broadcast_coaching_message(message)
                
                processing_time = (time.time() - start_time) * 1000
                logger.debug(f"📨 Normal message processed in {processing_time:.1f}ms")
                
                self.normal_queue.task_done()
                
            except Exception as e:
                logger.error(f"❌ Error processing normal message: {e}")
    
    async def _broadcast_coaching_message(self, message: CoachingMessage):
        """Broadcast coaching message to relevant clients"""
        message_data = {
            'type': 'coaching_message',
            'message_id': message.message_id,
            'timestamp': message.timestamp,
            'urgency': message.urgency,
            'category': message.category,
            'title': message.title,
            'message': message.message,
            'confidence': message.confidence,
            'duration_ms': message.duration_ms,
            'coaching_cue': message.coaching_cue,
            'context': message.context
        }
        
        # Send to all connected clients
        disconnected_clients = []
        for client_id, client in self.clients.items():
            try:
                await client.websocket.send(json.dumps(message_data))
            except websockets.exceptions.ConnectionClosed:
                disconnected_clients.append(client_id)
            except Exception as e:
                logger.error(f"❌ Error sending message to {client_id}: {e}")
                disconnected_clients.append(client_id)
        
        # Clean up disconnected clients
        for client_id in disconnected_clients:
            del self.clients[client_id]
        
        self.message_count += 1
    
    async def heartbeat_monitor(self):
        """Monitor client heartbeats and clean up stale connections"""
        while True:
            try:
                current_time = time.time()
                stale_clients = []
                
                for client_id, client in self.clients.items():
                    if current_time - client.last_heartbeat > 60:  # 60 second timeout
                        stale_clients.append(client_id)
                        logger.warning(f"💔 Stale client detected: {client_id}")
                
                # Remove stale clients
                for client_id in stale_clients:
                    del self.clients[client_id]
                
                await asyncio.sleep(30)  # Check every 30 seconds
                
            except Exception as e:
                logger.error(f"❌ Error in heartbeat monitor: {e}")
    
    async def performance_monitor(self):
        """Monitor server performance and log metrics"""
        while True:
            try:
                uptime = time.time() - self.server_start_time
                
                logger.info(
                    f"📊 Server Stats: "
                    f"{len(self.clients)} clients, "
                    f"{self.message_count} messages, "
                    f"{uptime/3600:.1f}h uptime"
                )
                
                # Log session metrics
                for session in self.active_sessions.values():
                    logger.info(
                        f"🏃 Session {session.athlete_name}: "
                        f"Grit: {session.avg_grit_index:.1f}, "
                        f"Spikes: {session.pressure_spikes}, "
                        f"Response: {session.response_time_avg:.1f}ms"
                    )
                
                await asyncio.sleep(300)  # Report every 5 minutes
                
            except Exception as e:
                logger.error(f"❌ Error in performance monitor: {e}")
    
    # Utility Methods
    
    async def send_to_client(self, client_id: str, data: Dict[str, Any]):
        """Send message to specific client"""
        client = self.clients.get(client_id)
        if client:
            try:
                await client.websocket.send(json.dumps(data))
            except websockets.exceptions.ConnectionClosed:
                del self.clients[client_id]
            except Exception as e:
                logger.error(f"❌ Error sending to client {client_id}: {e}")
    
    def _get_client_session(self, client_id: str) -> Optional[SessionMetrics]:
        """Get session metrics for client"""
        for session in self.active_sessions.values():
            if client_id in session.session_id:
                return session
        return None
    
    def _get_features_for_subscription(self, subscription_level: str) -> List[str]:
        """Get available features for subscription level"""
        features = {
            'basic': ['real_time_coaching', 'grit_index', 'pressure_alerts'],
            'pro': ['real_time_coaching', 'grit_index', 'pressure_alerts', 'biomechanics_analysis', 'session_recording'],
            'elite': ['real_time_coaching', 'grit_index', 'pressure_alerts', 'biomechanics_analysis', 'session_recording', 'ai_pattern_learning', 'custom_alerts']
        }
        return features.get(subscription_level, features['basic'])
    
    async def handle_coaching_request(self, client: CoachingClient, data: Dict[str, Any]):
        """Handle manual coaching request"""
        logger.info(f"🎯 Manual coaching request from {client.athlete_name}")
        # Implement manual coaching logic
    
    async def handle_session_control(self, client: CoachingClient, data: Dict[str, Any]):
        """Handle session control commands"""
        action = data.get('action')
        logger.info(f"🎮 Session control: {action} from {client.athlete_name}")
        # Implement session control logic
    
    async def handle_settings_update(self, client: CoachingClient, data: Dict[str, Any]):
        """Handle client settings update"""
        settings = data.get('settings', {})
        logger.info(f"⚙️ Settings update from {client.athlete_name}: {settings}")
        # Implement settings update logic

async def main():
    """Main server execution"""
    server = BlazeCoachingServer(host="0.0.0.0", port=8765)
    
    try:
        await server.start_server()
    except KeyboardInterrupt:
        logger.info("🛑 Server shutdown requested")
    except Exception as e:
        logger.error(f"❌ Server error: {e}")

if __name__ == "__main__":
    asyncio.run(main())