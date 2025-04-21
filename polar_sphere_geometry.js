import * as THREE from 'three';

export class PolarSphereGeometry extends THREE.BufferGeometry {
  constructor(radius = 1, widthSegments = 64, heightSegments = 64) {
    super();
    this.type = 'PolarSphereGeometry';

    const vertices = [], normals = [], uvs = [], indices = [];
    for (let y = 0; y <= heightSegments; y++) {
      const v = y / heightSegments;
      for (let x = 0; x <= widthSegments; x++) {
        const u = x / widthSegments;
        const theta = u * Math.PI * 2;
        const phi = v * Math.PI;
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);

        const r = radius;
        const px = -r * cosTheta * sinPhi;
        const py = r * cosPhi;
        const pz = r * sinTheta * sinPhi;

        vertices.push(px, py, pz);
        normals.push(px, py, pz);
        uvs.push(u, v);
      }
    }

    for (let y = 0; y < heightSegments; y++) {
      for (let x = 0; x < widthSegments; x++) {
        const a = (widthSegments + 1) * y + x;
        const b = a + widthSegments + 1;
        indices.push(a, b, a + 1);
        indices.push(b, b + 1, a + 1);
      }
    }

    this.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    this.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    this.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    this.setIndex(indices);
  }
}
