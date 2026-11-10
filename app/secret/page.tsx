export const metadata = { title: 'KoSpace — Secret', robots: { index: false, follow: false } }
export default function Secret() {
  return (
    <main className="grid min-h-screen place-items-center bg-black px-6 text-center text-white">
      <div>
        <p className="font-wide text-sm tracking-[0.3em] text-white/50">KoSpace</p>
        <h1 className="mt-6 font-script text-[clamp(72px,14vw,180px)] leading-none">Soon</h1>
        <p className="mt-6 font-cond text-lg text-white/60">Apps are coming soon.</p>
        <a href="/" className="mt-10 inline-block font-cond underline underline-offset-4">← Back to home</a>
      </div>
    </main>
  )
}
