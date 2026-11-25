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
    try { localStorage.setItem('theme', next); } catch (e) {}
    $('meta[name="theme-color"]').setAttribute('content', next === 'dark' ? '#121110' : '#f3efe7');
    drawAscii();
  });

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

  /* ---------- marquee: drifts on its own, speeds up and flips with scroll ---------- */
  const track = $('.marquee-track');
  if (hasGsap) {
    let x = 0, dir = 1, boost = 0, half = 0;
    const measure = () => half = track.scrollWidth / 2;
    measure(); addEventListener('resize', measure);
    ScrollTrigger.create({ onUpdate: s => { dir = s.direction; boost = Math.min(Math.abs(s.getVelocity()) / 120, 18); } });
    gsap.ticker.add(() => {
      x -= (0.6 + boost) * dir;
      boost *= .92;
      if (x <= -half) x += half; if (x > 0) x -= half;
      track.style.transform = `translate3d(${x}px,0,0)`;
    });
  }

  /* ---------- scroll animations ---------- */
  if (hasGsap) {
    $$('.sec-title .word, .contact-title .word').forEach(w => gsap.from(w, { yPercent: 115, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: w.closest('h2'), start: 'top 85%' } }));
    gsap.utils.toArray('.kicker').forEach(k => gsap.from(k, { opacity: 0, x: -20, duration: .9, ease: 'expo.out', scrollTrigger: { trigger: k, start: 'top 90%' } }));
    gsap.from('.num', { y: 40, opacity: 0, duration: 1, ease: 'expo.out', stagger: .08, scrollTrigger: { trigger: '.numbers', start: 'top 85%' } });
    $$('[data-count]').forEach(n => {
      const o = { v: 0 };
      gsap.to(o, { v: +n.dataset.count, duration: 1.8, ease: 'power3.out', scrollTrigger: { trigger: n, start: 'top 90%' }, onUpdate: () => n.textContent = Math.round(o.v) });
    });
    gsap.from('.work', { y: 50, opacity: 0, duration: 1, ease: 'expo.out', stagger: .07, scrollTrigger: { trigger: '.works', start: 'top 85%' } });
    gsap.to('.tl-fill', { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.timeline', start: 'top 60%', end: 'bottom 60%', scrub: true } });
    $$('.job').forEach(j => {
      gsap.from(j, { y: 40, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: j, start: 'top 88%' } });
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
    gsap.from('.about-grid > *, .socials li, .contact-row', { y: 40, opacity: 0, duration: 1, ease: 'expo.out', stagger: .1, scrollTrigger: { trigger: '.about-grid', start: 'top 85%' } });
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
    ctx.fillStyle = cs.getPropertyValue('--ink');
    ctx.font = `${cell + 1.5}px "JetBrains Mono", monospace`; ctx.textBaseline = 'top';
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

  /* ---------- floating preview that follows the cursor over the list ---------- */
  const pv = $('.preview'), pvi = $('.preview-inner');
  if (fine && hasGsap) {
    const px = gsap.quickTo(pv, 'x', { duration: .55, ease: 'power3' });
    const py = gsap.quickTo(pv, 'y', { duration: .55, ease: 'power3' });
    let lastX = 0;
    addEventListener('pointermove', e => {
      px(e.clientX); py(e.clientY);
      gsap.to(pv, { rotation: gsap.utils.clamp(-12, 12, (e.clientX - lastX) * .6), duration: .5, ease: 'power3' });
      lastX = e.clientX;
    });
    const works = $('.works');
    works.addEventListener('mouseenter', () => gsap.to(pv, { autoAlpha: 1, scale: 1, duration: .45, ease: 'expo.out' }));
    works.addEventListener('mouseleave', () => gsap.to(pv, { autoAlpha: 0, scale: .6, duration: .35, ease: 'expo.out' }));
    gsap.set(pv, { autoAlpha: 0, scale: .6 });
    $$('.work').forEach(w => w.addEventListener('mouseenter', () => {
      pvi.style.backgroundImage = `url("${imgFor[w.dataset.project]}")`;
      gsap.fromTo(pvi, { scale: 1.3 }, { scale: 1.1, duration: .8, ease: 'expo.out' });
    }));
  }

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
      ${isPhoto ? `<p class="mono credit">Photo: <a href="${CREDIT[key][1]}" target="_blank" rel="noopener">${CREDIT[key][0]}</a> / Unsplash</p>` : ''}</div>`;
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

  /* ---------- quick menu (⌘K or /) ---------- */
  const pal = $('#palette'), pin = $('#palette-input'), plist = $('#palette-list');
  const go = id => () => $(id).scrollIntoView({ behavior: 'smooth' });
  const items = [
    ['Work', 'section', go('#work')], ['Experience', 'section', go('#path')], ['About', 'section', go('#about')], ['Contact', 'section', go('#contact')],
    ...Object.entries(P).map(([k, p]) => [p.title, 'project', () => openProject(k)]),
    ['Copy email address', 'action', copyMail],
    ['Switch light / dark', 'action', () => $('#theme-btn').click()],
    ['Send an email', 'link', () => location.href = 'mailto:soham.barve05@gmail.com'],
    ['LinkedIn', 'link', () => open('https://www.linkedin.com/in/sohambarve')],
    ['GitHub', 'link', () => open('https://github.com/sohambarve03')]
  ];
  let sel = 0, shown = items;
  const render = () => {
    const q = pin.value.toLowerCase().trim();
    shown = items.filter(i => i[0].toLowerCase().includes(q) || i[1].includes(q));
    sel = Math.min(sel, Math.max(0, shown.length - 1));
    plist.innerHTML = shown.map((it, i) => `<li class="${i === sel ? 'sel' : ''}" data-i="${i}"><span>${it[0]}</span><span class="k">${it[1]}</span></li>`).join('') || '<li><span>Nothing found</span></li>';
  };
  const run = i => { const it = shown[i]; if (!it) return; pal.close(); it[2](); };
  const openPal = () => { if (dlg.open) dlg.close(); pin.value = ''; sel = 0; render(); pal.showModal(); pin.focus(); };
  $('#cmdk-open').addEventListener('click', openPal);
  pin.addEventListener('input', () => { sel = 0; render(); });
  pin.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { sel = (sel + 1) % shown.length; render(); e.preventDefault(); }
    if (e.key === 'ArrowUp') { sel = (sel - 1 + shown.length) % shown.length; render(); e.preventDefault(); }
    if (e.key === 'Enter') run(sel);
  });
  plist.addEventListener('click', e => { const li = e.target.closest('li[data-i]'); if (li) run(+li.dataset.i); });
  pal.addEventListener('click', e => { if (e.target === pal) pal.close(); });
  addEventListener('keydown', e => {
    if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !/input|textarea/i.test(document.activeElement.tagName))) { e.preventDefault(); openPal(); }
  });
})();
