#!/usr/bin/env python3
"""
Baseball MCP Bridge Server
Connects Blaze Intelligence Analytics with Unreal Engine via MCP Protocol

This bridge enables real-time streaming of baseball analytics data to Unreal Engine
for 3D visualization and immersive game experiences.
"""

import asyncio
import json
import logging
import socket
import time
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
from mcp.server.fastmcp import FastMCP, Context
import sys
import os

# Import our existing Blaze components
try:
    from blaze_momentum_analyzer import BlazeMomentumAnalyzer
    from blaze_critical_plays import BlazeCriticalPlayAnalyzer
    from blaze_integration import BlazeIntegration
except ImportError:
    print("Warning: Blaze components not found. Running in simulation mode.")
    BlazeMomentumAnalyzer = None
    BlazeCriticalPlayAnalyzer = None
    BlazeIntegration = None

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("BaseballMCPBridge")

@dataclass
class GameState:
    """Current game state shared between Blaze Analytics and Unreal Engine"""
    inning: int = 1
    top_bottom: str = "top"
    home_score: int = 0
    away_score: int = 0
    outs: int = 0
    balls: int = 0
    strikes: int = 0
    runners_on_base: int = 0
    home_momentum: float = 50.0
    away_momentum: float = 50.0
    home_win_probability: float = 50.0
    away_win_probability: float = 50.0
    critical_play_likelihood: float = 25.0
    weather_conditions: str = "clear"
    stadium_lighting: str = "day"

