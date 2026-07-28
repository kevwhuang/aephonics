import { expect, test } from '@playwright/test';

const DEEP_NOT_FOUND_PATH = '/sites/nope/deep';
const HOME_TITLE = 'Aephonics';
const NOT_FOUND_PATH = '/this-page-does-not-exist';
const NOT_FOUND_TITLE = 'Page Not Found \u2014 Aephonics';
const ROBOTS_POLICY = 'noindex, nofollow';
const TEXT_TRANSFORM = 'uppercase';

test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
});

test.describe('404 page', () => {
    test('returns a 404 status with the error heading for an unknown path', async ({ page }) => {
        const response = await page.goto(NOT_FOUND_PATH);

        expect(response?.status()).toBe(404);

        await expect(page).toHaveTitle(NOT_FOUND_TITLE);
        await expect(page.locator('#error-not-found-title')).toHaveText('404');
        await expect(page.locator('h1')).toHaveCount(1);
    });

    test('returns a 404 status for deep unknown paths', async ({ page }) => {
        const response = await page.goto(DEEP_NOT_FOUND_PATH);

        expect(response?.status()).toBe(404);

        await expect(page).toHaveTitle(NOT_FOUND_TITLE);
        await expect(page.locator('#error-not-found-title')).toHaveText('404');
    });

    test('blocks crawlers with a noindex robots policy', async ({ page }) => {
        await page.goto(NOT_FOUND_PATH);

        const robots = page.locator('meta[name="robots"]');

        await expect(robots).toHaveCount(1);
        await expect(robots).toHaveAttribute('content', ROBOTS_POLICY);
    });

    test('navigates home from the return link', async ({ page }) => {
        await page.goto(NOT_FOUND_PATH);

        const link = page.getByRole('link', { name: 'Return to home' });

        await expect(link).toHaveAttribute('href', '/');
        await expect(link).toHaveText('Return');

        const textTransform = await link.evaluate(element => getComputedStyle(element).textTransform);

        expect(textTransform, 'return link visual casing').toBe(TEXT_TRANSFORM);

        await link.click();

        await expect(page).toHaveTitle(HOME_TITLE);
        await expect(page).toHaveURL('/');
    });
});
