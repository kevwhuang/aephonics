import { afterEach, describe, expect, test, vi } from 'vitest';

import { REDUCED_MOTION_QUERY } from '../../src/lib/constants';

import type { Mock } from 'vitest';

interface Killable {
    kill: Mock;
}

interface MotionOptions {
    elements?: ElementStub[];
    prefersReducedMotion?: boolean;
}

const SCROLL_DURATION = 0.8;
const SCROLL_EASE = 'power3.out';
const SCROLL_OFFSET = 60;
const SCROLL_SELECTOR = '[data-scroll]';
const SCROLL_START = 'top 85%';
const STAGGER_VALUE = 0.15;

const STAGGER_ATTRIBUTE_VALUE = String(STAGGER_VALUE);

const { gsapStub, scrollTriggerStub, state } = vi.hoisted(() => {
    const gsapStub = {
        fromTo: vi.fn(),
        registerPlugin: vi.fn(),
        set: vi.fn(),
        to: vi.fn(),
    };

    const state = {
        scrollTriggers: [] as Killable[],
    };

    const scrollTriggerStub = {
        getAll: vi.fn(() => state.scrollTriggers),
    };

    return { gsapStub, scrollTriggerStub, state };
});

class ElementStub {
    children: ElementStub[];
    dataset: { scrollStagger?: string };

    constructor(children: ElementStub[] = [], scrollStagger?: string) {
        this.children = children;
        this.dataset = { scrollStagger };
    }
}

function buildKillable() {
    return { kill: vi.fn() };
}

async function loadMotion({ elements = [], prefersReducedMotion = false }: MotionOptions = {}) {
    state.scrollTriggers = [];
    vi.clearAllMocks();
    vi.resetModules();

    const documentStub = {
        querySelectorAll: vi.fn(() => elements),
    };

    const windowStub = {
        matchMedia: vi.fn(() => ({ matches: prefersReducedMotion })),
    };

    vi.stubGlobal('document', documentStub);
    vi.stubGlobal('window', windowStub);

    const { initMotion } = await import('../../src/lib/motion');

    return { documentStub, initMotion, windowStub };
}

vi.mock('gsap', () => ({ default: gsapStub }));
vi.mock('gsap/ScrollTrigger', () => ({ ScrollTrigger: scrollTriggerStub }));

afterEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
});

describe('module scope', () => {
    test('registers the scroll trigger plugin with gsap', async () => {
        await loadMotion();

        expect(gsapStub.registerPlugin).toHaveBeenCalledExactlyOnceWith(scrollTriggerStub);
    });

    test('reads neither the document nor the reduced-motion query until initMotion runs', async () => {
        const { documentStub, windowStub } = await loadMotion({ elements: [new ElementStub()] });

        expect(documentStub.querySelectorAll).not.toHaveBeenCalled();
        expect(scrollTriggerStub.getAll).not.toHaveBeenCalled();
        expect(windowStub.matchMedia).not.toHaveBeenCalled();
    });
});

describe('initMotion', () => {
    test('collects the data-scroll elements', async () => {
        const { documentStub, initMotion } = await loadMotion({ elements: [new ElementStub()] });

        initMotion();

        expect(documentStub.querySelectorAll).toHaveBeenCalledExactlyOnceWith(SCROLL_SELECTOR);
    });

    test('matches the reduced-motion media query', async () => {
        const { initMotion, windowStub } = await loadMotion();

        initMotion();

        expect(windowStub.matchMedia).toHaveBeenCalledExactlyOnceWith(REDUCED_MOTION_QUERY);
    });

    test('kills every scroll trigger returned by getAll', async () => {
        const { initMotion } = await loadMotion();
        const triggers = [buildKillable(), buildKillable()];

        state.scrollTriggers = triggers;
        initMotion();

        for (const trigger of triggers) {
            expect(trigger.kill).toHaveBeenCalledTimes(1);
        }
    });

    test('kills the live scroll triggers again on a second run', async () => {
        const { initMotion } = await loadMotion({ elements: [new ElementStub()] });
        const trigger = buildKillable();

        state.scrollTriggers = [trigger];
        initMotion();
        initMotion();

        expect(scrollTriggerStub.getAll).toHaveBeenCalledTimes(2);
        expect(trigger.kill).toHaveBeenCalledTimes(2);
    });
});

describe('initMotion with reduced motion', () => {
    test('reveals every data-scroll element and its children instantly at full opacity', async () => {
        const child = new ElementStub();

        const element = new ElementStub([child]);

        const { initMotion } = await loadMotion({ elements: [element], prefersReducedMotion: true });

        initMotion();

        expect(gsapStub.set).toHaveBeenCalledExactlyOnceWith([element, child], { clearProps: 'transform', opacity: 1 });
    });

    test('reveals a staggered container and its children in the same single call', async () => {
        const children = [new ElementStub(), new ElementStub()];

        const element = new ElementStub(children, STAGGER_ATTRIBUTE_VALUE);

        const { initMotion } = await loadMotion({ elements: [element], prefersReducedMotion: true });

        initMotion();

        expect(gsapStub.set).toHaveBeenCalledExactlyOnceWith(
            [element, ...children],
            { clearProps: 'transform', opacity: 1 },
        );
    });

    test('reveals every element with a single set call and registers no tweens', async () => {
        const elements = [new ElementStub([new ElementStub()], STAGGER_ATTRIBUTE_VALUE), new ElementStub()];

        const { initMotion } = await loadMotion({ elements, prefersReducedMotion: true });

        initMotion();

        expect(gsapStub.fromTo).not.toHaveBeenCalled();
        expect(gsapStub.set).toHaveBeenCalledTimes(2);
        expect(gsapStub.to).not.toHaveBeenCalled();
    });

    test('kills the live scroll triggers before revealing', async () => {
        const { initMotion } = await loadMotion({ elements: [new ElementStub()], prefersReducedMotion: true });
        const trigger = buildKillable();

        state.scrollTriggers = [trigger];
        initMotion();

        expect(trigger.kill).toHaveBeenCalledTimes(1);
    });
});

