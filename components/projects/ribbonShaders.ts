// GLSL for the apps ribbon: bent cards (vertex-shader bend + scroll-velocity distortion) and the fogged grid floor.

// Each card is a flat plane. Its x coordinate (+ the card's offset along the strip) is the arc length u on a
// cylinder of radius uRb whose axis lies behind the strip, so the middle faces the camera and the sides turn away.
export const cardVert = /* glsl */ `
  uniform float uOffset;   // card centre along the strip, world units (already includes scroll)
  uniform float uContent;  // card index * spacing: keeps the flutter attached to the strip content
  uniform float uRb;       // bend radius
  uniform float uVel;      // smoothed scroll velocity, cards / s (signed)
  varying vec2 vUv;
  varying float vShade;
  void main() {
    vUv = uv;
    float y = position.y;
    float u0 = uOffset + position.x;
    // velocity distortion: a travelling wave along the strip + a lean (shear) of the cards in the direction of travel
    y += sin((u0 - uOffset + uContent) * 1.0) * uVel * 0.095;
    float u = u0 + position.y * uVel * 0.06;
    float th = u / uRb;
    vec3 p = vec3(uRb * sin(th), y, uRb * (cos(th) - 1.0));
    vShade = mix(1.0, 0.70, smoothstep(0.15, 1.05, abs(th)));
    gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
  }
`

export const cardFrag = /* glsl */ `
  uniform sampler2D uTex;
  uniform float uAspect;
  uniform float uRadius;
  uniform float uHover;
  uniform float uFade;
  uniform float uFocus;
  varying vec2 vUv;
  varying float vShade;
  void main() {
    vec2 size = vec2(uAspect, 1.0);
    vec2 q = (vUv - 0.5) * size;
    vec2 d2 = abs(q) - (size * 0.5 - vec2(uRadius));
    float sd = length(max(d2, 0.0)) + min(max(d2.x, d2.y), 0.0) - uRadius;   // rounded-rect distance
    float aa = max(fwidth(sd), 1e-5);
    float mask = 1.0 - smoothstep(-aa, aa, sd);
    vec2 uv = (vUv - 0.5) / (1.0 + 0.05 * uHover) + 0.5;                      // slow zoom on hover
    vec3 c = texture2D(uTex, uv).rgb * vShade * (1.0 + 0.10 * uHover);
    float ring = (1.0 - smoothstep(0.0, aa * 1.6, abs(sd + 0.03))) * uFocus;  // keyboard focus ring
    c = mix(c, vec3(1.0), ring);
    gl_FragColor = vec4(c, mask * uFade);
    #include <colorspace_fragment>
  }
`

export const floorVert = /* glsl */ `
  varying vec3 vW;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vW = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`

export const floorFrag = /* glsl */ `
  uniform float uScroll;
  uniform float uCell;
  varying vec3 vW;
  void main() {
    vec2 coord = vec2(vW.x + uScroll, vW.z) / uCell;
    vec2 gw = max(fwidth(coord), vec2(1e-5));
    vec2 g = abs(fract(coord - 0.5) - 0.5) / gw;
    float line = min(g.x, g.y);
    float a = 1.0 - clamp(line - 0.35, 0.0, 1.0);
    a *= 1.0 - smoothstep(0.30, 0.85, max(gw.x, gw.y));                        // thin distant lines fade instead of shimmering
    float dist = length(vW.xz - cameraPosition.xz);
    float fog = 1.0 - smoothstep(3.0, 20.0, dist);
    float side = exp(-pow(vW.x / 16.0, 2.0));
    float k = a * fog * side * 0.030;   // linear value, ~#2a2a2a at full strength after the sRGB encode
    gl_FragColor = vec4(vec3(1.0) * k, 1.0);
    #include <colorspace_fragment>
  }
`
