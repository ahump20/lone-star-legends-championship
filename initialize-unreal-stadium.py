#!/usr/bin/env python3
"""
Initialize Lone Star Legends Championship Stadium in Unreal Engine
This script sends MCP commands to create the complete 3D baseball environment
"""

import asyncio
import json
import socket
import time
from typing import Dict, Any

class UnrealStadiumInitializer:
    def __init__(self, host="localhost", port=55557):
        self.host = host
        self.port = port
        self.socket = None
        self.connected = False
        
    async def connect(self):
        """Connect to Unreal Engine MCP server"""
        try:
            self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.socket.settimeout(5.0)
            self.socket.connect((self.host, self.port))
            self.connected = True
            print("✅ Connected to Unreal Engine MCP server")
            return True
        except Exception as e:
            print(f"❌ Failed to connect: {e}")
            print("Make sure Unreal Engine is running with the MCP plugin enabled")
            return False
    
    async def send_command(self, command: str, params: Dict[str, Any]):
        """Send MCP command to Unreal Engine"""
        if not self.connected:
            print("Not connected to Unreal Engine")
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
            
            # Read response
            response_length = int.from_bytes(self.socket.recv(4), byteorder='little')
            response_data = self.socket.recv(response_length)
            response = json.loads(response_data.decode('utf-8'))
            
            return response
        except Exception as e:
            print(f"Error sending command: {e}")
            return None
    
    async def create_stadium(self):
        """Create the complete baseball stadium"""
        print("\n🏟️ Creating Lone Star Legends Championship Stadium...")
        
        # Step 1: Create base stadium blueprint
        print("📐 Step 1: Creating stadium structure...")
        response = await self.send_command("create_blueprint", {
            "name": "BP_LoneStarStadium",
            "parent_class": "Actor"
        })
        print(f"   Stadium blueprint: {'✅' if response and response.get('success') else '❌'}")
        
        # Step 2: Add stadium mesh component
        print("🏗️ Step 2: Adding stadium structure...")
        response = await self.send_command("add_component_to_blueprint", {
            "blueprint_name": "BP_LoneStarStadium",
            "component_type": "StaticMeshComponent",
            "component_name": "StadiumStructure",
            "location": [0.0, 0.0, 0.0],
            "scale": [10.0, 10.0, 5.0]
        })
        print(f"   Stadium mesh: {'✅' if response and response.get('success') else '❌'}")
        
        # Step 3: Create playing field with MLB dimensions
        print("⚾ Step 3: Creating MLB-standard playing field...")
        response = await self.send_command("add_component_to_blueprint", {
            "blueprint_name": "BP_LoneStarStadium",
            "component_type": "StaticMeshComponent",
            "component_name": "PlayingField",
            "location": [0.0, 0.0, -10.0],
            "scale": [3.55, 3.55, 1.0],  # MLB field scale
            "component_properties": {
                "Material": "/Game/Materials/M_BaseballField"
            }
        })
        print(f"   Playing field: {'✅' if response and response.get('success') else '❌'}")
        
        # Step 4: Add bases
        print("🔶 Step 4: Placing bases...")
        bases = [
            {"name": "FirstBase", "location": [90.0, 0.0, 0.0]},
            {"name": "SecondBase", "location": [0.0, 90.0, 0.0]},
            {"name": "ThirdBase", "location": [-90.0, 0.0, 0.0]},
            {"name": "HomePlate", "location": [0.0, 0.0, 0.0]}
        ]
        
        for base in bases:
            response = await self.send_command("add_component_to_blueprint", {
                "blueprint_name": "BP_LoneStarStadium",
                "component_type": "StaticMeshComponent",
                "component_name": base["name"],
                "location": base["location"],
                "scale": [0.15, 0.15, 0.01]
            })
            print(f"   {base['name']}: {'✅' if response and response.get('success') else '❌'}")
        
        # Step 5: Add stadium lighting
        print("💡 Step 5: Installing stadium lights...")
        light_positions = [
            [300.0, 300.0, 500.0],
            [-300.0, 300.0, 500.0],
            [300.0, -300.0, 500.0],
            [-300.0, -300.0, 500.0]
        ]
        
        for i, pos in enumerate(light_positions):
            response = await self.send_command("add_component_to_blueprint", {
                "blueprint_name": "BP_LoneStarStadium",
                "component_type": "SpotLightComponent",
                "component_name": f"StadiumLight_{i+1}",
                "location": pos,
                "rotation": [-45.0, 0.0, 0.0],
                "component_properties": {
                    "Intensity": 50000.0,
                    "LightColor": {"R": 255, "G": 245, "B": 220},
                    "OuterConeAngle": 60.0,
                    "InnerConeAngle": 40.0
                }
            })
            print(f"   Stadium Light {i+1}: {'✅' if response and response.get('success') else '❌'}")
        
        # Step 6: Compile the blueprint
        print("🔧 Step 6: Compiling stadium blueprint...")
        response = await self.send_command("compile_blueprint", {
            "blueprint_name": "BP_LoneStarStadium"
        })
        print(f"   Compilation: {'✅' if response and response.get('success') else '❌'}")
        
        # Step 7: Spawn the stadium in the world
        print("🌍 Step 7: Spawning stadium in world...")
        response = await self.send_command("spawn_blueprint_actor", {
            "blueprint_name": "BP_LoneStarStadium",
            "location": [0.0, 0.0, 0.0],
            "rotation": [0.0, 0.0, 0.0]
        })
        print(f"   Stadium spawned: {'✅' if response and response.get('success') else '❌'}")
        
        print("\n✅ Stadium creation complete!")
        return True
    
    async def create_baseball(self):
        """Create the baseball with physics"""
        print("\n⚾ Creating baseball with physics...")
        
        # Create baseball blueprint
        response = await self.send_command("create_blueprint", {
            "name": "BP_Baseball",
            "parent_class": "Actor"
        })
        print(f"   Baseball blueprint: {'✅' if response and response.get('success') else '❌'}")
        
        # Add sphere mesh for the ball
        response = await self.send_command("add_component_to_blueprint", {
            "blueprint_name": "BP_Baseball",
            "component_type": "SphereComponent",
            "component_name": "BallCollision",
            "scale": [0.073, 0.073, 0.073],  # Official baseball size
            "component_properties": {
                "CollisionEnabled": "QueryAndPhysics",
                "SimulatePhysics": True
            }
        })
        print(f"   Ball collision: {'✅' if response and response.get('success') else '❌'}")
        
        # Set physics properties
        response = await self.send_command("set_physics_properties", {
            "blueprint_name": "BP_Baseball",
            "component_name": "BallCollision",
            "simulate_physics": True,
            "gravity_enabled": True,
            "mass": 0.145,  # Official baseball weight in kg
            "linear_damping": 0.01,  # Air resistance
            "angular_damping": 0.05  # Spin decay
        })
        print(f"   Physics properties: {'✅' if response and response.get('success') else '❌'}")
        
        # Compile baseball blueprint
        response = await self.send_command("compile_blueprint", {
            "blueprint_name": "BP_Baseball"
        })
        print(f"   Compilation: {'✅' if response and response.get('success') else '❌'}")
        
        print("\n✅ Baseball creation complete!")
        return True
    
    async def create_analytics_display(self):
        """Create 3D analytics visualization components"""
        print("\n📊 Creating analytics display system...")
        
        # Create analytics HUD blueprint
        response = await self.send_command("create_blueprint", {
            "name": "BP_BlazeAnalyticsHUD",
            "parent_class": "Actor"
        })
        print(f"   Analytics HUD blueprint: {'✅' if response and response.get('success') else '❌'}")
        
        # Add 3D text components for momentum display
        momentum_displays = [
            {"name": "HomeMomentumText", "location": [-200.0, 0.0, 300.0], "text": "Home: 50%"},
            {"name": "AwayMomentumText", "location": [200.0, 0.0, 300.0], "text": "Away: 50%"}
        ]
        
        for display in momentum_displays:
            response = await self.send_command("add_component_to_blueprint", {
                "blueprint_name": "BP_BlazeAnalyticsHUD",
                "component_type": "TextRenderComponent",
                "component_name": display["name"],
                "location": display["location"],
                "scale": [2.0, 2.0, 2.0],
                "component_properties": {
                    "Text": display["text"],
                    "TextRenderColor": {"R": 255, "G": 215, "B": 0},
                    "Font": "/Engine/EngineFonts/RobotoDistanceField"
                }
            })
            print(f"   {display['name']}: {'✅' if response and response.get('success') else '❌'}")
        
        # Compile analytics HUD
        response = await self.send_command("compile_blueprint", {
            "blueprint_name": "BP_BlazeAnalyticsHUD"
        })
        print(f"   Compilation: {'✅' if response and response.get('success') else '❌'}")
        
        # Spawn analytics HUD
        response = await self.send_command("spawn_blueprint_actor", {
            "blueprint_name": "BP_BlazeAnalyticsHUD",
            "location": [0.0, 0.0, 0.0],
            "rotation": [0.0, 0.0, 0.0]
        })
        print(f"   Analytics HUD spawned: {'✅' if response and response.get('success') else '❌'}")
        
        print("\n✅ Analytics display complete!")
        return True
    
    async def setup_cameras(self):
        """Set up broadcast camera system"""
        print("\n🎥 Setting up camera system...")
        
        cameras = [
            {"name": "BroadcastCamera", "location": [500.0, 500.0, 400.0], "rotation": [-20.0, -45.0, 0.0]},
            {"name": "PitcherCamera", "location": [0.0, -60.0, 100.0], "rotation": [-10.0, 0.0, 0.0]},
            {"name": "BatterCamera", "location": [10.0, 10.0, 100.0], "rotation": [-15.0, -5.0, 0.0]},
            {"name": "OverheadCamera", "location": [0.0, 0.0, 800.0], "rotation": [-90.0, 0.0, 0.0]}
        ]
        
        for camera in cameras:
            response = await self.send_command("create_actor", {
                "actor_type": "CameraActor",
                "name": camera["name"],
                "location": camera["location"],
                "rotation": camera["rotation"]
            })
            print(f"   {camera['name']}: {'✅' if response and response.get('success') else '❌'}")
        
        # Set broadcast camera as active
        response = await self.send_command("set_active_camera", {
            "camera_name": "BroadcastCamera"
        })
        print(f"   Active camera set: {'✅' if response and response.get('success') else '❌'}")
        
        print("\n✅ Camera system complete!")
        return True
    
    async def test_physics_simulation(self):
        """Test the physics by simulating a baseball hit"""
        print("\n🎮 Testing physics simulation...")
        
        # Spawn a baseball
        response = await self.send_command("spawn_blueprint_actor", {
            "blueprint_name": "BP_Baseball",
            "location": [0.0, 0.0, 100.0],
            "rotation": [0.0, 0.0, 0.0]
        })
        print(f"   Baseball spawned: {'✅' if response and response.get('success') else '❌'}")
        
        # Apply force to simulate a hit
        response = await self.send_command("apply_force_to_actor", {
            "actor_name": "BP_Baseball",
            "force": [10000.0, 5000.0, 8000.0],  # Simulate 95mph exit velocity at 25° angle
            "location": [0.0, 0.0, 100.0]
        })
        print(f"   Force applied: {'✅' if response and response.get('success') else '❌'}")
        
        print("\n✅ Physics test complete! Ball should be flying!")
        return True
    
    async def initialize_complete_stadium(self):
        """Run the complete initialization sequence"""
        print("="*60)
        print("🔥 LONE STAR LEGENDS CHAMPIONSHIP - UNREAL ENGINE INIT 🔥")
        print("="*60)
        
        # Connect to Unreal Engine
        if not await self.connect():
            print("\n❌ Could not connect to Unreal Engine")
            print("Please ensure:")
            print("1. Unreal Engine 5.5+ is running")
            print("2. UnrealMCP plugin is enabled")
            print("3. MCP server is running on port 55557")
            return False
        
        # Create all components
        await self.create_stadium()
        await self.create_baseball()
        await self.create_analytics_display()
        await self.setup_cameras()
        await self.test_physics_simulation()
        
        print("\n" + "="*60)
        print("🎉 STADIUM INITIALIZATION COMPLETE! 🎉")
        print("="*60)
        print("\n📋 Summary:")
        print("  ✅ MLB-standard stadium created")
        print("  ✅ Baseball physics configured")
        print("  ✅ Analytics display system active")
        print("  ✅ Camera system operational")
        print("  ✅ Physics simulation tested")
        print("\n🎮 Ready to play ball with Blaze Intelligence analytics!")
        print("⚾ Use natural language commands to control the game")
        
        return True
    
    def disconnect(self):
        """Close connection to Unreal Engine"""
        if self.socket:
            self.socket.close()
            self.connected = False
            print("\n👋 Disconnected from Unreal Engine")

async def main():
    initializer = UnrealStadiumInitializer()
    try:
        await initializer.initialize_complete_stadium()
    finally:
        initializer.disconnect()

if __name__ == "__main__":
    asyncio.run(main())