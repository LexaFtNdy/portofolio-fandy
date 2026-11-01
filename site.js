import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText);

// Each plate is moved as one: a heading and its registration marks share an ink.
const INKS = ['c', 'm', 'y', 'k'];
// Offsets per proof, in px at a 1440px wide press, as [x, y, rotation]. The last proof is in register.
const PROOFS = [
  { c: [-22, 9, -1.4], m: [17, -12, 1], y: [-7, 19, .3], k: [9, -5, .5] },
  { c: [10, -7, .6], m: [-9, 8, -.5], y: [14, -4, 0], k: [-4, 6, 0] },
  { c: [-3, 2, 0], m: [3, -3, 0], y: [-2, 4, 0], k: [1, 0, 0] },
  { c: [0, 0, 0], m: [0, 0, 0], y: [0, 0, 0], k: [0, 0, 0] },
];
// How far each ink drifts with the pointer; black stays put so the name never goes illegible.
const DRIFT = { c: -1.1, m: .9, y: .5, k: 0 };
const EASE = 'expo.out';

const html = document.documentElement;
const motion = matchMedia('(prefers-reduced-motion: no-preference)').matches;
const layers = (root, ink) => root.querySelectorAll(`.${ink}`);
const pose = (p, s) => ({ x: p[0] * s, y: p[1] * s, rotation: p[2] });
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

let lenis = null;
let vel = 0; // smoothed scroll speed, -1..1: drives --mis and the ticker

// Fires once, the first time el is on screen.
const onView = (el, threshold, fn) => new IntersectionObserver(([e], io) => {
  if (e.isIntersecting) { io.disconnect(); fn(); }
}, { threshold }).observe(el);

// Home only: the name is pulled through four proofs, then drifts with the pointer. Clicking it pulls one more.
// delay null = already proofed this session, so the name starts in register.
function homePress(hero, press, delay) {
  const proofN = document.getElementById('proof-n');
  const proofS = document.getElementById('proof-s');
  const q = Object.fromEntries(INKS.map(ink => [ink, {
    x: gsap.quickTo(layers(press, ink), 'x', { duration: .55, ease: 'power3.out' }),
    y: gsap.quickTo(layers(press, ink), 'y', { duration: .55, ease: 'power3.out' }),
  }]));
  let pressing = false;
  let n = PROOFS.length; // proofs pulled so far; the static page already reads "Proof 4"

  const pull = (from, wait = 0) => {
    pressing = true;
    INKS.forEach(ink => { q[ink].x.tween.pause(); q[ink].y.tween.pause(); }); // the pointer lets go of the plates
    if (from === 0) n = 0;
    const s = press.offsetWidth / 1440;
    INKS.forEach(ink => gsap.set(layers(press, ink), pose(PROOFS[from][ink], s)));
    const tl = gsap.timeline({ delay: wait, onComplete: () => { pressing = false; } });
    PROOFS.slice(from).forEach((proof, i) => {
      tl.call(() => {
        proofN.textContent = `Proof ${++n}`;
        proofS.textContent = proof === PROOFS.at(-1) ? 'in register' : 'out of register';
      }, null, i === 0 ? 0 : '+=.42');
      // a press hit: fast in, no overshoot
      if (i) INKS.forEach(ink => tl.to(layers(press, ink), { ...pose(proof[ink], s), duration: .16, ease: 'expo.out' }, '<'));
    });
  };

  if (delay !== null) pull(0, delay);
  press.classList.add('pullable');
  press.addEventListener('click', () => pressing || pull(1));
  document.getElementById('proof-hint').hidden = false;

  const clamp = gsap.utils.clamp(-26, 26);
  let settle;
  hero.addEventListener('pointermove', e => {
    if (pressing || e.pointerType !== 'mouse') return;
    const vx = clamp(e.movementX), vy = clamp(e.movementY);
    INKS.forEach(ink => { q[ink].x(vx * DRIFT[ink]); q[ink].y(vy * DRIFT[ink]); });
    clearTimeout(settle);
    settle = setTimeout(() => INKS.forEach(ink => { q[ink].x(0); q[ink].y(0); }), 90);
  });

  // scrolling away pushes the sheet down and back
  gsap.to(press, { yPercent: 22, scale: .9, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
}

// Anything marked data-lock arrives out of register and lines up once it is on screen. Click it for one more.
function lockOnView(el) {
  const run = () => {
    const s = innerWidth / 1440 * 1.1;
    INKS.forEach((ink, i) => gsap.fromTo(layers(el, ink), pose(PROOFS[1][ink], s),
      { x: 0, y: 0, rotation: 0, duration: .9, delay: .1 + i * .08, ease: 'expo.out', overwrite: true }));
  };
  INKS.forEach(ink => gsap.set(layers(el, ink), pose(PROOFS[1][ink], innerWidth / 1440 * 1.1)));
  onView(el, .6, run);
  el.classList.add('pullable');
  el.addEventListener('click', run);
}

// Wheel scrolling glides; touch stays native. In-page nav links glide too.
function smooth() {
  lenis = new Lenis();
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  $$('.bar-nav a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    lenis.scrollTo(a.hash, { duration: 1.6 });
    history.pushState(null, '', a.hash);
  }));
}

