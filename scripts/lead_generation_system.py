#!/usr/bin/env python3
"""
Blaze Intelligence Automated Lead Generation System
Tracks user interactions and automatically qualifies leads
"""

import json
import logging
import asyncio
import aiofiles
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from pathlib import Path
from dataclasses import dataclass, asdict
from enum import Enum
import hashlib
import uuid

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('lead_generation')

class LeadSource(Enum):
    DIRECT_DEMO = "direct_demo"
    LANDING_PAGE = "landing_page"
    SHOWCASE_PAGE = "showcase_page"
    VIDEO_UPLOAD = "video_upload"
    REFERRAL = "referral"
    SOCIAL_MEDIA = "social_media"

class LeadScore(Enum):
    COLD = "cold"           # 0-30 points
    WARM = "warm"           # 31-60 points
    HOT = "hot"             # 61-80 points
    CHAMPION = "champion"   # 81+ points

class InteractionType(Enum):
    PAGE_VIEW = "page_view"
    DEMO_START = "demo_start"
    VIDEO_UPLOAD = "video_upload"
    RESULTS_VIEW = "results_view"
    EMAIL_SIGNUP = "email_signup"
    CONSULTATION_REQUEST = "consultation_request"

@dataclass
class LeadInteraction:
    timestamp: str
    interaction_type: InteractionType
    page_url: str
    session_id: str
    user_agent: str
    duration_seconds: Optional[int] = None
    additional_data: Optional[Dict] = None

@dataclass
class Lead:
    lead_id: str
    created_at: str
    updated_at: str
    source: LeadSource
    score: int
    classification: LeadScore
    contact_info: Dict[str, str]
    interactions: List[LeadInteraction]
    video_sessions: List[str]
    engagement_metrics: Dict[str, Any]
    qualification_notes: str
    next_action: str
    assigned_to: Optional[str] = None

