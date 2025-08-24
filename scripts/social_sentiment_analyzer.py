#!/usr/bin/env python3
"""
Social Sentiment Analysis Engine for Blaze Intelligence
Real-time NIL trust monitoring through social media and brand sentiment analysis
"""

import json
import logging
import re
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from pathlib import Path
import hashlib
import numpy as np

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('blaze_sentiment')

class BlazeSentimentAnalyzer:
    """Social sentiment analysis engine for NIL trust evaluation"""
    
    def __init__(self):
        self.platforms = ['twitter', 'instagram', 'tiktok', 'youtube', 'reddit']
        self.sentiment_cache = {}
        self.brand_safety_keywords = self._load_brand_safety_keywords()
        self.nil_engagement_multipliers = {
            'twitter': 1.2,
            'instagram': 1.5,
            'tiktok': 2.0,
            'youtube': 1.8,
            'reddit': 0.9
        }
        
    def _load_brand_safety_keywords(self) -> Dict:
        """Load brand safety and risk keywords for sentiment analysis"""
        return {
            'positive': [
                'champion', 'winner', 'clutch', 'leader', 'inspiration', 'dedicated',
                'hardworking', 'team player', 'role model', 'community', 'charitable',
                'academic excellence', 'scholar athlete', 'integrity', 'respect'
            ],
            'negative': [
                'controversy', 'suspension', 'arrest', 'violation', 'scandal',
                'inappropriate', 'misconduct', 'penalty', 'fine', 'investigation',
                'disciplinary', 'problematic', 'toxic', 'unprofessional'
            ],
            'neutral': [
                'training', 'practice', 'workout', 'game', 'season', 'draft',
                'stats', 'performance', 'highlights', 'interview', 'press conference'
            ],
            'risk_factors': [
                'legal issue', 'ncaa violation', 'eligibility', 'academic trouble',
                'injury concern', 'attitude problem', 'locker room issue'
            ]
        }
    
    def analyze_player_sentiment(self, player_data: Dict) -> Dict:
        """
        Analyze social sentiment for a single player
        
        Args:
            player_data: Player information including social handles
            
        Returns:
            Comprehensive sentiment analysis including NIL trust factors
        """
        player_name = player_data.get('name', 'Unknown')
        logger.info(f"📱 Analyzing social sentiment for {player_name}")
        
        # Check cache first
        cache_key = self._generate_cache_key(player_data)
        if cache_key in self.sentiment_cache:
            cached_result = self.sentiment_cache[cache_key]
            if self._is_cache_fresh(cached_result):
                logger.info("📋 Returning cached sentiment analysis")
                return cached_result
        
        sentiment_analysis = {
            'player_id': player_data.get('player_id', player_data.get('id')),
            'player_name': player_name,
            'analyzed_at': datetime.now().isoformat(),
            'analysis_period': '30_days',
            'overall_sentiment_score': 0.0,
            'nil_trust_factors': {},
            'platform_breakdown': {},
            'risk_assessment': {},
            'brand_safety_score': 0.0,
            'engagement_quality': {},
            'trend_analysis': {}
        }
        
        # Simulate platform-specific analysis
        for platform in self.platforms:
            platform_analysis = self._analyze_platform_sentiment(
                player_data, platform, player_name
            )
            sentiment_analysis['platform_breakdown'][platform] = platform_analysis
        
        # Calculate overall metrics
        sentiment_analysis.update(self._calculate_overall_metrics(sentiment_analysis))
        
        # Perform NIL-specific analysis
        sentiment_analysis['nil_trust_factors'] = self._analyze_nil_factors(
            sentiment_analysis, player_data
        )
        
        # Risk assessment
        sentiment_analysis['risk_assessment'] = self._assess_sentiment_risks(
            sentiment_analysis
        )
        
        # Cache the results
        self.sentiment_cache[cache_key] = sentiment_analysis
        
        return sentiment_analysis
    
    def _analyze_platform_sentiment(self, player_data: Dict, platform: str, player_name: str) -> Dict:
        """Analyze sentiment for a specific social media platform"""
        
        # Simulate platform-specific metrics
        base_sentiment = np.random.uniform(-1.0, 1.0)
        follower_count = self._estimate_followers(platform, player_data.get('league', 'NCAA'))
        
        platform_analysis = {
            'follower_count': follower_count,
            'avg_engagement_rate': round(np.random.uniform(0.02, 0.12), 4),
            'sentiment_score': round(base_sentiment, 3),
            'post_frequency': np.random.randint(1, 15),  # posts per week
            'content_quality_score': round(np.random.uniform(0.4, 0.9), 3),
            'brand_mentions': np.random.randint(0, 8),
            'controversial_content': np.random.choice([0, 1, 2], p=[0.7, 0.25, 0.05]),
            'positive_keywords_found': np.random.randint(5, 20),
            'negative_keywords_found': np.random.randint(0, 5),
            'authenticity_score': round(np.random.uniform(0.6, 0.95), 3)
        }
        
        # Platform-specific adjustments
        if platform == 'tiktok':
            platform_analysis['viral_content_count'] = np.random.randint(0, 3)
            platform_analysis['trend_participation'] = round(np.random.uniform(0.2, 0.8), 3)
        elif platform == 'instagram':
            platform_analysis['story_engagement'] = round(np.random.uniform(0.05, 0.25), 4)
            platform_analysis['brand_partnerships'] = np.random.randint(0, 5)
        elif platform == 'twitter':
            platform_analysis['retweet_ratio'] = round(np.random.uniform(0.1, 0.4), 3)
            platform_analysis['reply_sentiment'] = round(np.random.uniform(-0.5, 0.8), 3)
        
        return platform_analysis
    
    def _estimate_followers(self, platform: str, league: str) -> int:
        """Estimate follower count based on platform and league"""
        base_followers = {
            'MLB': {'twitter': 50000, 'instagram': 80000, 'tiktok': 100000, 'youtube': 25000, 'reddit': 5000},
            'NFL': {'twitter': 75000, 'instagram': 120000, 'tiktok': 200000, 'youtube': 40000, 'reddit': 8000},
            'NCAA': {'twitter': 15000, 'instagram': 25000, 'tiktok': 50000, 'youtube': 8000, 'reddit': 2000},
            'HS': {'twitter': 3000, 'instagram': 8000, 'tiktok': 15000, 'youtube': 1000, 'reddit': 500}
        }
        
        base = base_followers.get(league, base_followers['NCAA']).get(platform, 10000)
        # Add random variation
        multiplier = np.random.uniform(0.3, 3.0)
        return int(base * multiplier)
    
    def _calculate_overall_metrics(self, sentiment_analysis: Dict) -> Dict:
        """Calculate overall sentiment metrics from platform data"""
        platforms = sentiment_analysis['platform_breakdown']
        
        if not platforms:
            return {
                'overall_sentiment_score': 0.0,
                'brand_safety_score': 0.5,
                'total_followers': 0,
                'weighted_engagement': 0.0
            }
        
        # Calculate weighted sentiment score
        total_followers = sum(p['follower_count'] for p in platforms.values())
        weighted_sentiment = 0.0
        
        for platform, data in platforms.items():
            if total_followers > 0:
                weight = data['follower_count'] / total_followers
                weighted_sentiment += data['sentiment_score'] * weight
        
        # Calculate brand safety score
        total_positive = sum(p['positive_keywords_found'] for p in platforms.values())
        total_negative = sum(p['negative_keywords_found'] for p in platforms.values())
        controversial_count = sum(p['controversial_content'] for p in platforms.values())
        
        brand_safety = 0.5  # Base score
        if total_positive + total_negative > 0:
            brand_safety = total_positive / (total_positive + total_negative + controversial_count * 2)
        
        # Calculate engagement quality
        avg_engagement = np.mean([p['avg_engagement_rate'] for p in platforms.values()])
        avg_authenticity = np.mean([p['authenticity_score'] for p in platforms.values()])
        
        return {
            'overall_sentiment_score': round(weighted_sentiment, 3),
            'brand_safety_score': round(brand_safety, 3),
            'total_followers': total_followers,
            'weighted_engagement': round(avg_engagement * avg_authenticity, 4)
        }
    
    def _analyze_nil_factors(self, sentiment_analysis: Dict, player_data: Dict) -> Dict:
        """Analyze NIL-specific trust and marketability factors"""
        
        platforms = sentiment_analysis['platform_breakdown']
        league = player_data.get('league', 'NCAA')
        
        # NIL marketability factors
        nil_factors = {
            'marketability_score': 0.0,
            'brand_partnership_potential': 'Low',
            'audience_demographics': self._analyze_audience_demographics(platforms),
            'content_consistency': 0.0,
            'controversy_risk': 'Low',
            'nil_mention_sentiment': 0.0,
            'endorsement_readiness': False
        }
        
        # Calculate marketability score
        follower_weight = min(sentiment_analysis['total_followers'] / 100000, 1.0)  # Cap at 100k
        engagement_weight = sentiment_analysis['weighted_engagement'] * 10  # Scale to 0-1
        sentiment_weight = (sentiment_analysis['overall_sentiment_score'] + 1) / 2  # Scale -1,1 to 0,1
        brand_safety_weight = sentiment_analysis['brand_safety_score']
        
        marketability = (follower_weight * 0.3 + engagement_weight * 0.25 + 
                        sentiment_weight * 0.25 + brand_safety_weight * 0.2)
        nil_factors['marketability_score'] = round(marketability, 3)
        
        # Determine brand partnership potential
        if marketability >= 0.8:
            nil_factors['brand_partnership_potential'] = 'Elite'
        elif marketability >= 0.6:
            nil_factors['brand_partnership_potential'] = 'High'
        elif marketability >= 0.4:
            nil_factors['brand_partnership_potential'] = 'Medium'
        else:
            nil_factors['brand_partnership_potential'] = 'Low'
        
        # Content consistency analysis
        post_frequencies = [p['post_frequency'] for p in platforms.values()]
        content_scores = [p['content_quality_score'] for p in platforms.values()]
        
        consistency = np.std(post_frequencies) < 5 and np.mean(content_scores) > 0.6
        nil_factors['content_consistency'] = round(np.mean(content_scores), 3)
        nil_factors['endorsement_readiness'] = consistency and marketability > 0.5
        
        # Controversy risk assessment
        total_controversial = sum(p['controversial_content'] for p in platforms.values())
        if total_controversial >= 3:
            nil_factors['controversy_risk'] = 'High'
        elif total_controversial >= 1:
            nil_factors['controversy_risk'] = 'Medium'
        else:
            nil_factors['controversy_risk'] = 'Low'
        
        # NIL-specific sentiment (simulate analysis of NIL-related posts)
        nil_factors['nil_mention_sentiment'] = round(np.random.uniform(-0.2, 0.8), 3)
        
        return nil_factors
    
    def _analyze_audience_demographics(self, platforms: Dict) -> Dict:
        """Analyze audience demographics across platforms"""
        return {
            'primary_age_group': np.random.choice(['13-17', '18-24', '25-34', '35-44'], p=[0.2, 0.4, 0.3, 0.1]),
            'gender_split': {
                'male': round(np.random.uniform(0.4, 0.7), 2),
                'female': round(np.random.uniform(0.3, 0.6), 2)
            },
            'geographic_concentration': {
                'local_market': round(np.random.uniform(0.3, 0.6), 2),
                'national': round(np.random.uniform(0.3, 0.5), 2),
                'international': round(np.random.uniform(0.05, 0.2), 2)
            },
            'engagement_quality': np.random.choice(['High', 'Medium', 'Low'], p=[0.3, 0.5, 0.2])
        }
    
    def _assess_sentiment_risks(self, sentiment_analysis: Dict) -> Dict:
        """Assess potential risks from sentiment analysis"""
        risks = {
            'overall_risk_level': 'Low',
            'specific_risks': [],
            'risk_score': 0.0,
            'monitoring_recommendations': []
        }
        
        # Calculate risk score
        risk_factors = 0
        
        if sentiment_analysis['overall_sentiment_score'] < -0.3:
            risk_factors += 2
            risks['specific_risks'].append('Negative public sentiment')
        
        if sentiment_analysis['brand_safety_score'] < 0.4:
            risk_factors += 3
            risks['specific_risks'].append('Brand safety concerns')
        
        controversial_count = sum(
            p['controversial_content'] for p in sentiment_analysis['platform_breakdown'].values()
        )
        if controversial_count >= 2:
            risk_factors += 2
            risks['specific_risks'].append('Controversial content history')
        
        # Assess engagement authenticity
        avg_authenticity = np.mean([
            p['authenticity_score'] for p in sentiment_analysis['platform_breakdown'].values()
        ])
        if avg_authenticity < 0.6:
            risk_factors += 1
            risks['specific_risks'].append('Questionable engagement authenticity')
        
        # Determine overall risk level
        risks['risk_score'] = min(risk_factors / 8.0, 1.0)
        
        if risks['risk_score'] >= 0.7:
            risks['overall_risk_level'] = 'High'
        elif risks['risk_score'] >= 0.4:
            risks['overall_risk_level'] = 'Medium'
        else:
            risks['overall_risk_level'] = 'Low'
        
        # Generate monitoring recommendations
        if risks['risk_score'] > 0.3:
            risks['monitoring_recommendations'].extend([
                'Increase social media monitoring frequency',
                'Review content approval processes',
                'Consider social media training'
            ])
        
        return risks
    
    def _generate_cache_key(self, player_data: Dict) -> str:
        """Generate cache key for sentiment analysis"""
        key_string = f"{player_data.get('player_id', '')}{player_data.get('name', '')}"
        return hashlib.md5(key_string.encode()).hexdigest()
    
    def _is_cache_fresh(self, cached_result: Dict, max_age_hours: int = 6) -> bool:
        """Check if cached result is still fresh"""
        try:
            analyzed_at = datetime.fromisoformat(cached_result['analyzed_at'])
            return datetime.now() - analyzed_at < timedelta(hours=max_age_hours)
        except:
            return False
    
    def bulk_analyze_player_sentiment(self, players: List[Dict]) -> Dict:
        """Analyze sentiment for multiple players"""
        logger.info(f"🌐 Bulk analyzing sentiment for {len(players)} players...")
        
        results = {
            'timestamp': datetime.now().isoformat(),
            'total_players_analyzed': 0,
            'sentiment_summary': {
                'high_nil_potential': [],
                'risk_cases': [],
                'top_marketability': []
            },
            'league_sentiment_averages': {},
            'player_analyses': []
        }
        
        league_sentiments = {}
        
        for player in players:
            # Skip team entries
            if player.get('type') == 'team':
                continue
                
            try:
                sentiment_analysis = self.analyze_player_sentiment(player)
                results['player_analyses'].append(sentiment_analysis)
                results['total_players_analyzed'] += 1
                
                # Track league averages
                league = player.get('league', 'Unknown')
                if league not in league_sentiments:
                    league_sentiments[league] = []
                league_sentiments[league].append(sentiment_analysis['overall_sentiment_score'])
                
                # Identify notable cases
                nil_factors = sentiment_analysis['nil_trust_factors']
                
                if nil_factors['marketability_score'] > 0.7:
                    results['sentiment_summary']['high_nil_potential'].append({
                        'name': sentiment_analysis['player_name'],
                        'marketability_score': nil_factors['marketability_score'],
                        'league': league
                    })
                
                if sentiment_analysis['risk_assessment']['overall_risk_level'] == 'High':
                    results['sentiment_summary']['risk_cases'].append({
                        'name': sentiment_analysis['player_name'],
                        'risk_score': sentiment_analysis['risk_assessment']['risk_score'],
                        'league': league
                    })
                
                # Log progress
                if results['total_players_analyzed'] % 50 == 0:
                    logger.info(f"📊 Analyzed {results['total_players_analyzed']} players...")
                    
            except Exception as e:
                logger.warning(f"⚠️  Sentiment analysis failed for {player.get('name', 'Unknown')}: {e}")
        
        # Calculate league averages
        for league, scores in league_sentiments.items():
            if scores:
                results['league_sentiment_averages'][league] = round(np.mean(scores), 3)
        
        # Sort notable cases
        results['sentiment_summary']['high_nil_potential'].sort(
            key=lambda x: x['marketability_score'], reverse=True
        )
        results['sentiment_summary']['top_marketability'] = \
            results['sentiment_summary']['high_nil_potential'][:10]
        
        logger.info(f"✅ Completed sentiment analysis for {results['total_players_analyzed']} players")
        logger.info(f"🎯 {len(results['sentiment_summary']['high_nil_potential'])} high NIL potential players identified")
        
        return results
    
    def save_sentiment_analysis(self, results: Dict, output_dir: Path):
        """Save sentiment analysis results"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        output_path = output_dir / f"sentiment_analysis_{timestamp}.json"
        
        # Convert numpy types to native Python types for JSON serialization
        def json_serializer(obj):
            if isinstance(obj, np.integer):
                return int(obj)
            elif isinstance(obj, np.floating):
                return float(obj)
            elif isinstance(obj, np.ndarray):
                return obj.tolist()
            elif isinstance(obj, (np.bool_, bool)):
                return bool(obj)
            raise TypeError(f'Object of type {obj.__class__.__name__} is not JSON serializable')
        
        results_serializable = json.loads(json.dumps(results, default=json_serializer))
        
        with open(output_path, 'w') as f:
            json.dump(results_serializable, f, indent=2, ensure_ascii=False)
        
        logger.info(f"💾 Saved sentiment analysis to {output_path}")

def main():
    """Main function for standalone testing"""
    # Load existing player data
    data_path = Path('public/data/processed/complete_player_dataset.json')
    
    if data_path.exists():
        with open(data_path, 'r') as f:
            dataset = json.load(f)
        
        players = dataset.get('players', [])[:20]  # Test with first 20 players
        
        # Run sentiment analysis
        analyzer = BlazeSentimentAnalyzer()
        results = analyzer.bulk_analyze_player_sentiment(players)
        
        # Save results
        output_dir = Path('public/data/processed')
        analyzer.save_sentiment_analysis(results, output_dir)
        
        logger.info("🎉 Sentiment analysis testing complete!")
    else:
        logger.error("❌ No player dataset found. Run complete pipeline first.")

if __name__ == '__main__':
    main()