import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, test } from 'vitest';

import ErrorNotFound from '../../src/sections/ErrorNotFound.astro';

const HEADING = '<h1 id="error-not-found-title" class="mb-[clamp(1.5rem,calc(1rem+2.5vw),3rem)] font-semibold leading-none text-[clamp(6rem,calc(3rem+15vw),15rem)] tracking-widest bg-clip-text bg-linear-to-b from-white-60 text-transparent to-white-40">404</h1>';

const HOVER_EFFECTS = [
    'bg-white-20',
    'border-cyan-80',
    'text-cyan-80',
    'text-shadow-[0_0_1.25rem_var(--color-cyan-80)]',
] as const;

const LINK = '<a class="active:opacity-70 focus-visible:bg-white-20 focus-visible:border-cyan-80 focus-visible:text-cyan-80 focus-visible:text-shadow-[0_0_1.25rem_var(--color-cyan-80)] hover:bg-white-20 hover:border-cyan-80 hover:text-cyan-80 hover:text-shadow-[0_0_1.25rem_var(--color-cyan-80)] inline-block min-h-[clamp(2.75rem,calc(2.5rem+1.25vw),3.5rem)] px-[clamp(1.25rem,calc(1rem+1.25vw),2rem)] py-4 border border-white-20 font-mono text-base tracking-[0.2em] uppercase text-white-60 duration-(--duration-fast) ease-[ease] transition-[background-color,border-color,color,opacity,text-shadow]" aria-label="Return to home" href="/">Return</a>';
const REVEAL = '<div class="text-center" data-scroll="up">';
const SECTION = '<section class="section flex flex-1 items-center justify-center" aria-labelledby="error-not-found-title">';

describe('ErrorNotFound', () => {
    let html: string;

    beforeAll(async () => {
        const container = await AstroContainer.create();

        html = await container.renderToString(ErrorNotFound);
    });

    test('labels the only section by the status code heading', () => {
        expect(html).toContain(SECTION);
        expect(html.split('<section').length - 1).toBe(1);
        expect(html.split('id="error-not-found-title"').length - 1).toBe(1);
    });

    test('renders 404 as the only heading', () => {
        expect(html).toContain(HEADING);
        expect(html.split('<h1').length - 1).toBe(1);
    });

    test('closes the section with a labelled return link back to the home page after the heading', () => {
        expect(html).toContain(LINK);
        expect(html.split('<a ').length - 1).toBe(1);
        expect(html.indexOf(LINK)).toBeGreaterThan(html.indexOf(HEADING));
        expect(html.endsWith(`${LINK}</div></section>`)).toBe(true);
    });

    test('mirrors every return link hover effect on focus visible', () => {
        const hoverEffects = [...html.matchAll(/ hover:(\S+)/g)].map(match => match[1]);

        expect(hoverEffects).toEqual(HOVER_EFFECTS);

        for (const effect of hoverEffects) {
            expect(html, effect).toContain(`focus-visible:${effect}`);
        }
    });

    test('wraps the content in exactly one centered scroll reveal directly inside the section', () => {
        expect(html).toContain(`${SECTION}${REVEAL}`);
        expect(html.split('data-scroll').length - 1).toBe(1);
    });
});
