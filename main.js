import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { PLYLoader } from 'three/addons/loaders/PLYLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// Texture Loader
const textureLoader = new THREE.TextureLoader();

// Load textures from online sources
const textures = {};
const texturePromises = [];

// Helper function to create procedural textures
function createProceduralSnowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Base white
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, 1024, 1024);

    // Add noise and sparkle
    for (let i = 0; i < 8000; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 1024;
        const size = Math.random() * 3;
        const alpha = Math.random() * 0.8 + 0.2;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(10, 10);
    return tex;
}

function createProceduralWoodTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#8b4513');
    gradient.addColorStop(0.5, '#654321');
    gradient.addColorStop(1, '#8b4513');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);

    // Add wood grain
    for (let i = 0; i < 20; i++) {
        ctx.strokeStyle = `rgba(101, 67, 33, ${0.3 + Math.random() * 0.4})`;
        ctx.lineWidth = 2 + Math.random() * 2;
        ctx.beginPath();
        ctx.moveTo(0, i * 25 + Math.random() * 10);
        ctx.bezierCurveTo(
            128 + Math.random() * 50, i * 25,
            256 + Math.random() * 50, i * 25,
            512, i * 25 + Math.random() * 10
        );
        ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    return tex;
}

function createProceduralBrickTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base color
    ctx.fillStyle = '#d2691e';
    ctx.fillRect(0, 0, 512, 512);

    // Draw bricks
    const brickWidth = 64;
    const brickHeight = 32;
    const mortar = 4;

    for (let y = 0; y < 512; y += brickHeight + mortar) {
        const offset = (y / (brickHeight + mortar)) % 2 === 0 ? 0 : brickWidth / 2;
        for (let x = 0; x < 512 + brickWidth; x += brickWidth + mortar) {
            ctx.fillStyle = `rgba(${210 - Math.random() * 30}, ${105 - Math.random() * 20}, ${30 - Math.random() * 10}, 1)`;
            ctx.fillRect(x + offset - brickWidth / 2, y, brickWidth, brickHeight);

            // Add texture
            ctx.fillStyle = `rgba(0, 0, 0, ${0.05 + Math.random() * 0.1})`;
            ctx.fillRect(x + offset - brickWidth / 2, y, brickWidth, brickHeight);
        }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
}

// Try to load textures from online, fallback to procedural
// Wood texture
texturePromises.push(
    textureLoader.loadAsync('https://threejs.org/examples/textures/hardwood2_diffuse.jpg').then(tex => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(2, 2);
        textures.wood = tex;
    }).catch(() => {
        textures.wood = createProceduralWoodTexture();
    })
);

// Brick texture
texturePromises.push(
    textureLoader.loadAsync('https://threejs.org/examples/textures/brick_diffuse.jpg').then(tex => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        textures.brick = tex;
    }).catch(() => {
        textures.brick = createProceduralBrickTexture();
    })
);

// Snow texture - create procedural as primary
textures.snow = createProceduralSnowTexture();

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a1628);
scene.fog = new THREE.Fog(0x0a1628, 50, 400); // Increased fog range

// Camera
const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(0, 20, 50); // Higher starting position
camera.lookAt(0, 0, 0);

// Renderer with realistic settings
const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance"
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Better performance
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById('canvas-container').appendChild(renderer.domElement);

// Post-processing
const renderScene = new RenderPass(scene, camera);

const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = 0.2;
bloomPass.strength = 0.8;
bloomPass.radius = 0.5;

const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);


// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 10;
controls.maxDistance = 200; // Increased max zoom out
controls.maxPolarAngle = Math.PI / 2 - 0.05; // Prevent going below ground
controls.enablePan = true; // Allow panning to explore map

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

// Moon light with better shadows
// Moon light with better shadows
const moonLight = new THREE.DirectionalLight(0xb8d4ff, 0.8);
moonLight.position.set(-100, 300, -100); // Raised significantly
moonLight.castShadow = true;
moonLight.shadow.mapSize.width = 2048; // Reduced from 4096 for performance
moonLight.shadow.mapSize.height = 2048;
moonLight.shadow.camera.near = 0.5;
moonLight.shadow.camera.far = 1000; // Increased far plane
moonLight.shadow.camera.left = -500; // Increased coverage
moonLight.shadow.camera.right = 500;
moonLight.shadow.camera.top = 500;
moonLight.shadow.camera.bottom = -500;
moonLight.shadow.radius = 8;
moonLight.shadow.bias = -0.0001;
scene.add(moonLight);

// Moon Mesh (Visual representation)
const moonGeometry = new THREE.SphereGeometry(20, 32, 32);
const moonMaterial = new THREE.MeshBasicMaterial({ color: 0xffffcc });
const moon = new THREE.Mesh(moonGeometry, moonMaterial);
moon.position.set(-100, 300, -100); // Match light position
scene.add(moon);

// Additional fill light for more realistic lighting
const fillLight = new THREE.DirectionalLight(0xffe5b4, 0.2);
fillLight.position.set(-10, 10, -10);
scene.add(fillLight);

// Christmas lights
const lightColors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff, 0xffffff];
const christmasLights = lightColors;

// Ground with snow - will be created after textures load
let ground;

// Function to create a Christmas tree - improved realistic version
// Global resources object
const resources = {
    geometries: {},
    materials: {}
};

function initResources() {
    // Geometries
    resources.geometries.cone = new THREE.ConeGeometry(1, 1, 8);
    resources.geometries.cylinder = new THREE.CylinderGeometry(1, 1, 1, 8);
    resources.geometries.sphere = new THREE.SphereGeometry(1, 16, 16); // Reduced segments for performance
    resources.geometries.box = new THREE.BoxGeometry(1, 1, 1);

    // Materials
    resources.materials.leaves = new THREE.MeshStandardMaterial({
        color: 0x0f5f13,
        roughness: 0.8,
        metalness: 0.1
    });

    resources.materials.wood = new THREE.MeshStandardMaterial({
        map: textures.wood || null,
        color: textures.wood ? 0xffffff : 0x8b4513,
        roughness: 0.9,
        metalness: 0.1
    });

    resources.materials.star = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        emissive: 0xffd700,
        emissiveIntensity: 0.8,
        roughness: 0.3,
        metalness: 0.7
    });

    resources.materials.starGlow = new THREE.MeshBasicMaterial({
        color: 0xffd700,
        transparent: true,
        opacity: 0.3
    });

    resources.materials.snow = new THREE.MeshStandardMaterial({
        map: textures.snow || null,
        color: 0xffffff,
        roughness: 1.0,
        metalness: 0.0
    });

    resources.materials.black = new THREE.MeshStandardMaterial({ color: 0x000000 });
    resources.materials.orange = new THREE.MeshStandardMaterial({ color: 0xff8c00 });

    resources.materials.metal = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.5,
        metalness: 0.8
    });

    resources.materials.bulb = new THREE.MeshStandardMaterial({
        color: 0xffaa33,
        emissive: 0xffaa33,
        emissiveIntensity: 2,
        toneMapped: false
    });
}

