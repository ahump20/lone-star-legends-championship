/**
 * Enhanced 3D Baseball Visualization Engine
 * Advanced Three.js engine with complete player positioning and AI automation
 */

class Enhanced3DBaseballEngine {
    constructor(container) {
        this.container = container;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.players = new Map();
        this.ball = null;
        this.field = null;
        this.gameState = {
            inning: 1,
            topBottom: 'top',
            outs: 0,
            balls: 0,
            strikes: 0,
            bases: { first: null, second: null, third: null },
            currentBatter: null,
            currentPitcher: null
        };
        this.animations = [];
        this.fieldDimensions = {
            pitcherMound: { x: 0, z: -18.4 },
            home: { x: 0, z: 0 },
            first: { x: 27.4, z: -27.4 },
            second: { x: 0, z: -38.8 },
            third: { x: -27.4, z: -27.4 },
            foulLines: Math.PI / 4
        };
        
        this.init();
    }

    async init() {
        await this.setupRenderer();
        await this.createField();
        await this.createPlayers();
        await this.setupLighting();
        await this.setupControls();
        this.startGameLoop();
    }

    async setupRenderer() {
        // Enhanced renderer with anti-aliasing and shadows
        // Check if container is a canvas or div
        if (this.container.tagName === 'CANVAS') {
            // Use existing canvas
            this.renderer = new THREE.WebGLRenderer({ 
                canvas: this.container,
                antialias: true, 
                alpha: true,
                powerPreference: "high-performance"
            });
        } else {
            // Create new renderer and append to container
            this.renderer = new THREE.WebGLRenderer({ 
                antialias: true, 
                alpha: true,
                powerPreference: "high-performance"
            });
            this.container.appendChild(this.renderer.domElement);
        }
        
        this.renderer.setSize(this.container.clientWidth || window.innerWidth, this.container.clientHeight || window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;

        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
        this.scene.fog = new THREE.Fog(0x87CEEB, 100, 500);

        // Camera with better positioning for baseball viewing
        this.camera = new THREE.PerspectiveCamera(
            75, 
            this.container.clientWidth / this.container.clientHeight, 
            0.1, 
            1000
        );
        this.camera.position.set(0, 25, 35);
        this.camera.lookAt(0, 0, -20);
    }

    async createField() {
        const fieldGroup = new THREE.Group();
        
        // Main field (grass)
        const fieldGeometry = new THREE.CircleGeometry(120, 64);
        const fieldMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x2d5a16,
            transparent: true,
            opacity: 0.9
        });
        this.field = new THREE.Mesh(fieldGeometry, fieldMaterial);
        this.field.rotation.x = -Math.PI / 2;
        this.field.receiveShadow = true;
        fieldGroup.add(this.field);

        // Infield dirt
        const infieldGeometry = new THREE.CircleGeometry(30, 32);
        const infieldMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        const infield = new THREE.Mesh(infieldGeometry, infieldMaterial);
        infield.rotation.x = -Math.PI / 2;
        infield.position.y = 0.01;
        infield.receiveShadow = true;
        fieldGroup.add(infield);

        // Pitcher's mound
        const moundGeometry = new THREE.CylinderGeometry(2.5, 3, 0.3, 16);
        const moundMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        const mound = new THREE.Mesh(moundGeometry, moundMaterial);
        mound.position.set(0, 0.15, -18.4);
        mound.castShadow = true;
        fieldGroup.add(mound);

        // Bases
        this.createBases(fieldGroup);
        
        // Foul lines and boundaries
        this.createFieldLines(fieldGroup);
        
        // Stadium walls
        this.createStadiumWalls(fieldGroup);

