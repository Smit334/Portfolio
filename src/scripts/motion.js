// Motion layer — Lenis smooth scroll + GSAP ScrollTrigger reveals,
// card tilt, magnetic pill, nav state. Skipped entirely under reduced motion
// (CSS shows the composed static state).

import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function startMotion({ reducedMotion, fine }) {
  const nav = document.querySelector('.nav');
  const onScrollNav = () => {
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();

  if (reducedMotion) {
    // reveals: show everything (CSS also forces this; belt and suspenders)
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'));
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // Lenis drives native scroll with lerp; keep ScrollTrigger in sync
  const lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 1 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // anchor links scroll smoothly through Lenis
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id && id.length > 1) {
        const target = document.querySelector(id);
        if (target) {
          e.preventDefault();
          lenis.scrollTo(target, { offset: -20 });
        }
      }
    });
  });

  // scroll reveals — batched, gentle rise + settle
  document.querySelectorAll('.reveal').forEach((el) => {
    gsap.fromTo(el,
      { opacity: 0, y: 34 },
      {
        opacity: 1, y: 0,
        duration: 1.15, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 86%', once: true },
        onStart: () => el.classList.add('in'),
      }
    );
    el.style.transition = 'none'; // GSAP owns it; avoid double-easing
  });

  // section hairlines draw in
  document.querySelectorAll('.sec-h .ln').forEach((ln) => {
    gsap.fromTo(ln,
      { scaleX: 0, transformOrigin: '0 50%' },
      {
        scaleX: 1, duration: 1.4, ease: 'power3.out',
        scrollTrigger: { trigger: ln, start: 'top 88%', once: true },
      }
    );
  });

  // experience rows stagger
  const xpRows = gsap.utils.toArray('.xp-row');
  if (xpRows.length) {
    gsap.fromTo(xpRows,
      { opacity: 0, y: 26 },
      {
        opacity: 1, y: 0,
        duration: 1, ease: 'power3.out', stagger: 0.09,
        scrollTrigger: { trigger: '.xp', start: 'top 82%', once: true },
      }
    );
  }

  if (fine) {
    // card tilt + cursor sheen
    document.querySelectorAll('.card').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - .5;
        const py = (e.clientY - r.top) / r.height - .5;
        card.classList.add('live');
        card.style.setProperty('--ry', (px * 2.4).toFixed(2) + 'deg');
        card.style.setProperty('--rx', (-py * 1.8).toFixed(2) + 'deg');
        card.style.setProperty('--mx', ((px + .5) * 100).toFixed(1) + '%');
        card.style.setProperty('--my', ((py + .5) * 100).toFixed(1) + '%');
      });
      card.addEventListener('pointerleave', () => {
        card.classList.remove('live');
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });

    // magnetic pills
    document.querySelectorAll('.pill').forEach((pill) => {
      pill.addEventListener('pointermove', (e) => {
        const r = pill.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        pill.classList.add('live');
        pill.style.transform = `translate(${(dx * .22).toFixed(1)}px,${(dy * .3).toFixed(1)}px)`;
      });
      pill.addEventListener('pointerleave', () => {
        pill.classList.remove('live');
        pill.style.transform = '';
      });
    });
  }

  return lenis;
}
