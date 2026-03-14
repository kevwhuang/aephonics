import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, test } from 'vitest';
import Hero from '../../src/sections/Hero.astro';

describe('Hero', () => {
    test('renders h1 with aria-label and fallback text', async () => {
        const container = await AstroContainer.create();
        const html = await container.renderToString(Hero);

        expect(html).toContain('aria-label="aephonics"');
        expect(html).toContain('aephonics');
    });

    test('renders all three tagline tags', async () => {
        const container = await AstroContainer.create();
        const html = await container.renderToString(Hero);

        expect(html).toContain('hero__tag--atx');
        expect(html).toContain('hero__tag--syntax');
        expect(html).toContain('hero__tag--wavs');
        expect(html).toContain('atx');
        expect(html).toContain('syntax');
        expect(html).toContain('wavs');
    });

    test('renders canvas elements with aria-hidden', async () => {
        const container = await AstroContainer.create();
        const html = await container.renderToString(Hero);

        expect(html).toContain('hero__grid');
        expect(html).toContain('hero__pulses');

        const canvasMatches = html.match(/<canvas[^>]*>/g) || [];
        expect(canvasMatches.length).toBe(2);
        canvasMatches.forEach((canvas) => {
            expect(canvas).toContain('aria-hidden="true"');
        });
    });

    test('renders scroll arrow with aria-hidden svg', async () => {
        const container = await AstroContainer.create();
        const html = await container.renderToString(Hero);

        expect(html).toContain('hero__arrow');
        expect(html).toMatch(/<svg[^>]*aria-hidden="true"/);
    });
});