function createChristmasTree(x, z, scale = 1) {
    const treeGroup = new THREE.Group();
    const layerCount = 3;

    // Leaves
    for (let i = 0; i < layerCount; i++) {
        const cone = new THREE.Mesh(resources.geometries.cone, resources.materials.leaves);

        // Scale relative to base size (1,1,1)
        const layerScale = scale * (1.5 - i * 0.3);
        const layerHeight = scale * 1.5;
        cone.scale.set(layerScale, layerHeight, layerScale);

        cone.position.y = (i * 0.8 + 1) * scale;
        cone.castShadow = true;
        cone.receiveShadow = true;

        // Slight variation
        cone.rotation.z = (Math.random() - 0.5) * 0.1;
        cone.rotation.x = (Math.random() - 0.5) * 0.1;

        treeGroup.add(cone);
    }

    // Trunk
    const trunk = new THREE.Mesh(resources.geometries.cylinder, resources.materials.wood);
    const trunkRadius = 0.4 * scale;
    const trunkHeight = layerCount * scale;
    trunk.scale.set(trunkRadius, trunkHeight, trunkRadius);
    trunk.position.y = (layerCount / 2) * scale;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    treeGroup.add(trunk);

    // Star removed as per user request
    /*
    const starHeight = (layerCount * 0.8 + 1 + 1.5 / 2) * scale; // Approx top
    const star = new THREE.Mesh(resources.geometries.cone, resources.materials.star);
    star.scale.set(0.5 * scale, 1.5 * scale, 0.5 * scale);
    star.rotation.z = Math.PI;
    star.position.y = starHeight + 0.5 * scale;
    star.castShadow = true;
    treeGroup.add(star);

    // Star Glow
    const starGlow = new THREE.Mesh(resources.geometries.cone, resources.materials.starGlow);
    starGlow.scale.set(0.7 * scale, 2 * scale, 0.7 * scale);
    starGlow.rotation.z = Math.PI;
    starGlow.position.y = starHeight + 0.5 * scale;
    treeGroup.add(starGlow);
    */

    // Ornaments (Simplified: use shared sphere)
    // Cache ornament materials
    if (!resources.materials.ornaments) {
        resources.materials.ornaments = christmasLights.map(color => new THREE.MeshStandardMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.4,
            metalness: 0.9,
            roughness: 0.1
        }));
    }

    for (let i = 0; i < 10; i++) { // Reduced count for performance
        const mat = resources.materials.ornaments[Math.floor(Math.random() * resources.materials.ornaments.length)];
        const ornament = new THREE.Mesh(resources.geometries.sphere, mat);
        const oScale = 0.12 * scale;
        ornament.scale.set(oScale, oScale, oScale);

        const layer = Math.floor(i / 4);
        const layerY = (1 + layer * 0.8) * scale * 1.5 + layer * 2; // Rough approx
        // Random position within tree volume
        const angle = Math.random() * Math.PI * 2;
        const r = (Math.random() * 0.5 + 0.2) * scale;
        const y = (Math.random() * 2 + 1) * scale;

        ornament.position.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
        treeGroup.add(ornament);
    }

    treeGroup.position.set(x, 0, z);
    return treeGroup;
}

// 1. The Cottage (Original Style)
function createCottage(x, z, scale = 1) {
    const houseGroup = new THREE.Group();

    // Base with brick texture
    const baseGeometry = new THREE.BoxGeometry(4 * scale, 3 * scale, 4 * scale);

    // Create materials for each face with proper UV mapping
    const materials = [];
    const brickMat = new THREE.MeshStandardMaterial({
        map: textures.brick || null,
        color: textures.brick ? 0xffffff : 0xd2691e,
        roughness: 0.8,
        metalness: 0.1
    });
    const woodMat = new THREE.MeshStandardMaterial({
        map: textures.wood || null,
        color: textures.wood ? 0xffffff : 0xd2691e,
        roughness: 0.9,
        metalness: 0.0
    });

    // Use different materials for different faces
    materials.push(woodMat); // right
    materials.push(woodMat); // left
    materials.push(brickMat); // top
    materials.push(brickMat); // bottom
    materials.push(brickMat); // front
    materials.push(brickMat); // back

    const base = new THREE.Mesh(baseGeometry, materials);
    base.position.y = 1.5 * scale;
    base.castShadow = true;
    base.receiveShadow = true;
    houseGroup.add(base);

    // Roof with tile-like appearance
    const baseTop = 3 * scale;
    const roofHeight = 2 * scale;
    const roofGeometry = new THREE.ConeGeometry(3 * scale, roofHeight, 4);
    const roofMaterial = new THREE.MeshStandardMaterial({
        color: 0x8b0000,
        roughness: 0.7,
        metalness: 0.1,
        emissive: 0x000000
    });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = baseTop + roofHeight / 2;
    roof.castShadow = true;
    roof.receiveShadow = true;
    houseGroup.add(roof);

    // Door
    const doorGeometry = new THREE.BoxGeometry(0.8 * scale, 1.5 * scale, 0.1 * scale);
    const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, 0.75 * scale, 2.05 * scale);
    houseGroup.add(door);

    // Window
    const windowGeometry = new THREE.BoxGeometry(0.6 * scale, 0.6 * scale, 0.1 * scale);
    const windowMaterial = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        emissive: 0xffd700,
        emissiveIntensity: 0.8
    });
    const window1 = new THREE.Mesh(windowGeometry, windowMaterial);
    window1.position.set(-1.2 * scale, 2 * scale, 2.05 * scale);
    houseGroup.add(window1);

    const window2 = new THREE.Mesh(windowGeometry, windowMaterial);
    window2.position.set(1.2 * scale, 2 * scale, 2.05 * scale);
    houseGroup.add(window2);

    houseGroup.position.set(x, 0, z);
    return houseGroup;
}

