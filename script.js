// ─── PARTICLE NETWORK CANVAS ─────────────────────────────────────
const animCanvas = document.getElementById('anim-canvas');
if (animCanvas) {
  const ctx = animCanvas.getContext('2d');
  const N = 50, DIST = 140, SPD = 0.28, C = '224,74,16';
  let W, H, pts, live = false;

  const resize = () => {
    W = animCanvas.width = animCanvas.offsetWidth;
    H = animCanvas.height = animCanvas.offsetHeight;
  };
  const init = () => {
    pts = Array.from({length: N}, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - .5) * SPD, vy: (Math.random() - .5) * SPD
    }));
  };
  const tick = () => {
    if (!live) return;
    ctx.clearRect(0, 0, W, H);
    for (const p of pts) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${C},.55)`;
      ctx.fill();
    }
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < DIST) {
          ctx.beginPath();
          ctx.moveTo(pts[i].x, pts[i].y);
          ctx.lineTo(pts[j].x, pts[j].y);
          ctx.strokeStyle = `rgba(${C},${.14 * (1 - d / DIST)})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(tick);
  };

  new IntersectionObserver(([e]) => {
    live = e.isIntersecting;
    if (live) tick();
  }, {threshold: 0.1}).observe(animCanvas);

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && live) tick();
    else live = false;
  });

  resize(); init();
  window.addEventListener('resize', () => { resize(); init(); }, {passive: true});
}

// ─── SCROLL REVEAL ────────────────────────────────────────────────
const reveals = document.querySelectorAll('.reveal');
if (reveals.length) {
  const observer = new IntersectionObserver(
    entries => entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    }),
    { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
  );
  reveals.forEach(el => observer.observe(el));
}

// ─── NAV SCROLL STATE ─────────────────────────────────────────────
const nav = document.querySelector('.nav');
if (nav) {
  const handleScroll = () => nav.classList.toggle('scrolled', window.scrollY > 50);
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
}

// ─── MOBILE NAV ───────────────────────────────────────────────────
const toggle  = document.querySelector('.nav-toggle');
const mobileNav = document.querySelector('.nav-mobile');
const toggleSpans = document.querySelectorAll('.nav-toggle span');

if (toggle && mobileNav) {
  toggle.addEventListener('click', () => {
    const isOpen = mobileNav.classList.toggle('open');
    document.body.style.overflow = isOpen ? 'hidden' : '';
    if (isOpen) {
      toggleSpans[0]?.style && (toggleSpans[0].style.transform = 'translateY(6.5px) rotate(45deg)');
      toggleSpans[1]?.style && (toggleSpans[1].style.opacity = '0');
      toggleSpans[2]?.style && (toggleSpans[2].style.transform = 'translateY(-6.5px) rotate(-45deg)');
    } else {
      toggleSpans[0]?.style && (toggleSpans[0].style.transform = '');
      toggleSpans[1]?.style && (toggleSpans[1].style.opacity = '');
      toggleSpans[2]?.style && (toggleSpans[2].style.transform = '');
    }
  });

  document.querySelectorAll('.nav-mobile a').forEach(link => {
    link.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      document.body.style.overflow = '';
      toggleSpans[0]?.style && (toggleSpans[0].style.transform = '');
      toggleSpans[1]?.style && (toggleSpans[1].style.opacity = '');
      toggleSpans[2]?.style && (toggleSpans[2].style.transform = '');
    });
  });

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && mobileNav.classList.contains('open')) {
      mobileNav.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
}

// ─── CONTACT FORM + CAPTCHA ───────────────────────────────────────
const contactForm = document.querySelector('#contact-form');
if (contactForm) {
  // Math CAPTCHA
  let _captchaAnswer = 0;
  const _captchaQ = document.getElementById('contact-captcha-q');
  const _captchaErr = document.getElementById('contact-captcha-error');
  const _initCaptcha = () => {
    const a = Math.floor(Math.random() * 9) + 1;
    const b = Math.floor(Math.random() * 9) + 1;
    _captchaAnswer = a + b;
    if (_captchaQ) _captchaQ.textContent = a + ' + ' + b;
  };
  _initCaptcha();

  contactForm.addEventListener('submit', e => {
    e.preventDefault();
    // Honeypot check
    const honeypot = contactForm.querySelector('[name="website"]');
    if (honeypot && honeypot.value) return;
    // Captcha check
    const captchaInput = document.getElementById('contact-captcha');
    if (captchaInput && parseInt(captchaInput.value, 10) !== _captchaAnswer) {
      if (_captchaErr) _captchaErr.style.display = 'block';
      captchaInput.value = '';
      _initCaptcha();
      return;
    }
    if (_captchaErr) _captchaErr.style.display = 'none';
    const btn = contactForm.querySelector('[type="submit"]');
    const original = btn.textContent;
    btn.textContent = 'Message envoyé ✓';
    btn.style.background = '#2d6a30';
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = original;
      btn.style.background = '';
      btn.disabled = false;
      contactForm.reset();
      _initCaptcha();
    }, 4000);
  });
}

// ─── SCROLL PROGRESS BAR ──────────────────────────────────────────
const progressBar = document.querySelector('.scroll-progress');
if (progressBar) {
  window.addEventListener('scroll', () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (max > 0) progressBar.style.transform = `scaleX(${window.scrollY / max})`;
  }, { passive: true });
}

// ─── COUNTER ANIMATION ────────────────────────────────────────────
document.querySelectorAll('[data-count]').forEach(el => {
  const target = parseFloat(el.dataset.count);
  const suffix = el.dataset.suffix || '';
  let started = false;
  const obs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !started) {
      started = true;
      const duration = 1800;
      const t0 = performance.now();
      const tick = now => {
        const p = Math.min((now - t0) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Number.isInteger(target)
          ? Math.floor(eased * target)
          : (eased * target).toFixed(1);
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = target + suffix;
      };
      requestAnimationFrame(tick);
      obs.unobserve(el);
    }
  }, { threshold: 0.6 });
  obs.observe(el);
});

// ─── CLIP-PATH REVEAL ─────────────────────────────────────────────
document.querySelectorAll('.clip-up').forEach(el => {
  const obs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) { el.classList.add('visible'); obs.unobserve(el); }
  }, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });
  obs.observe(el);
});

// ─── SPOTLIGHT BORDER ─────────────────────────────────────────────
document.querySelectorAll('.spotlight').forEach(el => {
  el.addEventListener('mousemove', e => {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    el.style.setProperty('--my', (e.clientY - r.top) + 'px');
  });
  el.addEventListener('mouseleave', () => {
    el.style.setProperty('--mx', '-9999px');
    el.style.setProperty('--my', '-9999px');
  });
});

// ─── DARK AMBIENT IN-VIEW ─────────────────────────────────────────
const darkAmbient = document.querySelector('.dark-ambient');
if (darkAmbient) {
  const ambObs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      darkAmbient.classList.add('in-view');
      ambObs.unobserve(darkAmbient);
    }
  }, { threshold: 0.15 });
  ambObs.observe(darkAmbient);
}

// ─── MAGNETIC BUTTONS ─────────────────────────────────────────────
document.querySelectorAll('.magnetic').forEach(btn => {
  btn.addEventListener('mousemove', e => {
    const r = btn.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width / 2) * 0.22;
    const y = (e.clientY - r.top - r.height / 2) * 0.22;
    btn.style.transform = `translate(${x}px, ${y}px)`;
  });
  btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
});