class LeadGenerationEngine:
    """Automated lead generation and qualification system"""
    
    def __init__(self, config_path: Optional[Path] = None):
        self.config = self._load_config(config_path)
        
        # Data storage
        self.leads_db_path = Path('public/data/leads/leads_database.json')
        self.interactions_path = Path('public/data/leads/interactions.json')
        self.analytics_path = Path('public/data/leads/lead_analytics.json')
        
        # Create directories
        for path in [self.leads_db_path, self.interactions_path, self.analytics_path]:
            path.parent.mkdir(parents=True, exist_ok=True)
        
        # Initialize database
        self.leads_database = {}
        self.interactions_log = []
        self._load_existing_data()
        
        # Scoring system
        self.scoring_rules = self._initialize_scoring_rules()
        
        logger.info("🎯 Lead Generation Engine initialized")
    
    def _load_config(self, config_path: Optional[Path]) -> Dict:
        """Load lead generation configuration"""
        default_config = {
            'scoring': {
                'page_view': 5,
                'demo_start': 15,
                'video_upload': 25,
                'results_view': 10,
                'email_signup': 20,
                'consultation_request': 30
            },
            'qualification_thresholds': {
                'cold': 0,
                'warm': 31,
                'hot': 61,
                'champion': 81
            },
            'auto_follow_up': {
                'enabled': True,
                'champion_immediate': True,
                'hot_within_hours': 2,
                'warm_within_days': 1
            },
            'lead_nurturing': {
                'enabled': True,
                'email_sequences': True,
                'personalization': True
            }
        }
        
        if config_path and config_path.exists():
            with open(config_path, 'r') as f:
                user_config = json.load(f)
                default_config.update(user_config)
        
        return default_config
    
    def _load_existing_data(self):
        """Load existing leads and interactions"""
        try:
            if self.leads_db_path.exists():
                with open(self.leads_db_path, 'r') as f:
                    data = json.load(f)
                    self.leads_database = data.get('leads', {})
            
            if self.interactions_path.exists():
                with open(self.interactions_path, 'r') as f:
                    data = json.load(f)
                    self.interactions_log = data.get('interactions', [])
                    
        except Exception as e:
            logger.warning(f"Could not load existing data: {e}")
    
    def _initialize_scoring_rules(self) -> Dict:
        """Initialize lead scoring rules"""
        return {
            InteractionType.PAGE_VIEW: 5,
            InteractionType.DEMO_START: 15,
            InteractionType.VIDEO_UPLOAD: 25,
            InteractionType.RESULTS_VIEW: 10,
            InteractionType.EMAIL_SIGNUP: 20,
            InteractionType.CONSULTATION_REQUEST: 30
        }
    
    async def track_interaction(self,
                              session_id: str,
                              interaction_type: InteractionType,
                              page_url: str,
                              user_agent: str,
                              duration_seconds: Optional[int] = None,
                              additional_data: Optional[Dict] = None,
                              contact_info: Optional[Dict] = None) -> Dict:
        """Track user interaction and update lead scoring"""
        
        interaction = LeadInteraction(
            timestamp=datetime.now().isoformat(),
            interaction_type=interaction_type,
            page_url=page_url,
            session_id=session_id,
            user_agent=user_agent,
            duration_seconds=duration_seconds,
            additional_data=additional_data or {}
        )
        
        # Add to interactions log (convert enum to string)
        interaction_dict = asdict(interaction)
        interaction_dict['interaction_type'] = interaction_type.value
        self.interactions_log.append(interaction_dict)
        
        # Get or create lead
        lead_id = self._get_or_create_lead(session_id, contact_info)
        lead = self.leads_database[lead_id]
        
        # Update lead with new interaction
        lead['interactions'].append(interaction_dict)
        lead['updated_at'] = datetime.now().isoformat()
        
        # Update lead scoring
        await self._update_lead_score(lead_id, interaction_type)
        
        # Check for qualification changes
        await self._evaluate_lead_qualification(lead_id)
        
        # Save data
        await self._save_lead_data()
        
        logger.info(f"📊 Tracked {interaction_type.value} for lead {lead_id[:8]}")
        
        return {
            'lead_id': lead_id,
            'current_score': lead['score'],
            'classification': lead['classification'],
            'next_action': lead['next_action']
        }
    
    def _get_or_create_lead(self, session_id: str, contact_info: Optional[Dict]) -> str:
        """Get existing lead or create new one"""
        
        # Try to find existing lead by session
        for lead_id, lead in self.leads_database.items():
            if any(i['session_id'] == session_id for i in lead['interactions']):
                # Update contact info if provided
                if contact_info:
                    lead['contact_info'].update(contact_info)
                return lead_id
        
        # Create new lead
        lead_id = str(uuid.uuid4())
        new_lead = {
            'lead_id': lead_id,
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat(),
            'source': LeadSource.DIRECT_DEMO.value,  # Default
            'score': 0,
            'classification': LeadScore.COLD.value,
            'contact_info': contact_info or {},
            'interactions': [],
            'video_sessions': [],
            'engagement_metrics': {
                'total_sessions': 0,
                'total_page_views': 0,
                'demo_completions': 0,
                'video_uploads': 0,
                'avg_session_duration': 0
            },
            'qualification_notes': '',
            'next_action': 'monitor_engagement',
            'assigned_to': None
        }
        
        self.leads_database[lead_id] = new_lead
        logger.info(f"🆕 Created new lead: {lead_id[:8]}")
        
        return lead_id
    
    async def _update_lead_score(self, lead_id: str, interaction_type: InteractionType):
        """Update lead score based on interaction"""
        lead = self.leads_database[lead_id]
        
        # Add base points for interaction
        base_points = self.scoring_rules.get(interaction_type, 0)
        
        # Apply multipliers based on engagement patterns
        multiplier = 1.0
        
        # Recent activity multiplier
        recent_interactions = [
            i for i in lead['interactions']
            if datetime.fromisoformat(i['timestamp']) > datetime.now() - timedelta(hours=24)
        ]
        if len(recent_interactions) > 3:
            multiplier += 0.2  # 20% bonus for high activity
        
        # Demo completion multiplier
        if interaction_type == InteractionType.VIDEO_UPLOAD:
            multiplier += 0.5  # 50% bonus for completing demo
        
        # Contact info provided multiplier
        if lead['contact_info']:
            multiplier += 0.3  # 30% bonus for providing contact info
        
        points_to_add = int(base_points * multiplier)
        lead['score'] += points_to_add
        
        logger.info(f"📈 Lead {lead_id[:8]} scored +{points_to_add} points (total: {lead['score']})")
    
    async def _evaluate_lead_qualification(self, lead_id: str):
        """Evaluate and update lead qualification level"""
        lead = self.leads_database[lead_id]
        score = lead['score']
        
        # Determine new classification
        if score >= 81:
            new_classification = LeadScore.CHAMPION
            next_action = "immediate_personal_outreach"
        elif score >= 61:
            new_classification = LeadScore.HOT
            next_action = "schedule_consultation_within_2hrs"
        elif score >= 31:
            new_classification = LeadScore.WARM
            next_action = "send_follow_up_sequence"
        else:
            new_classification = LeadScore.COLD
            next_action = "monitor_engagement"
        
        old_classification = lead['classification']
        lead['classification'] = new_classification.value
        lead['next_action'] = next_action
        
        # Log qualification changes
        if old_classification != new_classification.value:
            logger.info(f"🎯 Lead {lead_id[:8]} qualified: {old_classification} → {new_classification.value}")
            
            # Add qualification note
            lead['qualification_notes'] += f"\n{datetime.now().isoformat()}: Upgraded to {new_classification.value}"
            
            # Trigger automated actions
            await self._trigger_automated_actions(lead_id, new_classification)
    
    async def _trigger_automated_actions(self, lead_id: str, classification: LeadScore):
        """Trigger automated actions based on lead qualification"""
        lead = self.leads_database[lead_id]
        
        if classification == LeadScore.CHAMPION:
            await self._handle_champion_lead(lead_id)
        elif classification == LeadScore.HOT:
            await self._handle_hot_lead(lead_id)
        elif classification == LeadScore.WARM:
            await self._handle_warm_lead(lead_id)
        
        logger.info(f"🤖 Automated actions triggered for {classification.value} lead {lead_id[:8]}")
    
    async def _handle_champion_lead(self, lead_id: str):
        """Handle champion-level lead (immediate attention)"""
        lead = self.leads_database[lead_id]
        
        # Create high-priority alert
        alert = {
            'timestamp': datetime.now().isoformat(),
            'type': 'champion_lead_alert',
            'lead_id': lead_id,
            'urgency': 'immediate',
            'message': f"🏆 CHAMPION LEAD ALERT: Score {lead['score']}, immediate personal outreach required",
            'contact_info': lead['contact_info'],
            'recent_interactions': lead['interactions'][-3:] if len(lead['interactions']) >= 3 else lead['interactions']
        }
        
        # Save alert
        alerts_path = Path('public/data/leads/champion_alerts.json')
        alerts = []
        
        if alerts_path.exists():
            with open(alerts_path, 'r') as f:
                alerts = json.load(f)
        
        alerts.append(alert)
        
        with open(alerts_path, 'w') as f:
            json.dump(alerts, f, indent=2)
        
        logger.warning(f"🚨 CHAMPION LEAD ALERT: {lead_id[:8]} requires immediate attention!")
    
    async def _handle_hot_lead(self, lead_id: str):
        """Handle hot lead (within 2 hours)"""
        lead = self.leads_database[lead_id]
        
        # Schedule follow-up within 2 hours
        follow_up = {
            'lead_id': lead_id,
            'scheduled_for': (datetime.now() + timedelta(hours=2)).isoformat(),
            'action_type': 'personal_consultation_offer',
            'priority': 'high',
            'message_template': 'hot_lead_consultation'
        }
        
        # Save follow-up task
        await self._save_follow_up_task(follow_up)
    
    async def _handle_warm_lead(self, lead_id: str):
        """Handle warm lead (nurture sequence)"""
        lead = self.leads_database[lead_id]
        
        # Start nurture sequence
        nurture_sequence = {
            'lead_id': lead_id,
            'sequence_type': 'warm_lead_nurture',
            'emails': [
                {
                    'delay_hours': 1,
                    'template': 'demo_results_follow_up',
                    'personalization_data': lead['engagement_metrics']
                },
                {
                    'delay_hours': 24,
                    'template': 'case_study_similar_athlete',
                    'personalization_data': lead['contact_info']
                },
                {
                    'delay_hours': 72,
                    'template': 'consultation_invitation',
                    'personalization_data': lead
                }
            ]
        }
        
        # Save nurture sequence
        await self._save_nurture_sequence(nurture_sequence)
    
    async def _save_follow_up_task(self, follow_up: Dict):
        """Save follow-up task for manual or automated processing"""
        tasks_path = Path('public/data/leads/follow_up_tasks.json')
        tasks = []
        
        if tasks_path.exists():
            with open(tasks_path, 'r') as f:
                tasks = json.load(f)
        
        tasks.append(follow_up)
        
        with open(tasks_path, 'w') as f:
            json.dump(tasks, f, indent=2)
    
    async def _save_nurture_sequence(self, sequence: Dict):
        """Save email nurture sequence"""
        sequences_path = Path('public/data/leads/nurture_sequences.json')
        sequences = []
        
        if sequences_path.exists():
            with open(sequences_path, 'r') as f:
                sequences = json.load(f)
        
        sequences.append(sequence)
        
        with open(sequences_path, 'w') as f:
            json.dump(sequences, f, indent=2)
    
    async def track_video_session(self, lead_id: str, session_id: str, video_data: Dict):
        """Track video analysis session for a lead"""
        if lead_id in self.leads_database:
            lead = self.leads_database[lead_id]
            lead['video_sessions'].append(session_id)
            lead['engagement_metrics']['video_uploads'] += 1
            
            # Additional scoring for video completion
            if video_data.get('status') == 'completed':
                lead['score'] += 20  # Bonus for completion
                await self._evaluate_lead_qualification(lead_id)
            
            await self._save_lead_data()
    
    async def get_lead_profile(self, lead_id: str) -> Optional[Dict]:
        """Get complete lead profile"""
        if lead_id not in self.leads_database:
            return None
        
        lead = self.leads_database[lead_id].copy()
        
        # Calculate additional metrics
        interactions = lead['interactions']
        if interactions:
            # Calculate session metrics
            sessions = {}
            for interaction in interactions:
                session_id = interaction['session_id']
                if session_id not in sessions:
                    sessions[session_id] = []
                sessions[session_id].append(interaction)
            
            lead['engagement_metrics']['total_sessions'] = len(sessions)
            lead['engagement_metrics']['total_page_views'] = len([
                i for i in interactions if i['interaction_type'] == 'page_view'
            ])
            lead['engagement_metrics']['demo_completions'] = len([
                i for i in interactions if i['interaction_type'] == 'video_upload'
            ])
        
        return lead
    
    async def get_leads_dashboard(self) -> Dict:
        """Get leads dashboard data"""
        total_leads = len(self.leads_database)
        
        # Count by classification
        classification_counts = {}
        for lead in self.leads_database.values():
            classification = lead['classification']
            classification_counts[classification] = classification_counts.get(classification, 0) + 1
        
        # Recent activity
        recent_interactions = [
            i for i in self.interactions_log
            if datetime.fromisoformat(i['timestamp']) > datetime.now() - timedelta(hours=24)
        ]
        
        # Top leads by score
        top_leads = sorted(
            self.leads_database.values(),
            key=lambda x: x['score'],
            reverse=True
        )[:10]
        
        return {
            'total_leads': total_leads,
            'classification_breakdown': classification_counts,
            'recent_activity_24h': len(recent_interactions),
            'top_leads': [
                {
                    'lead_id': lead['lead_id'][:8],
                    'score': lead['score'],
                    'classification': lead['classification'],
                    'last_interaction': lead['updated_at']
                }
                for lead in top_leads
            ],
            'conversion_metrics': {
                'demo_to_upload_rate': self._calculate_conversion_rate('demo_start', 'video_upload'),
                'upload_to_consultation_rate': self._calculate_conversion_rate('video_upload', 'consultation_request'),
                'champion_lead_rate': (classification_counts.get('champion', 0) / max(total_leads, 1)) * 100
            }
        }
    
    def _calculate_conversion_rate(self, from_action: str, to_action: str) -> float:
        """Calculate conversion rate between two actions"""
        leads_with_from = set()
        leads_with_to = set()
        
        for lead in self.leads_database.values():
            lead_id = lead['lead_id']
            interaction_types = [i['interaction_type'] for i in lead['interactions']]
            
            if from_action in interaction_types:
                leads_with_from.add(lead_id)
                if to_action in interaction_types:
                    leads_with_to.add(lead_id)
        
        if len(leads_with_from) == 0:
            return 0.0
        
        return (len(leads_with_to) / len(leads_with_from)) * 100
    
    async def _save_lead_data(self):
        """Save leads database and interactions"""
        # Save leads database
        leads_data = {
            'updated_at': datetime.now().isoformat(),
            'total_leads': len(self.leads_database),
            'leads': self.leads_database
        }
        
        async with aiofiles.open(self.leads_db_path, 'w') as f:
            await f.write(json.dumps(leads_data, indent=2, ensure_ascii=False))
        
        # Save interactions log
        interactions_data = {
            'updated_at': datetime.now().isoformat(),
            'total_interactions': len(self.interactions_log),
            'interactions': self.interactions_log
        }
        
        async with aiofiles.open(self.interactions_path, 'w') as f:
            await f.write(json.dumps(interactions_data, indent=2, ensure_ascii=False))

