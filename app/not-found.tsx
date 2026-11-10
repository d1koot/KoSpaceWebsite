export const metadata = { title: 'KoSpace — 404', robots: { index: false } }
export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-black px-6 text-center text-white">
      <div>
        <p className="font-wide text-sm tracking-[0.3em] text-white/50">KoSpace</p>
        <h1 className="mt-6 text-[clamp(72px,14vw,180px)] font-extralight leading-none">404</h1>
        <p className="mt-6 text-lg text-white/60">Page not found.</p>
        <a href="/" className="mt-10 inline-block underline underline-offset-4">← Back to home</a>
      </div>
    </main>
  )
}
