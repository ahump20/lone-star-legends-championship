#!/usr/bin/env python3
"""
Blaze Tell Detector - Dual-Signal Pressure Detection System
Fuses facial micro-expressions with biomechanics stability for championship-level insights

Based on literature:
- CASME II and SAMM micro-expression datasets (200fps capture)
- OpenFace 2.0 and Py-Feat for Action Units (AU) detection
- MediaPipe Pose for real-time biomechanics
- Baseball Leverage Index (LI) for objective pressure context
"""

import cv2
import numpy as np
import json
import logging
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any, NamedTuple
from dataclasses import dataclass, asdict
from enum import Enum
import asyncio
import threading
import queue
from pathlib import Path
from collections import deque, defaultdict
import statistics

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('tell_detector')

class PressureLevel(Enum):
    """Pressure level indicators for coach timeline"""
    GREEN = "focus"          # Optimal state
    YELLOW = "building"      # Pressure building
    RED = "breakdown_risk"   # High risk of performance breakdown

class SignalType(Enum):
    """Types of signals being monitored"""
    MICRO_EXPRESSION = "micro"
    BIOMECHANICS = "mechanics" 
    PHYSIOLOGY = "physiology"
    CONTEXT = "context"

@dataclass
class FacialMicroSignals:
    """Micro-expression and facial behavior signals"""
    # Action Units (FACS system)
    au4_brow_lowerer: float      # Concentration/stress
    au5_upper_lid_raiser: float  # Alert/surprise
    au7_lid_tightener: float     # Squinting/focus
    au9_nose_wrinkler: float     # Disgust/difficulty
    au10_upper_lip_raiser: float # Disgust/contempt
    au14_dimpler: float          # Stress smile
    au17_chin_raiser: float      # Jaw tension
    au23_lip_tightener: float    # Lip compression
    au24_lip_pressor: float      # Lip press
    
    # Gaze and blink patterns
    gaze_stability: float        # Variance in gaze vector
    blink_rate: float           # Blinks per minute
    blink_burst_intensity: float # Rapid blink sequences
    
    # Head micro-movements
    head_pitch_jitter: float    # Micro-tremor in head pitch
    head_roll_jitter: float     # Micro-tremor in head roll
    head_yaw_stability: float   # Head position consistency
    
    # Recovery metrics
    recovery_cadence: float     # Time to baseline after stress
    baseline_deviation: float   # Current vs established baseline

@dataclass
class BiomechanicsStability:
    """Biomechanics stability and consistency signals"""
    # Core mechanics drift
    arm_slot_drift: float       # Degrees from baseline
    shoulder_fly_open: float    # Early shoulder opening
    stride_consistency: float   # Stride length variation
    release_height_drift: float # Vertical release point drift
    
    # Timing and tempo
    tempo_variance: float       # Phase duration consistency  
    kinetic_sequence_stability: float # Chain timing consistency
    
    # Balance and posture
    balance_stability: float    # Weight distribution consistency
    posture_alignment: float    # Trunk alignment consistency
    
    # Power and efficiency
    power_consistency: float    # Power generation consistency
    mechanical_efficiency: float # Overall mechanical stability

@dataclass
class PhysiologySignals:
    """Physiological stress indicators (optional/experimental)"""
    heart_rate_variability: Optional[float] = None  # HRV from rPPG
    respiratory_rate: Optional[float] = None        # Breathing rate
    skin_conductance: Optional[float] = None        # Stress response (if available)
    autonomic_balance: Optional[float] = None       # Sympathetic/parasympathetic

@dataclass
class ContextualFactors:
    """Situational pressure context"""
    leverage_index: float       # Baseball LI for game situation
    inning_pressure: float      # Inning-based pressure multiplier
    count_pressure: float       # Ball-strike count pressure
    runner_pressure: float      # Base runner situation pressure
    score_differential: float   # Game score impact
    time_pressure: float        # Time-based pressure factors

@dataclass
class TellDetectorFrame:
    """Single frame of integrated tell detection data"""
    timestamp: float
    frame_number: int
    
    # Signal components
    facial_signals: FacialMicroSignals
    mechanics_stability: BiomechanicsStability
    physiology: PhysiologySignals
    context: ContextualFactors
    
    # Composite metrics
    grit_index: float          # Primary composite metric (0-100)
    pressure_level: PressureLevel
    breakdown_risk: float      # Probability of performance breakdown
    
    # Explanatory factors
    primary_stress_indicators: List[str]
    recovery_trajectory: str   # "improving", "stable", "declining"
    coach_alert_reason: Optional[str]

