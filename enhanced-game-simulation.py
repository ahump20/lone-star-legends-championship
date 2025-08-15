#!/usr/bin/env python3
"""
Enhanced Lone Star Legends Championship - Live Baseball Simulation
Complete game with Blaze Intelligence analytics and automated gameplay
"""

import asyncio
import random
import time
import json
import math
from typing import Dict, Any, List, Tuple
from dataclasses import dataclass, field
from enum import Enum

class PlayType(Enum):
    SINGLE = "single"
    DOUBLE = "double"
    TRIPLE = "triple"
    HOMERUN = "homerun"
    STRIKEOUT = "strikeout"
    GROUNDOUT = "groundout"
    FLYOUT = "flyout"
    WALK = "walk"
    HIT_BY_PITCH = "hitbypitch"
    ERROR = "error"
    STOLEN_BASE = "stolenbase"
    SACRIFICE = "sacrifice"

@dataclass
class Player:
    """Baseball player with statistics"""
    name: str
    position: str
    batting_avg: float = 0.250
    power: float = 0.5
    speed: float = 0.5
    defense: float = 0.7
    hits: int = 0
    at_bats: int = 0
    home_runs: int = 0
    rbis: int = 0
    runs: int = 0

@dataclass
class GameEvent:
    """Baseball game event with enhanced data"""
    type: PlayType
    player: Player
    team: str
    impact: float
    exit_velocity: float = 95.0
    launch_angle: float = 25.0
    distance: float = 0.0
    description: str = ""
    runners_scored: List[str] = field(default_factory=list)
    momentum_shift: float = 0.0

class BaseRunners:
    """Track runners on base"""
    def __init__(self):
        self.first_base = None
        self.second_base = None
        self.third_base = None
        
    def add_runner(self, player: Player, bases: int = 1):
        """Add runner and advance existing runners"""
        scored = []
        
        # Advance existing runners
        if bases >= 1:
            if self.third_base:
                scored.append(self.third_base.name)
                self.third_base = None
            if self.second_base:
                if bases >= 2:
                    scored.append(self.second_base.name)
                    self.second_base = None
                else:
                    self.third_base = self.second_base
                    self.second_base = None
            if self.first_base:
                if bases >= 3:
                    scored.append(self.first_base.name)
                    self.first_base = None
                elif bases >= 2:
                    self.third_base = self.first_base
                    self.first_base = None
                else:
                    self.second_base = self.first_base
                    self.first_base = None
        
        # Place new runner
        if bases == 1:
            self.first_base = player
        elif bases == 2:
            self.second_base = player
        elif bases == 3:
            self.third_base = player
        elif bases >= 4:  # Home run
            scored.append(player.name)
            
        return scored
    
    def clear_bases(self):
        """Clear all runners (end of inning)"""
        self.first_base = None
        self.second_base = None
        self.third_base = None
    
    def get_runner_count(self) -> int:
        """Get number of runners on base"""
        count = 0
        if self.first_base: count += 1
        if self.second_base: count += 1
        if self.third_base: count += 1
        return count

