import './style.css';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

class Portfolio {
  constructor() {
    this.mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    this.cursorPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    this.isMobile = window.matchMedia('(max-width: 768px)').matches;
    this.init();
  }

  init() {
    this.playLoader();
  }

  start() {
    this.setupLenis();
    this.setupCursor();
    this.setupScrollProgress();
    this.setupNavScroll();
    this.animateHero();
    this.animateAbout();
    this.animateProjects();
    this.animateContact();
    this.setupHeroParallax();
    this.setupHeroGlow();
    this.setupMagnetic();
    this.setupSectionParallax();
    this.animateDetailPage();
  }

  playLoader() {
    const loader = document.querySelector('.loader');
    if (!loader) { this.start(); return; }

    const tl = gsap.timeline({
      onComplete: () => {
        this.start();
        loader.remove();
      }
    });

    tl.to('.loader-logo', {
      opacity: 1,
      duration: 0.6,
      ease: 'power2.out'
    })
    .to('.loader-bar', {
      scaleX: 1,
      duration: 0.8,
      ease: 'power2.inOut'
    }, '-=0.2')
    .to('.loader-logo', {
      y: -20,
      opacity: 0,
      duration: 0.4,
      ease: 'power3.in'
    }, '+=0.3')
    .to('.loader-bar', {
      opacity: 0,
      duration: 0.3,
    }, '-=0.3')
    .to(loader, {
      yPercent: -100,
      duration: 0.8,
      ease: 'power4.inOut'
    }, '-=0.1');
  }

