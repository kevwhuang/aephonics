import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, test, vi } from 'vitest';

import Layout from '../../src/Layout.astro';

const DESCRIPTION = 'Aephonics is Kevin Huang\'s personal hub linking his four project sites: algorithm practice, a web engineering portfolio, a music catalog, and a travel map.';
const FOOTER = '<footer class="section border-t border-white-10 bg-zinc-950"';
const MAIN = '<main class="flex flex-1 flex-col">';
const NOINDEX_DESCRIPTION = 'The page you\'re looking for doesn\'t exist on Aephonics. Head back to the home page to reach the algorithm, web engineering, music, and travel sites.';
const NOINDEX_TITLE = 'Page Not Found \u2014 Aephonics';
const SITE = 'https://aephonics.com';
const SLOT = '<section data-slot="page">Slot content</section>';
const TITLE = 'Aephonics';

class SiteAwareUrl extends URL {
    constructor(input: URL | string, base?: URL | string) {
        super(input, base ?? SITE);
    }
}

async function renderLayout(props: { description: string; noindex?: boolean; title: string }) {
    const container = await AstroContainer.create();

    vi.stubGlobal('URL', SiteAwareUrl);

    try {
        return await container.renderToString(Layout, { partial: false, props, slots: { default: SLOT } });
    } finally {
        vi.unstubAllGlobals();
    }
}

describe('Layout', () => {
    let html: string;

    beforeAll(async () => {
        html = await renderLayout({ description: DESCRIPTION, title: TITLE });
    });

    test('renders the full document skeleton', () => {
        expect(html).toContain('<!DOCTYPE html>');
        expect(html).toContain('<html lang="en">');
        expect(html).toContain('<head>');
        expect(html).toContain('</head>');
        expect(html).toContain('<body class="flex flex-col min-h-svh antialiased font-sans bg-zinc-950 text-white">');
        expect(html).toContain('</body></html>');
    });

    test('declares the charset and viewport metas', () => {
        expect(html).toContain('<meta charset="utf-8">');
        expect(html).toContain('<meta content="width=device-width, initial-scale=1" name="viewport">');
    });

    test('renders the title prop as the only document title', () => {
        expect(html).toContain(`<title>${TITLE}</title>`);
        expect(html.split('<title>').length - 1).toBe(1);
    });

    test('wires the description prop into the description and social description metas', () => {
        expect(html).toContain(`<meta content="${DESCRIPTION}" name="description">`);
        expect(html).toContain(`<meta content="${DESCRIPTION}" property="og:description">`);
        expect(html).toContain(`<meta content="${DESCRIPTION}" name="twitter:description">`);
    });

    test('mirrors the title prop into the social title metas', () => {
        expect(html).toContain(`<meta content="${TITLE}" property="og:title">`);
        expect(html).toContain(`<meta content="${TITLE}" name="twitter:title">`);
    });

    test('points the single canonical link and og:url at the site url', () => {
        expect(html).toContain(`<link href="${SITE}/" rel="canonical">`);
        expect(html).toContain(`<meta content="${SITE}/" property="og:url">`);
        expect(html.split('rel="canonical"').length - 1).toBe(1);
    });

    test('renders the author, theme color, og site name, og type, and twitter card metas', () => {
        expect(html).toContain('<meta content="Kevin Huang" name="author">');
        expect(html).toContain('<meta content="#09090b" name="theme-color">');
        expect(html).toContain('<meta content="Aephonics" property="og:site_name">');
        expect(html).toContain('<meta content="website" property="og:type">');
        expect(html).toContain('<meta content="summary_large_image" name="twitter:card">');
    });

    test('allows indexing without the noindex prop', () => {
        expect(html).toContain('<meta content="index, follow" name="robots">');
        expect(html).not.toContain('noindex');
    });

    test('blocks indexing when the noindex prop is set', async () => {
        const noindexed = await renderLayout({ description: NOINDEX_DESCRIPTION, noindex: true, title: NOINDEX_TITLE });

        expect(noindexed).toContain('<meta content="noindex, nofollow" name="robots">');
        expect(noindexed).not.toContain('<meta content="index, follow" name="robots">');
        expect(noindexed).toContain(`<title>${NOINDEX_TITLE}</title>`);
        expect(noindexed).toContain(`<meta content="${NOINDEX_DESCRIPTION}" name="description">`);
    });

    test('points the social image metas at og.png', () => {
        expect(html).toMatch(/<meta content="[^"]*og\.png" property="og:image">/);
        expect(html).toMatch(/<meta content="[^"]*og\.png" name="twitter:image">/);
        expect(html.split('og.png').length - 1).toBe(2);
    });

    test('links the touch icon and favicon', () => {
        expect(html).toContain('<link href="/apple-touch-icon.png" rel="apple-touch-icon">');
        expect(html).toContain('<link href="/favicon.svg" rel="icon" type="image/svg+xml">');
    });

    test('embeds parseable json-ld describing the site', () => {
        const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);

        const jsonLd = match ? JSON.parse(match[1]) : null;

        expect(jsonLd).not.toBeNull();
        expect(jsonLd['@context']).toBe('https://schema.org');
        expect(jsonLd['@type']).toBe('WebSite');
        expect(jsonLd.author).toEqual({ '@type': 'Person', 'name': 'Kevin Huang' });
        expect(jsonLd.inLanguage).toBe('en');
        expect(jsonLd.name).toBe('Aephonics');
        expect(html.split('application/ld+json').length - 1).toBe(1);
    });

    test('enables the client router once', () => {
        expect(html).toContain('<meta name="astro-view-transitions-enabled" content="true">');
        expect(html).toContain('<meta name="astro-view-transitions-fallback" content="animate">');
        expect(html.split('ClientRouter.astro?astro&type=script').length - 1).toBe(1);
    });

    test('attaches exactly one page-load script hook', () => {
        expect(html.split('Layout.astro?astro&type=script').length - 1).toBe(1);
    });

    test('renders slot content inside main between the body bounds', () => {
        expect(html).toContain(`${MAIN}${SLOT}</main>`);
        expect(html.indexOf(MAIN)).toBeGreaterThan(html.indexOf('<body'));
        expect(html.indexOf('</main>')).toBeLessThan(html.indexOf('</body>'));
    });

    test('renders the footer chrome directly after the main landmark', () => {
        expect(html).toContain(`</main>${FOOTER}`);
        expect(html.indexOf(FOOTER)).toBeLessThan(html.indexOf('</body>'));
    });
});
