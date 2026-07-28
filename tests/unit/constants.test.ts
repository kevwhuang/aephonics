import { describe, expect, test } from 'vitest';

import { REDUCED_MOTION_QUERY } from '../../src/lib/constants';

describe('REDUCED_MOTION_QUERY', () => {
    test('is the prefers-reduced-motion reduce media query', () => {
        expect(REDUCED_MOTION_QUERY).toBe('(prefers-reduced-motion: reduce)');
    });
});
