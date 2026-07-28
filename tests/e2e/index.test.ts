import { expect, test } from '@playwright/test';

const DESCRIPTION_MAX = 160;
const DESCRIPTION_MIN = 120;
const HERO_TAGS = ['atx', 'syntax', 'wavs'] as const;
const HERO_TITLE = 'Aephonics';
const OG_IMAGE_URL = 'https://aephonics.com/og.png';

const SITE_CARDS = [
    {
        description: 'Algorithms and data structures',
        href: 'https://algo.aephonics.com',
        name: 'Visit Algo',
        title: 'Algo',
    },
    {
        description: 'Web engineering portfolio',
        href: 'https://dev.aephonics.com',
        name: 'Visit Dev',
        title: 'Dev',
    },
    {
        description: 'Producer catalog',
        href: 'https://music.aephonics.com',
        name: 'Visit Music',
        title: 'Music',
    },
    {
        description: 'Interactive map',
        href: 'https://travel.aephonics.com',
        name: 'Visit Travel',
        title: 'Travel',
    },
] as const;

const SITE_URL = 'https://aephonics.com/';
const TEXT_TRANSFORM = 'uppercase';
const TIME_ZONE = 'America/Chicago';

test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
});

test.describe('index page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('loads with the bare site title', async ({ page }) => {
        await expect(page).toHaveTitle('Aephonics');
    });

    test('shows the hero heading with its accessible label above the tagline tags', async ({ page }) => {
        const title = page.locator('#hero-title');

        await expect(title).toBeVisible();
        await expect(title).toHaveAttribute('aria-label', 'Aephonics');
        await expect(title).toHaveText(HERO_TITLE);
        await expect(page.locator('.hero__tag')).toHaveText([...HERO_TAGS]);

        const textTransform = await title.evaluate(element => getComputedStyle(element).textTransform);

        expect(textTransform, 'hero title visual casing').toBe(TEXT_TRANSFORM);
    });

    test('shows every site card linking to its subdomain in a new tab', async ({ page }) => {
        for (const { description, href, name, title } of SITE_CARDS) {
            const card = page.getByRole('link', { name });

            await expect(card, `visibility for ${name}`).toBeVisible();
            await expect(card, `href for ${name}`).toHaveAttribute('href', href);
            await expect(card, `rel for ${name}`).toHaveAttribute('rel', 'noopener');
            await expect(card, `target for ${name}`).toHaveAttribute('target', '_blank');
            await expect(card.locator('h2'), `title for ${name}`).toHaveText(title);
            await expect(card.locator('p'), `description for ${name}`).toHaveText(description);
        }
    });

    test('renders the footer year in central time', async ({ page }) => {
        const time = page.locator('footer time');
        const year = new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, year: 'numeric' }).format(new Date());

        await expect(time).toHaveAttribute('datetime', year);
        await expect(time).toHaveText(year);
    });

    test('exposes a meta description of the expected length', async ({ page }) => {
        const description = await page.locator('meta[name="description"]').getAttribute('content');

        expect(description).not.toBeNull();
        expect(String(description).length).toBeGreaterThanOrEqual(DESCRIPTION_MIN);
        expect(String(description).length).toBeLessThanOrEqual(DESCRIPTION_MAX);
    });

    test('resolves the canonical link, share urls, and share image against the site origin', async ({ page }) => {
        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', SITE_URL);
        await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', OG_IMAGE_URL);
        await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', SITE_URL);
        await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute('content', OG_IMAGE_URL);
    });

    test('embeds parseable json-ld website data', async ({ page }) => {
        const raw = await page.locator('script[type="application/ld+json"]').textContent();

        const data = JSON.parse(String(raw)) as { '@type': string; 'name': string; 'url': string };

        expect(data['@type']).toBe('WebSite');
        expect(data.name).toBe('Aephonics');
        expect(data.url).toBe(SITE_URL);
    });

    test('fits the default viewport without horizontal overflow', async ({ page }) => {
        const metrics = await page.evaluate(() => ({
            clientWidth: document.documentElement.clientWidth,
            scrollWidth: document.documentElement.scrollWidth,
        }));

        expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
    });

    test('loads without console errors', async ({ page }) => {
        const errors: string[] = [];

        page.on('console', (message) => {
            if (message.type() === 'error') errors.push(message.text());
        });

        await page.goto('/');
        await page.waitForLoadState('networkidle');

        expect(errors).toEqual([]);
    });
});
