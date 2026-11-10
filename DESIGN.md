# KoSpace — site

## Scenes
| Section | Look | Type | Tech |
|---|---|---|---|
| Hero (`#w1`) | full-screen black, slowly rotating NASA Blue Marble Earth seen from orbit, curved horizon, fresnel atmosphere, stars, vignette | Montserrat 200, wide-tracked caps; IBM Plex Mono on the button | raw three.js, custom shaders (`components/hero/`) |
| Open Sources (`#projects`) | black stage, ribbon of two repo cards (openall, cleanxiaomi) bent along a curve over a perspective grid floor fading into fog | Yellowtail for "Sources", Montserrat | raw three.js, vertex-shader bend (`components/projects/`) |
| `/social` | dark page: Discord, GitHub, email, news list | system sans | plain server component (`app/social/page.tsx`) |
| Footer, Header, `/countries`, `/secret` | `/countries` and `/secret` are kept as spare pages, not linked from the main page | | |

Easing language: `cubic-bezier(0.76,0,0.24,1)` = CSS `ease-ko` = GSAP `ko`.

## Hero
- Earth: day map + clouds (uv drift, cloud shadows) + night lights + ocean glint; soft terminator, warm twilight band, fresnel rim, analytic atmosphere halo (BackSide sphere, additive).
- Framing: lens-shift (`camera.setViewOffset`) so the globe is a large arc at the bottom of the screen; portrait phones use a bigger, centred arc.
- Interaction: cursor parallax, drag-to-rotate with inertia, scroll push-back. Intro: Earth fades in from black (5.5 s dolly), text reveals line by line (CSS only).
- Button "Open the cosmos": white rectangle, mono text, four corner brackets that expand on hover; click smooth-scrolls to `#projects` (Lenis if present).
- Fallback: no WebGL / texture failure → CSS-only limb gradient, text unchanged.

## Open Sources
- `components/Projects.tsx` is a server component: at build time it looks for `public/interfaces/{1,2,3}.(jpg|png|webp)` and passes the URLs down (missing file → dark gradient placeholder, no 404).
- `Showcase.tsx` picks the view: `ribbon` (WebGL, FEATURED), `grid` (FULL), `row` (plain scroll-snap row for no WebGL / reduced motion / phones ≤640px / WebGL failure).
- Cards are always real `<a href>` links in the DOM; behind the ribbon they are visually hidden but focusable, and focus recentres the ribbon.
- Ribbon controls: mouse drag, wheel (one card per gesture, passes through at the ends), touch swipe with inertia, arrow keys, snap to the nearest card. Motion adds wave + shear proportional to velocity.
- Content: `REPOS` in `components/projects/apps.ts` (title, GitHub link, language, license, description). Cards open GitHub in a new tab. Covers: `public/interfaces/{1,2}.webp` (GitHub mark + description).

## Folders
app/{layout,page,not-found,globals.css,favicon.ico,icon.png,apple-icon.png,countries,secret,social} · components/{Smooth,Header,Hero,Projects,Footer,LangPicker}.tsx · components/hero/{earth,earthShaders} · components/projects/{Showcase,AppCard,apps,ribbon,ribbonShaders} · components/webgl/{support,useInView} · public/{textures,interfaces,_headers,_redirects}

## Performance
dpr ≤ 1.5 (1.25 on mobile GPUs), three scenes lazy-loaded via dynamic `import()` (hero on idle, ribbon when the section is ~700px away), rendering paused when off-screen, ribbon renders on demand and stops when settled, 2600 stars desktop / 700 mobile, textures ≈ 580 KB total, `prefers-reduced-motion` → no intro animation, plain card row.

## Security headers
`public/_headers` (Netlify / Cloudflare Pages): CSP `self` + Google Fonts, no `unsafe-eval`, `X-Frame-Options: DENY`, `Referrer-Policy`, `X-Content-Type-Options`. `'unsafe-inline'` for scripts/styles is required by Next's static-export inline bootstrap scripts.

## Assets to add
public/interfaces/{1,2}.(jpg|png|webp) · public/og.png (optional, not referenced yet) · see public/textures/CREDITS.txt for the Earth maps.

## Weak-device mode (hero)
`isLowPower()` (software GL, <=4 CPU threads or <=4 GB RAM) -> `lite`: DPR 1, no MSAA, 1200 stars, 80-segment sphere, shader `LITE` define (one noise octave, no second cloud fetch, no dither), 30 fps while idle. On every device the Earth also lowers its render resolution step by step (x0.8, down to 0.6) when the frame rate stays below ~40 fps. Header has no backdrop-blur / mix-blend (static gradient strip instead).

## Colour transitions
Hero -> Apps: `.kh-dim` + `.kh-fade` (driven by the scroll variable `--p`) sink the lit planet into black before the black Apps section. Open Sources -> Footer: both black.

## Ribbon motion (matches the reference video)
Continuous scrolling instead of one card per wheel gesture: wheel / trackpad moves the strip proportionally (340 px of wheel = 1 card), the strip glides with a critically damped spring (omega 3.4, ~2 s per gesture, long soft tail), and snaps magnetically to the nearest card 140 ms after the input stops. Drag follows the pointer 1:1 and a fling coasts over several cards. Speed drives an `energy` value (0..1) that pushes the cards 13% towards the camera (the grid floor never moves with the scroll), tightens the bend radius by 16%, and strengthens the travelling wave (0.095) and lean (0.06) in `ribbonShaders.ts`; all of it relaxes back as the strip settles.


## Brand assets
`public/logo.png` (white, transparent, trimmed) and `logo-sm.png` (half size, used in the footer) · favicon set `app/favicon.ico`, `app/icon.png`, `app/apple-icon.png` = the logo on a dark #0b0b0f tile (the logo is white, so it needs a dark tile to be visible on light browser tabs) · `public/og.png` 1200x630 social preview · `public/robots.txt`, `public/sitemap.xml` (/secret and /countries are noindex).

## Project cover images
Put the cards' covers into `public/interfaces/` as `1.webp` (openall) and `2.webp` (cleanxiaomi); jpg and png also work. Landscape ~16:10 (e.g. 1600x1000), up to 400-500 KB each. They are picked up at build time; without a file a dark gradient placeholder is shown. Title and link are set in `components/projects/apps.ts` (`REPOS`).
