import gsap from 'gsap';

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

const motion = matchMedia('(prefers-reduced-motion: no-preference)').matches;
const layers = (root, ink) => root.querySelectorAll(`.${ink}`);
const pose = (p, s) => ({ x: p[0] * s, y: p[1] * s, rotation: p[2] });

// Home only: the name is pulled through four proofs, then drifts with the pointer.
function homePress(hero, press) {
  const proofN = document.getElementById('proof-n');
  const proofS = document.getElementById('proof-s');
  let pressing = false;

  if (!document.documentElement.classList.contains('proofed')) {
    pressing = true;
    const s = press.offsetWidth / 1440;
    INKS.forEach(ink => gsap.set(layers(press, ink), pose(PROOFS[0][ink], s)));
    const tl = gsap.timeline({ delay: .35, onComplete: () => { pressing = false; } });
    PROOFS.forEach((proof, i) => {
      tl.call(() => {
        proofN.textContent = `Proof ${i + 1}`;
        proofS.textContent = i === PROOFS.length - 1 ? 'in register' : 'out of register';
      }, null, i === 0 ? 0 : '+=.42');
      if (i === 0) return;
      // a press hit: fast in, no overshoot
      INKS.forEach(ink => tl.to(layers(press, ink), { ...pose(proof[ink], s), duration: .16, ease: 'expo.out' }, '<'));
    });
  }

  const q = Object.fromEntries(INKS.map(ink => [ink, {
    x: gsap.quickTo(layers(press, ink), 'x', { duration: .55, ease: 'power3.out' }),
    y: gsap.quickTo(layers(press, ink), 'y', { duration: .55, ease: 'power3.out' }),
  }]));
  const clamp = gsap.utils.clamp(-26, 26);
  let settle;
  hero.addEventListener('pointermove', e => {
    if (pressing || e.pointerType !== 'mouse') return;
    const vx = clamp(e.movementX), vy = clamp(e.movementY);
    INKS.forEach(ink => { q[ink].x(vx * DRIFT[ink]); q[ink].y(vy * DRIFT[ink]); });
    clearTimeout(settle);
    settle = setTimeout(() => INKS.forEach(ink => { q[ink].x(0); q[ink].y(0); }), 90);
  });
}

// Anything marked data-lock arrives out of register and lines up once it is on screen.
function lockOnView(el) {
  const s = innerWidth / 1440 * 1.1;
  INKS.forEach(ink => gsap.set(layers(el, ink), pose(PROOFS[1][ink], s)));
  new IntersectionObserver(([e], io) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    INKS.forEach((ink, i) => gsap.to(layers(el, ink), { x: 0, y: 0, rotation: 0, duration: .9, delay: .1 + i * .08, ease: 'expo.out' }));
  }, { threshold: .6 }).observe(el);
}

if (motion) {
  // fonts first, or the plates would be set on the fallback face
  document.fonts.ready.then(() => {
    const press = document.getElementById('press');
    if (press) homePress(document.getElementById('hero'), press);
    document.querySelectorAll('[data-lock]').forEach(lockOnView);
  });
}

// IT support: frames on the contact sheet open full size in the loupe. Without JS they are plain links.
const loupe = document.getElementById('loupe');
if (loupe) {
  const frames = [...document.querySelectorAll('.frame')];
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
  }));
  loupe.querySelectorAll('[data-step]').forEach(b => b.addEventListener('click', () => show(at + Number(b.dataset.step))));
  loupe.querySelector('.loupe-x').addEventListener('click', () => loupe.close());
  loupe.addEventListener('click', e => { if (e.target === loupe) loupe.close(); });
  loupe.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') show(at - 1);
    if (e.key === 'ArrowRight') show(at + 1);
  });
  loupe.addEventListener('close', () => frames[at].focus());
}
