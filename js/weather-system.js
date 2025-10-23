/**
 * Weather System
 * Dynamic weather conditions that affect gameplay
 */

class WeatherSystem {
    constructor(options = {}) {
        this.currentWeather = null;
        this.enabled = options.enabled !== false;
        this.changeInterval = options.changeInterval || 300000; // 5 minutes
        this.changeTimer = null;
        this.listeners = [];

        // Weather types with gameplay effects
        this.weatherTypes = {
            sunny: {
                id: 'sunny',
                name: 'Sunny',
                description: 'Perfect baseball weather',
                icon: '☀️',
                probability: 0.4,
                effects: {
                    visibility: 1.0,
                    windSpeed: 0.3,
                    ballFriction: 1.0,
                    catchDifficulty: 1.0,
                    pitchAccuracy: 1.0
                },
                visual: {
                    brightness: 1.2,
                    fogDensity: 0,
                    skyColor: '#87CEEB'
                }
            },
            partlyCloudy: {
                id: 'partlyCloudy',
                name: 'Partly Cloudy',
                description: 'Some clouds in the sky',
                icon: '⛅',
                probability: 0.25,
                effects: {
                    visibility: 0.95,
                    windSpeed: 0.5,
                    ballFriction: 1.0,
                    catchDifficulty: 1.05,
                    pitchAccuracy: 0.98
                },
                visual: {
                    brightness: 1.0,
                    fogDensity: 0.1,
                    skyColor: '#B0C4DE'
                }
            },
            cloudy: {
                id: 'cloudy',
                name: 'Cloudy',
                description: 'Overcast skies',
                icon: '☁️',
                probability: 0.15,
                effects: {
                    visibility: 0.85,
                    windSpeed: 0.7,
                    ballFriction: 1.0,
                    catchDifficulty: 1.1,
                    pitchAccuracy: 0.95
                },
                visual: {
                    brightness: 0.8,
                    fogDensity: 0.2,
                    skyColor: '#778899'
                }
            },
            windy: {
                id: 'windy',
                name: 'Windy',
                description: 'Strong winds affect ball flight',
                icon: '💨',
                probability: 0.1,
                effects: {
                    visibility: 0.9,
                    windSpeed: 2.5,
                    ballFriction: 0.85,
                    catchDifficulty: 1.3,
                    pitchAccuracy: 0.8
                },
                visual: {
                    brightness: 1.0,
                    fogDensity: 0.1,
                    skyColor: '#87CEEB',
                    particleIntensity: 1.5
                }
            },
            rainy: {
                id: 'rainy',
                name: 'Rainy',
                description: 'Rain makes everything harder',
                icon: '🌧️',
                probability: 0.08,
                effects: {
                    visibility: 0.7,
                    windSpeed: 1.0,
                    ballFriction: 1.2,
                    catchDifficulty: 1.5,
                    pitchAccuracy: 0.7,
                    slipChance: 0.05
                },
                visual: {
                    brightness: 0.6,
                    fogDensity: 0.4,
                    skyColor: '#696969',
                    rain: true
                }
            },
            foggy: {
                id: 'foggy',
                name: 'Foggy',
                description: 'Limited visibility',
                icon: '🌫️',
                probability: 0.02,
                effects: {
                    visibility: 0.5,
                    windSpeed: 0.2,
                    ballFriction: 1.0,
                    catchDifficulty: 1.8,
                    pitchAccuracy: 0.75
                },
                visual: {
                    brightness: 0.7,
                    fogDensity: 0.8,
                    skyColor: '#D3D3D3'
                }
            }
        };

        // Wind patterns
        this.wind = {
            speed: 0,
            direction: 0, // 0-360 degrees (0 = blowing to right, 180 = blowing to left)
            gusts: []
        };

        if (this.enabled) {
            this.init();
        }
    }

    init() {
        // Set initial weather
        this.setRandomWeather();

        // Start weather change timer
        if (this.changeInterval > 0) {
            this.startWeatherChangeTimer();
        }

        console.log('✅ Weather system initialized');
    }

