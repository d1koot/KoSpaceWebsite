'use client'
import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CustomEase } from 'gsap/CustomEase'
import Lenis from 'lenis'
export default function Smooth() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger, CustomEase)
    CustomEase.create('ko', '0.76,0,0.24,1') // site-wide easing language
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const l = new Lenis({ lerp: 0.09 }); (window as any).__lenis = l
    l.on('scroll', ScrollTrigger.update)
    const t = (s: number) => l.raf(s * 1000)
    gsap.ticker.add(t); gsap.ticker.lagSmoothing(0)
    gsap.set('[data-rv]', { opacity: 0, y: 60 })
    ScrollTrigger.batch('[data-rv]', { start: 'top 92%', once: true,
      onEnter: (b) => gsap.to(b, { opacity: 1, y: 0, stagger: 0.1, duration: 1, ease: 'ko' }) })
    return () => {
      gsap.ticker.remove(t); l.destroy()
      if ((window as any).__lenis === l) delete (window as any).__lenis   // Hero would otherwise call scrollTo on a destroyed instance
      ScrollTrigger.getAll().forEach((s) => s.kill())                     // no duplicate triggers on remount (React strict mode)
      gsap.killTweensOf('[data-rv]'); gsap.set('[data-rv]', { clearProps: 'opacity,transform' })
    }
  }, [])
  return null
}
