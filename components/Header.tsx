// No backdrop-blur and no mix-blend-mode: both force the browser to re-process the animated WebGL hero behind the
// header on every frame (very costly on weak GPUs). A static gradient gives the same soft, edge-less strip.
export default function Header() {
  return (
    <>
      <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-40" style={{ height: 'calc(5.5rem + env(safe-area-inset-top, 0px))', background: 'linear-gradient(to bottom, rgba(0,0,0,.6), rgba(0,0,0,.25) 55%, transparent)' }} />
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-center text-white" style={{ paddingTop: 'env(safe-area-inset-top, 0px)', boxSizing: 'content-box' }}>
        <a href="/" aria-label="KoSpace" className="pointer-events-auto font-wide text-[22px] tracking-[0.06em]">KoSpace</a>
      </header>
    </>
  )
}
