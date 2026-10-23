// ============================================
// HEIRLOOM — Teaser Landing Page Scripts
// ============================================

document.addEventListener('DOMContentLoaded', () => {

  // --- Navbar scroll effect ---
  const nav = document.getElementById('nav');
  const onScroll = () => {
    nav.classList.toggle('nav--scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // --- Mobile nav toggle ---
  const navToggle = document.getElementById('navToggle');
  if (navToggle) {
    navToggle.addEventListener('click', () => {
      nav.classList.toggle('nav--open');
    });
    document.querySelectorAll('.nav__link').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('nav--open');
      });
    });
  }

  // --- Hero: the leader from the watch case to the loupe ---
  // Measured from the layout rather than drawn by hand, so it meets the loupe
  // at every width, after the fonts settle, and while the layers drift.
  // Hidden by CSS on phones, where the loupe sits inside the record.
  const hero = document.querySelector('.hero');
  const scene = document.querySelector('[data-hero-scene]');
  const leader = document.querySelector('.specimen__leader');
  const caseEdge = document.querySelector('.specimen__target');
  const loupe = document.querySelector('.loupe');

  const drawLeader = () => {
    if (!scene || !leader || !caseEdge || !loupe) return;
    if (getComputedStyle(leader).display === 'none') return;
    const box = scene.getBoundingClientRect();
    const lens = loupe.getBoundingClientRect();
    // The case edge: from the 3D watch while it shows (hero-watch.js), else the drawing's.
    let start;
    if (scene.classList.contains('is-3d') && window.heirloomWatch) {
      start = window.heirloomWatch.leaderStart();
    } else {
      const edge = caseEdge.getBoundingClientRect();
      start = { x: edge.left + edge.width / 2, y: edge.top + edge.height / 2 };
    }
    const sx = start.x - box.left;
    const sy = start.y - box.top;
    const cx = lens.left + lens.width / 2 - box.left;
    const cy = lens.top + lens.height / 2 - box.top;
    const dist = Math.hypot(sx - cx, sy - cy) || 1;
    const ux = (sx - cx) / dist;
    const uy = (sy - cy) / dist;
    // Meet the rim, arriving square to it; leave the case heading straight down.
    const ex = cx + ux * (lens.width / 2);
    const ey = cy + uy * (lens.width / 2);
    const bend = Math.min(110, dist * 0.4);
    const n = (v) => v.toFixed(1);
    leader.querySelector('path').setAttribute('d',
      `M${n(sx)} ${n(sy)} C${n(sx)} ${n(sy + bend)} ${n(ex + ux * bend * 0.6)} ${n(ey + uy * bend * 0.6)} ${n(ex)} ${n(ey)}`);
    leader.querySelectorAll('circle').forEach((dot) => {
      dot.setAttribute('cx', n(sx));
      dot.setAttribute('cy', n(sy));
    });
  };

  if (scene && leader && loupe) {
    drawLeader();
    // Shown once the loupe has come into focus (at once with reduced motion,
    // where there is no animation to wait for).
    Promise.all(loupe.getAnimations ? loupe.getAnimations().map((a) => a.finished) : [])
      .catch(() => {})
      .then(() => {
        drawLeader();
        leader.classList.add('is-drawn');
      });
    if (document.fonts) document.fonts.ready.then(drawLeader);
    if ('ResizeObserver' in window) new ResizeObserver(drawLeader).observe(scene);
    window.addEventListener('resize', drawLeader, { passive: true });
    window.addEventListener('heirloom:watch', drawLeader);
  }

  // --- Hero: if the 3D watch has not arrived in a few seconds, show the drawing ---
  if (scene) {
    setTimeout(() => {
      if (!scene.classList.contains('is-3d')) scene.classList.add('no-3d');
    }, 4000);
  }

  const calm = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  // --- Hero: the example record drifts a little with the pointer ---
  // Each layer reads --px / --py (-0.5 to 0.5) at its own depth (styles.css).
  // Only for a mouse or trackpad, and never for someone who asked for less motion.
  if (hero && scene && finePointer.matches && !calm.matches) {
    let targetX = 0, targetY = 0, x = 0, y = 0, frame = 0;
    const step = () => {
      x += (targetX - x) * 0.08;
      y += (targetY - y) * 0.08;
      scene.style.setProperty('--px', x.toFixed(4));
      scene.style.setProperty('--py', y.toFixed(4));
      drawLeader();
      const settled = Math.abs(targetX - x) + Math.abs(targetY - y) < 0.0005;
      frame = settled ? 0 : requestAnimationFrame(step);
    };
    const aim = (tx, ty) => {
      targetX = tx;
      targetY = ty;
      if (!frame) frame = requestAnimationFrame(step);
    };
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      aim((e.clientX - r.left) / r.width - 0.5, (e.clientY - r.top) / r.height - 0.5);
    });
    hero.addEventListener('pointerleave', () => aim(0, 0));
  }

  // --- Scroll-based fade-in animations ---
  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        fadeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  const animateSelectors = [
    '.feature-card',
    '.preview__item',
    '.who__card',
    '.way-card',
    '.pitch__inner',
    '.how-step',
    '.section-header',
    '.cta__inner'
  ];

  animateSelectors.forEach(selector => {
    document.querySelectorAll(selector).forEach((el, i) => {
      el.classList.add('fade-in');
      el.style.transitionDelay = `${i * 0.08}s`;
      fadeObserver.observe(el);
    });
  });

  // --- Waitlist form (Formspree) ---
  const form = document.getElementById('waitlistForm');
  const success = document.getElementById('waitlistSuccess');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      btn.textContent = 'Sending…';
      btn.disabled = true;

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      }).then(res => {
        if (res.ok) {
          form.style.display = 'none';
          success.style.display = 'block';
          success.classList.add('fade-in', 'visible');
        } else {
          btn.textContent = 'Try Again';
          btn.disabled = false;
        }
      }).catch(() => {
        btn.textContent = 'Try Again';
        btn.disabled = false;
      });
    });
  }

  // --- Smooth scroll for anchor links ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const offset = nav.offsetHeight + 16;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

});
