import { describe, expect, test } from 'vitest';

import { ALL, prerender } from '../../src/pages/api/[...path]';

type RouteContext = Parameters<typeof ALL>[0];

const METHODS = ['DELETE', 'GET', 'PATCH', 'POST', 'PUT'] as const;

function createContext(method: string, path: string) {
    return { request: new Request(`http://localhost/api/${path}`, { method }) } as RouteContext;
}

describe('api path', () => {
    test('responds 404 to the delete, get, patch, post, and put methods', async () => {
        for (const method of METHODS) {
            const response = await ALL(createContext(method, 'unknown'));

            expect(response.status, method).toBe(404);
        }
    });

    test('responds 404 to a deeply nested path', async () => {
        const response = await ALL(createContext('GET', 'deeply/nested/unknown/path'));

        expect(response.status).toBe(404);
    });

    test('returns the json error body', async () => {
        const response = await ALL(createContext('POST', 'anything/nested'));

        const result: { error: string } = await response.json();

        expect(result).toEqual({ error: 'Not found' });
    });

    test('sets a json content type header', async () => {
        const response = await ALL(createContext('DELETE', 'x'));

        expect(response.headers.get('content-type')).toBe('application/json');
    });

    test('opts the route out of prerendering', () => {
        expect(prerender).toBe(false);
    });
});