  setupLenis() {
    this.lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
    });

    this.lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      this.lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);
  }

  setupCursor() {
    if (this.isMobile) return;

    const dot = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');
    if (!dot || !ring) return;

    document.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      gsap.to(dot, { x: e.clientX, y: e.clientY, duration: 0.1, ease: 'power2.out', overwrite: true });
    });

    const hoverTargets = document.querySelectorAll('a, button, .stack-pill, .project-card');
    hoverTargets.forEach((el) => {
      el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });

    gsap.ticker.add(() => {
      this.cursorPos.x += (this.mouse.x - this.cursorPos.x) * 0.09;
      this.cursorPos.y += (this.mouse.y - this.cursorPos.y) * 0.09;
      gsap.set(ring, { x: this.cursorPos.x, y: this.cursorPos.y });
    });
  }

  setupScrollProgress() {
    const bar = document.getElementById('scroll-progress');
    if (!bar) return;

    gsap.to(bar, {
      width: '100%',
      ease: 'none',
      scrollTrigger: {
        trigger: document.body,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.3,
      }
    });
  }

  setupNavScroll() {
    const nav = document.getElementById('nav');
    if (!nav) return;

    ScrollTrigger.create({
      start: 60,
      onUpdate: (self) => {
        nav.classList.toggle('scrolled', self.scroll() > 60);
      }
    });

    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        if (target) this.lenis.scrollTo(target, { offset: 0, duration: 1.5 });
      });
    });
  }

  animateHero() {
    const tl = gsap.timeline({ delay: 1.8 });

    const chars = document.querySelectorAll('.hero-name .char');
    if (chars.length) {
      tl.to(chars, {
        y: 0,
        stagger: 0.06,
        duration: 1,
        ease: 'power4.out',
      });
    }

    tl.to('.hero-greeting', {
      clipPath: 'inset(0 0 0% 0)',
      duration: 0.8,
      ease: 'power3.out',
    }, '-=0.6')
    .to('.hero-motto', {
      clipPath: 'inset(0 0 0% 0)',
      duration: 0.8,
      ease: 'power3.out',
    }, '-=0.4')
    .to('.hero-sub', {
      clipPath: 'inset(0 0 0% 0)',
      duration: 0.8,
      ease: 'power3.out',
    }, '-=0.4')
    .to('.hero-scroll-hint', {
      opacity: 1,
      duration: 1,
      ease: 'power2.out',
    }, '-=0.2');
  }

  animateAbout() {
    const label = document.querySelector('.about .section-label');
    if (label) {
      gsap.fromTo(label, { opacity: 0, x: -30 }, {
        opacity: 1, x: 0, duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: label, start: 'top 85%' }
      });
    }

    document.querySelectorAll('.about-line-inner').forEach((line, i) => {
      gsap.to(line, {
        y: 0,
        duration: 0.9,
        ease: 'power3.out',
        delay: i * 0.1,
        scrollTrigger: {
          trigger: line.parentElement,
          start: 'top 85%',
        }
      });
    });

    const stackLabel = document.querySelector('.stack-label');
    if (stackLabel) {
      gsap.fromTo(stackLabel, { opacity: 0, y: 20 }, {
        opacity: 1, y: 0, duration: 0.7, ease: 'power3.out',
        scrollTrigger: { trigger: stackLabel, start: 'top 85%' }
      });
    }

    document.querySelectorAll('.stack-pill').forEach((pill, i) => {
      gsap.to(pill, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: 'power3.out',
        delay: i * 0.04,
        scrollTrigger: {
          trigger: pill.parentElement,
          start: 'top 85%',
        }
      });
    });
  }

  animateProjects() {
    const label = document.querySelector('.work .section-label');
    if (label) {
      gsap.fromTo(label, { opacity: 0, x: -30 }, {
        opacity: 1, x: 0, duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: label, start: 'top 85%' }
      });
    }

    document.querySelectorAll('.project-card').forEach((card, i) => {
      gsap.to(card, {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out',
        delay: i * 0.15,
        scrollTrigger: {
          trigger: card,
          start: 'top 88%',
        }
      });
    });
  }

  animateContact() {
    const section = document.querySelector('.contact');
    if (!section) return;

    const tl = gsap.timeline({
      scrollTrigger: { trigger: section, start: 'top 70%' }
    });

    const contactLabel = section.querySelector('.section-label');
    if (contactLabel) {
      tl.fromTo(contactLabel, { opacity: 0, x: -30 }, {
        opacity: 1, x: 0, duration: 0.8, ease: 'power3.out'
      });
    }

    tl.to('.contact-heading', {
      opacity: 1,
      duration: 0.8,
      ease: 'power3.out',
    }, '-=0.3')
    .to('.contact-sub', {
      opacity: 1,
      duration: 0.6,
      ease: 'power3.out',
    }, '-=0.4')
    .to('.contact-email', {
      opacity: 1,
      duration: 0.6,
      ease: 'power3.out',
    }, '-=0.3');
  }

  setupHeroParallax() {
    const hero = document.querySelector('.hero-content');
    const grid = document.querySelector('.hero-bg-grid');
    if (!hero) return;

    gsap.to(hero, {
      y: 200,
      opacity: 0,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 0.5,
      }
    });

    if (grid) {
      gsap.to(grid, {
        y: 100,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: 'bottom top',
          scrub: 0.5,
        }
      });
    }
  }

  setupHeroGlow() {
    if (this.isMobile) return;

    const glow = document.querySelector('.hero-glow');
    if (!glow) return;

    document.addEventListener('mousemove', (e) => {
      gsap.to(glow, {
        x: e.clientX,
        y: e.clientY,
        duration: 1.5,
        ease: 'power2.out',
        overwrite: true,
      });
    });
  }

  setupMagnetic() {
    if (this.isMobile) return;

    document.querySelectorAll('.magnetic').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        gsap.to(el, { x: x * 0.35, y: y * 0.35, duration: 0.4, ease: 'power2.out' });
      });

      el.addEventListener('mouseleave', () => {
        gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.3)' });
      });
    });
  }

  setupSectionParallax() {
    document.querySelectorAll('.section-bg').forEach((bg) => {
      const section = bg.parentElement;
      gsap.to(bg, {
        y: 80,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.6,
        }
      });
    });
  }

  animateDetailPage() {
    const projectHero = document.querySelector('.project-hero');
    if (!projectHero) return;

    const heroTl = gsap.timeline({ delay: 1.8 });
    heroTl.to('.project-hero .section-label', { opacity: 1, x: 0, duration: 0.6, ease: 'power3.out' })
      .to('.project-hero-title', { opacity: 1, y: 0, duration: 0.8, ease: 'power4.out' }, '-=0.3')
      .to('.project-hero-tagline', { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.4')
      .to('.project-hero-desc', { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.3');

    gsap.set('.project-hero .section-label', { x: -30 });
    gsap.set(['.project-hero-title', '.project-hero-tagline', '.project-hero-desc'], { y: 30 });

    document.querySelectorAll('.detail-block').forEach((block, i) => {
      gsap.to(block, {
        opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: i * 0.1,
        scrollTrigger: { trigger: block, start: 'top 85%' }
      });
    });

    const ecoLabel = document.querySelector('.ecosystem-section .section-label');
    if (ecoLabel) {
      gsap.fromTo(ecoLabel, { opacity: 0, x: -30 }, {
        opacity: 1, x: 0, duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: ecoLabel, start: 'top 85%' }
      });
    }

    document.querySelectorAll('.eco-card').forEach((card, i) => {
      gsap.to(card, {
        opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', delay: i * 0.12,
        scrollTrigger: { trigger: card.parentElement, start: 'top 80%' }
      });
    });

    document.querySelectorAll('.highlight-item').forEach((item, i) => {
      const numberEl = item.querySelector('.highlight-number');
      const targetCount = parseInt(numberEl.dataset.count) || 0;
      const prefix = numberEl.dataset.prefix || '';
      const suffix = numberEl.dataset.suffix || '';

      gsap.to(item, {
        opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', delay: i * 0.1,
        scrollTrigger: {
          trigger: item.parentElement,
          start: 'top 80%',
          onEnter: () => {
            if (targetCount === 0) {
              numberEl.textContent = prefix + '0' + suffix;
              return;
            }
            gsap.fromTo({ val: 0 }, { val: targetCount }, {
              val: targetCount,
              duration: 2,
              ease: 'power2.out',
              onUpdate: function () {
                numberEl.textContent = prefix + Math.round(this.targets()[0].val) + suffix;
              }
            });
          }
        }
      });
    });

    const ctaSection = document.querySelector('.cta-section');
    if (ctaSection) {
      const ctaTl = gsap.timeline({
        scrollTrigger: { trigger: ctaSection, start: 'top 70%' }
      });
      ctaTl.to('.cta-heading', { opacity: 1, duration: 0.8, ease: 'power3.out' })
        .to('.cta-sub', { opacity: 1, duration: 0.6, ease: 'power3.out' }, '-=0.4')
        .to('.cta-buttons', { opacity: 1, duration: 0.6, ease: 'power3.out' }, '-=0.3');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new Portfolio();
});