// 2. The Tower (Tall 2-story house)
function createTower(x, z, scale = 1) {
    const houseGroup = new THREE.Group();

    // Base (Taller and narrower)
    const baseWidth = 3 * scale;
    const baseHeight = 5 * scale;
    const baseDepth = 3 * scale;
    const baseGeometry = new THREE.BoxGeometry(baseWidth, baseHeight, baseDepth);

    const materials = [];
    const wallMat = new THREE.MeshStandardMaterial({
        map: textures.wood || null,
        color: textures.wood ? 0xdddddd : 0x5c4033, // Darker wood
        roughness: 0.9,
        metalness: 0.0
    });

    for (let i = 0; i < 6; i++) materials.push(wallMat);

    const base = new THREE.Mesh(baseGeometry, materials);
    base.position.y = baseHeight / 2;
    base.castShadow = true;
    base.receiveShadow = true;
    houseGroup.add(base);

    // Roof (Steep pyramid)
    const roofHeight = 2.5 * scale;
    const roofGeometry = new THREE.ConeGeometry(2.5 * scale, roofHeight, 4);
    const roofMaterial = new THREE.MeshStandardMaterial({
        color: 0x2f4f4f, // Dark Slate Gray
        roughness: 0.7,
        metalness: 0.1
    });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = baseHeight + roofHeight / 2;
    roof.castShadow = true;
    houseGroup.add(roof);

    // Door
    const doorGeometry = new THREE.BoxGeometry(0.8 * scale, 1.5 * scale, 0.1 * scale);
    const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x3e2723 });
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, 0.75 * scale, baseDepth / 2 + 0.05);
    houseGroup.add(door);

    // Windows (Upstairs and Downstairs)
    const windowGeometry = new THREE.BoxGeometry(0.5 * scale, 0.8 * scale, 0.1 * scale);
    const windowMaterial = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        emissive: 0xffd700,
        emissiveIntensity: 0.8
    });

    // Downstairs windows
    const winD1 = new THREE.Mesh(windowGeometry, windowMaterial);
    winD1.position.set(-0.8 * scale, 1.5 * scale, baseDepth / 2 + 0.05);
    houseGroup.add(winD1);

    const winD2 = new THREE.Mesh(windowGeometry, windowMaterial);
    winD2.position.set(0.8 * scale, 1.5 * scale, baseDepth / 2 + 0.05);
    houseGroup.add(winD2);

    // Upstairs window
    const winU1 = new THREE.Mesh(windowGeometry, windowMaterial);
    winU1.position.set(0, 3.5 * scale, baseDepth / 2 + 0.05);
    houseGroup.add(winU1);

    houseGroup.position.set(x, 0, z);
    return houseGroup;
}

// 3. The Cabin (Wide house)


// Factory function to create random houses
// Factory function to create random houses
function createHouse(x, z, scale = 1) {
    const rand = Math.random();
    if (rand < 0.5) {
        return createCottage(x, z, scale);
    } else {
        return createTower(x, z, scale);
    }
}

// Function to create a snowman with realistic snow texture
function createSnowman(x, z, scale = 1) {
    const snowmanGroup = new THREE.Group();

    // Bottom sphere
    const bottom = new THREE.Mesh(resources.geometries.sphere, resources.materials.snow);
    bottom.scale.set(1 * scale, 1 * scale, 1 * scale);
    bottom.position.y = 1 * scale;
    bottom.castShadow = true;
    bottom.receiveShadow = true;
    snowmanGroup.add(bottom);

    // Middle sphere
    const middle = new THREE.Mesh(resources.geometries.sphere, resources.materials.snow);
    middle.scale.set(0.7 * scale, 0.7 * scale, 0.7 * scale);
    middle.position.y = 2.2 * scale;
    middle.castShadow = true;
    middle.receiveShadow = true;
    snowmanGroup.add(middle);

    // Top sphere
    const top = new THREE.Mesh(resources.geometries.sphere, resources.materials.snow);
    top.scale.set(0.5 * scale, 0.5 * scale, 0.5 * scale);
    top.position.y = 3.2 * scale;
    top.castShadow = true;
    top.receiveShadow = true;
    snowmanGroup.add(top);

    // Eyes
    const eye1 = new THREE.Mesh(resources.geometries.sphere, resources.materials.black);
    eye1.scale.set(0.05 * scale, 0.05 * scale, 0.05 * scale);
    eye1.position.set(-0.15 * scale, 3.3 * scale, 0.45 * scale);
    snowmanGroup.add(eye1);

    const eye2 = new THREE.Mesh(resources.geometries.sphere, resources.materials.black);
    eye2.scale.set(0.05 * scale, 0.05 * scale, 0.05 * scale);
    eye2.position.set(0.15 * scale, 3.3 * scale, 0.45 * scale);
    snowmanGroup.add(eye2);

    // Nose (carrot)
    const nose = new THREE.Mesh(resources.geometries.cone, resources.materials.orange);
    nose.scale.set(0.03 * scale, 0.2 * scale, 0.03 * scale);
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, 3.2 * scale, 0.5 * scale);
    snowmanGroup.add(nose);

    // Hat
    const hatBase = new THREE.Mesh(resources.geometries.cylinder, resources.materials.black);
    hatBase.scale.set(0.4 * scale, 0.2 * scale, 0.4 * scale);
    hatBase.position.y = 3.5 * scale;
    snowmanGroup.add(hatBase);

    const hatTop = new THREE.Mesh(resources.geometries.cylinder, resources.materials.black);
    hatTop.scale.set(0.2 * scale, 0.5 * scale, 0.2 * scale);
    hatTop.position.y = 4 * scale;
    snowmanGroup.add(hatTop);

    snowmanGroup.position.set(x, 0, z);
    return snowmanGroup;
}

// Function to create a street lamp
function createStreetLamp(x, z, scale = 1) {
    const lampGroup = new THREE.Group();

    // Pole
    const pole = new THREE.Mesh(resources.geometries.cylinder, resources.materials.metal);
    pole.scale.set(0.1 * scale, 4 * scale, 0.1 * scale);
    pole.position.y = 2 * scale;
    pole.castShadow = true;
    pole.receiveShadow = true;
    lampGroup.add(pole);

    // Lamp head
    const head = new THREE.Mesh(resources.geometries.cylinder, resources.materials.metal);
    head.scale.set(0.4 * scale, 0.5 * scale, 0.4 * scale);
    head.position.y = 4.25 * scale;
    head.castShadow = true;
    lampGroup.add(head);

    // Light bulb (glows)
    const bulb = new THREE.Mesh(resources.geometries.sphere, resources.materials.bulb);
    bulb.scale.set(0.25 * scale, 0.25 * scale, 0.25 * scale);
    bulb.position.y = 3.9 * scale;
    lampGroup.add(bulb);

    // Point light for illumination
    const light = new THREE.PointLight(0xffaa33, 1, 15);
    light.position.set(0, 3.8 * scale, 0);
    light.castShadow = false; // Disable shadow casting for performance
    lampGroup.add(light);

    lampGroup.position.set(x, 0, z);
    return lampGroup;
}

// Function to load the Statue (Lucy100k)
function loadStatue() {
    return new Promise((resolve, reject) => {
        const loader = new PLYLoader();
        loader.load('https://threejs.org/examples/models/ply/binary/Lucy100k.ply', function (geometry) {

            geometry.computeVertexNormals();

            const material = new THREE.MeshStandardMaterial({
                color: 0xffd700, // Gold color
                roughness: 0.4,
                metalness: 0.8
            });

            const mesh = new THREE.Mesh(geometry, material);
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            resolve(mesh);

        }, undefined, function (error) {
            console.error('An error happened loading the statue:', error);
            resolve(null);
        });
    });
}

