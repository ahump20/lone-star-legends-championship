/**
 * Particle Effects System for Sandlot Superstars
 * Creates visual effects for hits, home runs, special abilities, and game events
 */

class ParticleEffectsSystem {
    constructor(scene) {
        this.scene = scene;
        this.particleSystems = [];
        this.textureCache = {};
        this.setupParticleTextures();
    }

    /**
     * Setup particle textures
     */
    setupParticleTextures() {
        // Create simple circular texture
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');

        // Circle particle
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(16, 16, 16, 0, Math.PI * 2);
        ctx.fill();

        this.textureCache.circle = new THREE.CanvasTexture(canvas);

        // Star particle
        const starCanvas = document.createElement('canvas');
        starCanvas.width = 32;
        starCanvas.height = 32;
        const starCtx = starCanvas.getContext('2d');

        starCtx.fillStyle = '#ffffff';
        starCtx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
            const x = 16 + Math.cos(angle) * 14;
            const y = 16 + Math.sin(angle) * 14;
            if (i === 0) starCtx.moveTo(x, y);
            else starCtx.lineTo(x, y);
        }
        starCtx.closePath();
        starCtx.fill();

        this.textureCache.star = new THREE.CanvasTexture(starCanvas);
    }

    /**
     * Create hit impact effect at bat contact point
     */
    createHitImpact(position, hitPower = 1.0) {
        const particleCount = Math.floor(20 * hitPower);
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];
        const velocities = [];

        for (let i = 0; i < particleCount; i++) {
            // Start at impact point
            positions.push(position.x, position.y, position.z);

            // Random colors (white to yellow)
            const brightness = 0.7 + Math.random() * 0.3;
            colors.push(brightness, brightness, brightness * 0.8);

            // Explosive outward velocities
            velocities.push(
                (Math.random() - 0.5) * 0.5 * hitPower,
                Math.random() * 0.3 * hitPower,
                (Math.random() - 0.5) * 0.5 * hitPower
            );
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.3,
            vertexColors: true,
            transparent: true,
            opacity: 1.0,
            blending: THREE.AdditiveBlending,
            map: this.textureCache.circle
        });

        const particles = new THREE.Points(geometry, material);
        this.scene.add(particles);

        // Animate particles
        this.animateParticles(particles, velocities, 1000);

        return particles;
    }

    /**
     * Create home run celebration effect
     */
    createHomeRunEffect(position) {
        const systems = [];

        // Firework explosion
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const firework = this.createFirework(
                    new THREE.Vector3(
                        position.x + (Math.random() - 0.5) * 10,
                        position.y + 10 + Math.random() * 5,
                        position.z + (Math.random() - 0.5) * 10
                    )
                );
                systems.push(firework);
            }, i * 300);
        }

        // Star burst around the player
        const starBurst = this.createStarBurst(position);
        systems.push(starBurst);

        return systems;
    }

    /**
     * Create firework effect
     */
    createFirework(position) {
        const particleCount = 100;
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];
        const velocities = [];

        // Random firework color
        const baseColor = new THREE.Color();
        baseColor.setHSL(Math.random(), 1.0, 0.6);

        for (let i = 0; i < particleCount; i++) {
            positions.push(position.x, position.y, position.z);

            colors.push(baseColor.r, baseColor.g, baseColor.b);

            // Spherical explosion
            const phi = Math.random() * Math.PI * 2;
            const theta = Math.random() * Math.PI;
            const speed = 0.3 + Math.random() * 0.3;

            velocities.push(
                Math.sin(theta) * Math.cos(phi) * speed,
                Math.sin(theta) * Math.sin(phi) * speed,
                Math.cos(theta) * speed
            );
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.4,
            vertexColors: true,
            transparent: true,
            opacity: 1.0,
            blending: THREE.AdditiveBlending,
            map: this.textureCache.star
        });

        const particles = new THREE.Points(geometry, material);
        this.scene.add(particles);

        this.animateParticles(particles, velocities, 2000, true);

        return particles;
    }

    /**
     * Create star burst effect
     */
    createStarBurst(position) {
        const particleCount = 50;
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];
        const velocities = [];

        for (let i = 0; i < particleCount; i++) {
            positions.push(position.x, position.y + 2, position.z);

            // Gold/yellow colors
            colors.push(1.0, 0.9, 0.2);

            // Outward and upward
            const angle = (i / particleCount) * Math.PI * 2;
            velocities.push(
                Math.cos(angle) * 0.2,
                0.5 + Math.random() * 0.3,
                Math.sin(angle) * 0.2
            );
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.5,
            vertexColors: true,
            transparent: true,
            opacity: 1.0,
            blending: THREE.AdditiveBlending,
            map: this.textureCache.star
        });

        const particles = new THREE.Points(geometry, material);
        this.scene.add(particles);

        this.animateParticles(particles, velocities, 1500);

        return particles;
    }

    /**
     * Create special ability activation effect
     */
    createAbilityEffect(position, abilityType) {
        const effects = {
            'lightning': () => this.createLightningEffect(position),
            'fire': () => this.createFireEffect(position),
            'ice': () => this.createIceEffect(position),
            'speed': () => this.createSpeedTrail(position),
            'power': () => this.createPowerAura(position),
            'default': () => this.createGenericAbilityEffect(position)
        };

        const effectFunc = effects[abilityType] || effects['default'];
        return effectFunc();
    }

    /**
     * Create lightning effect
     */
    createLightningEffect(position) {
        const particleCount = 80;
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];
        const velocities = [];

        for (let i = 0; i < particleCount; i++) {
            positions.push(position.x, position.y + 5, position.z);

            // Electric blue/white
            colors.push(0.5, 0.8 + Math.random() * 0.2, 1.0);

            // Downward bolts
            velocities.push(
                (Math.random() - 0.5) * 0.3,
                -0.5 - Math.random() * 0.5,
                (Math.random() - 0.5) * 0.3
            );
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.4,
            vertexColors: true,
            transparent: true,
            opacity: 1.0,
            blending: THREE.AdditiveBlending
        });

        const particles = new THREE.Points(geometry, material);
        this.scene.add(particles);

        this.animateParticles(particles, velocities, 800);

        return particles;
    }

    /**
     * Create fire effect
     */
    createFireEffect(position) {
        const particleCount = 60;
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];
        const velocities = [];

        for (let i = 0; i < particleCount; i++) {
            positions.push(position.x, position.y, position.z);

            // Fire colors (red to yellow)
            const t = Math.random();
            colors.push(1.0, t * 0.5, 0);

            // Upward and outward
            velocities.push(
                (Math.random() - 0.5) * 0.2,
                0.3 + Math.random() * 0.4,
                (Math.random() - 0.5) * 0.2
            );
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.5,
            vertexColors: true,
            transparent: true,
            opacity: 1.0,
            blending: THREE.AdditiveBlending
        });

        const particles = new THREE.Points(geometry, material);
        this.scene.add(particles);

        this.animateParticles(particles, velocities, 1200);

        return particles;
    }

    /**
     * Create ice effect
     */
    createIceEffect(position) {
        const particleCount = 40;
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];
        const velocities = [];

        for (let i = 0; i < particleCount; i++) {
            positions.push(position.x, position.y + 3, position.z);

            // Ice colors (cyan/white)
            colors.push(0.5 + Math.random() * 0.5, 0.9, 1.0);

            // Gentle falling
            velocities.push(
                (Math.random() - 0.5) * 0.1,
                -0.1 - Math.random() * 0.2,
                (Math.random() - 0.5) * 0.1
            );
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.3,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });

        const particles = new THREE.Points(geometry, material);
        this.scene.add(particles);

        this.animateParticles(particles, velocities, 1500);

        return particles;
    }

    /**
     * Create speed trail effect
     */
    createSpeedTrail(position) {
        const particleCount = 30;
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];
        const velocities = [];

        for (let i = 0; i < particleCount; i++) {
            positions.push(position.x, position.y + 1, position.z);

            // Yellow/white speed lines
            colors.push(1.0, 1.0, 0.5);

            // Backward trail
            velocities.push(
                0,
                0,
                0.3 + Math.random() * 0.2
            );
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.6,
            vertexColors: true,
            transparent: true,
            opacity: 1.0,
            blending: THREE.AdditiveBlending
        });

        const particles = new THREE.Points(geometry, material);
        this.scene.add(particles);

        this.animateParticles(particles, velocities, 600);

        return particles;
    }

    /**
     * Create power aura effect
     */
    createPowerAura(position) {
        const particleCount = 50;
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];
        const velocities = [];

        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const radius = 2;

            positions.push(
                position.x + Math.cos(angle) * radius,
                position.y + 1,
                position.z + Math.sin(angle) * radius
            );

            // Orange/red power colors
            colors.push(1.0, 0.4, 0.1);

            // Circular motion
            velocities.push(
                Math.cos(angle) * 0.1,
                Math.sin(i * 0.5) * 0.1,
                Math.sin(angle) * 0.1
            );
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.4,
            vertexColors: true,
            transparent: true,
            opacity: 1.0,
            blending: THREE.AdditiveBlending
        });

        const particles = new THREE.Points(geometry, material);
        this.scene.add(particles);

        this.animateParticles(particles, velocities, 1000);

        return particles;
    }

    /**
     * Create generic ability effect
     */
    createGenericAbilityEffect(position) {
        const particleCount = 40;
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];
        const velocities = [];

        const color = new THREE.Color();
        color.setHSL(Math.random(), 0.8, 0.6);

        for (let i = 0; i < particleCount; i++) {
            positions.push(position.x, position.y + 1, position.z);

            colors.push(color.r, color.g, color.b);

            // Spiral upward
            const angle = (i / particleCount) * Math.PI * 4;
            velocities.push(
                Math.cos(angle) * 0.2,
                0.4,
                Math.sin(angle) * 0.2
            );
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.4,
            vertexColors: true,
            transparent: true,
            opacity: 1.0,
            blending: THREE.AdditiveBlending
        });

        const particles = new THREE.Points(geometry, material);
        this.scene.add(particles);

        this.animateParticles(particles, velocities, 1200);

        return particles;
    }

    /**
     * Animate particle system
     */
    animateParticles(particles, velocities, duration, gravity = false) {
        const startTime = Date.now();
        const positions = particles.geometry.attributes.position.array;
        const particleCount = positions.length / 3;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;

            if (progress >= 1.0) {
                this.scene.remove(particles);
                particles.geometry.dispose();
                particles.material.dispose();
                return;
            }

            // Update positions
            for (let i = 0; i < particleCount; i++) {
                const i3 = i * 3;

                positions[i3] += velocities[i3];
                positions[i3 + 1] += velocities[i3 + 1];
                positions[i3 + 2] += velocities[i3 + 2];

                // Apply gravity if enabled
                if (gravity) {
                    velocities[i3 + 1] -= 0.01;
                }
            }

            particles.geometry.attributes.position.needsUpdate = true;

            // Fade out
            particles.material.opacity = 1.0 - progress;

            requestAnimationFrame(animate);
        };

        animate();
    }

    /**
     * Create dust cloud effect (for sliding)
     */
    createDustCloud(position) {
        const particleCount = 30;
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];
        const velocities = [];

        for (let i = 0; i < particleCount; i++) {
            positions.push(position.x, position.y + 0.2, position.z);

            // Brown/tan dust
            const brightness = 0.4 + Math.random() * 0.2;
            colors.push(brightness, brightness * 0.8, brightness * 0.6);

            velocities.push(
                (Math.random() - 0.5) * 0.3,
                0.1 + Math.random() * 0.2,
                (Math.random() - 0.5) * 0.3
            );
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.5,
            vertexColors: true,
            transparent: true,
            opacity: 0.6,
            blending: THREE.NormalBlending
        });

        const particles = new THREE.Points(geometry, material);
        this.scene.add(particles);

        this.animateParticles(particles, velocities, 800);

        return particles;
    }

    /**
     * Clean up all particles
     */
    cleanup() {
        this.particleSystems.forEach(system => {
            if (system && system.parent) {
                this.scene.remove(system);
                if (system.geometry) system.geometry.dispose();
                if (system.material) system.material.dispose();
            }
        });
        this.particleSystems = [];
    }
}

// Export for use in game
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ParticleEffectsSystem;
}
