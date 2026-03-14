import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, test } from 'vitest';
import Footer from '../../src/sections/Footer.astro';

describe('Footer', () => {
    test('renders copyright with current year', async () => {
        const container = await AstroContainer.create();
        const html = await container.renderToString(Footer);
        const year = new Date().getFullYear();

        expect(html).toContain(`&copy; ${year}`);
    });

    test('renders brand name', async () => {
        const container = await AstroContainer.create();
        const html = await container.renderToString(Footer);

        expect(html).toContain('Aephonics');
    });

    test('renders as footer element', async () => {
        const container = await AstroContainer.create();
        const html = await container.renderToString(Footer);

        expect(html).toMatch(/<footer[\s>]/);
    });
});
