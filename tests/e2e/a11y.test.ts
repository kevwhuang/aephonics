import { expect, test } from '@playwright/test';

import type { Page } from '@playwright/test';

const ERROR_PATHS = ['/500', '/nonexistent-404'] as const;
const FOCUS_OUTLINE = 'solid 2px rgba(6, 182, 212, 0.8)';

const FOCUS_TARGETS = [
    { name: 'algo card link', selector: '.sites__card[href="https://algo.aephonics.com"]' },
    { name: 'dev card link', selector: '.sites__card[href="https://dev.aephonics.com"]' },
    { name: 'music card link', selector: '.sites__card[href="https://music.aephonics.com"]' },
    { name: 'travel card link', selector: '.sites__card[href="https://travel.aephonics.com"]' },
] as const;

const HOME_TITLE = 'Aephonics';
const MAX_TAB_PRESSES = 12;
const RETURN_LINK = 'a[href="/"]';
const TITLE_PATTERN = /^.+ \u2014 Aephonics$/;

const PUBLIC_PATHS = ['/', ...ERROR_PATHS] as const;

function getOutline(page: Page, selector: string) {
    return page.locator(selector).evaluate((element) => {
        const style = getComputedStyle(element);

        return `${style.outlineStyle} ${style.outlineWidth} ${style.outlineColor}`;
    });
}

test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
});

test.describe('document structure', () => {
    for (const path of PUBLIC_PATHS) {
        test(`${path} has valid landmarks, headings, alt text, and label ids`, async ({ page }) => {
            await page.goto(path);

            const structure = await page.evaluate(() => ({
                footerParent: document.querySelector('footer')?.parentElement?.tagName,
                h1Count: document.querySelectorAll('h1').length,
                headingLevels: [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')]
                    .map(heading => Number(heading.tagName.slice(1))),
                mainCount: document.querySelectorAll('main, [role="main"]').length,
                missingAltCount: [...document.querySelectorAll('img')]
                    .filter(image => !image.hasAttribute('alt')).length,
                nestedLandmarkCount: [...document.querySelectorAll('main footer, main header')]
                    .filter(element => !element.closest('article, aside, nav, section')).length,
                unresolvedLabelIds: [...document.querySelectorAll('[aria-labelledby]')]
                    .flatMap(element => (element.getAttribute('aria-labelledby') || '').split(/\s+/))
                    .filter(id => id && !document.getElementById(id)),
            }));

            const skippedLevels = structure.headingLevels.filter(
                (level, index) => level > (structure.headingLevels[index - 1] ?? 0) + 1,
            );

            expect(skippedLevels, `skipped heading levels on ${path}`).toEqual([]);
            expect(structure.footerParent, `footer parent on ${path}`).toBe('BODY');
            expect(structure.h1Count, `h1 count on ${path}`).toBe(1);
            expect(structure.headingLevels[0], `first heading level on ${path}`).toBe(1);
            expect(structure.mainCount, `main landmark count on ${path}`).toBe(1);
            expect(structure.missingAltCount, `images without alt text on ${path}`).toBe(0);
            expect(structure.nestedLandmarkCount, `nested landmarks on ${path}`).toBe(0);
            expect(structure.unresolvedLabelIds, `unresolved label ids on ${path}`).toEqual([]);
        });
    }
});

test.describe('keyboard navigation', () => {
    test('tab reaches every site card link with a solid cyan outline absent when unfocused', async ({ page }) => {
        await page.goto('/');

        const remaining = new Map(FOCUS_TARGETS.map(target => [target.selector, target.name]));
        const restingOutlines: Record<string, string> = {};

        for (const target of FOCUS_TARGETS) {
            restingOutlines[target.selector] = await getOutline(page, target.selector);

            expect(restingOutlines[target.selector], `resting outline on ${target.name}`).toMatch(/^none /);
        }

        for (let press = 0; press < MAX_TAB_PRESSES && remaining.size > 0; press += 1) {
            await page.keyboard.press('Tab');

            for (const selector of [...remaining.keys()]) {
                const isFocused = await page.locator(selector).evaluate(element => element === document.activeElement);

                if (!isFocused) continue;

                const focusedOutline = await getOutline(page, selector);

                expect(focusedOutline, `focus indicator on ${remaining.get(selector)}`).toBe(FOCUS_OUTLINE);
                expect(focusedOutline, `focus indicator on ${remaining.get(selector)}`)
                    .not.toBe(restingOutlines[selector]);
                remaining.delete(selector);
            }
        }

        expect([...remaining.values()], 'site card links never reached by tab').toEqual([]);
    });

    test('tab on each error page lands on the return link with the same solid cyan outline', async ({ page }) => {
        for (const path of ERROR_PATHS) {
            await page.goto(path);

            const resting = await getOutline(page, RETURN_LINK);

            expect(resting, `resting outline on the ${path} return link`).toMatch(/^none /);

            await page.keyboard.press('Tab');

            const focused = await getOutline(page, RETURN_LINK);
            const isFocused = await page.locator(RETURN_LINK).evaluate(element => element === document.activeElement);

            expect(focused, `focus indicator on the ${path} return link`).toBe(FOCUS_OUTLINE);
            expect(isFocused, `focus lands on the ${path} return link`).toBe(true);
        }
    });
});

test.describe('page titles', () => {
    test('titles are unique, bare on home, and suffixed with an em dash elsewhere', async ({ page }) => {
        const titles: string[] = [];

        for (const path of PUBLIC_PATHS) {
            await page.goto(path);
            titles.push(await page.title());
        }

        expect(new Set(titles).size).toBe(titles.length);
        expect(titles[0]).toBe(HOME_TITLE);

        for (let index = 1; index < titles.length; index += 1) {
            expect(titles[index], `title suffix on ${PUBLIC_PATHS[index]}`).toMatch(TITLE_PATTERN);
        }
    });
});
