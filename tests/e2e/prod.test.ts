import { expect, test } from '@playwright/test';

const BASE_URL = 'https://aephonics.com';
const PROD_TIMEOUT = 60_000;

const SECURITY_HEADERS = {
    'content-security-policy': 'base-uri \'none\'; connect-src \'self\' https://*.supabase.co; default-src \'self\'; font-src \'self\' data:; form-action \'none\'; frame-ancestors \'self\'; script-src \'self\' \'unsafe-inline\'; style-src \'self\' \'unsafe-inline\'',
    'permissions-policy': 'camera=(), microphone=(), geolocation=()',
    'referrer-policy': 'strict-origin-when-cross-origin',
    'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'sameorigin',
} as const;

test.describe.configure({ timeout: PROD_TIMEOUT });

test.describe('production pages', () => {
    test('serves the home page with the bare site title and section hooks', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/`);

        expect(response.status()).toBe(200);
        expect(response.headers()['content-type']).toContain('text/html');

        const html = await response.text();

        expect(html).toContain('<title>Aephonics</title>');
        expect(html).toContain('hero__title');
        expect(html).toContain('sites__card');
    });

    test('returns the 404 html page for an unknown path', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/this-page-does-not-exist`);

        expect(response.status()).toBe(404);
        expect(response.headers()['content-type']).toContain('text/html');
        expect(await response.text()).toContain('<title>Page Not Found \u2014 Aephonics</title>');
    });

    test('serves the configured security headers on the home page', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/`);

        const headers = response.headers();

        for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
            expect(headers[name], `${name} header`).toBe(value);
        }
    });

    test('renders the home page hero in a real browser', async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' });

        const response = await page.goto(`${BASE_URL}/`);

        expect(response?.status()).toBe(200);

        await expect(page).toHaveTitle('Aephonics');
        await expect(page.locator('#hero-title')).toBeVisible();
    });
});

test.describe('production api', () => {
    test('returns a json not found error for an unknown api path', async ({ request }) => {
        const response = await request.get(`${BASE_URL}/api/anything`);

        expect(response.status()).toBe(404);
        expect(response.headers()['content-type']).toContain('application/json');
        expect(await response.json()).toEqual({ error: 'Not found' });
    });
});
