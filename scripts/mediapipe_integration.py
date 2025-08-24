#!/usr/bin/env python3
"""
Blaze Intelligence - MediaPipe Integration for Real-World Tell Detector
Integrates MediaPipe Face Landmarker and Pose detection for production deployment
"""

import asyncio
import cv2
import numpy as np
import json
import time
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, asdict
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import websockets
from pathlib import Path

# Import our core Tell Detector
from tell_detector_core import (
    TellDetectorEngine, FacialMicroSignals, BiomechanicsStability, 
    PhysiologySignals, ContextualFactors, TellDetectorFrame
)

@dataclass
class MediaPipeConfig:
    """Configuration for MediaPipe models"""
    face_model_path: str = "face_landmarker.task"
    pose_model_path: str = "pose_landmarker.task"
    face_confidence_threshold: float = 0.7
    pose_confidence_threshold: float = 0.7
    max_num_faces: int = 1
    max_num_poses: int = 1

@dataclass
class CameraConfig:
    """Camera and processing configuration"""
    width: int = 1920
    height: int = 1080
    fps: int = 240  # Target 240fps for micro-expression detection
    buffer_size: int = 30  # Frames to buffer for analysis
    roi_face: Tuple[float, float, float, float] = (0.2, 0.1, 0.6, 0.8)  # x, y, w, h ratios

