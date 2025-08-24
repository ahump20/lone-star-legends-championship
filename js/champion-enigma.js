/**
 * Champion Enigma Engine Visualization
 * 8 Dimensions of Championship Psychology as orbiting particle systems
 */

class ChampionEnigmaEngine {
  constructor(canvasId = 'blaze-hero') {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas || !window.THREE) return;

    this.dimensions = [
      { name: 'Clutch Gene', color: 0xFF6B35, symbol: '🎯' },
      { name: 'Killer Instinct', color: 0xFF4500, symbol: '🗡️' },
      { name: 'Flow State', color: 0x00CED1, symbol: '🌊' },
      { name: 'Mental Fortress', color: 0x4B0082, symbol: '🏰' },
      { name: 'Predator Mindset', color: 0xDC143C, symbol: '🦅' },
      { name: 'Champion Aura', color: 0xFFD700, symbol: '👑' },
      { name: 'Winner DNA', color: 0x9370DB, symbol: '🧬' },
      { name: 'Beast Mode', color: 0xFF1493, symbol: '🔥' }
    ];

    this.dimensionClouds = [];
    this.liveData = {};
    
    this.init();
  }

  init() {
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x0A0A0A, 5, 30);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      60, 
      window.innerWidth / window.innerHeight, 
      0.1, 
      100
    );
    this.camera.position.set(0, 0, 8);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Lighting
    this.setupLighting();

    // Create central core
    this.createCore();

    // Create dimension clouds
    this.createDimensionClouds();

    // Create connection lines
    this.createConnections();

    // Mouse interaction
    this.setupInteraction();

    // Start animation
    this.animate();

    // Handle resize
    window.addEventListener('resize', () => this.handleResize());
  }

  setupLighting() {
    // Ambient light
    const ambient = new THREE.AmbientLight(0xffffff, 0.3);
    this.scene.add(ambient);

    // Key light (Blaze orange)
    const keyLight = new THREE.DirectionalLight(0xFF6B35, 0.8);
    keyLight.position.set(5, 5, 5);
    this.scene.add(keyLight);

    // Rim light (burnt orange)
    const rimLight = new THREE.DirectionalLight(0xCC5500, 0.6);
    rimLight.position.set(-5, -5, -5);
    this.scene.add(rimLight);

    // Point light at center
    this.coreLight = new THREE.PointLight(0xFF6B35, 1, 10);
    this.coreLight.position.set(0, 0, 0);
    this.scene.add(this.coreLight);
  }

  createCore() {
    // Central core representing the athlete's essence
    const coreGeometry = new THREE.IcosahedronGeometry(0.5, 2);
    const coreMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xFF6B35,
      emissive: 0xFF6B35,
      emissiveIntensity: 0.5,
      metalness: 0.8,
      roughness: 0.2,
      clearcoat: 1,
      clearcoatRoughness: 0,
      transparent: true,
      opacity: 0.9
    });
    
    this.core = new THREE.Mesh(coreGeometry, coreMaterial);
    this.scene.add(this.core);

    // Add glow effect
    const glowGeometry = new THREE.IcosahedronGeometry(0.6, 2);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xFF6B35,
      transparent: true,
      opacity: 0.3,
      side: THREE.BackSide
    });
    
    this.coreGlow = new THREE.Mesh(glowGeometry, glowMaterial);
    this.scene.add(this.coreGlow);
  }

  createDimensionClouds() {
    this.dimensions.forEach((dim, index) => {
      const angle = (index / this.dimensions.length) * Math.PI * 2;
      const radius = 3;
      
      // Create particle cloud for each dimension
      const cloud = this.createDimensionCloud(dim, angle, radius);
      this.dimensionClouds.push(cloud);
      this.scene.add(cloud.group);
    });
  }

  createDimensionCloud(dimension, angle, radius) {
    const group = new THREE.Group();
    
    // Position in orbit
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = Math.sin(angle * 2) * 0.5; // Slight vertical variation
    
    // Particle system
    const particleCount = 100;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    const color = new THREE.Color(dimension.color);
    
    for (let i = 0; i < particleCount; i++) {
      // Create sphere distribution
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 0.3 + Math.random() * 0.3;
      
      positions[i * 3] = x + r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = y + r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = z + r * Math.cos(phi);
      
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
      
      sizes[i] = Math.random() * 0.05 + 0.01;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    const material = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    const particles = new THREE.Points(geometry, material);
    group.add(particles);
    
    // Add label sphere
    const sphereGeometry = new THREE.SphereGeometry(0.15, 16, 16);
    const sphereMaterial = new THREE.MeshPhysicalMaterial({
      color: dimension.color,
      emissive: dimension.color,
      emissiveIntensity: 0.3,
      metalness: 0.5,
      roughness: 0.3
    });
    
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.position.set(x, y, z);
    group.add(sphere);
    
    return {
      group,
      particles,
      sphere,
      dimension,
      angle,
      radius,
      basePosition: { x, y, z },
      intensity: 1
    };
  }

  createConnections() {
    // Create dynamic connection lines between dimensions
    this.connections = [];
    
    this.dimensionClouds.forEach((cloud1, i) => {
      this.dimensionClouds.forEach((cloud2, j) => {
        if (i < j) {
          const geometry = new THREE.BufferGeometry();
          const positions = new Float32Array(6);
          
          positions[0] = cloud1.basePosition.x;
          positions[1] = cloud1.basePosition.y;
          positions[2] = cloud1.basePosition.z;
          positions[3] = cloud2.basePosition.x;
          positions[4] = cloud2.basePosition.y;
          positions[5] = cloud2.basePosition.z;
          
          geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
          
          const material = new THREE.LineBasicMaterial({
            color: 0xFF6B35,
            transparent: true,
            opacity: 0.1,
            blending: THREE.AdditiveBlending
          });
          
          const line = new THREE.Line(geometry, material);
          this.scene.add(line);
          this.connections.push({ line, cloud1, cloud2 });
        }
      });
    });
  }

  setupInteraction() {
    this.mouse = { x: 0, y: 0 };
    
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      this.mouse.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });
  }

  updateDimensions(dimensionData) {
    if (!dimensionData) return;
    
    this.liveData = dimensionData;
    
    // Update each dimension cloud based on live data
    this.dimensionClouds.forEach(cloud => {
      const data = dimensionData[cloud.dimension.name];
      if (data) {
        // Update intensity (affects size and opacity)
        cloud.intensity = data.score / 100;
        
        // Update particle positions based on intensity
        const positions = cloud.particles.geometry.attributes.position.array;
        const particleCount = positions.length / 3;
        
        for (let i = 0; i < particleCount; i++) {
          const idx = i * 3;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(Math.random() * 2 - 1);
          const r = (0.3 + Math.random() * 0.3) * cloud.intensity;
          
          positions[idx] = cloud.basePosition.x + r * Math.sin(phi) * Math.cos(theta);
          positions[idx + 1] = cloud.basePosition.y + r * Math.sin(phi) * Math.sin(theta);
          positions[idx + 2] = cloud.basePosition.z + r * Math.cos(phi);
        }
        
        cloud.particles.geometry.attributes.position.needsUpdate = true;
        
        // Update sphere glow
        cloud.sphere.material.emissiveIntensity = 0.3 + (cloud.intensity * 0.5);
        
        // Update material opacity
        cloud.particles.material.opacity = 0.3 + (cloud.intensity * 0.5);
      }
    });
    
    // Update connection strengths
    this.updateConnections();
  }

  updateConnections() {
    this.connections.forEach(conn => {
      const intensity1 = conn.cloud1.intensity;
      const intensity2 = conn.cloud2.intensity;
      const strength = (intensity1 + intensity2) / 2;
      
      conn.line.material.opacity = strength * 0.2;
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    
    const time = Date.now() * 0.001;
    
    // Rotate core
    if (this.core) {
      this.core.rotation.x = time * 0.1;
      this.core.rotation.y = time * 0.15;
      this.coreGlow.rotation.x = -time * 0.1;
      this.coreGlow.rotation.y = -time * 0.15;
      
      // Pulse core light
      this.coreLight.intensity = 1 + Math.sin(time * 2) * 0.3;
    }
    
    // Orbit dimension clouds
    this.dimensionClouds.forEach((cloud, index) => {
      const angle = cloud.angle + time * 0.1;
      const radius = cloud.radius + Math.sin(time + index) * 0.2;
      
      // Update cloud position
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = Math.sin(angle * 2) * 0.5;
      
      cloud.group.position.set(
        x - cloud.basePosition.x,
        y - cloud.basePosition.y,
        z - cloud.basePosition.z
      );
      
      // Rotate particles
      cloud.particles.rotation.y = time * 0.2;
      
      // Float spheres
      cloud.sphere.position.y = cloud.basePosition.y + Math.sin(time * 2 + index) * 0.1;
    });
    
    // Camera movement based on mouse
    if (this.camera) {
      this.camera.position.x = this.mouse.x * 2;
      this.camera.position.y = this.mouse.y * 2;
      this.camera.lookAt(0, 0, 0);
    }
    
    // Render
    this.renderer.render(this.scene, this.camera);
  }

  handleResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

// Initialize Champion Enigma Engine
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.ChampionEnigmaEngine = new ChampionEnigmaEngine();
  });
} else {
  window.ChampionEnigmaEngine = new ChampionEnigmaEngine();
}