class TellDetectorEngine:
    """Core engine for dual-signal tell detection"""
    
    def __init__(self, 
                 face_fps: int = 120,
                 body_fps: int = 60,
                 baseline_window_seconds: int = 30):
        
        # Configuration
        self.face_fps = face_fps
        self.body_fps = body_fps
        self.baseline_window = baseline_window_seconds
        
        # Baseline tracking
        self.baseline_face_signals = deque(maxlen=face_fps * baseline_window_seconds)
        self.baseline_mechanics = deque(maxlen=body_fps * baseline_window_seconds)
        self.baseline_established = False
        
        # Real-time data streams
        self.face_signal_buffer = deque(maxlen=face_fps * 10)  # 10 second buffer
        self.mechanics_buffer = deque(maxlen=body_fps * 10)    # 10 second buffer
        self.integrated_timeline = deque(maxlen=1000)          # Timeline history
        
        # Signal processors
        self.face_processor = FacialSignalProcessor()
        self.mechanics_processor = BiomechanicsProcessor()
        self.physiology_processor = PhysiologyProcessor()
        self.context_processor = ContextProcessor()
        
        # Grit Index calculator
        self.grit_calculator = GritIndexCalculator()
        
        # Alert system
        self.alert_thresholds = self._initialize_alert_thresholds()
        
        logger.info("🎯 Tell Detector Engine initialized")
        logger.info(f"   📹 Face capture: {face_fps} fps")
        logger.info(f"   🏃 Body capture: {body_fps} fps") 
        logger.info(f"   📊 Baseline window: {baseline_window_seconds}s")
    
    def process_dual_frame(self,
                          face_frame: np.ndarray,
                          body_frame: np.ndarray,
                          timestamp: float,
                          context_data: Dict[str, Any] = None) -> TellDetectorFrame:
        """Process synchronized face and body frames"""
        
        frame_number = len(self.integrated_timeline)
        
        # Process individual signal streams
        facial_signals = self.face_processor.process_frame(face_frame, timestamp)
        mechanics_stability = self.mechanics_processor.process_frame(body_frame, timestamp)
        physiology = self.physiology_processor.process_frame(face_frame, timestamp)
        context = self.context_processor.process_context(context_data or {})
        
        # Add to buffers for baseline calculation
        self.face_signal_buffer.append(facial_signals)
        self.mechanics_buffer.append(mechanics_stability)
        
        # Update baselines if not established
        if not self.baseline_established:
            self._update_baselines()
        
        # Calculate composite Grit Index
        grit_index = self.grit_calculator.calculate_grit_index(
            facial_signals=facial_signals,
            mechanics_stability=mechanics_stability,
            physiology=physiology,
            context=context,
            baseline_face=self._get_baseline_face_signals(),
            baseline_mechanics=self._get_baseline_mechanics()
        )
        
        # Determine pressure level and risk
        pressure_level, breakdown_risk = self._assess_pressure_level(grit_index, facial_signals, mechanics_stability)
        
        # Identify primary stress indicators
        stress_indicators = self._identify_stress_indicators(facial_signals, mechanics_stability, grit_index)
        
        # Assess recovery trajectory
        recovery_trajectory = self._assess_recovery_trajectory()
        
        # Generate coach alert if needed
        coach_alert = self._generate_coach_alert(pressure_level, stress_indicators, breakdown_risk)
        
        # Create integrated frame
        integrated_frame = TellDetectorFrame(
            timestamp=timestamp,
            frame_number=frame_number,
            facial_signals=facial_signals,
            mechanics_stability=mechanics_stability,
            physiology=physiology,
            context=context,
            grit_index=grit_index,
            pressure_level=pressure_level,
            breakdown_risk=breakdown_risk,
            primary_stress_indicators=stress_indicators,
            recovery_trajectory=recovery_trajectory,
            coach_alert_reason=coach_alert
        )
        
        # Add to timeline
        self.integrated_timeline.append(integrated_frame)
        
        return integrated_frame
    
    def _update_baselines(self):
        """Update baseline calculations"""
        if (len(self.face_signal_buffer) >= self.face_fps * self.baseline_window and 
            len(self.mechanics_buffer) >= self.body_fps * self.baseline_window):
            
            self.baseline_established = True
            logger.info("📊 Baseline established from accumulated data")
    
    def _get_baseline_face_signals(self) -> Optional[FacialMicroSignals]:
        """Calculate baseline facial signals"""
        if not self.baseline_established:
            return None
            
        # Calculate baseline averages from recent stable data
        recent_signals = list(self.face_signal_buffer)[-self.face_fps * self.baseline_window:]
        
        if not recent_signals:
            return None
            
        return FacialMicroSignals(
            au4_brow_lowerer=statistics.mean([s.au4_brow_lowerer for s in recent_signals]),
            au5_upper_lid_raiser=statistics.mean([s.au5_upper_lid_raiser for s in recent_signals]),
            au7_lid_tightener=statistics.mean([s.au7_lid_tightener for s in recent_signals]),
            au9_nose_wrinkler=statistics.mean([s.au9_nose_wrinkler for s in recent_signals]),
            au10_upper_lip_raiser=statistics.mean([s.au10_upper_lip_raiser for s in recent_signals]),
            au14_dimpler=statistics.mean([s.au14_dimpler for s in recent_signals]),
            au17_chin_raiser=statistics.mean([s.au17_chin_raiser for s in recent_signals]),
            au23_lip_tightener=statistics.mean([s.au23_lip_tightener for s in recent_signals]),
            au24_lip_pressor=statistics.mean([s.au24_lip_pressor for s in recent_signals]),
            gaze_stability=statistics.mean([s.gaze_stability for s in recent_signals]),
            blink_rate=statistics.mean([s.blink_rate for s in recent_signals]),
            blink_burst_intensity=statistics.mean([s.blink_burst_intensity for s in recent_signals]),
            head_pitch_jitter=statistics.mean([s.head_pitch_jitter for s in recent_signals]),
            head_roll_jitter=statistics.mean([s.head_roll_jitter for s in recent_signals]),
            head_yaw_stability=statistics.mean([s.head_yaw_stability for s in recent_signals]),
            recovery_cadence=0.0,  # Calculated separately
            baseline_deviation=0.0  # By definition, baseline is 0
        )
    
    def _get_baseline_mechanics(self) -> Optional[BiomechanicsStability]:
        """Calculate baseline biomechanics"""
        if not self.baseline_established:
            return None
            
        recent_mechanics = list(self.mechanics_buffer)[-self.body_fps * self.baseline_window:]
        
        if not recent_mechanics:
            return None
            
        return BiomechanicsStability(
            arm_slot_drift=0.0,  # Baseline drift is 0 by definition
            shoulder_fly_open=statistics.mean([m.shoulder_fly_open for m in recent_mechanics]),
            stride_consistency=statistics.mean([m.stride_consistency for m in recent_mechanics]),
            release_height_drift=0.0,  # Baseline drift is 0
            tempo_variance=statistics.mean([m.tempo_variance for m in recent_mechanics]),
            kinetic_sequence_stability=statistics.mean([m.kinetic_sequence_stability for m in recent_mechanics]),
            balance_stability=statistics.mean([m.balance_stability for m in recent_mechanics]),
            posture_alignment=statistics.mean([m.posture_alignment for m in recent_mechanics]),
            power_consistency=statistics.mean([m.power_consistency for m in recent_mechanics]),
            mechanical_efficiency=statistics.mean([m.mechanical_efficiency for m in recent_mechanics])
        )
    
    def _assess_pressure_level(self, 
                              grit_index: float,
                              facial_signals: FacialMicroSignals,
                              mechanics: BiomechanicsStability) -> Tuple[PressureLevel, float]:
        """Assess current pressure level and breakdown risk"""
        
        # Grit Index thresholds
        if grit_index >= 75:
            base_level = PressureLevel.GREEN
            base_risk = 0.1
        elif grit_index >= 50:
            base_level = PressureLevel.YELLOW
            base_risk = 0.3
        else:
            base_level = PressureLevel.RED
            base_risk = 0.7
        
        # Adjust based on specific indicators
        risk_modifiers = []
        
        # High stress micro-expressions
        if facial_signals.au4_brow_lowerer > 2.0 or facial_signals.au17_chin_raiser > 1.5:
            risk_modifiers.append(0.2)
        
        # Blink burst patterns
        if facial_signals.blink_burst_intensity > 1.5:
            risk_modifiers.append(0.15)
        
        # Gaze instability
        if facial_signals.gaze_stability < 0.7:
            risk_modifiers.append(0.1)
        
        # Mechanical breakdown indicators
        if mechanics.arm_slot_drift > 3.0 or mechanics.release_height_drift > 2.0:
            risk_modifiers.append(0.25)
        
        # Calculate final risk
        final_risk = min(0.95, base_risk + sum(risk_modifiers))
        
        # Upgrade pressure level if risk is high
        if final_risk > 0.6 and base_level != PressureLevel.RED:
            base_level = PressureLevel.RED
        elif final_risk > 0.4 and base_level == PressureLevel.GREEN:
            base_level = PressureLevel.YELLOW
        
        return base_level, final_risk
    
    def _identify_stress_indicators(self,
                                   facial_signals: FacialMicroSignals,
                                   mechanics: BiomechanicsStability,
                                   grit_index: float) -> List[str]:
        """Identify primary stress indicators for coaching feedback"""
        
        indicators = []
        
        # Facial micro-expression indicators
        if facial_signals.au4_brow_lowerer > 2.0:
            indicators.append("brow tension ↑")
        if facial_signals.au17_chin_raiser > 1.5:
            indicators.append("jaw set ↑")
        if facial_signals.blink_burst_intensity > 1.5:
            indicators.append("blink burst")
        if facial_signals.gaze_stability < 0.7:
            indicators.append("gaze jitter ↑")
        if facial_signals.head_pitch_jitter > 1.0:
            indicators.append("head pitch ↑")
        
        # Biomechanics indicators  
        if mechanics.arm_slot_drift > 3.0:
            indicators.append(f"arm slot drift {mechanics.arm_slot_drift:.1f}°")
        if mechanics.shoulder_fly_open > 1.5:
            indicators.append("shoulder fly-open ↑")
        if mechanics.release_height_drift > 2.0:
            indicators.append(f"release height drift {mechanics.release_height_drift:.1f}\"")
        if mechanics.tempo_variance > 1.3:
            indicators.append("tempo inconsistent")
        
        return indicators[:3]  # Return top 3 for coach clarity
    
    def _assess_recovery_trajectory(self) -> str:
        """Assess recovery trajectory from recent timeline data"""
        
        if len(self.integrated_timeline) < 10:
            return "establishing"
        
        # Look at last 10 frames
        recent_grit = [frame.grit_index for frame in list(self.integrated_timeline)[-10:]]
        
        # Calculate trend
        if len(recent_grit) >= 5:
            recent_trend = np.polyfit(range(len(recent_grit)), recent_grit, 1)[0]
            
            if recent_trend > 2:
                return "improving"
            elif recent_trend < -2:
                return "declining" 
            else:
                return "stable"
        
        return "stable"
    
    def _generate_coach_alert(self,
                             pressure_level: PressureLevel,
                             stress_indicators: List[str],
                             breakdown_risk: float) -> Optional[str]:
        """Generate coach alert if intervention is needed"""
        
        if pressure_level == PressureLevel.RED and breakdown_risk > 0.6:
            primary_indicators = " + ".join(stress_indicators[:2])
            return f"{primary_indicators} → breakdown risk {breakdown_risk:.0%}"
        elif pressure_level == PressureLevel.YELLOW and len(stress_indicators) >= 2:
            return f"Multiple stress signals: {', '.join(stress_indicators)}"
        
        return None
    
    def _initialize_alert_thresholds(self) -> Dict[str, float]:
        """Initialize alert thresholds based on research"""
        return {
            'grit_index_yellow': 65,
            'grit_index_red': 45,
            'blink_burst_threshold': 1.5,
            'gaze_jitter_threshold': 0.7,
            'au4_threshold': 2.0,
            'au17_threshold': 1.5,
            'arm_slot_drift_threshold': 3.0,
            'release_drift_threshold': 2.0,
            'breakdown_risk_threshold': 0.6
        }
    
    def get_coach_timeline(self, 
                          window_seconds: int = 60) -> List[Dict[str, Any]]:
        """Get coach-ready timeline with pressure indicators"""
        
        if not self.integrated_timeline:
            return []
        
        # Get recent timeline data
        current_time = self.integrated_timeline[-1].timestamp
        cutoff_time = current_time - window_seconds
        
        recent_frames = [f for f in self.integrated_timeline if f.timestamp >= cutoff_time]
        
        timeline = []
        for frame in recent_frames:
            timeline_entry = {
                'timestamp': frame.timestamp,
                'grit_index': round(frame.grit_index, 1),
                'pressure_level': frame.pressure_level.value,
                'breakdown_risk': round(frame.breakdown_risk, 2),
                'stress_indicators': frame.primary_stress_indicators,
                'recovery_trend': frame.recovery_trajectory,
                'coach_alert': frame.coach_alert_reason,
                'color': self._get_timeline_color(frame.pressure_level),
                'explanation': self._generate_timeline_explanation(frame)
            }
            timeline.append(timeline_entry)
        
        return timeline
    
    def _get_timeline_color(self, pressure_level: PressureLevel) -> str:
        """Get color code for timeline visualization"""
        color_map = {
            PressureLevel.GREEN: "#00FF00",
            PressureLevel.YELLOW: "#FFFF00", 
            PressureLevel.RED: "#FF0000"
        }
        return color_map[pressure_level]
    
    def _generate_timeline_explanation(self, frame: TellDetectorFrame) -> str:
        """Generate human-readable explanation for timeline entry"""
        
        if frame.pressure_level == PressureLevel.GREEN:
            return "Optimal focus and mechanics"
        elif frame.pressure_level == PressureLevel.YELLOW:
            indicators = ", ".join(frame.primary_stress_indicators)
            return f"Building pressure: {indicators}"
        else:  # RED
            indicators = " + ".join(frame.primary_stress_indicators[:2])
            return f"High stress: {indicators} → {frame.breakdown_risk:.0%} breakdown risk"