// Scrolling runs the press: the faster the sheet moves, the further cyan and magenta drift (CSS reads --mis).
// The colour bar under the nav prints across as the page is read (--progress).
function pressRun() {
  const root = html.style;
  let last = -1;
  gsap.ticker.add(() => {
    const y = scrollY;
    if (y !== last) root.setProperty('--progress', (y / Math.max(1, html.scrollHeight - innerHeight)).toFixed(4));
    const target = last < 0 ? 0 : gsap.utils.clamp(-1, 1, (y - last) / 60);
    last = y;
    let next = vel + (target - vel) * .12;
    if (Math.abs(next) < .002) next = 0;
    if (next === vel) return;
    vel = next;
    root.setProperty('--mis', vel.toFixed(4));
  });
}

// Make-ready, first visit only: the counter runs while the fonts arrive, a big mark comes into register,
// then the sheet and the yellow, magenta and cyan passes lift off the page. Resolves as the lift starts.
function makeReady(el) {
  lenis.stop();
  const n = el.querySelector('.mr-n');
  const reg = el.querySelector('.reg');
  const cap = el.querySelector('.mr-cap');
  const count = { v: 0 };
  INKS.forEach(ink => gsap.set(layers(reg, ink), pose(PROOFS[0][ink], 3.5)));

  const run = gsap.timeline()
    .to(count, { v: 100, duration: 1.7, ease: 'power3.inOut', onUpdate: () => { n.textContent = String(Math.round(count.v)).padStart(3, '0'); } }, 0)
    .from(el.querySelectorAll('.mr-bars li'), { scaleX: 0, duration: .8, stagger: .22, ease: 'power3.inOut' }, 0)
    .to(INKS.map(ink => layers(reg, ink)[0]), { x: 0, y: 0, rotation: 0, duration: 1.5, stagger: .07, ease: 'expo.inOut' }, 0)
    .fromTo(reg, { rotation: -180, scale: .6 }, { rotation: 0, scale: 1, duration: 1.7, ease: 'expo.inOut' }, 0)
    .call(() => { cap.textContent = 'In register'; });

  const fonts = Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 2500))]);
  return Promise.all([fonts, run.then()]).then(() => {
    gsap.timeline({ onComplete: () => { html.classList.remove('loading'); el.remove(); lenis.start(); } })
      .to(el.querySelector('.mr-face'), { yPercent: -40, autoAlpha: 0, duration: .6, ease: 'power3.in' }, 0)
      .to(el.querySelectorAll('.mr-sheet, .mr-pass'), { yPercent: -100, duration: 1.1, stagger: .1, ease: 'expo.inOut' }, .15);
  });
}

// Lines split into masks. While split the block is a flex column, so the masks' padding (which keeps ink offsets and
// descenders uncut) is cancelled by margins that do not collapse. done() puts the text back as it was.
function splitLines(el) {
  const s = SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'ln' });
  el.classList.add('split'); // after measuring: as flex items, unsplit words would each take a row
  return { lines: s.lines, done: () => { s.revert(); el.classList.remove('split'); } };
}

// Hero and page heads: the lede comes up line by line, everything around it follows.
function headIn(root, delay) {
  const tl = gsap.timeline({ delay, defaults: { ease: EASE } });
  const lede = root.querySelector('.lede');
  if (lede) {
    const s = splitLines(lede);
    tl.from(s.lines, { yPercent: 105, duration: 1.3, stagger: .09, onComplete: s.done }, 0);
  }
  tl.from($$('.reg', root), { scale: 0, rotation: -120, duration: 1.2, stagger: .06 }, 0)
    .from($$('.proof, .motto, .intro .actions > *, .ticket > *', root), { y: 32, autoAlpha: 0, duration: 1.1, stagger: .05 }, .15)
    .from($$('.colorbar li', root), { scaleY: 0, transformOrigin: '50% 100%', duration: .6, stagger: .04 }, .3);
}

