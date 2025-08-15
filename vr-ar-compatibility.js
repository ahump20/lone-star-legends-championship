/**
 * VR/AR Compatibility Layer for Lone Star Legends Championship
 * Supports WebXR, A-Frame, and mobile AR experiences
 */

class VRARCompatibility {
    constructor() {
        this.isVRSupported = false;
        this.isARSupported = false;
        this.currentMode = 'desktop'; // desktop, vr, ar
        this.xrSession = null;
        this.xrReferenceSpace = null;
        this.controllers = new Map();
        this.gameInstance = null;
        
        this.initializeXRSupport();
    }

    async initializeXRSupport() {
        console.log('🥽 Initializing VR/AR Compatibility Layer...');
        
        // Check WebXR support
        if ('xr' in navigator) {
            try {
                this.isVRSupported = await navigator.xr.isSessionSupported('immersive-vr');
                this.isARSupported = await navigator.xr.isSessionSupported('immersive-ar');
                
                console.log(`VR Support: ${this.isVRSupported}`);
                console.log(`AR Support: ${this.isARSupported}`);
                
                this.setupXRUI();
            } catch (error) {
                console.warn('⚠️ WebXR not fully supported:', error);
                this.setupFallbackXR();
            }
        } else {
            console.log('📱 WebXR not available, setting up fallback options');
            this.setupFallbackXR();
        }
    }

    setupXRUI() {
        // Add VR/AR buttons to the UI
        const headerEl = document.querySelector('.dashboard-header') || document.querySelector('.header');
        if (headerEl) {
            const xrControlsDiv = document.createElement('div');
            xrControlsDiv.className = 'xr-controls';
            xrControlsDiv.style.cssText = `
                margin: 15px 0;
                display: flex;
                gap: 10px;
                justify-content: center;
                flex-wrap: wrap;
            `;
            
            if (this.isVRSupported) {
                const vrButton = this.createXRButton('🥽 Enter VR', 'vr');
                xrControlsDiv.appendChild(vrButton);
            }
            
            if (this.isARSupported) {
                const arButton = this.createXRButton('📱 Enter AR', 'ar');
                xrControlsDiv.appendChild(arButton);
            }
            
            // Add 360° View button (always available)
            const panoramaButton = this.createXRButton('🌐 360° View', '360');
            xrControlsDiv.appendChild(panoramaButton);
            
            headerEl.appendChild(xrControlsDiv);
        }
    }

    createXRButton(text, mode) {
        const button = document.createElement('button');
        button.textContent = text;
        button.className = 'control-button xr-button';
        button.style.cssText = `
            background: linear-gradient(135deg, #667eea, #764ba2);
            border: 2px solid #667eea;
            margin: 5px;
        `;
        
        button.addEventListener('click', () => {
            if (mode === 'vr') {
                this.enterVR();
            } else if (mode === 'ar') {
                this.enterAR();
            } else if (mode === '360') {
                this.enter360View();
            }
        });
        
        return button;
    }

    async enterVR() {
        if (!this.isVRSupported) {
            this.showXRError('VR not supported on this device');
            return;
        }

        try {
            console.log('🥽 Entering VR mode...');
            
            const session = await navigator.xr.requestSession('immersive-vr', {
                requiredFeatures: ['local-floor'],
                optionalFeatures: ['hand-tracking', 'layers']
            });
            
            await this.initializeXRSession(session, 'vr');
            
        } catch (error) {
            console.error('❌ Failed to enter VR:', error);
            this.showXRError('Failed to start VR session');
        }
    }

    async enterAR() {
        if (!this.isARSupported) {
            this.showXRError('AR not supported on this device');
            return;
        }

        try {
            console.log('📱 Entering AR mode...');
            
            const session = await navigator.xr.requestSession('immersive-ar', {
                requiredFeatures: ['local-floor'],
                optionalFeatures: ['hit-test', 'dom-overlay']
            });
            
            await this.initializeXRSession(session, 'ar');
            
        } catch (error) {
            console.error('❌ Failed to enter AR:', error);
            this.showXRError('Failed to start AR session');
        }
    }