class FacialSignalProcessor:
    """Processes facial micro-expressions and behavioral signals"""
    
    def __init__(self):
        # Initialize MediaPipe Face Landmarker (would use actual MediaPipe in production)
        self.face_detector = None  # MediaPipe Face Landmarker
        self.au_extractor = None   # OpenFace/Py-Feat AU extractor
        
        # Tracking history for temporal analysis
        self.blink_history = deque(maxlen=300)  # 5 seconds at 60fps
        self.gaze_history = deque(maxlen=300)
        self.head_pose_history = deque(maxlen=300)
        
        logger.info("👁️ Facial signal processor initialized")
    
    def process_frame(self, frame: np.ndarray, timestamp: float) -> FacialMicroSignals:
        """Process single frame for facial micro-signals"""
        
        # In production, would use actual MediaPipe + OpenFace
        # For now, simulate realistic micro-expression data
        
        # Simulate AU detection (would come from OpenFace/Py-Feat)
        au_intensities = self._simulate_au_detection(frame)
        
        # Simulate gaze and blink detection
        gaze_stability = self._simulate_gaze_detection(frame)
        blink_metrics = self._simulate_blink_detection(frame, timestamp)
        
        # Simulate head pose micro-movements
        head_metrics = self._simulate_head_pose_detection(frame)
        
        return FacialMicroSignals(
            au4_brow_lowerer=au_intensities['au4'],
            au5_upper_lid_raiser=au_intensities['au5'],
            au7_lid_tightener=au_intensities['au7'],
            au9_nose_wrinkler=au_intensities['au9'],
            au10_upper_lip_raiser=au_intensities['au10'],
            au14_dimpler=au_intensities['au14'],
            au17_chin_raiser=au_intensities['au17'],
            au23_lip_tightener=au_intensities['au23'],
            au24_lip_pressor=au_intensities['au24'],
            gaze_stability=gaze_stability,
            blink_rate=blink_metrics['rate'],
            blink_burst_intensity=blink_metrics['burst_intensity'],
            head_pitch_jitter=head_metrics['pitch_jitter'],
            head_roll_jitter=head_metrics['roll_jitter'],
            head_yaw_stability=head_metrics['yaw_stability'],
            recovery_cadence=0.0,  # Calculated elsewhere
            baseline_deviation=0.0  # Calculated elsewhere
        )
    
    def _simulate_au_detection(self, frame: np.ndarray) -> Dict[str, float]:
        """Simulate Action Unit detection (would use OpenFace/Py-Feat)"""
        
        # Simulate realistic AU intensities with some stress indicators
        base_stress = np.random.uniform(0.0, 0.5)  # Base stress level
        stress_spike = np.random.uniform(0.0, 1.0) if np.random.random() < 0.1 else 0.0
        
        return {
            'au4': base_stress * 2.0 + stress_spike * 3.0,  # Brow lowerer (concentration)
            'au5': np.random.uniform(0.0, 1.0),             # Upper lid raiser
            'au7': base_stress * 1.5 + np.random.uniform(0.0, 0.5),  # Lid tightener
            'au9': np.random.uniform(0.0, 1.0),             # Nose wrinkler
            'au10': np.random.uniform(0.0, 0.8),            # Upper lip raiser
            'au14': np.random.uniform(0.0, 1.2),            # Dimpler
            'au17': base_stress * 1.8 + stress_spike * 2.0,  # Chin raiser (jaw tension)
            'au23': base_stress * 1.3,                       # Lip tightener
            'au24': base_stress * 1.1                        # Lip pressor
        }
    
    def _simulate_gaze_detection(self, frame: np.ndarray) -> float:
        """Simulate gaze stability detection"""
        # Simulate gaze vector variance (lower = more stable)
        base_stability = np.random.uniform(0.7, 0.95)
        stress_impact = max(0.0, np.random.normal(0.0, 0.15))  # Stress reduces stability
        
        return max(0.0, min(1.0, base_stability - stress_impact))
    
    def _simulate_blink_detection(self, frame: np.ndarray, timestamp: float) -> Dict[str, float]:
        """Simulate blink pattern detection"""
        
        # Normal blink rate: 12-20 blinks per minute
        base_rate = np.random.uniform(12.0, 20.0)
        
        # Simulate stress-induced blink bursts
        is_burst = np.random.random() < 0.05  # 5% chance of burst
        burst_intensity = np.random.uniform(2.0, 4.0) if is_burst else 1.0
        
        current_rate = base_rate * burst_intensity
        
        # Track blink history for burst detection
        self.blink_history.append({
            'timestamp': timestamp,
            'rate': current_rate,
            'is_burst': is_burst
        })
        
        return {
            'rate': current_rate,
            'burst_intensity': burst_intensity
        }
    
    def _simulate_head_pose_detection(self, frame: np.ndarray) -> Dict[str, float]:
        """Simulate head pose micro-movement detection"""
        
        # Simulate micro-tremor in head movements
        pitch_jitter = abs(np.random.normal(0.0, 0.5))  # Higher = more jitter
        roll_jitter = abs(np.random.normal(0.0, 0.3))
        yaw_stability = np.random.uniform(0.8, 0.98)    # Yaw consistency
        
        # Add to history
        self.head_pose_history.append({
            'pitch_jitter': pitch_jitter,
            'roll_jitter': roll_jitter,
            'yaw_stability': yaw_stability
        })
        
        return {
            'pitch_jitter': pitch_jitter,
            'roll_jitter': roll_jitter,
            'yaw_stability': yaw_stability
        }