class MediaPipeTellDetector:
    """Production MediaPipe integration for Tell Detector"""
    
    def __init__(self, camera_config: CameraConfig, mp_config: MediaPipeConfig):
        self.camera_config = camera_config
        self.mp_config = mp_config
        
        # Initialize Tell Detector core
        self.tell_detector = TellDetectorEngine()
        
        # MediaPipe components
        self.face_landmarker = None
        self.pose_landmarker = None
        
        # Processing buffers
        self.frame_buffer = []
        self.landmark_history = []
        self.frame_timestamps = []
        
        # Real-time metrics
        self.processing_fps = 0
        self.detection_confidence = 0.0
        self.last_frame_time = time.time()
        
        # WebSocket for real-time coaching
        self.websocket_clients = set()
        
        self.setup_mediapipe()
    
    def setup_mediapipe(self):
        """Initialize MediaPipe models"""
        try:
            # Face Landmarker setup
            face_options = vision.FaceLandmarkerOptions(
                base_options=python.BaseOptions(
                    model_asset_path=self.mp_config.face_model_path
                ),
                running_mode=vision.RunningMode.LIVE_STREAM,
                num_faces=self.mp_config.max_num_faces,
                min_face_detection_confidence=self.mp_config.face_confidence_threshold,
                min_face_presence_confidence=self.mp_config.face_confidence_threshold,
                result_callback=self._face_callback
            )
            self.face_landmarker = vision.FaceLandmarker.create_from_options(face_options)
            
            # Pose Landmarker setup
            pose_options = vision.PoseLandmarkerOptions(
                base_options=python.BaseOptions(
                    model_asset_path=self.mp_config.pose_model_path
                ),
                running_mode=vision.RunningMode.LIVE_STREAM,
                num_poses=self.mp_config.max_num_poses,
                min_pose_detection_confidence=self.mp_config.pose_confidence_threshold,
                min_pose_presence_confidence=self.mp_config.pose_confidence_threshold,
                result_callback=self._pose_callback
            )
            self.pose_landmarker = vision.PoseLandmarker.create_from_options(pose_options)
            
            print("✅ MediaPipe models initialized successfully")
            
        except Exception as e:
            print(f"❌ Failed to initialize MediaPipe: {e}")
            # Fallback to simulation mode
            self.face_landmarker = None
            self.pose_landmarker = None
    
    def _face_callback(self, result, output_image, timestamp_ms):
        """Callback for face landmarker results"""
        if result.face_landmarks:
            # Store landmarks with timestamp
            self.landmark_history.append({
                'timestamp': timestamp_ms,
                'face_landmarks': result.face_landmarks[0],
                'face_blendshapes': result.face_blendshapes[0] if result.face_blendshapes else None
            })
            
            # Keep only recent history (last 2 seconds at 240fps = 480 frames)
            self.landmark_history = self.landmark_history[-480:]
    
    def _pose_callback(self, result, output_image, timestamp_ms):
        """Callback for pose landmarker results"""
        if result.pose_landmarks:
            # Update latest pose data
            self.latest_pose = {
                'timestamp': timestamp_ms,
                'pose_landmarks': result.pose_landmarks[0],
                'pose_world_landmarks': result.pose_world_landmarks[0] if result.pose_world_landmarks else None
            }
    
    def extract_facial_signals(self, landmarks_sequence: List[Dict]) -> FacialMicroSignals:
        """Extract facial micro-signals from MediaPipe landmarks"""
        if not landmarks_sequence or len(landmarks_sequence) < 10:
            return self._default_facial_signals()
        
        try:
            # Action Units extraction from landmarks
            latest_landmarks = landmarks_sequence[-1]['face_landmarks']
            
            # AU4 (Brow Lowerer) - distance between inner brow points
            au4_intensity = self._calculate_brow_distance(latest_landmarks)
            
            # AU5 (Upper Lid Raiser) - eye aperture measurements
            au5_intensity = self._calculate_eye_aperture(latest_landmarks)
            
            # AU7 (Lid Tightener) - lower eyelid tension
            au7_intensity = self._calculate_lid_tightness(latest_landmarks)
            
            # AU17 (Chin Raiser) - jaw/chin movement
            au17_intensity = self._calculate_jaw_tension(latest_landmarks)
            
            # Blink analysis across sequence
            blink_rate, blink_burst = self._analyze_blink_patterns(landmarks_sequence)
            
            # Gaze stability
            gaze_jitter = self._calculate_gaze_jitter(landmarks_sequence)
            
            # Lip compression (AU23/AU24)
            lip_compression = self._calculate_lip_compression(latest_landmarks)
            
            return FacialMicroSignals(
                au4_intensity=au4_intensity,
                au5_intensity=au5_intensity,
                au7_intensity=au7_intensity,
                au9_intensity=0.0,  # Nose wrinkler - requires more complex calculation
                au10_intensity=lip_compression * 0.5,  # Upper lip raiser approximation
                au14_intensity=0.0,  # Dimpler - complex landmark relationship
                au17_intensity=au17_intensity,
                au23_intensity=lip_compression,
                au24_intensity=lip_compression * 0.8,
                blink_rate_deviation=max(0, blink_rate - 15) / 10,  # Normal ~15 blinks/min
                blink_burst_intensity=blink_burst,
                gaze_stability_score=max(0, 1.0 - gaze_jitter),
                micro_expression_count=self._count_micro_expressions(landmarks_sequence),
                baseline_deviation=self._calculate_baseline_deviation(landmarks_sequence)
            )
            
        except Exception as e:
            print(f"⚠️ Error extracting facial signals: {e}")
            return self._default_facial_signals()
    
    def _calculate_brow_distance(self, landmarks) -> float:
        """Calculate AU4 intensity from brow landmark distances"""
        try:
            # Inner brow points (landmarks 70, 63 for left/right inner brow)
            left_brow = landmarks[70]
            right_brow = landmarks[63]
            center_forehead = landmarks[9]  # Forehead center
            
            # Distance between brows normalized by face height
            brow_distance = abs(left_brow.x - right_brow.x)
            forehead_height = abs(center_forehead.y - left_brow.y)
            
            normalized_distance = brow_distance / max(forehead_height, 0.01)
            
            # Convert to AU4 intensity (0-10 scale)
            return min(10.0, max(0.0, (0.15 - normalized_distance) * 50))
            
        except Exception:
            return 0.0
    
    def _calculate_eye_aperture(self, landmarks) -> float:
        """Calculate AU5 intensity from eye aperture"""
        try:
            # Left eye landmarks (approximate)
            left_eye_top = landmarks[159]
            left_eye_bottom = landmarks[145]
            left_eye_left = landmarks[33]
            left_eye_right = landmarks[133]
            
            # Eye aperture calculation
            eye_height = abs(left_eye_top.y - left_eye_bottom.y)
            eye_width = abs(left_eye_left.x - left_eye_right.x)
            
            aperture_ratio = eye_height / max(eye_width, 0.01)
            
            # AU5 increases with wider eyes
            return min(10.0, max(0.0, (aperture_ratio - 0.2) * 20))
            
        except Exception:
            return 0.0
    
    def _calculate_lid_tightness(self, landmarks) -> float:
        """Calculate AU7 intensity from eyelid tightness"""
        try:
            # Lower eyelid landmarks
            left_lower = landmarks[145]
            right_lower = landmarks[374]
            
            # Calculate tightness based on lower lid position
            # This is a simplified approximation
            lid_position = (left_lower.y + right_lower.y) / 2
            
            # AU7 intensity based on lid elevation
            return min(10.0, max(0.0, (0.6 - lid_position) * 15))
            
        except Exception:
            return 0.0
    
    def _calculate_jaw_tension(self, landmarks) -> float:
        """Calculate AU17 intensity from jaw/chin landmarks"""
        try:
            # Chin/jaw landmarks
            chin_tip = landmarks[175]
            jaw_left = landmarks[172]
            jaw_right = landmarks[397]
            
            # Jaw width and chin position
            jaw_width = abs(jaw_left.x - jaw_right.x)
            chin_y = chin_tip.y
            
            # AU17 relates to chin raising/jaw tension
            jaw_tension = (0.9 - chin_y) * jaw_width * 10
            
            return min(10.0, max(0.0, jaw_tension))
            
        except Exception:
            return 0.0
    
    def _analyze_blink_patterns(self, landmarks_sequence: List[Dict]) -> Tuple[float, float]:
        """Analyze blinking patterns for rate and burst intensity"""
        if len(landmarks_sequence) < 30:
            return 15.0, 0.0  # Default normal blink rate
        
        try:
            blink_events = []
            
            for i, frame_data in enumerate(landmarks_sequence[-60:]):  # Last 60 frames
                landmarks = frame_data['face_landmarks']
                
                # Simplified blink detection - eye aperture below threshold
                left_eye_top = landmarks[159]
                left_eye_bottom = landmarks[145]
                eye_aperture = abs(left_eye_top.y - left_eye_bottom.y)
                
                if eye_aperture < 0.01:  # Threshold for closed eye
                    blink_events.append(i)
            
            # Calculate blink rate (blinks per minute)
            time_span_minutes = len(landmarks_sequence[-60:]) / (240 * 60)  # 240fps
            blink_rate = len(blink_events) / max(time_span_minutes, 0.01)
            
            # Calculate burst intensity (clusters of blinks)
            burst_intensity = 0.0
            if len(blink_events) > 1:
                gaps = [blink_events[i+1] - blink_events[i] for i in range(len(blink_events)-1)]
                short_gaps = [g for g in gaps if g < 10]  # Blinks within 10 frames
                burst_intensity = len(short_gaps) / max(len(gaps), 1)
            
            return blink_rate, burst_intensity
            
        except Exception:
            return 15.0, 0.0
    
    def _calculate_gaze_jitter(self, landmarks_sequence: List[Dict]) -> float:
        """Calculate gaze stability/jitter from pupil position"""
        if len(landmarks_sequence) < 10:
            return 0.0
        
        try:
            pupil_positions = []
            
            for frame_data in landmarks_sequence[-30:]:
                landmarks = frame_data['face_landmarks']
                
                # Approximate pupil position from eye landmarks
                left_eye_center_x = (landmarks[33].x + landmarks[133].x) / 2
                left_eye_center_y = (landmarks[159].y + landmarks[145].y) / 2
                
                pupil_positions.append((left_eye_center_x, left_eye_center_y))
            
            # Calculate jitter as standard deviation of positions
            if len(pupil_positions) > 1:
                x_positions = [p[0] for p in pupil_positions]
                y_positions = [p[1] for p in pupil_positions]
                
                x_jitter = np.std(x_positions)
                y_jitter = np.std(y_positions)
                
                total_jitter = (x_jitter + y_jitter) * 1000  # Scale up
                return min(10.0, total_jitter)
            
            return 0.0
            
        except Exception:
            return 0.0
    
    def _calculate_lip_compression(self, landmarks) -> float:
        """Calculate lip compression intensity"""
        try:
            # Lip landmarks
            upper_lip = landmarks[13]
            lower_lip = landmarks[14]
            lip_left = landmarks[61]
            lip_right = landmarks[291]
            
            # Lip compression based on vertical distance
            lip_height = abs(upper_lip.y - lower_lip.y)
            lip_width = abs(lip_left.x - lip_right.x)
            
            compression_ratio = lip_height / max(lip_width, 0.01)
            
            # AU23/AU24 intensity
            return min(10.0, max(0.0, (0.05 - compression_ratio) * 100))
            
        except Exception:
            return 0.0
    
    def _count_micro_expressions(self, landmarks_sequence: List[Dict]) -> int:
        """Count micro-expressions in the sequence"""
        # Simplified implementation - detect rapid AU changes
        if len(landmarks_sequence) < 20:
            return 0
        
        try:
            micro_count = 0
            
            for i in range(10, len(landmarks_sequence) - 10):
                # Compare AU intensities across frames
                current_frame = landmarks_sequence[i]['face_landmarks']
                prev_frame = landmarks_sequence[i-5]['face_landmarks']
                next_frame = landmarks_sequence[i+5]['face_landmarks']
                
                # Simplified micro-expression detection
                current_intensity = self._calculate_jaw_tension(current_frame)
                prev_intensity = self._calculate_jaw_tension(prev_frame)
                next_intensity = self._calculate_jaw_tension(next_frame)
                
                # Detect brief spike
                if (current_intensity > prev_intensity + 2.0 and 
                    current_intensity > next_intensity + 2.0):
                    micro_count += 1
            
            return micro_count
            
        except Exception:
            return 0
    
    def _calculate_baseline_deviation(self, landmarks_sequence: List[Dict]) -> float:
        """Calculate deviation from baseline facial state"""
        if len(landmarks_sequence) < 60:  # Need sufficient history
            return 0.0
        
        try:
            # Calculate average AU intensities over sequence
            recent_frames = landmarks_sequence[-30:]  # Last 30 frames
            baseline_frames = landmarks_sequence[-60:-30]  # Previous 30 frames
            
            recent_avg = np.mean([self._calculate_jaw_tension(f['face_landmarks']) for f in recent_frames])
            baseline_avg = np.mean([self._calculate_jaw_tension(f['face_landmarks']) for f in baseline_frames])
            
            deviation = abs(recent_avg - baseline_avg) / max(baseline_avg, 1.0)
            
            return min(10.0, deviation * 5)
            
        except Exception:
            return 0.0
    
    def _default_facial_signals(self) -> FacialMicroSignals:
        """Return default facial signals when detection fails"""
        return FacialMicroSignals(
            au4_intensity=0.0, au5_intensity=0.0, au7_intensity=0.0,
            au9_intensity=0.0, au10_intensity=0.0, au14_intensity=0.0,
            au17_intensity=0.0, au23_intensity=0.0, au24_intensity=0.0,
            blink_rate_deviation=0.0, blink_burst_intensity=0.0,
            gaze_stability_score=1.0, micro_expression_count=0,
            baseline_deviation=0.0
        )
    
    def extract_biomechanics_stability(self, pose_data: Optional[Dict]) -> BiomechanicsStability:
        """Extract biomechanics stability from MediaPipe pose data"""
        if not pose_data:
            return self._default_biomechanics()
        
        try:
            landmarks = pose_data['pose_landmarks']
            
            # Key joint positions for baseball pitching
            left_shoulder = landmarks[11]
            right_shoulder = landmarks[12]
            left_hip = landmarks[23]
            right_hip = landmarks[24]
            left_wrist = landmarks[15]
            right_wrist = landmarks[16]
            left_ankle = landmarks[27]
            right_ankle = landmarks[28]
            
            # Calculate biomechanics metrics
            
            # 1. Hip-shoulder separation
            hip_angle = np.arctan2(right_hip.y - left_hip.y, right_hip.x - left_hip.x)
            shoulder_angle = np.arctan2(right_shoulder.y - left_shoulder.y, right_shoulder.x - left_shoulder.x)
            separation_angle = abs(hip_angle - shoulder_angle) * 180 / np.pi
            separation_score = min(10.0, separation_angle / 5.0)  # Normalize to 0-10
            
            # 2. Balance stability
            center_of_mass_x = (left_hip.x + right_hip.x) / 2
            foot_center_x = (left_ankle.x + right_ankle.x) / 2
            balance_offset = abs(center_of_mass_x - foot_center_x)
            balance_score = max(0.0, 10.0 - balance_offset * 50)
            
            # 3. Arm slot consistency
            throwing_arm_angle = np.arctan2(right_wrist.y - right_shoulder.y, 
                                          right_wrist.x - right_shoulder.x) * 180 / np.pi
            arm_slot_score = max(0.0, 10.0 - abs(throwing_arm_angle - 45) / 5)  # Target ~45° slot
            
            # 4. Posture alignment
            spine_angle = np.arctan2((left_shoulder.y + right_shoulder.y) / 2 - (left_hip.y + right_hip.y) / 2,
                                   (left_shoulder.x + right_shoulder.x) / 2 - (left_hip.x + right_hip.x) / 2)
            posture_score = max(0.0, 10.0 - abs(spine_angle) * 20)
            
            # 5. Overall stability index
            stability_index = (separation_score + balance_score + arm_slot_score + posture_score) / 4
            
            return BiomechanicsStability(
                hip_shoulder_separation=separation_score,
                balance_deviation=10.0 - balance_score,  # Higher deviation = less stable
                arm_slot_consistency=arm_slot_score,
                posture_alignment=posture_score,
                kinetic_chain_efficiency=stability_index,
                movement_compensation=max(0.0, (10.0 - stability_index) / 2),
                fatigue_indicators=self._calculate_fatigue_from_pose(landmarks),
                injury_risk_score=max(0.0, 5.0 - stability_index / 2)
            )
            
        except Exception as e:
            print(f"⚠️ Error extracting biomechanics: {e}")
            return self._default_biomechanics()
    
    def _calculate_fatigue_from_pose(self, landmarks) -> float:
        """Calculate fatigue indicators from pose landmarks"""
        try:
            # Simplified fatigue detection - shoulder drop, posture change
            left_shoulder = landmarks[11]
            right_shoulder = landmarks[12]
            
            # Shoulder height difference (fatigue causes shoulder drop)
            shoulder_height_diff = abs(left_shoulder.y - right_shoulder.y)
            fatigue_score = min(10.0, shoulder_height_diff * 50)
            
            return fatigue_score
            
        except Exception:
            return 0.0
    
    def _default_biomechanics(self) -> BiomechanicsStability:
        """Return default biomechanics when detection fails"""
        return BiomechanicsStability(
            hip_shoulder_separation=5.0,
            balance_deviation=2.0,
            arm_slot_consistency=8.0,
            posture_alignment=7.0,
            kinetic_chain_efficiency=6.0,
            movement_compensation=3.0,
            fatigue_indicators=2.0,
            injury_risk_score=2.0
        )
    
    async def process_camera_stream(self, camera_index: int = 0):
        """Process live camera stream for real-time tell detection"""
        print(f"🎥 Starting camera stream on device {camera_index}")
        
        # Initialize camera
        cap = cv2.VideoCapture(camera_index)
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.camera_config.width)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.camera_config.height)
        cap.set(cv2.CAP_PROP_FPS, self.camera_config.fps)
        
        if not cap.isOpened():
            print("❌ Failed to open camera")
            return
        
        print(f"✅ Camera initialized: {cap.get(cv2.CAP_PROP_FRAME_WIDTH)}x{cap.get(cv2.CAP_PROP_FRAME_HEIGHT)} @ {cap.get(cv2.CAP_PROP_FPS)}fps")
        
        frame_count = 0
        fps_start_time = time.time()
        
        try:
            while True:
                ret, frame = cap.read()
                if not ret:
                    print("⚠️ Failed to read frame")
                    continue
                
                frame_count += 1
                current_time = time.time()
                timestamp_ms = int(current_time * 1000)
                
                # Calculate FPS
                if frame_count % 60 == 0:  # Update every 60 frames
                    elapsed = current_time - fps_start_time
                    self.processing_fps = 60 / elapsed if elapsed > 0 else 0
                    fps_start_time = current_time
                    print(f"📊 Processing FPS: {self.processing_fps:.1f}")
                
                # Convert BGR to RGB for MediaPipe
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
                
                # Process with MediaPipe if available
                if self.face_landmarker:
                    self.face_landmarker.detect_async(mp_image, timestamp_ms)
                
                if self.pose_landmarker:
                    self.pose_landmarker.detect_async(mp_image, timestamp_ms)
                
                # Process tell detection every 10 frames (24fps effective rate)
                if frame_count % 10 == 0:
                    await self.process_tell_detection(current_time)
                
                # Store frame timestamp
                self.frame_timestamps.append(current_time)
                self.frame_timestamps = self.frame_timestamps[-480:]  # Keep last 2 seconds
                
                # Break on 'q' key
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break
                    
        except KeyboardInterrupt:
            print("\n🛑 Stopping camera stream...")
        
        finally:
            cap.release()
            cv2.destroyAllWindows()
    
    async def process_tell_detection(self, timestamp: float):
        """Process tell detection with current data"""
        try:
            # Extract signals from recent data
            facial_signals = self.extract_facial_signals(self.landmark_history)
            biomechanics = self.extract_biomechanics_stability(
                getattr(self, 'latest_pose', None)
            )
            
            # Create physiology and context (simulated for now)
            physiology = PhysiologySignals(
                heart_rate_variability=np.random.normal(45, 10),
                skin_conductance=np.random.normal(2.5, 0.5),
                respiration_rate=np.random.normal(16, 2),
                core_temperature=98.6 + np.random.normal(0, 0.2)
            )
            
            context = ContextualFactors(
                game_leverage_index=2.1,  # High leverage situation
                fatigue_level=0.3,
                crowd_noise_db=85.0,
                weather_pressure=1013.25,
                time_pressure=0.7
            )
            
            # Process through Tell Detector
            tell_frame = self.tell_detector.process_frame(
                facial_signals, biomechanics, physiology, context, timestamp
            )
            
            # Send to coaching interface via WebSocket
            await self.broadcast_tell_frame(tell_frame)
            
        except Exception as e:
            print(f"⚠️ Error in tell detection: {e}")
    
    async def broadcast_tell_frame(self, tell_frame: TellDetectorFrame):
        """Broadcast tell frame to connected WebSocket clients"""
        if not self.websocket_clients:
            return
        
        try:
            # Convert to JSON-serializable format
            frame_data = {
                'timestamp': tell_frame.timestamp,
                'grit_index': tell_frame.grit_index,
                'pressure_level': tell_frame.pressure_level,
                'explanation': tell_frame.explanation,
                'facial_signals': asdict(tell_frame.facial_signals),
                'biomechanics': asdict(tell_frame.biomechanics_stability),
                'context': asdict(tell_frame.contextual_factors),
                'coaching_cue': tell_frame.coaching_cue
            }
            
            message = json.dumps(frame_data)
            
            # Broadcast to all connected clients
            disconnected_clients = set()
            for websocket in self.websocket_clients:
                try:
                    await websocket.send(message)
                except websockets.exceptions.ConnectionClosed:
                    disconnected_clients.add(websocket)
            
            # Remove disconnected clients
            self.websocket_clients -= disconnected_clients
            
        except Exception as e:
            print(f"⚠️ Error broadcasting tell frame: {e}")
    
    async def websocket_handler(self, websocket, path):
        """Handle WebSocket connections from coaching interface"""
        print(f"🔗 New WebSocket connection: {websocket.remote_address}")
        self.websocket_clients.add(websocket)
        
        try:
            # Send initial status
            status = {
                'type': 'status',
                'processing_fps': self.processing_fps,
                'detection_confidence': self.detection_confidence,
                'active_connections': len(self.websocket_clients)
            }
            await websocket.send(json.dumps(status))
            
            # Keep connection alive
            async for message in websocket:
                # Handle incoming commands from coaching interface
                try:
                    data = json.loads(message)
                    await self.handle_coaching_command(data, websocket)
                except json.JSONDecodeError:
                    print(f"⚠️ Invalid JSON from client: {message}")
                    
        except websockets.exceptions.ConnectionClosed:
            pass
        finally:
            self.websocket_clients.discard(websocket)
            print(f"🔌 WebSocket disconnected: {websocket.remote_address}")
    
    async def handle_coaching_command(self, data: Dict, websocket):
        """Handle commands from coaching interface"""
        command = data.get('type')
        
        if command == 'start_recording':
            print("📹 Starting recording session...")
            # Implement recording logic
            
        elif command == 'stop_recording':
            print("⏹️ Stopping recording session...")
            # Implement stop logic
            
        elif command == 'adjust_sensitivity':
            sensitivity = data.get('value', 0.5)
            self.tell_detector.adjust_sensitivity(sensitivity)
            print(f"🎚️ Adjusted sensitivity to {sensitivity}")
            
        elif command == 'export_session':
            print("📤 Exporting session data...")
            # Implement export logic
            
        else:
            print(f"❓ Unknown command: {command}")

async def main():
    """Main execution function"""
    print("🚀 Blaze Intelligence - MediaPipe Tell Detector")
    print("=" * 60)
    
    # Configuration
    camera_config = CameraConfig(
        width=1920,
        height=1080, 
        fps=240,  # High framerate for micro-expressions
        buffer_size=60
    )
    
    mp_config = MediaPipeConfig(
        face_model_path="models/face_landmarker.task",
        pose_model_path="models/pose_landmarker.task",
        face_confidence_threshold=0.7,
        pose_confidence_threshold=0.7
    )
    
    # Initialize detector
    detector = MediaPipeTellDetector(camera_config, mp_config)
    
    # Start WebSocket server for coaching interface
    websocket_server = websockets.serve(
        detector.websocket_handler, 
        "localhost", 
        8765
    )
    
    print("🌐 WebSocket server starting on ws://localhost:8765")
    
    # Run both camera processing and WebSocket server
    await asyncio.gather(
        websocket_server,
        detector.process_camera_stream(camera_index=0)
    )

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n🛑 Shutdown complete")