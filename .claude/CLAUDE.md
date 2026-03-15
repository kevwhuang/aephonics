# Aephonics

Landing page and hub for aephonics.com. Connects four subdomains: algo, dev, music, and travel. Built with Astro 6, TypeScript, Tailwind CSS 4, and GSAP. Deployed on Netlify.

## Commands

| Command         | Description             |
| --------------- | ----------------------- |
| `bun run build` | Production build        |
| `bun run lint`  | tsc && eslint           |
| `bun run test`  | vitest && playwright    |
| `bun start`     | Dev server on port 8888 |

## Structure

| Path                     | Description                        |
| ------------------------ | ---------------------------------- |
| `src/components/`        | ArrowDownIcon, ArrowUpRightIcon    |
| `src/layouts/Base.astro` | Head, meta, footer, global styles  |
| `src/lib/scroll.ts`      | GSAP scroll animations             |
| `src/middleware.ts`      | Request middleware                 |
| `src/pages/`             | Index, [...slug] 404               |
| `src/sections/`          | Footer, Hero, NotFound, Sites      |
