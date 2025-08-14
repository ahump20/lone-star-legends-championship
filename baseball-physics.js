/**
 * Baseball Physics Engine
 * Realistic physics simulation for baseball gameplay
 * Includes ball trajectories, collision detection, and environmental factors
 */

export class BaseballPhysics {
  constructor() {
    // Physics constants
    this.constants = {
      gravity: 9.81, // m/s²
      airDensity: 1.225, // kg/m³ at sea level
      ballMass: 0.145, // kg (standard baseball)
      ballRadius: 0.037, // m (standard baseball)
      ballCircumference: 0.232, // m
      dragCoefficient: 0.47, // sphere drag coefficient
      magnusCoefficient: 0.25, // Magnus effect for spin
      coefficientOfRestitution: 0.55, // baseball COR
      frictionCoefficient: 0.3 // field friction
    };

    // Environmental factors
    this.environment = {
      windSpeed: { x: 0, y: 0, z: 0 }, // m/s
      temperature: 20, // Celsius
      humidity: 50, // percentage
      altitude: 0, // meters above sea level
      fieldCondition: 'normal' // 'wet', 'dry', 'normal'
    };

    // Conversion factors
    this.conversions = {
      mphToMs: 0.44704,
      feetToMeters: 0.3048,
      metersToFeet: 3.28084,
      degreesToRadians: Math.PI / 180
    };
  }

  /**
   * Calculate ball trajectory from bat contact
   * @param {Object} params - Initial conditions
   * @returns {Array} Array of position points over time
   */
  calculateBallTrajectory(params) {
    const {
      exitVelocity, // mph
      launchAngle, // degrees
      horizontalAngle = 0, // degrees (0 = straight, negative = pulled, positive = opposite field)
      spinRate = 2000, // rpm
      spinAxis = { x: 0, y: 1, z: 0 }, // backspin by default
      startPosition = { x: 0, y: 1, z: 0 } // meters
    } = params;

    // Convert to SI units
    const v0 = exitVelocity * this.conversions.mphToMs;
    const theta = launchAngle * this.conversions.degreesToRadians;
    const phi = horizontalAngle * this.conversions.degreesToRadians;
    const omega = (spinRate * 2 * Math.PI) / 60; // rad/s

    // Initial velocity components
    let vx = v0 * Math.cos(theta) * Math.cos(phi);
    let vy = v0 * Math.sin(theta);
    let vz = v0 * Math.cos(theta) * Math.sin(phi);

    // Position and time
    let x = startPosition.x;
    let y = startPosition.y;
    let z = startPosition.z;
    let t = 0;
    const dt = 0.01; // time step in seconds

    const trajectory = [];
    const maxTime = 10; // maximum simulation time

    while (y > 0 && t < maxTime) {
      // Store current position
      trajectory.push({
        x: x * this.conversions.metersToFeet,
        y: y * this.conversions.metersToFeet,
        z: z * this.conversions.metersToFeet,
        time: t,
        velocity: Math.sqrt(vx * vx + vy * vy + vz * vz) / this.conversions.mphToMs
      });

      // Calculate forces
      const v = Math.sqrt(vx * vx + vy * vy + vz * vz);
      
      // Drag force
      const dragMagnitude = 0.5 * this.getAirDensity() * v * v * 
                           Math.PI * Math.pow(this.constants.ballRadius, 2) * 
                           this.constants.dragCoefficient;
      const dragX = -dragMagnitude * vx / v / this.constants.ballMass;
      const dragY = -dragMagnitude * vy / v / this.constants.ballMass;
      const dragZ = -dragMagnitude * vz / v / this.constants.ballMass;

      // Magnus force (due to spin)
      const magnusMagnitude = 0.5 * this.getAirDensity() * v * 
                             4 * Math.PI * Math.pow(this.constants.ballRadius, 3) * 
                             omega * this.constants.magnusCoefficient;
      const magnusX = magnusMagnitude * (spinAxis.y * vz - spinAxis.z * vy) / v / this.constants.ballMass;
      const magnusY = magnusMagnitude * (spinAxis.z * vx - spinAxis.x * vz) / v / this.constants.ballMass;
      const magnusZ = magnusMagnitude * (spinAxis.x * vy - spinAxis.y * vx) / v / this.constants.ballMass;

      // Wind effect
      const windX = this.environment.windSpeed.x * 0.1;
      const windY = this.environment.windSpeed.y * 0.1;
      const windZ = this.environment.windSpeed.z * 0.1;

      // Update velocity
      vx += (dragX + magnusX + windX) * dt;
      vy += (-this.constants.gravity + dragY + magnusY + windY) * dt;
      vz += (dragZ + magnusZ + windZ) * dt;

      // Update position
      x += vx * dt;
      y += vy * dt;
      z += vz * dt;
      
      t += dt;
    }

    return trajectory;
  }

