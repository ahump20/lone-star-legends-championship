/**
 * Phase 32: Advanced VR Physics Interaction System
 * Realistic hand tracking, haptic feedback, and physics-based VR interactions
 */
export class AdvancedVRPhysics {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.isActive = false;
        this.vrSupported = false;
        
        // VR Session
        this.xrSession = null;
        this.xrReferenceSpace = null;
        this.xrFrame = null;
        
        // Hand tracking configuration
        this.handTracking = {
            enabled: false,
            hands: {
                left: {
                    controller: null,
                    gripSpace: null,
                    targetRaySpace: null,
                    hand: null,
                    joints: new Map(),
                    pose: null,
                    velocity: { x: 0, y: 0, z: 0 },
                    angularVelocity: { x: 0, y: 0, z: 0 },
                    gripStrength: 0,
                    pinchStrength: 0,
                    isGripping: false,
                    heldObject: null
                },
                right: {
                    controller: null,
                    gripSpace: null,
                    targetRaySpace: null,
                    hand: null,
                    joints: new Map(),
                    pose: null,
                    velocity: { x: 0, y: 0, z: 0 },
                    angularVelocity: { x: 0, y: 0, z: 0 },
                    gripStrength: 0,
                    pinchStrength: 0,
                    isGripping: false,
                    heldObject: null
                }
            },
            jointNames: [
                'wrist', 'thumb-metacarpal', 'thumb-phalanx-proximal', 'thumb-phalanx-distal', 'thumb-tip',
                'index-finger-metacarpal', 'index-finger-phalanx-proximal', 'index-finger-phalanx-intermediate',
                'index-finger-phalanx-distal', 'index-finger-tip',
                'middle-finger-metacarpal', 'middle-finger-phalanx-proximal', 'middle-finger-phalanx-intermediate',
                'middle-finger-phalanx-distal', 'middle-finger-tip',
                'ring-finger-metacarpal', 'ring-finger-phalanx-proximal', 'ring-finger-phalanx-intermediate',
                'ring-finger-phalanx-distal', 'ring-finger-tip',
                'pinky-finger-metacarpal', 'pinky-finger-phalanx-proximal', 'pinky-finger-phalanx-intermediate',
                'pinky-finger-phalanx-distal', 'pinky-finger-tip'
            ]
        };
        
        // Physics interaction
        this.physicsInteraction = {
            grabDistance: 0.1,  // meters
            throwMultiplier: 2.0,
            minGripStrength: 0.5,
            maxGrabMass: 10,  // kg
            interactableObjects: new Map(),
            constraints: new Map(),
            collisionGroups: {
                hands: 0x0001,
                bat: 0x0002,
                ball: 0x0004,
                glove: 0x0008,
                environment: 0x0010
            }
        };
        
        // Haptic feedback
        this.haptics = {
            enabled: true,
            profiles: {
                ballCatch: { duration: 100, intensity: 0.8, frequency: 200 },
                batContact: { duration: 150, intensity: 1.0, frequency: 100 },
                gloveImpact: { duration: 80, intensity: 0.6, frequency: 150 },
                ballRelease: { duration: 50, intensity: 0.4, frequency: 250 },
                uiInteraction: { duration: 20, intensity: 0.3, frequency: 300 },
                collision: { duration: 60, intensity: 0.7, frequency: 180 }
            },
            actuators: {
                left: null,
                right: null
            }
        };
        
        // Gesture recognition
        this.gestureRecognition = {
            enabled: true,
            gestures: {
                grip: { detected: false, confidence: 0 },
                pinch: { detected: false, confidence: 0 },
                point: { detected: false, confidence: 0 },
                thumbsUp: { detected: false, confidence: 0 },
                peace: { detected: false, confidence: 0 },
                fist: { detected: false, confidence: 0 },
                open: { detected: false, confidence: 0 },
                swipe: { detected: false, direction: null, velocity: 0 },
                throw: { detected: false, velocity: null, spin: null }
            },
            history: [],
            maxHistoryLength: 30
        };
        
