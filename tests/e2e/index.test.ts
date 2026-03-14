import { expect, test } from '@playwright/test';

test.describe('index page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('loads with correct title', async ({ page }) => {
        await expect(page).toHaveTitle('Aephonics');
    });

    test('displays hero heading', async ({ page }) => {
        const h1 = page.locator('h1');
        await expect(h1).toHaveAttribute('aria-label', 'aephonics');
    });

    test('displays all three tagline tags', async ({ page }) => {
        await expect(page.locator('.hero__tag--atx')).toHaveText('atx');
        await expect(page.locator('.hero__tag--syntax')).toHaveText('syntax');
        await expect(page.locator('.hero__tag--wavs')).toHaveText('wavs');
    });

    test('renders all four site cards', async ({ page }) => {
        const cards = page.locator('.card');
        await expect(cards).toHaveCount(4);
    });

    test('site cards link to correct subdomains', async ({ page }) => {
        await expect(page.locator('a[aria-label="Visit Algo"]')).toHaveAttribute('href', 'https://algo.aephonics.com');
        await expect(page.locator('a[aria-label="Visit Dev"]')).toHaveAttribute('href', 'https://dev.aephonics.com');
        await expect(page.locator('a[aria-label="Visit Music"]')).toHaveAttribute('href', 'https://music.aephonics.com');
        await expect(page.locator('a[aria-label="Visit Travel"]')).toHaveAttribute('href', 'https://travel.aephonics.com');
    });

    test('footer displays current year', async ({ page }) => {
        const year = new Date().getFullYear().toString();
        const footer = page.locator('footer');
        await expect(footer).toContainText(year);
        await expect(footer).toContainText('Aephonics');
    });
});
