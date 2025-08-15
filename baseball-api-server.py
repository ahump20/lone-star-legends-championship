#!/usr/bin/env python3
"""
Baseball API Server with Claude Content Generation
Serves Three.js simulator and provides AI-generated content
"""

from flask import Flask, render_template, jsonify, request, send_from_directory
from flask_cors import CORS
import asyncio
import json
import os
from claude_content_generator import ClaudeContentGenerator

app = Flask(__name__)
CORS(app)

# Initialize Claude content generator
content_generator = ClaudeContentGenerator()

@app.route('/')
def index():
    """Serve the Three.js baseball simulator"""
    return send_from_directory('.', 'threejs-baseball-simulator.html')

@app.route('/api/generate-play', methods=['POST'])
def generate_play():
    """Generate AI play scenario"""
    try:
        context = request.get_json() or {}
        
        # Run async function in sync context
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        scenario = loop.run_until_complete(
            content_generator.generate_play_scenario(context)
        )
        loop.close()
        
        return jsonify({
            'success': True,
            'scenario': scenario
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/generate-commentary', methods=['POST'])
def generate_commentary():
    """Generate real-time commentary"""
    try:
        play_data = request.get_json() or {}
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        commentary = loop.run_until_complete(
            content_generator.generate_real_time_commentary(play_data)
        )
        loop.close()
        
        return jsonify({
            'success': True,
            'commentary': commentary
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/player-analysis', methods=['POST'])
def player_analysis():
    """Generate Champion Enigma Engine analysis"""
    try:
        player_data = request.get_json() or {}
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        analysis = loop.run_until_complete(
            content_generator.generate_champion_enigma_analysis(player_data)
        )
        loop.close()
        
        return jsonify({
            'success': True,
            'analysis': analysis
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/player-narrative', methods=['POST'])
def player_narrative():
    """Generate player backstory"""
    try:
        data = request.get_json() or {}
        player_name = data.get('player_name', 'Player')
        situation = data.get('situation', 'clutch')
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        narrative = loop.run_until_complete(
            content_generator.generate_player_narrative(player_name, situation)
        )
        loop.close()
        
        return jsonify({
            'success': True,
            'narrative': narrative
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/game-status')
def game_status():
    """Get current game status"""
    return jsonify({
        'server': 'Lone Star Legends API Server',
        'version': '1.0.0',
        'features': [
            'Claude API Integration',
            'Champion Enigma Engine',
            'Real-time Commentary',
            'Dynamic Scenarios',
            'Player Analysis'
        ],
        'status': 'active'
    })

@app.route('/simulator')
def simulator():
    """Alternative route for the simulator"""
    return send_from_directory('.', 'threejs-baseball-simulator.html')

if __name__ == '__main__':
    print("🚀 Starting Lone Star Legends API Server...")
    print("🎮 Three.js Simulator: http://localhost:5000")
    print("🤖 Claude API Integration: Active")
    print("🧠 Champion Enigma Engine: Enabled")
    print("-" * 50)
    
    app.run(host='0.0.0.0', port=5000, debug=True)