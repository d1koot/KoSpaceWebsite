'use client'
import { useMemo, useState, type MouseEvent } from 'react'
import { LANGS, type Lang } from './i18n-dict'
import { nativeName, useLang } from './i18n'

// [country, flag file in /public/flags (null = globe), [languages]]
type Entry = [string, string | null, string[]]
const R: [string, Entry[]][] = [
  ['Africa', [
    ['Egypt', 'eg', ['English']], ['Kenya', 'ke', ['English']], ['Morocco', 'ma', ['Français']],
    ['Nigeria', 'ng', ['English']], ['South Africa', 'za', ['English']], ['Tunisia', 'tn', ['Français']],
    ['Other countries', null, ['English']],
  ]],
  ['Asia', [
    ['China', 'cn', ['中文']], ['India', 'in', ['English']], ['Japan', 'jp', ['日本語']],
    ['Kazakhstan', 'kz', ['Русский']], ['Singapore', 'sg', ['English']], ['South Korea', 'kr', ['한국어']],
    ['Thailand', 'th', ['English']], ['Other countries', null, ['English']],
  ]],
  ['Australia/Oceania', [
    ['Australia', 'au', ['English']], ['New Zealand', 'nz', ['English']], ['Other countries', null, ['English']],
  ]],
  ['Europe', [
    ['Austria', 'at', ['Deutsch']], ['France', 'fr', ['Français']], ['Germany', 'de', ['Deutsch']],
    ['Ireland', 'ie', ['English']], ['Italy', 'it', ['Italiano']], ['Poland', 'pl', ['Polski']],
    ['Russia', 'ru', ['Русский']], ['Spain', 'es', ['Español']], ['Switzerland', 'ch', ['Deutsch', 'Français']],
    ['Ukraine', 'ua', ['Українська']], ['United Kingdom', 'gb', ['English']], ['Other countries', null, ['English']],
  ]],
  ['Latin America', [
    ['Argentina', 'ar', ['Español']], ['Brazil', 'br', ['Português']], ['Chile', 'cl', ['Español']],
    ['Colombia', 'co', ['Español']], ['Mexico', 'mx', ['Español']], ['Other countries', null, ['Español']],
  ]],
  ['Middle East', [
    ['Turkey', 'tr', ['Türkçe']],
    ['United Arab Emirates', 'ae', ['English']], ['Other countries', null, ['English']],
  ]],
  ['North America', [
    ['Canada', 'ca', ['English', 'Français']], ['United States', 'us', ['English', 'Español']],
  ]],
]

// native language name -> site language code (only languages the site is really translated into)
const LANG = Object.fromEntries(LANGS.map((l) => [l.native, l.code])) as Record<string, Lang>

const Globe = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#141414" strokeWidth="1.4" aria-hidden="true">
    <circle cx="12" cy="12" r="9" /><ellipse cx="12" cy="12" rx="4" ry="9" /><path d="M3 12h18" />
  </svg>
)

export default function LangPicker() {
  const { lang: current, setLang } = useLang()
  const [q, setQ] = useState(''), [open, setOpen] = useState<string | null>(null)
  const choose = (e: MouseEvent, code: Lang) => { e.preventDefault(); setLang(code); window.location.assign('/') }
  const query = q.trim().toLowerCase()

  const list = useMemo(() => R.map(([region, entries]) => {
    if (!query) return [region, entries] as [string, Entry[]]
    const regionHit = region.toLowerCase().includes(query)
    const hit = entries.filter(([c, , l]) => regionHit || c.toLowerCase().includes(query) || l.some((x) => x.toLowerCase().includes(query)))
    return [region, hit] as [string, Entry[]]
  }).filter(([, e]) => e.length), [query])

  return (
    <div className="min-h-[100svh] bg-white px-5 pb-10 pt-5 text-[#141414]">
      <a href="/" aria-label="KoSpace" className="block text-center font-wide text-[18px] tracking-[0.06em]">KoSpace</a>

      <h1 className="mt-10 text-center font-cond text-[24px] font-normal leading-tight">Select your region or language</h1>
      <p className="mt-2 text-center font-cond text-[13px]">You are currently seeing content in <strong>{nativeName(current)}</strong></p>

      <label className="relative mx-auto mt-5 block max-w-[504px]">
        <span className="sr-only">Search for your region or language</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search for your region or language"
          className="h-10 w-full rounded-[10px] border border-[#141414] bg-[#f2f2f2] px-3 pr-10 font-cond text-[14px] outline-none placeholder:text-[#666] focus:ring-2 focus:ring-black/40" />
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#666" strokeWidth="1.6" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" aria-hidden="true"><circle cx="10" cy="10" r="6" /><path d="M14.5 14.5 20 20" /></svg>
      </label>

      <ul className="mx-auto mt-5 max-w-[720px] font-cond">
        {list.map(([region, entries]) => {
          const o = !!query || open === region
          return (
            <li key={region}>
              <button aria-expanded={o} onClick={() => setOpen(open === region ? null : region)}
                className="flex w-full items-center justify-between py-2.5 text-left text-[15px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black">
                {region}
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#666" strokeWidth="2" className={`transition-transform ${o ? 'rotate-180' : ''}`} aria-hidden="true"><path d="m5 9 7 7 7-7" /></svg>
              </button>
              {o && (
                <ul className="grid grid-cols-2 gap-x-6 gap-y-5 pb-5 pt-2 sm:grid-cols-3 lg:grid-cols-4">
                  {entries.flatMap(([country, flag, langs]) => langs.map((lang) => (
                    <li key={country + lang}>
                      <a href="/" hrefLang={LANG[lang]} onClick={(e) => choose(e, LANG[lang])} aria-current={LANG[lang] === current ? 'true' : undefined} className="flex items-center gap-3 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black">
                        {flag
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={`/flags/${flag}.webp`} alt="" width="20" height="20" loading="lazy" className="h-5 w-5 shrink-0 rounded-full ring-1 ring-black/15" />
                          : <span className="grid h-5 w-5 shrink-0 place-items-center"><Globe /></span>}
                        <span className="min-w-0">
                          <span className="block text-[14px] leading-tight hover:underline underline-offset-4">{country}</span>
                          <span lang={LANG[lang]} className="block text-[12px] leading-tight text-[#666]">{lang}</span>
                        </span>
                      </a>
                    </li>
                  )))}
                </ul>
              )}
            </li>
          )
        })}
        {!list.length && <li className="py-6 text-center text-[14px] text-[#666]">No results found</li>}
      </ul>
    </div>
  )
}
