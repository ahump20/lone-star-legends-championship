#!/usr/bin/env python3
"""
Real-Time AI Coaching Feedback System
Instant, championship-level coaching during live performance
"""

import asyncio
import websockets
import json
import logging
import time
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Callable, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import threading
import queue
from pathlib import Path

logger = logging.getLogger('realtime_coaching')

class FeedbackUrgency(Enum):
    INSTANT = "instant"      # 0-50ms response time
    IMMEDIATE = "immediate"  # 50-100ms response time
    QUICK = "quick"         # 100-250ms response time
    NORMAL = "normal"       # 250-500ms response time

class FeedbackType(Enum):
    TECHNIQUE = "technique"
    SAFETY = "safety"
    PERFORMANCE = "performance"
    ENCOURAGEMENT = "encouragement"
    CORRECTION = "correction"
    MILESTONE = "milestone"

class CoachingStyle(Enum):
    SUPPORTIVE = "supportive"
    DIRECT = "direct"
    ANALYTICAL = "analytical"
    MOTIVATIONAL = "motivational"
    TECHNICAL = "technical"

@dataclass
class RealTimeFeedback:
    """Real-time feedback message"""
    id: str
    timestamp: float
    feedback_type: FeedbackType
    urgency: FeedbackUrgency
    message: str
    visual_cue: Optional[str]
    audio_cue: Optional[str]
    confidence: float
    frame_reference: Optional[int]
    metric_triggered: str
    suggested_action: str
    coaching_style: CoachingStyle

@dataclass
class PerformanceFrame:
    """Single frame of performance data"""
    frame_number: int
    timestamp: float
    metrics: Dict[str, float]
    pose_landmarks: Optional[Dict]
    quality_score: float
    alert_level: int  # 0=good, 1=caution, 2=warning, 3=critical

@dataclass
class LiveSession:
    """Live coaching session data"""
    session_id: str
    user_id: str
    sport: str
    analysis_type: str
    start_time: datetime
    coaching_preferences: Dict[str, Any]
    real_time_metrics: List[PerformanceFrame]
    feedback_history: List[RealTimeFeedback]
    session_goals: List[str]
    adaptive_thresholds: Dict[str, float]