describe('initMotion without reduced motion', () => {
    test('fades and lifts each unstaggered data-scroll element on a scroll trigger starting at top 85%', async () => {
        const element = new ElementStub();

        const { initMotion } = await loadMotion({ elements: [element] });

        initMotion();

        expect(gsapStub.fromTo).toHaveBeenCalledExactlyOnceWith(
            element,
            { opacity: 0, y: SCROLL_OFFSET },
            {
                duration: SCROLL_DURATION,
                ease: SCROLL_EASE,
                opacity: 1,
                scrollTrigger: { once: true, start: SCROLL_START, trigger: element },
                y: 0,
            },
        );
    });

    test('tweens every data-scroll element it collects', async () => {
        const { initMotion } = await loadMotion({ elements: [new ElementStub(), new ElementStub()] });

        initMotion();

        expect(gsapStub.fromTo).toHaveBeenCalledTimes(2);
    });

    test('treats an element without a data-scroll-stagger attribute as unstaggered', async () => {
        const element = new ElementStub([new ElementStub()]);

        const { initMotion } = await loadMotion({ elements: [element] });

        initMotion();

        expect(gsapStub.fromTo).toHaveBeenCalledTimes(1);
        expect(gsapStub.fromTo.mock.calls[0][0]).toBe(element);
        expect(gsapStub.set).not.toHaveBeenCalled();
        expect(gsapStub.to).not.toHaveBeenCalled();
    });

    test('treats a data-scroll-stagger of 0 as unstaggered', async () => {
        const element = new ElementStub([new ElementStub()], '0');

        const { initMotion } = await loadMotion({ elements: [element] });

        initMotion();

        expect(gsapStub.fromTo).toHaveBeenCalledTimes(1);
        expect(gsapStub.fromTo.mock.calls[0][0]).toBe(element);
        expect(gsapStub.set).not.toHaveBeenCalled();
        expect(gsapStub.to).not.toHaveBeenCalled();
    });

    test('treats a negative data-scroll-stagger as unstaggered', async () => {
        const element = new ElementStub([new ElementStub()], '-0.1');

        const { initMotion } = await loadMotion({ elements: [element] });

        initMotion();

        expect(gsapStub.fromTo).toHaveBeenCalledTimes(1);
        expect(gsapStub.fromTo.mock.calls[0][0]).toBe(element);
        expect(gsapStub.set).not.toHaveBeenCalled();
        expect(gsapStub.to).not.toHaveBeenCalled();
    });

    test('treats an unparseable data-scroll-stagger as unstaggered', async () => {
        const element = new ElementStub([new ElementStub()], 'fast');

        const { initMotion } = await loadMotion({ elements: [element] });

        initMotion();

        expect(gsapStub.fromTo).toHaveBeenCalledTimes(1);
        expect(gsapStub.fromTo.mock.calls[0][0]).toBe(element);
        expect(gsapStub.set).not.toHaveBeenCalled();
        expect(gsapStub.to).not.toHaveBeenCalled();
    });

    test('hides the children of a staggered container and shows the container itself', async () => {
        const children = [new ElementStub(), new ElementStub()];

        const element = new ElementStub(children, STAGGER_ATTRIBUTE_VALUE);

        const { initMotion } = await loadMotion({ elements: [element] });

        initMotion();

        expect(gsapStub.set).toHaveBeenCalledTimes(2);
        expect(gsapStub.set).toHaveBeenNthCalledWith(1, children, { opacity: 0, y: SCROLL_OFFSET });
        expect(gsapStub.set).toHaveBeenNthCalledWith(2, element, { opacity: 1 });
    });

    test('staggers the children of a staggered container with the data-scroll-stagger value', async () => {
        const children = [new ElementStub(), new ElementStub()];

        const element = new ElementStub(children, STAGGER_ATTRIBUTE_VALUE);

        const { initMotion } = await loadMotion({ elements: [element] });

        initMotion();

        expect(gsapStub.to).toHaveBeenCalledExactlyOnceWith(children, {
            duration: SCROLL_DURATION,
            ease: SCROLL_EASE,
            opacity: 1,
            scrollTrigger: { once: true, start: SCROLL_START, trigger: element },
            stagger: STAGGER_VALUE,
            y: 0,
        });
    });

    test('leaves a staggered container out of the fromTo path', async () => {
        const element = new ElementStub([new ElementStub()], STAGGER_ATTRIBUTE_VALUE);

        const { initMotion } = await loadMotion({ elements: [element] });

        initMotion();

        expect(gsapStub.fromTo).not.toHaveBeenCalled();
    });
});
