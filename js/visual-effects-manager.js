/**
 * Visual Effects Manager
 * Handles particle systems, ball trails, and visual feedback
 */

class VisualEffectsManager {
    constructor(scene, options = {}) {
        this.scene = scene;
        this.enabled = options.enabled !== false;
        this.particles = [];
        this.trails = [];
    }

    /**
     * Create ball trail effect
     */
    createBallTrail(ball) {
        if (!this.enabled || !ball) {
            return;
        }

        const trail = {
            positions: [],
            ball: ball,
            maxLength: 15,
            geometry: null,
            material: null,
            line: null,
        };

        trail.material = new THREE.LineBasicMaterial({
            color: 0xFFFFFF,
            transparent: true,
            opacity: 0.6,
            linewidth: 2,
        });

        trail.geometry = new THREE.BufferGeometry();
        trail.line = new THREE.Line(trail.geometry, trail.material);
        this.scene.add(trail.line);

        this.trails.push(trail);
        return trail;
    }

    /**
     * Update ball trail
     */
    updateBallTrail(trail) {
        if (!trail || !trail.ball) {
            return;
        }

        // Add current position
        trail.positions.push(trail.ball.position.clone());

        // Keep only recent positions
        if (trail.positions.length > trail.maxLength) {
            trail.positions.shift();
        }

        // Update geometry
        const points = trail.positions.map(pos => new THREE.Vector3(pos.x, pos.y, pos.z));
        trail.geometry.setFromPoints(points);
    }

    /**
     * Create hit impact effect
     */
    createHitImpact(position, power = 1.0) {
        if (!this.enabled) {
            return;
        }

        const particleCount = Math.floor(20 * power);
        const particles = [];

        for (let i = 0; i < particleCount; i++) {
            const geometry = new THREE.SphereGeometry(0.1, 8, 8);
            const material = new THREE.MeshBasicMaterial({
                color: 0xFFFFFF,
                transparent: true,
                opacity: 1.0,
            });
            const particle = new THREE.Mesh(geometry, material);

            particle.position.copy(position);

            // Random velocity
            particle.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 2 * power,
                Math.random() * 2 * power,
                (Math.random() - 0.5) * 2 * power
            );

            particle.life = 1.0;
            particle.decay = 0.02;

            this.scene.add(particle);
            particles.push(particle);
        }

        this.particles.push(...particles);
    }

    /**
     * Create home run fireworks
     */
    createHomeRunFireworks(position) {
        if (!this.enabled) {
            return;
        }

        const colors = [0xFF6B35, 0xFFD700, 0xFF1493, 0x00FF00, 0x00FFFF];
        const burstCount = 5;

        for (let burst = 0; burst < burstCount; burst++) {
            setTimeout(() => {
                const particleCount = 50;
                const particles = [];
                const color = colors[burst % colors.length];

                for (let i = 0; i < particleCount; i++) {
                    const geometry = new THREE.SphereGeometry(0.15, 8, 8);
                    const material = new THREE.MeshBasicMaterial({
                        color: color,
                        transparent: true,
                        opacity: 1.0,
                    });
                    const particle = new THREE.Mesh(geometry, material);

                    particle.position.set(
                        position.x + (Math.random() - 0.5) * 10,
                        position.y + burst * 5,
                        position.z + (Math.random() - 0.5) * 10
                    );

                    const angle = (Math.PI * 2 * i) / particleCount;
                    const speed = 3 + Math.random() * 2;

                    particle.velocity = new THREE.Vector3(
                        Math.cos(angle) * speed,
                        Math.random() * 3 + 2,
                        Math.sin(angle) * speed
                    );

                    particle.life = 1.0;
                    particle.decay = 0.015;

                    this.scene.add(particle);
                    particles.push(particle);
                }

                this.particles.push(...particles);
            }, burst * 300);
        }
    }

    /**
     * Create dust cloud (for sliding)
     */
    createDustCloud(position) {
        if (!this.enabled) {
            return;
        }

        const particleCount = 15;
        const particles = [];

        for (let i = 0; i < particleCount; i++) {
            const geometry = new THREE.SphereGeometry(0.3, 6, 6);
            const material = new THREE.MeshBasicMaterial({
                color: 0xA0826D,
                transparent: true,
                opacity: 0.6,
            });
            const particle = new THREE.Mesh(geometry, material);

            particle.position.copy(position);
            particle.position.y = 0.5;

            particle.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.5,
                Math.random() * 0.3,
                (Math.random() - 0.5) * 0.5
            );

            particle.life = 1.0;
            particle.decay = 0.03;

            this.scene.add(particle);
            particles.push(particle);
        }

        this.particles.push(...particles);
    }

    /**
     * Update all effects
     */
    update() {
        if (!this.enabled) {
            return;
        }

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];

            if (particle.velocity) {
                particle.position.add(particle.velocity);
                particle.velocity.y -= 0.02; // Gravity
                particle.velocity.multiplyScalar(0.98); // Air resistance
            }

            particle.life -= particle.decay;
            particle.material.opacity = particle.life;

            if (particle.life <= 0) {
                this.scene.remove(particle);
                this.particles.splice(i, 1);
            }
        }

        // Update trails
        this.trails.forEach(trail => {
            this.updateBallTrail(trail);
        });
    }

    /**
     * Remove trail
     */
    removeTrail(trail) {
        if (trail && trail.line) {
            this.scene.remove(trail.line);
            const index = this.trails.indexOf(trail);
            if (index > -1) {
                this.trails.splice(index, 1);
            }
        }
    }

    /**
     * Clear all effects
     */
    clearAll() {
        // Remove all particles
        this.particles.forEach(particle => {
            this.scene.remove(particle);
        });
        this.particles = [];

        // Remove all trails
        this.trails.forEach(trail => {
            if (trail.line) {
                this.scene.remove(trail.line);
            }
        });
        this.trails = [];
    }

    /**
     * Enable effects
     */
    enable() {
        this.enabled = true;
    }

    /**
     * Disable effects
     */
    disable() {
        this.enabled = false;
        this.clearAll();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VisualEffectsManager;
}
