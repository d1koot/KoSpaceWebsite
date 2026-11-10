import type { CSSProperties, FocusEventHandler } from 'react'
import { paletteFor, type AppItem } from './apps'

/** One app card as a real link. Used by the plain row / grid views and as the accessible link list behind the ribbon. */
export default function AppCard({ app, index, onFocus, onBlur }: {
  app: AppItem
  index: number
  onFocus?: FocusEventHandler<HTMLAnchorElement>
  onBlur?: FocusEventHandler<HTMLAnchorElement>
}) {
  const [c1, c2] = paletteFor(index)
  return (
    <a href={app.href} target="_blank" rel="noopener noreferrer" className="ka-card" style={{ '--c1': c1, '--c2': c2 } as CSSProperties} onFocus={onFocus} onBlur={onBlur}>
      {app.image
        ? <img src={app.image} alt="" loading="lazy" decoding="async" draggable={false} />
        : <span className="ka-card-num" aria-hidden="true">{String(app.n).padStart(2, '0')}</span>}
      <span className="ka-card-shade" aria-hidden="true" />
      <span className="ka-card-title">{app.title}</span>
      <span className="sr-only">{`${app.desc} ${app.lang}, ${app.license}. GitHub.`}</span>
      <span className="ka-card-go" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
      </span>
    </a>
  )
}
