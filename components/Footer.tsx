import type { ReactNode } from 'react'
import { T, CurrentLang } from './i18n'
import { GITHUB_URL, REPOS } from './projects/apps'

const link = 'text-base text-white/85 transition-colors hover:text-white hover:underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white'

type Item = [ReactNode, string, boolean?] // label, href, opens in a new tab

const Col = ({ title, items }: { title: ReactNode; items: Item[] }) => (
  <div>
    <h2 className="text-sm font-normal text-white/55">{title}</h2>
    <ul className="mt-5 space-y-3.5">
      {items.map(([t, h, ext], i) => (
        <li key={i}>
          <a href={h} className={link} {...(ext ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{t}</a>
        </li>
      ))}
    </ul>
  </div>
)

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black px-6 pb-12 pt-16 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <a href="/" aria-label="KoSpace" className="inline-flex items-center gap-4 self-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-sm.png" alt="" width="56" height="50" className="h-[50px] w-auto" />
            <span>
              <span className="block font-wide text-2xl tracking-[0.06em]">KoSpace</span>
              <span className="mt-1.5 block text-xs uppercase tracking-[0.22em] text-white/55"><T k="hero.sub" /></span>
            </span>
          </a>
          <div>
            <p className="text-sm text-white/55"><T k="f.region" /></p>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-black">
                <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9" /><ellipse cx="12" cy="12" rx="4" ry="9" /><path d="M3 12h18M4.5 7h15M4.5 17h15" /></svg>
              </span>
              <span className="text-base"><T k="f.intl" /> / <CurrentLang /></span>
              <a href="/countries" className="text-base underline underline-offset-4 hover:text-white/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"><T k="f.change" /></a>
            </div>
          </div>
        </div>

        <nav aria-label="Footer" className="mt-14 grid gap-12 sm:grid-cols-2 md:grid-cols-3">
          <Col title={<T k="f.contacts" />} items={[['support@kosmos.day', 'mailto:support@kosmos.day']]} />
          <Col title={<T k="f.nav" />} items={[
            [<T key="o" k="f.open" />, '/#projects'],
            [<T key="s" k="f.social" />, '/social'],
          ]} />
          <Col title="GitHub" items={[
            ...REPOS.map((r): Item => [r.title, r.href, true]),
            ['d1koot', GITHUB_URL, true],
          ]} />
        </nav>

        <div className="mt-16 flex flex-col gap-4 border-t border-white/10 pt-8 md:flex-row md:items-center md:justify-between">
          <p className="text-base text-white/80">© {new Date().getFullYear()} KoSpace</p>
          <p className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/65">
            <a href="https://privacy.kosmos.day" className="underline underline-offset-4 hover:text-white"><T k="f.priv" /></a>
            <a href="https://terms.kosmos.day" className="underline underline-offset-4 hover:text-white"><T k="f.terms" /></a>
          </p>
        </div>
        <p className="mt-4 text-xs text-white/50"><T k="f.earth" /></p>
      </div>
    </footer>
  )
}
