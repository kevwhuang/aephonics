import { expect, test } from '@playwright/test';

import type { Locator, Page } from '@playwright/test';

const ARROW_SELECTOR = '.hero__arrow';
const CARD_SELECTOR = '[data-scroll-stagger] > li';
const HERO_CANVAS_COUNT = 2;
const HIDDEN_CARD_OPACITIES = [0, 0, 0, 0] as const;
const HIDDEN_TRANSFORM = 'matrix(1, 0, 0, 1, 0, 60)';
const LIST_SELECTOR = 'ul[data-scroll]';
const POLL = { timeout: 10_000 };
const POLL_TIGHT = { intervals: [100], timeout: 10_000 };
const PULSE_SAMPLE_FRAMES = 12;
const RESIZED_VIEWPORT = { height: 900, width: 1_000 } as const;
const REVEALED_CARD_OPACITIES = [1, 1, 1, 1] as const;
const SCROLL_ELEMENT_COUNT = 1;
const SCROLL_PAST_ARROW = 200;
const SETTLED_TRANSFORM = 'matrix(1, 0, 0, 1, 0, 0)';
const SITE_CARD_COUNT = 4;
const TITLE_TEXT = 'Aephonics';

const HIDDEN_CARD_TRANSFORMS = [HIDDEN_TRANSFORM, HIDDEN_TRANSFORM, HIDDEN_TRANSFORM, HIDDEN_TRANSFORM] as const;
const SETTLED_CARD_TRANSFORMS = [SETTLED_TRANSFORM, SETTLED_TRANSFORM, SETTLED_TRANSFORM, SETTLED_TRANSFORM] as const;

function countPaintedPulseFrames(page: Page) {
    return page.evaluate(frames => new Promise<number>((resolve) => {
        const ALPHA_CHANNEL_OFFSET = 3;
        const MISSING_CANVAS = -1;
        const PIXEL_STRIDE = 4;

        const canvas = document.querySelector<HTMLCanvasElement>('.hero__pulses');

        const context = canvas?.getContext('2d');

        if (!canvas || !context || canvas.height === 0 || canvas.width === 0) {
            resolve(MISSING_CANVAS);

            return;
        }

        let painted = 0;
        let remaining = frames;

        function sample() {
            const { data } = context.getImageData(0, 0, canvas.width, canvas.height);

            for (let index = ALPHA_CHANNEL_OFFSET; index < data.length; index += PIXEL_STRIDE) {
                if (data[index] !== 0) {
                    painted += 1;

                    break;
                }
            }

            remaining -= 1;

            if (remaining <= 0) {
                resolve(painted);

                return;
            }

            requestAnimationFrame(sample);
        }

        requestAnimationFrame(sample);
    }), PULSE_SAMPLE_FRAMES);
}

async function expectCardsHidden(page: Page) {
    const cards = page.locator(CARD_SELECTOR);

    await expect(cards, 'site card count').toHaveCount(SITE_CARD_COUNT);
    await expect.poll(() => getTransforms(cards), POLL).toEqual(HIDDEN_CARD_TRANSFORMS);
    expect(await getOpacities(page), 'card opacities before the reveal').toEqual(HIDDEN_CARD_OPACITIES);
}

async function expectCardsRevealed(page: Page) {
    const cards = page.locator(CARD_SELECTOR);

    await expect.poll(() => getOpacities(page), POLL).toEqual(REVEALED_CARD_OPACITIES);
    await expect.poll(() => getTransforms(cards), POLL).toEqual(SETTLED_CARD_TRANSFORMS);
}

async function expectScrollContentShown(page: Page) {
    function areInlineShown() {
        return page.locator('[data-scroll]').evaluateAll(elements => elements.every(
            element => element instanceof HTMLElement && element.style.opacity === '1',
        ));
    }

    function areRevealed() {
        return page.locator('[data-scroll], [data-scroll-stagger] > *').evaluateAll(
            elements => elements.every((element) => {
                const style = getComputedStyle(element);

                return style.opacity === '1' && style.transform === 'none';
            }),
        );
    }

    await expect(page.locator('[data-scroll]'), 'scroll element count').toHaveCount(SCROLL_ELEMENT_COUNT);
    await expect.poll(areInlineShown, POLL).toBe(true);
    await expect.poll(areRevealed, POLL).toBe(true);
}

function getHeroSizes(page: Page) {
    return page.evaluate(() => {
        const section = document.querySelector<HTMLElement>('.hero');

        return {
            canvases: [...document.querySelectorAll<HTMLCanvasElement>('.hero__grid, .hero__pulses')].map(
                canvas => ({ height: canvas.height, width: canvas.width }),
            ),
            section: { height: section?.offsetHeight ?? 0, width: section?.offsetWidth ?? 0 },
        };
    });
}

function getInlineOpacity(page: Page) {
    return page.locator(ARROW_SELECTOR).evaluate(
        element => (element instanceof HTMLElement ? element.style.opacity : ''),
    );
}

function getOpacities(page: Page) {
    return page.locator(CARD_SELECTOR).evaluateAll(
        elements => elements.map(element => Number.parseFloat(getComputedStyle(element).opacity)),
    );
}

function getOpacity(locator: Locator) {
    return locator.evaluate(element => getComputedStyle(element).opacity);
}

function getTransforms(locator: Locator) {
    return locator.evaluateAll(elements => elements.map(element => getComputedStyle(element).transform));
}