    /**
     * Set random weather based on probability
     */
    setRandomWeather() {
        const rand = Math.random();
        let cumulative = 0;

        for (const weather of Object.values(this.weatherTypes)) {
            cumulative += weather.probability;
            if (rand <= cumulative) {
                this.setWeather(weather.id);
                return;
            }
        }

        // Fallback to sunny
        this.setWeather('sunny');
    }

    /**
     * Set specific weather
     */
    setWeather(weatherId) {
        const weather = this.weatherTypes[weatherId];

        if (!weather) {
            console.error('Invalid weather type:', weatherId);
            return;
        }

        this.currentWeather = weather;

        // Update wind
        this.updateWind();

        // Notify listeners
        this.notifyListeners('weatherChanged', weather);

        console.log(`Weather changed to: ${weather.name}`);
    }

    /**
     * Update wind conditions
     */
    updateWind() {
        const weather = this.currentWeather;

        // Base wind speed from weather
        this.wind.speed = weather.effects.windSpeed;

        // Random wind direction
        this.wind.direction = Math.random() * 360;

        // Generate wind gusts (random stronger winds)
        this.wind.gusts = [];
        if (weather.id === 'windy' || weather.id === 'rainy') {
            const gustCount = 3 + Math.floor(Math.random() * 3);
            for (let i = 0; i < gustCount; i++) {
                this.wind.gusts.push({
                    time: Math.random() * 300, // Random time within 5 minutes
                    strength: 1.5 + Math.random() * 1.5,
                    duration: 5 + Math.random() * 10
                });
            }
        }
    }

    /**
     * Get current wind effect on ball
     */
    getWindEffect(ballPosition) {
        if (!this.currentWeather) return { x: 0, y: 0, z: 0 };

        const windRad = (this.wind.direction * Math.PI) / 180;
        const windForce = this.wind.speed * 0.01;

        return {
            x: Math.cos(windRad) * windForce,
            y: 0,
            z: Math.sin(windRad) * windForce
        };
    }

    /**
     * Apply weather effects to ball physics
     */
    applyWeatherToBall(ball) {
        if (!this.currentWeather || !this.enabled) return;

        const effects = this.currentWeather.effects;

        // Apply wind force
        const windEffect = this.getWindEffect(ball.position);
        ball.velocity.x += windEffect.x;
        ball.velocity.z += windEffect.z;

        // Apply friction (rain makes ball heavier)
        ball.velocity.multiplyScalar(effects.ballFriction);
    }

    /**
     * Get catch difficulty modifier
     */
    getCatchDifficulty() {
        if (!this.currentWeather || !this.enabled) return 1.0;
        return this.currentWeather.effects.catchDifficulty;
    }

    /**
     * Get pitch accuracy modifier
     */
    getPitchAccuracyModifier() {
        if (!this.currentWeather || !this.enabled) return 1.0;
        return this.currentWeather.effects.pitchAccuracy;
    }

    /**
     * Get visibility modifier
     */
    getVisibility() {
        if (!this.currentWeather || !this.enabled) return 1.0;
        return this.currentWeather.effects.visibility;
    }

    /**
     * Check if player slips (rain only)
     */
    checkSlip() {
        if (!this.currentWeather || !this.enabled) return false;

        const slipChance = this.currentWeather.effects.slipChance || 0;
        return Math.random() < slipChance;
    }

    /**
     * Get wind direction for display
     */
    getWindDirectionText() {
        const dir = this.wind.direction;

        if (dir >= 337.5 || dir < 22.5) return 'East →';
        if (dir >= 22.5 && dir < 67.5) return 'Northeast ↗';
        if (dir >= 67.5 && dir < 112.5) return 'North ↑';
        if (dir >= 112.5 && dir < 157.5) return 'Northwest ↖';
        if (dir >= 157.5 && dir < 202.5) return 'West ←';
        if (dir >= 202.5 && dir < 247.5) return 'Southwest ↙';
        if (dir >= 247.5 && dir < 292.5) return 'South ↓';
        return 'Southeast ↘';
    }