// Big headings rise line by line out of a mask as they reach the screen.
function linesOnView(h) {
  const s = splitLines(h);
  gsap.set(s.lines, { yPercent: 105 });
  onView(h, .3, () => gsap.to(s.lines, { yPercent: 0, duration: 1.3, stagger: .1, ease: EASE, onComplete: s.done }));
}

// Everything else rises in batches, staggered in reading order.
const RISE = '.work-head p, .job-meta, .job h3, .job-what, .turn, .job-tags, .job-link, .also, .kit-list > div, '
  + '.row h2, .row p, .close-sub, .close-mail, .close .actions > *, .next > *, .contact-note, .strip li, .counts > div';
function rise() {
  const els = $$(RISE);
  gsap.set(els, { y: 48, autoAlpha: 0 });
  ScrollTrigger.batch(els, {
    start: 'top 92%', once: true,
    onEnter: b => gsap.to(b, { y: 0, autoAlpha: 1, duration: 1.2, stagger: .07, ease: EASE, overwrite: true }),
  });
}

// Rules are drawn across the sheet, left to right (CSS animates --rule).
const RULED = '.job, .row, .pairs, .kit h2, .kit .kit-list > div, .also, .counts > div, .next';

// Screenshots are printed by a four-ink roller sweeping across the sheet, then float a little against the scroll.
function printOnView(sheet) {
  const img = sheet.querySelector('img');
  const roller = sheet.appendChild(document.createElement('i'));
  roller.className = 'roller';
  roller.setAttribute('aria-hidden', 'true');
  gsap.set(img, { clipPath: 'inset(0 100% 0 0)' });
  onView(sheet, .3, () => gsap.timeline({ defaults: { duration: 1.1, ease: 'power3.inOut' } })
    .to(img, { clipPath: 'inset(0 0% 0 0)', clearProps: 'clipPath' })
    .fromTo(roller, { left: '0%', xPercent: 0 }, { left: '100%', xPercent: -100 }, 0)
    .to(roller, { autoAlpha: 0, duration: .3 }, '-=.15'));
  if (innerWidth > 900 && sheet.matches('.job .sheet, .gallery .sheet:nth-child(even)')) {
    gsap.fromTo(sheet, { yPercent: 8 }, { yPercent: -8, ease: 'none', scrollTrigger: { trigger: sheet, start: 'top bottom', end: 'bottom top', scrub: true } });
  }
}

// Figures count up from zero; the unit after the number stays put.
function countUp(dd) {
  const [, num, unit] = dd.textContent.match(/^(\d+)(.*)$/s) || [];
  if (!num) return;
  const o = { v: 0 };
  dd.textContent = `0${unit}`;
  onView(dd, .6, () => gsap.to(o, { v: +num, duration: 1.8, ease: EASE, onUpdate: () => { dd.textContent = Math.round(o.v) + unit; } }));
}

// A ribbon of slug lines that runs with the press: faster when you scroll, backwards when you scroll up.
function ticker(el) {
  const track = el.firstElementChild;
  const items = [...track.children];
  track.append(...items.map(n => n.cloneNode(true)), ...items.map(n => n.cloneNode(true)));
  let w = track.scrollWidth / 3, x = 0, dir = 1;
  addEventListener('resize', () => { w = track.scrollWidth / 3; });
  document.fonts.ready.then(() => { w = track.scrollWidth / 3; });
  gsap.ticker.add((t, dt) => {
    if (vel) dir = vel > 0 ? 1 : -1;
    x = gsap.utils.wrap(-w, 0, x - dir * dt * (.06 + Math.abs(vel) * 1.4));
    track.style.transform = `translate3d(${x}px,0,0)`;
  });
}

