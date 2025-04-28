import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/shaders/FXAAShader.js';
import { GUI } from 'https://cdn.jsdelivr.net/npm/dat.gui@0.7.9/build/dat.gui.module.js';

import { PolarSphereGeometry } from './polar_sphere_geometry.js';
import { createEmotionMaterial } from './materials/emotion_material.js';
import { createNoise3D } from 'https://cdn.skypack.dev/simplex-noise@4.0.1';
import { setupGUI } from './gui.js';
import { GrainShader } from './shaders/grain_shader.js';

// — Scene Setup —

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);
const clock = new THREE.Clock();


const envMap = new THREE.TextureLoader().load('./media/envmap.jpg');
envMap.mapping = THREE.EquirectangularReflectionMapping;
envMap.colorSpace = THREE.SRGBColorSpace;
scene.environment = envMap;

// Lights & Controls
scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.2));
const dir = new THREE.DirectionalLight(0xffffff, 0.8);
dir.position.set(5, 5, 5);
scene.add(dir);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Postprocessing
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.5, 0.4, 0.85);
composer.addPass(bloomPass);

// Add grain pass
const grainPass = new ShaderPass(GrainShader);
composer.addPass(grainPass);

const fxaaPass = new ShaderPass(FXAAShader);
fxaaPass.material.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
composer.addPass(fxaaPass);

// Parameters & State
const EMOTIONS = {
  Neutral: { amplitude: 0.2, frequency: 1.5, bloom: 0.3, color: 0xccccff, modifier: 0 },
  Angry:   { amplitude: 0.5, frequency: 3.0, bloom: 0.6, color: 0xff4444, modifier: 0 },
  Sad:     { amplitude: 0.1, frequency: 0.8, bloom: 0.1, color: 0x4444ff, modifier: 1 },
  Curious: { amplitude: 0.3, frequency: 2.2, bloom: 0.4, color: 0x44ff44, modifier: 0 }
};

const params = {
  preset: 'Neutral',
  amplitude: 0.2,
  frequency: 1.5,
  bloom: 0.3,
  noiseSpeed: 0.3,
  rotationSpeed: 0.2,
  color: 0xccccff,
  pointMode: false,
  pointSize: 0.03,
  useTexture: true,
  modifier: 0,
  ribAmp: 0.2,
  ribFreq: 10.0,
  backgroundColor: 0xb6b69e,
  metalness: 0.1,
  roughness: 0.35,
  transmission: 0.8,
  thickness: 0.4,
  clearcoat: 0.2,
  clearcoatRoughness: 0.1,
  envMapIntensity: 1.2,
  EMOTIONS: null  // Will be set below
};

// Set the EMOTIONS reference in params
params.EMOTIONS = EMOTIONS;

// Set initial background color
renderer.setClearColor(params.backgroundColor);

const meshMaterial = createEmotionMaterial(params);
const pointsMaterial = new THREE.PointsMaterial({
  color: new THREE.Color(params.color),
  size: params.pointSize,
  sizeAttenuation: true,
  transparent: true,
  opacity: 0.8,
});

// Initialize params from the default preset
applyPreset('Neutral');

function togglePointMode(usePoints) {
  scene.remove(usePoints ? mesh : points);
  scene.add(usePoints ? points : mesh);
}

function applyPreset(presetName) {
  console.log('Applying preset:', presetName);
  const preset = params.EMOTIONS[presetName];  // Use params.EMOTIONS instead of EMOTIONS
  console.log('Preset data:', preset);
  
  if (preset) {
    // Apply all parameters from the preset
    Object.keys(preset).forEach(key => {
      if (key in params) {
        params[key] = preset[key];
      }
    });

    // Update materials with new color
    if (meshMaterial) {
      meshMaterial.color.setHex(preset.color);
      meshMaterial.metalness = preset.metalness;
      meshMaterial.roughness = preset.roughness;
      meshMaterial.transmission = preset.transmission;
      meshMaterial.thickness = preset.thickness;
      meshMaterial.clearcoat = preset.clearcoat;
      meshMaterial.clearcoatRoughness = preset.clearcoatRoughness;
      meshMaterial.envMapIntensity = preset.envMapIntensity;
      meshMaterial.needsUpdate = true;
    }
    if (pointsMaterial) {
      pointsMaterial.color.setHex(preset.color);
      pointsMaterial.size = preset.pointSize;
      pointsMaterial.needsUpdate = true;
    }
    if (bloomPass) {
      bloomPass.strength = preset.bloom;
    }
  }
}

const gui = setupGUI(params, meshMaterial, pointsMaterial, bloomPass, applyPreset, togglePointMode, renderer);

const glossyMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0xccccff),
    metalness: 0.1,
    roughness: 0.35,
    transmission: 0.8,       // Makes it translucent/glass-like
    thickness: 0.4,           // Controls how deep light travels through
    envMapIntensity: 1.2,     // Strength of reflections
    clearcoat: 0.2,
    clearcoatRoughness: 0.1,
});

// Helper Functions
function createDensePointCloud(radius, count) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const normals = new Float32Array(count * 3);
  const uvs = new Float32Array(count * 2);
  
  for (let i = 0; i < count; i++) {
    // Generate random points on a sphere using spherical coordinates
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = radius;
    
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);
    
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    
    // Normalize the position to get the normal
    const length = Math.sqrt(x * x + y * y + z * z);
    normals[i * 3] = x / length;
    normals[i * 3 + 1] = y / length;
    normals[i * 3 + 2] = z / length;

    // Add UV coordinates
    uvs[i * 2] = theta / (Math.PI * 2);
    uvs[i * 2 + 1] = phi / Math.PI;
  }
  
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  return geometry;
}

