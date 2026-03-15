import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, test } from 'vitest';

import Sites from '../../src/sections/Sites.astro';

const expectedSites = [
    { href: 'https://algo.aephonics.com', title: 'Algo' },
    { href: 'https://dev.aephonics.com', title: 'Dev' },
    { href: 'https://music.aephonics.com', title: 'Music' },
    { href: 'https://travel.aephonics.com', title: 'Travel' },
];

describe('Sites', () => {
    test('renders all four site cards', async () => {
        const container = await AstroContainer.create();
        const html = await container.renderToString(Sites);

        expectedSites.forEach(({ title }) => {
            expect(html).toContain(title);
        });
    });

    test('links to correct subdomains', async () => {
        const container = await AstroContainer.create();
        const html = await container.renderToString(Sites);

        expectedSites.forEach(({ href }) => {
            expect(html).toContain(`href="${href}"`);
        });
    });

    test('each card has an aria-label', async () => {
        const container = await AstroContainer.create();
        const html = await container.renderToString(Sites);

        expectedSites.forEach(({ title }) => {
            expect(html).toContain(`aria-label="Visit ${title}"`);
        });
    });

    test('each card has a description', async () => {
        const container = await AstroContainer.create();
        const html = await container.renderToString(Sites);

        expect(html).toContain('Complexity tamed into elegant solutions');
        expect(html).toContain('Building the systems that power tomorrow');
        expect(html).toContain('Frequencies shaped into feeling');
        expect(html).toContain('Worlds witnessed, moments preserved');
    });

    test('card icons are hidden from assistive technology', async () => {
        const container = await AstroContainer.create();
        const html = await container.renderToString(Sites);

        const svgMatches = html.match(/<svg[^>]*>/g) || [];
        expect(svgMatches.length).toBe(4);
        svgMatches.forEach((svg) => {
            expect(svg).toContain('aria-hidden="true"');
        });
    });
});
