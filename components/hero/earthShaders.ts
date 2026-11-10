// GLSL for the hero Earth. Plain three.js ShaderMaterial (GLSL ES 3.00 via three's compatibility macros).
// All lighting is computed in world space; the sun direction is a fixed uniform.

const DITHER = /* glsl */ `
  // blue-noise-ish dither: hides 8-bit banding in the huge dark gradients (atmosphere / vignette)
  float dn = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  gl_FragColor.rgb += (dn - 0.5) / 255.0;
`

const NOISE = /* glsl */ `
  float h21(vec2 p){ p = fract(p * vec2(233.34, 851.73)); p += dot(p, p + 23.45); return fract(p.x * p.y); }
  float vn(vec2 p){
    vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y);
  }
`

const SURFACE_VERT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vN;
  varying vec3 vW;
  void main() {
    vUv = uv;
    vec4 w = modelMatrix * vec4(position, 1.0);
    vW = w.xyz;
    vN = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`

export const earthVert = SURFACE_VERT

export const earthFrag = /* glsl */ `
  uniform sampler2D uDay;
  uniform sampler2D uNight;
  uniform sampler2D uClouds;
  uniform sampler2D uOcean;
  uniform vec3 uSun;
  uniform vec2 uCloudOff;
  varying vec2 vUv;
  varying vec3 vN;
  varying vec3 vW;
  ${NOISE}
  void main() {
    vec3 N = normalize(vN);
    vec3 V = normalize(cameraPosition - vW);
    float ndl = dot(N, uSun);
    float ndv = clamp(dot(N, V), 0.0, 1.0);

    vec3 day = texture2D(uDay, vUv).rgb;
    float ocean = texture2D(uOcean, vUv).r;
    float cl = texture2D(uClouds, vUv + uCloudOff).r;
#ifdef LITE
    float clSh = cl;                                              // weak GPU: no second cloud fetch
#else
    float clSh = texture2D(uClouds, vUv + uCloudOff + vec2(-0.0013, 0.0017)).r;
#endif
    float lights = texture2D(uNight, vUv).r;

    // fine surface detail: the 2k map is soft at this magnification
#ifdef LITE
    float d = vn(vUv * vec2(700.0, 350.0)) - 0.5;                 // weak GPU: one noise octave instead of two
#else
    float d = (vn(vUv * vec2(1500.0, 750.0)) * 0.55 + vn(vUv * vec2(430.0, 215.0)) * 0.45) - 0.5;
#endif
    vec3 alb = day * (1.0 + d * 0.34 * (1.0 - ocean));

    float diff = smoothstep(-0.06, 0.62, ndl);
    vec3 sunCol = vec3(1.0, 0.95, 0.88);
    vec3 col = alb * (vec3(0.010, 0.014, 0.028) + sunCol * diff * 1.45);
    col *= 1.0 - 0.55 * clamp(clSh * 1.25, 0.0, 1.0) * diff;      // cloud shadows on the ground
#ifdef LITE
    // weak GPU: clouds are blended right here, so the separate full-screen cloud pass is skipped
    col = mix(col, vec3(0.96, 0.97, 1.0) * (0.012 + 1.12 * smoothstep(-0.10, 0.60, ndl)), smoothstep(0.06, 0.82, cl) * 0.90);
#endif

    // sun glint on open water
    vec3 H = normalize(uSun + V);
    float nh = max(dot(N, H), 0.0);
    col += vec3(1.0, 0.92, 0.80) * pow(nh, 140.0) * ocean * (1.0 - cl) * step(0.0, ndl) * 1.6;
    col += vec3(0.20, 0.34, 0.62) * pow(nh, 9.0) * ocean * 0.07 * diff;

    // city lights on the night side
    float night = 1.0 - smoothstep(-0.16, 0.10, ndl);
    col += vec3(1.0, 0.64, 0.28) * pow(lights, 1.2) * 3.2 * night * (1.0 - cl * 0.88);

    // atmosphere: haze towards the limb, bright blue rim, warm twilight band at the terminator
    float rim = 1.0 - ndv;
    float sunSide = smoothstep(-0.32, 0.55, ndl);
    vec3 atm = vec3(0.20, 0.48, 1.0);
    col = mix(col, atm * (0.30 + 0.55 * diff), clamp(pow(rim, 3.0) * 0.7, 0.0, 1.0) * sunSide);
    col += atm * pow(rim, 5.0) * 1.25 * (0.22 + 0.78 * sunSide);
    float tw = exp(-pow(ndl / 0.12, 2.0));
    col += vec3(1.0, 0.45, 0.20) * tw * 0.09 * pow(rim, 0.6);

    col *= vec3(0.93, 0.98, 1.05);                                   // cool grade, like the reference photo
    col = vec3(1.0) - exp(-col * 1.2);                              // soft highlight shoulder
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
#ifndef LITE
    ${DITHER}
#endif
  }
`

export const cloudVert = SURFACE_VERT

export const cloudFrag = /* glsl */ `
  uniform sampler2D uClouds;
  uniform vec3 uSun;
  uniform vec2 uCloudOff;
  varying vec2 vUv;
  varying vec3 vN;
  varying vec3 vW;
  void main() {
    float c = texture2D(uClouds, vUv + uCloudOff).r;
    c = smoothstep(0.06, 0.82, c);
    vec3 N = normalize(vN);
    vec3 V = normalize(cameraPosition - vW);
    float ndl = dot(N, uSun);
    float ndv = clamp(dot(N, V), 0.0, 1.0);
    float rim = 1.0 - ndv;
    float diff = smoothstep(-0.10, 0.60, ndl);
    vec3 col = vec3(0.96, 0.97, 1.0) * (0.012 + diff * 1.12);
    col = mix(col, vec3(0.55, 0.76, 1.0) * (0.3 + diff), pow(rim, 2.4) * 0.45);
    float tw = exp(-pow(ndl / 0.12, 2.0));
    col += vec3(1.0, 0.45, 0.20) * tw * 0.22;
    float a = c * (0.90 + 0.10 * rim);
    col = vec3(1.0) - exp(-col * 1.2);
    gl_FragColor = vec4(col, a);
    #include <colorspace_fragment>
  }
`

export const haloVert = /* glsl */ `
  varying vec3 vW;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vW = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`

// The glow is a function of the view ray's closest approach to the planet centre (impact parameter),
// so it is perfectly round and independent of mesh tessellation.
export const haloFrag = /* glsl */ `
  uniform vec3 uSun;
  uniform vec3 uCenter;
  uniform float uRp;
  uniform float uRa;
  uniform float uStrength;
  varying vec3 vW;
  void main() {
    vec3 ro = cameraPosition;
    vec3 rd = normalize(vW - ro);
    float tca = dot(uCenter - ro, rd);
    vec3 closest = ro + rd * tca;
    float h = length(closest - uCenter);
    float a = clamp((h - uRp) / (uRa - uRp), 0.0, 1.0);
    float prof = pow(1.0 - a, 3.2);
    float core = pow(1.0 - a, 14.0);
    vec3 limbN = normalize(closest - uCenter);
    float lit = smoothstep(-0.50, 0.45, dot(limbN, uSun));
    vec3 col = mix(vec3(0.10, 0.32, 0.95), vec3(0.62, 0.84, 1.0), pow(1.0 - a, 5.0));
    float k = (prof * 0.85 + core * 0.9) * (0.10 + 0.90 * lit) * uStrength;
    gl_FragColor = vec4(col * k, 1.0);
    #include <colorspace_fragment>
    ${DITHER}
  }
`

export const starVert = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute vec3 aColor;
  uniform float uTime;
  uniform float uScale;
  uniform float uFade;
  varying vec3 vC;
  varying float vA;
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uScale;
    vC = aColor;
    vA = (0.82 + 0.18 * sin(uTime * (0.5 + aPhase) + aPhase * 40.0)) * uFade;
  }
`

export const starFrag = /* glsl */ `
  varying vec3 vC;
  varying float vA;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.04, d);
    gl_FragColor = vec4(vC * vA, a * vA);
    #include <colorspace_fragment>
  }
`
