'use client'
import { useEffect, useRef, useState } from 'react'

/** Reports whether the element is (nearly) on screen. Used to arm lazy scenes and to pause rendering off-screen. */
export function useInView<T extends Element>(rootMargin = '0px') {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') { setInView(true); return }
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin })
    io.observe(el)
    return () => io.disconnect()
  }, [rootMargin])
  return [ref, inView] as const
}