    async initializeXRSession(session, mode) {
        this.xrSession = session;
        this.currentMode = mode;
        
        // Get reference space
        this.xrReferenceSpace = await session.requestReferenceSpace('local-floor');
        
        // Setup WebGL context for XR
        this.setupXRRenderer();
        
        // Setup input sources (controllers, hands)
        this.setupXRInput();
        
        // Start XR render loop
        session.requestAnimationFrame((time, frame) => {
            this.xrRenderLoop(time, frame);
        });
        
        // Handle session end
        session.addEventListener('end', () => {
            this.exitXR();
        });
        
        console.log(`✅ ${mode.toUpperCase()} session started`);
        this.showXRSuccess(`${mode.toUpperCase()} mode active`);
    }

    setupXRRenderer() {
        // Initialize Three.js XR renderer if Three.js is available
        if (window.THREE && this.gameInstance?.renderer) {
            this.gameInstance.renderer.xr.enabled = true;
            this.gameInstance.renderer.xr.setSession(this.xrSession);
            
            console.log('🎮 XR renderer configured with Three.js');
        } else {
            // Fallback: Create basic WebGL context for XR
            this.createBasicXRRenderer();
        }
    }

    createBasicXRRenderer() {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl', { xrCompatible: true });
        
        if (!gl) {
            console.error('❌ WebGL not supported');
            return;
        }
        
        // Basic XR setup
        gl.enable(gl.DEPTH_TEST);
        gl.clearColor(0.1, 0.3, 0.2, 1.0); // Baseball field green
        
        console.log('🎨 Basic XR renderer created');
    }

    setupXRInput() {
        // Track input sources (controllers, hands)
        this.xrSession.addEventListener('inputsourceschange', (event) => {
            event.added.forEach(source => {
                this.addController(source);
            });
            
            event.removed.forEach(source => {
                this.removeController(source);
            });
        });
    }

    addController(inputSource) {
        const controllerId = this.controllers.size;
        
        const controller = {
            id: controllerId,
            inputSource: inputSource,
            targetRaySpace: null,
            gripSpace: null,
            gamepad: inputSource.gamepad
        };
        
        // Get controller spaces if available
        if (inputSource.targetRayMode === 'tracked-pointer') {
            controller.targetRaySpace = this.xrSession.requestReferenceSpace('local-floor');
        }
        
        this.controllers.set(controllerId, controller);
        
        console.log(`🎮 Controller ${controllerId} added:`, inputSource.handedness);
    }

    removeController(inputSource) {
        // Find and remove controller
        for (const [id, controller] of this.controllers.entries()) {
            if (controller.inputSource === inputSource) {
                this.controllers.delete(id);
                console.log(`🎮 Controller ${id} removed`);
                break;
            }
        }
    }

    xrRenderLoop(time, frame) {
        if (!this.xrSession) return;
        
        // Get viewer pose
        const pose = frame.getViewerPose(this.xrReferenceSpace);
        
        if (pose) {
            // Render for each eye/view
            pose.views.forEach((view, index) => {
                this.renderXRView(view, index);
            });
            
            // Handle controller input
            this.processXRInput(frame);
        }
        
        // Continue render loop
        this.xrSession.requestAnimationFrame((time, frame) => {
            this.xrRenderLoop(time, frame);
        });
    }

    renderXRView(view, index) {
        // This would integrate with the Three.js baseball simulator
        if (this.gameInstance && this.gameInstance.renderer) {
            // Update camera with XR view parameters
            const camera = this.gameInstance.camera;
            camera.projectionMatrix.fromArray(view.projectionMatrix);
            camera.matrix.fromArray(view.transform.matrix);
            camera.matrix.decompose(camera.position, camera.quaternion, camera.scale);
            camera.updateMatrixWorld(true);
            
            // Render the scene
            this.gameInstance.renderer.render(this.gameInstance.scene, camera);
        } else {
            // Fallback: Basic WebGL rendering
            this.renderBasicXRScene(view);
        }
    }

    renderBasicXRScene(view) {
        // Basic baseball field visualization for XR
        const gl = this.gameInstance?.gl;
        if (!gl) return;
        
        // Clear and set viewport
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        // Render simple baseball field
        this.renderXRBaseballField(gl, view);
    }

