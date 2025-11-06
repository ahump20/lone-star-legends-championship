import { AmbientLight, BoxGeometry, CanvasTexture, CatmullRomCurve3, Color, CylinderGeometry, DirectionalLight, Fog, Group, HemisphereLight, InstancedMesh, LatheGeometry, Matrix4, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, PerspectiveCamera, PointLight, Scene, TorusGeometry, TubeGeometry, Vector2, Vector3, } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { createConcreteMaterial, createGlassMaterial, createGrassTexture, createInfieldTexture, createSeatingMaterial, createSteelMaterial, } from './materials';
const FIELD_RADIUS = 68;
const INFIELD_RADIUS = 27.5;
const BASE_PATH_WIDTH = 1.2;
function createField() {
    const group = new Group();
    const grassMaterial = new MeshStandardMaterial({
        color: '#1f6b3b',
        roughness: 0.5,
        metalness: 0.05,
        map: createGrassTexture(),
    });
    const grass = new Mesh(new CylinderGeometry(FIELD_RADIUS, FIELD_RADIUS, 0.15, 128), grassMaterial);
    grass.receiveShadow = true;
    group.add(grass);
    const infieldMaterial = new MeshStandardMaterial({
        color: '#a46837',
        roughness: 0.8,
        metalness: 0.02,
        map: createInfieldTexture(),
    });
    const infield = new Mesh(new CylinderGeometry(INFIELD_RADIUS, INFIELD_RADIUS, 0.2, 128), infieldMaterial);
    infield.position.y = 0.08;
    infield.receiveShadow = true;
    group.add(infield);
    const homePlate = new Mesh(new BoxGeometry(1.6, 0.2, 1.4), new MeshStandardMaterial({ color: '#fdfdfd', roughness: 0.4 }));
    homePlate.position.set(0, 0.2, INFIELD_RADIUS - 1);
    homePlate.rotation.y = Math.PI / 4;
    group.add(homePlate);
    const baseMaterial = new MeshStandardMaterial({ color: '#f8f6f3', roughness: 0.5 });
    const baseGeometry = new BoxGeometry(1.5, 0.2, 1.5);
    const bases = [
        new Vector3(-18.4, 0.18, 0),
        new Vector3(0, 0.18, -18.4),
        new Vector3(18.4, 0.18, 0),
    ];
    bases.forEach((position) => {
        const base = new Mesh(baseGeometry, baseMaterial.clone());
        base.position.copy(position);
        base.receiveShadow = true;
        base.castShadow = true;
        group.add(base);
    });
    const pitcherMound = new Mesh(new CylinderGeometry(4, 4.8, 0.8, 32, 1), new MeshStandardMaterial({ color: '#c18a55', roughness: 0.75 }));
    pitcherMound.position.set(0, 0.55, -9.5);
    pitcherMound.receiveShadow = true;
    pitcherMound.castShadow = true;
    group.add(pitcherMound);
    const pitcherPlate = new Mesh(new BoxGeometry(1.8, 0.2, 0.5), baseMaterial.clone());
    pitcherPlate.position.set(0, 0.95, -9.5);
    group.add(pitcherPlate);
    const baselineMaterial = new MeshStandardMaterial({ color: '#fdfdfd', roughness: 0.35 });
    const baselineGeometry = new BoxGeometry(BASE_PATH_WIDTH, 0.2, 90);
    const firstBaseLine = new Mesh(baselineGeometry, baselineMaterial);
    firstBaseLine.position.set(BASE_PATH_WIDTH / 2, 0.15, -45);
    firstBaseLine.rotation.y = Math.PI / 4;
    group.add(firstBaseLine);
    const thirdBaseLine = firstBaseLine.clone();
    thirdBaseLine.position.set(-BASE_PATH_WIDTH / 2, 0.15, -45);
    thirdBaseLine.rotation.y = -Math.PI / 4;
    group.add(thirdBaseLine);
    const foulPoleGeometry = new CylinderGeometry(0.3, 0.5, 26, 12);
    const foulPoleMaterial = new MeshStandardMaterial({ color: '#ffca28', emissive: '#ffca28', emissiveIntensity: 0.35 });
    const leftFoulPole = new Mesh(foulPoleGeometry, foulPoleMaterial);
    leftFoulPole.position.set(-FIELD_RADIUS + 1.2, 13, -FIELD_RADIUS + 2.2);
    leftFoulPole.castShadow = true;
    group.add(leftFoulPole);
    const rightFoulPole = leftFoulPole.clone();
    rightFoulPole.position.x = FIELD_RADIUS - 1.2;
    group.add(rightFoulPole);
    const warningTrack = new Mesh(new CylinderGeometry(FIELD_RADIUS - 2, FIELD_RADIUS - 2, 0.12, 128), new MeshStandardMaterial({ color: '#8e5733', roughness: 0.9 }));
    warningTrack.position.y = 0.05;
    group.add(warningTrack);
    const outfieldWall = new Mesh(new CylinderGeometry(FIELD_RADIUS - 1.3, FIELD_RADIUS - 1.3, 4.5, 128, 1, true, Math.PI / 4, Math.PI * 1.5), new MeshStandardMaterial({
        color: '#104d3c',
        roughness: 0.6,
        metalness: 0.1,
    }));
    outfieldWall.position.y = 2.1;
    outfieldWall.receiveShadow = true;
    group.add(outfieldWall);
    return group;
}
function createSeatingBowl() {
    const group = new Group();
    const lowerBowlMaterial = createSeatingMaterial('#b5121b', '#8e0d15');
    const clubBowlMaterial = createSeatingMaterial('#14325c', '#0d223f');
    const upperBowlMaterial = createSeatingMaterial('#b5121b', '#51060d');
    const profilePoints = [
        new Vector2(38, 0),
        new Vector2(41, 6),
        new Vector2(44, 12),
        new Vector2(47, 17),
        new Vector2(51, 20),
        new Vector2(58, 24),
    ];
    const lowerBowlGeometry = new LatheGeometry(profilePoints, 72, Math.PI / 4, Math.PI * 1.5);
    const lowerBowl = new Mesh(lowerBowlGeometry, lowerBowlMaterial);
    lowerBowl.castShadow = true;
    lowerBowl.receiveShadow = true;
    group.add(lowerBowl);
    const midProfile = profilePoints.map((point) => point.clone().add(new Vector2(6, 8)));
    const clubBowlGeometry = new LatheGeometry(midProfile, 72, Math.PI / 4, Math.PI * 1.5);
    const clubBowl = new Mesh(clubBowlGeometry, clubBowlMaterial);
    clubBowl.position.y = 4;
    clubBowl.castShadow = true;
    clubBowl.receiveShadow = true;
    group.add(clubBowl);
    const upperProfile = profilePoints.map((point) => point.clone().add(new Vector2(10, 18)));
    const upperBowlGeometry = new LatheGeometry(upperProfile, 72, Math.PI / 4, Math.PI * 1.5);
    const upperBowl = new Mesh(upperBowlGeometry, upperBowlMaterial);
    upperBowl.position.y = 8;
    upperBowl.castShadow = true;
    upperBowl.receiveShadow = true;
    group.add(upperBowl);
    const concourseMaterial = createConcreteMaterial();
    const concourse = new Mesh(new CylinderGeometry(32, 32, 1.2, 72, 1, true, Math.PI / 4, Math.PI * 1.5), concourseMaterial);
    concourse.position.y = 4.5;
    group.add(concourse);
    const suiteRing = new Mesh(new TorusGeometry(54, 1.6, 24, 128, Math.PI * 1.5), createGlassMaterial('#1a3352', 0.72));
    suiteRing.rotation.x = Math.PI / 2;
    suiteRing.rotation.z = -Math.PI / 4;
    suiteRing.position.y = 24;
    group.add(suiteRing);
    return group;
}
function createDowntownBackdrop() {
    const group = new Group();
    const buildingMaterial = new MeshStandardMaterial({ color: '#6f808f', roughness: 0.8, metalness: 0.1 });
    const windowMaterial = createGlassMaterial('#8bb0d6', 0.65);
    for (let i = 0; i < 10; i += 1) {
        const width = 12 + Math.random() * 16;
        const depth = 8 + Math.random() * 12;
        const height = 60 + Math.random() * 40;
        const building = new Mesh(new BoxGeometry(width, height, depth), buildingMaterial.clone());
        building.position.set(-80 + i * 16 + Math.random() * 4, height / 2, -140 - Math.random() * 20);
        building.castShadow = true;
        building.receiveShadow = true;
        const windowCountY = Math.floor(height / 4);
        const windowCountX = Math.floor(width / 3);
        for (let y = 2; y < windowCountY; y += 2) {
            for (let x = 0; x < windowCountX; x += 1) {
                const window = new Mesh(new BoxGeometry(1.4, 1.4, 0.5), windowMaterial.clone());
                window.position.set(building.position.x - width / 2 + 1.5 + x * 3, building.position.y - height / 2 + 3 + y * 3, building.position.z + depth / 2 + 0.3);
                group.add(window);
            }
        }
        group.add(building);
    }
    return group;
}
function createGatewayArch() {
    const archPath = new CatmullRomCurve3([
        new Vector3(-36, 0, -150),
        new Vector3(-20, 45, -140),
        new Vector3(0, 70, -135),
        new Vector3(20, 45, -140),
        new Vector3(36, 0, -150),
    ]);
    const archGeometry = new TubeGeometry(archPath, 200, 1.2, 16, false);
    const archMaterial = createSteelMaterial();
    const arch = new Mesh(archGeometry, archMaterial);
    arch.castShadow = true;
    arch.receiveShadow = true;
    return arch;
}
function createScoreboard(initialState) {
    const group = new Group();
    const frameMaterial = createSteelMaterial();
    const frame = new Mesh(new BoxGeometry(22, 14, 1.4), frameMaterial);
    frame.position.set(0, 22, -FIELD_RADIUS + 4);
    frame.castShadow = true;
    frame.receiveShadow = true;
    group.add(frame);
    const boardMaterial = new MeshPhysicalMaterial({
        color: '#000000',
        emissive: '#0f172a',
        emissiveIntensity: 0.45,
        roughness: 0.35,
        metalness: 0.75,
    });
    const board = new Mesh(new BoxGeometry(18, 10, 0.4), boardMaterial);
    board.position.set(0, 22, -FIELD_RADIUS + 3.4);
    group.add(board);
    const infoPanelMaterial = new MeshStandardMaterial({ color: '#0e4b8b', emissive: '#145ea8', emissiveIntensity: 0.3 });
    const infoPanel = new Mesh(new BoxGeometry(18, 3.2, 0.3), infoPanelMaterial);
    infoPanel.position.set(0, 16.5, -FIELD_RADIUS + 3.5);
    group.add(infoPanel);
    let canvasTexture = null;
    let canvasContext = null;
    if (typeof document !== 'undefined') {
        const textCanvas = document.createElement('canvas');
        textCanvas.width = 1024;
        textCanvas.height = 512;
        canvasContext = textCanvas.getContext('2d');
        canvasTexture = new CanvasTexture(textCanvas);
        canvasTexture.anisotropy = 8;
        canvasTexture.needsUpdate = true;
    }
    const display = new Mesh(new BoxGeometry(16.5, 8, 0.1), canvasTexture
        ? new MeshStandardMaterial({ map: canvasTexture, emissive: '#0f172a', emissiveIntensity: 0.25 })
        : new MeshStandardMaterial({ color: '#111827' }));
    display.position.set(0, 22, -FIELD_RADIUS + 3.3);
    group.add(display);
    const update = (state) => {
        if (!canvasContext || !canvasTexture) {
            return;
        }
        const { canvas } = canvasContext;
        canvasContext.fillStyle = '#061420';
        canvasContext.fillRect(0, 0, canvas.width, canvas.height);
        canvasContext.font = 'bold 72px "Inter", "Helvetica Neue", sans-serif';
        canvasContext.fillStyle = '#f4f8fb';
        canvasContext.textAlign = 'center';
        canvasContext.fillText(`${state.awayTeam} @ ${state.homeTeam}`, canvas.width / 2, 96);
        canvasContext.font = '48px "Inter", sans-serif';
        canvasContext.fillStyle = '#4ade80';
        canvasContext.fillText(`Pitch: ${state.pitchSpeedMph.toFixed(1)} MPH`, canvas.width / 2, 160);
        canvasContext.fillStyle = '#60a5fa';
        canvasContext.fillText(`Batter: ${state.batter}`, canvas.width / 2, 224);
        canvasContext.fillText(`Pitcher: ${state.pitcher}`, canvas.width / 2, 280);
        canvasContext.font = '40px "Inter", sans-serif';
        canvasContext.fillStyle = '#f97316';
        canvasContext.fillText(`Count ${state.count.balls}-${state.count.strikes}  Outs ${state.count.outs}`, canvas.width / 2, 344);
        canvasContext.fillStyle = '#9ca3af';
        canvasContext.font = '36px "Inter", sans-serif';
        canvasContext.fillText(state.notes ?? 'Busch Stadium II · BlazeSportsIntel Simulation', canvas.width / 2, 408);
        canvasContext.font = '48px "Roboto Mono", monospace';
        canvasContext.fillStyle = '#e2e8f0';
        const innings = Math.max(state.away.innings.length, state.home.innings.length);
        for (let i = 0; i < innings; i += 1) {
            const inningValue = (i + 1).toString();
            const columnX = 128 + i * 72;
            canvasContext.fillText(inningValue, columnX, 460);
            const awayScore = state.away.innings[i] ?? 0;
            const homeScore = state.home.innings[i] ?? 0;
            canvasContext.fillStyle = '#60a5fa';
            canvasContext.fillText(awayScore.toString(), columnX, 512 - 96);
            canvasContext.fillStyle = '#f87171';
            canvasContext.fillText(homeScore.toString(), columnX, 512 - 32);
        }
        canvasTexture.needsUpdate = true;
    };
    update(initialState);
    return { group, update };
}
function createLightMasts() {
    const group = new Group();
    const poleMaterial = createSteelMaterial();
    const lightMaterial = new MeshStandardMaterial({
        color: '#f5f8ff',
        emissive: '#dbeafe',
        emissiveIntensity: 1.6,
    });
    const mastPositions = [
        new Vector3(-48, 0, -24),
        new Vector3(48, 0, -24),
        new Vector3(-58, 0, 18),
        new Vector3(58, 0, 18),
    ];
    mastPositions.forEach((position) => {
        const pole = new Mesh(new CylinderGeometry(1.4, 1.6, 34, 16), poleMaterial.clone());
        pole.position.copy(position);
        pole.position.y = 17;
        pole.castShadow = true;
        group.add(pole);
        for (let i = 0; i < 5; i += 1) {
            const lightArray = new Mesh(new BoxGeometry(12, 1.2, 1), poleMaterial.clone());
            lightArray.position.set(position.x, 32 + i * 1.8, position.z);
            lightArray.rotation.y = (Math.PI / 180) * (position.x < 0 ? 14 : -14);
            group.add(lightArray);
            const lights = new Mesh(new BoxGeometry(11, 1, 0.4), lightMaterial.clone());
            lights.position.set(position.x, 32 + i * 1.8, position.z - 0.8);
            lights.rotation.y = (Math.PI / 180) * (position.x < 0 ? 14 : -14);
            group.add(lights);
        }
    });
    return group;
}
function createCrowd(density, palette) {
    const group = new Group();
    const seatGeometry = new BoxGeometry(0.5, 1.2, 0.5);
    const seatMaterial = new MeshStandardMaterial({ color: '#ffffff', roughness: 0.6 });
    const maxInstances = 12000;
    const mesh = new InstancedMesh(seatGeometry, seatMaterial, maxInstances);
    const matrix = new Matrix4();
    const color = new Color();
    const update = (densityValue, paletteValue) => {
        const clampedDensity = Math.min(Math.max(densityValue, 0), 1);
        const count = Math.max(1, Math.floor(maxInstances * clampedDensity));
        mesh.count = count;
        for (let i = 0; i < count; i += 1) {
            const radius = 40 + Math.random() * 20;
            const angle = Math.random() * Math.PI * 1.5 + Math.PI / 4;
            const height = 4 + Math.random() * 20;
            const scale = 0.8 + Math.random() * 0.4;
            matrix.makeScale(scale, scale, scale);
            matrix.setPosition(Math.cos(angle) * radius + (Math.random() - 0.5) * 1.2, height, Math.sin(angle) * radius + (Math.random() - 0.5) * 1.2);
            mesh.setMatrixAt(i, matrix);
            const paletteIndex = Math.floor(Math.random() * paletteValue.length);
            color.set(paletteValue[paletteIndex]);
            mesh.setColorAt(i, color);
        }
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) {
            mesh.instanceColor.needsUpdate = true;
        }
    };
    update(density, palette);
    group.add(mesh);
    return { group, update };
}
function applyAtmosphere(scene, timeOfDay) {
    if (timeOfDay === 'day') {
        scene.background = new Color('#87ceeb');
        scene.fog = new Fog('#87ceeb', 200, 420);
    }
    else if (timeOfDay === 'goldenHour') {
        scene.background = new Color('#f5c88a');
        scene.fog = new Fog('#f5c88a', 180, 360);
    }
    else {
        scene.background = new Color('#0a1020');
        scene.fog = new Fog('#0a1020', 140, 280);
    }
}
export function buildBuschStadiumScene(canvas, options) {
    const scene = new Scene();
    let currentOptions = { ...options };
    applyAtmosphere(scene, currentOptions.timeOfDay);
    const camera = new PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 600);
    camera.position.set(0, 52, 110);
    camera.lookAt(0, 10, 0);
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.maxPolarAngle = Math.PI * 0.48;
    controls.minDistance = 36;
    controls.maxDistance = 240;
    const field = createField();
    scene.add(field);
    const seating = createSeatingBowl();
    scene.add(seating);
    const lightMasts = createLightMasts();
    scene.add(lightMasts);
    if (currentOptions.enableDowntownBackdrop) {
        scene.add(createDowntownBackdrop());
    }
    if (currentOptions.enableArch) {
        scene.add(createGatewayArch());
    }
    const palette = currentOptions.crowd.palette.map((value) => new Color(value).getStyle());
    const crowdInstance = createCrowd(currentOptions.crowd.density, palette);
    scene.add(crowdInstance.group);
    const scoreboardInstance = createScoreboard(currentOptions.scoreboard);
    scene.add(scoreboardInstance.group);
    const ambient = new AmbientLight('#f8fafc', 0.55);
    scene.add(ambient);
    const hemi = new HemisphereLight('#ffffff', '#1f2937', 0.5);
    scene.add(hemi);
    const sun = new DirectionalLight(currentOptions.lighting.color, currentOptions.lighting.intensity);
    const positionSun = (spread) => {
        const clamped = Math.min(Math.max(spread, 0.2), 1.2);
        sun.position.set(-40 * clamped, 90, 30 * clamped);
    };
    positionSun(currentOptions.lighting.spread);
    sun.castShadow = true;
    sun.shadow.mapSize.set(4096, 4096);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 400;
    sun.shadow.camera.left = -160;
    sun.shadow.camera.right = 160;
    sun.shadow.camera.top = 160;
    sun.shadow.camera.bottom = -120;
    scene.add(sun);
    const lightArray = new Group();
    currentOptions.crowd.palette.forEach((color, index) => {
        const point = new PointLight(color, 0.3, 80, 1.6);
        point.position.set(Math.cos(index) * 48, 26 + index * 0.8, Math.sin(index) * 48);
        lightArray.add(point);
    });
    scene.add(lightArray);
    const sky = new Sky();
    sky.scale.setScalar(450);
    const skyUniforms = sky.material.uniforms;
    skyUniforms.turbidity.value = currentOptions.timeOfDay === 'day' ? 2 : 6;
    skyUniforms.rayleigh.value = currentOptions.timeOfDay === 'night' ? 0.5 : 2.5;
    skyUniforms.mieCoefficient.value = 0.01;
    skyUniforms.mieDirectionalG.value = 0.8;
    scene.add(sky);
    const update = (deltaMs) => {
        controls.update();
        if (currentOptions.animateAtmosphere) {
            const time = Date.now() * 0.00005;
            const hueShift = (Math.sin(time) + 1) * 0.5 * 0.06;
            const backgroundSource = scene.background;
            const baseColor = backgroundSource instanceof Color ? backgroundSource.clone() : new Color('#0a1020');
            baseColor.offsetHSL(hueShift, 0, 0);
            scene.background = baseColor;
            scene.fog?.color.copy(baseColor);
        }
        lightArray.children.forEach((light, index) => {
            const offset = index * 0.6;
            light.position.y = 24 + Math.sin(Date.now() * 0.002 + offset) * 1.5;
        });
    };
    const dispose = () => {
        scene.traverse((child) => {
            if (child instanceof Mesh) {
                child.geometry.dispose();
                if (Array.isArray(child.material)) {
                    child.material.forEach((material) => material.dispose());
                }
                else {
                    child.material.dispose();
                }
            }
        });
        controls.dispose();
    };
    const setOptions = (next) => {
        currentOptions = { ...next };
        applyAtmosphere(scene, currentOptions.timeOfDay);
        skyUniforms.turbidity.value = currentOptions.timeOfDay === 'day' ? 2 : 6;
        skyUniforms.rayleigh.value = currentOptions.timeOfDay === 'night' ? 0.5 : 2.5;
        skyUniforms.mieCoefficient.value = 0.01;
        skyUniforms.mieDirectionalG.value = 0.8;
        scoreboardInstance.update(currentOptions.scoreboard);
        const updatedPalette = currentOptions.crowd.palette.map((value) => new Color(value).getStyle());
        crowdInstance.update(currentOptions.crowd.density, updatedPalette);
        sun.intensity = currentOptions.lighting.intensity;
        sun.color = new Color(currentOptions.lighting.color);
        positionSun(currentOptions.lighting.spread);
        lightArray.children.forEach((child, index) => {
            if (child instanceof PointLight) {
                const paletteIndex = index % currentOptions.crowd.palette.length;
                child.color = new Color(currentOptions.crowd.palette[paletteIndex]);
            }
        });
    };
    return { scene, camera, controls, hooks: { update, dispose, setOptions } };
}
//# sourceMappingURL=buschStadiumScene.js.map