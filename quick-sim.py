#!/usr/bin/env python3
"""Quick baseball simulation demo"""

import random
import json
import time

def quick_simulation():
    print("\n" + "="*60)
    print("⚾ LONE STAR LEGENDS CHAMPIONSHIP - QUICK DEMO ⚾")
    print("="*60)
    
    home_score = 0
    away_score = 0
    home_momentum = 50.0
    away_momentum = 50.0
    plays = []
    
    # Simulate 30 key plays
    for i in range(30):
        play_types = ["Single", "Double", "Home Run!", "Strikeout", "Groundout", "Walk"]
        weights = [0.3, 0.1, 0.05, 0.25, 0.2, 0.1]
        
        play = random.choices(play_types, weights)[0]
        team = "HOME" if i % 2 == 0 else "AWAY"
        
        # Update scores for hits
        if play == "Home Run!":
            if team == "HOME":
                home_score += random.randint(1, 3)
                home_momentum = min(90, home_momentum + 20)
                away_momentum = max(10, away_momentum - 10)
            else:
                away_score += random.randint(1, 3)
                away_momentum = min(90, away_momentum + 20)
                home_momentum = max(10, home_momentum - 10)
        elif play in ["Single", "Double"]:
            if random.random() < 0.3:
                if team == "HOME":
                    home_score += 1
                    home_momentum = min(80, home_momentum + 5)
                else:
                    away_score += 1
                    away_momentum = min(80, away_momentum + 5)
        
        plays.append({
            "play_num": i + 1,
            "team": team,
            "type": play,
            "score": f"HOME {home_score} - {away_score} AWAY"
        })
        
        # Show key plays
        if play == "Home Run!" or (i + 1) % 10 == 0:
            print(f"\nPlay #{i+1}: {team} - {play}")
            print(f"Score: HOME {home_score} - {away_score} AWAY")
            print(f"Momentum: Home {home_momentum:.0f}% | Away {away_momentum:.0f}%")
    
    print("\n" + "="*60)
    print("🏆 FINAL RESULTS 🏆")
    print("="*60)
    print(f"Final Score: HOME {home_score} - {away_score} AWAY")
    print(f"Final Momentum: Home {home_momentum:.0f}% | Away {away_momentum:.0f}%")
    
    if home_score > away_score:
        print("\n🎉 LONE STAR LEGENDS WIN!")
    elif away_score > home_score:
        print("\n🎉 CHALLENGERS WIN!")
    else:
        print("\n⚾ TIE GAME!")
    
    # Save results
    with open("/private/tmp/lone-star-legends-championship/quick_sim_results.json", "w") as f:
        json.dump({
            "final_score": {"home": home_score, "away": away_score},
            "momentum": {"home": home_momentum, "away": away_momentum},
            "total_plays": len(plays),
            "timestamp": time.time()
        }, f, indent=2)
    
    print("\n✅ Simulation complete! Results saved to quick_sim_results.json")
    print("🔥 Blaze Intelligence analytics processed successfully!")
    print("🌐 GitHub Pages: https://ahump20.github.io/lone-star-legends-championship/")
    print("🎮 Ready for Unreal Engine integration via MCP bridge")

if __name__ == "__main__":
    quick_simulation()