class BiomechanicsProcessor:
    """Processes biomechanics stability and consistency"""
    
    def __init__(self):
        # Initialize MediaPipe Pose (would use actual MediaPipe in production)
        self.pose_detector = None  # MediaPipe Pose Landmarker
        
        # Baseline tracking
        self.mechanics_history = deque(maxlen=300)  # 5 seconds at 60fps
        self.baseline_arm_slot = None
        self.baseline_release_height = None
        
        logger.info("🏃 Biomechanics processor initialized")
    
    def process_frame(self, frame: np.ndarray, timestamp: float) -> BiomechanicsStability:
        """Process single frame for biomechanics stability"""
        
        # In production, would use actual MediaPipe Pose + kinematic calculations
        # For now, simulate realistic biomechanics data
        
        mechanics_data = self._simulate_pose_analysis(frame)
        
        # Calculate stability metrics
        arm_slot_drift = self._calculate_arm_slot_drift(mechanics_data)
        release_height_drift = self._calculate_release_height_drift(mechanics_data)
        tempo_variance = self._calculate_tempo_variance()
        
        return BiomechanicsStability(
            arm_slot_drift=arm_slot_drift,
            shoulder_fly_open=mechanics_data['shoulder_timing'],
            stride_consistency=mechanics_data['stride_consistency'],
            release_height_drift=release_height_drift,
            tempo_variance=tempo_variance,
            kinetic_sequence_stability=mechanics_data['kinetic_sequence'],
            balance_stability=mechanics_data['balance'],
            posture_alignment=mechanics_data['posture'],
            power_consistency=mechanics_data['power_consistency'],
            mechanical_efficiency=mechanics_data['efficiency']
        )
    
    def _simulate_pose_analysis(self, frame: np.ndarray) -> Dict[str, float]:
        """Simulate pose analysis (would use MediaPipe + kinematics)"""
        
        # Simulate mechanical consistency with some variance
        consistency_factor = np.random.uniform(0.8, 0.98)
        
        return {
            'arm_slot_angle': np.random.uniform(85.0, 95.0),  # Degrees
            'release_height': np.random.uniform(6.0, 6.5),    # Feet
            'shoulder_timing': np.random.uniform(0.8, 1.5),   # Timing factor
            'stride_consistency': consistency_factor,
            'kinetic_sequence': consistency_factor * np.random.uniform(0.9, 1.1),
            'balance': np.random.uniform(0.8, 0.95),
            'posture': np.random.uniform(0.85, 0.98),
            'power_consistency': consistency_factor * np.random.uniform(0.85, 1.0),
            'efficiency': np.random.uniform(0.8, 0.95)
        }
    
    def _calculate_arm_slot_drift(self, mechanics: Dict[str, float]) -> float:
        """Calculate arm slot drift from baseline"""
        
        current_arm_slot = mechanics['arm_slot_angle']
        
        if self.baseline_arm_slot is None:
            self.baseline_arm_slot = current_arm_slot
            return 0.0
        
        drift = abs(current_arm_slot - self.baseline_arm_slot)
        
        # Update baseline slowly
        self.baseline_arm_slot = self.baseline_arm_slot * 0.99 + current_arm_slot * 0.01
        
        return drift
    
    def _calculate_release_height_drift(self, mechanics: Dict[str, float]) -> float:
        """Calculate release height drift from baseline"""
        
        current_height = mechanics['release_height']
        
        if self.baseline_release_height is None:
            self.baseline_release_height = current_height
            return 0.0
        
        drift = abs(current_height - self.baseline_release_height) * 12  # Convert to inches
        
        # Update baseline slowly
        self.baseline_release_height = self.baseline_release_height * 0.99 + current_height * 0.01
        
        return drift
    
    def _calculate_tempo_variance(self) -> float:
        """Calculate tempo variance from recent mechanics"""
        
        if len(self.mechanics_history) < 10:
            return 1.0  # Default neutral variance
        
        # Simulate tempo variance calculation
        return np.random.uniform(0.8, 1.4)