// Function to load Nemetona Statue
function loadNemetonaStatue() {
    return new Promise((resolve, reject) => {
        const loader = new GLTFLoader();
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
        loader.setDRACOLoader(dracoLoader);

        loader.load('https://threejs.org/examples/models/gltf/nemetona.glb', function (gltf) {
            const model = gltf.scene;

            const goldMaterial = new THREE.MeshStandardMaterial({
                color: 0xffd700, // Gold color
                roughness: 0.4,
                metalness: 0.8
            });

            model.traverse((child) => {
                if (child.isMesh) {
                    child.material = goldMaterial; // Apply gold material
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            resolve(model);
        }, undefined, function (error) {
            console.error('An error happened loading Nemetona:', error);
            resolve(null);
        });
    });
}

// Function to load the Forest House model
async function loadForestHouse() {
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/'); // Use CDN for Draco decoder

    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    return new Promise((resolve, reject) => {
        loader.load(
            'https://threejs.org/examples/models/gltf/AVIFTest/forest_house.glb',
            (gltf) => {
                const model = gltf.scene;
                // Traverse to enable shadows
                model.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                resolve(model);
            },
            undefined,
            (error) => {
                console.error('An error happened loading the model:', error);
                reject(error);
            }
        );
    });
}

// Wait for textures to load before creating scene objects
let trees = [];
let houses = [];
let snowmen = [];
let snow, snowVelocities, snowCount; // Snow variables
let stars, starsCount; // Star variables

// Function to create the main road
// Function to create the winding road
// Function to create the winding road
function createWindingRoad() {
    // Create a winding path using CatmullRomCurve3 - Extended for larger map
    const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-20, 0, -450),
        new THREE.Vector3(50, 0, -350),
        new THREE.Vector3(-40, 0, -250),
        new THREE.Vector3(30, 0, -150),
        new THREE.Vector3(-20, 0, -50),
        new THREE.Vector3(40, 0, 50),
        new THREE.Vector3(-30, 0, 150),
        new THREE.Vector3(60, 0, 250),
        new THREE.Vector3(-50, 0, 350),
        new THREE.Vector3(20, 0, 450)
    ]);

    // Create road mesh manually to ensure it's flat
    const points = curve.getPoints(1000); // Increased resolution
    const roadGeometry = new THREE.BufferGeometry();
    const roadWidth = 8;
    const vertices = [];
    const uvs = [];
    const indices = [];

    for (let i = 0; i < points.length; i++) {
        const point = points[i];
        const tangent = curve.getTangent(i / (points.length - 1));
        const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize(); // Perpendicular in XZ plane

        // Left vertex
        const v1 = new THREE.Vector3().copy(point).add(normal.clone().multiplyScalar(roadWidth / 2));
        // Right vertex
        const v2 = new THREE.Vector3().copy(point).add(normal.clone().multiplyScalar(-roadWidth / 2));

        vertices.push(v1.x, 0.1, v1.z); // Slightly above ground
        vertices.push(v2.x, 0.1, v2.z);

        uvs.push(0, i / points.length * 20); // Repeat texture more often
        uvs.push(1, i / points.length * 20);

        if (i < points.length - 1) {
            const offset = i * 2;
            indices.push(offset, offset + 1, offset + 2);
            indices.push(offset + 1, offset + 3, offset + 2);
        }
    }

    roadGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    roadGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    roadGeometry.setIndex(indices);
    roadGeometry.computeVertexNormals();

    const roadMaterial = new THREE.MeshStandardMaterial({
        color: 0x444444,
        roughness: 0.9,
        metalness: 0.1,
        side: THREE.DoubleSide
    });
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.receiveShadow = true;

    return { mesh: road, curve: curve };
}




