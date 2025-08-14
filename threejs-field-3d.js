/**
 * Three.js 3D Baseball Field Visualization
 * Adds 3D rendering capabilities to Lone Star Legends
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { generateFieldGeometry } from './baseball-field-geometry.js';

export class Baseball3DField {
  constructor(container) {
    this.container = container || document.body;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.fieldGeometry = null;
    this.ballMesh = null;
    this.playerMeshes = {};
    
    // Camera positions
    this.cameraPositions = {
      broadcast: { position: new THREE.Vector3(100, 150, 200), target: new THREE.Vector3(0, 0, 0) },
      pitcher: { position: new THREE.Vector3(0, 6, 60), target: new THREE.Vector3(0, 2, 0) },
      batter: { position: new THREE.Vector3(5, 5, -5), target: new THREE.Vector3(0, 10, 60) },
      centerField: { position: new THREE.Vector3(0, 50, 400), target: new THREE.Vector3(0, 0, 0) },
      overhead: { position: new THREE.Vector3(0, 300, 0), target: new THREE.Vector3(0, 0, 0) }
    };
    
    this.currentCamera = 'broadcast';
  }

  /**
   * Initialize the 3D scene
   */
  async init() {
    // Setup scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
    this.scene.fog = new THREE.Fog(0x87CEEB, 200, 1000);
    
    // Setup camera
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 2000);
    this.setCameraPosition('broadcast');
    
    // Setup renderer
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Add to container
    this.container.appendChild(this.renderer.domElement);
    
    // Setup controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2.1; // Prevent camera from going below ground
    
    // Add lights
    this.setupLights();
    
    // Create field
    this.createField();
    
    // Create initial game objects
    this.createBall();
    this.createPlayers();
    
    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize(), false);
    
    // Start animation loop
    this.animate();
  }

  /**
   * Setup scene lighting
   */
  setupLights() {
    // Ambient light for overall brightness
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    
    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 200, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -200;
    directionalLight.shadow.camera.right = 200;
    directionalLight.shadow.camera.top = 200;
    directionalLight.shadow.camera.bottom = -200;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);
    
    // Stadium lights
    const stadiumLights = [
      { x: -150, y: 100, z: -150 },
      { x: 150, y: 100, z: -150 },
      { x: -150, y: 100, z: 150 },
      { x: 150, y: 100, z: 150 }
    ];
    
    stadiumLights.forEach(pos => {
      const light = new THREE.PointLight(0xffffaa, 0.5, 300);
      light.position.set(pos.x, pos.y, pos.z);
      light.castShadow = true;
      this.scene.add(light);
    });
  }

  /**
   * Create the 3D baseball field
   */
  createField() {
    // Get field geometry data
    this.fieldGeometry = generateFieldGeometry('mlb', 1);
    
    // Create grass (outfield)
    const grassGeometry = new THREE.PlaneGeometry(800, 800);
    const grassMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x2E8B57,
      side: THREE.DoubleSide
    });
    const grass = new THREE.Mesh(grassGeometry, grassMaterial);
    grass.rotation.x = -Math.PI / 2;
    grass.receiveShadow = true;
    this.scene.add(grass);
    
    // Create infield dirt
    const infieldShape = new THREE.Shape();
    const bases = this.fieldGeometry.bases;
    infieldShape.moveTo(0, 0);
    infieldShape.lineTo(bases.firstBase.x, bases.firstBase.y);
    infieldShape.lineTo(bases.secondBase.x, bases.secondBase.y);
    infieldShape.lineTo(bases.thirdBase.x, bases.thirdBase.y);
    infieldShape.closePath();
    
    const infieldGeometry = new THREE.ShapeGeometry(infieldShape);
    const infieldMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x8B4513,
      side: THREE.DoubleSide
    });
    const infield = new THREE.Mesh(infieldGeometry, infieldMaterial);
    infield.rotation.x = -Math.PI / 2;
    infield.position.y = 0.1;
    infield.receiveShadow = true;
    this.scene.add(infield);
    
    // Create pitcher's mound
    const moundGeometry = new THREE.CylinderGeometry(
      this.fieldGeometry.pitchersMound.radius,
      this.fieldGeometry.pitchersMound.radius * 1.2,
      2,
      32
    );
    const moundMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const mound = new THREE.Mesh(moundGeometry, moundMaterial);
    mound.position.set(
      this.fieldGeometry.pitchersMound.center.x,
      1,
      this.fieldGeometry.pitchersMound.center.y
    );
    mound.castShadow = true;
    mound.receiveShadow = true;
    this.scene.add(mound);
    
    // Create bases
    this.createBases();
    
    // Create foul lines
    this.createFoulLines();
    
    // Create outfield wall
    this.createOutfieldWall();
  }

  /**
   * Create base markers
   */
  createBases() {
    const baseGeometry = new THREE.BoxGeometry(1.5, 0.2, 1.5);
    const baseMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    
    Object.entries(this.fieldGeometry.bases).forEach(([name, pos]) => {
      if (name !== 'homePlate' && name !== 'pitchersMound') {
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.set(pos.x, 0.1, pos.y);
        base.castShadow = true;
        base.receiveShadow = true;
        this.scene.add(base);
      }
    });
    
    // Create home plate (pentagon shape)
    const homePlateShape = new THREE.Shape();
    const plate = this.fieldGeometry.homePlate;
    plate.forEach((point, i) => {
      if (i === 0) {
        homePlateShape.moveTo(point.x, point.y);
      } else {
        homePlateShape.lineTo(point.x, point.y);
      }
    });
    homePlateShape.closePath();
    
    const homePlateGeometry = new THREE.ExtrudeGeometry(homePlateShape, {
      depth: 0.2,
      bevelEnabled: false
    });
    const homePlateMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    const homePlate = new THREE.Mesh(homePlateGeometry, homePlateMaterial);
    homePlate.rotation.x = -Math.PI / 2;
    homePlate.position.y = 0.1;
    homePlate.castShadow = true;
    homePlate.receiveShadow = true;
    this.scene.add(homePlate);
  }

  /**
   * Create foul lines
   */
  createFoulLines() {
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: 0xFFFFFF,
      linewidth: 3
    });
    
    // First base line
    const firstLineGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.15, 0),
      new THREE.Vector3(350, 0.15, 0)
    ]);
    const firstLine = new THREE.Line(firstLineGeometry, lineMaterial);
    this.scene.add(firstLine);
    
    // Third base line
    const thirdLineGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.15, 0),
      new THREE.Vector3(0, 0.15, 350)
    ]);
    const thirdLine = new THREE.Line(thirdLineGeometry, lineMaterial);
    this.scene.add(thirdLine);
  }

  /**
   * Create outfield wall
   */
  createOutfieldWall() {
    const wallHeight = 10;
    const wallCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-250, wallHeight/2, 250),
      new THREE.Vector3(-300, wallHeight/2, 100),
      new THREE.Vector3(-320, wallHeight/2, 0),
      new THREE.Vector3(-300, wallHeight/2, -100),
      new THREE.Vector3(-200, wallHeight/2, -280),
      new THREE.Vector3(0, wallHeight/2, -400),
      new THREE.Vector3(200, wallHeight/2, -280),
      new THREE.Vector3(300, wallHeight/2, -100),
      new THREE.Vector3(320, wallHeight/2, 0),
      new THREE.Vector3(300, wallHeight/2, 100),
      new THREE.Vector3(250, wallHeight/2, 250)
    ]);
    
    const wallGeometry = new THREE.TubeGeometry(wallCurve, 50, 2, 8, false);
    const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x2F4F2F });
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.castShadow = true;
    wall.receiveShadow = true;
    this.scene.add(wall);
  }

  /**
   * Create the baseball
   */
  createBall() {
    const ballGeometry = new THREE.SphereGeometry(0.37, 16, 16);
    const ballMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xFFFFFF,
      emissive: 0xFF0000,
      emissiveIntensity: 0.1
    });
    this.ballMesh = new THREE.Mesh(ballGeometry, ballMaterial);
    this.ballMesh.castShadow = true;
    this.ballMesh.position.set(0, 5, 60);
    this.scene.add(this.ballMesh);
    
    // Add seams texture (simplified)
    const seamMaterial = new THREE.LineBasicMaterial({ color: 0xFF0000 });
    const seamGeometry = new THREE.BufferGeometry();
    // Add seam vertices here for realism
    const seams = new THREE.LineSegments(seamGeometry, seamMaterial);
    this.ballMesh.add(seams);
  }

  /**
   * Create player representations
   */
  createPlayers() {
    const playerGeometry = new THREE.CapsuleGeometry(1, 5, 4, 8);
    const homeMaterial = new THREE.MeshLambertMaterial({ color: 0x0000FF });
    const awayMaterial = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
    
    // Create pitcher
    const pitcher = new THREE.Mesh(playerGeometry, homeMaterial);
    pitcher.position.set(0, 3, 60);
    pitcher.castShadow = true;
    this.scene.add(pitcher);
    this.playerMeshes.pitcher = pitcher;
    
    // Create batter
    const batter = new THREE.Mesh(playerGeometry, awayMaterial);
    batter.position.set(2, 3, -2);
    batter.castShadow = true;
    this.scene.add(batter);
    this.playerMeshes.batter = batter;
    
    // Create fielders
    const fielderPositions = [
      { name: 'firstBase', pos: [90, 3, 15] },
      { name: 'secondBase', pos: [45, 3, 90] },
      { name: 'thirdBase', pos: [-90, 3, 15] },
      { name: 'shortStop', pos: [-45, 3, 90] },
      { name: 'leftField', pos: [-200, 3, 200] },
      { name: 'centerField', pos: [0, 3, 300] },
      { name: 'rightField', pos: [200, 3, 200] }
    ];
    
    fielderPositions.forEach(({ name, pos }) => {
      const fielder = new THREE.Mesh(playerGeometry, homeMaterial);
      fielder.position.set(...pos);
      fielder.castShadow = true;
      this.scene.add(fielder);
      this.playerMeshes[name] = fielder;
    });
  }

  /**
   * Update ball position for trajectory animation
   */
  updateBallPosition(position) {
    if (this.ballMesh && position) {
      this.ballMesh.position.set(position.x, position.y, position.z);
      
      // Add trail effect
      const trailGeometry = new THREE.SphereGeometry(0.1, 4, 4);
      const trailMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xFFFFFF,
        transparent: true,
        opacity: 0.3
      });
      const trail = new THREE.Mesh(trailGeometry, trailMaterial);
      trail.position.copy(this.ballMesh.position);
      this.scene.add(trail);
      
      // Fade out trail
      setTimeout(() => {
        this.scene.remove(trail);
      }, 1000);
    }
  }

  /**
   * Set camera position
   */
  setCameraPosition(viewName) {
    const view = this.cameraPositions[viewName];
    if (view) {
      this.camera.position.copy(view.position);
      this.controls.target.copy(view.target);
      this.controls.update();
      this.currentCamera = viewName;
    }
  }

  /**
   * Handle window resize
   */
  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  /**
   * Animation loop
   */
  animate() {
    requestAnimationFrame(() => this.animate());
    
    // Update controls
    this.controls.update();
    
    // Rotate ball for effect
    if (this.ballMesh) {
      this.ballMesh.rotation.x += 0.1;
      this.ballMesh.rotation.y += 0.05;
    }
    
    // Render scene
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Clean up resources
   */
  dispose() {
    this.scene.traverse((object) => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
    
    this.renderer.dispose();
    this.controls.dispose();
    
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}

// Export for use in game
export default Baseball3DField;