class PhysiologyProcessor:
    """Processes physiological stress signals (experimental)"""
    
    def __init__(self):
        self.rppg_processor = None  # Would use rPPG-Toolbox
        self.evm_processor = None   # Would use Eulerian Video Magnification
        
        logger.info("❤️ Physiology processor initialized (experimental)")
    
    def process_frame(self, frame: np.ndarray, timestamp: float) -> PhysiologySignals:
        """Process physiological signals (experimental feature)"""
        
        # In production, would use rPPG-Toolbox for heart rate variability
        # For now, return None values (experimental)
        
        return PhysiologySignals(
            heart_rate_variability=None,
            respiratory_rate=None,
            skin_conductance=None,
            autonomic_balance=None
        )


class ContextProcessor:
    """Processes situational context for pressure assessment"""
    
    def __init__(self):
        logger.info("⚾ Context processor initialized")
    
    def process_context(self, context_data: Dict[str, Any]) -> ContextualFactors:
        """Process contextual pressure factors"""
        
        # Calculate Leverage Index and other pressure factors
        leverage_index = context_data.get('leverage_index', 1.0)
        inning = context_data.get('inning', 5)
        balls = context_data.get('balls', 1)
        strikes = context_data.get('strikes', 1)
        runners = context_data.get('runners_on_base', 0)
        score_diff = context_data.get('score_differential', 0)
        
        # Calculate pressure multipliers
        inning_pressure = self._calculate_inning_pressure(inning)
        count_pressure = self._calculate_count_pressure(balls, strikes)
        runner_pressure = self._calculate_runner_pressure(runners)
        
        return ContextualFactors(
            leverage_index=leverage_index,
            inning_pressure=inning_pressure,
            count_pressure=count_pressure,
            runner_pressure=runner_pressure,
            score_differential=abs(score_diff),
            time_pressure=context_data.get('time_pressure', 1.0)
        )
    
    def _calculate_inning_pressure(self, inning: int) -> float:
        """Calculate inning-based pressure multiplier"""
        if inning <= 3:
            return 0.8
        elif inning <= 6:
            return 1.0
        elif inning <= 8:
            return 1.3
        else:  # 9th inning or extra
            return 1.8
    
    def _calculate_count_pressure(self, balls: int, strikes: int) -> float:
        """Calculate count-based pressure multiplier"""
        count_pressure_map = {
            (0, 0): 1.0,
            (1, 0): 1.1,
            (2, 0): 1.3,
            (3, 0): 1.6,
            (0, 1): 0.9,
            (1, 1): 1.0,
            (2, 1): 1.2,
            (3, 1): 1.5,
            (0, 2): 0.7,
            (1, 2): 0.8,
            (2, 2): 1.0,
            (3, 2): 1.8  # Full count
        }
        return count_pressure_map.get((balls, strikes), 1.0)
    
    def _calculate_runner_pressure(self, runners_on_base: int) -> float:
        """Calculate runner-based pressure multiplier"""
        runner_multipliers = {
            0: 1.0,   # Bases empty
            1: 1.2,   # Runner on base
            2: 1.4,   # Two runners
            3: 1.7    # Bases loaded
        }
        return runner_multipliers.get(runners_on_base, 1.0)