// Function to create Aurora Borealis
let auroraMesh;
function createAurora() {
    const vertexShader = `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;

    const fragmentShader = `
        uniform float time;
        varying vec2 vUv;

        // Simplex 2D noise
        vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

        float snoise(vec2 v){
            const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                    -0.577350269189626, 0.024390243902439);
            vec2 i  = floor(v + dot(v, C.yy) );
            vec2 x0 = v -   i + dot(i, C.xx);
            vec2 i1;
            i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
            vec4 x12 = x0.xyxy + C.xxzz;
            x12.xy -= i1;
            i = mod(i, 289.0);
            vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
            + i.x + vec3(0.0, i1.x, 1.0 ));
            vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
            m = m*m ;
            m = m*m ;
            vec3 x = 2.0 * fract(p * C.www) - 1.0;
            vec3 h = abs(x) - 0.5;
            vec3 ox = floor(x + 0.5);
            vec3 a0 = x - ox;
            m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
            vec3 g;
            g.x  = a0.x  * x0.x  + h.x  * x0.y;
            g.yz = a0.yz * x12.xz + h.yz * x12.yw;
            return 130.0 * dot(m, g);
        }

        void main() {
            vec2 uv = vUv;
            
            // Create wavy pattern
            float noise1 = snoise(vec2(uv.x * 2.0 + time * 0.1, uv.y * 0.5 - time * 0.05));
            float noise2 = snoise(vec2(uv.x * 4.0 - time * 0.15, uv.y * 2.0 + time * 0.1));
            
            float combinedNoise = (noise1 + noise2) * 0.5;
            
            // Intensity fades at edges
            float alpha = smoothstep(0.0, 0.5, uv.y) * smoothstep(1.0, 0.5, uv.y);
            alpha *= smoothstep(0.0, 0.2, combinedNoise + 0.5);
            
            // Colors: Green to Purple
            vec3 color1 = vec3(0.0, 1.0, 0.5); // Greenish teal
            vec3 color2 = vec3(0.5, 0.0, 1.0); // Purple
            
            vec3 finalColor = mix(color1, color2, uv.y + combinedNoise * 0.5);
            
            gl_FragColor = vec4(finalColor, alpha * 0.4); // Low opacity
        }
    `;

    const geometry = new THREE.CylinderGeometry(300, 300, 200, 64, 1, true);
    // Cut the cylinder in half to make a curtain
    const positions = geometry.attributes.position;
    // We don't need to cut it, just place it far away and rotate

    const material = new THREE.ShaderMaterial({
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        uniforms: {
            time: { value: 0 }
        },
        side: THREE.DoubleSide,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    auroraMesh = new THREE.Mesh(geometry, material);
    auroraMesh.position.set(0, 100, -200);
    auroraMesh.rotation.x = Math.PI / 8; // Tilt slightly
    auroraMesh.rotation.z = Math.PI / 12;
    scene.add(auroraMesh);
}

// Function to create Santa's Sleigh and Reindeer
let santaGroup;
function createSantaSleigh() {
    santaGroup = new THREE.Group();

    // Materials
    const redMat = new THREE.MeshStandardMaterial({ color: 0xff0000, roughness: 0.3 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.2 });
    const brownMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.9 });
    const darkBrownMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.9 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffccaa, roughness: 0.5 });

    // --- Sleigh ---
    const sleighGroup = new THREE.Group();

    // Body
    const bodyGeo = new THREE.BoxGeometry(2, 1, 3);
    const body = new THREE.Mesh(bodyGeo, redMat);
    body.position.y = 0.5;
    sleighGroup.add(body);

    // Runners (Skis)
    const runnerGeo = new THREE.BoxGeometry(0.2, 0.1, 4);
    const runnerL = new THREE.Mesh(runnerGeo, goldMat);
    runnerL.position.set(-0.8, 0, 0);
    // Curl up front
    const runnerTipGeo = new THREE.BoxGeometry(0.2, 0.1, 0.5);
    const runnerTipL = new THREE.Mesh(runnerTipGeo, goldMat);
    runnerTipL.position.set(-0.8, 0.2, 2.1);
    runnerTipL.rotation.x = -Math.PI / 4;
    sleighGroup.add(runnerL);
    sleighGroup.add(runnerTipL);

    const runnerR = new THREE.Mesh(runnerGeo, goldMat);
    runnerR.position.set(0.8, 0, 0);
    const runnerTipR = new THREE.Mesh(runnerTipGeo, goldMat);
    runnerTipR.position.set(0.8, 0.2, 2.1);
    runnerTipR.rotation.x = -Math.PI / 4;
    sleighGroup.add(runnerR);
    sleighGroup.add(runnerTipR);

    // Connectors
    const connGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.5);
    const conn1 = new THREE.Mesh(connGeo, goldMat);
    conn1.position.set(-0.8, 0.25, 1);
    sleighGroup.add(conn1);
    const conn2 = new THREE.Mesh(connGeo, goldMat);
    conn2.position.set(-0.8, 0.25, -1);
    sleighGroup.add(conn2);
    const conn3 = new THREE.Mesh(connGeo, goldMat);
    conn3.position.set(0.8, 0.25, 1);
    sleighGroup.add(conn3);
    const conn4 = new THREE.Mesh(connGeo, goldMat);
    conn4.position.set(0.8, 0.25, -1);
    sleighGroup.add(conn4);

    // Santa
    const santaBody = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1, 0.5), redMat);
    santaBody.position.set(0, 1.2, 0.5);
    sleighGroup.add(santaBody);

    const santaHead = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), skinMat);
    santaHead.position.set(0, 1.8, 0.5);
    sleighGroup.add(santaHead);

    const santaHat = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.5, 8), redMat);
    santaHat.position.set(0, 2.2, 0.5);
    sleighGroup.add(santaHat);

    const beard = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.1), whiteMat);
    beard.position.set(0, 1.65, 0.75);
    sleighGroup.add(beard);

    // Sack of gifts
    const sack = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8), brownMat);
    sack.position.set(0, 1, -0.8);
    sleighGroup.add(sack);

    santaGroup.add(sleighGroup);

    // --- Reindeer ---
    // Global array to store reindeer for animation
    window.reindeers = [];

    function createReindeer(x, z) {
        const deerGroup = new THREE.Group();

        // Body
        const deerBody = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 1.5), brownMat);
        deerBody.position.y = 1;
        deerGroup.add(deerBody);

        // Legs
        const legGeo = new THREE.BoxGeometry(0.15, 1, 0.15);
        const leg1 = new THREE.Mesh(legGeo, brownMat); leg1.position.set(-0.3, 0.5, 0.6); deerGroup.add(leg1);
        const leg2 = new THREE.Mesh(legGeo, brownMat); leg2.position.set(0.3, 0.5, 0.6); deerGroup.add(leg2);
        const leg3 = new THREE.Mesh(legGeo, brownMat); leg3.position.set(-0.3, 0.5, -0.6); deerGroup.add(leg3);
        const leg4 = new THREE.Mesh(legGeo, brownMat); leg4.position.set(0.3, 0.5, -0.6); deerGroup.add(leg4);

        // Neck & Head
        const neck = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.8, 0.4), brownMat);
        neck.position.set(0, 1.5, 0.8);
        neck.rotation.x = -Math.PI / 4;
        deerGroup.add(neck);

        const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.7), brownMat);
        head.position.set(0, 1.9, 1.2);
        deerGroup.add(head);

        // Antlers
        const antlerGeo = new THREE.BoxGeometry(0.05, 0.6, 0.05);
        const antlerL = new THREE.Mesh(antlerGeo, darkBrownMat);
        antlerL.position.set(-0.2, 2.4, 1.1);
        antlerL.rotation.z = 0.3;
        deerGroup.add(antlerL);

        const antlerR = new THREE.Mesh(antlerGeo, darkBrownMat);
        antlerR.position.set(0.2, 2.4, 1.1);
        antlerR.rotation.z = -0.3;
        deerGroup.add(antlerR);

        // Red nose for Rudolph (first one)
        if (z > 4) { // Leading reindeer
            const nose = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
            nose.position.set(0, 1.9, 1.6);
            deerGroup.add(nose);

            // Nose glow
            const noseLight = new THREE.PointLight(0xff0000, 1, 5);
            noseLight.position.set(0, 1.9, 1.6);
            deerGroup.add(noseLight);
        }

        deerGroup.position.set(x, 0, z);

        // Store for animation
        window.reindeers.push(deerGroup);

        return deerGroup;
    }

    // Add 4 Reindeer
    // Position them relative to sleigh (0,0,0)
    // Sleigh is at 0. Reindeer need to be in FRONT.
    // If moving forward means +Z relative to group, then z should be positive.
    const r1 = createReindeer(-1, 3); santaGroup.add(r1);
    const r2 = createReindeer(1, 3); santaGroup.add(r2);
    const r3 = createReindeer(-1, 5.5); santaGroup.add(r3); // Rudolph?
    const r4 = createReindeer(1, 5.5); santaGroup.add(r4);

    // Position entire group high up
    santaGroup.position.set(0, 100, 0);
    santaGroup.castShadow = true;

    scene.add(santaGroup);
}

async function initializeScene() {
    // Initialize shared resources
    initResources();

    // Load Statue
    const statueMesh = await loadStatue();

    // Initialize Snow
    initSnow();

    // Initialize Stars
    initStars();

    // Initialize Aurora
    createAurora();

    // Initialize Santa
    createSantaSleigh();

    // Wait for all textures to load
    await Promise.all(texturePromises);

    // Load Forest House Model
    let forestHouseModel = null;
    try {
        forestHouseModel = await loadForestHouse();
    } catch (error) {
        console.warn('Failed to load Forest House model, falling back to procedural houses', error);
    }

    // Hide loading indicator
    document.getElementById('loading').classList.add('hidden');

    // Create ground with snow texture - Expanded size
    const groundGeometry = new THREE.PlaneGeometry(1000, 1000, 200, 200);
    const groundMaterial = new THREE.MeshStandardMaterial({
        map: textures.snow || null,
        color: textures.snow ? 0xffffff : 0xf0f8ff,
        roughness: 1.0,
        metalness: 0.0
    });
    ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    scene.add(ground);

    // Add Winding Road
    const { mesh: road, curve } = createWindingRoad();
    scene.add(road);

    // Helper function to check if position conflicts with existing objects
    function checkCollision(x, z, radius, existingObjects) {
        return existingObjects.some(obj => {
            const distance = Math.sqrt((obj.x - x) ** 2 + (obj.z - z) ** 2);
            return distance < (radius + obj.radius);
        });
    }

    // All placed objects for collision checking
    const allObjects = [];

    // Place objects along the curve
    const numSegments = 150; // Increased for longer road
    const roadWidth = 8;

    for (let i = 1; i < numSegments; i++) {
        const t = i / numSegments;
        const point = curve.getPointAt(t);
        const tangent = curve.getTangentAt(t);
        const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
        const angle = Math.atan2(tangent.x, tangent.z); // Rotation for objects

        // Place Lamps (closer to road) - REDUCED DENSITY
        if (i % 5 === 0) { // Only place lamps every 5th segment
            const lampDist = roadWidth / 2 + 2;

            // Left Lamp
            const lampLeftPos = new THREE.Vector3().copy(point).add(normal.clone().multiplyScalar(lampDist));
            if (!checkCollision(lampLeftPos.x, lampLeftPos.z, 2, allObjects)) {
                const lampLeft = createStreetLamp(lampLeftPos.x, lampLeftPos.z);
                scene.add(lampLeft);
                allObjects.push({ x: lampLeftPos.x, z: lampLeftPos.z, radius: 2 });
            }

            // Right Lamp
            const lampRightPos = new THREE.Vector3().copy(point).add(normal.clone().multiplyScalar(-lampDist));
            if (!checkCollision(lampRightPos.x, lampRightPos.z, 2, allObjects)) {
                const lampRight = createStreetLamp(lampRightPos.x, lampRightPos.z);
                scene.add(lampRight);
                allObjects.push({ x: lampRightPos.x, z: lampRightPos.z, radius: 2 });
            }
        }

        // Place Houses (further from road)
        const houseDist = roadWidth / 2 + 12;

        // Left House
        if (Math.random() > 0.3) { // 70% chance
            const houseLeftPos = new THREE.Vector3().copy(point).add(normal.clone().multiplyScalar(houseDist));

            // 30% chance for Forest House if loaded
            if (forestHouseModel && Math.random() < 0.3) {
                // Check collision with larger radius for Forest House
                if (!checkCollision(houseLeftPos.x, houseLeftPos.z, 10, allObjects)) {
                    const house = forestHouseModel.clone();
                    house.position.set(houseLeftPos.x, 0, houseLeftPos.z);
                    house.rotation.y = angle + Math.PI / 2; // Face the road
                    house.scale.set(2.5, 2.5, 2.5);
                    scene.add(house);
                    houses.push(house);
                    allObjects.push({ x: houseLeftPos.x, z: houseLeftPos.z, radius: 10 });

                    // Removed PointLight to save uniforms
                }
            } else {
                if (!checkCollision(houseLeftPos.x, houseLeftPos.z, 7, allObjects)) {
                    const houseLeft = createHouse(houseLeftPos.x, houseLeftPos.z, 1);
                    houseLeft.rotation.y = angle + Math.PI / 2; // Face the road
                    scene.add(houseLeft);
                    houses.push(houseLeft);
                    allObjects.push({ x: houseLeftPos.x, z: houseLeftPos.z, radius: 7 });
                }
            }
        }

        // Right House
        if (Math.random() > 0.3) {
            const houseRightPos = new THREE.Vector3().copy(point).add(normal.clone().multiplyScalar(-houseDist));

            // 30% chance for Forest House if loaded
            if (forestHouseModel && Math.random() < 0.3) {
                if (!checkCollision(houseRightPos.x, houseRightPos.z, 10, allObjects)) {
                    const house = forestHouseModel.clone();
                    house.position.set(houseRightPos.x, 0, houseRightPos.z);
                    house.rotation.y = angle - Math.PI / 2; // Face the road
                    house.scale.set(2.5, 2.5, 2.5);
                    scene.add(house);
                    houses.push(house);
                    allObjects.push({ x: houseRightPos.x, z: houseRightPos.z, radius: 10 });

                    // Removed PointLight to save uniforms
                }
            } else {
                if (!checkCollision(houseRightPos.x, houseRightPos.z, 7, allObjects)) {
                    const houseRight = createHouse(houseRightPos.x, houseRightPos.z, 1);
                    houseRight.rotation.y = angle - Math.PI / 2; // Face the road
                    scene.add(houseRight);
                    houses.push(houseRight);
                    allObjects.push({ x: houseRightPos.x, z: houseRightPos.z, radius: 7 });
                }
            }
        }

        // --- Second Row of Houses (Behind the first row) ---
        const houseDist2 = houseDist + 15; // Further back

        // Left House Row 2
        if (Math.random() > 0.5) { // 50% chance for second row
            const houseLeftPos2 = new THREE.Vector3().copy(point).add(normal.clone().multiplyScalar(houseDist2));

            if (forestHouseModel && Math.random() < 0.3) {
                if (!checkCollision(houseLeftPos2.x, houseLeftPos2.z, 10, allObjects)) {
                    const house = forestHouseModel.clone();
                    house.position.set(houseLeftPos2.x, 0, houseLeftPos2.z);
                    house.rotation.y = angle + Math.PI / 2;
                    house.scale.set(2.5, 2.5, 2.5);
                    scene.add(house);
                    houses.push(house);
                    allObjects.push({ x: houseLeftPos2.x, z: houseLeftPos2.z, radius: 10 });
                }
            } else {
                if (!checkCollision(houseLeftPos2.x, houseLeftPos2.z, 7, allObjects)) {
                    const houseLeft2 = createHouse(houseLeftPos2.x, houseLeftPos2.z, 1);
                    houseLeft2.rotation.y = angle + Math.PI / 2;
                    scene.add(houseLeft2);
                    houses.push(houseLeft2);
                    allObjects.push({ x: houseLeftPos2.x, z: houseLeftPos2.z, radius: 7 });
                }
            }
        }

        // Right House Row 2
        if (Math.random() > 0.5) { // 50% chance for second row
            const houseRightPos2 = new THREE.Vector3().copy(point).add(normal.clone().multiplyScalar(-houseDist2));

            if (forestHouseModel && Math.random() < 0.3) {
                if (!checkCollision(houseRightPos2.x, houseRightPos2.z, 10, allObjects)) {
                    const house = forestHouseModel.clone();
                    house.position.set(houseRightPos2.x, 0, houseRightPos2.z);
                    house.rotation.y = angle - Math.PI / 2;
                    house.scale.set(2.5, 2.5, 2.5);
                    scene.add(house);
                    houses.push(house);
                    allObjects.push({ x: houseRightPos2.x, z: houseRightPos2.z, radius: 10 });
                }
            } else {
                if (!checkCollision(houseRightPos2.x, houseRightPos2.z, 7, allObjects)) {
                    const houseRight2 = createHouse(houseRightPos2.x, houseRightPos2.z, 1);
                    houseRight2.rotation.y = angle - Math.PI / 2;
                    scene.add(houseRight2);
                    houses.push(houseRight2);
                    allObjects.push({ x: houseRightPos2.x, z: houseRightPos2.z, radius: 7 });
                }
            }
        }
    }

    // Place Trees in the background (Forest) - OPTIMIZED with InstancedMesh
    const treeCount = 1000;

    // Create merged geometry for a single tree
    // We'll use a simplified tree for instancing to keep it manageable
    // A tree consists of: 3 cones (leaves) and 1 cylinder (trunk)

    // Helper to merge geometries
    function createTreeGeometry() {
        const treeGeo = new THREE.BufferGeometry();
        const geometries = [];

        // Leaves
        for (let i = 0; i < 3; i++) {
            const cone = new THREE.ConeGeometry(1, 1.5, 8);
            cone.translate(0, i * 0.8 + 1, 0);
            const scale = 1.5 - i * 0.3;
            cone.scale(scale, 1, scale);
            geometries.push(cone);
        }

        // Trunk
        const trunk = new THREE.CylinderGeometry(0.2, 0.2, 1, 8);
        trunk.translate(0, 0.5, 0);
        geometries.push(trunk);

        // Merge all into one geometry? 
        // Problem: Different materials (Green leaves, Brown trunk).
        // Solution: Use 2 InstancedMeshes. One for leaves, one for trunks.
        return null; // Not used directly
    }

    // 1. InstancedMesh for Leaves
    const leavesGeo = new THREE.ConeGeometry(1, 1.5, 8);
    leavesGeo.translate(0, 0.75, 0); // Pivot at bottom
    const leavesMaterial = resources.materials.leaves;
    const leavesMesh = new THREE.InstancedMesh(leavesGeo, leavesMaterial, treeCount * 3); // 3 layers per tree
    leavesMesh.castShadow = true;
    leavesMesh.receiveShadow = true;

    // 2. InstancedMesh for Trunks
    const trunkGeo = new THREE.CylinderGeometry(0.2, 0.2, 1, 8);
    trunkGeo.translate(0, 0.5, 0); // Pivot at bottom
    const trunkMaterial = resources.materials.wood;
    const trunkMesh = new THREE.InstancedMesh(trunkGeo, trunkMaterial, treeCount);
    trunkMesh.castShadow = true;
    trunkMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    let leafIndex = 0;
    let trunkIndex = 0;

    for (let i = 0; i < treeCount; i++) {
        let x, z, scale;
        let attempts = 0;
        let validPosition = false;

        do {
            x = (Math.random() - 0.5) * 900;
            z = (Math.random() - 0.5) * 900;

            let distToRoad = 1000;
            for (let j = 0; j <= 50; j++) {
                const pt = curve.getPointAt(j / 50);
                const d = Math.sqrt((x - pt.x) ** 2 + (z - pt.z) ** 2);
                if (d < distToRoad) distToRoad = d;
            }

            if (distToRoad < 30) {
                continue;
            }

            scale = 1.5 + Math.random() * 3.5;
            const treeRadius = 2 * scale;

            if (!checkCollision(x, z, treeRadius, allObjects)) {
                validPosition = true;
                allObjects.push({ x, z, radius: treeRadius });
            }
            attempts++;
        } while (!validPosition && attempts < 20);

        if (validPosition) {
            // Position Trunk
            dummy.position.set(x, 0, z);
            dummy.scale.set(scale, scale * 3, scale); // Tall trunk hidden inside
            dummy.rotation.set(0, 0, 0);
            dummy.updateMatrix();
            trunkMesh.setMatrixAt(trunkIndex++, dummy.matrix);

            // Position Leaves (3 layers)
            for (let l = 0; l < 3; l++) {
                dummy.position.set(x, (l * 0.8 + 1) * scale, z);
                const layerScale = scale * (1.5 - l * 0.3);
                const layerHeight = scale * 1.5;
                dummy.scale.set(layerScale, layerHeight, layerScale);

                // Random rotation
                dummy.rotation.set(
                    (Math.random() - 0.5) * 0.1,
                    0,
                    (Math.random() - 0.5) * 0.1
                );

                dummy.updateMatrix();
                leavesMesh.setMatrixAt(leafIndex++, dummy.matrix);
            }
        }
    }

    scene.add(trunkMesh);
    scene.add(leavesMesh);


    // Place Random Statues (Lucy100k)
    if (statueMesh) {
        const statueCount = 50;
        for (let i = 0; i < statueCount; i++) {
            let x, z, scale;
            let attempts = 0;
            let validPosition = false;

            do {
                x = (Math.random() - 0.5) * 900;
                z = (Math.random() - 0.5) * 900;

                // Check distance from road
                let distToRoad = 1000;
                for (let j = 0; j <= 50; j++) {
                    const pt = curve.getPointAt(j / 50);
                    const d = Math.sqrt((x - pt.x) ** 2 + (z - pt.z) ** 2);
                    if (d < distToRoad) distToRoad = d;
                }

                if (distToRoad < 30) {
                    continue;
                }

                // User requested even smaller.
                scale = (0.005 + Math.random() * 0.01); // Much smaller random scale
                const radius = 2; // Reduced radius

                if (!checkCollision(x, z, radius, allObjects)) {
                    validPosition = true;
                    allObjects.push({ x, z, radius: radius });
                }
                attempts++;
            } while (!validPosition && attempts < 20);

            if (validPosition) {
                const statue = statueMesh.clone();
                // Raise slightly to prevent sinking. 
                // Scale is very small (0.005 - 0.015), so we need to adjust relative to that or fixed.
                // Trial and error: raise by 2 units.
                statue.position.set(x, 2, z);
                statue.scale.set(scale, scale, scale);
                statue.rotation.y = Math.random() * Math.PI * 2; // Random rotation
                scene.add(statue);
            }
        }
    }

    // Load and Place Random Nemetona Statues
    const nemetonaModel = await loadNemetonaStatue();
    if (nemetonaModel) {
        const nemetonaCount = 50;
        for (let i = 0; i < nemetonaCount; i++) {
            let x, z, scale;
            let attempts = 0;
            let validPosition = false;

            do {
                x = (Math.random() - 0.5) * 900;
                z = (Math.random() - 0.5) * 900;

                // Check distance from road
                let distToRoad = 1000;
                for (let j = 0; j <= 50; j++) {
                    const pt = curve.getPointAt(j / 50);
                    const d = Math.sqrt((x - pt.x) ** 2 + (z - pt.z) ** 2);
                    if (d < distToRoad) distToRoad = d;
                }

                if (distToRoad < 30) {
                    continue;
                }

                // Scale Nemetona
                // User requested 1000x increase (assuming from original 0.02).
                // So target is around 20-30.
                scale = (20 + Math.random() * 10);
                const radius = 5;

                if (!checkCollision(x, z, radius, allObjects)) {
                    validPosition = true;
                    allObjects.push({ x, z, radius: radius });
                }
                attempts++;
            } while (!validPosition && attempts < 20);

            if (validPosition) {
                const statue = nemetonaModel.clone();
                // Raise Nemetona as well.
                statue.position.set(x, 2, z);
                statue.scale.set(scale, scale, scale);
                statue.rotation.y = Math.random() * Math.PI * 2;
                scene.add(statue);
            }
        }
    }


}




// Snow particles - increased count and more random




// Function to initialize snow
function initSnow() {
    snowCount = 10000;
    const snowPositions = new Float32Array(snowCount * 3);
    const snowSizes = new Float32Array(snowCount);
    snowVelocities = new Float32Array(snowCount);

    for (let i = 0; i < snowCount * 3; i += 3) {
        snowPositions[i] = (Math.random() - 0.5) * 1000;
        snowPositions[i + 1] = Math.random() * 800;
        snowPositions[i + 2] = (Math.random() - 0.5) * 1000;

        const idx = i / 3;
        snowSizes[idx] = 0.05 + Math.random() * 0.15;
        snowVelocities[idx] = 0.02 + Math.random() * 0.06;
    }

    const snowGeometry = new THREE.BufferGeometry();
    snowGeometry.setAttribute('position', new THREE.BufferAttribute(snowPositions, 3));
    snowGeometry.setAttribute('size', new THREE.BufferAttribute(snowSizes, 1));

    const snowMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.5,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        map: textures.snow
    });

    snow = new THREE.Points(snowGeometry, snowMaterial);
    scene.add(snow);
}

// Function to initialize stars
function initStars() {
    starsCount = 3000;
    const starsPositions = new Float32Array(starsCount * 3);
    const starsColors = new Float32Array(starsCount * 3);

    for (let i = 0; i < starsCount * 3; i += 3) {
        const radius = 400 + Math.random() * 100;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;

        starsPositions[i] = radius * Math.sin(phi) * Math.cos(theta);
        starsPositions[i + 1] = radius * Math.cos(phi);
        starsPositions[i + 2] = radius * Math.sin(phi) * Math.sin(theta);

        const brightness = 0.5 + Math.random() * 0.5;
        starsColors[i] = brightness;
        starsColors[i + 1] = brightness;
        starsColors[i + 2] = brightness;
    }

    const starsGeometry = new THREE.BufferGeometry();
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(starsPositions, 3));
    starsGeometry.setAttribute('color', new THREE.BufferAttribute(starsColors, 3));

    const starsMaterial = new THREE.PointsMaterial({
        size: 0.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.9
    });

    stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);
}

// Animation
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const elapsedTime = clock.getElapsedTime();

    // Animate trees (slight sway) - REMOVED for InstancedMesh performance
    // To animate InstancedMesh, we would need to update the matrix attribute every frame, 
    // which is heavy. We'll skip tree animation for now to prioritize FPS.


    // Twinkling stars
    if (stars) {
        const starColors = stars.geometry.attributes.color.array;
        for (let i = 0; i < starsCount; i++) {
            const twinkle = Math.sin(elapsedTime * 2 + i) * 0.3 + 0.7;
            starColors[i * 3] = twinkle;
            starColors[i * 3 + 1] = twinkle;
            starColors[i * 3 + 2] = twinkle;
        }
        stars.geometry.attributes.color.needsUpdate = true;
    }

    // Animate snow
    if (snow) {
        snow.rotation.y = elapsedTime * 0.05;
        const positions = snow.geometry.attributes.position.array;
        const velocities = snowVelocities;

        for (let i = 0; i < snowCount * 3; i += 3) {
            const idx = i / 3;
            const velocity = velocities[idx];

            positions[i + 1] -= velocity; // Fall
            positions[i] += Math.sin(elapsedTime * 0.5 + idx * 0.01) * 0.02; // Drift
            positions[i + 2] += Math.cos(elapsedTime * 0.3 + idx * 0.01) * 0.02;

            // Reset
            if (positions[i + 1] < -5) {
                positions[i + 1] = 800 + Math.random() * 200;
                positions[i] = (Math.random() - 0.5) * 1000;
                positions[i + 2] = (Math.random() - 0.5) * 1000;
            }

            // Wrap
            if (positions[i] > 500) positions[i] -= 1000;
            if (positions[i] < -500) positions[i] += 1000;
            if (positions[i + 2] > 500) positions[i + 2] -= 1000;
            if (positions[i + 2] < -500) positions[i + 2] += 1000;
        }
        snow.geometry.attributes.position.needsUpdate = true;
    }

    // Animate window lights
    houses.forEach((house) => {
        house.children.forEach((child) => {
            if (child.material && child.material.emissive) {
                child.material.emissiveIntensity = 0.5 + Math.sin(elapsedTime * 2) * 0.3;
            }
        });
    });

    // Animate Aurora
    if (auroraMesh) {
        auroraMesh.material.uniforms.time.value = elapsedTime;
    }

    // Animate Santa
    if (santaGroup) {
        const t = elapsedTime * 0.05; // Slower speed
        const radius = 200;

        // Calculate current position
        const x = Math.sin(t) * radius;
        const z = Math.cos(t) * radius;
        const y = 60 + Math.sin(t * 3) * 5; // Gentler bobbing

        santaGroup.position.set(x, y, z);

        // Calculate target position (where we are going next) to face it
        const nextX = Math.sin(t + 0.01) * radius;
        const nextZ = Math.cos(t + 0.01) * radius;
        const nextY = 60 + Math.sin((t + 0.01) * 3) * 5;

        santaGroup.lookAt(nextX, nextY, nextZ);

        // Animate Reindeer Galloping
        if (window.reindeers) {
            window.reindeers.forEach((deer, index) => {
                // Galloping motion: pitch up/down
                const gallopSpeed = 10;
                const phase = index * 0.5; // Offset each deer

                // Pitch (rotation around X)
                deer.rotation.x = Math.sin(elapsedTime * gallopSpeed + phase) * 0.1;

                // Bobbing (position Y)
                deer.position.y = Math.abs(Math.sin(elapsedTime * gallopSpeed + phase)) * 0.5;
            });
        }
    }

    controls.update();
    composer.render();
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});

// Initialize scene with textures, then start animation
initializeScene().then(() => {
    animate();
}).catch(error => {
    console.error("Failed to initialize scene:", error);
});

// Audio Control
const audioBtn = document.getElementById('audio-btn');
const bgMusic = document.getElementById('bg-music');
let isPlaying = false;

audioBtn.addEventListener('click', () => {
    if (isPlaying) {
        bgMusic.pause();
        audioBtn.textContent = '🔇';
        isPlaying = false;
    } else {
        bgMusic.play().then(() => {
            audioBtn.textContent = '🔊';
            isPlaying = true;
        }).catch(err => {
            console.error("Audio play failed:", err);
        });
    }
});
