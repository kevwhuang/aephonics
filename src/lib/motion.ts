import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { REDUCED_MOTION_QUERY } from '@lib/constants';

const SCROLL_DURATION = 0.8;
const SCROLL_EASE = 'power3.out';
const SCROLL_OFFSET = 60;
const SCROLL_START = 'top 85%';

export function initMotion(): void {
    const elements = document.querySelectorAll<HTMLElement>('[data-scroll]');

    for (const trigger of ScrollTrigger.getAll()) {
        trigger.kill();
    }

    if (window.matchMedia(REDUCED_MOTION_QUERY).matches) {
        for (const element of elements) {
            gsap.set([element, ...element.children], { clearProps: 'transform', opacity: 1 });
        }

        return;
    }

    for (const element of elements) {
        const from: gsap.TweenVars = { opacity: 0, y: SCROLL_OFFSET };
        const stagger = Number.parseFloat(element.dataset.scrollStagger || '0');

        const to: gsap.TweenVars = {
            duration: SCROLL_DURATION,
            ease: SCROLL_EASE,
            opacity: 1,
            scrollTrigger: {
                once: true,
                start: SCROLL_START,
                trigger: element,
            },
            y: 0,
        };

        if (stagger > 0) {
            const children = element.children;

            gsap.set(children, from);
            gsap.set(element, { opacity: 1 });
            to.stagger = stagger;
            gsap.to(children, to);
        } else {
            gsap.fromTo(element, from, to);
        }
    }
}

gsap.registerPlugin(ScrollTrigger);
