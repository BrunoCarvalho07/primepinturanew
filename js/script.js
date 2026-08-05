/**
 * PRIME PINTURA — script.js
 * Vanilla JS, sem dependências externas (mantém o site leve e rápido em 3G/4G).
 *
 * Módulos:
 *  1. Header: muda de transparente para sólido ao rolar
 *  2. Menu mobile: abre/fecha o overlay de navegação
 *  3. Hero scroll-scrubbing: desenha o frame correto do vídeo de tinta
 *     num <canvas> conforme a posição do scroll dentro da seção Hero
 *  4. Indicador de "rolo de tinta": preenche a trilha lateral conforme
 *     o progresso de leitura da página inteira
 *  5. Vídeo da seção "Cores sob medida": efeito parallax sutil
 *  6. Carrossel de avaliações: arrastável com mouse/touch
 *  7. Reveal on scroll: fade/slide leve para elementos ao entrarem na tela
 */

document.addEventListener("DOMContentLoaded", () => {
  initHeader();
  initMobileMenu();
  initHeroScrubbing();
  initScrollRoller();
  initVideoParallax();
  initReviewsDrag();
  initRevealOnScroll();
  setYear();
});

/* ---------- 1. HEADER ---------- */
function initHeader() {
  const header = document.querySelector(".site-header");
  if (!header) return;

  const onScroll = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 40);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

/* ---------- 2. MENU MOBILE ---------- */
function initMobileMenu() {
  const toggle = document.querySelector(".nav-toggle");
  const menu = document.querySelector(".mobile-menu");
  if (!toggle || !menu) return;

  const closeMenu = () => {
    menu.classList.remove("is-open");
    document.body.classList.remove("menu-open");
    toggle.setAttribute("aria-expanded", "false");
  };

  toggle.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("is-open");
    document.body.classList.toggle("menu-open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  menu.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
}

/* ---------- 3. HERO SCROLL-SCRUBBING ---------- */
/**
 * Técnica: uma sequência de imagens (frames extraídos do vídeo de tinta
 * laranja) é pré-carregada. Enquanto a seção .hero-wrapper (400vh) rola,
 * calculamos o progresso (0 a 1) e desenhamos o frame correspondente no
 * canvas. Isso cria o efeito "cinematográfico" de vídeo controlado pelo
 * scroll, sem o travamento comum de <video>.currentTime em mobile/Safari.
 */
function initHeroScrubbing() {
  const wrapper = document.querySelector(".hero-wrapper");
  const canvas = document.getElementById("hero-canvas");
  if (!wrapper || !canvas) return;

  const ctx = canvas.getContext("2d");
  const FRAME_COUNT = 48; // quantidade de frames extraídos do vídeo
  const framePath = (i) =>
    `assets/frames-hero/frame_${String(i + 1).padStart(3, "0")}.jpg`;

  const images = new Array(FRAME_COUNT);
  let loadedCount = 0;
  let ready = false;

  function preload() {
    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      img.src = framePath(i);
      img.onload = () => {
        loadedCount++;
        if (loadedCount === 1) drawFrame(0); // mostra algo assim que possível
        if (loadedCount === FRAME_COUNT) ready = true;
      };
      images[i] = img;
    }
  }

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawFrame(index) {
    const img = images[index];
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    const ir = img.naturalWidth / img.naturalHeight;
    const cr = cw / ch;

    let dw, dh, dx, dy;
    if (ir > cr) {
      dh = ch; dw = ch * ir; dx = (cw - dw) / 2; dy = 0;
    } else {
      dw = cw; dh = cw / ir; dx = 0; dy = (ch - dh) / 2;
    }
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const rect = wrapper.getBoundingClientRect();
      const total = wrapper.offsetHeight - window.innerHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      const progress = total > 0 ? scrolled / total : 0;
      const frameIndex = Math.min(FRAME_COUNT - 1, Math.floor(progress * FRAME_COUNT));
      drawFrame(frameIndex);
      ticking = false;
    });
  }

  window.addEventListener("resize", () => {
    resizeCanvas();
    if (ready) onScroll();
  });

  resizeCanvas();
  preload();
  window.addEventListener("scroll", onScroll, { passive: true });
}

/* ---------- 4. INDICADOR "ROLO DE TINTA" ---------- */
function initScrollRoller() {
  const fill = document.querySelector(".scroll-roller__fill");
  const icon = document.querySelector(".scroll-roller__icon");
  if (!fill || !icon) return;

  let ticking = false;
  function update() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const doc = document.documentElement;
      const total = doc.scrollHeight - window.innerHeight;
      const progress = total > 0 ? window.scrollY / total : 0;
      const pct = Math.min(100, Math.max(0, progress * 100));
      fill.style.height = pct + "%";
      icon.style.bottom = pct + "%";
      ticking = false;
    });
  }
  update();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
}

/* ---------- 5. PARALLAX DO VÍDEO "CORES SOB MEDIDA" ---------- */
function initVideoParallax() {
  const section = document.querySelector(".video-feature");
  const video = section?.querySelector("video");
  if (!section || !video) return;

  let ticking = false;
  function update() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      if (rect.top < vh && rect.bottom > 0) {
        const progress = 1 - (rect.top + rect.height / 2) / (vh + rect.height / 2);
        const offset = (progress - 0.5) * 60; // desloca até 30px pra cada lado
        video.style.transform = `translateY(${offset}px) scale(1.15)`;
      }
      ticking = false;
    });
  }
  update();
  window.addEventListener("scroll", update, { passive: true });

  // Autoplay costuma exigir vídeo mudo + playsinline; garante que toca
  // mesmo se o navegador pausar por economia de dados.
  video.play?.().catch(() => {});
}

/* ---------- 6. CARROSSEL DE AVALIAÇÕES (arrastável) ---------- */
function initReviewsDrag() {
  const track = document.querySelector(".reviews-track");
  if (!track) return;

  let isDown = false;
  let startX = 0;
  let scrollStart = 0;

  const start = (x) => {
    isDown = true;
    startX = x;
    scrollStart = track.scrollLeft;
    track.classList.add("is-dragging");
  };
  const move = (x) => {
    if (!isDown) return;
    track.scrollLeft = scrollStart - (x - startX);
  };
  const end = () => {
    isDown = false;
    track.classList.remove("is-dragging");
  };

  track.addEventListener("mousedown", (e) => start(e.pageX));
  window.addEventListener("mousemove", (e) => move(e.pageX));
  window.addEventListener("mouseup", end);

  track.addEventListener("touchstart", (e) => start(e.touches[0].pageX), { passive: true });
  track.addEventListener("touchmove", (e) => move(e.touches[0].pageX), { passive: true });
  track.addEventListener("touchend", end);
}

/* ---------- 7. REVEAL ON SCROLL ---------- */
function initRevealOnScroll() {
  const targets = document.querySelectorAll("[data-reveal]");
  if (!targets.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  targets.forEach((el) => io.observe(el));
}

/* ---------- Ano dinâmico no rodapé ---------- */
function setYear() {
  const el = document.getElementById("current-year");
  if (el) el.textContent = new Date().getFullYear();
}
