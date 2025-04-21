const GrainShader = {
  uniforms: {
    'tDiffuse': { value: null },
    'amount': { value: 0.25 },
    'time': { value: 0.0 }
  },

  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float amount;
    uniform float time;
    varying vec2 vUv;

    float random(vec2 p) {
      vec2 k1 = vec2(
        23.14069263277926,
        2.665144142690225
      );
      return fract(
        cos(dot(p, k1)) * 12345.6789
      );
    }

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      vec2 uvRandom = vUv;
      uvRandom.y *= random(vec2(uvRandom.y, time));
      color.rgb += random(uvRandom) * amount;
      gl_FragColor = color;
    }
  `
};

export { GrainShader }; 