import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { GITHUB_URL } from '@/components/projects/apps'
import { T } from '@/components/i18n'
import type { Key } from '@/components/i18n-dict'

export const metadata = {
  title: 'KoSpace — Social',
  description: 'Where to find KoSpace: the KoSpace HQ Discord server, GitHub d1koot and news.',
}

const DISCORD_URL = 'https://discord.gg/JAapubSNFf'

const Mark = ({ size = 24 }: { size?: number }) => (
  <svg viewBox="0 0 16 16" width={size} height={size} fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" /></svg>
)

const btn = 'inline-flex items-center rounded-lg px-4 py-2.5 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white'

// Replace / extend this list when there is something real to say.
const NEWS: [string, Key][] = [
  ['2026-02', 's.n1'],
  ['2026-10', 's.n2'],
  ['2026-11', 's.n3'],
]

export default function Social() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#111] px-6 pb-28 pt-28 text-white">
        <nav aria-label="Breadcrumb" className="text-center text-xs text-white/60">
          <a href="/" className="hover:text-white"><T k="s.home" /></a> <span aria-hidden="true">/</span> <span aria-current="page"><T k="f.social" /></span>
        </nav>

        <section className="mx-auto mt-10 max-w-3xl text-center">
          <h1 className="text-[clamp(28px,4vw,40px)] font-light tracking-tight"><T k="s.title" /></h1>
          <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-white/60">
            <T k="s.sub" />
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer" className={`${btn} bg-white text-black hover:bg-white/85`}><T k="s.discord" /></a>
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className={`${btn} bg-white/10 text-white hover:bg-white/20`}>GitHub</a>
          </div>
        </section>

        <section aria-label="KoSpace HQ" className="mx-auto mt-14 max-w-5xl">
          <div className="grid min-h-[340px] place-items-center rounded-xl border border-white/10 bg-[#0b0b0f] p-8 text-center">
            <div>
              <p className="font-wide text-xs tracking-[0.3em] text-white/50">DISCORD</p>
              <p className="mt-6 text-[clamp(36px,7vw,72px)] font-extralight leading-none">KoSpace HQ</p>
              <p className="mt-5 text-sm text-white/60">Est. Feb 2026</p>
            </div>
          </div>
        </section>

        <section aria-labelledby="where" className="mx-auto mt-28 max-w-5xl">
          <h2 id="where" className="text-center text-[clamp(20px,2.4vw,28px)] font-light"><T k="s.where" /></h2>
          <ul className="mx-auto mt-12 grid max-w-3xl gap-10">
            <li className="border-l border-white/30 pl-6">
              <h3 className="text-lg font-medium">Discord — KoSpace HQ</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-white/60"><T k="s.dp" /></p>
              <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm underline underline-offset-4 hover:text-white/80">discord.gg/JAapubSNFf</a>
            </li>
            <li className="border-l border-white/30 pl-6">
              <h3 className="flex items-center gap-2 text-lg font-medium"><Mark size={20} /> GitHub — d1koot</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-white/60"><T k="s.gp" /></p>
              <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm underline underline-offset-4 hover:text-white/80">github.com/d1koot</a>
            </li>
            <li className="border-l border-white/30 pl-6">
              <h3 className="text-lg font-medium"><T k="s.et" /></h3>
              <p className="mt-2 text-[15px] leading-relaxed text-white/60"><T k="s.ep" /></p>
              <a href="mailto:support@kosmos.day" className="mt-3 inline-block text-sm underline underline-offset-4 hover:text-white/80">support@kosmos.day</a>
            </li>
          </ul>
        </section>

        <section aria-labelledby="news" className="mx-auto mt-28 max-w-3xl">
          <h2 id="news" className="text-center text-[clamp(20px,2.4vw,28px)] font-light"><T k="s.news" /></h2>
          <ul className="mt-10 divide-y divide-white/10 border-y border-white/10">
            {NEWS.map(([d, k]) => (
              <li key={d} className="grid gap-1 py-5 sm:grid-cols-[120px_1fr] sm:gap-6">
                <span className="text-sm text-white/50">{d}</span>
                <span className="text-[15px] text-white/85"><T k={k} /></span>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <Footer />
    </>
  )
}