class RealTimeCoachingSystem:
    """Championship-level real-time AI coaching system"""
    
    def __init__(self):
        self.active_sessions = {}
        self.coaching_models = {}
        self.feedback_generators = {}
        self.adaptive_thresholds = AdaptiveThresholdManager()
        self.performance_predictor = PerformancePredictor()
        self.injury_prevention = InjuryPreventionSystem()
        
        # WebSocket server
        self.websocket_server = None
        self.connected_clients = {}
        
        # Feedback queue for different urgency levels
        self.instant_queue = asyncio.Queue(maxsize=1000)
        self.immediate_queue = asyncio.Queue(maxsize=1000)
        self.quick_queue = asyncio.Queue(maxsize=1000)
        self.normal_queue = asyncio.Queue(maxsize=1000)
        
        # Output directory
        self.output_dir = Path('public/data/realtime_coaching')
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        logger.info("🚀 Real-time coaching system initialized")
    
    async def start_live_session(
        self,
        user_id: str,
        sport: str,
        analysis_type: str,
        coaching_preferences: Dict[str, Any] = None
    ) -> str:
        """Start a new live coaching session"""
        
        session_id = f"live_{user_id}_{int(time.time())}"
        
        session = LiveSession(
            session_id=session_id,
            user_id=user_id,
            sport=sport,
            analysis_type=analysis_type,
            start_time=datetime.now(),
            coaching_preferences=coaching_preferences or self._default_coaching_preferences(),
            real_time_metrics=[],
            feedback_history=[],
            session_goals=[],
            adaptive_thresholds=self._initialize_adaptive_thresholds(sport, analysis_type)
        )
        
        self.active_sessions[session_id] = session
        
        # Start background processing tasks
        asyncio.create_task(self._session_processor(session_id))
        asyncio.create_task(self._feedback_dispatcher(session_id))
        asyncio.create_task(self._adaptive_learning(session_id))
        
        logger.info(f"🎯 Live session started: {session_id}")
        logger.info(f"🏃 Sport: {sport}, Analysis: {analysis_type}")
        
        return session_id
    
    async def process_frame(
        self,
        session_id: str,
        frame_data: Dict[str, Any]
    ) -> List[RealTimeFeedback]:
        """Process single frame and generate real-time feedback"""
        
        if session_id not in self.active_sessions:
            logger.error(f"Session not found: {session_id}")
            return []
        
        session = self.active_sessions[session_id]
        start_time = time.time()
        
        # Extract performance metrics from frame
        performance_frame = self._extract_performance_metrics(frame_data, session)
        session.real_time_metrics.append(performance_frame)
        
        # Generate immediate feedback
        feedback_list = []
        
        # Critical safety checks (instant response required)
        safety_feedback = await self._check_safety_alerts(performance_frame, session)
        if safety_feedback:
            feedback_list.extend(safety_feedback)
            await self.instant_queue.put(safety_feedback)
        
        # Performance optimization feedback (immediate response)
        performance_feedback = await self._generate_performance_feedback(performance_frame, session)
        if performance_feedback:
            feedback_list.extend(performance_feedback)
            await self.immediate_queue.put(performance_feedback)
        
        # Technique improvement suggestions (quick response)
        technique_feedback = await self._analyze_technique_patterns(performance_frame, session)
        if technique_feedback:
            feedback_list.extend(technique_feedback)
            await self.quick_queue.put(technique_feedback)
        
        # Motivational and milestone feedback (normal response)
        motivational_feedback = await self._generate_motivational_feedback(performance_frame, session)
        if motivational_feedback:
            feedback_list.extend(motivational_feedback)
            await self.normal_queue.put(motivational_feedback)
        
        # Update session feedback history
        session.feedback_history.extend(feedback_list)
        
        # Adapt coaching based on user response
        await self._adapt_coaching_style(session, feedback_list)
        
        processing_time = (time.time() - start_time) * 1000  # Convert to milliseconds
        
        # Log performance metrics
        if processing_time > 50:  # Log if processing takes more than 50ms
            logger.warning(f"⚠️  Slow frame processing: {processing_time:.1f}ms for session {session_id}")
        
        return feedback_list
    
    def _extract_performance_metrics(
        self,
        frame_data: Dict[str, Any],
        session: LiveSession
    ) -> PerformanceFrame:
        """Extract performance metrics from frame data"""
        
        frame_number = len(session.real_time_metrics)
        timestamp = time.time()
        
        # Simulate real-time pose analysis and metric extraction
        # In production, this would use actual computer vision models
        
        base_metrics = self._get_baseline_metrics(session.sport, session.analysis_type)
        
        # Add realistic variation and trends
        variation = np.random.normal(0, 5)  # 5-point standard deviation
        
        # Simulate performance drift over time (fatigue, improvement, etc.)
        time_factor = min(len(session.real_time_metrics) / 100, 1.0)  # Gradual change over 100 frames
        fatigue_factor = max(0.8, 1.0 - time_factor * 0.2)  # Slight performance degradation
        
        metrics = {
            'balance_score': max(0, min(100, base_metrics['balance'] + variation * fatigue_factor)),
            'timing_score': max(0, min(100, base_metrics['timing'] + variation * fatigue_factor)),
            'power_efficiency': max(0, min(100, base_metrics['power'] + variation * fatigue_factor)),
            'form_consistency': max(0, min(100, base_metrics['consistency'] + variation * fatigue_factor)),
            'injury_risk': max(0, min(100, base_metrics['injury_risk'] + abs(variation) * (1 + time_factor))),
            'overall_performance': 0  # Will be calculated
        }
        
        # Calculate overall performance
        metrics['overall_performance'] = (
            metrics['balance_score'] * 0.25 +
            metrics['timing_score'] * 0.25 +
            metrics['power_efficiency'] * 0.25 +
            metrics['form_consistency'] * 0.25
        )
        
        # Determine alert level
        alert_level = 0  # Default: good
        if metrics['injury_risk'] > 60:
            alert_level = 3  # Critical
        elif metrics['injury_risk'] > 40 or metrics['overall_performance'] < 60:
            alert_level = 2  # Warning
        elif metrics['injury_risk'] > 25 or metrics['overall_performance'] < 75:
            alert_level = 1  # Caution
        
        # Quality score based on pose detection confidence (simulated)
        quality_score = np.random.uniform(0.7, 0.98)
        
        return PerformanceFrame(
            frame_number=frame_number,
            timestamp=timestamp,
            metrics=metrics,
            pose_landmarks=frame_data.get('pose_landmarks'),
            quality_score=quality_score,
            alert_level=alert_level
        )
    
    def _get_baseline_metrics(self, sport: str, analysis_type: str) -> Dict[str, float]:
        """Get baseline metrics for sport/analysis type"""
        
        baselines = {
            'baseball': {
                'batting': {
                    'balance': 78.0, 'timing': 75.0, 'power': 80.0, 
                    'consistency': 82.0, 'injury_risk': 25.0
                },
                'pitching': {
                    'balance': 85.0, 'timing': 88.0, 'power': 83.0,
                    'consistency': 80.0, 'injury_risk': 30.0
                }
            },
            'football': {
                'quarterback': {
                    'balance': 80.0, 'timing': 85.0, 'power': 78.0,
                    'consistency': 75.0, 'injury_risk': 28.0
                }
            },
            'basketball': {
                'shooting': {
                    'balance': 83.0, 'timing': 90.0, 'power': 75.0,
                    'consistency': 85.0, 'injury_risk': 20.0
                }
            }
        }
        
        return baselines.get(sport, {}).get(analysis_type, {
            'balance': 75.0, 'timing': 75.0, 'power': 75.0,
            'consistency': 75.0, 'injury_risk': 30.0
        })
    
    async def _check_safety_alerts(
        self,
        frame: PerformanceFrame,
        session: LiveSession
    ) -> List[RealTimeFeedback]:
        """Check for critical safety issues requiring instant feedback"""
        
        feedback_list = []
        
        # Critical injury risk
        if frame.metrics['injury_risk'] > 70:
            feedback = RealTimeFeedback(
                id=f"safety_{frame.frame_number}",
                timestamp=frame.timestamp,
                feedback_type=FeedbackType.SAFETY,
                urgency=FeedbackUrgency.INSTANT,
                message="🚨 HIGH INJURY RISK - Adjust form immediately!",
                visual_cue="red_warning_overlay",
                audio_cue="warning_beep",
                confidence=0.95,
                frame_reference=frame.frame_number,
                metric_triggered="injury_risk",
                suggested_action="Stop and reset to proper form position",
                coaching_style=CoachingStyle.DIRECT
            )
            feedback_list.append(feedback)
        
        # Severe balance issues
        elif frame.metrics['balance_score'] < 40:
            feedback = RealTimeFeedback(
                id=f"balance_critical_{frame.frame_number}",
                timestamp=frame.timestamp,
                feedback_type=FeedbackType.SAFETY,
                urgency=FeedbackUrgency.INSTANT,
                message="⚠️ Balance critical - stabilize now!",
                visual_cue="balance_warning",
                audio_cue="gentle_chime",
                confidence=0.88,
                frame_reference=frame.frame_number,
                metric_triggered="balance_score",
                suggested_action="Widen stance and engage core",
                coaching_style=CoachingStyle.DIRECT
            )
            feedback_list.append(feedback)
        
        return feedback_list
    
    async def _generate_performance_feedback(
        self,
        frame: PerformanceFrame,
        session: LiveSession
    ) -> List[RealTimeFeedback]:
        """Generate performance optimization feedback"""
        
        feedback_list = []
        
        # Timing optimization
        if frame.metrics['timing_score'] < session.adaptive_thresholds.get('timing_threshold', 70):
            feedback = RealTimeFeedback(
                id=f"timing_{frame.frame_number}",
                timestamp=frame.timestamp,
                feedback_type=FeedbackType.PERFORMANCE,
                urgency=FeedbackUrgency.IMMEDIATE,
                message=self._generate_timing_feedback(session.sport, session.analysis_type),
                visual_cue="timing_indicator",
                audio_cue="rhythm_metronome",
                confidence=0.82,
                frame_reference=frame.frame_number,
                metric_triggered="timing_score",
                suggested_action="Focus on rhythm and sequencing",
                coaching_style=session.coaching_preferences.get('style', CoachingStyle.SUPPORTIVE)
            )
            feedback_list.append(feedback)
        
        # Power efficiency optimization
        if frame.metrics['power_efficiency'] < session.adaptive_thresholds.get('power_threshold', 75):
            feedback = RealTimeFeedback(
                id=f"power_{frame.frame_number}",
                timestamp=frame.timestamp,
                feedback_type=FeedbackType.PERFORMANCE,
                urgency=FeedbackUrgency.IMMEDIATE,
                message=self._generate_power_feedback(session.sport, session.analysis_type),
                visual_cue="power_flow_diagram",
                audio_cue="power_whoosh",
                confidence=0.79,
                frame_reference=frame.frame_number,
                metric_triggered="power_efficiency",
                suggested_action="Optimize kinetic chain sequencing",
                coaching_style=session.coaching_preferences.get('style', CoachingStyle.ANALYTICAL)
            )
            feedback_list.append(feedback)
        
        return feedback_list
    
    async def _analyze_technique_patterns(
        self,
        frame: PerformanceFrame,
        session: LiveSession
    ) -> List[RealTimeFeedback]:
        """Analyze technique patterns and provide improvement suggestions"""
        
        feedback_list = []
        
        # Look for patterns in recent frames
        if len(session.real_time_metrics) >= 10:
            recent_frames = session.real_time_metrics[-10:]
            
            # Analyze consistency patterns
            balance_trend = [f.metrics['balance_score'] for f in recent_frames]
            balance_consistency = 1.0 - (np.std(balance_trend) / 100)
            
            if balance_consistency < 0.7:  # Less than 70% consistency
                feedback = RealTimeFeedback(
                    id=f"technique_consistency_{frame.frame_number}",
                    timestamp=frame.timestamp,
                    feedback_type=FeedbackType.TECHNIQUE,
                    urgency=FeedbackUrgency.QUICK,
                    message="🎯 Focus on consistent setup - your balance is varying",
                    visual_cue="consistency_guide",
                    audio_cue="gentle_reminder",
                    confidence=0.75,
                    frame_reference=frame.frame_number,
                    metric_triggered="balance_consistency",
                    suggested_action="Practice setup position repeatedly",
                    coaching_style=CoachingStyle.TECHNICAL
                )
                feedback_list.append(feedback)
        
        return feedback_list
    
    async def _generate_motivational_feedback(
        self,
        frame: PerformanceFrame,
        session: LiveSession
    ) -> List[RealTimeFeedback]:
        """Generate motivational and milestone feedback"""
        
        feedback_list = []
        
        # Celebrate improvements
        if len(session.real_time_metrics) >= 20:
            recent_avg = np.mean([f.metrics['overall_performance'] 
                                for f in session.real_time_metrics[-20:]])
            earlier_avg = np.mean([f.metrics['overall_performance'] 
                                 for f in session.real_time_metrics[-40:-20]]) if len(session.real_time_metrics) >= 40 else recent_avg - 5
            
            improvement = recent_avg - earlier_avg
            
            if improvement > 3:  # 3+ point improvement
                feedback = RealTimeFeedback(
                    id=f"motivation_improvement_{frame.frame_number}",
                    timestamp=frame.timestamp,
                    feedback_type=FeedbackType.ENCOURAGEMENT,
                    urgency=FeedbackUrgency.NORMAL,
                    message=f"🚀 Excellent improvement! +{improvement:.1f} points!",
                    visual_cue="improvement_sparkles",
                    audio_cue="success_chime",
                    confidence=0.90,
                    frame_reference=frame.frame_number,
                    metric_triggered="overall_improvement",
                    suggested_action="Keep up the great work!",
                    coaching_style=CoachingStyle.MOTIVATIONAL
                )
                feedback_list.append(feedback)
        
        # Milestone celebrations
        if frame.metrics['overall_performance'] > 90 and len([f for f in session.feedback_history 
                                                               if f.feedback_type == FeedbackType.MILESTONE]) == 0:
            feedback = RealTimeFeedback(
                id=f"milestone_elite_{frame.frame_number}",
                timestamp=frame.timestamp,
                feedback_type=FeedbackType.MILESTONE,
                urgency=FeedbackUrgency.NORMAL,
                message="🏆 ELITE PERFORMANCE! You're in the 90+ club!",
                visual_cue="champion_burst",
                audio_cue="fanfare",
                confidence=1.0,
                frame_reference=frame.frame_number,
                metric_triggered="elite_performance",
                suggested_action="Maintain this level of excellence",
                coaching_style=CoachingStyle.MOTIVATIONAL
            )
            feedback_list.append(feedback)
        
        return feedback_list
    
    def _generate_timing_feedback(self, sport: str, analysis_type: str) -> str:
        """Generate sport-specific timing feedback"""
        
        timing_messages = {
            'baseball': {
                'batting': [
                    "🎯 Sync your hip turn with stride foot contact",
                    "⏰ Start your swing earlier - timing is everything",
                    "🔄 Work on your load-to-launch timing",
                    "📏 Keep consistent rhythm in your approach"
                ],
                'pitching': [
                    "🎯 Synchronize leg lift with arm preparation",
                    "⏰ Optimize your delivery timing sequence",
                    "🔄 Match your arm speed to lower body drive",
                    "📏 Maintain consistent tempo throughout delivery"
                ]
            },
            'football': {
                'quarterback': [
                    "🎯 Sync your footwork with arm motion",
                    "⏰ Release the ball at peak arm extension",
                    "🔄 Time your hip rotation with arm acceleration",
                    "📏 Keep consistent rhythm in your drop back"
                ]
            },
            'basketball': {
                'shooting': [
                    "🎯 Sync your release with peak jump height",
                    "⏰ Coordinate your shooting hand with guide hand",
                    "🔄 Time your leg drive with arm extension",
                    "📏 Maintain consistent shooting rhythm"
                ]
            }
        }
        
        messages = timing_messages.get(sport, {}).get(analysis_type, [
            "🎯 Focus on timing coordination",
            "⏰ Synchronize your movement sequence",
            "🔄 Work on rhythm consistency",
            "📏 Maintain steady tempo"
        ])
        
        return np.random.choice(messages)
    
    def _generate_power_feedback(self, sport: str, analysis_type: str) -> str:
        """Generate sport-specific power feedback"""
        
        power_messages = {
            'baseball': {
                'batting': [
                    "💥 Drive through your legs for more power",
                    "🔥 Maximize hip rotation speed",
                    "⚡ Transfer energy from ground up",
                    "🚀 Accelerate through the hitting zone"
                ],
                'pitching': [
                    "💥 Use your legs to drive forward momentum",
                    "🔥 Maximize shoulder separation",
                    "⚡ Create explosive hip-to-shoulder rotation",
                    "🚀 Follow through with full body"
                ]
            },
            'football': {
                'quarterback': [
                    "💥 Plant your back foot firmly for power",
                    "🔥 Generate power from your core rotation",
                    "⚡ Use your whole body in the throw",
                    "🚀 Follow through with full arm extension"
                ]
            }
        }
        
        messages = power_messages.get(sport, {}).get(analysis_type, [
            "💥 Focus on power generation",
            "🔥 Maximize energy transfer",
            "⚡ Use full body coordination",
            "🚀 Drive through the movement"
        ])
        
        return np.random.choice(messages)
    
    async def _adapt_coaching_style(
        self,
        session: LiveSession,
        recent_feedback: List[RealTimeFeedback]
    ) -> None:
        """Adapt coaching style based on user response and performance"""
        
        # Analyze user's response to different coaching styles
        # This would track actual user behavior, performance changes, etc.
        
        # For demo, simulate adaptive behavior
        if len(session.real_time_metrics) > 50:
            recent_performance = [f.metrics['overall_performance'] 
                                for f in session.real_time_metrics[-20:]]
            performance_trend = np.polyfit(range(len(recent_performance)), recent_performance, 1)[0]
            
            # If performance is declining, try different coaching approach
            if performance_trend < -0.5:  # Declining performance
                current_style = session.coaching_preferences.get('style', CoachingStyle.SUPPORTIVE)
                
                # Cycle through coaching styles to find what works
                style_cycle = {
                    CoachingStyle.SUPPORTIVE: CoachingStyle.MOTIVATIONAL,
                    CoachingStyle.MOTIVATIONAL: CoachingStyle.TECHNICAL,
                    CoachingStyle.TECHNICAL: CoachingStyle.DIRECT,
                    CoachingStyle.DIRECT: CoachingStyle.ANALYTICAL,
                    CoachingStyle.ANALYTICAL: CoachingStyle.SUPPORTIVE
                }
                
                session.coaching_preferences['style'] = style_cycle.get(current_style, CoachingStyle.SUPPORTIVE)
                logger.info(f"📊 Adapted coaching style to {session.coaching_preferences['style'].value}")
    
    async def _session_processor(self, session_id: str):
        """Background processor for session management"""
        
        while session_id in self.active_sessions:
            session = self.active_sessions[session_id]
            
            # Clean up old metrics to prevent memory bloat
            if len(session.real_time_metrics) > 1000:
                session.real_time_metrics = session.real_time_metrics[-500:]
            
            # Clean up old feedback
            if len(session.feedback_history) > 500:
                session.feedback_history = session.feedback_history[-250:]
            
            # Update adaptive thresholds
            if len(session.real_time_metrics) > 20:
                self._update_adaptive_thresholds(session)
            
            await asyncio.sleep(5)  # Process every 5 seconds
    
    async def _feedback_dispatcher(self, session_id: str):
        """Dispatch feedback based on urgency levels"""
        
        while session_id in self.active_sessions:
            try:
                # Process instant feedback first
                try:
                    feedback = await asyncio.wait_for(self.instant_queue.get(), timeout=0.01)
                    await self._send_feedback_to_client(session_id, feedback)
                except asyncio.TimeoutError:
                    pass
                
                # Process immediate feedback
                try:
                    feedback = await asyncio.wait_for(self.immediate_queue.get(), timeout=0.05)
                    await self._send_feedback_to_client(session_id, feedback)
                except asyncio.TimeoutError:
                    pass
                
                # Process quick feedback
                try:
                    feedback = await asyncio.wait_for(self.quick_queue.get(), timeout=0.1)
                    await self._send_feedback_to_client(session_id, feedback)
                except asyncio.TimeoutError:
                    pass
                
                # Process normal feedback
                try:
                    feedback = await asyncio.wait_for(self.normal_queue.get(), timeout=0.25)
                    await self._send_feedback_to_client(session_id, feedback)
                except asyncio.TimeoutError:
                    pass
                
            except Exception as e:
                logger.error(f"Error in feedback dispatcher: {e}")
            
            await asyncio.sleep(0.01)  # 10ms cycle time
    
    async def _adaptive_learning(self, session_id: str):
        """Adaptive learning system that improves coaching over time"""
        
        while session_id in self.active_sessions:
            session = self.active_sessions[session_id]
            
            # Analyze what feedback types are most effective
            if len(session.feedback_history) > 30:
                effective_feedback = self._analyze_feedback_effectiveness(session)
                session.coaching_preferences['effective_types'] = effective_feedback
            
            await asyncio.sleep(10)  # Analyze every 10 seconds
    
    def _analyze_feedback_effectiveness(self, session: LiveSession) -> Dict[str, float]:
        """Analyze which feedback types are most effective for this user"""
        
        # Simulate feedback effectiveness analysis
        # In production, this would track performance changes after different feedback types
        
        return {
            'safety': np.random.uniform(0.8, 0.95),
            'performance': np.random.uniform(0.7, 0.88),
            'technique': np.random.uniform(0.65, 0.82),
            'encouragement': np.random.uniform(0.70, 0.90),
            'correction': np.random.uniform(0.60, 0.85)
        }
    
    async def _send_feedback_to_client(self, session_id: str, feedback: List[RealTimeFeedback]):
        """Send feedback to connected client via WebSocket"""
        
        if session_id in self.connected_clients:
            try:
                websocket = self.connected_clients[session_id]
                
                # Convert feedback to JSON
                feedback_data = {
                    'type': 'realtime_feedback',
                    'session_id': session_id,
                    'timestamp': time.time(),
                    'feedback': [asdict(f) for f in feedback] if isinstance(feedback, list) else [asdict(feedback)]
                }
                
                await websocket.send(json.dumps(feedback_data))
                
            except Exception as e:
                logger.error(f"Error sending feedback to client: {e}")
    
    def _update_adaptive_thresholds(self, session: LiveSession):
        """Update adaptive thresholds based on user's performance patterns"""
        
        recent_metrics = session.real_time_metrics[-20:]
        
        # Calculate user's typical performance ranges
        avg_balance = np.mean([f.metrics['balance_score'] for f in recent_metrics])
        avg_timing = np.mean([f.metrics['timing_score'] for f in recent_metrics])
        avg_power = np.mean([f.metrics['power_efficiency'] for f in recent_metrics])
        
        # Adapt thresholds to be slightly above user's average
        session.adaptive_thresholds.update({
            'balance_threshold': max(60, avg_balance - 5),
            'timing_threshold': max(60, avg_timing - 5),
            'power_threshold': max(60, avg_power - 5)
        })
    
    def _default_coaching_preferences(self) -> Dict[str, Any]:
        """Get default coaching preferences"""
        
        return {
            'style': CoachingStyle.SUPPORTIVE,
            'feedback_frequency': 'moderate',  # low, moderate, high
            'audio_enabled': True,
            'visual_cues_enabled': True,
            'motivational_messages': True,
            'technical_detail_level': 'medium',  # low, medium, high
            'safety_priority': 'high'
        }
    
    def _initialize_adaptive_thresholds(self, sport: str, analysis_type: str) -> Dict[str, float]:
        """Initialize adaptive thresholds for the session"""
        
        return {
            'balance_threshold': 70.0,
            'timing_threshold': 70.0,
            'power_threshold': 70.0,
            'injury_risk_threshold': 40.0,
            'consistency_threshold': 75.0
        }
    
    async def end_session(self, session_id: str) -> Dict[str, Any]:
        """End live coaching session and generate summary"""
        
        if session_id not in self.active_sessions:
            return {'error': 'Session not found'}
        
        session = self.active_sessions[session_id]
        
        # Generate session summary
        summary = self._generate_session_summary(session)
        
        # Clean up session
        del self.active_sessions[session_id]
        if session_id in self.connected_clients:
            del self.connected_clients[session_id]
        
        logger.info(f"📊 Session ended: {session_id}")
        logger.info(f"⏱️  Duration: {summary['duration_minutes']:.1f} minutes")
        logger.info(f"📈 Frames processed: {summary['total_frames']}")
        logger.info(f"💬 Feedback given: {summary['total_feedback']}")
        
        return summary
    
    def _generate_session_summary(self, session: LiveSession) -> Dict[str, Any]:
        """Generate comprehensive session summary"""
        
        duration = (datetime.now() - session.start_time).total_seconds() / 60  # minutes
        
        # Performance analysis
        if session.real_time_metrics:
            performance_scores = [f.metrics['overall_performance'] for f in session.real_time_metrics]
            
            summary = {
                'session_id': session.session_id,
                'duration_minutes': duration,
                'total_frames': len(session.real_time_metrics),
                'total_feedback': len(session.feedback_history),
                'performance_analysis': {
                    'starting_score': performance_scores[0] if performance_scores else 0,
                    'ending_score': performance_scores[-1] if performance_scores else 0,
                    'average_score': np.mean(performance_scores) if performance_scores else 0,
                    'peak_score': np.max(performance_scores) if performance_scores else 0,
                    'improvement': performance_scores[-1] - performance_scores[0] if len(performance_scores) > 1 else 0
                },
                'feedback_breakdown': self._analyze_feedback_breakdown(session.feedback_history),
                'safety_incidents': len([f for f in session.feedback_history if f.feedback_type == FeedbackType.SAFETY]),
                'milestones_achieved': len([f for f in session.feedback_history if f.feedback_type == FeedbackType.MILESTONE]),
                'adaptive_learning': {
                    'final_thresholds': session.adaptive_thresholds,
                    'coaching_style_changes': 1,  # Would track actual changes
                    'effectiveness_scores': self._analyze_feedback_effectiveness(session)
                }
            }
        else:
            summary = {
                'session_id': session.session_id,
                'duration_minutes': duration,
                'total_frames': 0,
                'total_feedback': 0,
                'error': 'No performance data recorded'
            }
        
        return summary
    
    def _analyze_feedback_breakdown(self, feedback_history: List[RealTimeFeedback]) -> Dict[str, int]:
        """Analyze breakdown of feedback types given during session"""
        
        breakdown = {}
        for feedback in feedback_history:
            feedback_type = feedback.feedback_type.value
            breakdown[feedback_type] = breakdown.get(feedback_type, 0) + 1
        
        return breakdown

    # WebSocket server methods
    async def start_websocket_server(self, host: str = "localhost", port: int = 8765):
        """Start WebSocket server for real-time communication"""
        
        async def handle_client(websocket, path):
            try:
                await self._handle_websocket_client(websocket, path)
            except websockets.exceptions.ConnectionClosed:
                logger.info("Client disconnected")
            except Exception as e:
                logger.error(f"WebSocket error: {e}")
        
        self.websocket_server = await websockets.serve(handle_client, host, port)
        logger.info(f"🌐 WebSocket server started on ws://{host}:{port}")
        
        return self.websocket_server
    
    async def _handle_websocket_client(self, websocket, path):
        """Handle individual WebSocket client connections"""
        
        logger.info(f"📱 New client connected: {websocket.remote_address}")
        
        async for message in websocket:
            try:
                data = json.loads(message)
                await self._process_websocket_message(websocket, data)
            except json.JSONDecodeError:
                await websocket.send(json.dumps({'error': 'Invalid JSON'}))
            except Exception as e:
                logger.error(f"Error processing message: {e}")
                await websocket.send(json.dumps({'error': str(e)}))
    
    async def _process_websocket_message(self, websocket, data: Dict[str, Any]):
        """Process WebSocket messages from clients"""
        
        message_type = data.get('type')
        
        if message_type == 'start_session':
            session_id = await self.start_live_session(
                user_id=data.get('user_id'),
                sport=data.get('sport'),
                analysis_type=data.get('analysis_type'),
                coaching_preferences=data.get('coaching_preferences')
            )
            
            self.connected_clients[session_id] = websocket
            
            await websocket.send(json.dumps({
                'type': 'session_started',
                'session_id': session_id
            }))
        
        elif message_type == 'frame_data':
            session_id = data.get('session_id')
            frame_data = data.get('frame_data')
            
            feedback = await self.process_frame(session_id, frame_data)
            # Feedback is sent automatically via feedback dispatcher
        
        elif message_type == 'end_session':
            session_id = data.get('session_id')
            summary = await self.end_session(session_id)
            
            await websocket.send(json.dumps({
                'type': 'session_ended',
                'summary': summary
            }))


