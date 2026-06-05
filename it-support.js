import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Hero enter animation
const heroTl = gsap.timeline({ delay: 1.8 });
heroTl
    .to('.its-hero-label', { opacity: 1, x: 0, duration: 0.7, ease: 'power3.out' })
    .to('.its-hero-title', { opacity: 1, y: 0, duration: 0.9, ease: 'power4.out' }, '-=0.4')
    .to('.its-hero-sub', { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '-=0.5');

// Bento items stagger on scroll
const items = document.querySelectorAll('.bento-item');
items.forEach((item, i) => {
    gsap.to(item, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: 'power3.out',
        delay: (i % 4) * 0.08,
        scrollTrigger: {
            trigger: item,
            start: 'top 90%',
        }
    });
});

// Lightbox
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const closeBtn = document.getElementById('lightbox-close');
const prevBtn = document.getElementById('lightbox-prev');
const nextBtn = document.getElementById('lightbox-next');

const allImages = Array.from(document.querySelectorAll('.bento-item img'));
let currentIndex = 0;

function openLightbox(index) {
    currentIndex = index;
    lightboxImg.src = allImages[currentIndex].src;
    lightboxImg.alt = allImages[currentIndex].alt;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
}

function showPrev() {
    currentIndex = (currentIndex - 1 + allImages.length) % allImages.length;
    lightboxImg.src = allImages[currentIndex].src;
}

function showNext() {
    currentIndex = (currentIndex + 1) % allImages.length;
    lightboxImg.src = allImages[currentIndex].src;
}

allImages.forEach((img, i) => {
    img.parentElement.addEventListener('click', () => openLightbox(i));
});

closeBtn.addEventListener('click', closeLightbox);
prevBtn.addEventListener('click', showPrev);
nextBtn.addEventListener('click', showNext);

lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
});

document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') showPrev();
    if (e.key === 'ArrowRight') showNext();
});