    /**
     * Get wind speed text
     */
    getWindSpeedText() {
        const speed = this.wind.speed;

        if (speed < 0.5) return 'Calm';
        if (speed < 1.0) return 'Light';
        if (speed < 1.5) return 'Moderate';
        if (speed < 2.5) return 'Strong';
        return 'Very Strong';
    }

    /**
     * Get weather report
     */
    getWeatherReport() {
        if (!this.currentWeather) return null;

        return {
            weather: this.currentWeather.name,
            icon: this.currentWeather.icon,
            description: this.currentWeather.description,
            wind: {
                speed: this.getWindSpeedText(),
                direction: this.getWindDirectionText()
            },
            effects: {
                visibility: `${Math.round(this.currentWeather.effects.visibility * 100)}%`,
                catchDifficulty: this.getCatchDifficulty() === 1.0 ? 'Normal' :
                               this.getCatchDifficulty() > 1.2 ? 'Hard' : 'Slightly Harder',
                pitchAccuracy: this.getPitchAccuracyModifier() === 1.0 ? 'Normal' :
                              this.getPitchAccuracyModifier() < 0.85 ? 'Difficult' : 'Slightly Reduced'
            },
            gameplay: this.getGameplayImpact()
        };
    }

    /**
     * Get gameplay impact description
     */
    getGameplayImpact() {
        if (!this.currentWeather) return [];

        const impacts = [];
        const effects = this.currentWeather.effects;

        if (effects.windSpeed > 1.5) {
            impacts.push('Strong winds will affect ball trajectory');
        }

        if (effects.visibility < 0.8) {
            impacts.push('Reduced visibility makes tracking the ball harder');
        }

        if (effects.catchDifficulty > 1.3) {
            impacts.push('Catching is more difficult');
        }

        if (effects.pitchAccuracy < 0.85) {
            impacts.push('Pitching accuracy is reduced');
        }

        if (effects.slipChance) {
            impacts.push('Players may slip on wet grass');
        }

        if (impacts.length === 0) {
            impacts.push('Perfect conditions for baseball');
        }

        return impacts;
    }

    /**
     * Start automatic weather changes
     */
    startWeatherChangeTimer() {
        this.changeTimer = setInterval(() => {
            // 20% chance to change weather
            if (Math.random() < 0.2) {
                this.setRandomWeather();
            }
        }, this.changeInterval);
    }

    /**
     * Stop automatic weather changes
     */
    stopWeatherChangeTimer() {
        if (this.changeTimer) {
            clearInterval(this.changeTimer);
            this.changeTimer = null;
        }
    }

    /**
     * Enable weather system
     */
    enable() {
        this.enabled = true;
        this.setRandomWeather();
    }

    /**
     * Disable weather system
     */
    disable() {
        this.enabled = false;
        this.setWeather('sunny'); // Revert to sunny
    }

    /**
     * Get visual effects for renderer
     */
    getVisualEffects() {
        if (!this.currentWeather) return null;

        return {
            ...this.currentWeather.visual,
            wind: {
                speed: this.wind.speed,
                direction: this.wind.direction
            }
        };
    }

    /**
     * Update (called each frame)
     */
    update(deltaTime) {
        if (!this.enabled || !this.currentWeather) return;

        // Check for wind gusts
        const currentTime = Date.now();
        this.wind.gusts.forEach(gust => {
            // Apply gust if in time window
            if (currentTime >= gust.time && currentTime <= gust.time + gust.duration * 1000) {
                this.wind.speed = this.currentWeather.effects.windSpeed * gust.strength;
            }
        });
    }

    /**
     * Register event listener
     */
    on(event, callback) {
        this.listeners.push({ event, callback });
    }

    /**
     * Unregister event listener
     */
    off(event, callback) {
        this.listeners = this.listeners.filter(
            l => l.event !== event || l.callback !== callback
        );
    }

