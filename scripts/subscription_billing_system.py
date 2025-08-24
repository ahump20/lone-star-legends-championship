#!/usr/bin/env python3
"""
Blaze Intelligence Subscription Billing and Client Management System
Handles premium packages, billing, and client lifecycle management
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
logger = logging.getLogger('subscription_system')

class SubscriptionTier(Enum):
    ESSENTIAL = "essential"
    PROFESSIONAL = "professional"
    ELITE = "elite"
    ENTERPRISE = "enterprise"

class SubscriptionStatus(Enum):
    ACTIVE = "active"
    PAST_DUE = "past_due"
    CANCELED = "canceled"
    SUSPENDED = "suspended"
    TRIAL = "trial"

class BillingCycle(Enum):
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    ANNUAL = "annual"

@dataclass
class SubscriptionPlan:
    plan_id: str
    tier: SubscriptionTier
    name: str
    price_monthly: float
    price_quarterly: float
    price_annual: float
    features: List[str]
    limits: Dict[str, int]
    description: str

@dataclass
class ClientSubscription:
    client_id: str
    subscription_id: str
    plan_id: str
    status: SubscriptionStatus
    billing_cycle: BillingCycle
    current_period_start: str
    current_period_end: str
    next_billing_date: str
    amount_due: float
    trial_end: Optional[str]
    usage_metrics: Dict[str, int]
    payment_method: Optional[Dict[str, str]]
    billing_address: Optional[Dict[str, str]]
    created_at: str
    updated_at: str

@dataclass
class BillingEvent:
    event_id: str
    client_id: str
    subscription_id: str
    event_type: str
    amount: float
    status: str
    description: str
    created_at: str
    metadata: Optional[Dict] = None

class SubscriptionBillingSystem:
    """Complete subscription billing and client management system"""
    
    def __init__(self, config_path: Optional[Path] = None):
        self.config = self._load_config(config_path)
        
        # Data storage paths
        self.data_dir = Path('public/data/billing')
        self.clients_db = self.data_dir / 'clients.json'
        self.subscriptions_db = self.data_dir / 'subscriptions.json'
        self.billing_events_db = self.data_dir / 'billing_events.json'
        self.usage_db = self.data_dir / 'usage_tracking.json'
        
        # Create directories
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize data structures
        self.subscription_plans = self._initialize_plans()
        self.clients = {}
        self.subscriptions = {}
        self.billing_events = []
        self.usage_tracking = {}
        
        # Load existing data
        self._load_existing_data()
        
        logger.info("💳 Subscription Billing System initialized")
        logger.info(f"📋 {len(self.subscription_plans)} plans available")
    
    def _load_config(self, config_path: Optional[Path]) -> Dict:
        """Load billing system configuration"""
        default_config = {
            'trial_period_days': 14,
            'grace_period_days': 7,
            'payment_processing': {
                'provider': 'stripe',
                'webhook_secret': None,
                'test_mode': True
            },
            'usage_limits': {
                'essential': {
                    'video_analyses': 5,
                    'tell_detector_analyses': 0,
                    'real_time_coaching_minutes': 0,
                    'custom_training_programs': 0
                },
                'professional': {
                    'video_analyses': 20,
                    'tell_detector_analyses': 20,
                    'real_time_coaching_minutes': 120,
                    'custom_training_programs': 1
                },
                'elite': {
                    'video_analyses': -1,  # Unlimited
                    'tell_detector_analyses': -1,
                    'real_time_coaching_minutes': -1,
                    'custom_training_programs': 5
                }
            },
            'pricing': {
                'essential': {'monthly': 297, 'quarterly': 267, 'annual': 247},
                'professional': {'monthly': 597, 'quarterly': 537, 'annual': 497},
                'elite': {'monthly': 1297, 'quarterly': 1167, 'annual': 997}
            }
        }
        
        if config_path and config_path.exists():
            with open(config_path, 'r') as f:
                user_config = json.load(f)
                default_config.update(user_config)
        
        return default_config
    
    def _initialize_plans(self) -> Dict[str, SubscriptionPlan]:
        """Initialize subscription plans"""
        plans = {}
        
        # Essential Plan
        plans['essential'] = SubscriptionPlan(
            plan_id='essential',
            tier=SubscriptionTier.ESSENTIAL,
            name='Character Insights',
            price_monthly=297.0,
            price_quarterly=267.0,
            price_annual=247.0,
            features=[
                '5 video analyses per month',
                'Basic Tell Detector™ character profiling',
                'Grit score and mental toughness grading',
                'Standard biomechanics analysis (96.3% accuracy)',
                'Email coaching recommendations',
                'Performance tracking dashboard',
                '24/7 platform access',
                'Mobile app included'
            ],
            limits={
                'video_analyses': 5,
                'tell_detector_analyses': 0,
                'real_time_coaching_minutes': 0,
                'custom_training_programs': 0
            },
            description='Perfect for individual athletes developing mental toughness'
        )
        
        # Professional Plan
        plans['professional'] = SubscriptionPlan(
            plan_id='professional',
            tier=SubscriptionTier.PROFESSIONAL,
            name='Championship Analysis',
            price_monthly=597.0,
            price_quarterly=537.0,
            price_annual=497.0,
            features=[
                '20 video analyses per month',
                'Advanced Tell Detector™ micro-expression analysis',
                'Real-time coaching feedback (<50ms response)',
                'Character trait identification and development',
                'Pressure situation analysis and training',
                'Personalized mental training programs',
                'Multi-sport analysis (baseball, football, basketball)',
                'Championship readiness scoring',
                'Weekly progress reports',
                'Priority email support'
            ],
            limits={
                'video_analyses': 20,
                'tell_detector_analyses': 20,
                'real_time_coaching_minutes': 120,
                'custom_training_programs': 1
            },
            description='Complete Tell Detector™ system for serious competitors'
        )
        
        # Elite Plan
        plans['elite'] = SubscriptionPlan(
            plan_id='elite',
            tier=SubscriptionTier.ELITE,
            name='Champion Development',
            price_monthly=1297.0,
            price_quarterly=1167.0,
            price_annual=997.0,
            features=[
                'Unlimited video analyses',
                'Complete Tell Detector™ psychological profiling',
                '1-on-1 monthly coaching calls with Austin Humphrey',
                'Custom mental training protocols',
                'Advanced pressure simulation training',
                'Leadership potential development',
                'Team character dynamics analysis',
                'Performance psychology optimization',
                'Competitive intelligence insights',
                'White-glove onboarding',
                '24/7 phone and email support',
                'Quarterly performance reviews'
            ],
            limits={
                'video_analyses': -1,  # Unlimited
                'tell_detector_analyses': -1,
                'real_time_coaching_minutes': -1,
                'custom_training_programs': 5
            },
            description='Ultimate Tell Detector™ experience with personal coaching'
        )
        
        return plans
    
    def _load_existing_data(self):
        """Load existing billing and client data"""
        try:
            if self.clients_db.exists():
                with open(self.clients_db, 'r') as f:
                    data = json.load(f)
                    self.clients = data.get('clients', {})
            
            if self.subscriptions_db.exists():
                with open(self.subscriptions_db, 'r') as f:
                    data = json.load(f)
                    self.subscriptions = data.get('subscriptions', {})
            
            if self.billing_events_db.exists():
                with open(self.billing_events_db, 'r') as f:
                    data = json.load(f)
                    self.billing_events = data.get('events', [])
            
        except Exception as e:
            logger.warning(f"Could not load existing billing data: {e}")
    
    async def create_subscription(self,
                                client_email: str,
                                client_name: str,
                                plan_id: str,
                                billing_cycle: BillingCycle = BillingCycle.MONTHLY,
                                payment_method: Optional[Dict] = None,
                                trial_period: bool = True) -> Dict:
        """Create new subscription for client"""
        
        if plan_id not in self.subscription_plans:
            raise ValueError(f"Invalid plan ID: {plan_id}")
        
        # Generate IDs
        client_id = str(uuid.uuid4())
        subscription_id = str(uuid.uuid4())
        
        # Calculate dates
        now = datetime.now()
        if trial_period:
            trial_end = now + timedelta(days=self.config['trial_period_days'])
            period_start = trial_end
            status = SubscriptionStatus.TRIAL
        else:
            trial_end = None
            period_start = now
            status = SubscriptionStatus.ACTIVE
        
        # Calculate period end based on billing cycle
        if billing_cycle == BillingCycle.MONTHLY:
            period_end = period_start + timedelta(days=30)
            amount_due = self.subscription_plans[plan_id].price_monthly
        elif billing_cycle == BillingCycle.QUARTERLY:
            period_end = period_start + timedelta(days=90)
            amount_due = self.subscription_plans[plan_id].price_quarterly
        else:  # Annual
            period_end = period_start + timedelta(days=365)
            amount_due = self.subscription_plans[plan_id].price_annual
        
        # Create client record
        client_record = {
            'client_id': client_id,
            'email': client_email,
            'name': client_name,
            'created_at': now.isoformat(),
            'subscription_ids': [subscription_id],
            'total_spent': 0.0,
            'lifetime_value': 0.0,
            'status': 'active'
        }
        
        # Create subscription
        subscription = ClientSubscription(
            client_id=client_id,
            subscription_id=subscription_id,
            plan_id=plan_id,
            status=status,
            billing_cycle=billing_cycle,
            current_period_start=period_start.isoformat(),
            current_period_end=period_end.isoformat(),
            next_billing_date=period_end.isoformat(),
            amount_due=amount_due if not trial_period else 0.0,
            trial_end=trial_end.isoformat() if trial_end else None,
            usage_metrics=self._initialize_usage_metrics(),
            payment_method=payment_method,
            billing_address=None,
            created_at=now.isoformat(),
            updated_at=now.isoformat()
        )
        
        # Store records (convert enums to strings for JSON serialization)
        self.clients[client_id] = client_record
        subscription_dict = asdict(subscription)
        subscription_dict['status'] = status.value
        subscription_dict['billing_cycle'] = billing_cycle.value
        self.subscriptions[subscription_id] = subscription_dict
        
        # Create billing event
        event = BillingEvent(
            event_id=str(uuid.uuid4()),
            client_id=client_id,
            subscription_id=subscription_id,
            event_type='subscription_created',
            amount=amount_due,
            status='pending' if not trial_period else 'trial',
            description=f"Subscription created for {self.subscription_plans[plan_id].name}",
            created_at=now.isoformat(),
            metadata={'plan_id': plan_id, 'billing_cycle': billing_cycle.value}
        )
        
        self.billing_events.append(asdict(event))
        
        # Save data
        await self._save_billing_data()
        
        logger.info(f"💳 Subscription created: {subscription_id[:8]} for {client_name}")
        
        return {
            'client_id': client_id,
            'subscription_id': subscription_id,
            'status': status.value,
            'plan': self.subscription_plans[plan_id].name,
            'amount_due': amount_due,
            'trial_end': trial_end.isoformat() if trial_end else None,
            'next_billing_date': period_end.isoformat()
        }
    
    def _initialize_usage_metrics(self) -> Dict[str, int]:
        """Initialize usage metrics for new subscription"""
        return {
            'video_analyses_used': 0,
            'tell_detector_analyses_used': 0,
            'real_time_coaching_minutes_used': 0,
            'custom_training_programs_used': 0,
            'api_calls_made': 0,
            'storage_gb_used': 0
        }
    
    async def track_usage(self, subscription_id: str, usage_type: str, amount: int = 1) -> Dict:
        """Track usage for a subscription"""
        
        if subscription_id not in self.subscriptions:
            raise ValueError(f"Subscription not found: {subscription_id}")
        
        subscription = self.subscriptions[subscription_id]
        plan_id = subscription['plan_id']
        plan = self.subscription_plans[plan_id]
        
        # Update usage
        usage_key = f"{usage_type}_used"
        if usage_key not in subscription['usage_metrics']:
            subscription['usage_metrics'][usage_key] = 0
        
        subscription['usage_metrics'][usage_key] += amount
        subscription['updated_at'] = datetime.now().isoformat()
        
        # Check limits
        limit_key = usage_type.replace('_used', '')
        limit = plan.limits.get(limit_key, 0)
        current_usage = subscription['usage_metrics'][usage_key]
        
        # Calculate usage status
        if limit == -1:  # Unlimited
            usage_status = 'unlimited'
            percentage_used = 0
        else:
            percentage_used = (current_usage / limit) * 100 if limit > 0 else 0
            
            if percentage_used >= 100:
                usage_status = 'exceeded'
            elif percentage_used >= 80:
                usage_status = 'warning'
            else:
                usage_status = 'normal'
        
        # Save data
        await self._save_billing_data()
        
        logger.info(f"📊 Usage tracked: {subscription_id[:8]} - {usage_type}: {current_usage}/{limit if limit != -1 else '∞'}")
        
        return {
            'usage_type': usage_type,
            'current_usage': current_usage,
            'limit': limit,
            'percentage_used': percentage_used,
            'status': usage_status,
            'remaining': max(0, limit - current_usage) if limit != -1 else 'unlimited'
        }
    
    async def process_billing_cycle(self, subscription_id: str) -> Dict:
        """Process billing for a subscription cycle"""
        
        if subscription_id not in self.subscriptions:
            raise ValueError(f"Subscription not found: {subscription_id}")
        
        subscription = self.subscriptions[subscription_id]
        now = datetime.now()
        
        # Check if billing is due
        next_billing = datetime.fromisoformat(subscription['next_billing_date'])
        if now < next_billing:
            return {'status': 'not_due', 'next_billing_date': subscription['next_billing_date']}
        
        # Process billing
        amount_due = subscription['amount_due']
        
        # Simulate payment processing (in production, integrate with Stripe)
        payment_success = await self._process_payment(subscription_id, amount_due)
        
        if payment_success:
            # Update subscription for next period
            billing_cycle = BillingCycle(subscription['billing_cycle'])
            
            if billing_cycle == BillingCycle.MONTHLY:
                next_period_end = now + timedelta(days=30)
            elif billing_cycle == BillingCycle.QUARTERLY:
                next_period_end = now + timedelta(days=90)
            else:  # Annual
                next_period_end = now + timedelta(days=365)
            
            subscription['current_period_start'] = now.isoformat()
            subscription['current_period_end'] = next_period_end.isoformat()
            subscription['next_billing_date'] = next_period_end.isoformat()
            subscription['status'] = SubscriptionStatus.ACTIVE.value
            subscription['updated_at'] = now.isoformat()
            
            # Reset usage metrics for new period
            subscription['usage_metrics'] = self._initialize_usage_metrics()
            
            # Update client spending
            client_id = subscription['client_id']
            if client_id in self.clients:
                self.clients[client_id]['total_spent'] += amount_due
                self.clients[client_id]['lifetime_value'] += amount_due
            
            # Create billing event
            event = BillingEvent(
                event_id=str(uuid.uuid4()),
                client_id=subscription['client_id'],
                subscription_id=subscription_id,
                event_type='payment_successful',
                amount=amount_due,
                status='completed',
                description=f"Billing cycle processed successfully - ${amount_due}",
                created_at=now.isoformat()
            )
            
            self.billing_events.append(asdict(event))
            
            await self._save_billing_data()
            
            logger.info(f"💰 Billing processed: {subscription_id[:8]} - ${amount_due}")
            
            return {
                'status': 'success',
                'amount_charged': amount_due,
                'next_billing_date': next_period_end.isoformat(),
                'period_reset': True
            }
        
        else:
            # Payment failed
            subscription['status'] = SubscriptionStatus.PAST_DUE.value
            subscription['updated_at'] = now.isoformat()
            
            # Create billing event
            event = BillingEvent(
                event_id=str(uuid.uuid4()),
                client_id=subscription['client_id'],
                subscription_id=subscription_id,
                event_type='payment_failed',
                amount=amount_due,
                status='failed',
                description=f"Payment failed for ${amount_due} - subscription past due",
                created_at=now.isoformat()
            )
            
            self.billing_events.append(asdict(event))
            
            await self._save_billing_data()
            
            logger.warning(f"💳 Payment failed: {subscription_id[:8]} - ${amount_due}")
            
            return {
                'status': 'payment_failed',
                'amount_due': amount_due,
                'retry_date': (now + timedelta(days=3)).isoformat()
            }
    
    async def _process_payment(self, subscription_id: str, amount: float) -> bool:
        """Simulate payment processing (integrate with Stripe in production)"""
        # Simulate payment processing delay
        await asyncio.sleep(0.5)
        
        # Simulate 95% success rate
        import random
        return random.random() > 0.05
    
    async def get_client_dashboard(self, client_id: str) -> Dict:
        """Get complete client dashboard data"""
        
        if client_id not in self.clients:
            raise ValueError(f"Client not found: {client_id}")
        
        client = self.clients[client_id]
        
        # Get all subscriptions for client
        client_subscriptions = [
            self.subscriptions[sub_id] for sub_id in client.get('subscription_ids', [])
            if sub_id in self.subscriptions
        ]
        
        # Get recent billing events
        recent_events = [
            event for event in self.billing_events[-10:]
            if event['client_id'] == client_id
        ]
        
        # Calculate analytics
        total_usage = {}
        active_subscriptions = []
        
        for sub in client_subscriptions:
            if sub['status'] == 'active':
                active_subscriptions.append(sub)
                
                # Aggregate usage
                for usage_type, amount in sub['usage_metrics'].items():
                    if usage_type not in total_usage:
                        total_usage[usage_type] = 0
                    total_usage[usage_type] += amount
        
        return {
            'client_info': client,
            'active_subscriptions': len(active_subscriptions),
            'total_subscriptions': len(client_subscriptions),
            'current_plans': [sub['plan_id'] for sub in active_subscriptions],
            'monthly_spend': sum(self.subscription_plans[sub['plan_id']].price_monthly for sub in active_subscriptions),
            'usage_summary': total_usage,
            'recent_events': recent_events[-5:],
            'account_status': client.get('status', 'active'),
            'lifetime_value': client.get('lifetime_value', 0.0),
            'next_billing_dates': [sub['next_billing_date'] for sub in active_subscriptions]
        }
    
    async def upgrade_subscription(self, subscription_id: str, new_plan_id: str) -> Dict:
        """Upgrade subscription to higher tier"""
        
        if subscription_id not in self.subscriptions:
            raise ValueError(f"Subscription not found: {subscription_id}")
        
        if new_plan_id not in self.subscription_plans:
            raise ValueError(f"Invalid plan ID: {new_plan_id}")
        
        subscription = self.subscriptions[subscription_id]
        old_plan_id = subscription['plan_id']
        old_plan = self.subscription_plans[old_plan_id]
        new_plan = self.subscription_plans[new_plan_id]
        
        # Calculate prorated amount
        now = datetime.now()
        period_end = datetime.fromisoformat(subscription['current_period_end'])
        days_remaining = (period_end - now).days
        
        # Get pricing based on billing cycle
        billing_cycle = BillingCycle(subscription['billing_cycle'])
        if billing_cycle == BillingCycle.MONTHLY:
            old_price = old_plan.price_monthly
            new_price = new_plan.price_monthly
            days_in_cycle = 30
        elif billing_cycle == BillingCycle.QUARTERLY:
            old_price = old_plan.price_quarterly
            new_price = new_plan.price_quarterly
            days_in_cycle = 90
        else:  # Annual
            old_price = old_plan.price_annual
            new_price = new_plan.price_annual
            days_in_cycle = 365
        
        # Calculate proration
        daily_old_rate = old_price / days_in_cycle
        daily_new_rate = new_price / days_in_cycle
        
        credit_amount = daily_old_rate * days_remaining
        charge_amount = daily_new_rate * days_remaining
        net_amount = charge_amount - credit_amount
        
        # Update subscription
        subscription['plan_id'] = new_plan_id
        subscription['amount_due'] = new_price
        subscription['updated_at'] = now.isoformat()
        
        # Process upgrade payment if needed
        if net_amount > 0:
            payment_success = await self._process_payment(subscription_id, net_amount)
            if not payment_success:
                return {'status': 'payment_failed', 'amount_due': net_amount}
        
        # Create billing event
        event = BillingEvent(
            event_id=str(uuid.uuid4()),
            client_id=subscription['client_id'],
            subscription_id=subscription_id,
            event_type='subscription_upgraded',
            amount=net_amount,
            status='completed',
            description=f"Upgraded from {old_plan.name} to {new_plan.name}",
            created_at=now.isoformat(),
            metadata={'old_plan': old_plan_id, 'new_plan': new_plan_id, 'proration': net_amount}
        )
        
        self.billing_events.append(asdict(event))
        
        await self._save_billing_data()
        
        logger.info(f"⬆️ Subscription upgraded: {subscription_id[:8]} - {old_plan_id} → {new_plan_id}")
        
        return {
            'status': 'success',
            'old_plan': old_plan.name,
            'new_plan': new_plan.name,
            'prorated_amount': net_amount,
            'new_monthly_amount': new_price
        }
    
    async def cancel_subscription(self, subscription_id: str, immediate: bool = False) -> Dict:
        """Cancel subscription"""
        
        if subscription_id not in self.subscriptions:
            raise ValueError(f"Subscription not found: {subscription_id}")
        
        subscription = self.subscriptions[subscription_id]
        now = datetime.now()
        
        if immediate:
            # Cancel immediately
            subscription['status'] = SubscriptionStatus.CANCELED.value
            cancellation_date = now.isoformat()
        else:
            # Cancel at end of current period
            subscription['status'] = SubscriptionStatus.CANCELED.value
            cancellation_date = subscription['current_period_end']
        
        subscription['updated_at'] = now.isoformat()
        
        # Create billing event
        event = BillingEvent(
            event_id=str(uuid.uuid4()),
            client_id=subscription['client_id'],
            subscription_id=subscription_id,
            event_type='subscription_canceled',
            amount=0.0,
            status='completed',
            description=f"Subscription canceled {'immediately' if immediate else 'at period end'}",
            created_at=now.isoformat(),
            metadata={'immediate': immediate, 'effective_date': cancellation_date}
        )
        
        self.billing_events.append(asdict(event))
        
        await self._save_billing_data()
        
        logger.info(f"❌ Subscription canceled: {subscription_id[:8]} - {'immediate' if immediate else 'end of period'}")
        
        return {
            'status': 'success',
            'cancellation_type': 'immediate' if immediate else 'end_of_period',
            'effective_date': cancellation_date,
            'access_until': cancellation_date
        }
    
    async def _save_billing_data(self):
        """Save all billing data to files"""
        
        # Save clients
        clients_data = {
            'updated_at': datetime.now().isoformat(),
            'total_clients': len(self.clients),
            'clients': self.clients
        }
        
        async with aiofiles.open(self.clients_db, 'w') as f:
            await f.write(json.dumps(clients_data, indent=2, ensure_ascii=False))
        
        # Save subscriptions
        subscriptions_data = {
            'updated_at': datetime.now().isoformat(),
            'total_subscriptions': len(self.subscriptions),
            'subscriptions': self.subscriptions
        }
        
        async with aiofiles.open(self.subscriptions_db, 'w') as f:
            await f.write(json.dumps(subscriptions_data, indent=2, ensure_ascii=False))
        
        # Save billing events
        events_data = {
            'updated_at': datetime.now().isoformat(),
            'total_events': len(self.billing_events),
            'events': self.billing_events
        }
        
        async with aiofiles.open(self.billing_events_db, 'w') as f:
            await f.write(json.dumps(events_data, indent=2, ensure_ascii=False))

async def main():
    """Test the subscription billing system"""
    billing_system = SubscriptionBillingSystem()
    
    logger.info("🧪 Testing Subscription Billing System...")
    
    # Create test subscription
    result = await billing_system.create_subscription(
        client_email="test@example.com",
        client_name="Test Athlete",
        plan_id="professional",
        billing_cycle=BillingCycle.MONTHLY,
        trial_period=True
    )
    
    client_id = result['client_id']
    subscription_id = result['subscription_id']
    
    logger.info(f"✅ Subscription created: {subscription_id[:8]}")
    
    # Track some usage
    await billing_system.track_usage(subscription_id, "video_analyses", 5)
    await billing_system.track_usage(subscription_id, "tell_detector_analyses", 3)
    
    # Get client dashboard
    dashboard = await billing_system.get_client_dashboard(client_id)
    logger.info(f"📊 Dashboard: {dashboard['active_subscriptions']} active subscriptions")
    
    # Test upgrade
    upgrade_result = await billing_system.upgrade_subscription(subscription_id, "elite")
    logger.info(f"⬆️ Upgrade: {upgrade_result['status']}")
    
    logger.info("🎉 Subscription Billing System test completed!")

if __name__ == '__main__':
    asyncio.run(main())