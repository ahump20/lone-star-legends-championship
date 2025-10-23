/**
 * Character Renderer - Creates unique 3D models for each character
 */

class CharacterRenderer {
    constructor(scene) {
        this.scene = scene;
        this.textureCache = {};
    }

    /**
     * Create a 3D player model with unique characteristics
     */
    createCharacterModel(player, position) {
        const group = new THREE.Group();

        // Body colors based on skin tone
        const skinColors = {
            'fair': 0xFFDBD0,
            'light': 0xF1C9A5,
            'medium': 0xC68642,
            'tan': 0xB08855,
            'brown': 0x8D5524,
            'dark': 0x6B4423
        };

        const skinColor = skinColors[player.appearance.skinTone] || 0xFFDBD0;

        // Create body (jersey)
        const bodyGeometry = new THREE.CapsuleGeometry(0.3, 0.8, 8, 16);
        const teamColorHex = parseInt(player.teamColor.replace('#', '0x'));
        const bodyMaterial = new THREE.MeshPhongMaterial({
            color: teamColorHex,
            flatShading: false
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.9;
        body.castShadow = true;
        group.add(body);

        // Create head
        const headGeometry = new THREE.SphereGeometry(0.25, 16, 16);
        const headMaterial = new THREE.MeshPhongMaterial({
            color: skinColor,
            flatShading: false
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.6;
        head.castShadow = true;
        group.add(head);

        // Create cap based on hair style
        this.addCapToHead(group, player, teamColorHex);

        // Add hair based on style
        this.addHairStyle(group, player);

        // Create legs
        const legGeometry = new THREE.CapsuleGeometry(0.12, 0.6, 8, 16);
        const legMaterial = new THREE.MeshPhongMaterial({
            color: 0xF5F5F5 // White pants
        });

        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.15, 0.3, 0);
        leftLeg.castShadow = true;
        group.add(leftLeg);

        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.15, 0.3, 0);
        rightLeg.castShadow = true;
        group.add(rightLeg);

        // Add jersey number on back
        this.addJerseyNumber(body, player.number);

        // Add accessories
        this.addAccessories(group, player);

        // Add position-specific equipment
        if (position === 'C') {
            this.addCatcherGear(group);
        } else if (position !== 'P') {
            this.addGlove(group, player.appearance.skinTone);
        }

        // Add bat for batters (will be shown/hidden)
        const bat = this.createBat();
        bat.visible = false;
        bat.name = 'bat';
        bat.position.set(0.3, 1.0, 0);
        bat.rotation.z = -Math.PI / 4;
        group.add(bat);

        // Store player reference
        group.userData.player = player;
        group.userData.characterId = player.characterId;

        return group;
    }

    /**
     * Add cap to character head
     */
    addCapToHead(group, player, teamColor) {
        // Cap bill
        const billGeometry = new THREE.BoxGeometry(0.4, 0.05, 0.3);
        const capMaterial = new THREE.MeshPhongMaterial({ color: teamColor });
        const bill = new THREE.Mesh(billGeometry, capMaterial);
        bill.position.set(0, 1.75, 0.2);
        bill.castShadow = true;
        group.add(bill);

        // Cap top
        const capGeometry = new THREE.SphereGeometry(0.22, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const cap = new THREE.Mesh(capGeometry, capMaterial);
        cap.position.y = 1.75;
        cap.castShadow = true;
        group.add(cap);
    }

    /**
     * Add hair based on character's hair style
     */
    addHairStyle(group, player) {
        const hairColors = {
            'black': 0x1A1A1A,
            'brown': 0x4A3728,
            'dark_brown': 0x2C1B18,
            'blonde': 0xE6C485,
            'dirty_blonde': 0xC9B47D,
            'red': 0xA65E4E
        };

        const hairColor = hairColors[player.appearance.hairColor] || 0x1A1A1A;
        const hairMaterial = new THREE.MeshPhongMaterial({ color: hairColor });

        switch (player.appearance.hairStyle) {
            case 'short_spiky':
                // Small spikes
                for (let i = 0; i < 8; i++) {
                    const spike = new THREE.Mesh(
                        new THREE.ConeGeometry(0.03, 0.1, 4),
                        hairMaterial
                    );
                    const angle = (i / 8) * Math.PI * 2;
                    spike.position.set(
                        Math.cos(angle) * 0.2,
                        1.82,
                        Math.sin(angle) * 0.2
                    );
                    spike.rotation.z = angle;
                    group.add(spike);
                }
                break;

            case 'long_ponytail':
                // Ponytail in back
                const ponytail = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.05, 0.03, 0.4, 8),
                    hairMaterial
                );
                ponytail.position.set(0, 1.5, -0.25);
                ponytail.rotation.x = Math.PI / 6;
                group.add(ponytail);
                break;

            case 'afro':
                // Large sphere
                const afro = new THREE.Mesh(
                    new THREE.SphereGeometry(0.35, 16, 16),
                    hairMaterial
                );
                afro.position.y = 1.7;
                group.add(afro);
                break;

            case 'mohawk':
                // Central ridge
                for (let i = 0; i < 5; i++) {
                    const spike = new THREE.Mesh(
                        new THREE.BoxGeometry(0.08, 0.15, 0.08),
                        hairMaterial
                    );
                    spike.position.set(0, 1.8, -0.15 + i * 0.08);
                    group.add(spike);
                }
                break;

            case 'braids':
                // Multiple thin cylinders
                for (let i = 0; i < 6; i++) {
                    const braid = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.02, 0.02, 0.3, 6),
                        hairMaterial
                    );
                    const angle = (i / 6) * Math.PI * 2;
                    braid.position.set(
                        Math.cos(angle) * 0.15,
                        1.5,
                        Math.sin(angle) * 0.15
                    );
                    group.add(braid);
                }
                break;

            case 'high_ponytail':
                const highPonytail = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.06, 0.04, 0.35, 8),
                    hairMaterial
                );
                highPonytail.position.set(0, 1.8, -0.2);
                group.add(highPonytail);
                break;

            // Add more hair styles as needed
            default:
                // Short hair
                const hair = new THREE.Mesh(
                    new THREE.SphereGeometry(0.24, 16, 16),
                    hairMaterial
                );
                hair.position.y = 1.7;
                group.add(hair);
        }
    }

    /**
     * Add accessories to character
     */
    addAccessories(group, player) {
        if (!player.appearance.accessories) return;

        player.appearance.accessories.forEach(accessory => {
            switch (accessory) {
                case 'glasses':
                    this.addGlasses(group);
                    break;
                case 'headband':
                    this.addHeadband(group, player.teamColor);
                    break;
                case 'wristbands':
                    this.addWristbands(group, player.teamColor);
                    break;
                case 'sunglasses':
                    this.addSunglasses(group);
                    break;
                case 'chain_necklace':
                    this.addNecklace(group);
                    break;
                // Add more accessories as needed
            }
        });
    }

    /**
     * Add glasses
     */
    addGlasses(group) {
        const glassGeometry = new THREE.TorusGeometry(0.08, 0.01, 8, 16);
        const glassMaterial = new THREE.MeshPhongMaterial({
            color: 0x333333,
            transparent: true,
            opacity: 0.3
        });

        const leftGlass = new THREE.Mesh(glassGeometry, glassMaterial);
        leftGlass.position.set(-0.1, 1.6, 0.2);
        leftGlass.rotation.y = Math.PI / 2;
        group.add(leftGlass);

        const rightGlass = new THREE.Mesh(glassGeometry, glassMaterial);
        rightGlass.position.set(0.1, 1.6, 0.2);
        rightGlass.rotation.y = Math.PI / 2;
        group.add(rightGlass);
    }

    /**
     * Add headband
     */
    addHeadband(group, teamColor) {
        const headbandGeometry = new THREE.TorusGeometry(0.24, 0.02, 8, 32);
        const headbandMaterial = new THREE.MeshPhongMaterial({
            color: parseInt(teamColor.replace('#', '0x'))
        });
        const headband = new THREE.Mesh(headbandGeometry, headbandMaterial);
        headband.position.y = 1.65;
        headband.rotation.x = Math.PI / 2;
        group.add(headband);
    }

    /**
     * Add wristbands
     */
    addWristbands(group, teamColor) {
        const wristbandGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.08, 12);
        const wristbandMaterial = new THREE.MeshPhongMaterial({
            color: parseInt(teamColor.replace('#', '0x'))
        });

        const leftWristband = new THREE.Mesh(wristbandGeometry, wristbandMaterial);
        leftWristband.position.set(-0.35, 1.0, 0);
        leftWristband.rotation.z = Math.PI / 2;
        group.add(leftWristband);

        const rightWristband = new THREE.Mesh(wristbandGeometry, wristbandMaterial);
        rightWristband.position.set(0.35, 1.0, 0);
        rightWristband.rotation.z = Math.PI / 2;
        group.add(rightWristband);
    }

    /**
     * Add sunglasses
     */
    addSunglasses(group) {
        const lensGeometry = new THREE.BoxGeometry(0.15, 0.08, 0.02);
        const lensMaterial = new THREE.MeshPhongMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.7
        });

        const leftLens = new THREE.Mesh(lensGeometry, lensMaterial);
        leftLens.position.set(-0.1, 1.6, 0.22);
        group.add(leftLens);

        const rightLens = new THREE.Mesh(lensGeometry, lensMaterial);
        rightLens.position.set(0.1, 1.6, 0.22);
        group.add(rightLens);
    }

    /**
     * Add necklace
     */
    addNecklace(group) {
        const necklaceGeometry = new THREE.TorusGeometry(0.15, 0.01, 8, 32);
        const necklaceMaterial = new THREE.MeshPhongMaterial({
            color: 0xFFD700,
            metalness: 0.8
        });
        const necklace = new THREE.Mesh(necklaceGeometry, necklaceMaterial);
        necklace.position.y = 1.35;
        necklace.rotation.x = Math.PI / 2;
        group.add(necklace);
    }

    /**
     * Add glove for fielders
     */
    addGlove(group, skinTone) {
        const gloveGeometry = new THREE.SphereGeometry(0.15, 12, 12);
        const gloveMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
        const glove = new THREE.Mesh(gloveGeometry, gloveMaterial);
        glove.scale.set(1, 0.7, 1.3);
        glove.position.set(-0.35, 1.0, 0.1);
        glove.name = 'glove';
        group.add(glove);
    }

    /**
     * Add catcher gear
     */
    addCatcherGear(group) {
        // Chest protector
        const chestGeometry = new THREE.BoxGeometry(0.5, 0.6, 0.15);
        const gearMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
        const chest = new THREE.Mesh(chestGeometry, gearMaterial);
        chest.position.set(0, 1.0, 0.1);
        group.add(chest);

        // Mask (in front of face)
        const maskGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.05);
        const maskMaterial = new THREE.MeshPhongMaterial({
            color: 0x555555,
            transparent: true,
            opacity: 0.5
        });
        const mask = new THREE.Mesh(maskGeometry, maskMaterial);
        mask.position.set(0, 1.6, 0.3);
        group.add(mask);
    }

    /**
     * Create bat
     */
    createBat() {
        const batGroup = new THREE.Group();

        // Bat barrel
        const barrelGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.6, 12);
        const batMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
        const barrel = new THREE.Mesh(barrelGeometry, batMaterial);
        barrel.position.y = 0.3;
        batGroup.add(barrel);

        // Bat handle
        const handleGeometry = new THREE.CylinderGeometry(0.025, 0.025, 0.3, 12);
        const handle = new THREE.Mesh(handleGeometry, batMaterial);
        handle.position.y = -0.15;
        batGroup.add(handle);

        // Bat knob
        const knobGeometry = new THREE.SphereGeometry(0.03, 12, 12);
        const knob = new THREE.Mesh(knobGeometry, batMaterial);
        knob.position.y = -0.3;
        batGroup.add(knob);

        return batGroup;
    }

    /**
     * Add jersey number to player's back
     */
    addJerseyNumber(body, number) {
        // Create canvas for number texture
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        // Draw number
        ctx.fillStyle = 'white';
        ctx.font = 'bold 80px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(number.toString(), 64, 64);

        // Create texture
        const texture = new THREE.CanvasTexture(canvas);

        // Create plane for number
        const numberGeometry = new THREE.PlaneGeometry(0.3, 0.3);
        const numberMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true
        });
        const numberMesh = new THREE.Mesh(numberGeometry, numberMaterial);
        numberMesh.position.set(0, 0.2, -0.31);
        body.add(numberMesh);
    }

    /**
     * Update character animation
     */
    updateCharacterAnimation(characterGroup, animationType, deltaTime) {
        if (!characterGroup) return;

        const time = Date.now() * 0.001;

        switch (animationType) {
            case 'idle':
                // Gentle breathing
                characterGroup.position.y = Math.sin(time * 2) * 0.02;
                break;

            case 'batting':
                // Bat swing animation
                const bat = characterGroup.getObjectByName('bat');
                if (bat) {
                    bat.visible = true;
                    bat.rotation.z = -Math.PI / 4 + Math.sin(time * 10) * Math.PI / 2;
                }
                break;

            case 'running':
                // Running in place
                characterGroup.rotation.z = Math.sin(time * 8) * 0.1;
                break;

            case 'fielding':
                // Ready stance
                characterGroup.position.y = Math.abs(Math.sin(time * 3)) * 0.05;
                break;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CharacterRenderer;
}