function scrollToCenter(page: Page) {
    return page.locator(LIST_SELECTOR).evaluate((element) => {
        element.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
}

test.describe('scroll motion', () => {
    test('types the hero title out, fades the tagline in, and reveals the arrow on load', async ({ page }) => {
        await page.goto('/');

        await expect.poll(() => page.locator('.hero__title').textContent(), POLL).toBe(TITLE_TEXT);
        await expect(page.locator('canvas[data-revealed]')).toHaveCount(HERO_CANVAS_COUNT);
        await expect.poll(() => getOpacity(page.locator('.hero__tagline')), POLL).toBe('1');
        await expect.poll(() => getOpacity(page.locator(ARROW_SELECTOR)), POLL).toBe('1');
    });

    test('paints the pulse canvas once the intro sequence hands off to the pulses', async ({ page }) => {
        await page.goto('/');

        await expect.poll(() => countPaintedPulseFrames(page), POLL).toBeGreaterThan(0);
    });

    test('resizes both hero canvases to the section box and keeps them revealed', async ({ page }) => {
        const errors: string[] = [];

        page.on('console', (message) => {
            if (message.type() === 'error') errors.push(message.text());
        });

        await page.goto('/');

        await expect(page.locator('canvas[data-revealed]')).toHaveCount(HERO_CANVAS_COUNT);

        await page.setViewportSize(RESIZED_VIEWPORT);

        await expect.poll(() => getHeroSizes(page), POLL).toEqual({
            canvases: [RESIZED_VIEWPORT, RESIZED_VIEWPORT],
            section: RESIZED_VIEWPORT,
        });
        await expect(page.locator('canvas[data-revealed]')).toHaveCount(HERO_CANVAS_COUNT);
        expect(errors, 'console errors after the resize').toEqual([]);
    });

    test('keeps the site cards hidden and offset in an opaque list until scrolled into view', async ({ page }) => {
        await page.goto('/');

        const list = page.locator(LIST_SELECTOR);

        await expectCardsHidden(page);
        await expect.poll(() => getOpacity(list), POLL).toBe('1');

        await scrollToCenter(page);

        await expect.poll(async () => {
            const opacities = await getOpacities(page);

            return opacities.every((opacity, index) => index === 0 || opacity <= opacities[index - 1])
                && opacities[0] > opacities[opacities.length - 1];
        }, POLL_TIGHT).toBe(true);

        await expectCardsRevealed(page);
    });

    test('leaves the footer out of the scroll reveal system so it never hides', async ({ page }) => {
        await page.goto('/');

        const footer = page.locator('footer');

        await expect(footer).toHaveCount(1);
        await expect(page.locator('footer [data-scroll]')).toHaveCount(0);
        await expect(page.locator('footer[data-scroll]')).toHaveCount(0);
        expect(await getOpacity(footer)).toBe('1');
        expect(await getTransforms(footer)).toEqual(['none']);
    });

    test('retypes the hero title and re-arms the card reveal on a client router return home', async ({ page }) => {
        await page.goto('/nonexistent-404');

        await expect.poll(() => getOpacity(page.locator('[data-scroll]')), POLL).toBe('1');

        await page.getByRole('link', { name: 'Return to home' }).click();
        await expect(page).toHaveURL('/');
        await expect.poll(() => page.locator('.hero__title').textContent(), POLL).toBe(TITLE_TEXT);
        await expectCardsHidden(page);

        await scrollToCenter(page);

        await expectCardsRevealed(page);
    });
});

test.describe('scroll motion under reduced motion', () => {
    test.beforeEach(async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' });
    });

    test('shows every home page data-scroll element and stagger child immediately', async ({ page }) => {
        await page.goto('/');

        await expectScrollContentShown(page);
    });

    test('shows every not found page data-scroll element immediately', async ({ page }) => {
        await page.goto('/nonexistent-404');

        await expectScrollContentShown(page);
    });

    test('shows every server error page data-scroll element immediately', async ({ page }) => {
        await page.goto('/500');

        await expectScrollContentShown(page);
    });

    test('skips the typewriter and shows the full hero title, tagline, and arrow immediately', async ({ page }) => {
        await page.goto('/');

        await expect.poll(() => page.locator('.hero__title').textContent(), POLL).toBe(TITLE_TEXT);
        await expect(page.locator('.hero__cursor')).toHaveCount(0);
        await expect.poll(() => getOpacity(page.locator('.hero__tagline')), POLL).toBe('1');
        await expect.poll(() => getOpacity(page.locator(ARROW_SELECTOR)), POLL).toBe('1');
    });

    test('hides the hero arrow past the scroll threshold and restores it back at the top', async ({ page }) => {
        await page.goto('/');

        await expect.poll(() => getInlineOpacity(page), POLL).toBe('1');

        await page.evaluate(offset => window.scrollTo(0, offset), SCROLL_PAST_ARROW);

        await expect.poll(() => getInlineOpacity(page), POLL).toBe('0');

        await page.evaluate(() => window.scrollTo(0, 0));

        await expect.poll(() => getInlineOpacity(page), POLL).toBe('1');
    });

    test('reveals both hero canvases at once and leaves the pulse canvas static', async ({ page }) => {
        await page.goto('/');

        await expect(page.locator('canvas[data-revealed]')).toHaveCount(HERO_CANVAS_COUNT);
        await expect.poll(() => countPaintedPulseFrames(page), POLL).toBe(0);
    });
});