        this.scene.add(fieldGroup);
    }

    createBases(fieldGroup) {
        const baseGeometry = new THREE.BoxGeometry(0.4, 0.1, 0.4);
        const baseMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
        
        // Home plate (pentagon shape)
        const homeGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.05, 5);
        const home = new THREE.Mesh(homeGeometry, baseMaterial);
        home.position.set(0, 0.025, 0);
        home.rotation.y = Math.PI / 10;
        fieldGroup.add(home);

        // First base
        const first = new THREE.Mesh(baseGeometry, baseMaterial);
        first.position.set(27.4, 0.05, -27.4);
        fieldGroup.add(first);

        // Second base
        const second = new THREE.Mesh(baseGeometry, baseMaterial);
        second.position.set(0, 0.05, -38.8);
        fieldGroup.add(second);

        // Third base
        const third = new THREE.Mesh(baseGeometry, baseMaterial);
        third.position.set(-27.4, 0.05, -27.4);
        fieldGroup.add(third);
    }

    createFieldLines(fieldGroup) {
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xFFFFFF, linewidth: 2 });
        
        // Foul lines
        const leftFoulPoints = [
            new THREE.Vector3(-120, 0.02, 0),
            new THREE.Vector3(0, 0.02, 0)
        ];
        const rightFoulPoints = [
            new THREE.Vector3(120, 0.02, 0),
            new THREE.Vector3(0, 0.02, 0)
        ];
        
        const leftFoulGeometry = new THREE.BufferGeometry().setFromPoints(leftFoulPoints);
        const rightFoulGeometry = new THREE.BufferGeometry().setFromPoints(rightFoulPoints);
        
        fieldGroup.add(new THREE.Line(leftFoulGeometry, lineMaterial));
        fieldGroup.add(new THREE.Line(rightFoulGeometry, lineMaterial));
    }

    createStadiumWalls(fieldGroup) {
        // Outfield wall
        const wallHeight = 3;
        const wallGeometry = new THREE.RingGeometry(115, 120, 0, Math.PI);
        const wallMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x2F4F4F,
            side: THREE.DoubleSide
        });
        const wall = new THREE.Mesh(wallGeometry, wallMaterial);
        wall.rotation.x = -Math.PI / 2;
        wall.position.y = wallHeight / 2;
        fieldGroup.add(wall);
    }

    async createPlayers() {
        // Define all baseball positions
        const positions = {
            // Defensive positions (away team)
            'pitcher': { x: 0, z: -18.4, team: 'away', number: 1 },
            'catcher': { x: 0, z: 2, team: 'away', number: 2 },
            'firstBase': { x: 15, z: -12, team: 'away', number: 3 },
            'secondBase': { x: 8, z: -25, team: 'away', number: 4 },
            'thirdBase': { x: -15, z: -12, team: 'away', number: 5 },
            'shortstop': { x: -8, z: -25, team: 'away', number: 6 },
            'leftField': { x: -40, z: -70, team: 'away', number: 7 },
            'centerField': { x: 0, z: -85, team: 'away', number: 8 },
            'rightField': { x: 40, z: -70, team: 'away', number: 9 },
            
            // Batting team (home team)
            'batter': { x: -1, z: 0, team: 'home', number: 24 },
            'onDeckBatter': { x: 8, z: 8, team: 'home', number: 25 },
            'coach1': { x: 20, z: -20, team: 'home', number: 26 },
            'coach3': { x: -20, z: -20, team: 'home', number: 27 }
        };

        for (const [position, data] of Object.entries(positions)) {
            const player = await this.createPlayer(data, position);
            this.players.set(position, player);
            this.scene.add(player.mesh);
        }

        // Create the baseball
        this.ball = await this.createBaseball();
        this.scene.add(this.ball);
    }

    async createPlayer(data, position) {
        const playerGroup = new THREE.Group();
        
        // Player body (simplified but recognizable)
        const bodyGeometry = new THREE.CapsuleGeometry(0.3, 1.4, 4, 8);
        const teamColor = data.team === 'home' ? 0xFF6B35 : 0x0A0E27;
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: teamColor });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 1;
        body.castShadow = true;
        playerGroup.add(body);

        // Head
        const headGeometry = new THREE.SphereGeometry(0.2, 16, 16);
        const headMaterial = new THREE.MeshLambertMaterial({ color: 0xFFDBB3 });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.9;
        head.castShadow = true;
        playerGroup.add(head);

        // Cap
        const capGeometry = new THREE.SphereGeometry(0.21, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        const capMaterial = new THREE.MeshLambertMaterial({ color: teamColor });
        const cap = new THREE.Mesh(capGeometry, capMaterial);
        cap.position.y = 2;
        playerGroup.add(cap);

        // Jersey number
        const numberTexture = this.createNumberTexture(data.number);
        const numberGeometry = new THREE.PlaneGeometry(0.3, 0.4);
        const numberMaterial = new THREE.MeshBasicMaterial({ 
            map: numberTexture,
            transparent: true 
        });
        const numberMesh = new THREE.Mesh(numberGeometry, numberMaterial);
        numberMesh.position.set(0, 1.2, 0.31);
        playerGroup.add(numberMesh);

        // Position player on field
        playerGroup.position.set(data.x, 0, data.z);
        
        // Add glove for fielders
        if (data.team === 'away') {
            const glove = this.createGlove();
            glove.position.set(-0.4, 1, 0.2);
            playerGroup.add(glove);
        }

        // Add bat for batter
        if (position === 'batter') {
            const bat = this.createBat();
            bat.position.set(0.3, 1.2, 0);
            bat.rotation.z = Math.PI / 6;
            playerGroup.add(bat);
        }

        playerGroup.userData = {
            position,
            team: data.team,
            number: data.number,
            isAnimating: false,
            targetPosition: { x: data.x, z: data.z },
            speed: 12 // units per second
        };

        return {
            mesh: playerGroup,
            position,
            team: data.team,
            data: playerGroup.userData
        };
    }

    createNumberTexture(number) {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 64, 64);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(number.toString(), 32, 32);
        
        return new THREE.CanvasTexture(canvas);
    }

    createGlove() {
        const gloveGeometry = new THREE.SphereGeometry(0.15, 8, 8);
        const gloveMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        return new THREE.Mesh(gloveGeometry, gloveMaterial);
    }

    createBat() {
        const batGeometry = new THREE.CylinderGeometry(0.02, 0.04, 0.8, 8);
        const batMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const bat = new THREE.Mesh(batGeometry, batMaterial);
        bat.rotation.x = Math.PI / 2;
        return bat;
    }

    async createBaseball() {
        const ballGeometry = new THREE.SphereGeometry(0.04, 16, 16);
        const ballMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
        const ball = new THREE.Mesh(ballGeometry, ballMaterial);
        
        // Start ball at pitcher's position
        const pitcher = this.players.get('pitcher');
        if (pitcher) {
            ball.position.copy(pitcher.mesh.position);
            ball.position.y = 1.2;
        }
        
        ball.castShadow = true;
        ball.userData = {
            velocity: new THREE.Vector3(0, 0, 0),
            isInPlay: false
        };
        
        return ball;
    }

    setupLighting() {
        // Stadium lighting for realistic baseball atmosphere
        
        // Ambient light for overall illumination
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);

        // Main stadium lights
        const stadiumLights = [
            { x: -50, y: 40, z: -50 },
            { x: 50, y: 40, z: -50 },
            { x: -50, y: 40, z: 50 },
            { x: 50, y: 40, z: 50 }
        ];

        stadiumLights.forEach(pos => {
            const light = new THREE.DirectionalLight(0xFFFFFF, 0.8);
            light.position.set(pos.x, pos.y, pos.z);
            light.target.position.set(0, 0, -20);
            light.castShadow = true;
            
            // Optimize shadow maps
            light.shadow.mapSize.width = 2048;
            light.shadow.mapSize.height = 2048;
            light.shadow.camera.near = 0.5;
            light.shadow.camera.far = 200;
            light.shadow.camera.left = -80;
            light.shadow.camera.right = 80;
            light.shadow.camera.top = 80;
            light.shadow.camera.bottom = -80;
            
            this.scene.add(light);
            this.scene.add(light.target);
        });

        // Dramatic key light for player highlights
        const keyLight = new THREE.SpotLight(0xFFFFFF, 1.5);
        keyLight.position.set(0, 30, 0);
        keyLight.target.position.set(0, 0, -20);
        keyLight.angle = Math.PI / 3;
        keyLight.penumbra = 0.3;
        keyLight.decay = 2;
        keyLight.distance = 100;
        this.scene.add(keyLight);
        this.scene.add(keyLight.target);
    }

    setupControls() {
        // Enhanced camera controls for better viewing
        window.addEventListener('keydown', (event) => {
            const speed = 2;
            switch(event.code) {
                case 'ArrowUp':
                    this.camera.position.z -= speed;
                    break;
                case 'ArrowDown':
                    this.camera.position.z += speed;
                    break;
                case 'ArrowLeft':
                    this.camera.position.x -= speed;
                    break;
                case 'ArrowRight':
                    this.camera.position.x += speed;
                    break;
                case 'KeyQ':
                    this.camera.position.y += speed;
                    break;
                case 'KeyE':
                    this.camera.position.y -= speed;
                    break;
                case 'Space':
                    event.preventDefault();
                    this.throwPitch();
                    break;
            }
            this.camera.lookAt(0, 0, -20);
        });

        // Mouse controls for camera rotation
        let isMouseDown = false;
        let mouseX = 0, mouseY = 0;

        this.renderer.domElement.addEventListener('mousedown', (event) => {
            isMouseDown = true;
            mouseX = event.clientX;
            mouseY = event.clientY;
        });

        this.renderer.domElement.addEventListener('mouseup', () => {
            isMouseDown = false;
        });

        this.renderer.domElement.addEventListener('mousemove', (event) => {
            if (isMouseDown) {
                const deltaX = event.clientX - mouseX;
                const deltaY = event.clientY - mouseY;
                
                // Rotate camera around the field center
                const radius = this.camera.position.distanceTo(new THREE.Vector3(0, 0, -20));
                const theta = Math.atan2(this.camera.position.x, this.camera.position.z);
                const phi = Math.acos(this.camera.position.y / radius);
                
                const newTheta = theta - deltaX * 0.01;
                const newPhi = Math.max(0.1, Math.min(Math.PI - 0.1, phi - deltaY * 0.01));
                
                this.camera.position.x = radius * Math.sin(newPhi) * Math.sin(newTheta);
                this.camera.position.y = radius * Math.cos(newPhi);
                this.camera.position.z = radius * Math.sin(newPhi) * Math.cos(newTheta) - 20;
                
                this.camera.lookAt(0, 0, -20);
                
                mouseX = event.clientX;
                mouseY = event.clientY;
            }
        });

        // Zoom with mouse wheel
        this.renderer.domElement.addEventListener('wheel', (event) => {
            const zoom = event.deltaY > 0 ? 1.1 : 0.9;
            this.camera.position.multiplyScalar(zoom);
            this.camera.lookAt(0, 0, -20);
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        });
    }

    throwPitch() {
        if (this.ball.userData.isInPlay) return;
        
        const pitcher = this.players.get('pitcher');
        const catcher = this.players.get('catcher');
        
        if (!pitcher || !catcher) return;
        
        // Reset ball to pitcher
        this.ball.position.copy(pitcher.mesh.position);
        this.ball.position.y = 1.2;
        
        // Calculate pitch trajectory
        const target = catcher.mesh.position.clone();
        target.y = 1;
        
        const direction = target.sub(this.ball.position).normalize();
        const velocity = direction.multiplyScalar(45); // Pitch speed
        
        this.ball.userData.velocity.copy(velocity);
        this.ball.userData.isInPlay = true;
        
        console.log('⚾ Pitch thrown!');
    }

    // AI-driven player movement system
    movePlayerToPosition(playerKey, targetX, targetZ, duration = 1000) {
        const player = this.players.get(playerKey);
        if (!player || player.data.isAnimating) return;
        
        player.data.isAnimating = true;
        const startPos = player.mesh.position.clone();
        const endPos = new THREE.Vector3(targetX, 0, targetZ);
        
        const animation = {
            player: player.mesh,
            startPos,
            endPos,
            duration,
            elapsed: 0,
            onComplete: () => {
                player.data.isAnimating = false;
                player.data.targetPosition = { x: targetX, z: targetZ };
            }
        };
        
        this.animations.push(animation);
    }

    // AI decision making for fielders
    handleBallInPlay() {
        if (!this.ball.userData.isInPlay) return;
        
        const ballPos = this.ball.position;
        let closestFielder = null;
        let closestDistance = Infinity;
        
        // Find closest fielder to the ball
        for (const [position, player] of this.players.entries()) {
            if (player.team === 'away' && position !== 'pitcher' && position !== 'catcher') {
                const distance = player.mesh.position.distanceTo(ballPos);
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestFielder = { position, player };
                }
            }
        }
        
        // Move closest fielder toward ball
        if (closestFielder && closestDistance > 2) {
            const direction = ballPos.clone().sub(closestFielder.player.mesh.position).normalize();
            const targetPos = ballPos.clone().sub(direction.multiplyScalar(1.5));
            
            this.movePlayerToPosition(
                closestFielder.position, 
                targetPos.x, 
                targetPos.z, 
                500
            );
        }
    }

    updateAnimations(deltaTime) {
        for (let i = this.animations.length - 1; i >= 0; i--) {
            const animation = this.animations[i];
            animation.elapsed += deltaTime;
            
            const progress = Math.min(animation.elapsed / animation.duration, 1);
            const easedProgress = this.easeInOutQuad(progress);
            
            animation.player.position.lerpVectors(
                animation.startPos, 
                animation.endPos, 
                easedProgress
            );
            
            if (progress >= 1) {
                animation.onComplete();
                this.animations.splice(i, 1);
            }
        }
    }

    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    updateBallPhysics(deltaTime) {
        if (!this.ball.userData.isInPlay) return;
        
        const gravity = new THREE.Vector3(0, -9.8, 0);
        const airResistance = 0.98;
        
        // Apply physics
        this.ball.userData.velocity.add(gravity.multiplyScalar(deltaTime));
        this.ball.userData.velocity.multiplyScalar(airResistance);
        
        // Update position
        const displacement = this.ball.userData.velocity.clone().multiplyScalar(deltaTime);
        this.ball.position.add(displacement);
        
        // Check for ground collision
        if (this.ball.position.y <= 0.04) {
            this.ball.position.y = 0.04;
            this.ball.userData.velocity.y *= -0.6; // Bounce with energy loss
            this.ball.userData.velocity.x *= 0.8;
            this.ball.userData.velocity.z *= 0.8;
            
            // Stop ball if velocity is too low
            if (this.ball.userData.velocity.length() < 2) {
                this.ball.userData.velocity.set(0, 0, 0);
                this.ball.userData.isInPlay = false;
                console.log('⚾ Ball stopped');
            }
        }
        
        // Check if ball is caught
        this.checkForCatch();
    }

    checkForCatch() {
        const ballPos = this.ball.position;
        
        for (const [position, player] of this.players.entries()) {
            if (player.team === 'away') {
                const distance = player.mesh.position.distanceTo(ballPos);
                
                if (distance < 1.5 && ballPos.y < 2.5) {
                    this.ball.userData.isInPlay = false;
                    this.ball.userData.velocity.set(0, 0, 0);
                    this.ball.position.copy(player.mesh.position);
                    this.ball.position.y = 1.2;
                    
                    console.log(`⚾ Ball caught by ${position}!`);
                    return true;
                }
            }
        }
        return false;
    }

    startGameLoop() {
        let lastTime = performance.now();
        
        const animate = (currentTime) => {
            const deltaTime = (currentTime - lastTime) / 1000;
            lastTime = currentTime;
            
            // Update game systems
            this.updateAnimations(deltaTime * 1000); // Convert back to ms for animations
            this.updateBallPhysics(deltaTime);
            this.handleBallInPlay();
            
            // Add subtle player idle animations
            this.updateIdleAnimations(currentTime);
            
            // Render the scene
            this.renderer.render(this.scene, this.camera);
            
            requestAnimationFrame(animate);
        };
        
        animate(performance.now());
    }

    updateIdleAnimations(time) {
        // Add subtle breathing/idle animations to players
        for (const [position, player] of this.players.entries()) {
            if (!player.data.isAnimating) {
                const baseY = 0;
                const breathingOffset = Math.sin(time * 0.003 + player.data.number) * 0.02;
                player.mesh.position.y = baseY + breathingOffset;
                
                // Slight rotation for more life
                const rotationOffset = Math.sin(time * 0.002 + player.data.number) * 0.05;
                player.mesh.rotation.y = rotationOffset;
            }
        }
    }

    // Public API methods
    resetGame() {
        // Reset ball
        this.ball.userData.isInPlay = false;
        this.ball.userData.velocity.set(0, 0, 0);
        
        const pitcher = this.players.get('pitcher');
        if (pitcher) {
            this.ball.position.copy(pitcher.mesh.position);
            this.ball.position.y = 1.2;
        }
        
        // Reset game state
        this.gameState = {
            inning: 1,
            topBottom: 'top',
            outs: 0,
            balls: 0,
            strikes: 0,
            bases: { first: null, second: null, third: null },
            currentBatter: null,
            currentPitcher: null
        };
        
        console.log('🔄 Game reset');
    }

    getGameState() {
        return { ...this.gameState };
    }

    setFieldersForSituation(situation) {
        // AI positioning based on game situation
        const positions = {
            'normalInfield': {
                'firstBase': { x: 15, z: -12 },
                'secondBase': { x: 8, z: -25 },
                'thirdBase': { x: -15, z: -12 },
                'shortstop': { x: -8, z: -25 }
            },
            'doublePlayDepth': {
                'firstBase': { x: 13, z: -10 },
                'secondBase': { x: 5, z: -22 },
                'thirdBase': { x: -13, z: -10 },
                'shortstop': { x: -5, z: -22 }
            },
            'guardLines': {
                'firstBase': { x: 18, z: -8 },
                'secondBase': { x: 8, z: -25 },
                'thirdBase': { x: -18, z: -8 },
                'shortstop': { x: -8, z: -25 }
            }
        };
        
        const formation = positions[situation] || positions['normalInfield'];
        
        for (const [position, coords] of Object.entries(formation)) {
            this.movePlayerToPosition(position, coords.x, coords.z, 800);
        }
    }
}

// Export for use in game
window.Enhanced3DBaseballEngine = Enhanced3DBaseballEngine;