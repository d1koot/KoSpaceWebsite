// "Open Sources" scene: a horizontal ribbon of cards bent along a curve in a vertex shader, over a fogged grid floor.
// Raw three.js, rendered on demand (the loop only runs while something moves) and paused when off-screen.
// Input: mouse drag, wheel, touch swipe with inertia, arrow keys; always snaps to the nearest card.
import {
  AdditiveBlending, CanvasTexture, Group, Mesh, PerspectiveCamera, PlaneGeometry, Scene, ShaderMaterial,
  SRGBColorSpace, Vector3, WebGLRenderer, NoToneMapping, LinearMipmapLinearFilter, LinearFilter,
} from 'three'
import type { Texture } from 'three'
import { cardFrag, cardVert, floorFrag, floorVert } from './ribbonShaders'
import { paletteFor } from './apps'

export interface RibbonApp { title: string; image: string | null }

export interface RibbonOptions {
  apps: RibbonApp[]
  initial: number
  mobile: boolean
  /** the active (snapped) card changed */
  onIndex?: (i: number) => void
  /** the active card was clicked / tapped */
  onOpen?: (i: number) => void
  /** first frame is on screen */
  onReady?: () => void
  onLost?: () => void
  /** should wheel / arrow keys be captured right now? (section roughly centred in the viewport) */
  engaged: () => boolean
}

export interface RibbonHandle {
  setVisible(v: boolean): void
  goTo(i: number): void
  /** keyboard focus ring on card i (-1 = none); also centres it */
  setFocus(i: number): void
  dispose(): void
}

// ---- layout (world units)
const CW = 2.86            // card width
const CH = 2.0             // card height
const GAP = 0.3
const SP = CW + GAP        // card spacing along the strip
const RB = 6.2             // bend radius
const FOV = 32
const CAM_Y = 0.12
const FLOOR_Y = -1.3
const RADIUS = 0.075       // corner radius (height units: card height = 1)
const TEX_W = 1280
const TEX_H = Math.round(TEX_W * (CH / CW))

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const sstep = (a: number, b: number, v: number) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t) }

// ---------------------------------------------------------------- card textures (2D canvas -> texture)
function drawCard(app: RibbonApp, index: number, img: HTMLImageElement | null, fontOk: boolean): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = TEX_W; c.height = TEX_H
  const g = c.getContext('2d')!
  const W = TEX_W, H = TEX_H

  if (img && img.naturalWidth) {
    // object-fit: cover
    const s = Math.max(W / img.naturalWidth, H / img.naturalHeight)
    const w = img.naturalWidth * s, h = img.naturalHeight * s
    g.drawImage(img, (W - w) / 2, (H - h) / 2, w, h)
  } else {
    // dark gradient placeholder + big faint numeral
    const [c1, c2] = paletteFor(index)
    const bg = g.createRadialGradient(W * 0.2, 0, 0, W * 0.2, 0, W * 1.05)
    bg.addColorStop(0, c1); bg.addColorStop(0.7, c2); bg.addColorStop(1, '#05060b')
    g.fillStyle = bg; g.fillRect(0, 0, W, H)
    g.fillStyle = 'rgba(255,255,255,.07)'
    g.font = `200 ${Math.round(H * 0.62)}px ${fontOk ? 'Montserrat,' : ''} system-ui, sans-serif`
    g.textAlign = 'center'; g.textBaseline = 'middle'
    g.fillText(String(index + 1).padStart(2, '0'), W / 2, H * 0.5)
  }

  // legibility gradient at the bottom
  const sh = g.createLinearGradient(0, H * 0.52, 0, H)
  sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,.6)')
  g.fillStyle = sh; g.fillRect(0, 0, W, H)

  // title, bottom-left
  const pad = Math.round(H * 0.07)
  g.textAlign = 'left'; g.textBaseline = 'alphabetic'
  g.fillStyle = '#fff'
  g.font = `400 ${Math.round(H * 0.064)}px ${fontOk ? 'Montserrat,' : ''} system-ui, sans-serif`
  g.fillText(app.title, pad, H - pad - H * 0.012)

  // round black arrow button, bottom-right
  const r = H * 0.056
  const cx = W - pad - r + 4, cy = H - pad - r + 6
  g.fillStyle = '#000'
  g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill()
  g.strokeStyle = 'rgba(255,255,255,.22)'; g.lineWidth = 2; g.stroke() // hairline ring keeps the button readable on dark covers
  g.strokeStyle = '#fff'; g.lineWidth = Math.max(2.5, H * 0.0055); g.lineCap = 'round'; g.lineJoin = 'round'
  const a = r * 0.42
  g.beginPath(); g.moveTo(cx - a, cy); g.lineTo(cx + a, cy); g.moveTo(cx + a * 0.15, cy - a * 0.85); g.lineTo(cx + a, cy); g.lineTo(cx + a * 0.15, cy + a * 0.85); g.stroke()
  return c
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((res) => {
    const im = new Image()
    im.decoding = 'async'
    im.onload = () => res(im)
    im.onerror = () => res(null)
    im.src = src
  })
}

