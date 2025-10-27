/**
 * 3D Character Preview System
 * Creates interactive 3D models of custom characters using Three.js
 */

class Character3DPreview {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.character = null;
        this.animationId = null;
        this.characterParts = {};

        if (this.container) {
            this.initialize();
        }
    }

    /**
     * Initialize Three.js scene
     */
    initialize() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf0f0f0);

        // Camera
        const width = this.container.clientWidth;
        const height = this.container.clientHeight || 400;
        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        this.camera.position.set(0, 1.5, 5);
        this.camera.lookAt(0, 1, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(width, height);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        // Lights
        this.setupLights();

        // Ground
        this.createGround();

        // Controls
        this.setupControls();

        // Start animation
        this.animate();

        // Handle resize
        window.addEventListener('resize', () => this.onWindowResize());
    }

    /**
     * Setup lighting
     */
    setupLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // Main directional light
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
        mainLight.position.set(5, 10, 5);
        mainLight.castShadow = true;
        mainLight.shadow.camera.left = -5;
        mainLight.shadow.camera.right = 5;
        mainLight.shadow.camera.top = 5;
        mainLight.shadow.camera.bottom = -5;
        this.scene.add(mainLight);

        // Fill light
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
        fillLight.position.set(-5, 5, -5);
        this.scene.add(fillLight);

        // Rim light
        const rimLight = new THREE.DirectionalLight(0x88ccff, 0.4);
        rimLight.position.set(0, 5, -5);
        this.scene.add(rimLight);
    }

    /**
     * Create ground plane
     */
    createGround() {
        const groundGeometry = new THREE.CircleGeometry(3, 32);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x2D5016,
            roughness: 0.8
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // Add baseball diamond pattern
        const lineGeometry = new THREE.RingGeometry(1.5, 1.52, 4, 1);
        const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
        const diamondLine = new THREE.Mesh(lineGeometry, lineMaterial);
        diamondLine.rotation.x = -Math.PI / 2;
        diamondLine.rotation.z = Math.PI / 4;
        diamondLine.position.y = 0.01;
        this.scene.add(diamondLine);
    }

    /**
     * Setup mouse controls
     */
    setupControls() {
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };
        let rotation = { x: 0, y: 0 };

        this.renderer.domElement.addEventListener('mousedown', (e) => {
            isDragging = true;
            previousMousePosition = { x: e.clientX, y: e.clientY };
        });

        this.renderer.domElement.addEventListener('mousemove', (e) => {
            if (isDragging && this.character) {
                const deltaX = e.clientX - previousMousePosition.x;
                const deltaY = e.clientY - previousMousePosition.y;

                rotation.y += deltaX * 0.01;
                rotation.x += deltaY * 0.01;

                this.character.rotation.y = rotation.y;
                this.character.rotation.x = Math.max(-0.5, Math.min(0.5, rotation.x));

                previousMousePosition = { x: e.clientX, y: e.clientY };
            }
        });

        this.renderer.domElement.addEventListener('mouseup', () => {
            isDragging = false;
        });

        this.renderer.domElement.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY * 0.001;
            this.camera.position.z = Math.max(3, Math.min(10, this.camera.position.z + delta));
        });

        // Touch controls
        let touchStartPos = null;

        this.renderer.domElement.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                touchStartPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            }
        });

        this.renderer.domElement.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1 && touchStartPos && this.character) {
                e.preventDefault();
                const deltaX = e.touches[0].clientX - touchStartPos.x;
                const deltaY = e.touches[0].clientY - touchStartPos.y;

                rotation.y += deltaX * 0.01;
                rotation.x += deltaY * 0.01;

                this.character.rotation.y = rotation.y;
                this.character.rotation.x = Math.max(-0.5, Math.min(0.5, rotation.x));

                touchStartPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            }
        });

        this.renderer.domElement.addEventListener('touchend', () => {
            touchStartPos = null;
        });
    }

    /**
     * Create character model from customization data
     */
    createCharacter(customization) {
        // Remove old character if exists
        if (this.character) {
            this.scene.remove(this.character);
        }

        this.character = new THREE.Group();

        // Get colors
        const skinColor = this.getColorFromHex(customization.skinTone);
        const hairColor = this.getColorFromHex(customization.hairColor);
        const uniformPrimary = this.getColorFromHex(customization.primaryColor);
        const uniformSecondary = this.getColorFromHex(customization.secondaryColor);

        // Body (torso)
        const bodyGeometry = new THREE.CapsuleGeometry(0.3, 0.8, 8, 16);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: uniformPrimary,
            roughness: 0.7
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 1.2;
        body.castShadow = true;
        this.character.add(body);
        this.characterParts.body = body;

        // Head
        const headSize = 0.25;
        const headGeometry = new THREE.SphereGeometry(headSize, 16, 16);
        const headMaterial = new THREE.MeshStandardMaterial({
            color: skinColor,
            roughness: 0.6
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.8;
        head.castShadow = true;
        this.character.add(head);
        this.characterParts.head = head;

        // Hair
        this.createHair(customization.hairStyle, hairColor);

        // Eyes
        this.createEyes(customization.eyeColor);

        // Arms
        this.createArms(skinColor, uniformSecondary);

        // Legs
        this.createLegs(uniformPrimary);

        // Accessories
        if (customization.accessories) {
            customization.accessories.forEach(acc => this.addAccessory(acc));
        }

        // Jersey number
        if (customization.number) {
            this.addJerseyNumber(customization.number, uniformSecondary);
        }

        // Baseball bat
        this.addBat();

        // Add to scene
        this.character.position.y = 0;
        this.scene.add(this.character);

        // Idle animation
        this.startIdleAnimation();

        return this.character;
    }

    /**
     * Create hair based on style
     */
    createHair(style, color) {
        const hairMaterial = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.8
        });

        let hair;

        switch(style) {
            case 'short_spiky':
                hair = new THREE.Group();
                for (let i = 0; i < 8; i++) {
                    const spike = new THREE.Mesh(
                        new THREE.ConeGeometry(0.03, 0.15, 6),
                        hairMaterial
                    );
                    const angle = (i / 8) * Math.PI * 2;
                    spike.position.set(
                        Math.cos(angle) * 0.2,
                        1.95,
                        Math.sin(angle) * 0.2
                    );
                    spike.rotation.z = angle;
                    spike.castShadow = true;
                    hair.add(spike);
                }
                break;

            case 'afro':
                hair = new THREE.Mesh(
                    new THREE.SphereGeometry(0.35, 16, 16),
                    hairMaterial
                );
                hair.position.y = 1.85;
                hair.castShadow = true;
                break;

            case 'long_ponytail':
                hair = new THREE.Group();
                const topHair = new THREE.Mesh(
                    new THREE.SphereGeometry(0.28, 16, 16),
                    hairMaterial
                );
                topHair.position.y = 1.85;
                topHair.scale.set(1, 0.8, 1);
                topHair.castShadow = true;
                hair.add(topHair);

                const ponytail = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.05, 0.03, 0.5, 8),
                    hairMaterial
                );
                ponytail.position.set(0, 1.55, -0.25);
                ponytail.rotation.x = -0.3;
                ponytail.castShadow = true;
                hair.add(ponytail);
                break;

            case 'mohawk':
                hair = new THREE.Mesh(
                    new THREE.BoxGeometry(0.1, 0.3, 0.4),
                    hairMaterial
                );
                hair.position.y = 2;
                hair.castShadow = true;
                break;

            case 'buzzcut':
                hair = new THREE.Mesh(
                    new THREE.SphereGeometry(0.26, 16, 16),
                    hairMaterial
                );
                hair.position.y = 1.85;
                hair.scale.set(1, 0.5, 1);
                hair.castShadow = true;
                break;

            case 'curly':
                hair = new THREE.Group();
                for (let i = 0; i < 12; i++) {
                    const curl = new THREE.Mesh(
                        new THREE.SphereGeometry(0.06, 8, 8),
                        hairMaterial
                    );
                    const angle = (i / 12) * Math.PI * 2;
                    curl.position.set(
                        Math.cos(angle) * 0.22,
                        1.88 + Math.random() * 0.1,
                        Math.sin(angle) * 0.22
                    );
                    curl.castShadow = true;
                    hair.add(curl);
                }
                break;

            default:
                hair = new THREE.Mesh(
                    new THREE.SphereGeometry(0.27, 16, 16),
                    hairMaterial
                );
                hair.position.y = 1.85;
                hair.scale.set(1, 0.7, 1);
                hair.castShadow = true;
        }

        this.character.add(hair);
        this.characterParts.hair = hair;
    }

    /**
     * Create eyes
     */
    createEyes(eyeColor) {
        const eyeColor3D = this.getColorFromHex(eyeColor);
        const eyeMaterial = new THREE.MeshStandardMaterial({
            color: eyeColor3D,
            roughness: 0.3,
            metalness: 0.2
        });

        const eyeGeometry = new THREE.SphereGeometry(0.04, 8, 8);

        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.08, 1.85, 0.2);
        this.character.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.08, 1.85, 0.2);
        this.character.add(rightEye);

        this.characterParts.eyes = { left: leftEye, right: rightEye };
    }

    /**
     * Create arms
     */
    createArms(skinColor, uniformColor) {
        const armMaterial = new THREE.MeshStandardMaterial({
            color: uniformColor,
            roughness: 0.7
        });
        const handMaterial = new THREE.MeshStandardMaterial({
            color: skinColor,
            roughness: 0.6
        });

        // Left arm
        const leftArm = new THREE.Group();
        const leftUpperArm = new THREE.Mesh(
            new THREE.CapsuleGeometry(0.08, 0.4, 6, 12),
            armMaterial
        );
        leftUpperArm.position.set(0, 0.2, 0);
        leftUpperArm.rotation.z = 0.3;
        leftUpperArm.castShadow = true;
        leftArm.add(leftUpperArm);

        const leftHand = new THREE.Mesh(
            new THREE.SphereGeometry(0.08, 8, 8),
            handMaterial
        );
        leftHand.position.set(0, -0.25, 0);
        leftHand.castShadow = true;
        leftArm.add(leftHand);

        leftArm.position.set(-0.4, 1.3, 0);
        this.character.add(leftArm);

        // Right arm
        const rightArm = new THREE.Group();
        const rightUpperArm = new THREE.Mesh(
            new THREE.CapsuleGeometry(0.08, 0.4, 6, 12),
            armMaterial
        );
        rightUpperArm.position.set(0, 0.2, 0);
        rightUpperArm.rotation.z = -0.3;
        rightUpperArm.castShadow = true;
        rightArm.add(rightUpperArm);

        const rightHand = new THREE.Mesh(
            new THREE.SphereGeometry(0.08, 8, 8),
            handMaterial
        );
        rightHand.position.set(0, -0.25, 0);
        rightHand.castShadow = true;
        rightArm.add(rightHand);

        rightArm.position.set(0.4, 1.3, 0);
        this.character.add(rightArm);

        this.characterParts.arms = { left: leftArm, right: rightArm };
    }

    /**
     * Create legs
     */
    createLegs(uniformColor) {
        const legMaterial = new THREE.MeshStandardMaterial({
            color: uniformColor,
            roughness: 0.7
        });
        const shoeMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.8
        });

        // Left leg
        const leftLeg = new THREE.Group();
        const leftThigh = new THREE.Mesh(
            new THREE.CapsuleGeometry(0.12, 0.5, 8, 12),
            legMaterial
        );
        leftThigh.position.y = 0.3;
        leftThigh.castShadow = true;
        leftLeg.add(leftThigh);

        const leftShoe = new THREE.Mesh(
            new THREE.BoxGeometry(0.15, 0.1, 0.25),
            shoeMaterial
        );
        leftShoe.position.set(0, 0, 0.05);
        leftShoe.castShadow = true;
        leftLeg.add(leftShoe);

        leftLeg.position.set(-0.15, 0.05, 0);
        this.character.add(leftLeg);

        // Right leg
        const rightLeg = new THREE.Group();
        const rightThigh = new THREE.Mesh(
            new THREE.CapsuleGeometry(0.12, 0.5, 8, 12),
            legMaterial
        );
        rightThigh.position.y = 0.3;
        rightThigh.castShadow = true;
        rightLeg.add(rightThigh);

        const rightShoe = new THREE.Mesh(
            new THREE.BoxGeometry(0.15, 0.1, 0.25),
            shoeMaterial
        );
        rightShoe.position.set(0, 0, 0.05);
        rightShoe.castShadow = true;
        rightLeg.add(rightShoe);

        rightLeg.position.set(0.15, 0.05, 0);
        this.character.add(rightLeg);

        this.characterParts.legs = { left: leftLeg, right: rightLeg };
    }

    /**
     * Add accessories
     */
    addAccessory(accessoryId) {
        switch(accessoryId) {
            case 'cap_backwards':
                const cap = new THREE.Group();
                const capTop = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.22, 0.22, 0.1, 16),
                    new THREE.MeshStandardMaterial({ color: 0x0000FF })
                );
                capTop.position.y = 1.95;
                capTop.castShadow = true;
                cap.add(capTop);

                const capBrim = new THREE.Mesh(
                    new THREE.BoxGeometry(0.35, 0.02, 0.25),
                    new THREE.MeshStandardMaterial({ color: 0x0000DD })
                );
                capBrim.position.set(0, 1.92, -0.2);
                capBrim.castShadow = true;
                cap.add(capBrim);

                this.character.add(cap);
                break;

            case 'sunglasses':
                const glasses = new THREE.Group();
                const leftLens = new THREE.Mesh(
                    new THREE.BoxGeometry(0.12, 0.08, 0.02),
                    new THREE.MeshStandardMaterial({ color: 0x000000, metalness: 0.5 })
                );
                leftLens.position.set(-0.08, 1.85, 0.23);
                glasses.add(leftLens);

                const rightLens = new THREE.Mesh(
                    new THREE.BoxGeometry(0.12, 0.08, 0.02),
                    new THREE.MeshStandardMaterial({ color: 0x000000, metalness: 0.5 })
                );
                rightLens.position.set(0.08, 1.85, 0.23);
                glasses.add(rightLens);

                const bridge = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.01, 0.01, 0.08, 8),
                    new THREE.MeshStandardMaterial({ color: 0x333333 })
                );
                bridge.rotation.z = Math.PI / 2;
                bridge.position.set(0, 1.85, 0.23);
                glasses.add(bridge);

                this.character.add(glasses);
                break;

            case 'headband':
                const headband = new THREE.Mesh(
                    new THREE.TorusGeometry(0.24, 0.03, 8, 24, Math.PI * 1.5),
                    new THREE.MeshStandardMaterial({ color: 0xFF0000 })
                );
                headband.rotation.x = Math.PI / 2;
                headband.position.y = 1.88;
                headband.castShadow = true;
                this.character.add(headband);
                break;
        }
    }

    /**
     * Add jersey number
     */
    addJerseyNumber(number, color) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
        ctx.fillRect(0, 0, 128, 128);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 80px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(number.toString(), 64, 64);

        const texture = new THREE.CanvasTexture(canvas);
        const numberMaterial = new THREE.MeshStandardMaterial({ map: texture });

        const numberPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(0.3, 0.3),
            numberMaterial
        );
        numberPlane.position.set(0, 1.3, -0.32);
        this.character.add(numberPlane);
    }

    /**
     * Add baseball bat
     */
    addBat() {
        const batMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513,
            roughness: 0.6
        });

        const bat = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03, 0.06, 0.8, 8),
            batMaterial
        );
        bat.position.set(0.5, 0.8, 0);
        bat.rotation.z = -Math.PI / 4;
        bat.castShadow = true;
        this.character.add(bat);

        this.characterParts.bat = bat;
    }

    /**
     * Start idle animation
     */
    startIdleAnimation() {
        this.idleTime = 0;
    }

    /**
     * Get color from hex string
     */
    getColorFromHex(hexOrId) {
        // If it's already a hex color
        if (typeof hexOrId === 'string' && hexOrId.startsWith('#')) {
            return parseInt(hexOrId.substring(1), 16);
        }

        // Color mappings
        const colorMap = {
            // Skin tones
            'light': 0xFFE0BD,
            'fair': 0xF1C27D,
            'medium': 0xE0AC69,
            'tan': 0xC68642,
            'brown': 0x8D5524,
            'dark': 0x6F3A1F,

            // Hair colors
            'black': 0x1A1A1A,
            'dark_brown': 0x3D2817,
            'brown': 0x6F4E37,
            'light_brown': 0xA67B5B,
            'blonde': 0xFFF8DC,
            'red': 0xC1440E,
            'auburn': 0xA52A2A,
            'gray': 0x808080,
            'blue': 0x0066CC,
            'pink': 0xFF69B4,
            'green': 0x00FF00,
            'purple': 0x9370DB,

            // Eye colors
            'hazel': 0x8E7618,
            'amber': 0xFFBF00,

            // Uniform colors
            'orange': 0xFF6B35,
            'yellow': 0xFFFF00,
            'teal': 0x008080,
            'navy': 0x000080,
            'gold': 0xFFD700,
            'white': 0xFFFFFF
        };

        return colorMap[hexOrId] || 0x667eea;
    }

    /**
     * Animation loop
     */
    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());

        // Idle animation
        if (this.character) {
            this.idleTime += 0.01;

            // Gentle breathing
            this.character.position.y = Math.sin(this.idleTime * 2) * 0.02;

            // Bat sway
            if (this.characterParts.bat) {
                this.characterParts.bat.rotation.z = -Math.PI / 4 + Math.sin(this.idleTime) * 0.1;
            }

            // Auto-rotate
            this.character.rotation.y += 0.003;
        }

        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Handle window resize
     */
    onWindowResize() {
        if (!this.container) return;

        const width = this.container.clientWidth;
        const height = this.container.clientHeight || 400;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    /**
     * Update character
     */
    updateCharacter(customization) {
        this.createCharacter(customization);
    }

    /**
     * Play animation
     */
    playAnimation(animationType) {
        if (!this.character) return;

        switch(animationType) {
            case 'swing':
                this.playSwingAnimation();
                break;
            case 'pitch':
                this.playPitchAnimation();
                break;
            case 'run':
                this.playRunAnimation();
                break;
            case 'catch':
                this.playCatchAnimation();
                break;
        }
    }

    /**
     * Swing animation
     */
    playSwingAnimation() {
        if (!this.characterParts.bat) return;

        const bat = this.characterParts.bat;
        const startRotation = bat.rotation.z;
        const endRotation = startRotation + Math.PI;
        const duration = 300;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            bat.rotation.z = startRotation + (endRotation - startRotation) * this.easeOutCubic(progress);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Return to start
                setTimeout(() => {
                    bat.rotation.z = startRotation;
                }, 200);
            }
        };

        animate();
    }

    /**
     * Easing function
     */
    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    /**
     * Cleanup
     */
    dispose() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.renderer) {
            this.renderer.dispose();
        }
        if (this.container && this.renderer) {
            this.container.removeChild(this.renderer.domElement);
        }
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Character3DPreview;
}