    /**
     * Notify listeners
     */
    notifyListeners(event, data) {
        this.listeners
            .filter(l => l.event === event || l.event === '*')
            .forEach(l => {
                try {
                    l.callback(event, data);
                } catch (error) {
                    console.error('Weather system listener error:', error);
                }
            });
    }

    /**
     * Save weather state
     */
    saveState() {
        return {
            currentWeather: this.currentWeather?.id,
            wind: this.wind,
            enabled: this.enabled
        };
    }

    /**
     * Load weather state
     */
    loadState(state) {
        if (state.currentWeather) {
            this.setWeather(state.currentWeather);
        }
        if (state.wind) {
            this.wind = state.wind;
        }
        if (state.enabled !== undefined) {
            this.enabled = state.enabled;
        }
    }

    /**
     * Cleanup
     */
    destroy() {
        this.stopWeatherChangeTimer();
        this.listeners = [];
    }
}

/**
 * Weather Renderer (Visual effects)
 * Handles visual representation of weather
 */
class WeatherRenderer {
    constructor(scene, camera, options = {}) {
        this.scene = scene;
        this.camera = camera;
        this.enabled = options.enabled !== false;

        this.rain = null;
        this.fog = null;
        this.particles = [];
    }

    /**
     * Apply visual effects from weather
     */
    applyEffects(weatherEffects) {
        if (!this.enabled || !weatherEffects) return;

        // Update fog
        this.updateFog(weatherEffects.fogDensity);

        // Update rain
        if (weatherEffects.rain) {
            this.createRain();
        } else {
            this.removeRain();
        }

        // Update ambient light (brightness)
        this.updateBrightness(weatherEffects.brightness);

        // Update sky color
        if (this.scene.background) {
            this.scene.background.setStyle(weatherEffects.skyColor);
        }
    }

    /**
     * Update fog density
     */
    updateFog(density) {
        if (density > 0) {
            if (!this.scene.fog) {
                this.scene.fog = new THREE.Fog(0xcccccc, 10, 100);
            }
            this.scene.fog.density = density;
            this.scene.fog.near = 10;
            this.scene.fog.far = 100 / density;
        } else {
            this.scene.fog = null;
        }
    }

    /**
     * Create rain particles
     */
    createRain() {
        if (this.rain) return;

        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const rainCount = 1000;

        for (let i = 0; i < rainCount; i++) {
            vertices.push(
                Math.random() * 200 - 100,
                Math.random() * 100,
                Math.random() * 200 - 100
            );
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

        const material = new THREE.PointsMaterial({
            color: 0xaaaaaa,
            size: 0.2,
            transparent: true,
            opacity: 0.6
        });

        this.rain = new THREE.Points(geometry, material);
        this.scene.add(this.rain);
    }

    /**
     * Remove rain
     */
    removeRain() {
        if (this.rain) {
            this.scene.remove(this.rain);
            this.rain = null;
        }
    }

    /**
     * Update rain animation
     */
    updateRain(deltaTime) {
        if (!this.rain) return;

        const positions = this.rain.geometry.attributes.position.array;

        for (let i = 1; i < positions.length; i += 3) {
            positions[i] -= 50 * deltaTime; // Fall speed

            // Reset raindrop when it reaches ground
            if (positions[i] < 0) {
                positions[i] = 100;
            }
        }

        this.rain.geometry.attributes.position.needsUpdate = true;
    }

    /**
     * Update scene brightness
     */
    updateBrightness(brightness) {
        // Update ambient light intensity
        this.scene.traverse((object) => {
            if (object.isAmbientLight) {
                object.intensity = brightness;
            }
        });
    }

    /**
     * Update (called each frame)
     */
    update(deltaTime) {
        if (!this.enabled) return;

        this.updateRain(deltaTime);
    }

    /**
     * Cleanup
     */
    destroy() {
        this.removeRain();
        this.scene.fog = null;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WeatherSystem, WeatherRenderer };
}
