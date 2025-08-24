#!/usr/bin/env python3
"""
Blaze Intelligence Video Data Pipeline
Real-time video processing and analysis integration
"""

import json
import logging
import asyncio
import aiofiles
import websockets
from datetime import datetime
from typing import Dict, List, Optional
from pathlib import Path
import base64
import hashlib

from video_analysis_engine import BlazeVideoAnalysis
from websocket_coaching_server import WebSocketCoachingServer
from mediapipe_integration import MediaPipeIntegration

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('blaze_video_pipeline')

class BlazeVideoDataPipeline:
    """Real-time video data processing and analysis pipeline"""
    
    def __init__(self, config_path: Optional[Path] = None):
        self.config = self._load_config(config_path)
        self.video_analyzer = BlazeVideoAnalysis()
        self.mediapipe_integration = MediaPipeIntegration()
        self.coaching_server = WebSocketCoachingServer()
        
        # Pipeline state
        self.active_sessions = {}
        self.processing_queue = asyncio.Queue()
        self.results_cache = {}
        
        # Output directories
        self.output_dirs = {
            'processed': Path('public/data/processed'),
            'coaching': Path('public/data/coaching'),
            'analytics': Path('public/data/analytics')
        }
        
        # Create output directories
        for dir_path in self.output_dirs.values():
            dir_path.mkdir(parents=True, exist_ok=True)
        
        logger.info("🚀 Blaze Video Data Pipeline initialized")
    
    def _load_config(self, config_path: Optional[Path]) -> Dict:
        """Load pipeline configuration"""
        default_config = {
            'max_concurrent_sessions': 10,
            'video_processing': {
                'max_file_size_mb': 500,
                'supported_formats': ['.mp4', '.mov', '.avi', '.mkv'],
                'frame_rate_limit': 60,
                'resolution_limit': '1920x1080'
            },
            'realtime_coaching': {
                'enabled': True,
                'feedback_threshold': 0.7,
                'response_time_ms': 50
            },
            'analytics': {
                'save_raw_data': True,
                'generate_reports': True,
                'batch_processing': False
            }
        }
        
        if config_path and config_path.exists():
            with open(config_path, 'r') as f:
                user_config = json.load(f)
                default_config.update(user_config)
        
        return default_config
    
    async def start_pipeline(self):
        """Start the video data pipeline"""
        logger.info("🎬 Starting Blaze Video Data Pipeline...")
        
        # Start background tasks
        tasks = [
            asyncio.create_task(self._process_video_queue()),
            asyncio.create_task(self._monitor_active_sessions()),
            asyncio.create_task(self.coaching_server.start_server())
        ]
        
        logger.info("✅ Pipeline started successfully")
        
        try:
            await asyncio.gather(*tasks)
        except KeyboardInterrupt:
            logger.info("🛑 Pipeline shutdown requested")
            await self._cleanup_pipeline()
    
    async def upload_video_for_analysis(self, video_data: Dict) -> Dict:
        """
        Upload and queue video for analysis
        
        Args:
            video_data: {
                'file_path': str,
                'player_id': str,
                'sport': str,
                'action_type': str,
                'metadata': dict
            }
        
        Returns:
            Upload confirmation with session_id
        """
        session_id = self._generate_session_id(video_data)
        
        logger.info(f"📤 Uploading video for analysis: {session_id}")
        
        # Validate video file
        validation_result = await self._validate_video_file(video_data)
        if not validation_result['valid']:
            return {
                'success': False,
                'session_id': session_id,
                'error': validation_result['error']
            }
        
        # Create processing session
        session = {
            'session_id': session_id,
            'video_data': video_data,
            'status': 'queued',
            'created_at': datetime.now().isoformat(),
            'progress': 0
        }
        
        self.active_sessions[session_id] = session
        await self.processing_queue.put(session)
        
        logger.info(f"✅ Video queued for processing: {session_id}")
        
        return {
            'success': True,
            'session_id': session_id,
            'estimated_processing_time': validation_result.get('estimated_time', '2-3 minutes'),
            'status_endpoint': f'/api/video/status/{session_id}'
        }
    
    async def _process_video_queue(self):
        """Process videos from the queue"""
        logger.info("🔄 Video processing queue started")
        
        while True:
            try:
                session = await self.processing_queue.get()
                await self._process_video_session(session)
            except Exception as e:
                logger.error(f"❌ Error processing video session: {e}")
    
    async def _process_video_session(self, session: Dict):
        """Process a single video session"""
        session_id = session['session_id']
        video_data = session['video_data']
        
        logger.info(f"🎥 Processing video session: {session_id}")
        
        try:
            # Update session status
            session['status'] = 'processing'
            session['progress'] = 10
            
            # Step 1: Extract video metadata and frames
            session['progress'] = 25
            frame_data = await self._extract_video_frames(video_data)
            
            # Step 2: Run MediaPipe analysis
            session['progress'] = 40
            pose_data = await self.mediapipe_integration.analyze_video_poses(frame_data)
            
            # Step 3: Run biomechanics analysis
            session['progress'] = 65
            analysis_input = {
                **video_data,
                'frame_data': frame_data,
                'pose_data': pose_data
            }
            
            biomechanics_result = self.video_analyzer.analyze_video_clip(
                analysis_input, 
                video_data.get('sport', 'baseball')
            )
            
            # Step 4: Generate coaching insights
            session['progress'] = 85
            coaching_insights = await self._generate_coaching_insights(
                biomechanics_result, pose_data
            )
            
            # Step 5: Save results and update session
            session['progress'] = 95
            final_result = {
                'session_id': session_id,
                'timestamp': datetime.now().isoformat(),
                'video_metadata': video_data,
                'biomechanics_analysis': biomechanics_result,
                'pose_analysis': pose_data,
                'coaching_insights': coaching_insights,
                'status': 'completed'
            }
            
            # Save results to multiple formats
            await self._save_analysis_results(session_id, final_result)
            
            # Update session
            session['status'] = 'completed'
            session['progress'] = 100
            session['results'] = final_result
            session['completed_at'] = datetime.now().isoformat()
            
            # Cache results
            self.results_cache[session_id] = final_result
            
            logger.info(f"✅ Video processing completed: {session_id}")
            
            # Trigger real-time coaching if enabled
            if self.config['realtime_coaching']['enabled']:
                await self._start_realtime_coaching_session(session_id, final_result)
                
        except Exception as e:
            logger.error(f"❌ Video processing failed for {session_id}: {e}")
            session['status'] = 'error'
            session['error'] = str(e)
    
    async def _extract_video_frames(self, video_data: Dict) -> Dict:
        """Extract frames and metadata from video"""
        # Simulate frame extraction (in production, use OpenCV or similar)
        await asyncio.sleep(0.5)  # Simulate processing time
        
        return {
            'frame_count': 60,
            'fps': 30,
            'duration': 2.0,
            'resolution': '1920x1080',
            'frames': [f'frame_{i}' for i in range(60)]  # Mock frame data
        }
    
    async def _generate_coaching_insights(self, biomechanics: Dict, pose_data: Dict) -> Dict:
        """Generate personalized coaching insights"""
        await asyncio.sleep(0.3)  # Simulate AI processing
        
        insights = {
            'primary_strengths': [],
            'improvement_areas': biomechanics.get('improvement_areas', []),
            'specific_drills': [],
            'technical_notes': [],
            'confidence_score': 0.87
        }
        
        # Generate strength analysis
        if biomechanics.get('overall_grade', 'C') in ['A+', 'A', 'A-']:
            insights['primary_strengths'].append("Excellent fundamental mechanics")
        
        if 'mechanics_metrics' in biomechanics:
            for metric, data in biomechanics['mechanics_metrics'].items():
                if data.get('percentile', 0) > 80:
                    insights['primary_strengths'].append(f"Strong {metric.replace('_', ' ')}")
        
        # Generate drill recommendations
        for area in insights['improvement_areas'][:3]:
            insights['specific_drills'].append({
                'area': area,
                'drill_name': f"{area} Enhancement Drill",
                'description': f"Targeted drill to improve {area.lower()}",
                'frequency': '3x per week',
                'duration': '15-20 minutes'
            })
        
        return insights
    
    async def _save_analysis_results(self, session_id: str, results: Dict):
        """Save analysis results to multiple output formats"""
        
        # Save complete results
        results_path = self.output_dirs['processed'] / f"{session_id}_complete.json"
        async with aiofiles.open(results_path, 'w') as f:
            await f.write(json.dumps(results, indent=2, ensure_ascii=False))
        
        # Save coaching-specific data
        coaching_path = self.output_dirs['coaching'] / f"{session_id}_coaching.json"
        coaching_data = {
            'session_id': session_id,
            'insights': results['coaching_insights'],
            'biomechanics_summary': {
                'overall_grade': results['biomechanics_analysis'].get('overall_grade'),
                'improvement_areas': results['biomechanics_analysis'].get('improvement_areas', [])
            }
        }
        async with aiofiles.open(coaching_path, 'w') as f:
            await f.write(json.dumps(coaching_data, indent=2, ensure_ascii=False))
        
        # Save analytics summary
        analytics_path = self.output_dirs['analytics'] / f"{session_id}_analytics.json"
        analytics_data = {
            'session_id': session_id,
            'timestamp': results['timestamp'],
            'sport': results['video_metadata'].get('sport'),
            'analysis_metrics': results['biomechanics_analysis'].get('mechanics_metrics', {}),
            'performance_score': results['biomechanics_analysis'].get('overall_grade')
        }
        async with aiofiles.open(analytics_path, 'w') as f:
            await f.write(json.dumps(analytics_data, indent=2, ensure_ascii=False))
    
    async def _start_realtime_coaching_session(self, session_id: str, analysis_results: Dict):
        """Start real-time coaching session based on analysis"""
        logger.info(f"🎯 Starting real-time coaching session: {session_id}")
        
        coaching_session = {
            'session_id': session_id,
            'analysis_results': analysis_results,
            'coaching_mode': 'improvement_focused',
            'feedback_frequency': 'immediate'
        }
        
        # This would integrate with the WebSocket coaching server
        await self.coaching_server.create_coaching_session(coaching_session)
    
    async def _validate_video_file(self, video_data: Dict) -> Dict:
        """Validate uploaded video file"""
        file_path = video_data.get('file_path')
        
        if not file_path or not Path(file_path).exists():
            return {'valid': False, 'error': 'Video file not found'}
        
        file_path = Path(file_path)
        
        # Check file extension
        if file_path.suffix.lower() not in self.config['video_processing']['supported_formats']:
            return {'valid': False, 'error': 'Unsupported video format'}
        
        # Check file size
        file_size_mb = file_path.stat().st_size / (1024 * 1024)
        if file_size_mb > self.config['video_processing']['max_file_size_mb']:
            return {'valid': False, 'error': 'Video file too large'}
        
        # Estimate processing time based on file size
        estimated_minutes = max(1, int(file_size_mb / 50))
        
        return {
            'valid': True, 
            'file_size_mb': round(file_size_mb, 2),
            'estimated_time': f"{estimated_minutes}-{estimated_minutes + 1} minutes"
        }
    
    def _generate_session_id(self, video_data: Dict) -> str:
        """Generate unique session ID"""
        timestamp = datetime.now().isoformat()
        player_id = video_data.get('player_id', 'unknown')
        content = f"{timestamp}_{player_id}_{video_data.get('sport', 'unknown')}"
        return hashlib.md5(content.encode()).hexdigest()[:12]
    
    async def get_session_status(self, session_id: str) -> Dict:
        """Get processing status for a session"""
        if session_id not in self.active_sessions:
            return {'error': 'Session not found', 'session_id': session_id}
        
        session = self.active_sessions[session_id]
        return {
            'session_id': session_id,
            'status': session['status'],
            'progress': session['progress'],
            'created_at': session['created_at'],
            'completed_at': session.get('completed_at'),
            'error': session.get('error')
        }
    
    async def get_session_results(self, session_id: str) -> Dict:
        """Get analysis results for a completed session"""
        if session_id in self.results_cache:
            return self.results_cache[session_id]
        
        # Try loading from disk
        results_path = self.output_dirs['processed'] / f"{session_id}_complete.json"
        if results_path.exists():
            async with aiofiles.open(results_path, 'r') as f:
                results = json.loads(await f.read())
                self.results_cache[session_id] = results  # Cache for future requests
                return results
        
        return {'error': 'Results not found', 'session_id': session_id}
    
    async def _monitor_active_sessions(self):
        """Monitor and cleanup old sessions"""
        while True:
            await asyncio.sleep(300)  # Check every 5 minutes
            
            current_time = datetime.now()
            expired_sessions = []
            
            for session_id, session in self.active_sessions.items():
                created_at = datetime.fromisoformat(session['created_at'])
                age_hours = (current_time - created_at).total_seconds() / 3600
                
                # Remove sessions older than 24 hours
                if age_hours > 24:
                    expired_sessions.append(session_id)
            
            for session_id in expired_sessions:
                del self.active_sessions[session_id]
                if session_id in self.results_cache:
                    del self.results_cache[session_id]
                logger.info(f"🧹 Cleaned up expired session: {session_id}")
    
    async def _cleanup_pipeline(self):
        """Cleanup pipeline resources"""
        logger.info("🧹 Cleaning up video pipeline...")
        
        # Stop coaching server
        await self.coaching_server.stop_server()
        
        # Save any pending sessions
        for session_id, session in self.active_sessions.items():
            if session['status'] in ['processing', 'queued']:
                session['status'] = 'interrupted'
                logger.info(f"🔄 Session interrupted during shutdown: {session_id}")
        
        logger.info("✅ Pipeline cleanup completed")

async def main():
    """Main function for testing the pipeline"""
    pipeline = BlazeVideoDataPipeline()
    
    # Test video upload
    test_video = {
        'file_path': 'test_videos/batting_sample.mp4',
        'player_id': 'test_player_001',
        'sport': 'baseball',
        'action_type': 'batting',
        'metadata': {
            'player_name': 'Test Player',
            'team': 'Test Team',
            'position': 'OF'
        }
    }
    
    logger.info("🧪 Testing video pipeline...")
    
    # Simulate file upload
    upload_result = await pipeline.upload_video_for_analysis(test_video)
    logger.info(f"Upload result: {upload_result}")
    
    if upload_result['success']:
        session_id = upload_result['session_id']
        
        # Monitor progress
        while True:
            status = await pipeline.get_session_status(session_id)
            logger.info(f"Session status: {status}")
            
            if status['status'] in ['completed', 'error']:
                break
            
            await asyncio.sleep(2)
        
        # Get results if completed
        if status['status'] == 'completed':
            results = await pipeline.get_session_results(session_id)
            logger.info("✅ Pipeline test completed successfully!")
        
    logger.info("🎉 Video pipeline testing complete!")

if __name__ == '__main__':
    asyncio.run(main())