  /**
   * Calculate exit velocity and angle from bat swing
   * @param {Object} swingParams - Swing parameters
   * @returns {Object} Exit velocity and launch angle
   */
  calculateBatContact(swingParams) {
    const {
      batSpeed, // mph
      pitchSpeed, // mph
      contactPoint = 'center', // 'center', 'upper', 'lower'
      timing = 'perfect', // 'early', 'perfect', 'late'
      batAngle = 10 // degrees
    } = swingParams;

    // Convert to m/s
    const vBat = batSpeed * this.conversions.mphToMs;
    const vPitch = pitchSpeed * this.conversions.mphToMs;

    // Collision efficiency based on contact quality
    let efficiency = 0.5; // base efficiency
    
    // Contact point adjustments
    switch(contactPoint) {
      case 'center':
        efficiency += 0.15;
        break;
      case 'upper':
        efficiency += 0.05;
        break;
      case 'lower':
        efficiency += 0.1;
        break;
    }

    // Timing adjustments
    switch(timing) {
      case 'perfect':
        efficiency += 0.15;
        break;
      case 'early':
        efficiency -= 0.05;
        break;
      case 'late':
        efficiency -= 0.05;
        break;
    }

    // Calculate exit velocity using conservation of momentum and energy
    const exitVelocity = (vBat + this.constants.coefficientOfRestitution * vPitch) * 
                        efficiency / this.conversions.mphToMs;

    // Launch angle based on contact point and bat angle
    let launchAngle = batAngle;
    switch(contactPoint) {
      case 'upper':
        launchAngle -= 10; // ground ball tendency
        break;
      case 'lower':
        launchAngle += 15; // fly ball tendency
        break;
    }

    // Horizontal angle based on timing
    let horizontalAngle = 0;
    switch(timing) {
      case 'early':
        horizontalAngle = -30; // pulled
        break;
      case 'late':
        horizontalAngle = 30; // opposite field
        break;
    }

    return {
      exitVelocity: Math.min(exitVelocity, 120), // cap at 120 mph
      launchAngle: Math.max(-20, Math.min(60, launchAngle)),
      horizontalAngle,
      spinRate: this.calculateSpinRate(contactPoint, batAngle)
    };
  }

  /**
   * Calculate spin rate based on contact
   * @param {string} contactPoint - Point of contact on ball
   * @param {number} batAngle - Angle of bat
   * @returns {number} Spin rate in RPM
   */
  calculateSpinRate(contactPoint, batAngle) {
    let baseSpinRate = 2000; // rpm
    
    switch(contactPoint) {
      case 'lower':
        baseSpinRate += 500; // more backspin
        break;
      case 'upper':
        baseSpinRate += 1000; // more topspin
        break;
    }
    
    // Bat angle effect
    baseSpinRate += batAngle * 20;
    
    return baseSpinRate;
  }

  /**
   * Calculate fielder's catch probability
   * @param {Object} ballPosition - Current ball position
   * @param {Object} fielderPosition - Fielder's position
   * @param {number} fielderSpeed - Fielder's speed in mph
   * @param {number} timeToReach - Time until ball reaches fielder's plane
   * @returns {number} Probability of catch (0-1)
   */
  calculateCatchProbability(ballPosition, fielderPosition, fielderSpeed, timeToReach) {
    // Calculate distance fielder needs to cover
    const dx = ballPosition.x - fielderPosition.x;
    const dz = ballPosition.z - fielderPosition.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    // Convert fielder speed to ft/s
    const speedFtPerSec = fielderSpeed * this.conversions.mphToMs * this.conversions.metersToFeet;
    
    // Maximum distance fielder can cover
    const maxDistance = speedFtPerSec * timeToReach;
    
    // Base probability
    let probability = 0;
    
    if (distance <= maxDistance * 0.5) {
      probability = 0.95; // Easy catch
    } else if (distance <= maxDistance * 0.75) {
      probability = 0.7; // Moderate difficulty
    } else if (distance <= maxDistance) {
      probability = 0.3; // Difficult catch
    } else {
      probability = 0; // Impossible
    }
    
    // Adjust for ball height
    if (ballPosition.y > 10) {
      probability *= 0.8; // Harder to catch high balls
    } else if (ballPosition.y < 2) {
      probability *= 0.9; // Slightly harder for ground balls
    }
    
    return probability;
  }

