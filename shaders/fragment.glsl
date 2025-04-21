precision mediump float;

uniform vec3 uColor;
uniform sampler2D uTexture;
uniform bool uUseTexture;
uniform float uTime;

varying vec3 vNormal;
varying vec2 vUv;

void main() {
  vec2 uv = gl_PointCoord * 2.0 - 1.0;
  if (dot(uv, uv) > 1.0) discard;
  
  float light = dot(normalize(vNormal), vec3(0, 1.0, 0.5)) * 0.5 + 0.5;
  float alpha = 1.0 - smoothstep(0.8, 1.0, dot(uv, uv));
  
  // Polar swirl UV mapping
  float angle = atan(vUv.y - 0.5, vUv.x - 0.5);
  float radius = length(vUv - vec2(0.5));
  vec2 polarUV = vec2(angle / (2.0 * 3.1415926) + 0.5, radius);

  polarUV.x += uTime * 0.05;
  vec2 finalUV = polarUV + vNormal.xy * 0.05;

  vec3 finalColor = uUseTexture ? texture2D(uTexture, finalUV).rgb : uColor;
  gl_FragColor = vec4(finalColor * light, alpha);
}