async def main():
    """Test the lead generation system"""
    lead_engine = LeadGenerationEngine()
    
    logger.info("🧪 Testing Lead Generation System...")
    
    # Simulate user journey
    session_id = "test_session_001"
    
    # 1. Landing page view
    await lead_engine.track_interaction(
        session_id=session_id,
        interaction_type=InteractionType.PAGE_VIEW,
        page_url="/landing-page.html",
        user_agent="Mozilla/5.0 Test Browser",
        duration_seconds=45
    )
    
    # 2. Demo start
    await lead_engine.track_interaction(
        session_id=session_id,
        interaction_type=InteractionType.DEMO_START,
        page_url="/video-upload.html",
        user_agent="Mozilla/5.0 Test Browser",
        duration_seconds=120
    )
    
    # 3. Video upload with contact info
    result = await lead_engine.track_interaction(
        session_id=session_id,
        interaction_type=InteractionType.VIDEO_UPLOAD,
        page_url="/video-upload.html",
        user_agent="Mozilla/5.0 Test Browser",
        contact_info={
            "name": "Test Athlete",
            "email": "test@example.com",
            "sport": "baseball",
            "level": "high_school"
        }
    )
    
    logger.info(f"✅ Lead created: {result['lead_id'][:8]}")
    logger.info(f"Score: {result['current_score']}, Classification: {result['classification']}")
    
    # Get dashboard
    dashboard = await lead_engine.get_leads_dashboard()
    logger.info(f"📊 Dashboard: {dashboard['total_leads']} total leads")

if __name__ == '__main__':
    asyncio.run(main())