class BlazeAnalytics:
    """Advanced analytics system"""
    def __init__(self):
        self.momentum_history = []
        self.critical_plays = []
        self.win_probability_history = []
        self.performance_metrics = {}
        
    def calculate_momentum_shift(self, event: GameEvent, game_context: Dict) -> float:
        """Calculate momentum shift based on game context"""
        base_shift = event.impact * 20
        
        # Context multipliers
        inning_factor = 1.0 + (game_context['inning'] - 5) * 0.1  # Late innings matter more
        score_diff = abs(game_context['score_diff'])
        close_game_factor = 2.0 if score_diff <= 2 else 1.0
        runners_factor = 1.0 + game_context['runners_on_base'] * 0.2
        
        # Critical situation bonus
        if game_context['inning'] >= 8 and score_diff <= 1:
            base_shift *= 1.5
            
        total_shift = base_shift * inning_factor * close_game_factor * runners_factor
        
        # Record if critical
        if total_shift > 15:
            self.critical_plays.append({
                'play': event.description,
                'shift': total_shift,
                'inning': game_context['inning']
            })
            
        return total_shift
    
    def calculate_win_probability(self, home_score: int, away_score: int, 
                                 inning: int, top_bottom: str, outs: int) -> Tuple[float, float]:
        """Calculate win probability for both teams"""
        # Simplified win probability model
        innings_left = max(0, 9 - inning) if top_bottom == "top" else max(0, 8.5 - inning)
        score_diff = home_score - away_score
        
        # Base probability from score differential
        if score_diff > 0:
            home_prob = 0.5 + min(0.4, score_diff * 0.1)
        elif score_diff < 0:
            home_prob = 0.5 - min(0.4, abs(score_diff) * 0.1)
        else:
            home_prob = 0.5
            
        # Adjust for innings remaining
        if innings_left > 0:
            volatility = 0.05 * innings_left
            home_prob = home_prob * (1 - volatility) + 0.5 * volatility
            
        # Adjust for outs
        if top_bottom == "bottom" and score_diff < 0:
            home_prob *= (1.0 - outs * 0.1)
        elif top_bottom == "top" and score_diff > 0:
            home_prob *= (1.0 + outs * 0.05)
            
        home_prob = max(0.05, min(0.95, home_prob))
        away_prob = 1.0 - home_prob
        
        return home_prob * 100, away_prob * 100

