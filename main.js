(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const hasGsap = typeof window.gsap !== 'undefined';
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (hasGsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /* ---------- theme ---------- */
  const root = document.documentElement;
  $('#theme-btn').addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { sessionStorage.setItem('theme-choice', next); } catch (e) {}
    drawAscii();
  });
  // if the visitor changes their phone or computer theme while the page is open, follow it
  // (unless they picked one with the toggle during this visit)
  const sysDark = matchMedia('(prefers-color-scheme: dark)');
  const followSystem = () => {
    let picked = null; try { picked = sessionStorage.getItem('theme-choice'); } catch (e) {}
    if (picked) return;
    root.dataset.theme = sysDark.matches ? 'dark' : 'light';
    drawAscii();
  };
  sysDark.addEventListener ? sysDark.addEventListener('change', followSystem) : sysDark.addListener(followSystem);

  /* ---------- clock ---------- */
  const clock = $('#clock');
  const tick = () => clock.textContent = '· ' + new Intl.DateTimeFormat('en-IE', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Dublin' }).format(new Date());
  tick(); setInterval(tick, 20000);

  /* ---------- loader + intro ---------- */
  const intro = () => {
    document.body.classList.remove('loading');
    if (!hasGsap) { $('.loader').remove(); return; }
    const tl = gsap.timeline();
    tl.to('.loader', { yPercent: -100, duration: 1, ease: 'expo.inOut' })
      .set('.loader', { display: 'none' })
      .from('.hero-title .word', { yPercent: 115, duration: 1.2, ease: 'expo.out', stagger: .06 }, '-=.45')
      .from('.hero-top > *', { y: 14, opacity: 0, duration: .8, ease: 'expo.out', stagger: .08 }, '-=1')
      .from('.fade-up', { y: 30, opacity: 0, duration: 1, ease: 'expo.out', stagger: .1 }, '-=.9')
      .from('.nav', { opacity: 0, duration: .8, ease: 'power2.out' }, '-=1');
  };
  if (hasGsap) {
    const n = { v: 0 };
    gsap.to(n, { v: 100, duration: 1.1, ease: 'power2.inOut', onUpdate: () => {
      $('#load-n').textContent = Math.round(n.v);
      $('.loader-bar i').style.width = n.v + '%';
    }, onComplete: intro });
  } else intro();

  /* ---------- cursor ---------- */
  const cur = $('.cursor');
  let mx = innerWidth / 2, my = innerHeight / 2;
  addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; cur.classList.add('on'); });
  if (fine && hasGsap) {
    const cx = gsap.quickTo(cur, 'x', { duration: .35, ease: 'power3' });
    const cy = gsap.quickTo(cur, 'y', { duration: .35, ease: 'power3' });
    addEventListener('pointermove', () => { cx(mx); cy(my); });
    $$('a, button, .work, .portrait').forEach(el => {
      el.addEventListener('mouseenter', () => cur.classList.add('big'));
      el.addEventListener('mouseleave', () => cur.classList.remove('big'));
    });
  }

  /* ---------- magnetic buttons ---------- */
  if (fine && hasGsap) $$('.magnetic').forEach(el => {
    const x = gsap.quickTo(el, 'x', { duration: .6, ease: 'elastic.out(1, .4)' });
    const y = gsap.quickTo(el, 'y', { duration: .6, ease: 'elastic.out(1, .4)' });
    el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); x((e.clientX - r.left - r.width / 2) * .35); y((e.clientY - r.top - r.height / 2) * .35); });
    el.addEventListener('pointerleave', () => { x(0); y(0); });
  });

  /* ---------- nav: hide on scroll down, show on scroll up ---------- */
  const nav = $('.nav');
  let lastY = 0;
  addEventListener('scroll', () => {
    const y = scrollY;
    nav.classList.toggle('scrolled', y > 40);
    nav.classList.toggle('hide', y > lastY && y > 400 && !document.querySelector('dialog[open]'));
    lastY = y;
  }, { passive: true });
  const links = $$('.nav-links a');
  const secIO = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  $$('section[id]').forEach(s => secIO.observe(s));
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const t = $(a.getAttribute('href')); if (!t) return;
    e.preventDefault(); t.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));

  /* ---------- paper roll: a 3D drum of words that turns as you scroll ---------- */
  const drum = $('.roll-drum'), rollEl = $('.roll');
  const WORDS = ['Python', 'RAG pipelines', 'SQL', 'LangChain', 'LLaMA 3', 'pgvector', 'XGBoost', 'FastAPI', 'Power BI', 'AWS', 'Docker', 'EU AI Act'];
  const INKS = ['#151515', '#2c44f0', '#151515'];
  const STARS = ['#2c44f0', '#a3a3a3', '#2c44f0', '#a3a3a3'];
  const N = 14;
  let tracks = [], half = 0;
  const buildRoll = () => {
    const R = parseFloat(getComputedStyle(rollEl).getPropertyValue('--R')) || 120;
    const faceH = 2 * R * Math.tan(Math.PI / N) + 1;
    drum.textContent = '';
    tracks = [];
    for (let i = 0; i < N; i++) {
      const f = document.createElement('div'); f.className = 'roll-face';
      f.style.height = faceH + 'px'; f.style.marginTop = (-faceH / 2) + 'px';
      f.style.transform = `rotateX(${-i * 360 / N}deg) translateZ(${R}px)`;
      const t = document.createElement('div'); t.className = 'roll-track';
      t.style.fontSize = (faceH * .56) + 'px'; t.style.color = INKS[i % 3];
      let html = '';
      for (let r2 = 0; r2 < 3; r2++) for (let k = 0; k < WORDS.length; k++) {
        const w = WORDS[(k + i * 5) % WORDS.length];
        html += ((k + i) % 2 ? `<span class="serif"><em>${w}</em></span>` : `<span>${w}</span>`) + `<i style="color:${STARS[(k + i) % 4]}">✳</i>`;
      }
      t.innerHTML = html; f.appendChild(t); drum.appendChild(f);
      tracks.push(t);
    }
    half = tracks[0].scrollWidth / 3;
  };
  buildRoll();
  let rollTimer; addEventListener('resize', () => { clearTimeout(rollTimer); rollTimer = setTimeout(buildRoll, 200); });
  document.fonts && document.fonts.ready.then(() => { if (tracks[0]) half = tracks[0].scrollWidth / 3; });
  // the roll is locked to the scroll position: scroll down and it rolls forward, scroll up and it rolls back
  let ang = 0, drift = 0;
  const STEP = 360 / N;
  const spin = () => {
    drift += 0.12;
    const target = scrollY * 0.5 + drift;
    ang += (target - ang) * 0.14;
    drum.style.transform = `rotateX(${ang}deg)`;
    const slide = ang * 2.2;
    tracks.forEach((t, i) => {
      const off = half ? ((i % 2 ? slide : -slide) - (i * 41) % 200) % half - half : 0;
      t.style.transform = `translateX(${off}px)`;
      const c = Math.cos((ang - i * STEP) * Math.PI / 180); // 1 = facing you, -1 = round the back
      const f = t.parentNode;
      f.style.setProperty('--sh', (0.62 * (1 - Math.max(0, c))).toFixed(3));
      f.style.setProperty('--sx', (1 + 0.05 * c).toFixed(4));
    });
    requestAnimationFrame(spin);
  };
  requestAnimationFrame(spin);

  /* ---------- hero letters thicken near the cursor ---------- */
  $$('.hero-title .word:not(.hero-arrow):not(.badge-word)').forEach(w => {
    w.innerHTML = [...w.textContent].map(c => `<span class="ch">${c}</span>`).join('');
  });
  const chars = $$('.hero-title .ch');
  if (fine) {
    const hero = $('.hero'); let raf = 0;
    hero.addEventListener('pointermove', e => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        chars.forEach(c => {
          const r = c.getBoundingClientRect();
          const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
          const k = Math.max(0, 1 - d / 260);
          const serif = c.closest('.serif');
          c.style.fontWeight = Math.round((serif ? 400 : 600) + k * (serif ? 400 : 200));
        });
      });
    });
    hero.addEventListener('pointerleave', () => chars.forEach(c => c.style.fontWeight = ''));
  }
  if (hasGsap) gsap.to(chars, { keyframes: [{ fontWeight: 800, duration: .25 }, { fontWeight: 600, duration: .5 }], stagger: .035, delay: 2.4, ease: 'power2.inOut', clearProps: 'fontWeight' });

  /* ---------- scroll animations ---------- */
  if (hasGsap) {
    $$('.sec-title .word, .contact-title .word').forEach(w => gsap.from(w, { yPercent: 115, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: w.closest('h2'), start: 'top 85%' } }));
    gsap.utils.toArray('.kicker').forEach(k => gsap.from(k, { opacity: 0, x: -20, duration: .9, ease: 'expo.out', scrollTrigger: { trigger: k, start: 'top 90%' } }));
    gsap.fromTo('.sheet', { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 -12px 0)', ease: 'none', scrollTrigger: { trigger: '.sheet', start: 'top 92%', end: 'top 40%', scrub: .6 } });
    gsap.utils.toArray('.hl').forEach(h => gsap.fromTo(h, { '--hlx': 0 }, { '--hlx': 1, duration: .9, ease: 'expo.out', delay: h.closest('.hero') ? 2.2 : 0, scrollTrigger: h.closest('.hero') ? null : { trigger: h, start: 'top 85%' } }));
    $$('[data-count]').forEach(n => {
      const o = { v: 0 };
      gsap.to(o, { v: +n.dataset.count, duration: 1.8, ease: 'power3.out', scrollTrigger: { trigger: n, start: 'top 70%' }, onUpdate: () => n.textContent = Math.round(o.v) });
    });
    gsap.to('.tl-fill', { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.timeline', start: 'top 60%', end: 'bottom 60%', scrub: true } });
    $$('.job').forEach(j => {
      ScrollTrigger.create({ trigger: j, start: 'top 60%', onEnter: () => j.classList.add('lit'), onLeaveBack: () => j.classList.remove('lit') });
    });
    // about: words light up as you read
    const big = $('.reveal-text');
    const walk = node => [...node.childNodes].forEach(ch => {
      if (ch.nodeType === 3) {
        const frag = document.createDocumentFragment();
        ch.textContent.split(/(\s+)/).forEach(part => {
          if (!part.trim()) { frag.appendChild(document.createTextNode(part)); return; }
          const s = document.createElement('span'); s.className = 'rw'; s.textContent = part; frag.appendChild(s);
        });
        ch.replaceWith(frag);
      } else walk(ch);
    });
    walk(big);
    gsap.to('.reveal-text .rw', { opacity: 1, stagger: .1, ease: 'none', scrollTrigger: { trigger: big, start: 'top 80%', end: 'bottom 45%', scrub: true } });
    // scroll-linked inward roll at both edges of the screen: blocks curl away from you
    // as they come in at the bottom, sit flat in the middle, and curl away again as they leave at the top
    gsap.utils.toArray('.work, .job, .about-big, .about-text, .facts > div, .contact-title, .contact-row, .socials, .sec-head').forEach(el => {
      gsap.set(el, { transformPerspective: 900, transformOrigin: '50% 50%' });
      gsap.timeline({ scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: .4 } })
        .fromTo(el, { rotationX: -72, opacity: .15, z: -60 }, { rotationX: 0, opacity: 1, z: 0, ease: 'power1.out', duration: .32 })
        .to(el, { rotationX: 0, duration: .36 })
        .to(el, { rotationX: 72, opacity: .15, z: -60, ease: 'power1.in', duration: .32 });
    });
    gsap.from('.foot-big', { yPercent: 40, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.foot', start: 'top 90%' } });
    gsap.to('.hero-title', { yPercent: -8, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  } else {
    $$('.reveal-text').forEach(el => el.style.opacity = 1);
    $$('[data-count]').forEach(n => n.textContent = n.dataset.count);
  }

  /* ---------- ASCII portrait: still pattern, hover shows the photo ---------- */
  const portrait = $('#portrait'), pimg = $('#portrait-img'), acv = $('#ascii');
  const ramp = ' .:-=+*#%@';
  let sample = null;
  const buildSample = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = acv.clientWidth, h = acv.clientHeight;
    acv.width = w * dpr; acv.height = h * dpr;
    const cell = 6;
    const cols = Math.floor(w / cell), rows = Math.floor(h / (cell * 1.2));
    const off = document.createElement('canvas'); off.width = cols; off.height = rows;
    const o = off.getContext('2d');
    const ir = pimg.naturalWidth / pimg.naturalHeight, cr = cols / (rows * 1.2);
    let sw = pimg.naturalWidth, sh = pimg.naturalHeight, sx = 0, sy = 0;
    if (ir > cr) { sw = sh * cr; sx = (pimg.naturalWidth - sw) / 2; } else { sh = sw / cr; sy = (pimg.naturalHeight - sh) / 2; }
    o.drawImage(pimg, sx, sy, sw, sh, 0, 0, cols, rows);
    sample = { data: o.getImageData(0, 0, cols, rows).data, cols, rows, w, h, dpr, cell };
  };
  function drawAscii() {
    if (!sample) return;
    const { data, cols, rows, w, h, dpr, cell } = sample;
    const ctx = acv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cs = getComputedStyle(root);
    ctx.fillStyle = cs.getPropertyValue('--bg2'); ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = cs.getPropertyValue('--blue');
    ctx.font = `${cell + 1.5}px "DM Mono", monospace`; ctx.textBaseline = 'top';
    const dark = root.dataset.theme === 'dark';
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4;
      let lum = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
      if (!dark) lum = 1 - lum; // ink on paper: darker pixels get denser characters
      lum = Math.max(0, Math.min(1, (lum - .42) * 1.9)); // push the grey backdrop to blank
      const k = Math.min(ramp.length - 1, Math.floor(Math.pow(lum, 1.3) * ramp.length));
      if (k) ctx.fillText(ramp[k], x * (w / cols), y * (h / rows));
    }
  }
  const startPortrait = () => {
    try { buildSample(); drawAscii(); } catch (e) { document.body.classList.add('no-ascii'); }
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { try { buildSample(); drawAscii(); } catch (e) {} }, 150); });
    portrait.addEventListener('click', () => portrait.classList.toggle('reveal'));
  };
  if (pimg.complete && pimg.naturalWidth) startPortrait(); else pimg.addEventListener('load', startPortrait);
  document.fonts && document.fonts.ready.then(() => drawAscii());

  /* ---------- project images: photo, or the drawn cover if the photo fails ---------- */
  const imgFor = {};
  $$('.work').forEach(w => {
    const key = w.dataset.project;
    imgFor[key] = w.dataset.img;
    const probe = new Image();
    probe.onerror = () => { imgFor[key] = w.dataset.fallback; const t = $('img', w); if (t) t.src = w.dataset.fallback; };
    probe.src = w.dataset.img;
    // phone thumbnail
    const th = document.createElement('span'); th.className = 'w-thumb';
    th.innerHTML = `<img src="${w.dataset.img}" alt="" loading="lazy">`;
    $('img', th).onerror = function () { this.onerror = null; this.src = w.dataset.fallback; };
    w.prepend(th);
    w.tabIndex = 0; w.setAttribute('role', 'button');
  });

  /* ---------- project details ---------- */
  const REPOS = {
    medifolio: 'https://github.com/sohambarve03/medifolio-llm-medical-system',
    macrosignal: 'https://github.com/sohambarve03/Macrosignal',
    toxic: 'https://github.com/sohambarve03/toxic-comment-detector'
  };
  const CREDIT = {
    medifolio: ['Vitaly Gariev', 'https://unsplash.com/photos/doctor-writing-on-a-patients-chart-8WYkI3cEZm8'],
    macrosignal: ['Nicholas Cappello', 'https://unsplash.com/photos/close-up-photo-of-monitor-displaying-graph-Wb63zqJ5gnE'],
    toxic: ['Shutter Speed', 'https://unsplash.com/photos/a-close-up-of-a-cell-phone-with-social-media-icons-on-it-a_lBsEZZjWc'],
    arima: ['Maxim Hopman', 'https://unsplash.com/photos/stock-market-candlestick-chart-on-dark-screen-fiXLQXAhCfk'],
    syncsphere: ['Chris Montgomery', 'https://unsplash.com/photos/macbook-pro-displaying-group-of-people-smgTvepind4'],
    esg: ['Zetong Li', 'https://unsplash.com/photos/livermore-wind-turbines-on-misty-green-hills-4iNQdT4mDLc'],
    plates: ['Atharva Tulsi', 'https://unsplash.com/photos/black-and-yellow-auto-rickshaw-on-road-poiZagysHEY']
  };
  const P = {
    medifolio: { tag: 'RAG · OCR · 2025 · First author, Springer CCIS', title: 'Medifolio',
      body: ['Doctors still write prescriptions by hand, so patient histories end up as piles of paper nobody can search. Medifolio turns them into structured, searchable records.', 'I built the OCR pipeline on AWS Textract and the retrieval layer on PostgreSQL with pgvector and Pinecone. On top of that sits a fine-tuned LLaMA chatbot that books appointments. The work was published in Springer CCIS (ICICCT 2025), with me as first author.'],
      stats: [['~95%', 'retrieval accuracy'], ['88–90%', 'chatbot accuracy'], ['1st', 'author, Springer']],
      stack: ['Flask', 'React', 'PostgreSQL', 'pgvector', 'Pinecone', 'MongoDB', 'AWS Textract', 'LLaMA'],
      link: ['Read the paper', 'https://doi.org/10.1007/978-3-032-08638-9_13'] },
    macrosignal: { tag: 'LLM features · In progress', title: 'MacroSignal',
      body: ['Can the news tell you which way markets will move? MacroSignal ingests geopolitical news, extracts entities and sentiment with LLaMA 3 through the Groq API and LangChain, and feeds those features to an XGBoost model that produces directional signals across 24 financial assets.', 'Everything is validated chronologically, so the model never sees the future. A FAISS index over 26,000 news passages handles retrieval, and prompt and retrieval tuning raised evidence-grounded answer accuracy from 72% to 86% on 180 annotated queries.'],
      stats: [['75–79%', 'directional accuracy'], ['24', 'assets'], ['72→86%', 'grounded answers']],
      stack: ['Python', 'LangChain', 'LLaMA 3', 'Groq', 'FAISS', 'XGBoost', 'FastAPI', 'Docker'] },
    toxic: { tag: 'NLP · 3rd place, HackMIT at MIT-WPU', title: 'Toxic Comment Detection',
      body: ['Built in 48 hours at HackMIT, where it took third place. I later rebuilt it as a proper multi-label classifier over 35,000 annotated comments across six categories, with stratified splits and checks on how rare labels were distributed.', 'A compact RoBERTa, fine-tuned with class-weighted loss and calibrated thresholds, beat a TF-IDF and logistic-regression baseline on held-out data.'],
      stats: [['0.82', 'macro-F1'], ['0.74', 'baseline'], ['35k', 'comments']],
      stack: ['PyTorch', 'Hugging Face', 'RoBERTa', 'scikit-learn'] },
    arima: { tag: 'Forecasting · UCD Mathematical Modelling · 2026', title: 'ARIMA × XGBoost',
      body: ['A two-stage forecaster. ARIMA captures the linear structure of the series, then XGBoost learns the non-linear leftovers from lagged returns and volatility features.', 'Rolling-origin validation over eight years of data, with transformations fitted only on training windows, compared it against naive persistence and plain ARIMA. Presented as a co-authored research poster.'],
      stats: [['0.84', 'MASE, hybrid'], ['0.96', 'MASE, ARIMA alone'], ['8 yrs', 'of data']],
      stack: ['Python', 'statsmodels', 'XGBoost', 'pandas'] },
    syncsphere: { tag: 'Real-time · Published in IJIRCCE, 2024', title: 'SyncSphere',
      body: ['A secure real-time communication platform: encrypted chat with authentication and live translation, built on Flask-SocketIO.', 'I built the WebRTC video calling component, and we tested the platform with more than 25 concurrent users. The work was published in IJIRCCE, vol. 12, issue 4.'],
      stats: [['25+', 'concurrent users'], ['E2E', 'encrypted chat']],
      stack: ['Flask-SocketIO', 'WebRTC', 'WebSockets', 'JavaScript'] },
    esg: { tag: 'Econometrics · UCD · 2026', title: 'Green Bonds & ESG',
      body: ['Companies issue green bonds to signal they are serious about sustainability. This study asks whether issuing them actually improves ESG performance afterwards.', 'It uses firm-level panel data and OLS with fixed effects to separate the effect of issuing from the differences that already exist between firms.'],
      stats: [['Panel', 'data'], ['FE', 'OLS with fixed effects']],
      stack: ['Python', 'pandas', 'statsmodels'] },
    plates: { tag: 'Computer vision · AWS', title: 'Number Plate Recognition',
      body: ['Indian traffic is crowded, plates come in mixed fonts, and they are often dirty or partly hidden. This OpenCV pipeline finds plates in busy street scenes and reads them.', 'Text extraction runs on AWS (EC2, S3, IAM), and the results are stored in MongoDB.'],
      stats: [['OpenCV', 'detection'], ['AWS', 'extraction']],
      stack: ['OpenCV', 'Python', 'AWS EC2', 'S3', 'IAM', 'MongoDB'] }
  };
  const dlg = $('#detail'), dc = $('#detail-content');
  const openProject = key => {
    const p = P[key]; if (!p) return;
    const src = imgFor[key];
    const isPhoto = src && src.includes('unsplash');
    dc.innerHTML = `<div class="d-img"><img src="${src}" alt=""></div><div class="d-body">
      <p class="mono kicker">${p.tag}</p><h3>${p.title}</h3>
      ${p.body.map(b => `<p>${b}</p>`).join('')}
      <div class="d-stats">${p.stats.map(([b, s]) => `<span><b>${b}</b>${s}</span>`).join('')}</div>
      <div class="d-stack">${p.stack.map(s => `<span>${s}</span>`).join('')}</div>
      <div class="d-links">${REPOS[key] ? `<a class="btn btn-fill" href="${REPOS[key]}" target="_blank" rel="noopener"><span>View code on GitHub ↗</span></a>` : ''}${p.link ? `<a class="btn btn-line" href="${p.link[1]}" target="_blank" rel="noopener"><span>${p.link[0]} ↗</span></a>` : ''}</div>
      </div>`;
    $('.d-img img', dc).onerror = function () { this.onerror = null; this.src = `assets/projects/${key}.jpg`; };
    dlg.showModal();
    if (hasGsap) gsap.from($('.d-img img', dc), { scale: 1.25, duration: 1.4, ease: 'expo.out' });
  };
  $$('.work').forEach(w => {
    w.addEventListener('click', () => openProject(w.dataset.project));
    w.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openProject(w.dataset.project); } });
  });
  $('.detail-close').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });

  /* ---------- copy email ---------- */
  const toast = $('#toast');
  const say = msg => { toast.textContent = msg; toast.classList.add('show'); clearTimeout(say.t); say.t = setTimeout(() => toast.classList.remove('show'), 1800); };
  const copyMail = () => navigator.clipboard ? navigator.clipboard.writeText('soham.barve05@gmail.com').then(() => say('Email copied'), () => say('soham.barve05@gmail.com')) : say('soham.barve05@gmail.com');
  $('#copy-mail').addEventListener('click', copyMail);

  /* ---------- contact form (FormSubmit delivers it to Soham's inbox) ---------- */
  const form = $('#cform'), fstat = $('#cform-status');
  if (form) form.addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(form);
    if (fd.get('_honey')) return;
    const name = (fd.get('name') || '').trim(), email = (fd.get('email') || '').trim(), message = (fd.get('message') || '').trim();
    fstat.className = 'mono cform-status';
    if (!name || !message || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { fstat.textContent = 'Please add your name, a valid email and a message.'; fstat.classList.add('err'); return; }
    const btn = $('button[type=submit]', form); btn.disabled = true; fstat.textContent = 'Sending…';
    try {
      const r = await fetch('https://formsubmit.co/ajax/soham.barve05@gmail.com', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ name, email, message, _subject: 'New message from your portfolio', _template: 'table', _captcha: 'false' })
      });
      if (!r.ok) throw new Error(r.status);
      form.reset(); fstat.textContent = 'Thanks, your message is on its way. I will reply soon.'; fstat.classList.add('ok');
    } catch (err) {
      fstat.innerHTML = 'That did not send. Please email <a href="mailto:soham.barve05@gmail.com">soham.barve05@gmail.com</a> instead.'; fstat.classList.add('err');
    } finally { btn.disabled = false; }
  });

})();
