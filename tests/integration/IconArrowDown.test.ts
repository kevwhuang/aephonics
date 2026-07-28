import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, test } from 'vitest';

import IconArrowDown from '../../src/components/IconArrowDown.astro';

const PATH = '<path d="M19 14l-7 7m0 0l-7-7m7 7V3" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>';
const SVG = '<svg class="h-8 w-8 text-white drop-shadow-[0_0_0.625rem_var(--color-white-50)]" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">';

describe('IconArrowDown', () => {
    let html: string;

    beforeAll(async () => {
        const container = await AstroContainer.create();

        html = await container.renderToString(IconArrowDown);
    });

    test('renders one unfilled 24 by 24 svg sized at two rem square, glowing white, and hidden from assistive tech', () => {
        expect(html).toContain(SVG);
        expect(html.split('<svg').length - 1).toBe(1);
    });

    test('draws exactly one rounded downward arrow path in the current stroke color', () => {
        expect(html).toContain(PATH);
        expect(html.split('<path').length - 1).toBe(1);
    });

    test('inlines the artwork without referencing an external asset', () => {
        expect(html).not.toContain('href=');
        expect(html).not.toContain('src=');
        expect(html).not.toContain('url(');
    });
});
