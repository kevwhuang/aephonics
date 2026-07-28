import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, test } from 'vitest';

import Hero from '../../src/sections/Hero.astro';

const ARROW = '<div class="hero__arrow justify-self-center relative z-[1] mb-[clamp(2rem,calc(1.6667rem+1.6667vw),3rem)] p-2 animate-bounce duration-(--duration-slow) ease-[ease] opacity-0 transition-opacity"';
const ARROW_ICON = '<svg class="h-8 w-8 text-white drop-shadow-[0_0_0.625rem_var(--color-white-50)]" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">';
const CANVAS_COUNT = 2;
const CONTENT = '<div class="hero__content place-self-center relative z-[1] px-[clamp(1rem,calc(0.5rem+2.5vw),2.5rem)] text-center"';
const HEADING_SPANS = /aria-label="Aephonics" data-astro-cid-[a-z0-9]+><span class="hero__text" data-astro-cid-[a-z0-9]+><\/span><span class="hero__cursor" data-astro-cid-[a-z0-9]+>\|<\/span><\/h1>/;
const SPAN_COUNT = 2;
const TAGLINE = '<ul class="hero__tagline flex justify-center gap-[0.9em] font-mono list-none lowercase text-[clamp(0.875rem,calc(0.5833rem+1.4583vw),1.75rem)] tracking-[clamp(0.25rem,calc(0.1667rem+0.4167vw),0.5rem)] opacity-0 select-none"';

const TAGS = [
    { color: 'pink', text: 'atx' },
    { color: 'indigo', text: 'syntax' },
    { color: 'orange', text: 'wavs' },
] as const;

const TITLE = '<h1 id="hero-title" class="hero__title mb-[clamp(1rem,calc(0.3333rem+3.3333vw),3rem)] font-extralight leading-none text-[min(clamp(2.5rem,calc(-0.6667rem+15.8333vw),12rem),26svh)] tracking-wide uppercase bg-clip-text text-transparent drop-shadow-[0_0_2.5rem_var(--color-white-10)] select-none" aria-label="Aephonics"';

describe('Hero', () => {
    let html: string;

    beforeAll(async () => {
        const container = await AstroContainer.create();

        html = await container.renderToString(Hero);
    });

    test('labels the isolated full-height section by the single hero title heading', () => {
        expect(html).toContain('<section class="hero grid grid-rows-[1fr_auto] isolate overflow-hidden relative min-h-svh" aria-labelledby="hero-title"');
        expect(html.split('<section').length - 1).toBe(1);
        expect(html.split('id="hero-title"').length - 1).toBe(1);
    });

    test('fills the gradient-clipped heading named for the site with only the scoped typewriter spans', () => {
        expect(html).toContain(TITLE);
        expect(html).toMatch(HEADING_SPANS);
        expect(html.split('<h1').length - 1).toBe(1);
        expect(html.split('<span').length - 1).toBe(SPAN_COUNT);
    });

    test('renders exactly two decorative canvases for the grid and the pulses', () => {
        expect(html).toContain('<canvas class="hero__grid absolute inset-0" aria-hidden="true"');
        expect(html).toContain('<canvas class="hero__pulses absolute inset-0" aria-hidden="true"');
        expect(html.split('<canvas ').length - 1).toBe(CANVAS_COUNT);
    });

    test('stacks the heading and the tagline in the raised content column', () => {
        expect(html).toContain(CONTENT);
        expect(html.indexOf(TITLE)).toBeGreaterThan(html.indexOf(CONTENT));
        expect(html.indexOf(TAGLINE)).toBeGreaterThan(html.indexOf(TITLE));
    });

    test('renders the three tagline items with their hook and palette classes', () => {
        expect(html).toContain(TAGLINE);
        expect(html.split('<li ').length - 1).toBe(TAGS.length);

        for (const { color, text } of TAGS) {
            expect(html, text).toContain(`<li class="hero__tag hero__tag--${text} before:text-zinc-600 text-${color}-70 text-shadow-[0_0_0.9375rem_var(--color-${color}-30)]"`);
            expect(html, text).toContain(`>${text}</li>`);
        }
    });

    test('leaves the tagline separators to css instead of rendering them as text', () => {
        const tagline = html.slice(html.indexOf(TAGLINE), html.indexOf('</ul>'));

        const taglineText = tagline.replace(/<[^>]*>/g, '');

        expect(taglineText).toBe(TAGS.map(tag => tag.text).join(''));
        expect(taglineText).not.toContain('/');
    });

    test('renders the scroll arrow icon as the only child of its container and hides every decoration from assistive tech', () => {
        expect(html).toContain(ARROW);
        expect(html).toContain(ARROW_ICON);
        expect(html.indexOf(ARROW)).toBeGreaterThan(html.indexOf(CONTENT));
        expect(html).toMatch(/hero__arrow[^>]*><svg class="h-8/);
        expect(html.split('aria-hidden="true"').length - 1).toBe(CANVAS_COUNT + 1);
    });

    test('applies one scoped style hook and attaches exactly one script hook', () => {
        const scopes = new Set(html.match(/data-astro-cid-[a-z0-9]+/g) ?? []);

        expect(scopes.size).toBe(1);
        expect(html.split('Hero.astro?astro&type=script').length - 1).toBe(1);
    });
});
