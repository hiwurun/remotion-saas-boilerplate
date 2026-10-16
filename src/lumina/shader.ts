export const VERTEX_SHADER = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`;

// Fragment shader ported 1:1 from lumina-interactive-list (glassEffect).
export const FRAGMENT_SHADER = `
precision highp float;
uniform sampler2D uTexture1;
uniform sampler2D uTexture2;
uniform float uProgress;
uniform vec2 uResolution;
uniform vec2 uTexture1Size;
uniform vec2 uTexture2Size;
varying vec2 vUv;

vec2 getCoverUV(vec2 uv, vec2 textureSize) {
  vec2 s = uResolution / textureSize;
  float scale = max(s.x, s.y);
  vec2 scaledSize = textureSize * scale;
  vec2 offset = (uResolution - scaledSize) * 0.5;
  return (uv * uResolution - offset) / scaledSize;
}

vec4 glassEffect(vec2 uv, float progress) {
  float time = progress * 5.0;
  vec2 uv1 = getCoverUV(uv, uTexture1Size);
  vec2 uv2 = getCoverUV(uv, uTexture2Size);
  float maxRadius = length(uResolution) * 0.85;
  float bubbleRadius = progress * maxRadius;
  vec2 p = uv * uResolution;
  vec2 center = uResolution * 0.5;
  float dist = length(p - center);
  float normDist = dist / max(bubbleRadius, 0.001);
  float param = smoothstep(bubbleRadius + 3.0, bubbleRadius - 3.0, dist);
  vec4 img;
  if (param > 0.0) {
    float ro = 0.08 * pow(smoothstep(0.3, 1.0, normDist), 1.5);
    vec2 dir = (p - center) / max(dist, 0.001);
    vec2 distUV = uv2 - dir * ro;
    distUV += vec2(sin(time + normDist * 10.0), cos(time * 0.8 + normDist * 8.0)) * 0.015 * normDist * param;
    float ca = 0.02 * pow(smoothstep(0.3, 1.0, normDist), 1.2);
    img = vec4(
      texture2D(uTexture2, distUV + dir * ca * 1.2).r,
      texture2D(uTexture2, distUV + dir * ca * 0.2).g,
      texture2D(uTexture2, distUV - dir * ca * 0.8).b,
      1.0);
    float rim = smoothstep(0.95, 1.0, normDist) * (1.0 - smoothstep(1.0, 1.01, normDist));
    img.rgb += rim * 0.08;
  } else {
    img = texture2D(uTexture2, uv2);
  }
  if (progress > 0.95) {
    img = mix(img, texture2D(uTexture2, uv2), (progress - 0.95) / 0.05);
  }
  return mix(texture2D(uTexture1, uv1), img, param);
}

void main() { gl_FragColor = glassEffect(vUv, uProgress); }
`;
