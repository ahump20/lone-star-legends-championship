class StreamingIntegration {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.isStreaming = false;
        this.streamConfig = {
            platform: 'twitch', // twitch, youtube, facebook, discord
            quality: '1080p60',
            bitrate: 6000,
            encoder: 'hardware', // hardware, software
            overlays: true,
            chat: true,
            donations: true,
            alerts: true
        };
        
        this.streamData = {
            viewerCount: 0,
            followers: 0,
            subscribers: 0,
            chatMessages: [],
            donations: [],
            highlights: [],
            streamUptime: 0
        };
        
        this.overlayElements = new Map();
        this.chatIntegration = null;
        this.donationSystem = null;
        this.highlightCapture = null;
        
        this.setupStreamingCapabilities();
    }

    setupStreamingCapabilities() {
        this.initializeWebRTC();
        this.setupChatIntegration();
        this.setupDonationSystem();
        this.setupHighlightCapture();
        this.createStreamingUI();
        this.setupStreamingEvents();
    }

    initializeWebRTC() {
        this.webrtc = {
            stream: null,
            recorder: null,
            chunks: [],
            constraints: {
                video: {
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    frameRate: { ideal: 60 },
                    facingMode: 'user'
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 44100,
                    channelCount: 2
                }
            },
            options: {
                mimeType: 'video/webm;codecs=vp9,opus',
                videoBitsPerSecond: this.streamConfig.bitrate * 1000,
                audioBitsPerSecond: 128000
            }
        };

        this.setupScreenCapture();
    }

    async setupScreenCapture() {
        try {
            // Setup display media for screen sharing
            this.displayStream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    frameRate: { ideal: 60 }
                },
                audio: true
            });

            // Setup user media for webcam
            this.userStream = await navigator.mediaDevices.getUserMedia(this.webrtc.constraints);
            
            console.log('Screen capture setup complete');
        } catch (error) {
            console.warn('Screen capture setup failed:', error);
            this.fallbackToCanvas();
        }
    }

    fallbackToCanvas() {
        // Create canvas stream as fallback
        const canvas = document.createElement('canvas');
        canvas.width = 1920;
        canvas.height = 1080;
        const ctx = canvas.getContext('2d');
        
        // Capture game canvas
        const gameCanvas = document.querySelector('canvas');
        if (gameCanvas) {
            setInterval(() => {
                ctx.drawImage(gameCanvas, 0, 0, canvas.width, canvas.height);
            }, 1000 / 60); // 60fps
            
            this.displayStream = canvas.captureStream(60);
        }
    }

    setupChatIntegration() {
        this.chatIntegration = {
            connected: false,
            platform: this.streamConfig.platform,
            chatSocket: null,
            moderators: new Set(),
            bannedUsers: new Set(),
            chatFilters: ['spam', 'toxicity', 'caps'],
            
            connect: async (platform) => {
                switch (platform) {
                    case 'twitch':
                        return this.connectTwitchChat();
                    case 'youtube':
                        return this.connectYouTubeChat();
                    case 'discord':
                        return this.connectDiscordChat();
                    default:
                        return this.setupMockChat();
                }
            },
            
            sendMessage: (message) => {
                this.broadcastChatMessage('Streamer', message, 'streamer');
            },
            
            handleCommand: (command, args, user) => {
                this.processChatCommand(command, args, user);
            },
            
            moderateMessage: (message) => {
                return this.applyContentFilters(message);
            }
        };
    }

    setupMockChat() {
        // Mock chat for testing
        this.chatIntegration.connected = true;
        
        // Simulate chat messages
        const mockMessages = [
            'Great game!', 'Nice play!', 'How did you do that?',
            'gg wp', 'This is amazing', '!stats', '!highlights',
            'Can you show that again?', 'What\'s your strategy?'
        ];
        
        setInterval(() => {
            if (this.isStreaming) {
                const message = mockMessages[Math.floor(Math.random() * mockMessages.length)];
                const user = `Viewer${Math.floor(Math.random() * 1000)}`;
                this.handleChatMessage(user, message, 'viewer');
            }
        }, 5000 + Math.random() * 10000);
        
        return Promise.resolve();
    }

    setupDonationSystem() {
        this.donationSystem = {
            platforms: ['streamlabs', 'streamelements', 'paypal', 'patreon'],
            totalDonations: 0,
            donationGoal: 1000,
            recentDonations: [],
            
            processDonation: (amount, donor, message) => {
                const donation = {
                    id: Date.now(),
                    amount: amount,
                    donor: donor,
                    message: message || '',
                    timestamp: new Date(),
                    highlighted: amount >= 10
                };
                
                this.streamData.donations.push(donation);
                this.donationSystem.totalDonations += amount;
                this.showDonationAlert(donation);
                
                return donation;
            },
            
            setGoal: (amount) => {
                this.donationSystem.donationGoal = amount;
                this.updateDonationGoalOverlay();
            },
            
            getProgress: () => {
                return (this.donationSystem.totalDonations / this.donationSystem.donationGoal) * 100;
            }
        };
        
        // Simulate donations for testing
        this.simulateDonations();
    }

    setupHighlightCapture() {
        this.highlightCapture = {
            enabled: true,
            autoCapture: {
                onKill: true,
                onDeath: true,
                onWin: true,
                onSpecialPlay: true
            },
            highlightDuration: 30, // seconds
            maxHighlights: 50,
            
            captureHighlight: (event, duration = 30) => {
                if (!this.isStreaming || !this.highlightCapture.enabled) return;
                
                const highlight = {
                    id: Date.now(),
                    event: event,
                    timestamp: new Date(),
                    duration: duration,
                    viewers: this.streamData.viewerCount,
                    quality: this.streamConfig.quality
                };
                
                this.streamData.highlights.push(highlight);
                
                // Keep only recent highlights
                if (this.streamData.highlights.length > this.highlightCapture.maxHighlights) {
                    this.streamData.highlights.shift();
                }
                
                this.showHighlightNotification(highlight);
                return highlight;
            },
            
            exportHighlights: () => {
                return this.streamData.highlights.map(h => ({
                    title: `LSL ${h.event} - ${h.timestamp.toLocaleString()}`,
                    duration: h.duration,
                    viewers: h.viewers,
                    url: `#highlight-${h.id}`
                }));
            }
        };
        
        // Hook into game events
        this.setupGameEventListeners();
    }

    setupGameEventListeners() {
        if (this.gameEngine) {
            // Listen for highlight-worthy events
            this.gameEngine.addEventListener('homerun', () => {
                this.highlightCapture.captureHighlight('Home Run', 45);
            });
            
            this.gameEngine.addEventListener('strikeout', () => {
                this.highlightCapture.captureHighlight('Strikeout', 30);
            });
            
            this.gameEngine.addEventListener('catch', (event) => {
                if (event.difficulty === 'amazing') {
                    this.highlightCapture.captureHighlight('Amazing Catch', 25);
                }
            });
            
            this.gameEngine.addEventListener('gameWin', () => {
                this.highlightCapture.captureHighlight('Game Win', 60);
            });
        }
    }

    createStreamingUI() {
        const streamingUI = `
            <div id="streaming-control-panel" class="streaming-panel" style="display: none;">
                <div class="stream-header">
                    <h2>Streaming Controls</h2>
                    <button id="toggle-streaming" class="stream-button primary">Start Stream</button>
                </div>
                
                <div class="stream-config">
                    <div class="config-section">
                        <h3>Stream Settings</h3>
                        <select id="stream-platform">
                            <option value="twitch">Twitch</option>
                            <option value="youtube">YouTube</option>
                            <option value="facebook">Facebook Gaming</option>
                            <option value="discord">Discord</option>
                        </select>
                        
                        <select id="stream-quality">
                            <option value="720p30">720p 30fps</option>
                            <option value="720p60">720p 60fps</option>
                            <option value="1080p30">1080p 30fps</option>
                            <option value="1080p60" selected>1080p 60fps</option>
                        </select>
                        
                        <input type="range" id="bitrate-slider" min="1000" max="10000" value="6000">
                        <label>Bitrate: <span id="bitrate-value">6000</span> kbps</label>
                    </div>
                    
                    <div class="config-section">
                        <h3>Features</h3>
                        <label><input type="checkbox" id="enable-overlays" checked> Overlays</label>
                        <label><input type="checkbox" id="enable-chat" checked> Chat Integration</label>
                        <label><input type="checkbox" id="enable-donations" checked> Donations</label>
                        <label><input type="checkbox" id="enable-highlights" checked> Auto Highlights</label>
                    </div>
                </div>
                
                <div class="stream-stats">
                    <div class="stat-item">
                        <span class="stat-label">Viewers:</span>
                        <span id="viewer-count" class="stat-value">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Uptime:</span>
                        <span id="stream-uptime" class="stat-value">00:00:00</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Donations:</span>
                        <span id="donation-total" class="stat-value">$0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Highlights:</span>
                        <span id="highlight-count" class="stat-value">0</span>
                    </div>
                </div>
                
                <div class="stream-actions">
                    <button id="capture-highlight" class="stream-button">Capture Highlight</button>
                    <button id="moderate-chat" class="stream-button">Moderate Chat</button>
                    <button id="export-highlights" class="stream-button">Export Highlights</button>
                    <button id="stream-settings" class="stream-button">Settings</button>
                </div>
            </div>
            
            <!-- Stream Overlays -->
            <div id="stream-overlays" class="overlay-container">
                <div id="viewer-counter" class="stream-overlay top-right">
                    <span class="overlay-label">👥</span>
                    <span id="overlay-viewers">0</span>
                </div>
                
                <div id="donation-goal" class="stream-overlay top-left">
                    <div class="goal-progress">
                        <div class="goal-bar">
                            <div id="goal-fill" class="goal-fill" style="width: 0%"></div>
                        </div>
                        <span class="goal-text">$<span id="goal-current">0</span> / $<span id="goal-target">1000</span></span>
                    </div>
                </div>
                
                <div id="recent-follower" class="stream-overlay bottom-left" style="display: none;">
                    <span class="follower-text">Thanks for following, <span id="follower-name"></span>! ❤️</span>
                </div>
                
                <div id="chat-overlay" class="stream-overlay bottom-right">
                    <div id="chat-messages" class="chat-messages"></div>
                    <div class="chat-input-area">
                        <input type="text" id="streamer-chat-input" placeholder="Type message...">
                        <button id="send-chat-message">Send</button>
                    </div>
                </div>
            </div>
            
            <!-- Donation Alert -->
            <div id="donation-alert" class="alert-overlay" style="display: none;">
                <div class="alert-content">
                    <h2>💰 Donation!</h2>
                    <p class="donor-name"></p>
                    <p class="donation-amount"></p>
                    <p class="donation-message"></p>
                </div>
            </div>
            
            <!-- Highlight Notification -->
            <div id="highlight-notification" class="alert-overlay" style="display: none;">
                <div class="alert-content highlight">
                    <h2>🎬 Highlight Captured!</h2>
                    <p class="highlight-event"></p>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', streamingUI);
        this.addStreamingStyles();
        this.setupStreamingEventListeners();
    }

    addStreamingStyles() {
        const styles = `
            <style>
                .streaming-panel {
                    position: fixed;
                    top: 50px;
                    left: 50px;
                    width: 400px;
                    background: linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 100%);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 15px;
                    padding: 20px;
                    color: white;
                    font-family: Arial, sans-serif;
                    z-index: 9999;
                    max-height: 90vh;
                    overflow-y: auto;
                }
                
                .stream-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    border-bottom: 1px solid rgba(255,255,255,0.2);
                    padding-bottom: 10px;
                }
                
                .stream-button {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 20px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.3s;
                    margin: 5px;
                }
                
                .stream-button.primary {
                    background: linear-gradient(45deg, #FF6B6B, #4ECDC4);
                    color: white;
                }
                
                .stream-button:not(.primary) {
                    background: rgba(255,255,255,0.1);
                    color: white;
                }
                
                .stream-button:hover {
                    transform: translateY(-2px);
                    opacity: 0.9;
                }
                
                .config-section {
                    margin-bottom: 20px;
                }
                
                .config-section h3 {
                    margin: 0 0 10px 0;
                    color: #4ECDC4;
                }
                
                .config-section select,
                .config-section input[type="range"] {
                    width: 100%;
                    margin: 5px 0;
                    padding: 5px;
                    border-radius: 5px;
                    border: 1px solid rgba(255,255,255,0.3);
                    background: rgba(255,255,255,0.1);
                    color: white;
                }
                
                .config-section label {
                    display: block;
                    margin: 8px 0;
                    cursor: pointer;
                }
                
                .stream-stats {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 10px;
                    margin: 20px 0;
                    padding: 15px;
                    background: rgba(255,255,255,0.05);
                    border-radius: 10px;
                }
                
                .stat-item {
                    text-align: center;
                }
                
                .stat-label {
                    display: block;
                    font-size: 12px;
                    opacity: 0.8;
                }
                
                .stat-value {
                    display: block;
                    font-size: 18px;
                    font-weight: bold;
                    color: #4CAF50;
                    margin-top: 5px;
                }
                
                .stream-actions {
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: center;
                    margin-top: 20px;
                }
                
                .overlay-container {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    z-index: 8888;
                }
                
                .stream-overlay {
                    position: absolute;
                    background: rgba(0,0,0,0.8);
                    backdrop-filter: blur(5px);
                    border-radius: 10px;
                    padding: 10px;
                    color: white;
                    font-family: Arial, sans-serif;
                    border: 1px solid rgba(255,255,255,0.2);
                }
                
                .stream-overlay.top-right {
                    top: 20px;
                    right: 20px;
                }
                
                .stream-overlay.top-left {
                    top: 20px;
                    left: 20px;
                }
                
                .stream-overlay.bottom-left {
                    bottom: 120px;
                    left: 20px;
                }
                
                .stream-overlay.bottom-right {
                    bottom: 20px;
                    right: 20px;
                    width: 300px;
                    height: 200px;
                    pointer-events: auto;
                }
                
                .goal-progress {
                    width: 200px;
                }
                
                .goal-bar {
                    width: 100%;
                    height: 20px;
                    background: rgba(255,255,255,0.2);
                    border-radius: 10px;
                    overflow: hidden;
                    margin-bottom: 5px;
                }
                
                .goal-fill {
                    height: 100%;
                    background: linear-gradient(45deg, #4CAF50, #81C784);
                    transition: width 0.3s ease;
                }
                
                .chat-messages {
                    height: 150px;
                    overflow-y: auto;
                    margin-bottom: 10px;
                    font-size: 12px;
                }
                
                .chat-message {
                    margin-bottom: 5px;
                    padding: 2px 5px;
                    border-radius: 3px;
                    background: rgba(255,255,255,0.1);
                }
                
                .chat-input-area {
                    display: flex;
                    gap: 5px;
                }
                
                .chat-input-area input {
                    flex: 1;
                    padding: 5px;
                    border: 1px solid rgba(255,255,255,0.3);
                    border-radius: 3px;
                    background: rgba(255,255,255,0.1);
                    color: white;
                }
                
                .chat-input-area button {
                    padding: 5px 10px;
                    border: none;
                    border-radius: 3px;
                    background: #4ECDC4;
                    color: white;
                    cursor: pointer;
                }
                
                .alert-overlay {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    z-index: 10000;
                    animation: alertPulse 3s ease-in-out;
                }
                
                .alert-content {
                    background: linear-gradient(45deg, #FF6B6B, #4ECDC4);
                    padding: 30px;
                    border-radius: 15px;
                    text-align: center;
                    color: white;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                }
                
                .alert-content.highlight {
                    background: linear-gradient(45deg, #9C27B0, #673AB7);
                }
                
                @keyframes alertPulse {
                    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                    20% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
                    80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    100% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }

    setupStreamingEventListeners() {
        // Toggle streaming
        document.getElementById('toggle-streaming').addEventListener('click', () => {
            this.toggleStreaming();
        });
        
        // Settings updates
        document.getElementById('stream-platform').addEventListener('change', (e) => {
            this.streamConfig.platform = e.target.value;
        });
        
        document.getElementById('stream-quality').addEventListener('change', (e) => {
            this.streamConfig.quality = e.target.value;
        });
        
        document.getElementById('bitrate-slider').addEventListener('input', (e) => {
            this.streamConfig.bitrate = parseInt(e.target.value);
            document.getElementById('bitrate-value').textContent = e.target.value;
        });
        
        // Manual highlight capture
        document.getElementById('capture-highlight').addEventListener('click', () => {
            this.highlightCapture.captureHighlight('Manual Capture', 30);
        });
        
        // Chat input
        document.getElementById('send-chat-message').addEventListener('click', () => {
            const input = document.getElementById('streamer-chat-input');
            if (input.value.trim()) {
                this.chatIntegration.sendMessage(input.value);
                input.value = '';
            }
        });
        
        document.getElementById('streamer-chat-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('send-chat-message').click();
            }
        });
        
        // Export highlights
        document.getElementById('export-highlights').addEventListener('click', () => {
            this.exportHighlights();
        });
    }

    setupStreamingEvents() {
        // Listen for game events that should trigger streaming features
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F9') { // Toggle streaming panel
                this.toggleStreamingPanel();
            }
            if (e.key === 'F10') { // Quick highlight capture
                this.highlightCapture.captureHighlight('Manual Capture', 30);
            }
        });
    }

    async toggleStreaming() {
        if (this.isStreaming) {
            await this.stopStream();
        } else {
            await this.startStream();
        }
    }

    async startStream() {
        try {
            console.log('Starting stream...');
            
            // Setup media streams
            await this.setupScreenCapture();
            
            // Connect to chat
            await this.chatIntegration.connect(this.streamConfig.platform);
            
            // Initialize overlays
            this.showOverlays();
            
            // Start recording/streaming
            if (this.displayStream) {
                this.webrtc.recorder = new MediaRecorder(this.displayStream, this.webrtc.options);
                this.webrtc.recorder.start();
            }
            
            this.isStreaming = true;
            this.streamStartTime = Date.now();
            
            // Update UI
            document.getElementById('toggle-streaming').textContent = 'Stop Stream';
            document.getElementById('toggle-streaming').style.background = 'linear-gradient(45deg, #F44336, #E91E63)';
            
            // Start updating stream stats
            this.startStreamStatsUpdate();
            
            // Simulate viewer activity
            this.simulateViewerActivity();
            
            console.log('Stream started successfully');
            
        } catch (error) {
            console.error('Failed to start stream:', error);
        }
    }

    async stopStream() {
        console.log('Stopping stream...');
        
        this.isStreaming = false;
        
        // Stop recording
        if (this.webrtc.recorder && this.webrtc.recorder.state === 'recording') {
            this.webrtc.recorder.stop();
        }
        
        // Close media streams
        if (this.displayStream) {
            this.displayStream.getTracks().forEach(track => track.stop());
        }
        if (this.userStream) {
            this.userStream.getTracks().forEach(track => track.stop());
        }
        
        // Disconnect chat
        this.chatIntegration.connected = false;
        
        // Hide overlays
        this.hideOverlays();
        
        // Update UI
        document.getElementById('toggle-streaming').textContent = 'Start Stream';
        document.getElementById('toggle-streaming').style.background = 'linear-gradient(45deg, #FF6B6B, #4ECDC4)';
        
        // Stop stats updates
        if (this.statsUpdateInterval) {
            clearInterval(this.statsUpdateInterval);
        }
        if (this.viewerSimulation) {
            clearInterval(this.viewerSimulation);
        }
        
        console.log('Stream stopped');
    }

    showOverlays() {
        document.getElementById('stream-overlays').style.display = 'block';
        this.updateOverlays();
    }

    hideOverlays() {
        document.getElementById('stream-overlays').style.display = 'none';
    }

    updateOverlays() {
        // Update viewer counter
        document.getElementById('overlay-viewers').textContent = this.streamData.viewerCount;
        
        // Update donation goal
        const progress = this.donationSystem.getProgress();
        document.getElementById('goal-fill').style.width = Math.min(100, progress) + '%';
        document.getElementById('goal-current').textContent = this.donationSystem.totalDonations;
        document.getElementById('goal-target').textContent = this.donationSystem.donationGoal;
    }

    startStreamStatsUpdate() {
        this.statsUpdateInterval = setInterval(() => {
            if (!this.isStreaming) return;
            
            // Update uptime
            const uptime = Date.now() - this.streamStartTime;
            const hours = Math.floor(uptime / 3600000);
            const minutes = Math.floor((uptime % 3600000) / 60000);
            const seconds = Math.floor((uptime % 60000) / 1000);
            
            const uptimeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            document.getElementById('stream-uptime').textContent = uptimeString;
            document.getElementById('viewer-count').textContent = this.streamData.viewerCount;
            document.getElementById('donation-total').textContent = '$' + this.donationSystem.totalDonations;
            document.getElementById('highlight-count').textContent = this.streamData.highlights.length;
            
            this.updateOverlays();
            
        }, 1000);
    }

    simulateViewerActivity() {
        // Simulate changing viewer count
        this.viewerSimulation = setInterval(() => {
            if (!this.isStreaming) return;
            
            const baseViewers = 100;
            const variation = Math.floor(Math.random() * 200 - 100);
            this.streamData.viewerCount = Math.max(0, baseViewers + variation);
            
            // Occasionally simulate new followers
            if (Math.random() < 0.1) {
                this.simulateNewFollower();
            }
            
        }, 10000);
    }

    simulateNewFollower() {
        const follower = `Follower${Math.floor(Math.random() * 10000)}`;
        this.streamData.followers++;
        this.showFollowerAlert(follower);
    }

    simulateDonations() {
        setInterval(() => {
            if (this.isStreaming && Math.random() < 0.1) {
                const amounts = [5, 10, 25, 50, 100];
                const amount = amounts[Math.floor(Math.random() * amounts.length)];
                const donor = `Donor${Math.floor(Math.random() * 1000)}`;
                const messages = [
                    'Great stream!', 'Keep it up!', 'Love the gameplay!',
                    'Thanks for the entertainment', 'You\'re awesome!'
                ];
                const message = messages[Math.floor(Math.random() * messages.length)];
                
                this.donationSystem.processDonation(amount, donor, message);
            }
        }, 30000);
    }

    handleChatMessage(username, message, userType = 'viewer') {
        const chatMessage = {
            id: Date.now(),
            username: username,
            message: message,
            userType: userType,
            timestamp: new Date()
        };
        
        // Apply moderation
        if (this.chatIntegration.moderateMessage(message)) {
            this.streamData.chatMessages.push(chatMessage);
            this.displayChatMessage(chatMessage);
            
            // Handle chat commands
            if (message.startsWith('!')) {
                const parts = message.split(' ');
                const command = parts[0].substring(1);
                const args = parts.slice(1);
                this.chatIntegration.handleCommand(command, args, username);
            }
        }
    }

    displayChatMessage(chatMessage) {
        const chatContainer = document.getElementById('chat-messages');
        const messageElement = document.createElement('div');
        messageElement.className = 'chat-message';
        messageElement.innerHTML = `<strong>${chatMessage.username}:</strong> ${chatMessage.message}`;
        
        chatContainer.appendChild(messageElement);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        
        // Keep only recent messages
        while (chatContainer.children.length > 20) {
            chatContainer.removeChild(chatContainer.firstChild);
        }
    }

    broadcastChatMessage(username, message, userType) {
        this.handleChatMessage(username, message, userType);
    }

    processChatCommand(command, args, user) {
        switch (command.toLowerCase()) {
            case 'stats':
                this.sendChatResponse(`Game stats: ${this.streamData.viewerCount} viewers, ${this.streamData.highlights.length} highlights captured`);
                break;
                
            case 'highlights':
                const recent = this.streamData.highlights.slice(-3);
                const highlightList = recent.map(h => h.event).join(', ');
                this.sendChatResponse(`Recent highlights: ${highlightList || 'None yet'}`);
                break;
                
            case 'uptime':
                const uptime = Date.now() - (this.streamStartTime || Date.now());
                const hours = Math.floor(uptime / 3600000);
                const minutes = Math.floor((uptime % 3600000) / 60000);
                this.sendChatResponse(`Stream uptime: ${hours}h ${minutes}m`);
                break;
                
            case 'commands':
                this.sendChatResponse('Available commands: !stats, !highlights, !uptime, !commands');
                break;
                
            default:
                console.log(`Unknown command: ${command}`);
        }
    }

    sendChatResponse(message) {
        this.broadcastChatMessage('Bot', message, 'bot');
    }

    applyContentFilters(message) {
        // Simple content filtering
        const toxicWords = ['spam', 'toxic', 'hate'];
        const lowerMessage = message.toLowerCase();
        
        for (const word of toxicWords) {
            if (lowerMessage.includes(word)) {
                return false; // Message blocked
            }
        }
        
        // Check for excessive caps
        const capsRatio = (message.match(/[A-Z]/g) || []).length / message.length;
        if (capsRatio > 0.7 && message.length > 10) {
            return false; // Too much caps
        }
        
        return true; // Message allowed
    }

    showDonationAlert(donation) {
        const alert = document.getElementById('donation-alert');
        alert.querySelector('.donor-name').textContent = donation.donor;
        alert.querySelector('.donation-amount').textContent = `$${donation.amount}`;
        alert.querySelector('.donation-message').textContent = donation.message;
        
        alert.style.display = 'block';
        setTimeout(() => {
            alert.style.display = 'none';
        }, 5000);
    }

    showFollowerAlert(follower) {
        const alert = document.getElementById('recent-follower');
        alert.querySelector('#follower-name').textContent = follower;
        
        alert.style.display = 'block';
        setTimeout(() => {
            alert.style.display = 'none';
        }, 3000);
    }

    showHighlightNotification(highlight) {
        const notification = document.getElementById('highlight-notification');
        notification.querySelector('.highlight-event').textContent = highlight.event;
        
        notification.style.display = 'block';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }

    exportHighlights() {
        const highlights = this.highlightCapture.exportHighlights();
        const exportData = {
            streamSession: {
                platform: this.streamConfig.platform,
                startTime: this.streamStartTime,
                duration: Date.now() - this.streamStartTime,
                viewers: this.streamData.viewerCount,
                donations: this.donationSystem.totalDonations
            },
            highlights: highlights
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `lsl-highlights-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        
        console.log('Highlights exported:', highlights.length, 'highlights');
    }

    toggleStreamingPanel() {
        const panel = document.getElementById('streaming-control-panel');
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }

    // API integration methods for real platforms
    async connectTwitchChat() {
        // In a real implementation, this would connect to Twitch IRC
        console.log('Connecting to Twitch chat...');
        return this.setupMockChat();
    }

    async connectYouTubeChat() {
        // In a real implementation, this would use YouTube Live Chat API
        console.log('Connecting to YouTube chat...');
        return this.setupMockChat();
    }

    async connectDiscordChat() {
        // In a real implementation, this would connect to Discord bot
        console.log('Connecting to Discord...');
        return this.setupMockChat();
    }

    getStreamingStats() {
        return {
            isStreaming: this.isStreaming,
            platform: this.streamConfig.platform,
            viewers: this.streamData.viewerCount,
            uptime: this.isStreaming ? Date.now() - this.streamStartTime : 0,
            donations: {
                total: this.donationSystem.totalDonations,
                goal: this.donationSystem.donationGoal,
                progress: this.donationSystem.getProgress()
            },
            highlights: this.streamData.highlights.length,
            chatMessages: this.streamData.chatMessages.length
        };
    }

    destroy() {
        if (this.isStreaming) {
            this.stopStream();
        }
        
        // Clean up intervals
        if (this.statsUpdateInterval) clearInterval(this.statsUpdateInterval);
        if (this.viewerSimulation) clearInterval(this.viewerSimulation);
        
        // Remove UI elements
        const panel = document.getElementById('streaming-control-panel');
        if (panel) panel.remove();
        
        const overlays = document.getElementById('stream-overlays');
        if (overlays) overlays.remove();
        
        const alerts = document.querySelectorAll('.alert-overlay');
        alerts.forEach(alert => alert.remove());
    }
}

export default StreamingIntegration;