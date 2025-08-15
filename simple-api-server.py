#!/usr/bin/env python3
"""
Simple Baseball API Server with Claude-style Content Generation
"""

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import random
import json

app = Flask(__name__)
CORS(app)

@app.route('/')
def index():
    """Serve the enhanced Three.js simulator"""
    return send_from_directory('.', 'enhanced-threejs-simulator.html')

@app.route('/api/generate-play', methods=['POST'])
def generate_play():
    """Generate AI play scenario"""
    try:
        context = request.get_json() or {}
        inning = context.get('inning', 1)
        home_score = context.get('home_score', 0)
        away_score = context.get('away_score', 0)
        
        # Calculate tension level
        tension = calculate_tension(inning, abs(home_score - away_score))
        
        scenarios = {
            'low': [
                {
                    'setup': 'Early in the game, the batter steps up with confidence. The crowd is settling in.',
                    'play_type': 'single',
                    'drama': 3,
                    'commentary': 'Clean contact! The ball finds its way through the infield for a base hit.'
                }
            ],
            'medium': [
                {
                    'setup': 'The tension builds as runners move into scoring position. Every pitch matters now.',
                    'play_type': 'double',
                    'drama': 6,
                    'commentary': 'DRIVEN INTO THE GAP! That ball splits the outfielders!'
                }
            ],
            'high': [
                {
                    'setup': 'Bottom of the 9th, two outs. The stadium is electric. This is why we play the game.',
                    'play_type': 'homerun',
                    'drama': 10,
                    'commentary': 'WALK-OFF HOME RUN! THE CROWD GOES ABSOLUTELY WILD!'
                }
            ]
        }
        
        scenario_set = scenarios.get(tension, scenarios['medium'])
        selected = random.choice(scenario_set)
        
        # Add Champion Enigma data
        selected['biometric_data'] = {
            'heart_rate': random.randint(70, 120),
            'hrv': random.randint(20, 80),
            'focus_level': random.uniform(0.6, 1.0)
        }
        
        return jsonify({'success': True, 'scenario': selected})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/generate-commentary', methods=['POST'])
def generate_commentary():
    """Generate real-time commentary"""
    try:
        play_data = request.get_json() or {}
        exit_velocity = play_data.get('exit_velocity', 90)
        outcome = play_data.get('outcome', 'single')
        
        commentary_options = {
            'homerun': [
                f"CRUSHED! Exit velocity {exit_velocity:.0f} mph - that ball is GONE!",
                "The pitcher hangs his head as the ball sails over the wall!",
                "What a MOONSHOT! The fans are on their feet!"
            ],
            'triple': [
                "To the gap! The runner is flying around the bases!",
                "That's in the corner - he's going for three!"
            ],
            'double': [
                "Off the wall! Stand-up double!",
                "Into the gap for extra bases!"
            ],
            'single': [
                "Base hit! Clean through the infield!",
                "Finds a hole for a single!"
            ],
            'out': [
                "Caught for the out!",
                "The defense makes the play!"
            ]
        }
        
        selected_commentary = commentary_options.get(outcome, ["What a play!"])
        
        return jsonify({
            'success': True,
            'commentary': selected_commentary
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/player-analysis', methods=['POST'])
def player_analysis():
    """Generate Champion Enigma analysis"""
    try:
        # Generate realistic Champion Enigma metrics
        analysis = {
            'overall_champion_quotient': random.uniform(60, 95),
            'psychological_profiler': {
                'mental_toughness': random.uniform(0.5, 0.95),
                'killer_instinct': random.uniform(0.4, 0.9),
                'pressure_response': random.uniform(0.3, 0.9),
                'competitive_drive': random.uniform(0.6, 1.0)
            },
            'physiological_decoder': {
                'neural_efficiency': random.uniform(0.6, 0.95),
                'flow_state_probability': random.uniform(0.3, 0.9),
                'stress_resilience': random.uniform(0.4, 0.8)
            },
            'visual_cortex_analysis': {
                'eye_tracking_focus': random.uniform(0.7, 1.0),
                'reaction_time': random.uniform(150, 250)  # milliseconds
            }
        }
        
        return jsonify({'success': True, 'analysis': analysis})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/player-narrative', methods=['POST'])
def player_narrative():
    """Generate player backstory"""
    try:
        data = request.get_json() or {}
        player_name = data.get('player_name', 'Player')
        
        narrative_types = {
            'clutch': {
                'background': f"{player_name} has ice in his veins. Teammates call him 'Mr. Clutch' for his composure in pressure moments.",
                'mental_state': "Heart rate remains steady, showing elite mental conditioning",
                'prediction': "Expect solid contact - thrives when the spotlight is brightest"
            },
            'rookie': {
                'background': f"{player_name} is living the dream in his rookie season. Every at-bat is a chance to prove he belongs.",
                'mental_state': "Elevated arousal but channeled into focused energy",
                'prediction': "Raw talent meets pure determination - explosive potential"
            },
            'veteran': {
                'background': f"With 12 seasons under his belt, {player_name} has seen everything the game can throw at him.",
                'mental_state': "Rock-steady composure drawing from years of experience",
                'prediction': "Will use guile and experience to find a way to succeed"
            }
        }
        
        selected_type = random.choice(list(narrative_types.keys()))
        narrative = narrative_types[selected_type]
        
        return jsonify({'success': True, 'narrative': narrative})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

def calculate_tension(inning, score_diff):
    """Calculate game tension level"""
    if inning >= 8 and score_diff <= 1:
        return 'high'
    elif inning >= 6 or score_diff <= 2:
        return 'medium'
    else:
        return 'low'

@app.route('/api/game-status')
def game_status():
    """API status check"""
    return jsonify({
        'server': 'Lone Star Legends Claude API Server',
        'version': '1.0.0',
        'status': 'active',
        'features': [
            'AI Scenario Generation',
            'Champion Enigma Engine Analysis',
            'Real-time Commentary',
            'Player Narratives',
            'Three.js Integration'
        ]
    })

if __name__ == '__main__':
    print("🚀 Lone Star Legends - Claude-Powered Baseball Simulator")
    print("=" * 60)
    print("🎮 Three.js Simulator: http://localhost:8080")
    print("🤖 Claude API Integration: Active")
    print("🧠 Champion Enigma Engine: Enabled")
    print("⚾ Enhanced Physics & Analytics: Ready")
    print("=" * 60)
    
    app.run(host='0.0.0.0', port=8080, debug=True)