  /**
   * Simulate pitch movement
   * @param {Object} pitchParams - Pitch parameters
   * @returns {Array} Pitch trajectory
   */
  calculatePitchTrajectory(pitchParams) {
    const {
      velocity, // mph
      spinRate, // rpm
      spinAxis = { x: 0, y: 1, z: 0 }, // spin direction
      releasePoint = { x: 0, y: 6, z: 55 }, // feet from home plate
      pitchType = 'fastball'
    } = pitchParams;

    // Convert to meters
    const startX = releasePoint.x * this.conversions.feetToMeters;
    const startY = releasePoint.y * this.conversions.feetToMeters;
    const startZ = releasePoint.z * this.conversions.feetToMeters;

    // Pitch-specific movement profiles
    const pitchProfiles = {
      fastball: { spinMultiplier: 1, breakMultiplier: 0.5 },
      curveball: { spinMultiplier: 1.5, breakMultiplier: 2 },
      slider: { spinMultiplier: 1.2, breakMultiplier: 1.5 },
      changeup: { spinMultiplier: 0.7, breakMultiplier: 0.8 },
      knuckleball: { spinMultiplier: 0.1, breakMultiplier: 0.2 }
    };

    const profile = pitchProfiles[pitchType] || pitchProfiles.fastball;
    const adjustedSpinRate = spinRate * profile.spinMultiplier;

    return this.calculateBallTrajectory({
      exitVelocity: velocity,
      launchAngle: -2, // slight downward angle
      horizontalAngle: 0,
      spinRate: adjustedSpinRate,
      spinAxis,
      startPosition: { x: startX, y: startY, z: startZ }
    });
  }

  /**
   * Check for collision between ball and object
   * @param {Object} ballPos - Ball position
   * @param {Object} objectBounds - Object boundaries
   * @returns {boolean} True if collision detected
   */
  checkCollision(ballPos, objectBounds) {
    return ballPos.x >= objectBounds.minX && ballPos.x <= objectBounds.maxX &&
           ballPos.y >= objectBounds.minY && ballPos.y <= objectBounds.maxY &&
           ballPos.z >= objectBounds.minZ && ballPos.z <= objectBounds.maxZ;
  }

  /**
   * Calculate bounce after collision
   * @param {Object} velocity - Current velocity vector
   * @param {Object} normal - Surface normal vector
   * @returns {Object} New velocity after bounce
   */
  calculateBounce(velocity, normal) {
    const cor = this.constants.coefficientOfRestitution;
    
    // Calculate dot product
    const dot = velocity.x * normal.x + velocity.y * normal.y + velocity.z * normal.z;
    
    // Reflect velocity
    return {
      x: velocity.x - (1 + cor) * dot * normal.x,
      y: velocity.y - (1 + cor) * dot * normal.y,
      z: velocity.z - (1 + cor) * dot * normal.z
    };
  }

  /**
   * Get adjusted air density based on environmental conditions
   * @returns {number} Adjusted air density in kg/m³
   */
  getAirDensity() {
    // Adjust for altitude (barometric formula)
    const altitudeFactor = Math.exp(-this.environment.altitude / 8000);
    
    // Adjust for temperature (ideal gas law)
    const temperatureFactor = 293 / (273 + this.environment.temperature);
    
    // Adjust for humidity (water vapor is less dense than dry air)
    const humidityFactor = 1 - (this.environment.humidity / 100) * 0.01;
    
    return this.constants.airDensity * altitudeFactor * temperatureFactor * humidityFactor;
  }

  /**
   * Set environmental conditions
   * @param {Object} conditions - Environmental parameters
   */
  setEnvironment(conditions) {
    Object.assign(this.environment, conditions);
  }

  /**
   * Predict landing spot for a ball in flight
   * @param {Array} trajectory - Ball trajectory
   * @returns {Object} Predicted landing position
   */
  predictLandingSpot(trajectory) {
    if (trajectory.length === 0) return null;
    
    // Find the point where ball hits ground (y = 0)
    for (let i = 1; i < trajectory.length; i++) {
      if (trajectory[i].y <= 0) {
        // Interpolate to find exact landing spot
        const t1 = trajectory[i - 1];
        const t2 = trajectory[i];
        const ratio = t1.y / (t1.y - t2.y);
        
        return {
          x: t1.x + (t2.x - t1.x) * ratio,
          z: t1.z + (t2.z - t1.z) * ratio,
          distance: Math.sqrt(Math.pow(t1.x + (t2.x - t1.x) * ratio, 2) + 
                            Math.pow(t1.z + (t2.z - t1.z) * ratio, 2)),
          time: t1.time + (t2.time - t1.time) * ratio
        };
      }
    }
    
    // If ball hasn't landed yet, return last point
    const lastPoint = trajectory[trajectory.length - 1];
    return {
      x: lastPoint.x,
      z: lastPoint.z,
      distance: Math.sqrt(lastPoint.x * lastPoint.x + lastPoint.z * lastPoint.z),
      time: lastPoint.time
    };
  }
}

// Export for use in game
export default BaseballPhysics;