// Create the blob
let geometry = new PolarSphereGeometry(1, 64, 64);
const basePositions = geometry.attributes.position.array.slice(); // keep original positions
const noise = createNoise3D(); // use for displacement
const denseGeometry = createDensePointCloud(1, 50000);
const denseBasePositions = denseGeometry.attributes.position.array.slice(); // keep original positions for points
const mesh = new THREE.Mesh(geometry, meshMaterial);
mesh.position.set(0, 0, 0);
const points = new THREE.Points(denseGeometry, pointsMaterial);
points.position.set(0, 0, 0);
scene.add(params.pointMode ? points : mesh);

// Center the blob
mesh.position.set(0, 0, 0);
scene.add(mesh);

// Texture handling
const textureLoader = new THREE.TextureLoader();
 
// Load default texture
textureLoader.load('./media/bg.png', texture => {
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  params.useTexture = true;
});

// Add texture upload functionality
const textureInput = document.createElement('input');
textureInput.type = 'file';
textureInput.accept = 'image/*';
textureInput.style.display = 'none';
document.body.appendChild(textureInput);

const textureButton = gui.add({ uploadTexture: () => textureInput.click() }, 'uploadTexture').name('Upload Texture');

textureInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const texture = new THREE.TextureLoader().load(e.target.result);
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      if (params.useTexture) {
        pointsMaterial.map = texture;
        pointsMaterial.needsUpdate = true;
        meshMaterial.map = texture;
        meshMaterial.needsUpdate = true;
      }
      
    };
    reader.readAsDataURL(file);
  }
});

// Animation
function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  const time = clock.getElapsedTime();

  // Update grain shader time only
  grainPass.uniforms.time.value = time;

  const positions = geometry.attributes.position.array;
  for (let i = 0; i < positions.length; i += 3) {
    let x = basePositions[i];
    let y = basePositions[i + 1];
    let z = basePositions[i + 2];
  
    const n = noise(
      x * params.frequency,
      y * params.frequency,
      z * params.frequency + time * params.noiseSpeed
    );
  
    const r = Math.sqrt(x * x + y * y + z * z);
    let displacement = n * params.amplitude;
    
    // Calculate base position with noise displacement
    const amp = 1 + displacement;
    positions[i] = x * amp;
    positions[i + 1] = y * amp;
    positions[i + 2] = z * amp;

    // Apply modifiers to the final positions
    if (Number(params.modifier) === 2) { // Ribs
      // Apply strong ribbing effect directly to positions
      const ribbing = Math.sin(y * params.ribFreq * 5.0 + time * 2.0) * params.ribAmp;
      positions[i] *= (1.0 + ribbing);
      positions[i + 2] *= (1.0 + ribbing);
    }
    else if (Number(params.modifier) === 1) { // Droopy
      // Apply stronger drooping effect
      const falloff = Math.pow((y + 1.0) * 0.5, 2.0); // Quadratic falloff from top to bottom
      positions[i + 1] -= falloff * 0.5; // Stronger downward pull
      // Add slight squishing
      positions[i] *= 1.0 + falloff * 0.2;
      positions[i + 2] *= 1.0 + falloff * 0.2;
    }
  }

  geometry.attributes.position.needsUpdate = true;
  geometry.computeVertexNormals();

  // Update points with the same modifications
  const pointPositions = denseGeometry.attributes.position.array;
  for (let i = 0; i < pointPositions.length; i += 3) {
    let x = denseBasePositions[i];
    let y = denseBasePositions[i + 1];
    let z = denseBasePositions[i + 2];

    const n = noise(
      x * params.frequency,
      y * params.frequency,
      z * params.frequency + time * params.noiseSpeed
    );

    const r = Math.sqrt(x * x + y * y + z * z);
    let displacement = n * params.amplitude;
    
    // Calculate base position with noise displacement
    const amp = 1 + displacement;
    pointPositions[i] = x * amp;
    pointPositions[i + 1] = y * amp;
    pointPositions[i + 2] = z * amp;

    // Apply modifiers to the final positions
    if (Number(params.modifier) === 2) { // Ribs
      // Apply strong ribbing effect directly to positions
      const ribbing = Math.sin(y * params.ribFreq * 5.0 + time * 2.0) * params.ribAmp;
      pointPositions[i] *= (1.0 + ribbing);
      pointPositions[i + 2] *= (1.0 + ribbing);
    }
    else if (Number(params.modifier) === 1) { // Droopy
      // Apply stronger drooping effect
      const falloff = Math.pow((y + 1.0) * 0.5, 2.0); // Quadratic falloff from top to bottom
      pointPositions[i + 1] -= falloff * 0.5; // Stronger downward pull
      // Add slight squishing
      pointPositions[i] *= 1.0 + falloff * 0.2;
      pointPositions[i + 2] *= 1.0 + falloff * 0.2;
    }
  }

  denseGeometry.attributes.position.needsUpdate = true;

  mesh.rotation.y += params.rotationSpeed * dt;
  points.rotation.y += params.rotationSpeed * dt;
  controls.update();
  composer.render();
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});