# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Aephonics is the landing page for aephonics.com — a hub site linking to four subdomains (algo, dev, music, travel). Built with Astro 6, TypeScript, React, Tailwind CSS 4, and GSAP for animations. Deployed on Netlify.

## Commands

- **Dev server:** `bun start` (runs Netlify dev on port 8888)
- **Build:** `bun run build`
- **Lint:** `bun run lint` (runs `tsc && eslint`)
- **All tests:** `bun test` (runs vitest then playwright)
- **Unit/integration tests only:** `bunx vitest run`
- **Single test file:** `bunx vitest run tests/unit/setup.test.ts`
- **E2E tests only:** `bunx playwright test`
- **Single E2E test:** `bunx playwright test tests/e2e/index.test.ts`

## Architecture

### Rendering & Routing
Astro SSR via Netlify adapter. Pages live in `src/pages/` — `index.astro` is the home page, `[...slug].astro` is the catch-all 404. The `Base.astro` layout wraps all pages with head metadata (SEO, OG, JSON-LD), Astro ClientRouter for client-side transitions, global styles, and the Footer.

### Sections Pattern
Page content is composed from `src/sections/` components (Hero, Sites, Footer, NotFound). These are full-width, self-contained Astro components — not small reusable UI pieces (those go in `src/components/`).

### Scroll Animations
`src/lib/scroll.ts` provides a declarative scroll animation system using GSAP ScrollTrigger. Add `data-scroll` to any element to animate it on scroll. Supports `data-scroll-delay`, `data-scroll-duration`, `data-scroll-stagger`, and direction values (`up`, `down`, `left`, `right`). Re-initialized on `astro:page-load` for client-side navigation.

### Styling
Tailwind CSS 4 imported via `@import 'tailwindcss'` in the global style block of `Base.astro`. Theme colors defined as CSS custom properties (`--color-cyan`, `--color-indigo`, `--color-orange`, `--color-pink`) using RGB triplets for use with `rgba()`. Font is Geist Sans. Respects `prefers-reduced-motion`.

### Path Aliases
Configured in `tsconfig.json`: `@/` → `src/`, `@assets/`, `@components/`, `@content/`, `@layouts/`, `@lib/`, `@sections/`.

## Code Style

- 4-space indentation, single quotes, semicolons (enforced by `@stylistic/eslint-plugin`)
- 1TBS brace style
- Strict TypeScript (extends `astro/tsconfigs/strict`)
- Accessibility: `eslint-plugin-jsx-a11y` is enabled

## Testing

- **Unit/integration** (`tests/unit/`, `tests/integration/`): Vitest using Astro's `getViteConfig`
- **E2E** (`tests/e2e/`): Playwright, expects dev server on port 8888