class EnhancedBaseballSimulation:
    def __init__(self):
        self.game_active = False
        self.inning = 1
        self.top_bottom = "top"
        self.home_score = 0
        self.away_score = 0
        self.outs = 0
        self.balls = 0
        self.strikes = 0
        self.home_momentum = 50.0
        self.away_momentum = 50.0
        self.base_runners = BaseRunners()
        self.analytics = BlazeAnalytics()
        
        # Enhanced rosters with player objects
        self.home_lineup = self._create_team_roster("Lone Star Legends")
        self.away_lineup = self._create_team_roster("Championship Challengers")
        self.current_batter_index = {"home": 0, "away": 0}
        
        # Enhanced play probabilities
        self.play_probabilities = self._initialize_play_probabilities()
        
    def _create_team_roster(self, team_name: str) -> List[Player]:
        """Create a team roster with varied player stats"""
        positions = ["C", "1B", "2B", "3B", "SS", "LF", "CF", "RF", "DH"]
        names = ["Rodriguez", "Martinez", "Johnson", "Williams", "Davis",
                "Garcia", "Wilson", "Anderson", "Taylor"] if "Legends" in team_name else \
                ["Smith", "Brown", "Jones", "Miller", "Moore",
                 "Jackson", "White", "Harris", "Clark"]
        
        roster = []
        for i, (name, pos) in enumerate(zip(names, positions)):
            # Vary player stats
            batting_avg = random.uniform(0.220, 0.320)
            power = random.uniform(0.3, 0.8) if i < 5 else random.uniform(0.2, 0.5)
            speed = random.uniform(0.4, 0.9) if i > 5 else random.uniform(0.3, 0.6)
            defense = random.uniform(0.6, 0.9)
            
            roster.append(Player(name, pos, batting_avg, power, speed, defense))
            
        return roster
    
    def _initialize_play_probabilities(self) -> Dict[PlayType, float]:
        """Initialize realistic play probabilities"""
        return {
            PlayType.SINGLE: 0.20,
            PlayType.DOUBLE: 0.08,
            PlayType.TRIPLE: 0.02,
            PlayType.HOMERUN: 0.04,
            PlayType.STRIKEOUT: 0.22,
            PlayType.GROUNDOUT: 0.15,
            PlayType.FLYOUT: 0.13,
            PlayType.WALK: 0.08,
            PlayType.HIT_BY_PITCH: 0.02,
            PlayType.ERROR: 0.06
        }
    
    def calculate_ball_physics(self, exit_velocity: float, launch_angle: float) -> float:
        """Calculate ball distance using physics"""
        # Convert to SI units
        v0 = exit_velocity * 0.44704  # mph to m/s
        angle_rad = math.radians(launch_angle)
        
        # Physics constants
        g = 9.81  # gravity
        drag_coefficient = 0.3
        
        # Simplified trajectory calculation
        vx = v0 * math.cos(angle_rad)
        vy = v0 * math.sin(angle_rad)
        
        # Time to peak
        t_peak = vy / g
        
        # Maximum height
        h_max = (vy ** 2) / (2 * g)
        
        # Total flight time (simplified)
        t_total = 2 * t_peak * (1 - drag_coefficient * 0.1)
        
        # Distance (with drag approximation)
        distance = vx * t_total * (1 - drag_coefficient * 0.2)
        
        # Convert back to feet
        distance_ft = distance * 3.28084
        
        return distance_ft
    
    def generate_enhanced_play(self) -> GameEvent:
        """Generate play with enhanced physics and context"""
        # Get current batter
        current_team = "home" if self.top_bottom == "bottom" else "away"
        lineup = self.home_lineup if current_team == "home" else self.away_lineup
        batter_index = self.current_batter_index[current_team]
        batter = lineup[batter_index]
        
        # Adjust probabilities based on batter stats
        adjusted_probs = self._adjust_probabilities_for_batter(batter)
        
        # Select play type
        play_type = self._select_play_type(adjusted_probs)
        
        # Generate physics parameters
        exit_velocity, launch_angle = self._generate_hit_physics(play_type, batter)
        
        # Calculate distance for hits
        distance = 0
        if play_type in [PlayType.SINGLE, PlayType.DOUBLE, PlayType.TRIPLE, PlayType.HOMERUN]:
            distance = self.calculate_ball_physics(exit_velocity, launch_angle)
        
        # Generate description
        description = self._generate_play_description(play_type, batter, distance)
        
        # Calculate impact
        impact = self._calculate_play_impact(play_type, self.base_runners.get_runner_count())
        
        # Update batter stats
        if play_type != PlayType.WALK and play_type != PlayType.HIT_BY_PITCH:
            batter.at_bats += 1
        if play_type in [PlayType.SINGLE, PlayType.DOUBLE, PlayType.TRIPLE, PlayType.HOMERUN]:
            batter.hits += 1
        
        # Move to next batter
        self.current_batter_index[current_team] = (batter_index + 1) % 9
        
        return GameEvent(
            type=play_type,
            player=batter,
            team=current_team,
            impact=impact,
            exit_velocity=exit_velocity,
            launch_angle=launch_angle,
            distance=distance,
            description=description
        )
    
    def _adjust_probabilities_for_batter(self, batter: Player) -> Dict[PlayType, float]:
        """Adjust play probabilities based on batter characteristics"""
        probs = self.play_probabilities.copy()
        
        # Adjust for batting average
        hit_adjustment = (batter.batting_avg - 0.250) * 0.5
        probs[PlayType.SINGLE] += hit_adjustment * 0.6
        probs[PlayType.DOUBLE] += hit_adjustment * 0.3
        probs[PlayType.TRIPLE] += hit_adjustment * 0.1 * batter.speed
        
        # Adjust for power
        probs[PlayType.HOMERUN] *= (1 + batter.power)
        
        # Adjust strikeouts inversely
        probs[PlayType.STRIKEOUT] *= (1.5 - batter.batting_avg * 2)
        
        # Normalize probabilities
        total = sum(probs.values())
        return {k: v/total for k, v in probs.items()}
    
    def _select_play_type(self, probabilities: Dict[PlayType, float]) -> PlayType:
        """Select play type based on probabilities"""
        rand = random.random()
        cumulative = 0
        
        for play_type, prob in probabilities.items():
            cumulative += prob
            if rand <= cumulative:
                return play_type
                
        return PlayType.SINGLE  # Default
    
    def _generate_hit_physics(self, play_type: PlayType, batter: Player) -> Tuple[float, float]:
        """Generate realistic physics parameters"""
        if play_type == PlayType.HOMERUN:
            exit_velocity = random.uniform(100 + batter.power * 10, 115)
            launch_angle = random.uniform(25, 35)
        elif play_type == PlayType.TRIPLE:
            exit_velocity = random.uniform(95, 105)
            launch_angle = random.uniform(15, 25)
        elif play_type == PlayType.DOUBLE:
            exit_velocity = random.uniform(90, 100)
            launch_angle = random.uniform(10, 20)
        elif play_type == PlayType.SINGLE:
            exit_velocity = random.uniform(80, 95)
            launch_angle = random.uniform(0, 15)
        else:
            exit_velocity = random.uniform(60, 85)
            launch_angle = random.uniform(-10, 45)
            
        return exit_velocity, launch_angle
    
    def _generate_play_description(self, play_type: PlayType, batter: Player, distance: float) -> str:
        """Generate detailed play description"""
        field_positions = ['left', 'center', 'right']
        
        if play_type == PlayType.HOMERUN:
            return f"💥 {batter.name} ({batter.position}) CRUSHES a {distance:.0f}ft HOME RUN to deep {random.choice(field_positions)} field!"
        elif play_type == PlayType.TRIPLE:
            return f"🏃 {batter.name} rips a triple to the {random.choice(['gap', 'corner', 'wall'])}! Distance: {distance:.0f}ft"
        elif play_type == PlayType.DOUBLE:
            return f"✨ {batter.name} doubles to {random.choice(field_positions)}! Ball traveled {distance:.0f}ft"
        elif play_type == PlayType.SINGLE:
            return f"⚾ {batter.name} singles to {random.choice(field_positions)} field"
        elif play_type == PlayType.STRIKEOUT:
            return f"❌ {batter.name} strikes out {random.choice(['swinging', 'looking'])}"
        elif play_type == PlayType.GROUNDOUT:
            return f"⬇️ {batter.name} grounds out to {random.choice(['first', 'second', 'third', 'shortstop'])}"
        elif play_type == PlayType.FLYOUT:
            return f"⬆️ {batter.name} flies out to {random.choice(field_positions)} field"
        elif play_type == PlayType.WALK:
            return f"🚶 {batter.name} draws a walk"
        elif play_type == PlayType.HIT_BY_PITCH:
            return f"😤 {batter.name} is hit by the pitch!"
        elif play_type == PlayType.ERROR:
            return f"⚠️ Error on the play! {batter.name} reaches base"
        else:
            return f"{batter.name} - {play_type.value}"
    
    def _calculate_play_impact(self, play_type: PlayType, runners_on_base: int) -> float:
        """Calculate play impact with context"""
        base_impacts = {
            PlayType.HOMERUN: 0.9,
            PlayType.TRIPLE: 0.6,
            PlayType.DOUBLE: 0.4,
            PlayType.SINGLE: 0.3,
            PlayType.ERROR: 0.35,
            PlayType.WALK: 0.15,
            PlayType.HIT_BY_PITCH: 0.2,
            PlayType.STRIKEOUT: 0.1,
            PlayType.GROUNDOUT: 0.05,
            PlayType.FLYOUT: 0.05
        }
        
        impact = base_impacts.get(play_type, 0.1)
        
        # Adjust for runners on base
        if runners_on_base > 0:
            impact *= (1 + runners_on_base * 0.2)
            
        return min(1.0, impact)
    
    def update_enhanced_game_state(self, event: GameEvent):
        """Update game state with enhanced logic"""
        # Calculate and apply momentum shift
        game_context = {
            'inning': self.inning,
            'score_diff': self.home_score - self.away_score,
            'runners_on_base': self.base_runners.get_runner_count()
        }
        
        momentum_shift = self.analytics.calculate_momentum_shift(event, game_context)
        event.momentum_shift = momentum_shift
        
        if event.team == "home":
            self.home_momentum = min(90, self.home_momentum + momentum_shift)
            self.away_momentum = max(10, self.away_momentum - momentum_shift * 0.5)
        else:
            self.away_momentum = min(90, self.away_momentum + momentum_shift)
            self.home_momentum = max(10, self.home_momentum - momentum_shift * 0.5)
        
        # Normalize momentum
        total = self.home_momentum + self.away_momentum
        self.home_momentum = (self.home_momentum / total) * 100
        self.away_momentum = (self.away_momentum / total) * 100
        
        # Handle different play types
        if event.type in [PlayType.STRIKEOUT, PlayType.GROUNDOUT, PlayType.FLYOUT]:
            self.outs += 1
            if self.outs >= 3:
                self.switch_half_inning()
        elif event.type == PlayType.HOMERUN:
            # Score all runners plus batter
            runs = 1 + self.base_runners.get_runner_count()
            if event.team == "home":
                self.home_score += runs
            else:
                self.away_score += runs
            event.player.home_runs += 1
            event.player.rbis += runs
            self.base_runners.clear_bases()
        elif event.type == PlayType.TRIPLE:
            scored = self.base_runners.add_runner(event.player, 3)
            runs = len(scored)
            if runs > 0:
                if event.team == "home":
                    self.home_score += runs
                else:
                    self.away_score += runs
                event.player.rbis += runs
        elif event.type == PlayType.DOUBLE:
            scored = self.base_runners.add_runner(event.player, 2)
            runs = len(scored)
            if runs > 0:
                if event.team == "home":
                    self.home_score += runs
                else:
                    self.away_score += runs
                event.player.rbis += runs
        elif event.type in [PlayType.SINGLE, PlayType.ERROR]:
            scored = self.base_runners.add_runner(event.player, 1)
            runs = len(scored)
            if runs > 0:
                if event.team == "home":
                    self.home_score += runs
                else:
                    self.away_score += runs
                event.player.rbis += runs
        elif event.type in [PlayType.WALK, PlayType.HIT_BY_PITCH]:
            # Only advance if forced
            if self.base_runners.first_base:
                if self.base_runners.second_base:
                    if self.base_runners.third_base:
                        # Bases loaded, score a run
                        if event.team == "home":
                            self.home_score += 1
                        else:
                            self.away_score += 1
                        event.player.rbis += 1
                    self.base_runners.third_base = self.base_runners.second_base
                self.base_runners.second_base = self.base_runners.first_base
            self.base_runners.first_base = event.player
    
    def switch_half_inning(self):
        """Switch between top and bottom of inning"""
        self.outs = 0
        self.balls = 0
        self.strikes = 0
        self.base_runners.clear_bases()
        
        if self.top_bottom == "top":
            self.top_bottom = "bottom"
        else:
            self.top_bottom = "top"
            self.inning += 1
    
    def format_enhanced_display(self) -> str:
        """Format enhanced game display"""
        # Calculate win probability
        home_wp, away_wp = self.analytics.calculate_win_probability(
            self.home_score, self.away_score, self.inning, self.top_bottom, self.outs
        )
        
        # Format base runners display
        bases = []
        if self.base_runners.first_base:
            bases.append(f"1B: {self.base_runners.first_base.name}")
        if self.base_runners.second_base:
            bases.append(f"2B: {self.base_runners.second_base.name}")
        if self.base_runners.third_base:
            bases.append(f"3B: {self.base_runners.third_base.name}")
        bases_str = " | ".join(bases) if bases else "Bases Empty"
        
        display = f"""
╔════════════════════════════════════════════════════════════════════╗
║  🏟️  LONE STAR LEGENDS CHAMPIONSHIP - ENHANCED SIMULATION  🏟️     ║
╠════════════════════════════════════════════════════════════════════╣
║  Inning: {self.inning} - {self.top_bottom.upper():6} | Outs: {self.outs} | Count: {self.balls}-{self.strikes}           ║
║  HOME: {self.home_score:2} | AWAY: {self.away_score:2}                                               ║
╟────────────────────────────────────────────────────────────────────╢
║  📊 MOMENTUM                                                       ║
║  Home: {self.home_momentum:5.1f}% ▰{'▰' * int(self.home_momentum/5):20}                        ║
║  Away: {self.away_momentum:5.1f}% ▰{'▰' * int(self.away_momentum/5):20}                        ║
╟────────────────────────────────────────────────────────────────────╢
║  📈 WIN PROBABILITY                                                ║
║  Home: {home_wp:5.1f}% | Away: {away_wp:5.1f}%                                    ║
╟────────────────────────────────────────────────────────────────────╢
║  ⚾ BASES: {bases_str:55} ║
╚════════════════════════════════════════════════════════════════════╝
        """
        return display
    
    async def simulate_enhanced_game(self, max_innings: int = 9):
        """Run enhanced baseball simulation"""
        print("\n" + "="*70)
        print("⚾ STARTING ENHANCED BASEBALL SIMULATION WITH BLAZE ANALYTICS ⚾")
        print("="*70)
        
        self.game_active = True
        play_count = 0
        
        while self.inning <= max_innings or (self.inning > max_innings and self.home_score == self.away_score):
            # Generate play
            event = self.generate_enhanced_play()
            play_count += 1
            
            # Update game state
            self.update_enhanced_game_state(event)
            
            # Display current state
            print(self.format_enhanced_display())
            
            # Show play result
            print(f"\n🎮 Play #{play_count}: {event.description}")
            
            if event.type in [PlayType.SINGLE, PlayType.DOUBLE, PlayType.TRIPLE, PlayType.HOMERUN]:
                print(f"   ⚡ Exit Velocity: {event.exit_velocity:.1f} mph")
                print(f"   📐 Launch Angle: {event.launch_angle:.1f}°")
                print(f"   📏 Distance: {event.distance:.0f} ft")
            
            if event.momentum_shift > 10:
                print(f"   🔥 MOMENTUM SHIFT: {event.momentum_shift:.1f}%")
            
            # Check for game ending
            if self.inning >= max_innings and self.top_bottom == "bottom":
                if self.home_score != self.away_score:
                    break
            
            # Delay for readability
            await asyncio.sleep(2)
        
        # Game summary
        self.game_active = False
        print("\n" + "="*70)
        print("🏆 GAME SIMULATION COMPLETE! 🏆")
        print("="*70)
        print(f"\nFinal Score: HOME {self.home_score} - {self.away_score} AWAY")
        print(f"Total Plays: {play_count}")
        print(f"Final Momentum: Home {self.home_momentum:.1f}% | Away {self.away_momentum:.1f}%")
        
        # Display critical plays
        if self.analytics.critical_plays:
            print("\n🌟 CRITICAL PLAYS:")
            for i, play in enumerate(self.analytics.critical_plays[:5], 1):
                print(f"  {i}. Inning {play['inning']}: {play['play'][:50]}... (Shift: {play['shift']:.1f}%)")
        
        # Top performers
        print("\n🏅 TOP PERFORMERS:")
        all_players = self.home_lineup + self.away_lineup
        top_hitters = sorted([p for p in all_players if p.at_bats > 0], 
                           key=lambda x: x.hits/x.at_bats if x.at_bats > 0 else 0, 
                           reverse=True)[:3]
        
        for i, player in enumerate(top_hitters, 1):
            avg = player.hits/player.at_bats if player.at_bats > 0 else 0
            print(f"  {i}. {player.name} ({player.position}): {player.hits}-{player.at_bats} (.{avg*1000:.0f})")
        
        # Winner
        if self.home_score > self.away_score:
            print("\n🎉 LONE STAR LEGENDS WIN!")
        elif self.away_score > self.home_score:
            print("\n🎉 CHAMPIONSHIP CHALLENGERS WIN!")
        else:
            print("\n⚾ GAME TIED - WOULD GO TO EXTRA INNINGS!")
        
        # Save game data
        game_data = {
            "final_score": {"home": self.home_score, "away": self.away_score},
            "total_plays": play_count,
            "innings_played": self.inning,
            "final_momentum": {"home": self.home_momentum, "away": self.away_momentum},
            "critical_plays": self.analytics.critical_plays[:10],
            "timestamp": time.time()
        }
        
        with open("/private/tmp/lone-star-legends-championship/enhanced_game_data.json", "w") as f:
            json.dump(game_data, f, indent=2)
        
        print("\n📊 Enhanced game data saved!")
        print("🔥 Blaze Intelligence analytics complete!")

async def main():
    """Run the enhanced baseball simulation"""
    simulator = EnhancedBaseballSimulation()
    
    print("🔥 BLAZE INTELLIGENCE + ENHANCED PHYSICS ENGINE")
    print("⚾ Advanced Baseball Simulation System")
    print("-" * 50)
    print("Features:")
    print("• Realistic player statistics")
    print("• Advanced physics calculations")
    print("• Base running simulation")
    print("• Win probability tracking")
    print("• Critical play detection")
    print("• Momentum analysis")
    print("-" * 50)
    
    await simulator.simulate_enhanced_game(max_innings=9)

if __name__ == "__main__":
    asyncio.run(main())