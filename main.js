(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* ---------- clock ---------- */
  const clock = $('#clock');
  const tick = () => clock.textContent = '· ' + new Intl.DateTimeFormat('en-IE', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Dublin' }).format(new Date());
  tick(); setInterval(tick, 20000);

  /* ---------- headline: noisy characters settle into text ---------- */
  const glyphs = '#%&@$*+=?/<>01';
  $$('.scramble').forEach(el => {
    const text = el.dataset.text;
    if (reduce) return;
    let frame = 0;
    const order = [...text].map((_, i) => 8 + i * 2 + Math.random() * 10);
    const run = () => {
      let out = '';
      let done = true;
      [...text].forEach((ch, i) => {
        if (frame >= order[i] || ch === ' ') out += ch;
        else { done = false; out += `<span class="g">${glyphs[(Math.random() * glyphs.length) | 0]}</span>`; }
      });
      el.innerHTML = out;
      frame++;
      if (!done) requestAnimationFrame(run);
    };
    run();
    el.parentElement.addEventListener('mouseenter', () => { frame = 0; order.forEach((_, i) => order[i] = 4 + i + Math.random() * 8); run(); });
  });

  /* ---------- custom cursor ---------- */
  const cur = $('.cursor');
  if (matchMedia('(hover: hover)').matches && !reduce) {
    let x = 0, y = 0, cx = 0, cy = 0;
    addEventListener('pointermove', e => { x = e.clientX; y = e.clientY; cur.classList.add('on'); });
    document.addEventListener('pointerleave', () => cur.classList.remove('on'));
    const loop = () => { cx += (x - cx) * .22; cy += (y - cy) * .22; cur.style.transform = `translate(${cx}px, ${cy}px)`; requestAnimationFrame(loop); };
    loop();
    $$('a, button, .card').forEach(el => {
      el.addEventListener('mouseenter', () => cur.classList.add('big'));
      el.addEventListener('mouseleave', () => cur.classList.remove('big'));
    });
  }

  /* ---------- reveal + counters ---------- */
  $$('.sec-head, .num, .card, .timeline li, .about-grid > *, .contact > *').forEach(el => el.classList.add('rv'));
  const counters = new WeakSet();
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    $$('[data-count]', e.target).forEach(n => {
      if (counters.has(n)) return; counters.add(n);
      const end = +n.dataset.count, t0 = performance.now(), dur = reduce ? 0 : 1400;
      const step = now => {
        const p = dur ? Math.min(1, (now - t0) / dur) : 1;
        n.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
    io.unobserve(e.target);
  }), { rootMargin: '0px 0px -10% 0px' });
  $$('.rv').forEach((el, i) => { el.style.transitionDelay = (el.classList.contains('card') || el.classList.contains('num')) ? `${(i % 3) * 80}ms` : '0ms'; io.observe(el); });

  /* ---------- active nav link ---------- */
  const links = $$('.bar-nav a');
  const secIO = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  $$('section[id]').forEach(s => secIO.observe(s));

  /* ---------- canvas helpers ---------- */
  const fit = cv => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = cv.clientWidth, h = cv.clientHeight;
    if (cv.width !== w * dpr || cv.height !== h * dpr) { cv.width = w * dpr; cv.height = h * dpr; }
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return [ctx, w, h];
  };
  const colorOf = el => getComputedStyle(el).getPropertyValue('--c').trim() || '#c8f169';
  const varColor = v => getComputedStyle(document.documentElement).getPropertyValue(v.replace(/var\(|\)/g, '')).trim();
  const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
  const rand = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(42);

  /* ---------- ASCII portrait ---------- */
  const portrait = $('#portrait'), pimg = $('#portrait-img'), acv = $('#ascii');
  const ramp = ' .`:-=+*cox#%&@';
  let lens = { x: -999, y: -999, r: 0, tr: 0 };
  let sample = null;
  const buildSample = () => {
    const [, w, h] = fit(acv);
    const cell = w < 360 ? 7 : 9;
    const cols = Math.floor(w / cell), rows = Math.floor(h / (cell * 1.15));
    const off = document.createElement('canvas'); off.width = cols; off.height = rows;
    const o = off.getContext('2d');
    // object-fit: cover crop
    const ir = pimg.naturalWidth / pimg.naturalHeight, cr = cols / (rows * 1.15);
    let sw = pimg.naturalWidth, sh = pimg.naturalHeight, sx = 0, sy = 0;
    if (ir > cr) { sw = sh * cr; sx = (pimg.naturalWidth - sw) / 2; } else { sh = sw / cr; sy = (pimg.naturalHeight - sh) / 2; }
    o.drawImage(pimg, sx, sy, sw, sh, 0, 0, cols, rows);
    try { sample = { data: o.getImageData(0, 0, cols, rows).data, cols, rows, cell, w, h }; }
    catch { document.body.classList.add('no-ascii'); sample = null; }
  };
  const drawAscii = t => {
    if (!sample) return;
    const [ctx, w, h] = fit(acv);
    const { data, cols, rows, cell } = sample;
    const ch = h / rows;
    ctx.clearRect(0, 0, w, h);
    ctx.font = `${cell + 1}px "Geist Mono", monospace`;
    ctx.textBaseline = 'top';
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      let lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      const px = x * (w / cols), py = y * ch;
      const d = Math.hypot(px - lens.x, py - lens.y);
      if (d < lens.r) continue; // the real photo shows through here
      // shimmer: a slow wave of noise moving down the image
      const k = Math.min(ramp.length - 1, Math.floor(lum * ramp.length));
      const ring = false;
      ctx.fillStyle = ring ? '#c8f169' : `rgba(${r * 1.15 | 0},${g * 1.15 | 0},${b * 1.25 | 0},${.35 + lum * .65})`;
      ctx.fillText(ramp[k], px, py);
    }
  };
  const startPortrait = () => {
    try {
      buildSample();
      if (!sample) return;
      drawAscii(0);
      let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { buildSample(); drawAscii(0); }, 150); });
      // touch screens: tap to switch between the pattern and the photo
      portrait.addEventListener('click', () => portrait.classList.toggle('reveal'));
    } catch (e) { document.body.classList.add('no-ascii'); }
  };
  if (pimg.complete && pimg.naturalWidth) startPortrait(); else pimg.addEventListener('load', startPortrait);

  /* ---------- project visuals ---------- */
  const VIZ = {
    vectors(ctx, w, h, t, c, st) { // embedding space, a query finds its nearest neighbours
      if (!st.pts) { st.pts = Array.from({ length: 140 }, () => ({ x: rand(), y: rand() * .7, z: rand() })); }
      const qx = .5 + Math.cos(t * .4) * .3, qy = .32 + Math.sin(t * .55) * .18;
      const ds = st.pts.map((p, i) => [Math.hypot(p.x - qx, (p.y - qy) * 1.4), i]).sort((a, b) => a[0] - b[0]);
      const near = new Set(ds.slice(0, 6).map(d => d[1]));
      ctx.lineWidth = 1;
      ds.slice(0, 6).forEach(([, i]) => { const p = st.pts[i]; ctx.strokeStyle = rgba(c, .5); ctx.beginPath(); ctx.moveTo(qx * w, qy * h); ctx.lineTo(p.x * w, p.y * h); ctx.stroke(); });
      st.pts.forEach((p, i) => { ctx.fillStyle = near.has(i) ? c : `rgba(239,237,232,${.12 + p.z * .25})`; ctx.beginPath(); ctx.arc(p.x * w, p.y * h, near.has(i) ? 3.2 : 1.6 + p.z, 0, 7); ctx.fill(); });
      ctx.strokeStyle = c; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(qx * w, qy * h, 7 + Math.sin(t * 4) * 1.5, 0, 7); ctx.stroke();
      ctx.fillStyle = c; ctx.font = '11px "Geist Mono"'; ctx.fillText('query → top-k', qx * w + 12, qy * h - 10);
    },
    signal(ctx, w, h, t, c, st) { // price path with model signals
      if (!st.s) { st.s = []; let v = .5; for (let i = 0; i < 400; i++) { v += (rand() - .5) * .05; v = Math.max(.15, Math.min(.6, v)); st.s.push(v); } }
      const n = 90, off = Math.floor(t * 8) % (st.s.length - n);
      ctx.strokeStyle = 'rgba(239,237,232,.07)';
      for (let y = 0; y < 6; y++) { ctx.beginPath(); ctx.moveTo(0, h * .08 + y * h * .09); ctx.lineTo(w, h * .08 + y * h * .09); ctx.stroke(); }
      ctx.strokeStyle = c; ctx.lineWidth = 1.6; ctx.beginPath();
      for (let i = 0; i < n; i++) { const x = i / (n - 1) * w, y = st.s[off + i] * h; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke();
      for (let i = 6; i < n - 1; i += 9) {
        const up = st.s[off + i + 1] < st.s[off + i];
        const x = i / (n - 1) * w, y = st.s[off + i] * h;
        ctx.fillStyle = up ? '#c8f169' : '#ff8a65';
        ctx.beginPath(); ctx.moveTo(x, y + (up ? -10 : 10)); ctx.lineTo(x - 4, y + (up ? -3 : 3)); ctx.lineTo(x + 4, y + (up ? -3 : 3)); ctx.fill();
      }
      ctx.font = '11px "Geist Mono"'; ctx.fillStyle = 'rgba(239,237,232,.5)';
      ['BRENT', 'GOLD', 'EUR/USD', 'S&P'].forEach((s, i) => ctx.fillText(s, 16, h * .1 + i * 16));
    },
    bars(ctx, w, h, t, c) { // six toxicity labels
      const labels = ['toxic', 'severe', 'obscene', 'threat', 'insult', 'identity'];
      const bw = w * .72, x0 = w * .2;
      ctx.font = '11px "Geist Mono"';
      labels.forEach((l, i) => {
        const y = h * .1 + i * h * .085;
        const v = .35 + .5 * (Math.sin(t * 1.1 + i * 1.7) * .5 + .5);
        ctx.fillStyle = 'rgba(239,237,232,.45)'; ctx.fillText(l, 16, y);
        ctx.fillStyle = 'rgba(239,237,232,.07)'; ctx.fillRect(x0, y, bw, 8);
        ctx.fillStyle = v > .7 ? c : rgba(c, .45); ctx.fillRect(x0, y, bw * v, 8);
      });
    },
    forecast(ctx, w, h, t, c, st) { // history, then a forecast with an uncertainty band
      if (!st.s) { st.s = []; let v = .35; for (let i = 0; i < 60; i++) { v += Math.sin(i * .3) * .012 + (rand() - .5) * .03; st.s.push(v); } }
      const split = 40, px = i => i / 59 * w, py = v => h * .12 + v * h * .5;
      const reveal = (t * 10) % 80;
      ctx.fillStyle = rgba(c, .14); ctx.beginPath();
      for (let i = split; i < 60; i++) ctx.lineTo(px(i), py(st.s[i]) - (i - split) * 1.6);
      for (let i = 59; i >= split; i--) ctx.lineTo(px(i), py(st.s[i]) + (i - split) * 1.6);
      ctx.fill();
      ctx.lineWidth = 1.6; ctx.strokeStyle = 'rgba(239,237,232,.7)'; ctx.beginPath();
      for (let i = 0; i <= split; i++) i ? ctx.lineTo(px(i), py(st.s[i])) : ctx.moveTo(px(i), py(st.s[i])); ctx.stroke();
      ctx.strokeStyle = c; ctx.setLineDash([4, 4]); ctx.beginPath();
      for (let i = split; i < Math.min(60, split + reveal); i++) ctx.lineTo(px(i), py(st.s[i])); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(239,237,232,.15)'; ctx.beginPath(); ctx.moveTo(px(split), 10); ctx.lineTo(px(split), h * .7); ctx.stroke();
      ctx.fillStyle = 'rgba(239,237,232,.5)'; ctx.font = '11px "Geist Mono"'; ctx.fillText('forecast →', px(split) + 6, 22);
    },
    network(ctx, w, h, t, c, st) { // users connected, messages travelling
      if (!st.n) st.n = Array.from({ length: 9 }, (_, i) => ({ a: i / 9 * Math.PI * 2, r: .2 + rand() * .08 }));
      const cx = w / 2, cy = h * .3;
      const P = st.n.map(n => [cx + Math.cos(n.a + t * .1) * n.r * w, cy + Math.sin(n.a + t * .1) * n.r * h * .75]);
      ctx.lineWidth = 1;
      P.forEach((p, i) => P.forEach((q, j) => { if (j > i && (i + j) % 3 === 0) { ctx.strokeStyle = 'rgba(239,237,232,.1)'; ctx.beginPath(); ctx.moveTo(...p); ctx.lineTo(...q); ctx.stroke();
        const k = (t * .5 + i * .13 + j * .07) % 1; ctx.fillStyle = c; ctx.beginPath(); ctx.arc(p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k, 2.2, 0, 7); ctx.fill(); } }));
      P.forEach(p => { ctx.fillStyle = '#141419'; ctx.strokeStyle = c; ctx.beginPath(); ctx.arc(...p, 6, 0, 7); ctx.fill(); ctx.stroke(); });
    },
    scatter(ctx, w, h, t, c, st) { // firms, with a fitted line
      if (!st.p) st.p = Array.from({ length: 70 }, () => { const x = rand(); return { x, y: .55 - x * .25 + (rand() - .5) * .25, g: rand() < .35 }; });
      const sx = x => 20 + x * (w - 40), sy = y => h * .05 + y * h * .6;
      st.p.forEach((p, i) => { const j = Math.sin(t + i) * 1.2; ctx.fillStyle = p.g ? c : 'rgba(239,237,232,.3)'; ctx.beginPath(); ctx.arc(sx(p.x) + j, sy(p.y), p.g ? 3.4 : 2.4, 0, 7); ctx.fill(); });
      const k = Math.min(1, (t % 6) / 2);
      ctx.strokeStyle = 'rgba(239,237,232,.8)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(sx(0), sy(.55)); ctx.lineTo(sx(k), sy(.55 - k * .25)); ctx.stroke();
      ctx.font = '11px "Geist Mono"'; ctx.fillStyle = c; ctx.fillText('● green bond issuers', 20, 20);
    },
    scan(ctx, w, h, t, c, st) { // a busy road scene, a box locks on a plate and reads it
      if (!st.b) st.b = Array.from({ length: 26 }, () => ({ x: rand(), y: rand() * .55, w: .05 + rand() * .12, h: .06 + rand() * .12 }));
      st.b.forEach((b, i) => { ctx.strokeStyle = 'rgba(239,237,232,.09)'; ctx.strokeRect(((b.x + t * .01 * (i % 3 + 1)) % 1.1) * w - 30, b.y * h, b.w * w, b.h * h); });
      const plate = 'MH 12 AB 1234';
      const phase = (t * .35) % 1;
      const bx = w * .5 - 90, by = h * .2, bw = 180, bh = 44;
      const s = 1 + (1 - Math.min(1, phase * 3)) * .6;
      ctx.strokeStyle = c; ctx.lineWidth = 1.5;
      const cw = bw * s, chh = bh * s, x0 = bx + (bw - cw) / 2, y0 = by + (bh - chh) / 2, L = 14;
      [[x0, y0, 1, 1], [x0 + cw, y0, -1, 1], [x0, y0 + chh, 1, -1], [x0 + cw, y0 + chh, -1, -1]].forEach(([x, y, dx, dy]) => { ctx.beginPath(); ctx.moveTo(x + dx * L, y); ctx.lineTo(x, y); ctx.lineTo(x, y + dy * L); ctx.stroke(); });
      const shown = Math.floor(Math.max(0, phase - .3) / .5 * plate.length);
      ctx.font = '500 20px "Geist Mono"'; ctx.textAlign = 'center';
      ctx.fillStyle = '#efede8';
      ctx.fillText([...plate].map((ch, i) => i < shown || ch === ' ' ? ch : '#%@&*'[(Math.random() * 5) | 0]).join(''), bx + bw / 2, by + 29);
      ctx.textAlign = 'left'; ctx.font = '11px "Geist Mono"'; ctx.fillStyle = c;
      ctx.fillText(`conf ${(0.62 + Math.min(1, phase * 1.4) * .35).toFixed(2)}`, bx, by + bh + 18);
    }
  };

  const vizList = [];
  const startViz = (cv, kind, colorEl) => {
    const item = { cv, kind, st: {}, c: colorOf(colorEl), on: false };
    vizList.push(item);
    new IntersectionObserver(([e]) => item.on = e.isIntersecting).observe(cv);
    return item;
  };

  /* ---------- photo fallback: if a photo can't load, show the drawn cover ---------- */
  $$('img[data-fallback]').forEach(img => {
    const swap = () => { if (img.src.indexOf(img.dataset.fallback) === -1) img.src = img.dataset.fallback; };
    img.addEventListener('error', swap);
    if (img.complete && img.naturalWidth === 0) swap();
  });
  const CREDIT = {medifolio: ['Vitaly Gariev', 'https://unsplash.com/photos/doctor-writing-on-a-patients-chart-8WYkI3cEZm8'], macrosignal: ['Nicholas Cappello', 'https://unsplash.com/photos/close-up-photo-of-monitor-displaying-graph-Wb63zqJ5gnE'], toxic: ['Shutter Speed', 'https://unsplash.com/photos/a-close-up-of-a-cell-phone-with-social-media-icons-on-it-a_lBsEZZjWc'], arima: ['Maxim Hopman', 'https://unsplash.com/photos/stock-market-candlestick-chart-on-dark-screen-fiXLQXAhCfk'], syncsphere: ['Chris Montgomery', 'https://unsplash.com/photos/macbook-pro-displaying-group-of-people-smgTvepind4'], esg: ['Zetong Li', 'https://unsplash.com/photos/livermore-wind-turbines-on-misty-green-hills-4iNQdT4mDLc'], plates: ['Atharva Tulsi', 'https://unsplash.com/photos/black-and-yellow-auto-rickshaw-on-road-poiZagysHEY']};
  const REPOS = {medifolio: 'https://github.com/sohambarve03/medifolio-llm-medical-system', macrosignal: 'https://github.com/sohambarve03/Macrosignal', toxic: 'https://github.com/sohambarve03/toxic-comment-detector'};

  /* ---------- project details ---------- */
  const P = {
    medifolio: { tag: 'RAG · OCR · 2025 · First author, Springer CCIS', title: 'Medifolio', viz: 'vectors',
      body: ['Doctors still write prescriptions by hand, so patient histories end up as piles of paper nobody can search. Medifolio turns them into structured, searchable records.', 'I built the OCR pipeline on AWS Textract and the retrieval layer on PostgreSQL with pgvector and Pinecone. On top of that sits a fine-tuned LLaMA chatbot that books appointments. The work was published in Springer CCIS (ICICCT 2025), with me as first author.'],
      stats: [['~95%', 'retrieval accuracy'], ['88–90%', 'chatbot accuracy'], ['1st', 'author, Springer']],
      stack: ['Flask', 'React', 'PostgreSQL', 'pgvector', 'Pinecone', 'MongoDB', 'AWS Textract', 'LLaMA'],
      link: ['Read the paper', 'https://doi.org/10.1007/978-3-032-08638-9_13'] },
    macrosignal: { tag: 'LLM features · In progress', title: 'MacroSignal', viz: 'signal',
      body: ['Can the news tell you which way markets will move? MacroSignal ingests geopolitical news, extracts entities and sentiment with LLaMA 3 through the Groq API and LangChain, and feeds those features to an XGBoost model that produces directional signals across 24 financial assets.', 'Everything is validated chronologically, so the model never sees the future. A FAISS index over 26,000 news passages handles retrieval, and prompt and retrieval tuning raised evidence-grounded answer accuracy from 72% to 86% on 180 annotated queries.'],
      stats: [['75–79%', 'directional accuracy'], ['24', 'assets'], ['72→86%', 'grounded answers']],
      stack: ['Python', 'LangChain', 'LLaMA 3', 'Groq', 'FAISS', 'XGBoost', 'FastAPI', 'Docker'] },
    toxic: { tag: 'NLP · 3rd place, HackMIT at MIT-WPU', title: 'Toxic Comment Detection', viz: 'bars',
      body: ['Built in 48 hours at HackMIT, where it took third place. I later rebuilt it as a proper multi-label classifier over 35,000 annotated comments across six categories, with stratified splits and checks on how rare labels were distributed.', 'A compact RoBERTa, fine-tuned with class-weighted loss and calibrated thresholds, beat a TF-IDF and logistic-regression baseline on held-out data.'],
      stats: [['0.82', 'macro-F1'], ['0.74', 'baseline'], ['35k', 'comments']],
      stack: ['PyTorch', 'Hugging Face', 'RoBERTa', 'scikit-learn'] },
    arima: { tag: 'Forecasting · UCD Mathematical Modelling · 2026', title: 'ARIMA × XGBoost', viz: 'forecast',
      body: ['A two-stage forecaster. ARIMA captures the linear structure of the series, then XGBoost learns the non-linear leftovers from lagged returns and volatility features.', 'Rolling-origin validation over eight years of data, with transformations fitted only on training windows, compared it against naive persistence and plain ARIMA. Presented as a co-authored research poster.'],
      stats: [['0.84', 'MASE, hybrid'], ['0.96', 'MASE, ARIMA alone'], ['8 yrs', 'of data']],
      stack: ['Python', 'statsmodels', 'XGBoost', 'pandas'] },
    syncsphere: { tag: 'Real-time · Published in IJIRCCE, 2024', title: 'SyncSphere', viz: 'network',
      body: ['A secure real-time communication platform: encrypted chat with authentication and live translation, built on Flask-SocketIO.', 'I built the WebRTC video calling component, and we tested the platform with more than 25 concurrent users. The work was published in IJIRCCE, vol. 12, issue 4.'],
      stats: [['25+', 'concurrent users'], ['E2E', 'encrypted chat']],
      stack: ['Flask-SocketIO', 'WebRTC', 'WebSockets', 'JavaScript'] },
    esg: { tag: 'Econometrics · UCD · 2026', title: 'Green Bonds & ESG', viz: 'scatter',
      body: ['Companies issue green bonds to signal they are serious about sustainability. This study asks whether issuing them actually improves ESG performance afterwards.', 'It uses firm-level panel data and OLS with fixed effects to separate the effect of issuing from the differences that already exist between firms.'],
      stats: [['Panel', 'data'], ['FE', 'OLS with fixed effects']],
      stack: ['Python', 'pandas', 'statsmodels'] },
    plates: { tag: 'Computer vision · AWS', title: 'Number Plate Recognition', viz: 'scan',
      body: ['Indian traffic is crowded, plates come in mixed fonts, and they are often dirty or partly hidden. This OpenCV pipeline finds plates in busy street scenes and reads them.', 'Text extraction runs on AWS (EC2, S3, IAM), and the results are stored in MongoDB.'],
      stats: [['OpenCV', 'detection'], ['AWS', 'extraction']],
      stack: ['OpenCV', 'Python', 'AWS EC2', 'S3', 'IAM', 'MongoDB'] }
  };
  const dlg = $('#detail'), dc = $('#detail-content');
  let dViz = null;
  const openProject = key => {
    const p = P[key]; if (!p) return;
    const card = $(`.card[data-project="${key}"]`);
    dc.style.setProperty('--c', colorOf(card));
    const cardImg = $('img', card);
    dc.innerHTML = `<div class="d-viz"><img src="${cardImg.currentSrc || cardImg.src}" alt=""></div><div class="d-body">
      <p class="mono tag">${p.tag}</p><h3>${p.title}</h3>
      ${p.body.map(b => `<p>${b}</p>`).join('')}
      <div class="d-stats">${p.stats.map(([b, s]) => `<span><b>${b}</b>${s}</span>`).join('')}</div>
      <div class="d-stack">${p.stack.map(s => `<span>${s}</span>`).join('')}</div>
      <div class="d-links">${REPOS[key] ? `<a class="d-link" href="${REPOS[key]}" target="_blank" rel="noopener">View code on GitHub ↗</a>` : ''}${p.link ? `<a class="d-link" href="${p.link[1]}" target="_blank" rel="noopener">${p.link[0]} ↗</a>` : ''}</div>
      ${(cardImg.currentSrc || cardImg.src).includes('unsplash') ? `<p class="mono credit">Photo: <a href="${CREDIT[key][1]}" target="_blank" rel="noopener">${CREDIT[key][0]}</a> on Unsplash</p>` : ''}</div>`;
    dlg.showModal();
    history.replaceState(null, '', '#' + key);
  };
  $$('.repo').forEach(el => el.addEventListener('click', e => { e.stopPropagation(); open(el.dataset.href, '_blank', 'noopener'); }));
  $$('.card').forEach(c => c.addEventListener('click', () => openProject(c.dataset.project)));
  const closeDetail = () => { dlg.close(); };
  $('.detail-close').addEventListener('click', closeDetail);
  dlg.addEventListener('click', e => { if (e.target === dlg) closeDetail(); });
  dlg.addEventListener('close', () => history.replaceState(null, '', location.pathname));
  if (P[location.hash.slice(1)]) setTimeout(() => openProject(location.hash.slice(1)), 400);

  /* ---------- copy email ---------- */
  const toast = $('#toast');
  const say = msg => { toast.textContent = msg; toast.classList.add('show'); clearTimeout(say.t); say.t = setTimeout(() => toast.classList.remove('show'), 1800); };
  const copyMail = () => navigator.clipboard?.writeText('soham.barve05@gmail.com').then(() => say('Email copied'), () => say('soham.barve05@gmail.com'));
  $('#copy-mail').addEventListener('click', copyMail);

  /* ---------- quick menu ---------- */
  const pal = $('#palette'), pin = $('#palette-input'), plist = $('#palette-list');
  const items = [
    ['Work', 'section', () => location.hash = '#work'],
    ['Path / experience', 'section', () => location.hash = '#path'],
    ['About', 'section', () => location.hash = '#about'],
    ['Contact', 'section', () => location.hash = '#contact'],
    ...Object.entries(P).map(([k, p]) => [p.title, 'project', () => openProject(k)]),
    ['Copy email address', 'action', copyMail],
    ['Send an email', 'link', () => location.href = 'mailto:soham.barve05@gmail.com'],
    ['LinkedIn', 'link', () => open('https://www.linkedin.com/in/sohambarve')],
    ['GitHub', 'link', () => open('https://github.com/sohambarve03')],
    ['Medifolio paper (Springer)', 'link', () => open('https://doi.org/10.1007/978-3-032-08638-9_13')]
  ];
  let sel = 0, shown = items;
  const render = () => {
    const q = pin.value.toLowerCase().trim();
    shown = items.filter(i => i[0].toLowerCase().includes(q) || i[1].includes(q));
    sel = Math.min(sel, Math.max(0, shown.length - 1));
    plist.innerHTML = shown.map((it, i) => `<li class="${i === sel ? 'sel' : ''}" data-i="${i}"><span>${it[0]}</span><span class="k">${it[1]}</span></li>`).join('') || '<li><span class="dim">Nothing found</span></li>';
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
