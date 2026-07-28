import { expect, test } from '@playwright/test';

import type { Page } from '@playwright/test';

const ARROW_SELECTOR = '.hero__arrow';
const HERO_HEIGHTS = [320, 360, 400, 480, 570, 700, 900] as const;
const HERO_WIDTHS = [320, 375, 768, 1_024, 1_280, 1_440] as const;

const PAGES = [
    { name: 'home', path: '/' },
    { name: 'server error', path: '/500' },
    { name: 'not found', path: '/nonexistent-404' },
] as const;

const PROPORTION_MIN_HEIGHT = 400;
const VIEWPORT_HEIGHT = 800;
const WIDTHS = [320, 375, 767, 768, 769, 1_023, 1_024, 1_025, 1_280, 1_440] as const;

async function getHeroGaps(page: Page) {
    const arrow = await page.locator(`${ARROW_SELECTOR} svg`).boundingBox();
    const tagline = await page.locator('.hero__tagline').boundingBox();
    const title = await page.locator('.hero__title').boundingBox();

    if (!arrow || !tagline || !title) throw new Error('hero elements are not visible');

    return { arrowGap: arrow.y - (tagline.y + tagline.height), stackGap: tagline.y - (title.y + title.height) };
}

test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
});

test.describe('responsive layout', () => {
    for (const { name, path } of PAGES) {
        test(`${name} page has no horizontal overflow at any width`, async ({ page }) => {
            await page.setViewportSize({ height: VIEWPORT_HEIGHT, width: WIDTHS[0] });
            await page.goto(path);
            await page.locator('main').waitFor();

            for (const width of WIDTHS) {
                await page.setViewportSize({ height: VIEWPORT_HEIGHT, width });

                const delta = await page.evaluate(
                    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
                );

                expect(delta, `horizontal overflow at width ${width}`).toBeLessThanOrEqual(0);
            }
        });
    }

    for (const width of HERO_WIDTHS) {
        test(`hero scroll arrow clears the tagline at every height at width ${width}`, async ({ page }) => {
            for (const height of HERO_HEIGHTS) {
                await page.setViewportSize({ height, width });
                await page.goto('/');
                await page.locator(ARROW_SELECTOR).waitFor();

                const { arrowGap, stackGap } = await getHeroGaps(page);

                expect(arrowGap, `arrow overlaps tagline at ${width}x${height}`).toBeGreaterThanOrEqual(0);

                if (height < PROPORTION_MIN_HEIGHT) continue;

                expect(arrowGap, `arrow crowds tagline at ${width}x${height}`).toBeGreaterThanOrEqual(stackGap);
            }
        });
    }
});
