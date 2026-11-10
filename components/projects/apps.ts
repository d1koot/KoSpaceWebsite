// Data + shared constants for the "Open Sources" section.

/** Reserved: placeholder page for future apps (/secret). Not linked from the site right now. */
export const APPS_URL = '/secret'

export const GITHUB_URL = 'https://github.com/d1koot'

export interface AppItem {
  n: number
  title: string
  href: string
  desc: string
  lang: string
  license: string
  /** /interfaces/N.(jpg|png|webp) when the file exists at build time, otherwise null -> gradient placeholder */
  image: string | null
}

/** The open-source repositories shown on the page (cover images: public/interfaces/N.webp). */
export const REPOS: Omit<AppItem, 'image'>[] = [
  {
    n: 1, title: 'openall', href: 'https://github.com/d1koot/openall', lang: 'Python', license: 'MIT',
    desc: 'Reverse-engineer compiled programs onto shelves, then bind the shelves into one new book.',
  },
  {
    n: 2, title: 'cleanxiaomi', href: 'https://github.com/d1koot/cleanxiaomi', lang: 'PowerShell', license: 'MIT',
    desc: 'Remove system ads and tracking from Xiaomi, Redmi and POCO phones over ADB. No root, fully reversible.',
  },
]

/** Placeholder gradients (top-left glow, base) used when an interface image is missing. */
export const PALETTE: [string, string][] = [
  ['#2c55a8', '#0a1128'],
  ['#7c42ad', '#140a25'],
  ['#1f918b', '#061a1b'],
]
export const paletteFor = (i: number) => PALETTE[i % PALETTE.length]
