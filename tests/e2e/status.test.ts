import { expect, test } from '@playwright/test';

import type { APIResponse } from '@playwright/test';

const API_PATHS = ['/api', '/api/anything', '/api/deep/nested/path'] as const;

const SECURITY_HEADERS = {
    'content-security-policy': 'base-uri \'none\'; connect-src \'self\' https://*.supabase.co; default-src \'self\'; font-src \'self\' data:; form-action \'none\'; frame-ancestors \'self\'; script-src \'self\' \'unsafe-inline\'; style-src \'self\' \'unsafe-inline\'',
    'permissions-policy': 'camera=(), microphone=(), geolocation=()',
    'referrer-policy': 'strict-origin-when-cross-origin',
    'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'sameorigin',
} as const;

const STATIC_ASSETS = [
    { contentType: 'image/png', path: '/apple-touch-icon.png' },
    { contentType: 'image/svg+xml', path: '/favicon.svg' },
    { contentType: 'image/png', path: '/og.png' },
] as const;

async function expectJsonNotFound(response: APIResponse, label: string) {
    expect(response.status(), `status for ${label}`).toBe(404);
    expect(response.headers()['content-type'], `content type for ${label}`).toContain('application/json');
    expect(await response.json(), `body for ${label}`).toEqual({ error: 'Not found' });
}

function expectSecurityHeaders(response: APIResponse, label: string) {
    const headers = response.headers();

    for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
        expect(headers[name], `${name} header for ${label}`).toBe(value);
    }
}

test.describe('pages', () => {
    test('serves the home page as html', async ({ request }) => {
        const response = await request.get('/');

        expect(response.status()).toBe(200);
        expect(response.headers()['content-type']).toContain('text/html');
    });

    test('returns 404 for unknown pages', async ({ request }) => {
        const response = await request.get('/this-page-does-not-exist');

        expect(response.status()).toBe(404);
        expect(response.headers()['content-type']).toContain('text/html');
    });

    test('serves the hardened security headers', async ({ request }) => {
        const response = await request.get('/');

        expectSecurityHeaders(response, '/');
    });
});

test.describe('static assets', () => {
    test('serves every asset referenced by the layout head', async ({ request }) => {
        for (const { contentType, path } of STATIC_ASSETS) {
            const response = await request.get(path);

            expect(response.status(), `status for ${path}`).toBe(200);
            expect(response.headers()['content-type'], `content type for ${path}`).toContain(contentType);
        }
    });

    test('serves the hardened security headers on every asset', async ({ request }) => {
        for (const { path } of STATIC_ASSETS) {
            const response = await request.get(path);

            expectSecurityHeaders(response, path);
        }
    });
});

test.describe('api', () => {
    test('returns a json 404 for every unknown api path on get', async ({ request }) => {
        for (const path of API_PATHS) {
            const response = await request.get(path);

            await expectJsonNotFound(response, `get ${path}`);
        }
    });

    test('returns a json 404 for every unknown api path on post', async ({ request }) => {
        for (const path of API_PATHS) {
            const response = await request.post(path, { data: {} });

            await expectJsonNotFound(response, `post ${path}`);
        }
    });
});
