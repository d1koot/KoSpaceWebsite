'use client'
import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, MouseEvent } from 'react'
import type { EarthHandle } from './hero/earth'
import { T } from './i18n'
import { hasWebGL, isLowPower, isMobileGPU, prefersReducedMotion } from './webgl/support'

// Hero: dark full-screen scene with a slowly rotating 3D Earth (components/hero/earth.ts).
// The copy, button and hint are plain HTML so they paint immediately (LCP) while the 3D chunk loads lazily.
// Styles: app/globals.css, section "HERO".

type State = 'boot' | 'ready' | 'fallback'

export default function Hero() {
  const root = useRef<HTMLElement>(null)
  const host = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<State>('boot')

  useEffect(() => {
    const section = root.current!
    const hostEl = host.current!
    const reduced = prefersReducedMotion()
    let cancelled = false
    let visible = true
    let handle: EarthHandle | undefined

    // scroll progress -> CSS variable (text fades / lifts) + scene (planet pushes back)
    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const p = Math.min(1, Math.max(0, window.scrollY / window.innerHeight))
        section.style.setProperty('--p', p.toFixed(3))
        handle?.setProgress(p)
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    // render only while the hero is on screen
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      handle?.setVisible(visible)
    })
    io.observe(section)

    const boot = async () => {
      // phones: skip the 3D Earth (no three.js / textures download), use the light CSS planet instead
      if (!hasWebGL() || matchMedia('(max-width: 820px)').matches) { setState('fallback'); return }
      try {
        const { createEarth } = await import('./hero/earth')
        if (cancelled) return
        const h = await createEarth(hostEl, {
          events: section,
          mobile: isMobileGPU(),
          lite: isLowPower(),
          reduced,
          onReady: () => { if (!cancelled) setState('ready') },
          onLost: () => { if (!cancelled) setState('fallback') },
        })
        if (cancelled) { h.dispose(); return }
        handle = h
        h.setVisible(visible)
        onScroll()
      } catch {
        if (!cancelled) setState('fallback')
      }
    }

    // let the first paint happen before the 3D work starts
    const w = window as any
    const id = w.requestIdleCallback ? w.requestIdleCallback(boot, { timeout: 500 }) : window.setTimeout(boot, 200)

    return () => {
      cancelled = true
      if (w.cancelIdleCallback) w.cancelIdleCallback(id); else window.clearTimeout(id)
      io.disconnect()
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
      handle?.dispose()
    }
  }, [])

  // smooth-scroll to the projects section (Lenis when active, native otherwise; real href kept for no-JS)
  const go = (e: MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById('projects')
    if (!target) return
    e.preventDefault()
    const lenis = (window as any).__lenis
    if (lenis) lenis.scrollTo(target, { duration: 1.8, easing: (t: number) => 1 - Math.pow(1 - t, 4) })
    else target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
  }

  return (
    <section id="w1" ref={root} className="kh" data-state={state}>
      <div className="kh-scene" aria-hidden="true">
        <div ref={host} className="kh-gl" />
        {state === 'fallback' && <div className="kh-limb" />}
      </div>
      <div className="kh-shade" aria-hidden="true" />
      <div className="kh-dim" aria-hidden="true" />
      <div className="kh-fade" aria-hidden="true" />

      <div className="kh-content">
        <h1 className="kh-title">
          <span className="kh-line" style={{ '--d': '0.35s' } as CSSProperties}><span className="kh-line-in"><T k="hero.l1" /></span></span>
          <span className="kh-line" style={{ '--d': '0.5s' } as CSSProperties}><span className="kh-line-in"><T k="hero.l2" /></span></span>
        </h1>
        <p className="kh-sub kh-rise" style={{ '--d': '0.95s' } as CSSProperties}><T k="hero.sub" /></p>
        <a href="#projects" onClick={go} className="kh-btn kh-rise" style={{ '--d': '1.15s' } as CSSProperties}>
          <i className="kh-c kh-c-tl" aria-hidden="true" />
          <i className="kh-c kh-c-tr" aria-hidden="true" />
          <i className="kh-c kh-c-bl" aria-hidden="true" />
          <i className="kh-c kh-c-br" aria-hidden="true" />
          <span className="kh-btn-fill"><T k="hero.btn" /></span>
        </a>
      </div>

      <div className="kh-hint kh-rise" style={{ '--d': '1.6s' } as CSSProperties} aria-hidden="true">
        <span className="kh-hint-line" />
        <span><T k="hero.hint" /></span>
      </div>
    </section>
  )
}