class GritIndexCalculator:
    """Calculates composite Grit Index from all signal sources"""
    
    def __init__(self):
        # Grit Index weights based on research and domain expertise
        self.weights = {
            # Facial micro-expression weights
            'blink_burst': 8.0,      # Strong predictor of stress
            'gaze_jitter': 7.0,      # Attention/focus breakdown
            'head_jitter': 6.0,      # Micro-tremor under pressure
            'au_tension': 5.0,       # Facial tension (AU4, AU17)
            'recovery_score': 4.0,   # Recovery from stress events
            
            # Biomechanics weights
            'mechanics_variance': 9.0,  # Most predictive for performance
            'arm_slot_drift': 8.0,      # Critical for command
            'tempo_change': 6.0,        # Rhythm disruption
            'release_drift': 7.0,       # Consistency indicator
            
            # Context weights
            'leverage_multiplier': 3.0,  # Situational pressure
            'fatigue_factor': 2.0       # Time-based decline
        }
        
        logger.info("🧮 Grit Index calculator initialized")
    
    def calculate_grit_index(self,
                           facial_signals: FacialMicroSignals,
                           mechanics_stability: BiomechanicsStability,
                           physiology: PhysiologySignals,
                           context: ContextualFactors,
                           baseline_face: Optional[FacialMicroSignals] = None,
                           baseline_mechanics: Optional[BiomechanicsStability] = None) -> float:
        """Calculate composite Grit Index (0-100 scale)"""
        
        # Start with perfect score
        grit_score = 100.0
        
        # Facial signal penalties
        grit_score -= self.weights['blink_burst'] * max(0, facial_signals.blink_burst_intensity - 1.0)
        grit_score -= self.weights['gaze_jitter'] * max(0, 1.0 - facial_signals.gaze_stability)
        grit_score -= self.weights['head_jitter'] * facial_signals.head_pitch_jitter
        
        # AU tension penalty (combination of stress AUs)
        au_tension = (facial_signals.au4_brow_lowerer + facial_signals.au17_chin_raiser) / 2.0
        grit_score -= self.weights['au_tension'] * au_tension
        
        # Biomechanics penalties
        grit_score -= self.weights['mechanics_variance'] * (
            mechanics_stability.tempo_variance * 0.4 +
            (1.0 - mechanics_stability.stride_consistency) * 0.3 +
            (1.0 - mechanics_stability.kinetic_sequence_stability) * 0.3
        )
        
        grit_score -= self.weights['arm_slot_drift'] * (mechanics_stability.arm_slot_drift / 10.0)  # Scale degrees
        grit_score -= self.weights['release_drift'] * (mechanics_stability.release_height_drift / 5.0)  # Scale inches
        grit_score -= self.weights['tempo_change'] * abs(mechanics_stability.tempo_variance - 1.0)
        
        # Context pressure multiplier
        context_multiplier = (
            context.leverage_index * 0.4 +
            context.inning_pressure * 0.3 +
            context.count_pressure * 0.2 +
            context.runner_pressure * 0.1
        ) / 4.0
        
        # Apply context pressure (higher pressure = lower grit resilience)
        context_penalty = self.weights['leverage_multiplier'] * (context_multiplier - 1.0)
        grit_score -= max(0, context_penalty)
        
        # Recovery bonus (if showing recovery from previous stress)
        if baseline_face and facial_signals.recovery_cadence > 0:
            recovery_bonus = self.weights['recovery_score'] * (facial_signals.recovery_cadence / 10.0)
            grit_score += recovery_bonus
        
        # Clamp to valid range
        grit_score = max(0.0, min(100.0, grit_score))
        
        return grit_score


