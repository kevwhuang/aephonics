import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, test } from 'vitest';

import IconArrowUpRight from '../../src/components/IconArrowUpRight.astro';

const HOVER_EFFECTS = [
    '-translate-y-1',
    'drop-shadow-[0_0_0.5rem_var(--accent-50)]',
    'text-(--accent)',
    'translate-x-1',
] as const;

const PATH = '<path d="M7 17L17 7M17 7H7M17 7V17" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>';
const SVG = '<svg class="group-focus-visible:-translate-y-1 group-focus-visible:drop-shadow-[0_0_0.5rem_var(--accent-50)] group-focus-visible:text-(--accent) group-focus-visible:translate-x-1 group-hover:-translate-y-1 group-hover:drop-shadow-[0_0_0.5rem_var(--accent-50)] group-hover:text-(--accent) group-hover:translate-x-1 absolute right-[clamp(1.5rem,calc(0.6667rem+4.1667vw),4rem)] top-[clamp(1.5rem,calc(0.6667rem+4.1667vw),4rem)] h-6 w-6 text-zinc-600 duration-(--duration-base) ease-[ease] transition-[color,filter,translate]" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">';

describe('IconArrowUpRight', () => {
    let html: string;

    beforeAll(async () => {
        const container = await AstroContainer.create();

        html = await container.renderToString(IconArrowUpRight);
    });

    test('renders one unfilled 24 by 24 svg pinned to the card corner at one and a half rem square and hidden from assistive tech', () => {
        expect(html).toContain(SVG);
        expect(html.split('<svg').length - 1).toBe(1);
    });

    test('mirrors every group hover effect on group focus visible', () => {
        const hoverEffects = [...html.matchAll(/ group-hover:(\S+)/g)].map(match => match[1]);

        expect(hoverEffects).toEqual(HOVER_EFFECTS);

        for (const effect of hoverEffects) {
            expect(html, effect).toContain(`group-focus-visible:${effect}`);
        }
    });

    test('draws exactly one rounded up right arrow path in the current stroke color', () => {
        expect(html).toContain(PATH);
        expect(html.split('<path').length - 1).toBe(1);
    });

    test('inlines the artwork without referencing an external asset', () => {
        expect(html).not.toContain('href=');
        expect(html).not.toContain('src=');
        expect(html).not.toContain('url(');
    });
});
