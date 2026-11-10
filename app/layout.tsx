import './globals.css'
import type { Metadata, Viewport } from 'next'
import { I18n } from '@/components/i18n'
const title = 'KoSpace — Open-source tools'
const description = 'KoSpace — open-source tools: openall and cleanxiaomi. Code on GitHub, community on Discord.'
const og = [{ url: '/og.png', width: 1200, height: 630, alt: 'KoSpace' }]
// Favicons come from the file convention: app/favicon.ico, app/icon.png, app/apple-icon.png.
export const metadata: Metadata = {
  metadataBase: new URL('https://kosmos.day'), title, description,
  applicationName: 'KoSpace',
  alternates: { canonical: '/' },
  openGraph: { title, description, type: 'website', locale: 'en_US', siteName: 'KoSpace', url: '/', images: og },
  twitter: { card: 'summary_large_image', title, description, images: ['/og.png'] },
}
export const viewport: Viewport = { themeColor: '#000000', colorScheme: 'dark' }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" suppressHydrationWarning><head><link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" /><link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@200;300;400&family=IBM+Plex+Mono:wght@500&family=Yellowtail&family=Michroma&family=Barlow+Semi+Condensed:wght@400;500&family=Roboto+Condensed:wght@400;500&display=swap" rel="stylesheet" /></head><body suppressHydrationWarning><I18n>{children}</I18n></body></html>
}