# Demo and testing
def main():
    """Demo the Tell Detector system"""
    
    logger.info("🎯 Starting Blaze Tell Detector Demo")
    logger.info("=" * 60)
    
    # Initialize tell detector
    detector = TellDetectorEngine(face_fps=120, body_fps=60, baseline_window_seconds=15)
    
    # Simulate dual-stream video processing
    logger.info("📹 Simulating dual-stream capture:")
    logger.info("   👁️ Face camera: 120fps close-up")
    logger.info("   🏃 Body camera: 60fps mechanics view")
    
    # Process frames for 30 seconds
    num_frames = 60  # Simulate 1 second of data
    timeline_data = []
    
    for i in range(num_frames):
        timestamp = time.time() + i * (1.0 / 60.0)  # 60fps simulation
        
        # Simulate frames (would be actual camera input)
        face_frame = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
        body_frame = np.random.randint(0, 255, (1080, 1920, 3), dtype=np.uint8)
        
        # Simulate context (would come from game situation)
        context_data = {
            'leverage_index': np.random.uniform(0.8, 2.5),
            'inning': np.random.randint(1, 10),
            'balls': np.random.randint(0, 4),
            'strikes': np.random.randint(0, 3),
            'runners_on_base': np.random.randint(0, 4)
        }
        
        # Process frame
        result_frame = detector.process_dual_frame(face_frame, body_frame, timestamp, context_data)
        
        # Log significant events
        if result_frame.coach_alert_reason:
            logger.info(f"🚨 Frame {i}: {result_frame.coach_alert_reason}")
        elif result_frame.pressure_level != PressureLevel.GREEN:
            indicators = ", ".join(result_frame.primary_stress_indicators)
            logger.info(f"⚠️  Frame {i}: {result_frame.pressure_level.value} - {indicators}")
    
    # Get coach timeline
    timeline = detector.get_coach_timeline(window_seconds=60)
    
    logger.info("\n📊 TELL DETECTOR RESULTS:")
    logger.info("=" * 40)
    
    # Analyze timeline results
    green_frames = len([t for t in timeline if t['pressure_level'] == 'focus'])
    yellow_frames = len([t for t in timeline if t['pressure_level'] == 'building'])  
    red_frames = len([t for t in timeline if t['pressure_level'] == 'breakdown_risk'])
    
    avg_grit = statistics.mean([t['grit_index'] for t in timeline]) if timeline else 0
    max_risk = max([t['breakdown_risk'] for t in timeline]) if timeline else 0
    
    logger.info(f"🎯 Average Grit Index: {avg_grit:.1f}/100")
    logger.info(f"📈 Pressure Distribution:")
    logger.info(f"   🟢 Green (Focus): {green_frames} frames ({green_frames/len(timeline)*100:.1f}%)")
    logger.info(f"   🟡 Yellow (Building): {yellow_frames} frames ({yellow_frames/len(timeline)*100:.1f}%)")
    logger.info(f"   🔴 Red (Risk): {red_frames} frames ({red_frames/len(timeline)*100:.1f}%)")
    logger.info(f"⚠️  Peak Breakdown Risk: {max_risk:.1%}")
    
    # Show sample coach alerts
    alerts = [t for t in timeline if t.get('coach_alert')]
    logger.info(f"🚨 Coach Alerts Generated: {len(alerts)}")
    
    for alert in alerts[:3]:  # Show first 3 alerts
        logger.info(f"   • {alert['coach_alert']}")
    
    # Save demo results
    output_dir = Path('public/data/tell_detector')
    output_dir.mkdir(parents=True, exist_ok=True)
    
    demo_results = {
        'demo_timestamp': datetime.now().isoformat(),
        'session_summary': {
            'total_frames': len(timeline),
            'average_grit_index': avg_grit,
            'peak_breakdown_risk': max_risk,
            'pressure_distribution': {
                'green_percent': green_frames/len(timeline)*100 if timeline else 0,
                'yellow_percent': yellow_frames/len(timeline)*100 if timeline else 0,
                'red_percent': red_frames/len(timeline)*100 if timeline else 0
            }
        },
        'timeline_sample': timeline[:10],  # First 10 frames
        'coach_alerts': alerts,
        'key_features': [
            'Dual-signal fusion (facial micro-expressions + biomechanics)',
            'Real-time Grit Index calculation',
            'Coach-ready timeline with pressure indicators',
            'Objective stress detection using Action Units',
            'Biomechanics stability monitoring',
            'Contextual pressure assessment (Leverage Index)'
        ]
    }
    
    with open(output_dir / 'tell_detector_demo.json', 'w') as f:
        json.dump(demo_results, f, indent=2, ensure_ascii=False)
    
    logger.info(f"📋 Demo results saved: {output_dir / 'tell_detector_demo.json'}")
    logger.info("=" * 60)
    logger.info("🏆 TELL DETECTOR DEMO COMPLETE")
    logger.info("   Ready for championship-level pressure detection!")


if __name__ == '__main__':
    main()