// The pointer is a registration mark. Its inks trail at different speeds, so moving it knocks it out of register.
function cursor() {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const c = document.createElement('span');
  c.className = 'reg cursor';
  c.setAttribute('aria-hidden', 'true');
  c.innerHTML = INKS.map(ink => `<i class="${ink}"></i>`).join('');
  document.body.append(c);
  const LAG = { k: .08, c: .2, m: .28, y: .36 };
  const q = INKS.map(ink => {
    const i = c.querySelector(`.${ink}`);
    return [gsap.quickTo(i, 'x', { duration: LAG[ink], ease: 'power3' }), gsap.quickTo(i, 'y', { duration: LAG[ink], ease: 'power3' })];
  });
  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    html.classList.add('cursor-on');
    q.forEach(([x, y]) => { x(e.clientX); y(e.clientY); });
  }, { passive: true });
  document.addEventListener('pointerover', e => c.classList.toggle('hot', !!e.target.closest('a, button, .pullable')));
  document.addEventListener('pointerover', e => c.classList.toggle('neg', !!e.target.closest('.close, .foot')));
  document.addEventListener('pointerleave', () => html.classList.remove('cursor-on'));
}

// Buttons and nav links lean toward the pointer.
function magnets() {
  $$('.btn, .bar-nav a, .bar-name').forEach(el => {
    const x = gsap.quickTo(el, 'x', { duration: .6, ease: 'elastic.out(1, .45)' });
    const y = gsap.quickTo(el, 'y', { duration: .6, ease: 'elastic.out(1, .45)' });
    el.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      const r = el.getBoundingClientRect();
      x((e.clientX - r.left - r.width / 2) * .3);
      y((e.clientY - r.top - r.height / 2) * .4);
    });
    el.addEventListener('pointerleave', () => { x(0); y(0); });
  });
}

// Headings come off the press misregistered and lock as they reach the screen.
const INKED = '.work-head h2, .kit h2, .section-h, .job h3, .row h2, .counts dd, .next strong, .pairs dt';

if (motion) {
  smooth();
  pressRun();
  cursor();
  magnets();
  $$('.ticker').forEach(ticker);
  $$(INKED).forEach(h => { h.classList.add('ink'); onView(h, .5, () => h.classList.add('on')); });
  $$(RULED).forEach(r => { r.classList.add('rule'); onView(r, .05, () => r.classList.add('on')); });
  $$('.sheet').forEach(printOnView);
  $$('.counts dd').forEach(countUp);

  const mr = html.classList.contains('loading') && document.querySelector('.make-ready');
  // fonts first, or the plates and lines would be set on the fallback face
  (mr ? makeReady(mr) : document.fonts.ready).then(() => {
    const press = document.getElementById('press');
    const head = document.getElementById('hero') || document.querySelector('.page-head');
    if (mr) gsap.from('.bar', { yPercent: -100, duration: 1.2, delay: .7, ease: EASE });
    if (head) headIn(head, mr ? .6 : .1);
    if (press) homePress(head, press, html.classList.contains('proofed') ? null : mr ? .55 : .35);
    $$('[data-lock]').forEach(lockOnView);
    $$('.work-head h2, .kit h2, .section-h').forEach(linesOnView);
    rise();
  });
}

// IT support: frames on the contact sheet open full size in the loupe. Without JS they are plain links.
const loupe = document.getElementById('loupe');
if (loupe) {
  const frames = $$('.frame');
  const img = loupe.querySelector('img');
  const num = document.getElementById('loupe-n');
  const cap = document.getElementById('loupe-cap');
  let at = 0;

  const show = i => {
    at = (i + frames.length) % frames.length;
    const f = frames[at];
    const alt = f.querySelector('img').alt;
    img.src = f.href;
    img.alt = alt;
    num.textContent = `Frame ${at + 1} of ${frames.length}`;
    cap.textContent = alt;
    f.classList.add('seen'); // a picked frame keeps its grease-pencil circle
  };

  frames.forEach((f, i) => f.addEventListener('click', e => {
    e.preventDefault();
    show(i);
    loupe.showModal();
    lenis?.stop();
  }));
  loupe.querySelectorAll('[data-step]').forEach(b => b.addEventListener('click', () => show(at + Number(b.dataset.step))));
  loupe.querySelector('.loupe-x').addEventListener('click', () => loupe.close());
  loupe.addEventListener('click', e => { if (e.target === loupe) loupe.close(); });
  loupe.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') show(at - 1);
    if (e.key === 'ArrowRight') show(at + 1);
  });
  loupe.addEventListener('close', () => { lenis?.start(); frames[at].focus(); });
}