async function fontsReady(): Promise<boolean> {
  try {
    const f = (document as any).fonts
    if (!f || !f.load) return false
    await Promise.race([f.load('400 40px Montserrat', 'App 01 Приложение'), new Promise((r) => setTimeout(r, 1800))])
    return f.check('400 40px Montserrat')
  } catch { return false }
}

// ---------------------------------------------------------------- scene
export async function createRibbon(host: HTMLElement, o: RibbonOptions): Promise<RibbonHandle> {
  const N = o.apps.length
  const renderer = new WebGLRenderer({ antialias: !o.mobile, alpha: false, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, o.mobile ? 1.25 : 1.5))
  renderer.setClearColor(0x000000, 1)
  renderer.toneMapping = NoToneMapping
  const canvas = renderer.domElement
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block'
  host.appendChild(canvas)

  const scene = new Scene()
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 120)

  // textures first (fonts + images), so the first frame is complete
  const fontOk = await fontsReady()
  const imgs = await Promise.all(o.apps.map((a) => (a.image ? loadImage(a.image) : Promise.resolve(null))))
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy())
  const textures: Texture[] = o.apps.map((a, i) => {
    const t = new CanvasTexture(drawCard(a, i, imgs[i], fontOk))
    t.colorSpace = SRGBColorSpace
    t.anisotropy = aniso
    t.generateMipmaps = true
    t.minFilter = LinearMipmapLinearFilter
    t.magFilter = LinearFilter
    return t
  })

  // cards
  const cardGeo = new PlaneGeometry(CW, CH, o.mobile ? 36 : 64, 2)
  const group = new Group()
  scene.add(group)
  const cards = o.apps.map((_, i) => {
    const mat = new ShaderMaterial({
      vertexShader: cardVert, fragmentShader: cardFrag, transparent: true, depthWrite: false, depthTest: false,
      uniforms: {
        uTex: { value: textures[i] }, uOffset: { value: 0 }, uContent: { value: i * SP }, uRb: { value: RB }, uVel: { value: 0 },
        uAspect: { value: CW / CH }, uRadius: { value: RADIUS }, uHover: { value: 0 }, uFade: { value: 0 }, uFocus: { value: 0 },
      },
    })
    const m = new Mesh(cardGeo, mat)
    m.frustumCulled = false // the bend happens in the shader, so the CPU bounding box is wrong
    group.add(m)
    return { mesh: m, mat, hover: 0, offset: 0 }
  })

  // grid floor
  const floorGeo = new PlaneGeometry(140, 140, 1, 1)
  const floorMat = new ShaderMaterial({
    vertexShader: floorVert, fragmentShader: floorFrag, transparent: true, depthWrite: false, depthTest: false, blending: AdditiveBlending,
    uniforms: { uScroll: { value: 0 }, uCell: { value: 0.6 } },
  })
  const floor = new Mesh(floorGeo, floorMat)
  floor.rotation.x = -Math.PI / 2
  floor.position.set(0, FLOOR_Y, -30)
  floor.renderOrder = -1
  scene.add(floor)

  // ---------------------------------------------------------------- state
  let pos = clamp(o.initial, 0, N - 1)   // continuous index
  let vel = 0                            // cards / s
  let target = Math.round(pos)
  let velSm = 0                          // smoothed, drives the distortion
  let energy = 0                         // 0..1, how fast the strip is moving: zoom-in, tighter bend, stronger wave
  let rb = RB                            // live bend radius (tightens with energy)
  let lift = 0                           // cards pushed towards the camera while moving
  let snapT = 0                          // timer: magnetic snap after the wheel pauses
  let active = Math.round(pos)
  let introT = 0
  let focus = -1
  let W = 1, H = 1, pxPerCard = 400
  let running = false, visible = true, disposed = false
  const ptr = { x: 0, y: 0, sx: 0, sy: 0, inside: false, px: 0, py: 0 }
  let hoverIdx = -1

  // JS twin of the vertex-shader bend (used for hit testing)
  const bend = (u: number, y: number, v: Vector3) => { const th = u / rb; return v.set(rb * Math.sin(th), y, rb * (Math.cos(th) - 1) + lift) }
  const tmp = new Vector3()
  const poly: [number, number][] = []
  const hit = (cx: number, cy: number): number => {
    const r = host.getBoundingClientRect()
    const x = cx - r.left, y = cy - r.top
    let best = -1, bestD = 1e9
    for (let i = 0; i < N; i++) {
      const u0 = cards[i].offset
      if (Math.abs(u0) > SP * 2.6) continue
      poly.length = 0
      const steps = 10
      for (let k = 0; k <= steps; k++) { bend(u0 - CW / 2 + (CW * k) / steps, CH / 2, tmp).project(camera); poly.push([(tmp.x + 1) / 2 * W, (1 - tmp.y) / 2 * H]) }
      for (let k = steps; k >= 0; k--) { bend(u0 - CW / 2 + (CW * k) / steps, -CH / 2, tmp).project(camera); poly.push([(tmp.x + 1) / 2 * W, (1 - tmp.y) / 2 * H]) }
      let inside = false
      for (let a = 0, b = poly.length - 1; a < poly.length; b = a++) {
        const [xa, ya] = poly[a], [xb, yb] = poly[b]
        if ((ya > y) !== (yb > y) && x < ((xb - xa) * (y - ya)) / (yb - ya) + xa) inside = !inside
      }
      if (inside && Math.abs(u0) < bestD) { best = i; bestD = Math.abs(u0) }
    }
    return best
  }

  // ---------------------------------------------------------------- sizing
  const resize = () => {
    W = Math.max(1, host.clientWidth); H = Math.max(1, host.clientHeight)
    renderer.setSize(W, H, false)
    camera.aspect = W / H
    // keep the centre card fully visible on narrow viewports
    const tanHalf = Math.tan((FOV * Math.PI) / 360)
    const dist = Math.max(6.2, CW / 0.78 / (2 * tanHalf * camera.aspect))
    camera.userData.dist = dist
    camera.updateProjectionMatrix()
    pxPerCard = (SP * H) / (2 * dist * tanHalf)
    kick()
  }

  // ---------------------------------------------------------------- frame
  const render = () => {
    const dist: number = camera.userData.dist || 6.2
    ptr.sx += (ptr.x - ptr.sx) * 0.08
    ptr.sy += (ptr.y - ptr.sy) * 0.08
    camera.position.set(ptr.sx * 0.35, CAM_Y - ptr.sy * 0.12, dist)
    // while the strip travels the cards swell towards the camera and ease back as it settles (the grid floor stays put)
    lift = dist * 0.13 * energy
    group.position.z = lift
    rb = RB * (1 - 0.16 * energy)
    camera.lookAt(0, 0.0, 0)

    const ease = 1 - Math.pow(1 - clamp(introT, 0, 1), 3)
    const spread = 1 + (1 - ease) * 0.28
    const fadeEnd = SP * 2.7
    for (let i = 0; i < N; i++) {
      const c = cards[i]
      c.offset = (i - pos) * SP * spread
      const u = c.mat.uniforms
      u.uOffset.value = c.offset
      u.uVel.value = velSm
      u.uRb.value = rb
      u.uFade.value = (1 - sstep(SP * 1.25, fadeEnd, Math.abs(c.offset))) * ease
      c.hover += ((hoverIdx === i ? 1 : 0) - c.hover) * 0.14
      u.uHover.value = c.hover
      u.uFocus.value = focus === i ? 1 : 0
    }
    renderer.render(scene, camera)
  }

  let last = 0
  const tick = (t: number) => {
    const dt = Math.min(0.05, last ? (t - last) / 1000 : 0.016)
    last = t
    if (introT < 1) introT = Math.min(1, introT + dt / 1.3)

    if (!dragging) {
      // critically damped glide towards the target: slow ramp-up, long soft tail (~2 s per gesture, like the reference).
      // It keeps the release velocity, so a fling carries on over several cards.
      const w = 3.4, k = w * w, c = 2 * w
      const sub = 3, h = dt / sub
      for (let s = 0; s < sub; s++) {
        const acc = k * (target - pos) - c * vel
        vel += acc * h
        pos += vel * h
      }
    } else {
      vel *= Math.exp(-dt * 8) // finger / cursor holds still: the distortion relaxes
    }
    velSm += (clamp(vel, -3, 3) - velSm) * (1 - Math.exp(-dt * 14))
    energy += (clamp(Math.abs(velSm) / 2.4, 0, 1) - energy) * (1 - Math.exp(-dt * 3.2))

    const idx = clamp(Math.round(pos), 0, N - 1)
    if (idx !== active) { active = idx; o.onIndex?.(idx) }

    render()

    const settled = !dragging && !down && Math.abs(vel) < 0.005 && Math.abs(target - pos) < 0.0012 && Math.abs(velSm) < 0.006 && energy < 0.004 &&
      introT >= 1 && Math.abs(ptr.x - ptr.sx) < 0.002 && Math.abs(ptr.y - ptr.sy) < 0.002 &&
      cards.every((c, i) => Math.abs((hoverIdx === i ? 1 : 0) - c.hover) < 0.01)
    if (settled) { pos = target; vel = 0; velSm = 0; energy = 0; render(); stop() }
  }
  const kick = () => {
    if (running || disposed || !visible) return
    running = true; last = 0
    renderer.setAnimationLoop(tick)
  }
  const stop = () => {
    if (!running) return
    running = false
    renderer.setAnimationLoop(null)
  }

  // ---------------------------------------------------------------- input
  let down = false, dragging = false
  let sx = 0, sy = 0, startPos = 0, lastX = 0, lastT = 0, pid = -1
  const rubber = (p: number) => (p < 0 ? p * 0.4 : p > N - 1 ? N - 1 + (p - (N - 1)) * 0.4 : p)

  const setTarget = (i: number) => { target = clamp(Math.round(i), 0, N - 1); kick() }

  const onDown = (e: PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    down = true; dragging = false; pid = e.pointerId
    sx = lastX = e.clientX; sy = e.clientY; startPos = pos; lastT = performance.now()
    vel = 0
  }
  const onMove = (e: PointerEvent) => {
    const r = host.getBoundingClientRect()
    ptr.inside = true
    ptr.x = ((e.clientX - r.left) / r.width) * 2 - 1
    ptr.y = ((e.clientY - r.top) / r.height) * 2 - 1
    ptr.px = e.clientX; ptr.py = e.clientY
    if (down && e.pointerId === pid) {
      const dx = e.clientX - sx, dy = e.clientY - sy
      if (!dragging && Math.abs(dx) > 5 && Math.abs(dx) > Math.abs(dy)) {
        dragging = true
        hoverIdx = -1
        host.style.cursor = ''
        try { host.setPointerCapture(e.pointerId) } catch { /* ignore */ }
        host.setAttribute('data-drag', '1')
      }
      if (dragging) {
        const prev = pos
        pos = rubber(startPos - dx / pxPerCard)
        const now = performance.now()
        const dt = Math.max(1, now - lastT) / 1000
        vel = lerp(vel, (pos - prev) / dt, 0.4)
        lastT = now
        lastX = e.clientX
      }
    }
    if (!dragging) scheduleHover()
    kick()
  }
  const finish = (e: PointerEvent, cancelled: boolean) => {
    if (e.pointerId !== pid) return
    const wasDrag = dragging
    down = false; dragging = false; pid = -1
    host.removeAttribute('data-drag')
    if (wasDrag) {
      if (performance.now() - lastT > 100) vel = 0 // finger rested before lifting: no fling
      setTarget(pos + clamp(vel, -5, 5) * 0.5)
    } else if (!cancelled) {
      const i = hit(e.clientX, e.clientY)
      if (i >= 0) { if (i === Math.round(target)) o.onOpen?.(i); else setTarget(i) }
    } else setTarget(pos)
    kick()
  }
  const onUp = (e: PointerEvent) => finish(e, false)
  const onCancel = (e: PointerEvent) => finish(e, true)
  const onLeave = () => { ptr.inside = false; ptr.x = 0; ptr.y = 0; hoverIdx = -1; host.style.cursor = ''; kick() }

  let hoverQueued = false
  const scheduleHover = () => {
    if (hoverQueued) return
    hoverQueued = true
    requestAnimationFrame(() => {
      hoverQueued = false
      if (disposed || dragging || !ptr.inside) return
      const i = hit(ptr.px, ptr.py)
      if (i !== hoverIdx) { hoverIdx = i; host.style.cursor = i >= 0 ? 'pointer' : ''; kick() }
    })
  }

  // wheel / trackpad: continuous scrolling (speed follows the input, several cards per gesture is fine);
  // once the input pauses the strip snaps to the nearest card. At either end the wheel falls through to the page.
  const WHEEL_PX = 340      // wheel delta that moves the strip by one card
  let wHold = 0
  const onWheel = (e: WheelEvent) => {
    if (!o.engaged()) return
    const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY)
    let d = horizontal ? e.deltaX : e.deltaY
    if (e.deltaMode === 1) d *= 32; else if (e.deltaMode === 2) d *= H
    if (!d) return
    const now = performance.now()
    const atEnd = (d > 0 && target >= N - 1 - 0.02) || (d < 0 && target <= 0.02)
    if (atEnd && now > wHold) return                       // let the page scroll on
    e.preventDefault(); e.stopPropagation()
    if (atEnd) return                                      // swallow the momentum tail of the last gesture
    wHold = now + 600
    target = clamp(target + d / WHEEL_PX, 0, N - 1)
    kick()
    clearTimeout(snapT)
    snapT = window.setTimeout(() => { if (!dragging && !disposed) setTarget(target) }, 140)
  }

  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return
    const t = e.target as HTMLElement | null
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return
    if (!o.engaged() && !host.contains(document.activeElement) && !(host.parentElement?.contains(document.activeElement))) return
    e.preventDefault()
    setTarget(Math.round(target) + (e.key === 'ArrowRight' ? 1 : -1))
  }

  host.addEventListener('pointerdown', onDown)
  host.addEventListener('pointermove', onMove)
  host.addEventListener('pointerup', onUp)
  host.addEventListener('pointercancel', onCancel)
  host.addEventListener('pointerleave', onLeave)
  host.addEventListener('wheel', onWheel, { passive: false })
  window.addEventListener('keydown', onKey)
  const lost = (e: Event) => { e.preventDefault(); stop(); o.onLost?.() }
  canvas.addEventListener('webglcontextlost', lost)

  const ro = new ResizeObserver(resize)
  ro.observe(host)
  resize()
  try { await renderer.compileAsync(scene, camera) } catch { /* compiled on first render instead */ }
  if (disposed) return { setVisible() {}, goTo() {}, setFocus() {}, dispose() {} }
  render()
  o.onReady?.()
  kick()

  return {
    setVisible(v: boolean) {
      visible = v
      if (v) kick(); else stop()
    },
    goTo(i: number) { setTarget(i) },
    setFocus(i: number) { focus = i; if (i >= 0) setTarget(i); else kick() },
    dispose() {
      disposed = true
      clearTimeout(snapT)
      stop()
      ro.disconnect()
      host.removeEventListener('pointerdown', onDown)
      host.removeEventListener('pointermove', onMove)
      host.removeEventListener('pointerup', onUp)
      host.removeEventListener('pointercancel', onCancel)
      host.removeEventListener('pointerleave', onLeave)
      host.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKey)
      canvas.removeEventListener('webglcontextlost', lost)
      host.removeAttribute('data-drag')
      cardGeo.dispose(); floorGeo.dispose(); floorMat.dispose()
      cards.forEach((c) => c.mat.dispose())
      textures.forEach((t) => t.dispose())
      renderer.dispose()
      renderer.forceContextLoss()
      canvas.remove()
    },
  }
}