    renderXRBaseballField(gl, view) {
        // Simplified baseball field rendering for XR
        // This would be expanded with proper geometry and textures
        
        // Green field background
        gl.clearColor(0.2, 0.8, 0.2, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        // Would render:
        // - Diamond shape
        // - Pitcher's mound
        // - Outfield fence
        // - Stadium environment
        // - Players and ball
    }

    processXRInput(frame) {
        // Process controller input for baseball actions
        this.controllers.forEach((controller, id) => {
            if (controller.gamepad) {
                const gamepad = controller.gamepad;
                
                // Button mappings for baseball actions
                if (gamepad.buttons[0]?.pressed) { // Trigger = Swing
                    this.triggerBaseballAction('swing');
                }
                
                if (gamepad.buttons[1]?.pressed) { // Squeeze = Pitch
                    this.triggerBaseballAction('pitch');
                }
                
                // Thumbstick for movement (if needed)
                const thumbstickX = gamepad.axes[2] || 0;
                const thumbstickY = gamepad.axes[3] || 0;
                
                if (Math.abs(thumbstickX) > 0.1 || Math.abs(thumbstickY) > 0.1) {
                    this.handleXRMovement(thumbstickX, thumbstickY);
                }
            }
        });
    }

    triggerBaseballAction(action) {
        console.log(`⚾ XR Baseball Action: ${action}`);
        
        // Integrate with game logic
        if (window.gameAction) {
            window.gameAction(action);
        }
        
        // Add haptic feedback if supported
        this.addHapticFeedback(action);
    }

    addHapticFeedback(action) {
        this.controllers.forEach(controller => {
            if (controller.gamepad?.hapticActuators?.length > 0) {
                const intensity = action === 'swing' ? 0.8 : 0.5;
                const duration = action === 'swing' ? 200 : 100;
                
                controller.gamepad.hapticActuators[0].pulse(intensity, duration);
            }
        });
    }

    handleXRMovement(x, y) {
        // Handle VR/AR movement input
        if (this.gameInstance && this.gameInstance.controls) {
            // Adjust camera or player position
            const moveSpeed = 0.1;
            this.gameInstance.camera.position.x += x * moveSpeed;
            this.gameInstance.camera.position.z += y * moveSpeed;
        }
    }

    enter360View() {
        console.log('🌐 Entering 360° panoramic view...');
        
        // Create 360° stadium view
        this.create360Environment();
        this.currentMode = '360';
        
        this.showXRSuccess('360° panoramic view active');
    }

    create360Environment() {
        // Create or modify Three.js scene for 360° view
        if (window.THREE && this.gameInstance) {
            // Add 360° skybox/stadium environment
            const loader = new THREE.CubeTextureLoader();
            
            // Create panoramic stadium environment
            const geometry = new THREE.SphereGeometry(500, 32, 32);
            const material = new THREE.MeshBasicMaterial({
                color: 0x87CEEB, // Sky blue
                side: THREE.BackSide
            });
            
            const skybox = new THREE.Mesh(geometry, material);
            this.gameInstance.scene.add(skybox);
            
            // Enable orbit controls for 360° navigation
            if (this.gameInstance.controls) {
                this.gameInstance.controls.enablePan = true;
                this.gameInstance.controls.enableZoom = true;
                this.gameInstance.controls.autoRotate = true;
                this.gameInstance.controls.autoRotateSpeed = 0.5;
            }
            
            console.log('🏟️ 360° stadium environment created');
        }
    }

    exitXR() {
        if (this.xrSession) {
            this.xrSession.end();
            this.xrSession = null;
        }
        
        this.xrReferenceSpace = null;
        this.controllers.clear();
        this.currentMode = 'desktop';
        
        console.log('👋 Exited XR mode');
        this.showXRSuccess('Returned to desktop mode');
    }

    setupFallbackXR() {
        // Setup fallback options for devices without WebXR
        console.log('📱 Setting up fallback XR options...');
        
        // Device orientation for mobile "VR"
        this.setupDeviceOrientation();
        
        // WebRTC for AR-like features
        this.setupWebRTCCamera();
        
        // Gyroscope for motion controls
        this.setupMotionControls();
    }

    setupDeviceOrientation() {
        if ('DeviceOrientationEvent' in window) {
            window.addEventListener('deviceorientation', (event) => {
                // Use device orientation for camera control
                if (this.currentMode === '360' && this.gameInstance?.camera) {
                    const alpha = event.alpha || 0; // Z axis
                    const beta = event.beta || 0;   // X axis
                    const gamma = event.gamma || 0; // Y axis
                    
                    // Apply rotation to camera
                    this.gameInstance.camera.rotation.set(
                        THREE.MathUtils.degToRad(beta),
                        THREE.MathUtils.degToRad(alpha),
                        THREE.MathUtils.degToRad(gamma)
                    );
                }
            });
            
            console.log('📱 Device orientation controls enabled');
        }
    }

    setupWebRTCCamera() {
        // Setup camera access for AR-like overlay features
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            this.cameraSupported = true;
            console.log('📷 Camera access available for AR features');
        }
    }

