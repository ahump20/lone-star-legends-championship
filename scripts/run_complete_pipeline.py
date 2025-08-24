#!/usr/bin/env python3
"""
Complete Blaze Intelligence Pipeline
Runs all ingestion agents and calculates HAV-F scores for all players
"""

import json
import time
import logging
from datetime import datetime
from typing import List, Dict
from pathlib import Path

from ingestion_agents import (
    MLBIngestionAgent, NFLIngestionAgent, NCAAIngestionAgent,
    HighSchoolIngestionAgent, NILIngestionAgent, InternationalIngestionAgent
)
from blaze_aggregator import BlazeAggregator
from monitoring import BlazeMonitor

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('blaze_pipeline')

class BlazePipeline:
    """Complete pipeline orchestrator for Blaze Intelligence"""
    
    def __init__(self):
        self.aggregator = BlazeAggregator()
        self.monitor = BlazeMonitor()
        self.output_dir = Path('public/data/processed')
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
    def run_ingestion_agents(self) -> List[Dict]:
        """Run all ingestion agents and collect data"""
        logger.info("🚀 Starting complete ingestion pipeline...")
        all_players = []
        
        # MLB Agent
        logger.info("📊 Running MLB ingestion agent...")
        start_time = time.time()
        try:
            mlb_agent = MLBIngestionAgent()
            mlb_players = mlb_agent.fetch_active_rosters()
            mlb_count = len(mlb_players)
            all_players.extend([{'league': 'MLB', **p} for p in mlb_players])
            
            # Record success
            self.monitor.record_run('mlb-ingestion', True, time.time() - start_time)
            logger.info(f"✅ MLB: {mlb_count} players ingested")
            
        except Exception as e:
            self.monitor.record_run('mlb-ingestion', False, time.time() - start_time, str(e))
            logger.error(f"❌ MLB ingestion failed: {e}")
        
        # NFL Agent
        logger.info("🏈 Running NFL ingestion agent...")
        start_time = time.time()
        try:
            nfl_agent = NFLIngestionAgent()
            nfl_players = nfl_agent.fetch_rosters()
            nfl_count = len(nfl_players)
            all_players.extend([{'league': 'NFL', **p} for p in nfl_players])
            
            self.monitor.record_run('nfl-ingestion', True, time.time() - start_time)
            logger.info(f"✅ NFL: {nfl_count} players ingested")
            
        except Exception as e:
            self.monitor.record_run('nfl-ingestion', False, time.time() - start_time, str(e))
            logger.error(f"❌ NFL ingestion failed: {e}")
        
        # NCAA Agent
        logger.info("🎓 Running NCAA ingestion agent...")
        start_time = time.time()
        try:
            ncaa_agent = NCAAIngestionAgent()
            ncaa_teams = ncaa_agent.fetch_teams()
            ncaa_count = len(ncaa_teams)
            all_players.extend([{'league': 'NCAA', 'type': 'team', **t} for t in ncaa_teams])
            
            self.monitor.record_run('ncaa-ingestion', True, time.time() - start_time)
            logger.info(f"✅ NCAA: {ncaa_count} teams ingested")
            
        except Exception as e:
            self.monitor.record_run('ncaa-ingestion', False, time.time() - start_time, str(e))
            logger.error(f"❌ NCAA ingestion failed: {e}")
        
        # High School Agent
        logger.info("🏫 Running High School ingestion agent...")
        start_time = time.time()
        try:
            hs_agent = HighSchoolIngestionAgent()
            hs_teams = hs_agent.fetch_top_teams('tx')
            hs_count = len(hs_teams)
            all_players.extend([{'league': 'HS', 'type': 'team', **t} for t in hs_teams])
            
            self.monitor.record_run('high-school-ingestion', True, time.time() - start_time)
            logger.info(f"✅ High School: {hs_count} teams ingested")
            
        except Exception as e:
            self.monitor.record_run('high-school-ingestion', False, time.time() - start_time, str(e))
            logger.error(f"❌ High School ingestion failed: {e}")
        
        # NIL Agent
        logger.info("💰 Running NIL ingestion agent...")
        start_time = time.time()
        try:
            nil_agent = NILIngestionAgent()
            nil_players = nil_agent.fetch_nil_rankings()
            nil_count = len(nil_players)
            all_players.extend([{'league': 'NCAA', 'has_nil': True, **p} for p in nil_players])
            
            self.monitor.record_run('nil-ingestion', True, time.time() - start_time)
            logger.info(f"✅ NIL: {nil_count} players ingested")
            
        except Exception as e:
            self.monitor.record_run('nil-ingestion', False, time.time() - start_time, str(e))
            logger.error(f"❌ NIL ingestion failed: {e}")
        
        # International Agent
        logger.info("🌍 Running International ingestion agent...")
        start_time = time.time()
        try:
            intl_agent = InternationalIngestionAgent()
            npb_players = intl_agent.fetch_npb_players()
            kbo_players = intl_agent.fetch_kbo_players()
            intl_count = len(npb_players) + len(kbo_players)
            all_players.extend(npb_players + kbo_players)
            
            self.monitor.record_run('international-ingestion', True, time.time() - start_time)
            logger.info(f"✅ International: {intl_count} players ingested")
            
        except Exception as e:
            self.monitor.record_run('international-ingestion', False, time.time() - start_time, str(e))
            logger.error(f"❌ International ingestion failed: {e}")
        
        logger.info(f"🎯 Total ingestion complete: {len(all_players)} players/teams")
        return all_players
    
    def calculate_hav_f_for_all(self, players: List[Dict]) -> List[Dict]:
        """Calculate HAV-F scores for all players"""
        logger.info("🧮 Starting HAV-F calculations for all players...")
        start_time = time.time()
        
        processed_players = []
        hav_f_scores = []
        
        for i, player in enumerate(players):
            try:
                # Only calculate HAV-F for actual players (not teams)
                if player.get('type') == 'team':
                    processed_players.append(player)
                    continue
                
                # Normalize player data for HAV-F calculation
                normalized_player = self._normalize_player_data(player)
                
                # Calculate HAV-F
                hav_f = self.aggregator.calculate_hav_f(normalized_player)
                
                # Add HAV-F scores to player data
                player['HAV_F'] = {
                    'championship_readiness': round(hav_f.championship_readiness, 1),
                    'cognitive_leverage': round(hav_f.cognitive_leverage, 1),
                    'nil_trust': round(hav_f.nil_trust, 1),
                    'overall_score': round(hav_f.overall, 1)
                }
                
                # Add to high-level scores tracking
                hav_f_scores.append({
                    'player_id': normalized_player.get('player_id', f'player_{i}'),
                    'name': player.get('name', 'Unknown'),
                    'league': player.get('league', 'Unknown'),
                    'hav_f_overall': round(hav_f.overall, 1),
                    'championship_readiness': round(hav_f.championship_readiness, 1),
                    'cognitive_leverage': round(hav_f.cognitive_leverage, 1),
                    'nil_trust': round(hav_f.nil_trust, 1)
                })
                
                processed_players.append(player)
                
                # Log progress every 100 players
                if (i + 1) % 100 == 0:
                    logger.info(f"📊 Processed {i + 1}/{len(players)} players")
                
            except Exception as e:
                logger.warning(f"⚠️  HAV-F calculation failed for player {player.get('name', 'Unknown')}: {e}")
                processed_players.append(player)
        
        # Record HAV-F calculation performance
        calculation_time = time.time() - start_time
        success_rate = len([p for p in processed_players if 'HAV_F' in p]) / len([p for p in processed_players if p.get('type') != 'team'])
        self.monitor.record_run('hav-f-calculator', success_rate > 0.8, calculation_time)
        
        logger.info(f"✅ HAV-F calculations complete in {calculation_time:.1f}s")
        logger.info(f"📈 Success rate: {success_rate:.1%}")
        
        # Save top HAV-F scores
        top_scores = sorted(hav_f_scores, key=lambda x: x['hav_f_overall'], reverse=True)[:50]
        self._save_data('top_hav_f_scores.json', {
            'timestamp': datetime.now().isoformat(),
            'total_players_evaluated': len(hav_f_scores),
            'top_performers': top_scores
        })
        
        return processed_players
    
    def _normalize_player_data(self, player: Dict) -> Dict:
        """Normalize player data for HAV-F calculation"""
        return {
            'player_id': player.get('id', f"player_{hash(str(player))}"),
            'name': player.get('name', 'Unknown'),
            'team': player.get('team', player.get('team_id', 'Unknown')),
            'league': player.get('league', 'Unknown'),
            'position': player.get('position', 'Unknown'),
            '2024_stats': player.get('stats', {}),
            '2025_projection': {},  # Will be populated by AI models later
            'nil_profile': {
                'nil_value': player.get('nil_value', 0),
                'social_following': player.get('social_following', {})
            } if player.get('has_nil') else {}
        }
    
    def generate_readiness_board(self, players: List[Dict]) -> Dict:
        """Generate universal readiness board for all leagues"""
        logger.info("🏆 Generating universal readiness board...")
        
        # Group by league
        by_league = {}
        for player in players:
            league = player.get('league', 'Unknown')
            if league not in by_league:
                by_league[league] = []
            by_league[league].append(player)
        
        readiness_data = {
            'timestamp': datetime.now().isoformat(),
            'total_players': len(players),
            'leagues': {}
        }
        
        for league, league_players in by_league.items():
            # Get players with HAV-F scores
            scored_players = [p for p in league_players if 'HAV_F' in p]
            
            if scored_players:
                avg_hav_f = sum(p['HAV_F']['overall_score'] for p in scored_players) / len(scored_players)
                top_performer = max(scored_players, key=lambda x: x['HAV_F']['overall_score'])
                
                readiness_data['leagues'][league] = {
                    'total_players': len(league_players),
                    'scored_players': len(scored_players),
                    'avg_hav_f_score': round(avg_hav_f, 1),
                    'top_performer': {
                        'name': top_performer.get('name'),
                        'hav_f_score': top_performer['HAV_F']['overall_score'],
                        'team': top_performer.get('team')
                    },
                    'readiness_level': 'Championship' if avg_hav_f >= 80 else 'Elite' if avg_hav_f >= 70 else 'Competitive' if avg_hav_f >= 60 else 'Developing'
                }
        
        # Save readiness board
        self._save_data('universal_readiness_board.json', readiness_data)
        logger.info("✅ Universal readiness board generated")
        
        return readiness_data
    
    def _save_data(self, filename: str, data: Dict):
        """Save data to JSON file"""
        output_path = self.output_dir / filename
        with open(output_path, 'w') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        logger.info(f"💾 Saved {filename}")
    
    def run_complete_pipeline(self):
        """Run the complete Blaze Intelligence pipeline"""
        start_time = time.time()
        logger.info("🔥 BLAZE INTELLIGENCE PIPELINE STARTING")
        
        try:
            # Step 1: Ingest all data
            all_players = self.run_ingestion_agents()
            
            # Step 2: Calculate HAV-F scores
            processed_players = self.calculate_hav_f_for_all(all_players)
            
            # Step 3: Generate readiness board
            readiness_data = self.generate_readiness_board(processed_players)
            
            # Step 4: Save complete dataset
            self._save_data('complete_player_dataset.json', {
                'timestamp': datetime.now().isoformat(),
                'total_records': len(processed_players),
                'pipeline_runtime_seconds': time.time() - start_time,
                'players': processed_players
            })
            
            # Step 5: Generate summary report
            summary = {
                'timestamp': datetime.now().isoformat(),
                'pipeline_runtime': f"{time.time() - start_time:.1f} seconds",
                'total_records_processed': len(processed_players),
                'leagues_covered': list(readiness_data['leagues'].keys()),
                'hav_f_calculated_for': len([p for p in processed_players if 'HAV_F' in p]),
                'system_health': 'operational',
                'next_run_scheduled': datetime.fromtimestamp(time.time() + 1800).isoformat()  # 30 min
            }
            
            self._save_data('pipeline_summary.json', summary)
            
            logger.info("🎉 BLAZE INTELLIGENCE PIPELINE COMPLETE")
            logger.info(f"📊 {len(processed_players)} total records processed")
            logger.info(f"⏱️  Runtime: {time.time() - start_time:.1f} seconds")
            logger.info(f"🏆 {len([p for p in processed_players if 'HAV_F' in p])} players with HAV-F scores")
            
            return summary
            
        except Exception as e:
            logger.error(f"💥 Pipeline failed: {e}")
            self.monitor.record_run('deployment-pipeline', False, time.time() - start_time, str(e))
            raise

def main():
    """Main execution function"""
    pipeline = BlazePipeline()
    pipeline.run_complete_pipeline()

if __name__ == '__main__':
    main()