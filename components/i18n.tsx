'use client'
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { DICT, LANGS, type Key, type Lang } from './i18n-dict'

export const STORAGE_KEY = 'kospace-lang'
const isLang = (v: unknown): v is Lang => LANGS.some((l) => l.code === v)

interface Ctx { lang: Lang; setLang: (l: Lang) => void }
const LangCtx = createContext<Ctx>({ lang: 'en', setLang: () => {} })

/** Server HTML is always English; the saved choice is applied right after hydration. */
export function I18n({ children }: { children: ReactNode }) {
  const [lang, setL] = useState<Lang>('en')
  useEffect(() => {
    try { const s = localStorage.getItem(STORAGE_KEY); if (isLang(s)) setL(s) } catch { /* storage blocked: stay English */ }
  }, [])
  useEffect(() => { document.documentElement.lang = lang }, [lang])
  const setLang = useCallback((l: Lang) => {
    setL(l)
    try { localStorage.setItem(STORAGE_KEY, l) } catch { /* ignore */ }
  }, [])
  return <LangCtx.Provider value={{ lang, setLang }}>{children}</LangCtx.Provider>
}

export const useLang = () => useContext(LangCtx)
export const nativeName = (l: Lang) => LANGS.find((x) => x.code === l)?.native ?? 'English'

export function useT() {
  const { lang } = useLang()
  return (k: Key, vars?: Record<string, string | number>) => {
    let s = DICT[lang][k] ?? DICT.en[k]
    if (vars) for (const [a, b] of Object.entries(vars)) s = s.replace(`{${a}}`, String(b))
    return s
  }
}

/** <T k="hero.btn" /> works inside server components too. */
export function T({ k }: { k: Key }) { return <>{useT()(k)}</> }
export function CurrentLang() { return <>{nativeName(useLang().lang)}</> }