    async enableCameraOverlay() {
        if (!this.cameraSupported) return false;
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            
            // Create video element for camera feed
            const videoElement = document.createElement('video');
            videoElement.srcObject = stream;
            videoElement.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                object-fit: cover;
                z-index: -1;
            `;
            
            document.body.appendChild(videoElement);
            videoElement.play();
            
            console.log('📷 Camera overlay enabled');
            return true;
        } catch (error) {
            console.error('❌ Camera access denied:', error);
            return false;
        }
    }

    setupMotionControls() {
        // Setup motion controls for swing/pitch detection
        if ('DeviceMotionEvent' in window) {
            window.addEventListener('devicemotion', (event) => {
                if (this.currentMode !== 'desktop') {
                    this.processMotionInput(event);
                }
            });
            
            console.log('🎮 Motion controls enabled');
        }
    }

    processMotionInput(event) {
        const acceleration = event.acceleration;
        if (!acceleration) return;
        
        // Detect swing motion (sharp horizontal movement)
        const swingThreshold = 15; // m/s²
        if (Math.abs(acceleration.x) > swingThreshold) {
            console.log('⚾ Swing motion detected');
            this.triggerBaseballAction('swing');
        }
        
        // Detect pitch motion (forward throw)
        const pitchThreshold = 12;
        if (acceleration.z > pitchThreshold) {
            console.log('🥎 Pitch motion detected');
            this.triggerBaseballAction('pitch');
        }
    }

    // UI helper methods
    showXRError(message) {
        this.showXRMessage(message, 'error');
    }

    showXRSuccess(message) {
        this.showXRMessage(message, 'success');
    }

    showXRMessage(message, type) {
        // Create temporary message display
        const messageEl = document.createElement('div');
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(34, 197, 94, 0.9)'};
            color: white;
            padding: 15px;
            border-radius: 8px;
            z-index: 10000;
            font-weight: bold;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        `;
        messageEl.textContent = message;
        
        document.body.appendChild(messageEl);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 3000);
    }

    // Integration methods
    setGameInstance(gameInstance) {
        this.gameInstance = gameInstance;
        console.log('🎮 Game instance connected to VR/AR layer');
    }

    getCurrentMode() {
        return this.currentMode;
    }

    isInXR() {
        return this.currentMode !== 'desktop';
    }

    getControllers() {
        return Array.from(this.controllers.values());
    }

    // Cleanup
    dispose() {
        this.exitXR();
        this.controllers.clear();
        console.log('🧹 VR/AR Compatibility Layer disposed');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VRARCompatibility;
}

// Make available globally in browser
if (typeof window !== 'undefined') {
    window.VRARCompatibility = VRARCompatibility;
}

// Auto-initialize if in browser environment
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        // Delay to ensure other components are loaded
        setTimeout(() => {
            const vrAR = new VRARCompatibility();
            window.vrARSystem = vrAR;
            
            // Connect to game instance if available
            if (window.gameInstance || window.threeJSGame) {
                vrAR.setGameInstance(window.gameInstance || window.threeJSGame);
            }
            
            console.log('🥽 VR/AR Compatibility Layer: READY');
            console.log('📱 Mobile Motion Controls: ACTIVE');
            console.log('🌐 360° Panoramic View: AVAILABLE');
        }, 2000);
    });
}

console.log('🥽 VR/AR Compatibility Module Loaded');