class UnrealConnection:
    """Manages TCP connection to Unreal Engine MCP Plugin"""
    
    def __init__(self, host: str = "localhost", port: int = 55558):
        self.host = host
        self.port = port
        self.socket: Optional[socket.socket] = None
        self.connected = False
        
    async def connect(self) -> bool:
        """Establish connection to Unreal Engine"""
        try:
            self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.socket.settimeout(5.0)
            self.socket.connect((self.host, self.port))
            self.connected = True
            logger.info(f"Connected to Unreal Engine at {self.host}:{self.port}")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to Unreal Engine: {e}")
            self.connected = False
            return False
    
    async def send_command(self, command: str, params: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Send command to Unreal Engine and get response"""
        if not self.connected:
            logger.warning("Not connected to Unreal Engine")
            return None
            
        try:
            message = {
                "command": command,
                "params": params,
                "timestamp": time.time()
            }
            
            data = json.dumps(message).encode('utf-8')
            self.socket.sendall(len(data).to_bytes(4, byteorder='little'))
            self.socket.sendall(data)
            
            # Read response length
            response_length = int.from_bytes(self.socket.recv(4), byteorder='little')
            
            # Read response data
            response_data = b''
            while len(response_data) < response_length:
                chunk = self.socket.recv(response_length - len(response_data))
                if not chunk:
                    break
                response_data += chunk
            
            response = json.loads(response_data.decode('utf-8'))
            logger.debug(f"Unreal response: {response}")
            return response
            
        except Exception as e:
            logger.error(f"Error sending command to Unreal: {e}")
            self.connected = False
            return None
    
    def disconnect(self):
        """Close connection to Unreal Engine"""
        if self.socket:
            self.socket.close()
            self.connected = False
            logger.info("Disconnected from Unreal Engine")

class BaseballMCPBridge:
    """Main bridge server connecting Blaze Analytics with Unreal Engine"""
    
    def __init__(self):
        self.game_state = GameState()
        self.unreal = UnrealConnection()
        self.mcp = FastMCP("Baseball Analytics Bridge")
        
        # Initialize Blaze components if available
        if BlazeMomentumAnalyzer:
            self.momentum_analyzer = BlazeMomentumAnalyzer()
            self.critical_analyzer = BlazeCriticalPlayAnalyzer()
        else:
            self.momentum_analyzer = None
            self.critical_analyzer = None
        
        self.analytics_queue = asyncio.Queue()
        self.running = False
        
        self.register_mcp_tools()
    
    def register_mcp_tools(self):
        """Register MCP tools for baseball game control"""
        
        @self.mcp.tool()
        async def create_baseball_stadium(
            ctx: Context,
            stadium_name: str = "Lone Star Stadium",
            field_type: str = "MLB",
            lighting: str = "day",
            weather: str = "clear"
        ) -> Dict[str, Any]:
            """Create a baseball stadium in Unreal Engine with Blaze Analytics integration"""
            
            params = {
                "name": stadium_name,
                "field_type": field_type,
                "lighting": lighting,
                "weather": weather,
                "analytics_enabled": True,
                "blaze_integration": True
            }
            
            response = await self.unreal.send_command("create_baseball_stadium", params)
            if response and response.get("success"):
                self.game_state.stadium_lighting = lighting
                self.game_state.weather_conditions = weather
                logger.info(f"Created baseball stadium: {stadium_name}")
            
            return response or {"success": False, "message": "Failed to create stadium"}
        
        @self.mcp.tool()
        async def update_stadium_analytics(
            ctx: Context,
            momentum_home: float,
            momentum_away: float,
            critical_likelihood: float,
            win_prob_home: float
        ) -> Dict[str, Any]:
            """Update stadium visual effects based on Blaze Analytics data"""
            
            params = {
                "momentum": {
                    "home": momentum_home,
                    "away": momentum_away
                },
                "critical_likelihood": critical_likelihood,
                "win_probability": {
                    "home": win_prob_home,
                    "away": 100 - win_prob_home
                },
                "lighting_intensity": momentum_home / 100.0,
                "crowd_excitement": critical_likelihood / 100.0
            }
            
            response = await self.unreal.send_command("update_analytics_visualization", params)
            
            if response and response.get("success"):
                self.game_state.home_momentum = momentum_home
                self.game_state.away_momentum = momentum_away
                self.game_state.critical_play_likelihood = critical_likelihood
                self.game_state.home_win_probability = win_prob_home
            
            return response or {"success": False, "message": "Failed to update analytics"}
        
        @self.mcp.tool()
        async def simulate_baseball_play(
            ctx: Context,
            play_type: str,
            player_name: str,
            team: str,
            exit_velocity: float = 95.0,
            launch_angle: float = 25.0,
            impact_score: float = 0.5
        ) -> Dict[str, Any]:
            """Simulate a baseball play with physics and analytics"""
            
            # Process through Blaze Analytics if available
            analytics_result = None
            if self.momentum_analyzer and self.critical_analyzer:
                event = {
                    "type": play_type,
                    "team": team.lower(),
                    "inning": self.game_state.inning,
                    "topBottom": self.game_state.top_bottom,
                    "outs": self.game_state.outs,
                    "scoreDifferential": self.game_state.home_score - self.game_state.away_score
                }
                
                momentum_result = self.momentum_analyzer.processEvent(event)
                
                play_data = {
                    "type": play_type,
                    "player": player_name,
                    "exitVelocity": exit_velocity,
                    "launchAngle": launch_angle
                }
                
                context = {
                    "inning": self.game_state.inning,
                    "topBottom": self.game_state.top_bottom,
                    "outs": self.game_state.outs,
                    "homeScore": self.game_state.home_score,
                    "awayScore": self.game_state.away_score
                }
                
                critical_result = self.critical_analyzer.analyzePlay(play_data, context)
                
                analytics_result = {
                    "momentum": momentum_result,
                    "critical": critical_result
                }
            
            # Send to Unreal Engine for 3D simulation
            params = {
                "play_type": play_type,
                "player_name": player_name,
                "team": team,
                "physics": {
                    "exit_velocity": exit_velocity,
                    "launch_angle": launch_angle,
                    "spin_rate": 2400,  # Default spin rate
                    "wind_effect": True
                },
                "analytics": analytics_result,
                "impact_score": impact_score,
                "camera_focus": True,
                "replay_enabled": critical_result.get("isCritical", False) if analytics_result else impact_score > 0.7
            }
            
            response = await self.unreal.send_command("simulate_baseball_play", params)
            
            # Update game state
            if response and response.get("success"):
                if analytics_result:
                    momentum = analytics_result["momentum"]["momentum"]
                    self.game_state.home_momentum = momentum["home"]
                    self.game_state.away_momentum = momentum["away"]
                
                # Update analytics visualization
                await self.update_stadium_analytics(
                    ctx,
                    self.game_state.home_momentum,
                    self.game_state.away_momentum,
                    self.game_state.critical_play_likelihood,
                    self.game_state.home_win_probability
                )
            
            return response or {"success": False, "message": "Failed to simulate play"}
        
        @self.mcp.tool()
        async def set_stadium_weather(
            ctx: Context,
            weather_type: str = "clear",
            wind_speed: float = 0.0,
            wind_direction: float = 0.0,
            temperature: float = 75.0
        ) -> Dict[str, Any]:
            """Set stadium weather conditions affecting gameplay"""
            
            params = {
                "weather_type": weather_type,
                "wind_speed": wind_speed,
                "wind_direction": wind_direction,
                "temperature": temperature,
                "humidity": 50.0,
                "update_physics": True
            }
            
            response = await self.unreal.send_command("set_stadium_weather", params)
            
            if response and response.get("success"):
                self.game_state.weather_conditions = weather_type
            
            return response or {"success": False, "message": "Failed to set weather"}
        
        @self.mcp.tool()
        async def get_game_state(ctx: Context) -> Dict[str, Any]:
            """Get current game state from both analytics and Unreal Engine"""
            
            # Get analytics data
            analytics_data = {}
            if self.momentum_analyzer:
                analytics_data = {
                    "momentum": self.momentum_analyzer.getVisualizationData(),
                    "predictions": self.momentum_analyzer.getPredictions()
                }
            
            if self.critical_analyzer:
                analytics_data["critical_plays"] = self.critical_analyzer.getVisualizationData()
            
            # Get Unreal Engine state
            unreal_response = await self.unreal.send_command("get_game_state", {})
            
            return {
                "success": True,
                "game_state": {
                    "inning": self.game_state.inning,
                    "score": f"{self.game_state.home_score}-{self.game_state.away_score}",
                    "outs": self.game_state.outs,
                    "count": f"{self.game_state.balls}-{self.game_state.strikes}",
                    "momentum": {
                        "home": self.game_state.home_momentum,
                        "away": self.game_state.away_momentum
                    },
                    "weather": self.game_state.weather_conditions,
                    "lighting": self.game_state.stadium_lighting
                },
                "analytics": analytics_data,
                "unreal_state": unreal_response
            }
    
    async def start_analytics_streaming(self):
        """Start real-time analytics streaming to Unreal Engine"""
        logger.info("Starting analytics streaming...")
        
        while self.running:
            try:
                if self.unreal.connected and self.momentum_analyzer:
                    # Get current analytics data
                    momentum_data = self.momentum_analyzer.getVisualizationData()
                    predictions = self.momentum_analyzer.getPredictions()
                    
                    # Stream to Unreal Engine
                    await self.update_stadium_analytics(
                        None,  # No context needed for internal calls
                        momentum_data["current"]["home"],
                        momentum_data["current"]["away"],
                        predictions.get("confidence", 0.5) * 100,
                        predictions.get("homeWinProbability", 0.5) * 100
                    )
                
                await asyncio.sleep(1.0)  # Update every second
                
            except Exception as e:
                logger.error(f"Error in analytics streaming: {e}")
                await asyncio.sleep(5.0)  # Wait before retrying
    
    async def start(self):
        """Start the MCP bridge server"""
        logger.info("Starting Baseball MCP Bridge...")
        
        # Connect to Unreal Engine
        if not await self.unreal.connect():
            logger.warning("Could not connect to Unreal Engine. Continuing in analytics-only mode.")
        
        self.running = True
        
        # Start analytics streaming task
        streaming_task = asyncio.create_task(self.start_analytics_streaming())
        
        try:
            # Start MCP server
            await self.mcp.run()
        except KeyboardInterrupt:
            logger.info("Shutting down...")
        finally:
            self.running = False
            streaming_task.cancel()
            self.unreal.disconnect()

# Example usage and testing
async def main():
    """Main entry point for the bridge server"""
    bridge = BaseballMCPBridge()
    await bridge.start()

if __name__ == "__main__":
    asyncio.run(main())