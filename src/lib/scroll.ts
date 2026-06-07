import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const SCROLL_OFFSET = 60;

gsap.registerPlugin(ScrollTrigger);

export function initScrollAnimations(): void {
    const elements = document.querySelectorAll<HTMLElement>('[data-scroll]');

    elements.forEach((element) => {
        const delay = parseFloat(element.dataset.scrollDelay || '0');
        const direction = (element.dataset.scroll || 'up') as Direction;
        const duration = parseFloat(element.dataset.scrollDuration || '0.8');
        const from: gsap.TweenVars = { opacity: 0 };
        const stagger = parseFloat(element.dataset.scrollStagger || '0');

        const to: gsap.TweenVars = {
            delay,
            duration,
            ease: 'power3.out',
            opacity: 1,
            scrollTrigger: {
                start: 'bottom bottom',
                trigger: element,
            },
        };

        switch (direction) {
            case 'down':
                from.y = -SCROLL_OFFSET;
                to.y = 0;
                break;
            case 'left':
                from.x = SCROLL_OFFSET;
                to.x = 0;
                break;
            case 'right':
                from.x = -SCROLL_OFFSET;
                to.x = 0;
                break;
            case 'up':
                from.y = SCROLL_OFFSET;
                to.y = 0;
        }

        if (stagger > 0) {
            const children = element.children;

            gsap.set(element, { opacity: 1 });
            gsap.set(children, from);
            to.stagger = stagger;
            gsap.to(children, to);
        } else {
            gsap.fromTo(element, from, to);
        }
    });
}
