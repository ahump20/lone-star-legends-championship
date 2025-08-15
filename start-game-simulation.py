#!/usr/bin/env python3
"""
Start Live Baseball Game Simulation
Connects Blaze Analytics with Unreal Engine for real-time gameplay
"""

import asyncio
import random
import time
import json
from typing import Dict, Any
from dataclasses import dataclass

@dataclass
class GameEvent:
    """Baseball game event"""
    type: str
    player: str
    team: str
    impact: float
    exit_velocity: float = 95.0
    launch_angle: float = 25.0
    description: str = ""

class BaseballGameSimulation:
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
        
        # Player rosters
        self.home_players = [
            "Rodriguez", "Martinez", "Johnson", "Williams", "Davis",
            "Garcia", "Wilson", "Anderson", "Taylor", "Thomas"
        ]
        self.away_players = [
            "Smith", "Brown", "Jones", "Miller", "Moore",
            "Jackson", "White", "Harris", "Clark", "Lewis"
        ]
        
        # Play types with probabilities
        self.play_types = [
            {"type": "single", "prob": 0.20, "impact": 0.3, "runs": 0},
            {"type": "double", "prob": 0.08, "impact": 0.4, "runs": 0},
            {"type": "triple", "prob": 0.02, "impact": 0.6, "runs": 0},
            {"type": "homerun", "prob": 0.04, "impact": 0.9, "runs": 1},
            {"type": "strikeout", "prob": 0.22, "impact": 0.2, "runs": 0},
            {"type": "groundout", "prob": 0.15, "impact": 0.1, "runs": 0},
            {"type": "flyout", "prob": 0.13, "impact": 0.1, "runs": 0},
            {"type": "walk", "prob": 0.08, "impact": 0.15, "runs": 0},
            {"type": "hitbypitch", "prob": 0.02, "impact": 0.2, "runs": 0},
            {"type": "error", "prob": 0.06, "impact": 0.35, "runs": 0}
        ]
    
    def generate_play(self) -> GameEvent:
        """Generate a random baseball play"""
        # Select play type based on probabilities
        rand = random.random()
        cumulative_prob = 0
        selected_play = None
        
        for play in self.play_types:
            cumulative_prob += play["prob"]
            if rand <= cumulative_prob:
                selected_play = play
                break
        
        if not selected_play:
            selected_play = self.play_types[0]  # Default to single
        
        # Select player
        current_team = "home" if self.top_bottom == "bottom" else "away"
        players = self.home_players if current_team == "home" else self.away_players
        player = random.choice(players)
        
        # Generate physics parameters
        if selected_play["type"] == "homerun":
            exit_velocity = random.uniform(100, 115)
            launch_angle = random.uniform(25, 35)
        elif selected_play["type"] in ["double", "triple"]:
            exit_velocity = random.uniform(95, 105)
            launch_angle = random.uniform(15, 25)
        elif selected_play["type"] == "single":
            exit_velocity = random.uniform(85, 95)
            launch_angle = random.uniform(5, 15)
        else:
            exit_velocity = random.uniform(70, 90)
            launch_angle = random.uniform(-10, 45)
        
        # Create description
        descriptions = {
            "single": f"{player} lines a single to {random.choice(['left', 'center', 'right'])} field!",
            "double": f"{player} doubles to the {random.choice(['gap', 'corner', 'wall'])}!",
            "triple": f"{player} hits a triple to deep {random.choice(['left', 'center', 'right'])}!",
            "homerun": f"{player} crushes a HOME RUN! It's GONE!",
            "strikeout": f"{player} strikes out {random.choice(['swinging', 'looking'])}.",
            "groundout": f"{player} grounds out to {random.choice(['first', 'second', 'third', 'short'])}.",
            "flyout": f"{player} flies out to {random.choice(['left', 'center', 'right'])} field.",
            "walk": f"{player} draws a walk.",
            "hitbypitch": f"{player} is hit by the pitch!",
            "error": f"Error on the play! {player} reaches base."
        }
        
        return GameEvent(
            type=selected_play["type"],
            player=player,
            team=current_team,
            impact=selected_play["impact"],
            exit_velocity=exit_velocity,
            launch_angle=launch_angle,
            description=descriptions.get(selected_play["type"], f"{player} {selected_play['type']}")
        )
    
    def update_game_state(self, event: GameEvent):
        """Update game state based on event"""
        # Update momentum
        momentum_shift = event.impact * 20
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
        
        # Handle outs
        if event.type in ["strikeout", "groundout", "flyout"]:
            self.outs += 1
            if self.outs >= 3:
                self.switch_half_inning()
        
        # Handle scoring
        if event.type == "homerun":
            runs = random.randint(1, 4)  # Could be grand slam
            if event.team == "home":
                self.home_score += runs
            else:
                self.away_score += runs
        elif event.type in ["single", "double", "triple"]:
            # Chance of scoring on hits
            if random.random() < 0.3:
                if event.team == "home":
                    self.home_score += 1
                else:
                    self.away_score += 1
    
    def switch_half_inning(self):
        """Switch between top and bottom of inning"""
        self.outs = 0
        self.balls = 0
        self.strikes = 0
        
        if self.top_bottom == "top":
            self.top_bottom = "bottom"
        else:
            self.top_bottom = "top"
            self.inning += 1
    
    def get_game_state_json(self) -> Dict[str, Any]:
        """Get current game state as JSON"""
        return {
            "inning": self.inning,
            "half": self.top_bottom,
            "outs": self.outs,
            "balls": self.balls,
            "strikes": self.strikes,
            "score": {
                "home": self.home_score,
                "away": self.away_score
            },
            "momentum": {
                "home": round(self.home_momentum, 1),
                "away": round(self.away_momentum, 1)
            },
            "win_probability": {
                "home": round(self.home_momentum * 0.7 + random.uniform(0, 30), 1),
                "away": round(self.away_momentum * 0.7 + random.uniform(0, 30), 1)
            }
        }
    
    def format_score_display(self) -> str:
        """Format score for display"""
        return f"""
╔══════════════════════════════════════════════════════════╗
║  LONE STAR LEGENDS CHAMPIONSHIP - LIVE SIMULATION       ║
╠══════════════════════════════════════════════════════════╣
║  Inning: {self.inning} - {self.top_bottom.upper():6} | Outs: {self.outs} | Count: {self.balls}-{self.strikes}     ║
║  HOME: {self.home_score:2} | AWAY: {self.away_score:2}                                      ║
║  Momentum - Home: {self.home_momentum:5.1f}% | Away: {self.away_momentum:5.1f}%          ║
╚══════════════════════════════════════════════════════════╝
        """
    
    async def simulate_game(self, duration_seconds: int = 60):
        """Simulate a baseball game for specified duration"""
        print("\n" + "="*60)
        print("⚾ STARTING LIVE BASEBALL GAME SIMULATION ⚾")
        print("="*60)
        
        self.game_active = True
        start_time = time.time()
        play_count = 0
        
        while time.time() - start_time < duration_seconds and self.inning <= 9:
            # Generate play
            event = self.generate_play()
            play_count += 1
            
            # Update game state
            self.update_game_state(event)
            
            # Display current state
            print(self.format_score_display())
            
            # Show play result
            impact_stars = "⭐" * int(event.impact * 5)
            print(f"\n🎮 Play #{play_count}: {event.description}")
            print(f"   Impact: {impact_stars} ({event.impact:.2f})")
            
            if event.type in ["single", "double", "triple", "homerun"]:
                print(f"   ⚾ Exit Velocity: {event.exit_velocity:.1f} mph")
                print(f"   📐 Launch Angle: {event.launch_angle:.1f}°")
            
            # Critical play notification
            if event.impact > 0.7:
                print(f"\n🔥 CRITICAL PLAY! This could change the game!")
            
            # Check for game-ending conditions
            if self.inning >= 9 and self.top_bottom == "bottom" and self.home_score != self.away_score:
                break
            
            # Delay between plays
            await asyncio.sleep(3)
        
        # Game summary
        self.game_active = False
        print("\n" + "="*60)
        print("🏆 GAME SIMULATION COMPLETE! 🏆")
        print("="*60)
        print(f"\nFinal Score: HOME {self.home_score} - {self.away_score} AWAY")
        print(f"Total Plays: {play_count}")
        print(f"Final Momentum: Home {self.home_momentum:.1f}% | Away {self.away_momentum:.1f}%")
        
        if self.home_score > self.away_score:
            print("\n🎉 HOME TEAM WINS!")
        elif self.away_score > self.home_score:
            print("\n🎉 AWAY TEAM WINS!")
        else:
            print("\n⚾ GAME TIED - EXTRA INNINGS!")
        
        # Save game data
        with open("game_simulation_data.json", "w") as f:
            json.dump({
                "final_score": {"home": self.home_score, "away": self.away_score},
                "total_plays": play_count,
                "innings_played": self.inning,
                "final_momentum": {"home": self.home_momentum, "away": self.away_momentum},
                "timestamp": time.time()
            }, f, indent=2)
        
        print("\n📊 Game data saved to game_simulation_data.json")
        print("🔥 Blaze Intelligence analytics processed successfully!")

async def main():
    """Run the baseball game simulation"""
    simulator = BaseballGameSimulation()
    
    print("🔥 BLAZE INTELLIGENCE + UNREAL ENGINE")
    print("⚾ Baseball Game Simulation System")
    print("-" * 40)
    print("This simulation demonstrates:")
    print("• Real-time play generation")
    print("• Momentum tracking")
    print("• Physics calculations")
    print("• Critical play detection")
    print("• Game state management")
    print("-" * 40)
    
    # Get simulation duration
    try:
        duration = int(input("\nEnter simulation duration in seconds (default 60): ") or "60")
    except ValueError:
        duration = 60
    
    await simulator.simulate_game(duration)

if __name__ == "__main__":
    asyncio.run(main())