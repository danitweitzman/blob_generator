import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js';

export function createEmotionMaterial(params) {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(params.color),
    metalness: 0.1,
    roughness: 0.35,
    transmission: 0.8,        // Translucency (like glass)
    thickness: 0.4,           // How deep light travels through
    envMapIntensity: 1.2,     // Environment map reflection strength
    clearcoat: 0.2,           // Smooth top layer
    clearcoatRoughness: 0.1,  // Subtle top coat blur
    side: THREE.DoubleSide,
  });
}