        // Baseball-specific interactions
        this.baseballInteractions = {
            bat: {
                object: null,
                gripPoints: [
                    { position: { x: 0, y: -0.3, z: 0 }, radius: 0.05 },  // Bottom grip
                    { position: { x: 0, y: -0.1, z: 0 }, radius: 0.05 }   // Top grip
                ],
                isHeld: false,
                holdingHand: null,
                swingVelocity: 0,
                swingAngle: 0,
                sweetSpot: { position: { x: 0, y: 0.3, z: 0 }, radius: 0.1 }
            },
            
            ball: {
                object: null,
                isHeld: false,
                holdingHand: null,
                gripType: null,  // 'fastball', 'curve', 'slider', etc.
                spinRate: { x: 0, y: 0, z: 0 },
                releaseVelocity: null,
                trajectory: []
            },
            
            glove: {
                object: null,
                isWorn: false,
                wornHand: null,
                pocketPosition: { x: 0, y: 0, z: 0.1 },
                webbing: {
                    tension: 1.0,
                    flexibility: 0.3
                },
                catches: 0
            },
            
            pitchingGrips: {
                fastball: {
                    fingerPositions: [
                        { finger: 'index', position: { x: 0, y: 0.02, z: 0 } },
                        { finger: 'middle', position: { x: 0.01, y: 0.02, z: 0 } }
                    ],
                    thumbPosition: { x: 0, y: -0.02, z: 0 },
                    spin: { x: -2000, y: 0, z: 0 }
                },
                curveball: {
                    fingerPositions: [
                        { finger: 'index', position: { x: 0.01, y: 0.02, z: 0 } },
                        { finger: 'middle', position: { x: 0.02, y: 0.02, z: 0 } }
                    ],
                    thumbPosition: { x: -0.01, y: -0.02, z: 0 },
                    spin: { x: 0, y: 2500, z: 500 }
                },
                slider: {
                    fingerPositions: [
                        { finger: 'index', position: { x: 0.015, y: 0.02, z: 0 } },
                        { finger: 'middle', position: { x: 0.025, y: 0.02, z: 0 } }
                    ],
                    thumbPosition: { x: 0, y: -0.02, z: 0.01 },
                    spin: { x: -500, y: 1500, z: 0 }
                }
            }
        };
        
        // Room-scale tracking
        this.roomScale = {
            enabled: false,
            playArea: {
                width: 3,  // meters
                depth: 3,  // meters
                height: 2.5  // meters
            },
            boundaries: [],
            safeZone: {
                warning: 0.3,  // meters from boundary
                color: 0xffff00
            },
            userPosition: { x: 0, y: 0, z: 0 },
            userHeight: 1.7  // meters
        };
        
        // Performance optimization
        this.optimization = {
            handUpdateRate: 90,  // Hz
            physicsSubsteps: 3,
            maxInteractableDistance: 5,  // meters
            lodDistances: [1, 3, 5],
            culling: {
                frustum: true,
                occlusion: true
            }
        };
        
        // Calibration
        this.calibration = {
            required: true,
            completed: false,
            data: {
                armLength: null,
                handSize: null,
                dominantHand: 'right',
                playerHeight: null,
                swingStyle: null
            }
        };
        
        // Telemetry
        this.telemetry = {
            frameRate: 0,
            latency: 0,
            trackingQuality: 'good',
            handTrackingLoss: 0,
            totalInteractions: 0,
            sessionStats: {
                swings: 0,
                catches: 0,
                throws: 0,
                hits: 0,
                strikes: 0
            }
        };
        
