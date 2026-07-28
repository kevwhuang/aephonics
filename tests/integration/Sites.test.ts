import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, test } from 'vitest';

import Sites from '../../src/sections/Sites.astro';

const CARD = '<a class="sites__card active:scale-[0.99] focus-visible:-translate-y-1 hover:-translate-y-1 block group overflow-hidden relative isolate h-full min-h-[clamp(6rem,calc(5.3333rem+3.3333vw),8rem)] p-[clamp(1.5rem,calc(0.6667rem+4.1667vw),4rem)] border border-white-10 bg-white-5"';
const DATA_SCROLL_HOOK_COUNT = 2;

const DECORATIONS = [
    { hook: 'sites__glow', markup: '<div class="sites__glow group-focus-visible:opacity-100 group-hover:opacity-100 -inset-0.5 absolute duration-(--duration-base) ease-[ease] opacity-0 transition-opacity" aria-hidden="true"' },
    { hook: 'sites__radial', markup: '<div class="sites__radial group-focus-visible:opacity-100 group-hover:opacity-100 absolute inset-0 duration-(--duration-base) ease-[ease] opacity-0 transition-opacity" aria-hidden="true"' },
    { hook: 'sites__line', markup: '<div class="sites__line group-focus-visible:w-full group-hover:w-full absolute bottom-0 left-0 h-0.5 w-0 duration-(--duration-base) ease-[ease] transition-[width]" aria-hidden="true"' },
] as const;

const HOVER_EFFECTS_PER_CARD = 9;
const LIST = '<ul class="shell grid grid-cols-2 gap-[clamp(1.5rem,calc(1rem+2.5vw),3rem)] list-none max-md:grid-cols-1" data-scroll="up" data-scroll-stagger="0.1"';

const SITES = [
    {
        color: 'var(--color-cyan)',
        description: 'Algorithms and data structures',
        href: 'https://algo.aephonics.com',
        title: 'Algo',
    },
    {
        color: 'var(--color-indigo)',
        description: 'Web engineering portfolio',
        href: 'https://dev.aephonics.com',
        title: 'Dev',
    },
    {
        color: 'var(--color-orange)',
        description: 'Producer catalog',
        href: 'https://music.aephonics.com',
        title: 'Music',
    },
    {
        color: 'var(--color-pink)',
        description: 'Interactive map',
        href: 'https://travel.aephonics.com',
        title: 'Travel',
    },
] as const;

let html: string;

function findCards() {
    return html.split(CARD).slice(1);
}

describe('Sites', () => {
    beforeAll(async () => {
        const container = await AstroContainer.create();

        html = await container.renderToString(Sites);
    });

    test('labels the only section as the site directory', () => {
        expect(html).toContain('<section class="section" aria-label="Site directory"');
        expect(html.split('<section').length - 1).toBe(1);
    });

    test('marks the only card list for a staggered upward scroll reveal inside the shell', () => {
        expect(html).toContain(LIST);
        expect(html.split('<ul ').length - 1).toBe(1);
        expect(html.split('data-scroll').length - 1).toBe(DATA_SCROLL_HOOK_COUNT);
    });

    test('renders one list item and one card per site', () => {
        expect(html.split('<li ').length - 1).toBe(SITES.length);
        expect(findCards()).toHaveLength(SITES.length);
        expect(html.split('<a ').length - 1).toBe(SITES.length);
    });

    test('gives every card its href, accessible name, accent, title, and description in order', () => {
        for (const [index, card] of findCards().entries()) {
            const site = SITES[index];

            expect(card, site.title).toContain(`aria-label="Visit ${site.title}"`);
            expect(card, site.title).toContain(`href="${site.href}"`);
            expect(card, site.title).toContain(`style="--accent: ${site.color}"`);
            expect(card, site.title).toContain(`>${site.title}</h2>`);
            expect(card, site.title).toContain(`>${site.description}</p>`);
        }
    });

    test('opens every card in a new tab without leaking the opener', () => {
        for (const card of findCards()) {
            expect(card).toContain('rel="noopener"');
            expect(card).toContain('target="_blank"');
        }

        expect(html.split('rel="noopener"').length - 1).toBe(SITES.length);
        expect(html.split('target="_blank"').length - 1).toBe(SITES.length);
    });

    test('mirrors every card hover effect on focus visible', () => {
        const hoverEffects = [...html.matchAll(/ (group-)?hover:(\S+)/g)]
            .map(match => `${match[1] ?? ''}hover:${match[2]}`);

        expect(hoverEffects).toHaveLength(SITES.length * HOVER_EFFECTS_PER_CARD);

        for (const effect of hoverEffects) {
            expect(html, effect).toContain(effect.replace('hover:', 'focus-visible:'));
        }
    });

    test('hides the three decorative layers and the arrow icon of every card from assistive tech', () => {
        for (const { hook, markup } of DECORATIONS) {
            expect(html.split(markup).length - 1, hook).toBe(SITES.length);
        }

        expect(html.split('<svg ').length - 1).toBe(SITES.length);
        expect(html.split('aria-hidden="true"').length - 1).toBe(SITES.length * (DECORATIONS.length + 1));
    });
});
