import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, test } from 'vitest';

import Footer from '../../src/sections/Footer.astro';

const SHELL = '<footer class="section border-t border-white-10 bg-zinc-950"><div class="shell"><p class="text-center text-sm text-zinc-400">';

const year = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', year: 'numeric' }).format(new Date());

describe('Footer', () => {
    let html: string;

    beforeAll(async () => {
        const container = await AstroContainer.create();

        html = await container.renderToString(Footer);
    });

    test('renders the copyright line inside a bordered section shell', () => {
        expect(html.startsWith(SHELL)).toBe(true);
        expect(html.endsWith('</p></div></footer>')).toBe(true);
    });

    test('stamps the central time year in a machine-readable time element', () => {
        expect(html).toContain(`<time datetime="${year}">${year}</time>`);
        expect(html.split('<time ').length - 1).toBe(1);
    });

    test('credits the site after the copyright symbol and the year', () => {
        expect(html).toContain(`&copy; <time datetime="${year}">${year}</time> Aephonics. All rights reserved.</p>`);
    });
});
