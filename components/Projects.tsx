import { readdirSync } from 'fs'
import { join } from 'path'
import Showcase from './projects/Showcase'
import { T } from './i18n'
import { REPOS, type AppItem } from './projects/apps'

// "Open Sources" section (id="projects").
// Server component: at build time it looks into public/interfaces for 1.(jpg|png|webp), 2.*, 3.* and hands the
// resolved image URLs to the client Showcase, so a missing file never causes a 404 at runtime (placeholder gradient instead).

const EXT = ['jpg', 'jpeg', 'png', 'webp']

function loadApps(): AppItem[] {
  let files: string[] = []
  try { files = readdirSync(join(process.cwd(), 'public', 'interfaces')) } catch { /* folder missing: placeholders */ }
  return REPOS.map((r) => {
    const file = files.find((f) => EXT.some((e) => f.toLowerCase() === `${r.n}.${e}`))
    return { ...r, image: file ? `/interfaces/${file}` : null }
  })
}

export default function Projects() {
  const apps = loadApps()
  return (
    <section id="projects" className="ka" aria-labelledby="apps-title">
      <div className="ka-head">
        <h2 id="apps-title" className="ka-title" data-rv>
          <span className="ka-get">Open</span>
          <span className="ka-apps">Sources</span>
        </h2>
        <p className="ka-intro" data-rv><T k="proj.intro" /></p>
      </div>
      <Showcase apps={apps} />
    </section>
  )
}
