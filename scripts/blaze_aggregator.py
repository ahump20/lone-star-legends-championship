#!/usr/bin/env python3
"""
Blaze Intelligence Data Aggregator
Unified ingestion pipeline for multi-league sports data with HAV-F metrics
"""

import json
import os
import time
import hashlib
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import logging
import requests
from dataclasses import dataclass, asdict
import jsonschema

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('blaze_aggregator')

# Load schema for validation
SCHEMA_PATH = os.path.join(os.path.dirname(__file__), '..', 'schemas', 'unified-player-schema.json')
with open(SCHEMA_PATH, 'r') as f:
    PLAYER_SCHEMA = json.load(f)

@dataclass
class HAVFMetrics:
    """HAV-F (Human Athletic Value Function) metrics"""
    championship_readiness: float  # 0-100
    cognitive_leverage: float      # 0-100
    nil_trust: float               # 0-100
    overall: float                 # 0-100

class BlazeAggregator:
    """Main aggregator class for Blaze Intelligence"""
    
    def __init__(self, cache_dir: str = './cache', output_dir: str = './public/data'):
        self.cache_dir = cache_dir
        self.output_dir = output_dir
        self.session = requests.Session()
        self.rate_limits = {
            'statcast': 0.5,      # 2 requests per second
            'nflverse': 1.0,      # 1 request per second
            'cfbd': 2.0,          # 0.5 requests per second
            'maxpreps': 3.0,      # 0.33 requests per second
            'on3': 5.0,           # 0.2 requests per second
            'international': 2.0   # 0.5 requests per second
        }
        self.last_request = {}
        
        # Create directories if they don't exist
        os.makedirs(cache_dir, exist_ok=True)
        os.makedirs(output_dir, exist_ok=True)
    
    def rate_limit(self, source: str):
        """Enforce rate limiting for API calls"""
        if source in self.last_request:
            elapsed = time.time() - self.last_request[source]
            wait_time = self.rate_limits.get(source, 1.0)
            if elapsed < wait_time:
                time.sleep(wait_time - elapsed)
        self.last_request[source] = time.time()
    
    def calculate_hav_f(self, player_data: Dict) -> HAVFMetrics:
        """
        Calculate HAV-F metrics for a player
        
        Championship Readiness (40% performance, 30% clutch, 30% health)
        Cognitive Leverage (35% decision speed, 35% pattern recognition, 30% adaptability)
        NIL Trust (40% social influence, 30% brand alignment, 30% market timing)
        """
        
        # Championship Readiness
        performance = self._calculate_performance_score(player_data)
        clutch = self._calculate_clutch_score(player_data)
        health = self._calculate_health_score(player_data)
        championship_readiness = (performance * 0.4 + clutch * 0.3 + health * 0.3)
        
        # Cognitive Leverage
        decision_speed = self._calculate_decision_speed(player_data)
        pattern_recognition = self._calculate_pattern_recognition(player_data)
        adaptability = self._calculate_adaptability(player_data)
        cognitive_leverage = (decision_speed * 0.35 + pattern_recognition * 0.35 + adaptability * 0.3)
        
        # NIL Trust
        social_influence = self._calculate_social_influence(player_data)
        brand_alignment = self._calculate_brand_alignment(player_data)
        market_timing = self._calculate_market_timing(player_data)
        nil_trust = (social_influence * 0.4 + brand_alignment * 0.3 + market_timing * 0.3)
        
        # Overall HAV-F (weighted average)
        overall = (championship_readiness * 0.4 + cognitive_leverage * 0.3 + nil_trust * 0.3)
        
        return HAVFMetrics(
            championship_readiness=round(championship_readiness, 2),
            cognitive_leverage=round(cognitive_leverage, 2),
            nil_trust=round(nil_trust, 2),
            overall=round(overall, 2)
        )
    
    def _calculate_performance_score(self, player_data: Dict) -> float:
        """Calculate performance component of championship readiness"""
        stats = player_data.get('2024_stats', {})
        
        # Base on WAR equivalent or efficiency rating
        war = stats.get('war_equivalent', 0)
        efficiency = stats.get('efficiency_rating', 0)
        
        # Normalize to 0-100 scale
        if war > 0:
            score = min(100, war * 10)  # 10 WAR = 100 score
        elif efficiency > 0:
            score = min(100, efficiency)
        else:
            score = 50  # Default average
        
        return score
    
    def _calculate_clutch_score(self, player_data: Dict) -> float:
        """Calculate clutch performance score"""
        stats = player_data.get('2024_stats', {})
        raw_stats = stats.get('raw_stats', {})
        
        # Look for clutch metrics (late & close, 4th quarter, etc.)
        clutch_metrics = [
            raw_stats.get('late_and_close_avg', 0),
            raw_stats.get('fourth_quarter_rating', 0),
            raw_stats.get('two_minute_drill_success', 0),
            raw_stats.get('elimination_game_performance', 0)
        ]
        
        # Average non-zero clutch metrics
        valid_metrics = [m for m in clutch_metrics if m > 0]
        if valid_metrics:
            return min(100, sum(valid_metrics) / len(valid_metrics))
        return 60  # Default slightly above average
    
    def _calculate_health_score(self, player_data: Dict) -> float:
        """Calculate health/durability score"""
        injury_history = player_data.get('injury_history', [])
        age = player_data.get('age', 25)
        
        # Start with perfect health
        score = 100
        
        # Deduct for injuries
        for injury in injury_history:
            severity = injury.get('severity', 'minor')
            if severity == 'minor':
                score -= 5
            elif severity == 'moderate':
                score -= 10
            elif severity == 'major':
                score -= 20
            elif severity == 'career-threatening':
                score -= 40
        
        # Age adjustment
        if age > 32:
            score -= (age - 32) * 2
        elif age < 20:
            score -= (20 - age) * 3
        
        return max(0, score)
    
    def _calculate_decision_speed(self, player_data: Dict) -> float:
        """Calculate decision-making speed score"""
        position = player_data.get('position', '')
        stats = player_data.get('2024_stats', {}).get('raw_stats', {})
        
        # Position-specific metrics
        if position in ['QB', 'PG', 'C']:  # Decision-making positions
            time_to_throw = stats.get('time_to_throw', 3.0)
            assist_to_turnover = stats.get('assist_to_turnover_ratio', 1.0)
            
            # Faster decisions = higher score
            if time_to_throw < 3.0:
                score = 80 + (3.0 - time_to_throw) * 20
            else:
                score = 70
            
            # Adjust for decision quality
            score = min(100, score * (assist_to_turnover / 2))
        else:
            # Default based on reaction metrics
            score = 70
        
        return score
    
    def _calculate_pattern_recognition(self, player_data: Dict) -> float:
        """Calculate pattern recognition ability"""
        stats = player_data.get('2024_stats', {}).get('raw_stats', {})
        
        # Look for anticipation metrics
        metrics = [
            stats.get('on_base_percentage', 0) * 100,  # Plate discipline
            stats.get('completion_percentage', 0),      # Read accuracy
            stats.get('steal_success_rate', 0),         # Timing
            stats.get('defensive_rating', 0)            # Positioning
        ]
        
        valid = [m for m in metrics if m > 0]
        if valid:
            return min(100, sum(valid) / len(valid))
        return 65
    
    def _calculate_adaptability(self, player_data: Dict) -> float:
        """Calculate adaptability score"""
        # Look at performance variance and improvement
        stats_2024 = player_data.get('2024_stats', {})
        projection_2025 = player_data.get('2025_projection', {})
        
        # Breakout probability indicates adaptability
        breakout = projection_2025.get('breakout_probability', 0.3)
        
        # Convert to 0-100 scale
        score = 50 + (breakout * 100)
        
        return min(100, score)
    
    def _calculate_social_influence(self, player_data: Dict) -> float:
        """Calculate social media influence score"""
        nil_profile = player_data.get('NIL_profile', {})
        social = nil_profile.get('social_following', {})
        
        total_following = social.get('total', 0)
        
        # Logarithmic scale for followers
        if total_following > 1000000:
            score = 100
        elif total_following > 100000:
            score = 80 + (total_following / 1000000) * 20
        elif total_following > 10000:
            score = 60 + (total_following / 100000) * 20
        elif total_following > 1000:
            score = 40 + (total_following / 10000) * 20
        else:
            score = total_following / 1000 * 40
        
        return min(100, score)
    
    def _calculate_brand_alignment(self, player_data: Dict) -> float:
        """Calculate brand alignment score"""
        nil_profile = player_data.get('NIL_profile', {})
        endorsements = nil_profile.get('endorsements', [])
        marketability = nil_profile.get('marketability_score', 50)
        
        # Base on marketability and endorsement count
        endorsement_score = min(50, len(endorsements) * 10)
        
        return (marketability * 0.5 + endorsement_score)
    
    def _calculate_market_timing(self, player_data: Dict) -> float:
        """Calculate market timing score"""
        age = player_data.get('age', 25)
        league = player_data.get('league', '')
        
        # Optimal age ranges by league
        optimal_ages = {
            'NFL': (22, 28),
            'NBA': (21, 27),
            'MLB': (23, 30),
            'NCAA_FB': (19, 22),
            'NCAA_BB': (19, 22),
            'HS_FB': (16, 18),
            'HS_BB': (16, 18)
        }
        
        min_age, max_age = optimal_ages.get(league, (20, 30))
        
        if min_age <= age <= max_age:
            # Peak market timing
            score = 90
        elif age < min_age:
            # Rising market
            score = 70 + (age - min_age + 5) * 4
        else:
            # Declining market
            score = 90 - (age - max_age) * 5
        
        return max(0, min(100, score))
    
    def validate_player_data(self, player_data: Dict) -> bool:
        """Validate player data against schema"""
        try:
            jsonschema.validate(player_data, PLAYER_SCHEMA)
            return True
        except jsonschema.ValidationError as e:
            logger.error(f"Validation error: {e.message}")
            return False
    
    def normalize_player_data(self, raw_data: Dict, league: str) -> Dict:
        """Normalize raw player data to unified schema"""
        player_id = hashlib.md5(f"{raw_data.get('name', '')}_{league}".encode()).hexdigest()[:12]
        
        normalized = {
            'player_id': player_id,
            'name': raw_data.get('name', 'Unknown'),
            'team': raw_data.get('team', 'Unknown'),
            'league': league,
            'position': raw_data.get('position', 'Unknown'),
            'age': raw_data.get('age', 25),
            'height': raw_data.get('height', "6'0\""),
            'weight': raw_data.get('weight', 200),
            '2024_stats': self._normalize_stats(raw_data.get('stats', {}), league),
            '2025_projection': self._project_stats(raw_data.get('stats', {}), league),
            'NIL_profile': self._create_nil_profile(raw_data),
            'scouting_notes': {
                'strengths': [],
                'weaknesses': [],
                'comparisons': [],
                'development_path': 'Standard progression'
            },
            'last_updated': datetime.now().isoformat(),
            'data_sources': [raw_data.get('source', 'Unknown')]
        }
        
        # Calculate HAV-F metrics
        hav_f = self.calculate_hav_f(normalized)
        normalized['HAV_F'] = asdict(hav_f)
        
        return normalized
    
    def _normalize_stats(self, raw_stats: Dict, league: str) -> Dict:
        """Normalize statistics based on league"""
        normalized = {
            'games_played': raw_stats.get('games', 0),
            'raw_stats': raw_stats
        }
        
        # League-specific normalization
        if league == 'MLB':
            normalized['primary_metric'] = raw_stats.get('avg', 0)
            normalized['secondary_metric'] = raw_stats.get('ops', 0)
            normalized['war_equivalent'] = raw_stats.get('war', 0)
            normalized['efficiency_rating'] = raw_stats.get('wrc_plus', 100)
        elif league == 'NFL':
            normalized['primary_metric'] = raw_stats.get('yards', 0)
            normalized['secondary_metric'] = raw_stats.get('touchdowns', 0)
            normalized['war_equivalent'] = raw_stats.get('epa', 0) / 10
            normalized['efficiency_rating'] = raw_stats.get('passer_rating', 0)
        elif league == 'NBA':
            normalized['primary_metric'] = raw_stats.get('ppg', 0)
            normalized['secondary_metric'] = raw_stats.get('per', 0)
            normalized['war_equivalent'] = raw_stats.get('vorp', 0)
            normalized['efficiency_rating'] = raw_stats.get('per', 15)
        else:
            # Default normalization
            normalized['primary_metric'] = 0
            normalized['secondary_metric'] = 0
            normalized['war_equivalent'] = 0
            normalized['efficiency_rating'] = 50
        
        return normalized
    
    def _project_stats(self, current_stats: Dict, league: str) -> Dict:
        """Project 2025 statistics based on 2024 performance"""
        # Simple projection: slight regression to mean
        projection = {
            'games_projected': current_stats.get('games', 0),
            'primary_metric': current_stats.get('primary', 0) * 0.95,
            'secondary_metric': current_stats.get('secondary', 0) * 0.95,
            'breakout_probability': 0.2,
            'injury_risk': 0.15,
            'confidence_interval': {
                'lower': 0.8,
                'upper': 1.1
            }
        }
        
        return projection
    
    def _create_nil_profile(self, raw_data: Dict) -> Dict:
        """Create NIL profile for player"""
        return {
            'current_value': raw_data.get('nil_value', 0),
            'projected_value': raw_data.get('nil_value', 0) * 1.2,
            'social_following': {
                'instagram': raw_data.get('instagram_followers', 0),
                'twitter': raw_data.get('twitter_followers', 0),
                'tiktok': raw_data.get('tiktok_followers', 0),
                'total': raw_data.get('total_followers', 0)
            },
            'endorsements': [],
            'marketability_score': raw_data.get('marketability', 50)
        }
    
    def aggregate_all_leagues(self) -> Dict[str, List[Dict]]:
        """Main aggregation function for all leagues"""
        all_players = []
        
        # League-specific ingestion (simplified for example)
        leagues = ['MLB', 'NFL', 'NBA', 'NCAA_FB', 'HS_FB']
        
        for league in leagues:
            logger.info(f"Ingesting {league} data...")
            players = self.ingest_league(league)
            all_players.extend(players)
            logger.info(f"Processed {len(players)} {league} players")
        
        # Sort by HAV-F overall score
        all_players.sort(key=lambda x: x['HAV_F']['overall'], reverse=True)
        
        return {
            'players': all_players,
            'metadata': {
                'total_players': len(all_players),
                'leagues': leagues,
                'last_updated': datetime.now().isoformat(),
                'schema_version': '1.0.0'
            }
        }
    
    def ingest_league(self, league: str) -> List[Dict]:
        """Ingest data for a specific league"""
        players = []
        
        # This would normally fetch from APIs
        # For now, create sample data
        sample_player = {
            'name': f'Sample Player {league}',
            'team': f'{league} Team',
            'position': 'POS',
            'age': 25,
            'stats': {
                'games': 82,
                'primary': 20.5,
                'secondary': 5.2
            }
        }
        
        normalized = self.normalize_player_data(sample_player, league)
        if self.validate_player_data(normalized):
            players.append(normalized)
        
        return players
    
    def save_to_file(self, data: Dict, filename: str = 'player_data_2025.json'):
        """Save aggregated data to file"""
        output_path = os.path.join(self.output_dir, filename)
        
        with open(output_path, 'w') as f:
            json.dump(data, f, indent=2)
        
        logger.info(f"Saved {len(data['players'])} players to {output_path}")

def main():
    """Main execution function"""
    aggregator = BlazeAggregator()
    
    logger.info("Starting Blaze Intelligence data aggregation...")
    
    # Aggregate all leagues
    data = aggregator.aggregate_all_leagues()
    
    # Save to file
    aggregator.save_to_file(data)
    
    logger.info("Aggregation complete!")
    
    # Print top 10 players by HAV-F score
    print("\nTop 10 Players by HAV-F Score:")
    for i, player in enumerate(data['players'][:10], 1):
        print(f"{i}. {player['name']} ({player['league']}) - HAV-F: {player['HAV_F']['overall']}")

if __name__ == '__main__':
    main()