        console.log('🥽 Advanced VR Physics System initialized');
        this.initialize();
    }
    
    /**
     * Initialize VR system
     */
    async initialize() {
        // Check WebXR support
        if (!navigator.xr) {
            console.warn('WebXR not supported');
            this.vrSupported = false;
            return;
        }
        
        // Check for VR support
        const vrSupported = await navigator.xr.isSessionSupported('immersive-vr');
        const arSupported = await navigator.xr.isSessionSupported('immersive-ar');
        
        this.vrSupported = vrSupported || arSupported;
        
        if (this.vrSupported) {
            console.log('✅ VR/AR supported');
            
            // Check for hand tracking support
            if (navigator.xr.isSessionSupported) {
                const handTrackingSupported = await navigator.xr.isSessionSupported('immersive-vr', {
                    optionalFeatures: ['hand-tracking']
                });
                
                this.handTracking.enabled = handTrackingSupported;
                console.log(`Hand tracking: ${handTrackingSupported ? 'Supported' : 'Not supported'}`);
            }
            
            // Setup VR button
            this.createVRButton();
            
            // Initialize physics bodies for hands
            this.initializeHandPhysics();
            
            // Load calibration data
            this.loadCalibration();
        } else {
            console.warn('VR/AR not supported on this device');
        }
        
        this.isActive = true;
    }
    
    /**
     * Start VR session
     */
    async startVRSession() {
        try {
            const sessionInit = {
                requiredFeatures: ['local-floor'],
                optionalFeatures: ['hand-tracking', 'bounded-floor', 'unbounded']
            };
            
            this.xrSession = await navigator.xr.requestSession('immersive-vr', sessionInit);
            
            // Setup session event handlers
            this.xrSession.addEventListener('end', () => this.onSessionEnd());
            this.xrSession.addEventListener('inputsourceschange', (event) => this.onInputSourcesChange(event));
            this.xrSession.addEventListener('select', (event) => this.onSelect(event));
            this.xrSession.addEventListener('squeeze', (event) => this.onSqueeze(event));
            
            // Create reference space
            this.xrReferenceSpace = await this.xrSession.requestReferenceSpace('local-floor');
            
            // Setup render loop
            this.xrSession.requestAnimationFrame((time, frame) => this.onXRFrame(time, frame));
            
            // Initialize controllers
            this.initializeControllers();
            
            // Start calibration if needed
            if (this.calibration.required && !this.calibration.completed) {
                this.startCalibration();
            }
            
            console.log('🥽 VR session started');
            
        } catch (error) {
            console.error('Failed to start VR session:', error);
        }
    }
    
    /**
     * Initialize hand physics bodies
     */
    initializeHandPhysics() {
        if (!this.gameEngine?.physics) return;
        
        // Create physics bodies for each hand
        ['left', 'right'].forEach(handedness => {
            const hand = this.handTracking.hands[handedness];
            
            // Create main hand collider
            hand.physicsBody = this.gameEngine.physics.createBody({
                type: 'kinematic',
                shape: 'sphere',
                radius: 0.08,
                mass: 0,
                collisionGroup: this.physicsInteraction.collisionGroups.hands,
                collisionMask: 0xFFFF
            });
            
            // Create finger tip colliders
            ['index-finger-tip', 'middle-finger-tip', 'thumb-tip'].forEach(jointName => {
                const fingertip = this.gameEngine.physics.createBody({
                    type: 'kinematic',
                    shape: 'sphere',
                    radius: 0.015,
                    mass: 0,
                    collisionGroup: this.physicsInteraction.collisionGroups.hands,
                    collisionMask: 0xFFFF
                });
                
                hand.joints.set(jointName, { physicsBody: fingertip });
            });
        });
        
        console.log('🤚 Hand physics initialized');
    }
    
    /**
     * Initialize controllers
     */
    initializeControllers() {
        if (!this.xrSession) return;
        
        for (const inputSource of this.xrSession.inputSources) {
            this.setupInputSource(inputSource);
        }
    }
    
    /**
     * Setup input source (controller or hand)
     */
    setupInputSource(inputSource) {
        const handedness = inputSource.handedness;
        if (handedness === 'none') return;
        
        const hand = this.handTracking.hands[handedness];
        
        if (inputSource.hand) {
            // Hand tracking
            hand.hand = inputSource.hand;
            hand.controller = null;
            
            console.log(`✋ Hand tracking enabled for ${handedness} hand`);
        } else if (inputSource.gamepad) {
            // Controller
            hand.controller = inputSource;
            hand.hand = null;
            
            // Setup haptic actuator
            if (inputSource.gamepad.hapticActuators?.length > 0) {
                this.haptics.actuators[handedness] = inputSource.gamepad.hapticActuators[0];
            }
            
            console.log(`🎮 Controller enabled for ${handedness} hand`);
        }
        
        // Get grip and target ray spaces
        if (inputSource.gripSpace) {
            hand.gripSpace = inputSource.gripSpace;
        }
        
        if (inputSource.targetRaySpace) {
            hand.targetRaySpace = inputSource.targetRaySpace;
        }
    }
    
    /**
     * VR render loop
     */
    onXRFrame(time, frame) {
        if (!this.xrSession) return;
        
        this.xrFrame = frame;
        const referenceSpace = this.xrReferenceSpace;
        
        // Update telemetry
        this.updateTelemetry(time);
        
        // Process each hand
        ['left', 'right'].forEach(handedness => {
            const hand = this.handTracking.hands[handedness];
            
            if (hand.hand) {
                // Update hand tracking
                this.updateHandTracking(hand, frame, referenceSpace);
                
                // Detect gestures
                this.detectGestures(hand, handedness);
                
            } else if (hand.controller) {
                // Update controller
                this.updateController(hand, frame, referenceSpace);
            }
            
            // Update physics interactions
            this.updatePhysicsInteractions(hand, handedness);
        });
        
        // Update baseball-specific interactions
        this.updateBaseballInteractions();
        
        // Check room boundaries
        if (this.roomScale.enabled) {
            this.checkRoomBoundaries(frame, referenceSpace);
        }
        
        // Schedule next frame
        this.xrSession.requestAnimationFrame((t, f) => this.onXRFrame(t, f));
    }
    
    /**
     * Update hand tracking data
     */
    updateHandTracking(hand, frame, referenceSpace) {
        if (!hand.hand) return;
        
        const previousPose = hand.pose;
        
        // Get wrist pose
        for (const jointSpace of hand.hand.values()) {
            const jointPose = frame.getJointPose(jointSpace, referenceSpace);
            
            if (jointPose) {
                const jointName = jointSpace.jointName;
                
                // Store joint data
                if (!hand.joints.has(jointName)) {
                    hand.joints.set(jointName, {});
                }
                
                const joint = hand.joints.get(jointName);
                joint.pose = jointPose;
                joint.position = {
                    x: jointPose.transform.position.x,
                    y: jointPose.transform.position.y,
                    z: jointPose.transform.position.z
                };
                joint.orientation = jointPose.transform.orientation;
                joint.radius = jointPose.radius;
                
                // Update physics body position for key joints
                if (joint.physicsBody) {
                    joint.physicsBody.position.set(
                        joint.position.x,
                        joint.position.y,
                        joint.position.z
                    );
                }
                
                // Track wrist as main hand position
                if (jointName === 'wrist') {
                    hand.pose = jointPose;
                    
                    // Calculate velocity
                    if (previousPose) {
                        const dt = 0.016; // Assume 60fps
                        hand.velocity = {
                            x: (jointPose.transform.position.x - previousPose.transform.position.x) / dt,
                            y: (jointPose.transform.position.y - previousPose.transform.position.y) / dt,
                            z: (jointPose.transform.position.z - previousPose.transform.position.z) / dt
                        };
                        
                        // Calculate angular velocity (simplified)
                        const q1 = previousPose.transform.orientation;
                        const q2 = jointPose.transform.orientation;
                        const dq = this.quaternionDifference(q1, q2);
                        hand.angularVelocity = {
                            x: dq.x / dt,
                            y: dq.y / dt,
                            z: dq.z / dt
                        };
                    }
                }
            }
        }
        
        // Calculate grip and pinch strength
        this.calculateHandPoses(hand);
    }
    
    /**
     * Update controller data
     */
    updateController(hand, frame, referenceSpace) {
        if (!hand.controller) return;
        
        // Get controller pose
        if (hand.gripSpace) {
            const gripPose = frame.getPose(hand.gripSpace, referenceSpace);
            if (gripPose) {
                hand.pose = gripPose;
                
                // Update physics body
                if (hand.physicsBody) {
                    hand.physicsBody.position.set(
                        gripPose.transform.position.x,
                        gripPose.transform.position.y,
                        gripPose.transform.position.z
                    );
                }
            }
        }
        
        // Get gamepad state
        const gamepad = hand.controller.gamepad;
        if (gamepad) {
            // Trigger (select)
            if (gamepad.buttons[0]) {
                hand.gripStrength = gamepad.buttons[0].value;
                hand.isGripping = gamepad.buttons[0].pressed;
            }
            
            // Grip button (squeeze)
            if (gamepad.buttons[1]) {
                hand.pinchStrength = gamepad.buttons[1].value;
            }
            
            // Thumbstick for movement (if available)
            if (gamepad.axes.length >= 2) {
                hand.thumbstick = {
                    x: gamepad.axes[0],
                    y: gamepad.axes[1]
                };
            }
        }
    }
    
    /**
     * Calculate hand poses (grip, pinch, etc.)
     */
    calculateHandPoses(hand) {
        const joints = hand.joints;
        
        // Calculate grip strength (distance between thumb and fingers)
        const thumbTip = joints.get('thumb-tip');
        const indexTip = joints.get('index-finger-tip');
        const middleTip = joints.get('middle-finger-tip');
        
        if (thumbTip?.position && indexTip?.position && middleTip?.position) {
            const thumbToIndex = this.calculateDistance(thumbTip.position, indexTip.position);
            const thumbToMiddle = this.calculateDistance(thumbTip.position, middleTip.position);
            
            // Grip strength based on finger closure
            hand.gripStrength = 1.0 - Math.min(1.0, (thumbToIndex + thumbToMiddle) / 0.2);
            hand.isGripping = hand.gripStrength > this.physicsInteraction.minGripStrength;
            
            // Pinch strength (thumb to index)
            hand.pinchStrength = 1.0 - Math.min(1.0, thumbToIndex / 0.1);
        }
    }
    
    /**
     * Detect hand gestures
     */
    detectGestures(hand, handedness) {
        const joints = hand.joints;
        const gestures = this.gestureRecognition.gestures;
        
        // Reset gesture states
        Object.keys(gestures).forEach(gesture => {
            gestures[gesture].detected = false;
            gestures[gesture].confidence = 0;
        });
        
        // Grip gesture
        if (hand.gripStrength > 0.7) {
            gestures.grip.detected = true;
            gestures.grip.confidence = hand.gripStrength;
        }
        
        // Pinch gesture
        if (hand.pinchStrength > 0.7) {
            gestures.pinch.detected = true;
            gestures.pinch.confidence = hand.pinchStrength;
        }
        
        // Point gesture (index extended, others closed)
        const indexExtended = this.isFingerExtended(joints, 'index-finger');
        const middleClosed = !this.isFingerExtended(joints, 'middle-finger');
        const ringClosed = !this.isFingerExtended(joints, 'ring-finger');
        
        if (indexExtended && middleClosed && ringClosed) {
            gestures.point.detected = true;
            gestures.point.confidence = 0.9;
        }
        
        // Fist gesture (all fingers closed)
        const allClosed = !indexExtended && middleClosed && ringClosed && 
                         !this.isFingerExtended(joints, 'pinky-finger');
        
        if (allClosed && hand.gripStrength > 0.8) {
            gestures.fist.detected = true;
            gestures.fist.confidence = hand.gripStrength;
        }
        
        // Open hand (all fingers extended)
        const allOpen = indexExtended && 
                       this.isFingerExtended(joints, 'middle-finger') &&
                       this.isFingerExtended(joints, 'ring-finger') &&
                       this.isFingerExtended(joints, 'pinky-finger');
        
        if (allOpen && hand.gripStrength < 0.2) {
            gestures.open.detected = true;
            gestures.open.confidence = 1.0 - hand.gripStrength;
        }
        
        // Detect throwing motion
        this.detectThrowingMotion(hand, handedness);
        
        // Add to gesture history
        this.gestureRecognition.history.push({
            timestamp: Date.now(),
            handedness,
            gestures: { ...gestures }
        });
        
        // Maintain history size
        if (this.gestureRecognition.history.length > this.gestureRecognition.maxHistoryLength) {
            this.gestureRecognition.history.shift();
        }
    }
    
    /**
     * Check if finger is extended
     */
    isFingerExtended(joints, fingerName) {
        const metacarpal = joints.get(`${fingerName}-metacarpal`);
        const tip = joints.get(`${fingerName}-tip`);
        
        if (!metacarpal?.position || !tip?.position) return false;
        
        const distance = this.calculateDistance(metacarpal.position, tip.position);
        return distance > 0.08; // Threshold for extended finger
    }
    
    /**
     * Detect throwing motion
     */
    detectThrowingMotion(hand, handedness) {
        const velocity = hand.velocity;
        const angularVelocity = hand.angularVelocity;
        
        if (!velocity || !angularVelocity) return;
        
        const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2);
        const spin = Math.sqrt(angularVelocity.x ** 2 + angularVelocity.y ** 2 + angularVelocity.z ** 2);
        
        // Detect throw based on velocity and hand opening
        if (speed > 2.0 && hand.gripStrength < 0.3 && this.baseballInteractions.ball.isHeld) {
            this.gestureRecognition.gestures.throw.detected = true;
            this.gestureRecognition.gestures.throw.velocity = velocity;
            this.gestureRecognition.gestures.throw.spin = {
                x: angularVelocity.x * 100,
                y: angularVelocity.y * 100,
                z: angularVelocity.z * 100
            };
            
            // Trigger ball release
            this.releaseBall(handedness);
        }
    }
    
    /**
     * Update physics interactions
     */
    updatePhysicsInteractions(hand, handedness) {
        if (!hand.pose) return;
        
        const position = hand.pose.transform.position;
        
        // Check for nearby interactable objects
        this.physicsInteraction.interactableObjects.forEach((object, id) => {
            const distance = this.calculateDistance(position, object.position);
            
            if (distance < this.physicsInteraction.grabDistance) {
                // Check for grab
                if (hand.isGripping && !hand.heldObject && object.grabbable) {
                    this.grabObject(hand, object, handedness);
                }
            }
        });
        
        // Update held object position
        if (hand.heldObject) {
            if (!hand.isGripping) {
                // Release object
                this.releaseObject(hand, handedness);
            } else {
                // Move object with hand
                this.moveHeldObject(hand);
            }
        }
    }
    
    /**
     * Grab an object
     */
    grabObject(hand, object, handedness) {
        if (object.mass > this.physicsInteraction.maxGrabMass) return;
        
        hand.heldObject = object;
        object.heldBy = handedness;
        
        // Create physics constraint
        if (this.gameEngine?.physics) {
            const constraint = this.gameEngine.physics.createConstraint(
                hand.physicsBody,
                object.physicsBody,
                {
                    type: 'fixed',
                    maxForce: 1000
                }
            );
            
            this.physicsInteraction.constraints.set(object.id, constraint);
        }
        
        // Haptic feedback
        this.triggerHaptics(handedness, 'uiInteraction');
        
        // Check for baseball-specific grabs
        this.checkBaseballGrab(object, handedness);
        
        console.log(`✊ ${handedness} hand grabbed ${object.type}`);
    }
    
    /**
     * Release held object
     */
    releaseObject(hand, handedness) {
        if (!hand.heldObject) return;
        
        const object = hand.heldObject;
        
        // Apply release velocity
        if (object.physicsBody && hand.velocity) {
            object.physicsBody.velocity = {
                x: hand.velocity.x * this.physicsInteraction.throwMultiplier,
                y: hand.velocity.y * this.physicsInteraction.throwMultiplier,
                z: hand.velocity.z * this.physicsInteraction.throwMultiplier
            };
            
            // Apply spin for balls
            if (object.type === 'baseball' && hand.angularVelocity) {
                object.physicsBody.angularVelocity = {
                    x: hand.angularVelocity.x * 50,
                    y: hand.angularVelocity.y * 50,
                    z: hand.angularVelocity.z * 50
                };
            }
        }
        
        // Remove constraint
        const constraint = this.physicsInteraction.constraints.get(object.id);
        if (constraint) {
            this.gameEngine?.physics?.removeConstraint(constraint);
            this.physicsInteraction.constraints.delete(object.id);
        }
        
        // Clear references
        hand.heldObject = null;
        object.heldBy = null;
        
        // Haptic feedback
        this.triggerHaptics(handedness, 'ballRelease');
        
        console.log(`🤚 ${handedness} hand released ${object.type}`);
    }
    
    /**
     * Move held object with hand
     */
    moveHeldObject(hand) {
        if (!hand.heldObject || !hand.pose) return;
        
        const object = hand.heldObject;
        const position = hand.pose.transform.position;
        const orientation = hand.pose.transform.orientation;
        
        // Update object position and orientation
        if (object.physicsBody) {
            object.physicsBody.position.set(position.x, position.y, position.z);
            object.physicsBody.quaternion.set(
                orientation.x,
                orientation.y,
                orientation.z,
                orientation.w
            );
        }
        
        // Update visual representation
        if (object.mesh) {
            object.mesh.position.set(position.x, position.y, position.z);
            object.mesh.quaternion.set(
                orientation.x,
                orientation.y,
                orientation.z,
                orientation.w
            );
        }
    }
    
    /**
     * Check for baseball-specific grabs
     */
    checkBaseballGrab(object, handedness) {
        const baseball = this.baseballInteractions;
        
        switch (object.type) {
            case 'bat':
                baseball.bat.isHeld = true;
                baseball.bat.holdingHand = handedness;
                baseball.bat.object = object;
                
                // Check grip position
                const gripPosition = this.checkBatGrip(
                    this.handTracking.hands[handedness],
                    object
                );
                
                console.log(`⚾ Grabbed bat at ${gripPosition}`);
                break;
                
            case 'baseball':
                baseball.ball.isHeld = true;
                baseball.ball.holdingHand = handedness;
                baseball.ball.object = object;
                
                // Detect grip type
                baseball.ball.gripType = this.detectPitchGrip(
                    this.handTracking.hands[handedness]
                );
                
                console.log(`⚾ Grabbed ball with ${baseball.ball.gripType} grip`);
                break;
                
            case 'glove':
                baseball.glove.isWorn = true;
                baseball.glove.wornHand = handedness;
                baseball.glove.object = object;
                
                console.log(`🧤 Put on glove on ${handedness} hand`);
                break;
        }
    }
    
    /**
     * Check bat grip position
     */
    checkBatGrip(hand, bat) {
        if (!hand.pose) return 'unknown';
        
        const handPos = hand.pose.transform.position;
        const gripPoints = this.baseballInteractions.bat.gripPoints;
        
        let closestGrip = null;
        let minDistance = Infinity;
        
        gripPoints.forEach((grip, index) => {
            const distance = this.calculateDistance(handPos, grip.position);
            if (distance < minDistance) {
                minDistance = distance;
                closestGrip = index === 0 ? 'bottom' : 'top';
            }
        });
        
        return closestGrip;
    }
    
    /**
     * Detect pitch grip type
     */
    detectPitchGrip(hand) {
        const joints = hand.joints;
        const grips = this.baseballInteractions.pitchingGrips;
        
        let bestMatch = 'fastball';
        let bestScore = 0;
        
        // Compare hand pose to known grips
        Object.entries(grips).forEach(([gripType, gripData]) => {
            let score = 0;
            
            // Check finger positions
            gripData.fingerPositions.forEach(fingerPos => {
                const joint = joints.get(`${fingerPos.finger}-finger-tip`);
                if (joint?.position) {
                    const distance = this.calculateDistance(
                        joint.position,
                        fingerPos.position
                    );
                    score += Math.max(0, 1 - distance / 0.05);
                }
            });
            
            if (score > bestScore) {
                bestScore = score;
                bestMatch = gripType;
            }
        });
        
        return bestMatch;
    }
    
    /**
     * Update baseball-specific interactions
     */
    updateBaseballInteractions() {
        const baseball = this.baseballInteractions;
        
        // Update bat swing
        if (baseball.bat.isHeld) {
            this.updateBatSwing();
        }
        
        // Update ball trajectory
        if (baseball.ball.object && !baseball.ball.isHeld) {
            this.updateBallTrajectory();
        }
        
        // Check for catches
        if (baseball.glove.isWorn) {
            this.checkGloveCatch();
        }
    }
    
    /**
     * Update bat swing physics
     */
    updateBatSwing() {
        const bat = this.baseballInteractions.bat;
        if (!bat.isHeld || !bat.object) return;
        
        const hand = this.handTracking.hands[bat.holdingHand];
        if (!hand.velocity) return;
        
        // Calculate swing velocity
        const velocity = Math.sqrt(
            hand.velocity.x ** 2 + 
            hand.velocity.y ** 2 + 
            hand.velocity.z ** 2
        );
        
        bat.swingVelocity = velocity;
        
        // Check for ball contact
        if (this.baseballInteractions.ball.object) {
            const distance = this.calculateDistance(
                bat.object.position,
                this.baseballInteractions.ball.object.position
            );
            
            if (distance < bat.sweetSpot.radius) {
                this.onBatBallContact(velocity, distance);
            }
        }
    }
    
    /**
     * Handle bat-ball contact
     */
    onBatBallContact(swingVelocity, contactDistance) {
        const sweetSpotFactor = 1.0 - (contactDistance / this.baseballInteractions.bat.sweetSpot.radius);
        const power = swingVelocity * sweetSpotFactor;
        
        // Apply force to ball
        if (this.baseballInteractions.ball.object?.physicsBody) {
            const force = {
                x: power * 50,
                y: power * 30,
                z: power * 10
            };
            
            this.baseballInteractions.ball.object.physicsBody.applyForce(force);
        }
        
        // Haptic feedback
        this.triggerHaptics(this.baseballInteractions.bat.holdingHand, 'batContact');
        
        // Update telemetry
        this.telemetry.sessionStats.hits++;
        
        console.log(`💥 Bat contact! Power: ${power.toFixed(2)}`);
    }
    
    /**
     * Release ball with pitch
     */
    releaseBall(handedness) {
        const ball = this.baseballInteractions.ball;
        if (!ball.isHeld || ball.holdingHand !== handedness) return;
        
        const hand = this.handTracking.hands[handedness];
        
        // Apply pitch-specific spin
        const gripData = this.baseballInteractions.pitchingGrips[ball.gripType];
        if (gripData && ball.object?.physicsBody) {
            ball.object.physicsBody.angularVelocity = gripData.spin;
        }
        
        // Record release velocity
        ball.releaseVelocity = { ...hand.velocity };
        
        // Clear held state
        ball.isHeld = false;
        ball.holdingHand = null;
        
        // Update telemetry
        this.telemetry.sessionStats.throws++;
        
        console.log(`⚾ Released ${ball.gripType} pitch`);
    }
    
    /**
     * Check for glove catch
     */
    checkGloveCatch() {
        const glove = this.baseballInteractions.glove;
        const ball = this.baseballInteractions.ball;
        
        if (!glove.isWorn || !ball.object || ball.isHeld) return;
        
        const hand = this.handTracking.hands[glove.wornHand];
        if (!hand.pose) return;
        
        const glovePos = hand.pose.transform.position;
        const ballPos = ball.object.position;
        
        const distance = this.calculateDistance(glovePos, ballPos);
        
        if (distance < 0.2 && hand.gripStrength > 0.5) {
            // Catch the ball
            ball.isHeld = true;
            ball.holdingHand = glove.wornHand;
            
            // Stop ball momentum
            if (ball.object.physicsBody) {
                ball.object.physicsBody.velocity = { x: 0, y: 0, z: 0 };
                ball.object.physicsBody.angularVelocity = { x: 0, y: 0, z: 0 };
            }
            
            // Haptic feedback
            this.triggerHaptics(glove.wornHand, 'gloveImpact');
            
            // Update stats
            glove.catches++;
            this.telemetry.sessionStats.catches++;
            
            console.log(`🧤 Caught ball! Total catches: ${glove.catches}`);
        }
    }
    
    /**
     * Check room boundaries
     */
    checkRoomBoundaries(frame, referenceSpace) {
        const viewerPose = frame.getViewerPose(referenceSpace);
        if (!viewerPose) return;
        
        const position = viewerPose.transform.position;
        this.roomScale.userPosition = position;
        
        // Check distance to boundaries
        const playArea = this.roomScale.playArea;
        const warning = this.roomScale.safeZone.warning;
        
        const nearBoundary = 
            Math.abs(position.x) > (playArea.width / 2 - warning) ||
            Math.abs(position.z) > (playArea.depth / 2 - warning);
        
        if (nearBoundary) {
            // Show boundary warning
            this.showBoundaryWarning();
            
            // Haptic warning
            this.triggerHaptics('left', 'collision');
            this.triggerHaptics('right', 'collision');
        }
    }
    
    /**
     * Show boundary warning
     */
    showBoundaryWarning() {
        // This would create a visual boundary grid in the VR space
        console.warn('⚠️ Near play area boundary');
    }
    
    /**
     * Trigger haptic feedback
     */
    triggerHaptics(handedness, profileName) {
        if (!this.haptics.enabled) return;
        
        const actuator = this.haptics.actuators[handedness];
        const profile = this.haptics.profiles[profileName];
        
        if (actuator && profile && actuator.playEffect) {
            actuator.playEffect('dual-rumble', {
                startDelay: 0,
                duration: profile.duration,
                weakMagnitude: profile.intensity * 0.5,
                strongMagnitude: profile.intensity
            });
        }
    }
    
    /**
     * Start calibration process
     */
    startCalibration() {
        console.log('🎯 Starting VR calibration...');
        
        // This would guide the user through calibration steps
        // 1. Measure arm length
        // 2. Detect dominant hand
        // 3. Set player height
        // 4. Practice swings for style detection
        
        this.calibration.completed = true;
        this.saveCalibration();
    }
    
    /**
     * Save calibration data
     */
    saveCalibration() {
        localStorage.setItem('vr_calibration', JSON.stringify(this.calibration.data));
        console.log('💾 Calibration saved');
    }
    
    /**
     * Load calibration data
     */
    loadCalibration() {
        const saved = localStorage.getItem('vr_calibration');
        if (saved) {
            this.calibration.data = JSON.parse(saved);
            this.calibration.completed = true;
            console.log('📂 Calibration loaded');
        }
    }
    
    /**
     * Update telemetry
     */
    updateTelemetry(time) {
        // Calculate frame rate
        if (this.lastFrameTime) {
            const delta = time - this.lastFrameTime;
            this.telemetry.frameRate = 1000 / delta;
        }
        this.lastFrameTime = time;
        
        // Track interaction count
        if (this.handTracking.hands.left.isGripping || 
            this.handTracking.hands.right.isGripping) {
            this.telemetry.totalInteractions++;
        }
    }
    
    /**
     * Utility functions
     */
    calculateDistance(pos1, pos2) {
        return Math.sqrt(
            (pos1.x - pos2.x) ** 2 +
            (pos1.y - pos2.y) ** 2 +
            (pos1.z - pos2.z) ** 2
        );
    }
    
    quaternionDifference(q1, q2) {
        // Simplified quaternion difference for angular velocity
        return {
            x: q2.x - q1.x,
            y: q2.y - q1.y,
            z: q2.z - q1.z
        };
    }
    
    /**
     * Input source change handler
     */
    onInputSourcesChange(event) {
        event.added.forEach(inputSource => {
            this.setupInputSource(inputSource);
        });
        
        event.removed.forEach(inputSource => {
            const handedness = inputSource.handedness;
            if (handedness !== 'none') {
                const hand = this.handTracking.hands[handedness];
                hand.controller = null;
                hand.hand = null;
                console.log(`❌ ${handedness} input source removed`);
            }
        });
    }
    
    /**
     * Select event handler (trigger press)
     */
    onSelect(event) {
        const handedness = event.inputSource.handedness;
        console.log(`🎯 Select from ${handedness} hand`);
        
        // Could be used for UI interaction or object selection
    }
    
    /**
     * Squeeze event handler (grip press)
     */
    onSqueeze(event) {
        const handedness = event.inputSource.handedness;
        console.log(`✊ Squeeze from ${handedness} hand`);
        
        // Could trigger special actions
    }
    
    /**
     * End VR session
     */
    onSessionEnd() {
        this.xrSession = null;
        this.xrReferenceSpace = null;
        this.xrFrame = null;
        
        // Save telemetry
        this.saveTelemetry();
        
        console.log('🥽 VR session ended');
    }
    
    /**
     * Save telemetry data
     */
    saveTelemetry() {
        localStorage.setItem('vr_telemetry', JSON.stringify(this.telemetry));
        console.log('📊 Telemetry saved:', this.telemetry.sessionStats);
    }
    
    /**
     * Create VR entry button
     */
    createVRButton() {
        const button = document.createElement('button');
        button.id = 'vr-button';
        button.textContent = '🥽 Enter VR';
        button.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 15px 25px;
            background: linear-gradient(145deg, #00ff88, #00d4ff);
            color: black;
            border: none;
            border-radius: 10px;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            z-index: 10000;
            transition: all 0.3s;
        `;
        
        button.addEventListener('click', () => this.startVRSession());
        
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'scale(1.1)';
            button.style.boxShadow = '0 0 20px rgba(0, 255, 136, 0.5)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1)';
            button.style.boxShadow = 'none';
        });
        
        document.body.appendChild(button);
    }
    
    /**
     * Register interactable object
     */
    registerInteractable(object) {
        this.physicsInteraction.interactableObjects.set(object.id, object);
        console.log(`📦 Registered interactable: ${object.type}`);
    }
    
    /**
     * Get VR status
     */
    getStatus() {
        return {
            supported: this.vrSupported,
            active: this.xrSession !== null,
            handTracking: this.handTracking.enabled,
            roomScale: this.roomScale.enabled,
            calibrated: this.calibration.completed,
            telemetry: this.telemetry
        };
    }
    
    /**
     * Dispose VR system
     */
    dispose() {
        if (this.xrSession) {
            this.xrSession.end();
        }
        
        this.saveTelemetry();
        this.isActive = false;
        
        const button = document.getElementById('vr-button');
        if (button) button.remove();
        
        console.log('🥽 Advanced VR Physics disposed');
    }
}