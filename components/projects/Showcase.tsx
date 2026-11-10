'use client'
import { useEffect, useRef, useState } from 'react'
import type { RibbonHandle } from './ribbon'
import { GITHUB_URL, type AppItem } from './apps'
import AppCard from './AppCard'
import { useT } from '../i18n'
import { hasWebGL, isMobileGPU } from '../webgl/support'
import { useInView } from '../webgl/useInView'

// The interactive part of "Open Sources":
//   ribbon  - WebGL ribbon (FEATURED), lazy-loaded when the section approaches the viewport
//   row     - plain horizontally scrollable cards: no WebGL, reduced motion, small mobile, or WebGL failure
//   grid    - plain grid (FULL)
// The cards are always real <a> links in the DOM (SEO / a11y); behind the ribbon they are visually hidden but focusable.
// Styles: app/globals.css, section "GET THE APPS".

type Mode = 'featured' | 'full'

export default function Showcase({ apps }: { apps: AppItem[] }) {
  const t = useT()
  const [mode, setMode] = useState<Mode>('featured')
  const [canRibbon, setCanRibbon] = useState(false)   // decided after mount (SSR renders the plain row)
  const [lost, setLost] = useState(false)
  const [ready, setReady] = useState(false)
  const [index, setIndex] = useState(0)
  const indexRef = useRef(0)
  const glRef = useRef<HTMLDivElement>(null)
  const handle = useRef<RibbonHandle | null>(null)
  const [stageRef, near] = useInView<HTMLDivElement>('700px 0px')
  const [armed, setArmed] = useState(false)           // sticky: once the section was near, keep the scene

  const view: 'ribbon' | 'grid' | 'row' = mode === 'full' ? 'grid' : canRibbon && !lost ? 'ribbon' : 'row'

  useEffect(() => { if (near) setArmed(true) }, [near])

  // capability: WebGL2, no reduced motion, not a small phone (re-evaluated when those change)
  useEffect(() => {
    const small = matchMedia('(max-width: 640px)')
    const reduce = matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setCanRibbon(hasWebGL() && !small.matches && !reduce.matches)
    update()
    small.addEventListener('change', update)
    reduce.addEventListener('change', update)
    return () => { small.removeEventListener('change', update); reduce.removeEventListener('change', update) }
  }, [])

  useEffect(() => {
    if (view !== 'ribbon' || !armed) return
    const stage = stageRef.current!
    const host = glRef.current!
    let cancelled = false
    let h: RibbonHandle | undefined
    let onScreen = true
    const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; h?.setVisible(onScreen) })
    io.observe(stage)
    ;(async () => {
      try {
        const { createRibbon } = await import('./ribbon')
        if (cancelled) return
        const r = await createRibbon(host, {
          apps: apps.map((a) => ({ title: a.title, image: a.image })),
          initial: indexRef.current,
          mobile: isMobileGPU(),
          onIndex: (i) => { indexRef.current = i; setIndex(i) },
          onOpen: (i) => { window.open(apps[i].href, '_blank', 'noopener,noreferrer') },
          onReady: () => { if (!cancelled) setReady(true) },
          onLost: () => { if (!cancelled) setLost(true) },
          // capture wheel / arrow keys only while the section sits in the middle of the viewport
          engaged: () => { const b = stage.getBoundingClientRect(); return b.top < window.innerHeight * 0.45 && b.bottom > window.innerHeight * 0.55 },
        })
        if (cancelled) { r.dispose(); return }
        h = r
        handle.current = r
        r.setVisible(onScreen)
      } catch {
        if (!cancelled) setLost(true)
      }
    })()
    return () => {
      cancelled = true
      io.disconnect()
      h?.dispose()
      handle.current = null
      setReady(false)
    }
  }, [view, armed, apps, stageRef])

  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <div ref={stageRef} className="ka-stage" data-view={view} data-ready={ready ? '1' : undefined}>
      {view === 'ribbon' && <div ref={glRef} className="ka-gl" />}

      <ul className="ka-list">
        {apps.map((a, i) => (
          <li key={a.n}>
            <AppCard
              app={a}
              index={i}
              onFocus={() => handle.current?.setFocus(i)}
              onBlur={() => handle.current?.setFocus(-1)}
            />
          </li>
        ))}
      </ul>

      <div className="ka-ui">
        <span className="ka-ui-tl">KoSpace</span>
        <span className="ka-ui-tr" aria-live="polite" aria-label={t('proj.of', { n: index + 1, m: apps.length })}>{pad(index + 1)} / {pad(apps.length)}</span>
        <div className="ka-ui-bl" role="group" aria-label={t('proj.view')}>
          <button type="button" aria-pressed={mode === 'featured'} onClick={() => setMode('featured')}>{t('proj.featured')}</button>
          <span aria-hidden="true">/</span>
          <button type="button" aria-pressed={mode === 'full'} onClick={() => setMode('full')}>{t('proj.full')}</button>
        </div>
        <a className="ka-ui-br" href={GITHUB_URL} target="_blank" rel="noopener noreferrer">GitHub</a>
      </div>
    </div>
  )
}
