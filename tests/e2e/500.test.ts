import { expect, test } from '@playwright/test';

const HOME_TITLE = 'Aephonics';
const ROBOTS_POLICY = 'noindex, nofollow';
const SERVER_ERROR_PATH = '/500';
const SERVER_ERROR_TITLE = 'Server Error \u2014 Aephonics';
const TEXT_TRANSFORM = 'uppercase';

test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
});

test.describe('500 page', () => {
    test('returns a 500 status with the error heading on direct visit', async ({ page }) => {
        const response = await page.goto(SERVER_ERROR_PATH);

        expect(response?.status()).toBe(500);

        await expect(page).toHaveTitle(SERVER_ERROR_TITLE);
        await expect(page.locator('#error-server-title')).toHaveText('500');
        await expect(page.locator('h1')).toHaveCount(1);
    });

    test('blocks crawlers with a noindex robots policy', async ({ page }) => {
        await page.goto(SERVER_ERROR_PATH);

        const robots = page.locator('meta[name="robots"]');

        await expect(robots).toHaveCount(1);
        await expect(robots).toHaveAttribute('content', ROBOTS_POLICY);
    });

    test('navigates home from the return link', async ({ page }) => {
        await page.goto(SERVER_ERROR_PATH);

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
