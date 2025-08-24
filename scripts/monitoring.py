#!/usr/bin/env python3
"""
Monitoring and alerting system for Blaze Intelligence ingestion pipeline
Tracks agent health, data freshness, and performance metrics
"""

import json
import time
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import requests
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger('blaze_monitoring')

class Severity(Enum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"

@dataclass
class HealthCheck:
    """Health check result for an agent"""
    agent_id: str
    status: str  # healthy, degraded, unhealthy
    latency: float
    success_rate: float
    data_freshness: int  # seconds since last update
    errors: List[str]
    timestamp: datetime

@dataclass
class Alert:
    """Alert for monitoring issues"""
    agent_id: str
    severity: Severity
    message: str
    details: Dict
    timestamp: datetime
    resolved: bool = False

class BlazeMonitor:
    """Main monitoring class for Blaze Intelligence"""
    
    def __init__(self, manifest_path: str = './agents/blaze-ingestion-manifest.json'):
        with open(manifest_path, 'r') as f:
            self.manifest = json.load(f)
        
        self.agents = self.manifest['agents']
        self.monitoring_config = self.manifest['monitoring']
        self.metrics = {}
        self.alerts = []
        self.health_history = {}
        
        # Initialize metrics storage
        for agent in self.agents:
            self.metrics[agent['id']] = {
                'total_runs': 0,
                'successful_runs': 0,
                'failed_runs': 0,
                'total_latency': 0,
                'last_run': None,
                'last_success': None,
                'errors': []
            }
    
    def check_agent_health(self, agent_id: str) -> HealthCheck:
        """Check health of a specific agent"""
        agent = next((a for a in self.agents if a['id'] == agent_id), None)
        if not agent:
            raise ValueError(f"Agent {agent_id} not found")
        
        metrics = self.metrics[agent_id]
        monitoring = agent['monitoring']
        
        # Calculate success rate
        total_runs = metrics['total_runs']
        if total_runs > 0:
            success_rate = metrics['successful_runs'] / total_runs
        else:
            success_rate = 1.0  # No runs yet, assume healthy
        
        # Calculate average latency
        if metrics['successful_runs'] > 0:
            avg_latency = metrics['total_latency'] / metrics['successful_runs']
        else:
            avg_latency = 0
        
        # Calculate data freshness
        if metrics['last_success']:
            data_freshness = (datetime.now() - metrics['last_success']).total_seconds()
        else:
            data_freshness = float('inf')
        
        # Determine health status
        errors = []
        status = 'healthy'
        
        if success_rate < monitoring['success_threshold']:
            status = 'degraded' if success_rate > 0.5 else 'unhealthy'
            errors.append(f"Success rate {success_rate:.2%} below threshold {monitoring['success_threshold']:.0%}")
        
        if avg_latency > monitoring['latency_threshold']:
            status = 'degraded' if status == 'healthy' else status
            errors.append(f"Latency {avg_latency:.1f}s exceeds threshold {monitoring['latency_threshold']}s")
        
        if data_freshness > monitoring['data_freshness']:
            status = 'unhealthy' if data_freshness > monitoring['data_freshness'] * 2 else 'degraded'
            errors.append(f"Data {data_freshness/3600:.1f}h old, exceeds freshness {monitoring['data_freshness']/3600:.1f}h")
        
        return HealthCheck(
            agent_id=agent_id,
            status=status,
            latency=avg_latency,
            success_rate=success_rate,
            data_freshness=int(data_freshness),
            errors=errors,
            timestamp=datetime.now()
        )
    
    def record_run(self, agent_id: str, success: bool, latency: float, error: Optional[str] = None):
        """Record an agent run result"""
        metrics = self.metrics[agent_id]
        
        metrics['total_runs'] += 1
        metrics['last_run'] = datetime.now()
        
        if success:
            metrics['successful_runs'] += 1
            metrics['total_latency'] += latency
            metrics['last_success'] = datetime.now()
        else:
            metrics['failed_runs'] += 1
            if error:
                metrics['errors'].append({
                    'timestamp': datetime.now().isoformat(),
                    'error': error
                })
                # Keep only last 100 errors
                metrics['errors'] = metrics['errors'][-100:]
    
    def check_all_agents(self) -> List[HealthCheck]:
        """Check health of all agents"""
        health_checks = []
        
        for agent in self.agents:
            try:
                health = self.check_agent_health(agent['id'])
                health_checks.append(health)
                
                # Store in history
                if agent['id'] not in self.health_history:
                    self.health_history[agent['id']] = []
                self.health_history[agent['id']].append(health)
                
                # Keep only last 1000 health checks per agent
                self.health_history[agent['id']] = self.health_history[agent['id']][-1000:]
                
            except Exception as e:
                logger.error(f"Error checking health for {agent['id']}: {e}")
        
        return health_checks
    
    def generate_alerts(self, health_checks: List[HealthCheck]) -> List[Alert]:
        """Generate alerts based on health checks"""
        new_alerts = []
        
        for health in health_checks:
            if health.status == 'unhealthy':
                severity = Severity.CRITICAL
            elif health.status == 'degraded':
                severity = Severity.WARNING
            else:
                continue  # No alert for healthy agents
            
            # Check if we already have an unresolved alert for this issue
            existing_alert = next(
                (a for a in self.alerts 
                 if a.agent_id == health.agent_id 
                 and not a.resolved 
                 and a.severity == severity),
                None
            )
            
            if not existing_alert:
                alert = Alert(
                    agent_id=health.agent_id,
                    severity=severity,
                    message=f"Agent {health.agent_id} is {health.status}",
                    details={
                        'errors': health.errors,
                        'success_rate': health.success_rate,
                        'latency': health.latency,
                        'data_freshness': health.data_freshness
                    },
                    timestamp=datetime.now()
                )
                new_alerts.append(alert)
                self.alerts.append(alert)
        
        return new_alerts
    
    def send_alerts(self, alerts: List[Alert]):
        """Send alerts to configured channels"""
        for alert in alerts:
            for channel in self.monitoring_config['alert_channels']:
                if alert.severity.value in channel['severity']:
                    self._send_to_channel(alert, channel)
    
    def _send_to_channel(self, alert: Alert, channel: Dict):
        """Send alert to specific channel"""
        if channel['type'] == 'email':
            self._send_email_alert(alert, channel['address'])
        elif channel['type'] == 'notion':
            self._send_notion_alert(alert, channel['database_id'])
        elif channel['type'] == 'slack':
            self._send_slack_alert(alert, channel['webhook'])
    
    def _send_email_alert(self, alert: Alert, address: str):
        """Send email alert (placeholder)"""
        logger.info(f"Would send email to {address}: {alert.message}")
    
    def _send_notion_alert(self, alert: Alert, database_id: str):
        """Send alert to Notion database"""
        # This would use Notion API
        logger.info(f"Would create Notion entry in {database_id}: {alert.message}")
    
    def _send_slack_alert(self, alert: Alert, webhook: str):
        """Send alert to Slack"""
        try:
            payload = {
                'text': f":warning: *{alert.severity.value.upper()}*: {alert.message}",
                'attachments': [{
                    'color': 'danger' if alert.severity == Severity.CRITICAL else 'warning',
                    'fields': [
                        {'title': 'Agent', 'value': alert.agent_id, 'short': True},
                        {'title': 'Time', 'value': alert.timestamp.strftime('%Y-%m-%d %H:%M:%S'), 'short': True},
                        {'title': 'Details', 'value': json.dumps(alert.details, indent=2), 'short': False}
                    ]
                }]
            }
            requests.post(webhook, json=payload)
        except Exception as e:
            logger.error(f"Failed to send Slack alert: {e}")
    
    def get_dashboard_data(self) -> Dict:
        """Get monitoring dashboard data"""
        health_checks = self.check_all_agents()
        
        # Calculate overall system health
        healthy_count = sum(1 for h in health_checks if h.status == 'healthy')
        degraded_count = sum(1 for h in health_checks if h.status == 'degraded')
        unhealthy_count = sum(1 for h in health_checks if h.status == 'unhealthy')
        
        system_health = 'healthy'
        if unhealthy_count > 0:
            system_health = 'unhealthy'
        elif degraded_count > len(health_checks) / 4:
            system_health = 'degraded'
        
        # Calculate SLA compliance
        total_uptime = sum(m['successful_runs'] for m in self.metrics.values())
        total_runs = sum(m['total_runs'] for m in self.metrics.values())
        uptime_percentage = (total_uptime / total_runs * 100) if total_runs > 0 else 100
        
        sla_compliant = uptime_percentage >= self.monitoring_config['sla']['uptime'] * 100
        
        return {
            'timestamp': datetime.now().isoformat(),
            'system_health': system_health,
            'agent_count': {
                'total': len(self.agents),
                'healthy': healthy_count,
                'degraded': degraded_count,
                'unhealthy': unhealthy_count
            },
            'sla': {
                'compliant': sla_compliant,
                'uptime': uptime_percentage,
                'target': self.monitoring_config['sla']['uptime'] * 100
            },
            'recent_alerts': [
                {
                    'agent_id': a.agent_id,
                    'severity': a.severity.value,
                    'message': a.message,
                    'timestamp': a.timestamp.isoformat()
                }
                for a in self.alerts[-10:]  # Last 10 alerts
            ],
            'agent_health': [
                {
                    'agent_id': h.agent_id,
                    'status': h.status,
                    'success_rate': h.success_rate,
                    'latency': h.latency,
                    'data_age_hours': h.data_freshness / 3600
                }
                for h in health_checks
            ]
        }
    
    def run_continuous_monitoring(self, interval: int = 60):
        """Run continuous monitoring loop"""
        logger.info(f"Starting continuous monitoring with {interval}s interval")
        
        while True:
            try:
                # Check all agents
                health_checks = self.check_all_agents()
                
                # Generate alerts
                new_alerts = self.generate_alerts(health_checks)
                
                # Send alerts
                if new_alerts:
                    self.send_alerts(new_alerts)
                    logger.warning(f"Generated {len(new_alerts)} new alerts")
                
                # Log summary
                healthy = sum(1 for h in health_checks if h.status == 'healthy')
                logger.info(f"Health check complete: {healthy}/{len(health_checks)} agents healthy")
                
                # Sleep until next check
                time.sleep(interval)
                
            except KeyboardInterrupt:
                logger.info("Monitoring stopped by user")
                break
            except Exception as e:
                logger.error(f"Monitoring error: {e}")
                time.sleep(interval)

def main():
    """Main monitoring function"""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    monitor = BlazeMonitor()
    
    # Run continuous monitoring
    monitor.run_continuous_monitoring(interval=60)

if __name__ == '__main__':
    main()