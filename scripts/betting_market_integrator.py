#!/usr/bin/env python3
"""
Betting Market Integration for Blaze Intelligence
Market-derived player valuations and performance indicators
"""

import json
import logging
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from pathlib import Path
import time

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('blaze_betting_markets')

class BlazeBettingIntegrator:
    """Betting market integration engine for player valuation insights"""
    
    def __init__(self):
        self.market_sources = {
            'draftkings': {'weight': 0.25, 'accuracy_rating': 0.85},
            'fanduel': {'weight': 0.25, 'accuracy_rating': 0.83},
            'caesars': {'weight': 0.20, 'accuracy_rating': 0.81},
            'betmgm': {'weight': 0.15, 'accuracy_rating': 0.79},
            'pinnacle': {'weight': 0.15, 'accuracy_rating': 0.88}
        }
        
        self.market_categories = {
            'performance_props': ['hits', 'runs', 'rbi', 'home_runs', 'strikeouts'],
            'season_totals': ['wins', 'saves', 'era', 'whip', 'batting_average'],
            'awards_futures': ['mvp', 'cy_young', 'rookie_of_year', 'comeback_player'],
            'team_success': ['division_winner', 'playoff_odds', 'world_series_odds'],
            'player_specials': ['all_star_selection', 'gold_glove', 'silver_slugger']
        }
        
        self.implied_probability_cache = {}
        
    def fetch_market_data(self, player_data: Dict, sport: str = 'baseball') -> Dict:
        """
        Fetch betting market data for a player
        
        Args:
            player_data: Player information
            sport: Sport type ('baseball', 'football', 'basketball')
            
        Returns:
            Market-derived valuation and performance indicators
        """
        player_name = player_data.get('name', 'Unknown')
        logger.info(f"💰 Fetching betting market data for {player_name}")
        
        market_analysis = {
            'player_id': player_data.get('player_id', player_data.get('id')),
            'player_name': player_name,
            'sport': sport,
            'league': player_data.get('league', 'MLB'),
            'analyzed_at': datetime.now().isoformat(),
            'market_sources_count': len(self.market_sources),
            'consensus_data': {},
            'individual_books': {},
            'market_efficiency_score': 0.0,
            'value_indicators': {},
            'risk_metrics': {}
        }
        
        # Simulate market data collection from different sportsbooks
        for book_name, book_data in self.market_sources.items():
            book_analysis = self._fetch_book_data(player_data, book_name, sport)
            market_analysis['individual_books'][book_name] = book_analysis
        
        # Calculate consensus metrics
        market_analysis['consensus_data'] = self._calculate_consensus_metrics(
            market_analysis['individual_books']
        )
        
        # Analyze market efficiency
        market_analysis['market_efficiency_score'] = self._calculate_market_efficiency(
            market_analysis['individual_books']
        )
        
        # Generate value indicators
        market_analysis['value_indicators'] = self._generate_value_indicators(
            market_analysis, player_data
        )
        
        # Assess betting market risks
        market_analysis['risk_metrics'] = self._assess_market_risks(
            market_analysis
        )
        
        return market_analysis
    
    def _fetch_book_data(self, player_data: Dict, book_name: str, sport: str) -> Dict:
        """Simulate fetching data from a specific sportsbook"""
        
        # Base odds simulation with book-specific characteristics
        book_characteristics = self.market_sources[book_name]
        accuracy_factor = book_characteristics['accuracy_rating']
        
        # Simulate different types of betting markets
        book_data = {
            'book_name': book_name,
            'last_updated': datetime.now().isoformat(),
            'market_count': np.random.randint(8, 25),
            'performance_props': {},
            'season_futures': {},
            'awards_odds': {},
            'book_specific_metrics': {}
        }
        
        # Performance prop odds (daily/weekly)
        if sport == 'baseball':
            book_data['performance_props'] = {
                'hits_o_u_1_5': {
                    'over': self._generate_odds(-110 + np.random.randint(-20, 20)),
                    'under': self._generate_odds(-110 + np.random.randint(-20, 20)),
                    'line': 1.5,
                    'volume': np.random.randint(1000, 50000)
                },
                'total_bases_o_u_1_5': {
                    'over': self._generate_odds(-105 + np.random.randint(-25, 25)),
                    'under': self._generate_odds(-115 + np.random.randint(-15, 15)),
                    'line': 1.5,
                    'volume': np.random.randint(500, 25000)
                },
                'rbi_o_u_0_5': {
                    'over': self._generate_odds(120 + np.random.randint(-30, 30)),
                    'under': self._generate_odds(-140 + np.random.randint(-20, 20)),
                    'line': 0.5,
                    'volume': np.random.randint(800, 30000)
                }
            }
            
            # Season totals
            book_data['season_futures'] = {
                'home_runs_o_u': {
                    'line': np.random.uniform(15, 45),
                    'over': self._generate_odds(-110 + np.random.randint(-30, 30)),
                    'under': self._generate_odds(-110 + np.random.randint(-30, 30)),
                    'volume': np.random.randint(2000, 100000)
                },
                'batting_average_o_u': {
                    'line': round(np.random.uniform(0.240, 0.290), 3),
                    'over': self._generate_odds(-105 + np.random.randint(-25, 25)),
                    'under': self._generate_odds(-115 + np.random.randint(-15, 15)),
                    'volume': np.random.randint(1000, 50000)
                }
            }
            
        elif sport == 'football':
            book_data['performance_props'] = {
                'passing_yards_o_u': {
                    'line': np.random.uniform(220, 320),
                    'over': self._generate_odds(-110 + np.random.randint(-20, 20)),
                    'under': self._generate_odds(-110 + np.random.randint(-20, 20)),
                    'volume': np.random.randint(5000, 150000)
                },
                'passing_tds_o_u': {
                    'line': round(np.random.uniform(1.5, 3.5), 1),
                    'over': self._generate_odds(-105 + np.random.randint(-25, 25)),
                    'under': self._generate_odds(-115 + np.random.randint(-15, 15)),
                    'volume': np.random.randint(3000, 100000)
                }
            }
        
        # Awards odds
        mvp_odds = np.random.randint(800, 5000)  # Long shot to favorite
        book_data['awards_odds'] = {
            'mvp': {
                'odds': mvp_odds,
                'implied_probability': self._odds_to_probability(mvp_odds),
                'volume': np.random.randint(500, 25000)
            },
            'all_star': {
                'odds': np.random.randint(150, 800),
                'implied_probability': self._odds_to_probability(np.random.randint(150, 800)),
                'volume': np.random.randint(200, 10000)
            }
        }
        
        # Book-specific metrics
        book_data['book_specific_metrics'] = {
            'total_handle_estimate': np.random.randint(50000, 2000000),  # Total betting volume
            'market_maker_status': np.random.choice([True, False], p=[0.3, 0.7]),
            'line_movement_volatility': round(np.random.uniform(0.1, 0.8), 3),
            'juice_average': round(np.random.uniform(4.5, 6.8), 2)  # Vig percentage
        }
        
        return book_data
    
    def _generate_odds(self, american_odds: int) -> Dict:
        """Generate odds data with additional metrics"""
        return {
            'american': american_odds,
            'decimal': self._american_to_decimal(american_odds),
            'implied_probability': self._odds_to_probability(american_odds),
            'timestamp': datetime.now().isoformat()
        }
    
    def _american_to_decimal(self, american_odds: int) -> float:
        """Convert American odds to decimal odds"""
        if american_odds > 0:
            return round((american_odds / 100) + 1, 2)
        else:
            return round((100 / abs(american_odds)) + 1, 2)
    
    def _odds_to_probability(self, american_odds: int) -> float:
        """Convert American odds to implied probability"""
        if american_odds > 0:
            return round(100 / (american_odds + 100), 4)
        else:
            return round(abs(american_odds) / (abs(american_odds) + 100), 4)
    
    def _calculate_consensus_metrics(self, books_data: Dict) -> Dict:
        """Calculate consensus metrics across all sportsbooks"""
        consensus = {
            'avg_mvp_probability': 0.0,
            'avg_all_star_probability': 0.0,
            'market_consensus_score': 0.0,
            'line_consistency': {},
            'volume_weighted_odds': {}
        }
        
        # Calculate MVP probability consensus
        mvp_probs = []
        all_star_probs = []
        total_volumes = []
        
        for book_name, book_data in books_data.items():
            awards = book_data.get('awards_odds', {})
            weight = self.market_sources[book_name]['weight']
            
            if 'mvp' in awards:
                mvp_probs.append(awards['mvp']['implied_probability'] * weight)
            if 'all_star' in awards:
                all_star_probs.append(awards['all_star']['implied_probability'] * weight)
            
            # Track total volume
            total_vol = book_data.get('book_specific_metrics', {}).get('total_handle_estimate', 0)
            total_volumes.append(total_vol)
        
        consensus['avg_mvp_probability'] = round(sum(mvp_probs), 4) if mvp_probs else 0.0
        consensus['avg_all_star_probability'] = round(sum(all_star_probs), 4) if all_star_probs else 0.0
        consensus['total_market_volume'] = sum(total_volumes)
        
        # Calculate line consistency (how much books agree)
        consistency_scores = []
        for book_data in books_data.values():
            props = book_data.get('performance_props', {})
            for prop_name, prop_data in props.items():
                if 'over' in prop_data and 'under' in prop_data:
                    over_prob = prop_data['over']['implied_probability']
                    under_prob = prop_data['under']['implied_probability']
                    # Good books should have over + under close to 1.0 (accounting for vig)
                    consistency = 1.0 - abs(1.0 - (over_prob + under_prob))
                    consistency_scores.append(consistency)
        
        consensus['market_consensus_score'] = round(np.mean(consistency_scores), 3) if consistency_scores else 0.5
        
        return consensus
    
    def _calculate_market_efficiency(self, books_data: Dict) -> float:
        """Calculate market efficiency score"""
        efficiency_factors = []
        
        for book_data in books_data.values():
            # Check prop bet efficiency
            props = book_data.get('performance_props', {})
            for prop_data in props.values():
                if 'over' in prop_data and 'under' in prop_data:
                    over_prob = prop_data['over']['implied_probability']
                    under_prob = prop_data['under']['implied_probability']
                    total_prob = over_prob + under_prob
                    
                    # Efficient market should have total probability close to 1.05-1.10 (vig)
                    ideal_range = (1.05, 1.12)
                    if ideal_range[0] <= total_prob <= ideal_range[1]:
                        efficiency_factors.append(1.0)
                    else:
                        # Penalize deviation from efficient range
                        deviation = min(abs(total_prob - ideal_range[0]), abs(total_prob - ideal_range[1]))
                        efficiency_factors.append(max(0.1, 1.0 - deviation))
            
            # Volume indicates market confidence
            volume_factor = min(book_data.get('book_specific_metrics', {}).get('total_handle_estimate', 0) / 500000, 1.0)
            efficiency_factors.append(volume_factor)
        
        return round(np.mean(efficiency_factors), 3) if efficiency_factors else 0.5
    
    def _generate_value_indicators(self, market_analysis: Dict, player_data: Dict) -> Dict:
        """Generate player value indicators from market data"""
        consensus = market_analysis['consensus_data']
        
        value_indicators = {
            'market_implied_value': 0.0,
            'undervalued_probability': 0.0,
            'overvalued_probability': 0.0,
            'arbitrage_opportunities': [],
            'sharp_money_indicators': {},
            'public_betting_bias': 0.0
        }
        
        # Calculate market implied value
        mvp_prob = consensus.get('avg_mvp_probability', 0.0)
        all_star_prob = consensus.get('avg_all_star_probability', 0.0)
        
        # Market value is weighted combination of award probabilities and prop performance
        market_value = (mvp_prob * 1000000 + all_star_prob * 100000) / 1000
        value_indicators['market_implied_value'] = round(market_value, 2)
        
        # Compare to HAV-F score if available
        if 'HAV_F' in player_data and 'overall_score' in player_data['HAV_F']:
            hav_f_score = player_data['HAV_F']['overall_score']
            market_expectation = (mvp_prob + all_star_prob) * 100  # Scale to 0-100
            
            difference = hav_f_score - market_expectation
            if difference > 10:
                value_indicators['undervalued_probability'] = min(abs(difference) / 50, 0.9)
            elif difference < -10:
                value_indicators['overvalued_probability'] = min(abs(difference) / 50, 0.9)
        
        # Look for arbitrage opportunities (different odds across books)
        books = market_analysis['individual_books']
        for prop_type in ['mvp', 'all_star']:
            odds_list = []
            for book_data in books.values():
                awards = book_data.get('awards_odds', {})
                if prop_type in awards:
                    odds_list.append(awards[prop_type]['odds'])
            
            if len(odds_list) >= 2:
                max_odds = max(odds_list)
                min_odds = min(odds_list)
                if max_odds > min_odds * 1.15:  # 15% difference threshold
                    value_indicators['arbitrage_opportunities'].append({
                        'market': prop_type,
                        'opportunity_size': round((max_odds - min_odds) / min_odds, 3),
                        'profit_potential': 'Medium' if max_odds > min_odds * 1.2 else 'Low'
                    })
        
        # Sharp money vs public money indicators
        high_volume_books = [book for book, data in books.items() 
                           if data.get('book_specific_metrics', {}).get('total_handle_estimate', 0) > 500000]
        
        if len(high_volume_books) > 1:
            value_indicators['sharp_money_indicators'] = {
                'high_volume_consensus': len(high_volume_books) / len(books),
                'line_movement_direction': np.random.choice(['toward_player', 'away_from_player', 'stable'], p=[0.4, 0.3, 0.3]),
                'late_money_influence': round(np.random.uniform(0.1, 0.8), 3)
            }
        
        # Public betting bias (recreational vs professional)
        total_volume = consensus.get('total_market_volume', 1)
        sharp_volume = sum(books[book].get('book_specific_metrics', {}).get('total_handle_estimate', 0) 
                          for book in high_volume_books)
        
        if total_volume > 0:
            public_percentage = 1.0 - (sharp_volume / total_volume)
            value_indicators['public_betting_bias'] = round(public_percentage, 3)
        
        return value_indicators
    
    def _assess_market_risks(self, market_analysis: Dict) -> Dict:
        """Assess betting market risks and volatility"""
        
        risks = {
            'volatility_score': 0.0,
            'liquidity_risk': 'Low',
            'market_manipulation_risk': 'Low',
            'injury_news_sensitivity': 0.0,
            'performance_correlation_risk': 0.0
        }
        
        books = market_analysis['individual_books']
        
        # Calculate volatility from line movements
        line_volatilities = []
        for book_data in books.values():
            vol = book_data.get('book_specific_metrics', {}).get('line_movement_volatility', 0.3)
            line_volatilities.append(vol)
        
        risks['volatility_score'] = round(np.mean(line_volatilities), 3)
        
        # Liquidity risk assessment
        total_volume = market_analysis['consensus_data'].get('total_market_volume', 0)
        if total_volume < 100000:
            risks['liquidity_risk'] = 'High'
        elif total_volume < 500000:
            risks['liquidity_risk'] = 'Medium'
        else:
            risks['liquidity_risk'] = 'Low'
        
        # Market manipulation risk (low volume + high volatility)
        if total_volume < 200000 and risks['volatility_score'] > 0.6:
            risks['market_manipulation_risk'] = 'Medium'
        elif total_volume < 50000:
            risks['market_manipulation_risk'] = 'High'
        
        # Injury sensitivity (simulate based on position/sport)
        risks['injury_news_sensitivity'] = round(np.random.uniform(0.3, 0.9), 3)
        risks['performance_correlation_risk'] = round(np.random.uniform(0.2, 0.8), 3)
        
        return risks
    
    def bulk_analyze_market_data(self, players: List[Dict]) -> Dict:
        """Analyze betting market data for multiple players"""
        logger.info(f"📈 Bulk analyzing betting market data for {len(players)} players...")
        
        results = {
            'timestamp': datetime.now().isoformat(),
            'total_players_analyzed': 0,
            'market_summary': {
                'high_value_opportunities': [],
                'arbitrage_found': [],
                'market_movers': []
            },
            'league_market_data': {},
            'player_analyses': []
        }
        
        league_values = {}
        
        for player in players:
            # Skip team entries
            if player.get('type') == 'team':
                continue
                
            try:
                sport = 'baseball' if player.get('league') == 'MLB' else 'football' if player.get('league') == 'NFL' else 'baseball'
                market_analysis = self.fetch_market_data(player, sport)
                
                results['player_analyses'].append(market_analysis)
                results['total_players_analyzed'] += 1
                
                # Track league data
                league = player.get('league', 'Unknown')
                if league not in league_values:
                    league_values[league] = []
                
                market_value = market_analysis['value_indicators']['market_implied_value']
                league_values[league].append(market_value)
                
                # Identify opportunities
                value_indicators = market_analysis['value_indicators']
                
                if value_indicators['undervalued_probability'] > 0.6:
                    results['market_summary']['high_value_opportunities'].append({
                        'name': market_analysis['player_name'],
                        'league': league,
                        'undervalued_probability': value_indicators['undervalued_probability'],
                        'market_value': market_value
                    })
                
                if value_indicators['arbitrage_opportunities']:
                    results['market_summary']['arbitrage_found'].append({
                        'name': market_analysis['player_name'],
                        'opportunities': len(value_indicators['arbitrage_opportunities'])
                    })
                
                # Log progress
                if results['total_players_analyzed'] % 25 == 0:
                    logger.info(f"📊 Analyzed {results['total_players_analyzed']} players...")
                    
                # Rate limit to avoid overwhelming simulated APIs
                time.sleep(0.1)
                
            except Exception as e:
                logger.warning(f"⚠️  Market analysis failed for {player.get('name', 'Unknown')}: {e}")
        
        # Calculate league market summaries
        for league, values in league_values.items():
            if values:
                results['league_market_data'][league] = {
                    'avg_market_value': round(np.mean(values), 2),
                    'total_market_value': round(sum(values), 2),
                    'highest_valued_player': max(values),
                    'market_depth': len(values)
                }
        
        # Sort opportunities by potential value
        results['market_summary']['high_value_opportunities'].sort(
            key=lambda x: x['undervalued_probability'], reverse=True
        )
        
        logger.info(f"✅ Completed market analysis for {results['total_players_analyzed']} players")
        logger.info(f"🎯 Found {len(results['market_summary']['high_value_opportunities'])} high-value opportunities")
        
        return results
    
    def save_market_analysis(self, results: Dict, output_dir: Path):
        """Save betting market analysis results"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        output_path = output_dir / f"betting_market_analysis_{timestamp}.json"
        
        with open(output_path, 'w') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        
        logger.info(f"💾 Saved betting market analysis to {output_path}")

def main():
    """Main function for standalone testing"""
    # Load existing player data
    data_path = Path('public/data/processed/complete_player_dataset.json')
    
    if data_path.exists():
        with open(data_path, 'r') as f:
            dataset = json.load(f)
        
        players = dataset.get('players', [])[:15]  # Test with first 15 players
        
        # Run betting market analysis
        integrator = BlazeBettingIntegrator()
        results = integrator.bulk_analyze_market_data(players)
        
        # Save results
        output_dir = Path('public/data/processed')
        integrator.save_market_analysis(results, output_dir)
        
        logger.info("🎉 Betting market analysis testing complete!")
    else:
        logger.error("❌ No player dataset found. Run complete pipeline first.")

if __name__ == '__main__':
    main()