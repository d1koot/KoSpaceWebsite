<div align="center">

<img src="public/logo.png" alt="KoSpace" width="120" />

# KoSpace

**Your space, every day.** The website of KoSpace: open-source tools for everyday work.

[kosmos.day](https://kosmos.day) · [Social](https://kosmos.day/social) · [GitHub](https://github.com/d1koot)

</div>

---

## About

KoSpace is a small independent open-source project, not a company. Almost every day I build repositories for people who are missing a tool, for myself and for others. This repository is the source code of the project's website.

The page is a slowly rotating 3D Earth in the hero, followed by an interactive WebGL ribbon with the projects, a social page and a footer. It is translated into 13 languages and works without WebGL (plain CSS and HTML fallbacks).

## Projects

| Project | What it does | Stack | License |
|---|---|---|---|
| [openall](https://github.com/d1koot/openall) | Reverse-engineer compiled programs onto shelves, then bind the shelves into one new book | Python | MIT |
| [cleanxiaomi](https://github.com/d1koot/cleanxiaomi) | Remove system ads and tracking from Xiaomi, Redmi and POCO phones over ADB. No root, fully reversible | PowerShell | MIT |

## Stack

![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![three.js](https://img.shields.io/badge/three.js-000000?style=flat&logo=threedotjs&logoColor=white)
![GSAP](https://img.shields.io/badge/GSAP-88CE02?style=flat&logo=greensock&logoColor=black)
![WebGL](https://img.shields.io/badge/WebGL-990000?style=flat&logo=webgl&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)
![Cloudflare](https://img.shields.io/badge/Cloudflare_Workers-F38020?style=flat&logo=cloudflare&logoColor=white)
![Git](https://img.shields.io/badge/Git-F05032?style=flat&logo=git&logoColor=white)

## Run it

```bash
npm ci
npm run dev          # http://localhost:3000
npm run build        # static export into ./out
npm run cf:preview   # build and preview on the Cloudflare Workers runtime
npm run deploy       # build and publish with Wrangler
```

Deployment steps are in [DEPLOY.md](DEPLOY.md), design notes in [DESIGN.md](DESIGN.md).

## Structure

```
app/                 pages: home, /social, /countries, /secret, 404, icons
components/hero/     3D Earth (three.js + custom shaders)
components/projects/ WebGL ribbon with the project cards
components/          Header, Footer, language picker, i18n
public/              textures, flags, logo, _headers, _redirects
```

## License

The code is released under the [MIT License](LICENSE).

The **KoSpace name and logo** (`public/logo*.png`, the favicon files and `public/og.png`) are the identity of the project and are not covered by the MIT license: please do not use them to present your own work as KoSpace.

## Credits

- Earth imagery: NASA Earth Observatory (Blue Marble: Next Generation, Earth at Night). See [public/textures/CREDITS.txt](public/textures/CREDITS.txt).
- Flag icons: Google Noto Color Emoji (SIL OFL 1.1, Apache 2.0). See [public/flags/CREDITS.txt](public/flags/CREDITS.txt).
- Fonts: Montserrat, Yellowtail, Michroma, IBM Plex Mono, Barlow Semi Condensed, Roboto Condensed via Google Fonts.

## Contact

[![Email](https://img.shields.io/badge/support@kosmos.day-D14836?style=flat&logo=gmail&logoColor=white)](mailto:support@kosmos.day)
[![Discord](https://img.shields.io/badge/Discord-KoSpace_HQ-5865F2?style=flat&logo=discord&logoColor=white)](https://discord.gg/JAapubSNFf)
[![GitHub](https://img.shields.io/badge/GitHub-d1koot-181717?style=flat&logo=github&logoColor=white)](https://github.com/d1koot)

> First make it work. Then make it right. Then make it fast.
