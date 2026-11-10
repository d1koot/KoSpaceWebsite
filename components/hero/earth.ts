// Hero scene: a slowly rotating, realistic Earth seen from low orbit (raw three.js, no React inside).
//   - day map (NASA Blue Marble) + night lights + ocean glint + procedural cloud layer with ground shadows
//   - analytic atmosphere glow (fresnel rim on the surface + impact-parameter halo around the limb)
//   - star field, gentle cursor parallax, optional drag-to-rotate with inertia
// Everything is created by createEarth(); the React wrapper (components/Hero.tsx) only mounts / disposes it.
import {
  AdditiveBlending, BackSide, BufferGeometry, Float32BufferAttribute, Group, Mesh, NoColorSpace,
  NoToneMapping, PerspectiveCamera, Points, RepeatWrapping, Scene, ShaderMaterial, SphereGeometry,
  SRGBColorSpace, TextureLoader, Vector2, Vector3, WebGLRenderer,
} from 'three'
import type { Texture } from 'three'
import { cloudFrag, cloudVert, earthFrag, earthVert, haloFrag, haloVert, starFrag, starVert } from './earthShaders'

export interface EarthOptions {
  /** element that receives pointer input (the hero section) */
  events: HTMLElement
  mobile: boolean
  reduced: boolean
  /** weak device: DPR 1, no MSAA, simpler shader, one-pass clouds, fewer stars */
  lite?: boolean
  /** called once the first frame is on screen (textures loaded, shaders compiled) */
  onReady?: () => void
  /** called when the GL context is lost for good */
  onLost?: () => void
}

export interface EarthHandle {
  setVisible(v: boolean): void
  /** hero scroll progress 0..1 (used to push the planet back while scrolling away) */
  setProgress(p: number): void
  dispose(): void
}

const TEX = '/textures/'
const FOV = 30
const SUN = new Vector3(-0.78, 0.60, -0.10).normalize()   // grazing light from the upper left: bright limb, terminator at the lower right
const SPIN = 0.013                                          // rad / s  (~8 min per revolution)
const CLOUD_DRIFT = 0.0006                                  // uv / s, clouds slowly outrun the ground

const MAX_PX = 2.4e6                                        // max rendered pixels (~1080p at DPR 1.1)
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

/** Where the planet sits in the frame (px): centre cx,cy and apparent radius r. Mirrors the horizon in the reference. */
function framing(W: number, H: number) {
  if (W / H >= 1.25) {
    const r = 1.09 * W
    return { r, cx: 0.98 * W, cy: 0.07 * H + r }
  }
  const r = 1.18 * Math.max(W, 0.78 * H) // portrait: shallower horizon through the lower half
  return { r, cx: 0.9 * W, cy: 0.5 * H + r }
}