class AdaptiveThresholdManager:
    """Manages adaptive thresholds for personalized coaching"""
    
    def __init__(self):
        self.user_thresholds = {}
        logger.info("🎯 Adaptive threshold manager initialized")
    
    def update_thresholds(self, user_id: str, performance_history: List[Dict]):
        """Update personalized thresholds based on user performance history"""
        pass


class PerformancePredictor:
    """Predicts performance trends and potential issues"""
    
    def __init__(self):
        self.prediction_models = {}
        logger.info("🔮 Performance predictor initialized")
    
    def predict_performance_decline(self, metrics_history: List[Dict]) -> float:
        """Predict likelihood of performance decline"""
        return np.random.uniform(0.1, 0.3)  # 10-30% chance


class InjuryPreventionSystem:
    """Advanced injury risk assessment and prevention"""
    
    def __init__(self):
        self.risk_models = {}
        logger.info("🛡️  Injury prevention system initialized")
    
    def assess_injury_risk(self, biomechanics_data: Dict) -> float:
        """Assess real-time injury risk"""
        return np.random.uniform(10, 40)  # 10-40% risk


# Demo and testing
async def main():
    """Demo the real-time coaching system"""
    
    logger.info("🚀 Starting Real-Time Coaching System Demo")
    
    # Initialize system
    coaching_system = RealTimeCoachingSystem()
    
    # Start a demo session
    session_id = await coaching_system.start_live_session(
        user_id="demo_user_001",
        sport="baseball",
        analysis_type="batting",
        coaching_preferences={
            'style': CoachingStyle.SUPPORTIVE,
            'feedback_frequency': 'high',
            'audio_enabled': True
        }
    )
    
    logger.info(f"📺 Demo session started: {session_id}")
    
    # Simulate frame processing
    for frame_num in range(50):
        frame_data = {
            'frame_number': frame_num,
            'pose_landmarks': {},  # Would contain actual pose data
            'timestamp': time.time()
        }
        
        feedback = await coaching_system.process_frame(session_id, frame_data)
        
        if feedback:
            for fb in feedback:
                logger.info(f"💬 Feedback: {fb.message}")
        
        await asyncio.sleep(0.1)  # 10 FPS simulation
    
    # End session
    summary = await coaching_system.end_session(session_id)
    
    logger.info("📊 SESSION SUMMARY:")
    logger.info(f"   ⏱️  Duration: {summary['duration_minutes']:.1f} minutes")
    logger.info(f"   📊 Frames: {summary['total_frames']}")
    logger.info(f"   💬 Feedback: {summary['total_feedback']}")
    logger.info(f"   📈 Improvement: {summary['performance_analysis']['improvement']:.1f} points")
    
    logger.info("🎉 Real-Time Coaching Demo Complete!")


if __name__ == '__main__':
    asyncio.run(main())