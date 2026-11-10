// Small client-side capability helpers shared by the two WebGL scenes (hero Earth, apps ribbon).

let gl2: boolean | undefined
let software = false // software rasteriser (SwiftShader / llvmpipe ...): no real GPU
let weakGpu = false  // old integrated / legacy GPU (Intel HD/UHD Graphics, GMA, Radeon HD, GeForce 8/9/GT)

/** True when a WebGL2 context can be created (three.js r163+ needs WebGL2). Cached. */
export function hasWebGL(): boolean {
  if (gl2 !== undefined) return gl2
  try {
    const c = document.createElement('canvas')
    const ctx = c.getContext('webgl2') as WebGL2RenderingContext | null
    gl2 = !!ctx
    try {
      const info = ctx?.getExtension('WEBGL_debug_renderer_info')
      if (ctx && info) {
        const r = String(ctx.getParameter(info.UNMASKED_RENDERER_WEBGL))
        software = /swiftshader|llvmpipe|softpipe|software|basic render/i.test(r)
        weakGpu = /intel.*\b(uhd|hd) graphics|intel.*gma|radeon\(tm\) (hd|r[2-5])\b|radeon hd|geforce (gt |g |8|9)\d{2,3}/i.test(r)
      }
    } catch { /* ignore */ }
    ctx?.getExtension('WEBGL_lose_context')?.loseContext() // do not keep the probe context alive
  } catch {
    gl2 = false
  }
  return gl2
}

export const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches

/** "Small mobile": the apps ribbon falls back to a plain scrollable row here. */
export const isSmallScreen = () => matchMedia('(max-width: 640px)').matches

/** Phones / tablets: fewer particles, no MSAA, lower DPR cap. */
export const isMobileGPU = () => matchMedia('(max-width: 820px), (pointer: coarse)').matches

/** Weak device (software GL, old integrated GPU, <=4 CPU threads or <=4 GB RAM): hero uses lower DPR, no MSAA, one-pass clouds, 30 fps. */
export function isLowPower(): boolean {
  hasWebGL() // makes sure the GPU probe has run
  const n = navigator as Navigator & { deviceMemory?: number }
  return software || weakGpu || (n.hardwareConcurrency ?? 8) <= 4 || (n.deviceMemory ?? 8) <= 4
}