export async function createEarth(host: HTMLElement, o: EarthOptions): Promise<EarthHandle> {
  const lite = !!o.lite
  const renderer = new WebGLRenderer({ antialias: !o.mobile && !lite, alpha: false, powerPreference: 'high-performance' })
  const dprCap = lite ? 1 : o.mobile ? 1.25 : 1.25   // the planet is soft by nature: 1.25 looks the same as 1.5 at ~30% fewer pixels
  let dprNow = Math.min(window.devicePixelRatio || 1, dprCap)
  renderer.setPixelRatio(dprNow)
  renderer.setClearColor(0x000000, 1)
  renderer.toneMapping = NoToneMapping
  const canvas = renderer.domElement
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block'
  host.appendChild(canvas)

  const scene = new Scene()
  const camera = new PerspectiveCamera(FOV, 1, 0.05, 400)

  // ---- textures (self-hosted, see public/textures/CREDITS.txt)
  const loader = new TextureLoader()
  const aniso = Math.min(lite ? 2 : 4, renderer.capabilities.getMaxAnisotropy())
  const load = (file: string, srgb: boolean) =>
    loader.loadAsync(TEX + file).then((t: Texture) => {
      t.colorSpace = srgb ? SRGBColorSpace : NoColorSpace
      t.wrapS = RepeatWrapping
      t.anisotropy = aniso
      return t
    })
  let day: Texture, night: Texture, clouds: Texture, ocean: Texture
  try {
    ;[day, night, clouds, ocean] = await Promise.all([
      load('earth_day_2k.jpg', true), load('earth_night_2k.jpg', false),
      load('earth_clouds_2k.webp', false), load('earth_ocean_1k.webp', false),
    ])
  } catch (err) {
    renderer.dispose()
    canvas.remove()
    throw err
  }

  // ---- scene graph:  world(scale intro, parallax) > tilt(axis) > spin(rotation) > earth + clouds
  const world = new Group()
  const tilt = new Group()
  const spin = new Group()
  scene.add(world)
  world.add(tilt)
  tilt.add(spin)

  const seg = lite ? 80 : o.mobile ? 96 : 128
  const sphere = new SphereGeometry(1, seg, seg / 2)
  const cloudOff = new Vector2(0, 0)
  const sun = SUN.clone()

  const earthMat = new ShaderMaterial({
    vertexShader: earthVert, fragmentShader: earthFrag, defines: lite ? { LITE: '' } : {},
    uniforms: { uDay: { value: day }, uNight: { value: night }, uClouds: { value: clouds }, uOcean: { value: ocean }, uSun: { value: sun }, uCloudOff: { value: cloudOff } },
  })
  const earth = new Mesh(sphere, earthMat)
  spin.add(earth)

  const cloudMat = new ShaderMaterial({
    vertexShader: cloudVert, fragmentShader: cloudFrag, transparent: true, depthWrite: false,
    uniforms: { uClouds: { value: clouds }, uSun: { value: sun }, uCloudOff: { value: cloudOff } },
  })
  const cloudMesh = new Mesh(sphere, cloudMat)
  cloudMesh.scale.setScalar(1.0075)
  cloudMesh.renderOrder = 1
  cloudMesh.visible = !lite   // lite: clouds are drawn inside the earth shader (one pass instead of two)
  spin.add(cloudMesh)

  const RA = 1.085
  const haloMat = new ShaderMaterial({
    vertexShader: haloVert, fragmentShader: haloFrag, transparent: true, depthWrite: false,
    side: BackSide, blending: AdditiveBlending,
    uniforms: { uSun: { value: sun }, uCenter: { value: new Vector3() }, uRp: { value: 1 }, uRa: { value: RA }, uStrength: { value: 1 } },
  })
  const halo = new Mesh(new SphereGeometry(RA, 96, 48), haloMat)
  halo.renderOrder = 2
  world.add(halo)

  // ---- stars: scattered in a wide cone around the view axis (cheap, all of them are visible)
  const starCount = o.mobile ? 700 : lite ? 1200 : 2600
  const pos = new Float32Array(starCount * 3)
  const size = new Float32Array(starCount)
  const phase = new Float32Array(starCount)
  const tint = new Float32Array(starCount * 3)
  for (let i = 0; i < starCount; i++) {
    const cosT = 1 - Math.random() * (1 - Math.cos(0.95)) // cone half-angle ~54 deg
    const sinT = Math.sqrt(1 - cosT * cosT), p = Math.random() * Math.PI * 2
    const R = 90
    pos.set([Math.cos(p) * sinT * R, Math.sin(p) * sinT * R, -cosT * R + 0], i * 3)
    const big = Math.random()
    size[i] = big > 0.985 ? 3.4 : big > 0.88 ? 2.3 : 1.5 + Math.random() * 0.6
    phase[i] = Math.random()
    const warm = Math.random()
    const b = 0.5 + Math.pow(Math.random(), 2.0) * 0.5
    tint.set(warm > 0.8 ? [b, b * 0.9, b * 0.78] : warm > 0.45 ? [b * 0.82, b * 0.9, b] : [b, b, b], i * 3)
  }
  const starGeo = new BufferGeometry()
  starGeo.setAttribute('position', new Float32BufferAttribute(pos, 3))
  starGeo.setAttribute('aSize', new Float32BufferAttribute(size, 1))
  starGeo.setAttribute('aPhase', new Float32BufferAttribute(phase, 1))
  starGeo.setAttribute('aColor', new Float32BufferAttribute(tint, 3))
  const starMat = new ShaderMaterial({
    vertexShader: starVert, fragmentShader: starFrag, transparent: true, depthWrite: false, blending: AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uScale: { value: renderer.getPixelRatio() }, uFade: { value: 0 } },
  })
  const stars = new Points(starGeo, starMat)
  stars.frustumCulled = false
  stars.position.set(0, 0, 0)
  scene.add(stars)

  // ---- orientation: Europe / Russia come into view first, north pole tipped towards the camera
  const AXIS_TILT = 0.41
  const VIEW_PITCH = 0.62
  tilt.rotation.set(VIEW_PITCH, 0, AXIS_TILT)
  let yaw = -2.2          // rad, which longitude faces the camera
  let pitchOff = 0
  let yawVel = 0          // user-added angular velocity (inertia), rad/s
  let R_px = 1000

  // ---- sizing: the planet is shifted with a lens-shift (view offset) so its centre sits below / right of the frame
  let W = 1, H = 1
  const resize = () => {
    W = Math.max(1, host.clientWidth)
    H = Math.max(1, host.clientHeight)
    const want = Math.min(dprNow, Math.sqrt(MAX_PX / (W * H)))   // pixel budget: big / hi-dpi screens render fewer pixels, the planet is soft anyway
    if (Math.abs(want - renderer.getPixelRatio()) > 0.01) renderer.setPixelRatio(want)
    renderer.setSize(W, H, false)
    camera.aspect = W / H
    const f = framing(W, H)
    R_px = f.r
    const focal = H / 2 / Math.tan((FOV * Math.PI) / 360)
    const rho = Math.atan(f.r / focal)
    const dist = 1 / Math.sin(rho)
    camera.position.set(0, 0, dist)
    camera.lookAt(0, 0, 0)
    camera.setViewOffset(W, H, W / 2 - f.cx, H / 2 - f.cy, W, H)
    camera.updateProjectionMatrix()
    starMat.uniforms.uScale.value = renderer.getPixelRatio()
    if (!running) draw()
  }

  // ---- input: cursor parallax + drag to rotate
  const ptr = { x: 0, y: 0, sx: 0, sy: 0 }
  let dragging = false, lastX = 0, lastY = 0, lastT = 0, pid = -1
  const onMove = (e: PointerEvent) => {
    ptr.x = (e.clientX / window.innerWidth) * 2 - 1
    ptr.y = (e.clientY / window.innerHeight) * 2 - 1
    if (!dragging || e.pointerId !== pid) return
    const now = performance.now()
    const dx = e.clientX - lastX, dy = e.clientY - lastY
    const k = 0.9 / R_px
    yaw += dx * k
    pitchOff = clamp(pitchOff + dy * k * 0.8, -0.32, 0.32)
    const dt = Math.max(1, now - lastT) / 1000
    yawVel = yawVel * 0.6 + ((dx * k) / dt) * 0.4
    lastX = e.clientX; lastY = e.clientY; lastT = now
  }
  const onDown = (e: PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return
    if ((e.target as HTMLElement).closest('a,button')) return
    dragging = true; pid = e.pointerId
    lastX = e.clientX; lastY = e.clientY; lastT = performance.now(); yawVel = 0
    o.events.setAttribute('data-drag', '1')
    try { o.events.setPointerCapture(e.pointerId) } catch { /* ignore */ }
  }
  const onUp = (e: PointerEvent) => {
    if (e.pointerId !== pid) return
    dragging = false; pid = -1
    o.events.removeAttribute('data-drag')
    if (performance.now() - lastT > 90) yawVel = 0 // finger rested before release: no fling
  }
  if (!o.reduced) {
    window.addEventListener('pointermove', onMove, { passive: true })
    o.events.addEventListener('pointerdown', onDown)
    o.events.addEventListener('pointerup', onUp)
    o.events.addEventListener('pointercancel', onUp)
  }

  // ---- frame
  let running = false
  let visible = true
  let disposed = false
  let progress = 0
  let introT = o.reduced ? 1 : 0
  let last = 0
  let elapsed = 0

  const draw = () => {
    const ease = easeOut(clamp(introT, 0, 1))
    // parallax: planet moves a little more than the stars
    ptr.sx += (ptr.x - ptr.sx) * 0.05
    ptr.sy += (ptr.y - ptr.sy) * 0.05
    world.position.set(ptr.sx * -0.018, ptr.sy * 0.011, 0)
    stars.position.set(ptr.sx * -0.35, ptr.sy * 0.2, 0)
    // intro "settle" + scroll push-back
    const s = 1.07 - 0.07 * ease - progress * 0.04
    world.scale.setScalar(s)
    starMat.uniforms.uFade.value = clamp(introT * 1.2, 0, 1) * (1 - progress * 0.8)
    // the halo shader works in world units: keep it in sync with the scaled / shifted planet
    haloMat.uniforms.uRp.value = s
    haloMat.uniforms.uRa.value = RA * s
    haloMat.uniforms.uCenter.value.copy(world.position)
    haloMat.uniforms.uStrength.value = 0.35 + 0.65 * ease
    spin.rotation.y = yaw
    tilt.rotation.x = VIEW_PITCH + pitchOff + ptr.sy * 0.012
    starMat.uniforms.uTime.value = elapsed
    renderer.render(scene, camera)
  }

  // adaptive resolution: if the machine cannot hold the frame rate, render fewer pixels (CSS size is unchanged)
  const DPR_MIN = 0.6
  let warm = 40, win = 0, sum = 0
  let liteNow = lite
  // still too slow after lowering the resolution: switch to the one-pass cloud shader (one recompile, then cheaper per pixel)
  const goLite = () => {
    liteNow = true
    earthMat.defines = { LITE: '' }
    earthMat.needsUpdate = true
    cloudMesh.visible = false
  }
  const adapt = (ms: number, capped: boolean) => {
    if (dprNow <= DPR_MIN || ms > 200) return           // ignore tab-switch gaps
    if (warm > 0) { warm--; return }                    // skip shader compile / texture upload hitches
    sum += ms
    if (++win < 45) return
    const avg = sum / win
    win = 0; sum = 0
    if (avg > (capped ? 42 : 25)) {                     // below ~40 fps (or below 24 fps when capped to 30)
      dprNow = Math.max(DPR_MIN, +(Math.min(dprNow, renderer.getPixelRatio()) * 0.8).toFixed(2))
      resize()
      starMat.uniforms.uScale.value = renderer.getPixelRatio()
      warm = 20
      if (!liteNow && dprNow <= 0.75) goLite()
    }
  }

  const tick = (t: number) => {
    // 30 fps on every device while nothing is being dragged: the planet turns once per 8 minutes, so 60 fps is wasted GPU time
    const idle = !dragging && Math.abs(yawVel) < 0.02 && introT >= 1
    const gap = last ? t - last : 0
    if (idle && gap && gap < 30) return
    adapt(gap || 16.7, idle)
    const dt = Math.min(0.05, last ? gap / 1000 : 0.016)
    last = t
    elapsed += dt
    if (introT < 1) introT = Math.min(1, introT + dt / 5.5)
    if (!dragging) {
      yaw += (SPIN + yawVel) * dt
      yawVel *= Math.exp(-dt * 2.4)
      pitchOff += (0 - pitchOff) * Math.min(1, dt * 0.9)
    }
    cloudOff.x = (cloudOff.x + CLOUD_DRIFT * dt) % 1
    draw()
  }

  const start = () => {
    if (running || disposed || o.reduced) return
    running = true
    last = 0
    renderer.setAnimationLoop(tick)
  }
  const stop = () => {
    if (!running) return
    running = false
    renderer.setAnimationLoop(null)
  }

  const ro = new ResizeObserver(() => resize())
  ro.observe(host)
  const lost = (e: Event) => { e.preventDefault(); stop(); o.onLost?.() }
  canvas.addEventListener('webglcontextlost', lost)

  resize()
  try { await renderer.compileAsync(scene, camera) } catch { /* first render compiles synchronously */ }
  if (disposed) return { setVisible() {}, setProgress() {}, dispose() {} }
  draw()
  o.onReady?.()
  if (!o.reduced) start()

  return {
    setVisible(v: boolean) {
      visible = v
      if (v) { if (!o.reduced) start(); else draw() } else stop()
    },
    setProgress(p: number) {
      progress = clamp(p, 0, 1)
      if (!running && visible) draw()
    },
    dispose() {
      disposed = true
      stop()
      ro.disconnect()
      window.removeEventListener('pointermove', onMove)
      o.events.removeEventListener('pointerdown', onDown)
      o.events.removeEventListener('pointerup', onUp)
      o.events.removeEventListener('pointercancel', onUp)
      o.events.removeAttribute('data-drag')
      canvas.removeEventListener('webglcontextlost', lost)
      sphere.dispose(); halo.geometry.dispose(); starGeo.dispose()
      earthMat.dispose(); cloudMat.dispose(); haloMat.dispose(); starMat.dispose()
      day.dispose(); night.dispose(); clouds.dispose(); ocean.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      canvas.remove()
    },
  }
}
