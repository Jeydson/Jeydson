const els = {
  domain: document.getElementById('domainSelect'), mode: document.getElementById('modeSelect'), preset: document.getElementById('presetSelect'),
  params: document.getElementById('paramContainer'), x0: document.getElementById('x0'), v0: document.getElementById('v0'),
  amp: document.getElementById('amp'), omega: document.getElementById('omega'), dt: document.getElementById('dt'),
  play: document.getElementById('playBtn'), pause: document.getElementById('pauseBtn'), reset: document.getElementById('resetBtn'),
  theme: document.getElementById('themeBtn'), theory: document.getElementById('theoryText'),
  sim: document.getElementById('simCanvas'), time: document.getElementById('timeCanvas'), phase: document.getElementById('phaseCanvas'), frf: document.getElementById('frfCanvas')
};

const presets = {
  mechanical: [
    { name: 'Subamortecido', m: 1, c: 0.5, k: 20 },
    { name: 'Crítico', m: 1, c: 8.94, k: 20 },
    { name: 'Ressonância (leve damping)', m: 1, c: 0.2, k: 25 }
  ],
  electrical: [
    { name: 'RLC subamortecido', L: 1, R: 0.8, invC: 9 },
    { name: 'RLC crítico', L: 1, R: 6, invC: 9 },
    { name: 'RLC quase ideal', L: 1, R: 0.2, invC: 16 }
  ],
  thermal: [
    { name: 'Térmico lento', m: 5, c: 1.2, k: 0.8 },
    { name: 'Térmico médio', m: 3, c: 1.5, k: 1.3 },
    { name: 'Térmico rápido', m: 1.5, c: 2.2, k: 2.6 }
  ]
};

let model = { m: 1, c: 0.5, k: 20 };
let st = { t: 0, x: 0.1, v: 0, running: false, hist: [] };

const labels = {
  mechanical: ['Massa m', 'Amortecimento c', 'Rigidez k'],
  electrical: ['Indutância L', 'Resistência R', '1/C'],
  thermal: ['Capacitância térmica Cₜ', 'Condutância G', 'Rigidez térmica K']
};

function syncDomainPreset() {
  const d = els.domain.value;
  els.preset.innerHTML = presets[d].map((p, i) => `<option value="${i}">${p.name}</option>`).join('');
  applyPreset();
}

function applyPreset() {
  model = { ...presets[els.domain.value][+els.preset.value || 0] };
  renderParams();
  reset();
}

function forcing(t) {
  const A = +els.amp.value || 0, w = +els.omega.value || 0;
  if (els.mode.value === 'forced') return A * Math.cos(w * t);
  if (els.mode.value === 'step') return A;
  return 0;
}

function dyn(x, v, u) {
  return { dx: v, dv: (u - model.c * v - model.k * x) / model.m };
}

function rk4(dt, u) {
  const s1 = dyn(st.x, st.v, u);
  const s2 = dyn(st.x + 0.5 * dt * s1.dx, st.v + 0.5 * dt * s1.dv, u);
  const s3 = dyn(st.x + 0.5 * dt * s2.dx, st.v + 0.5 * dt * s2.dv, u);
  const s4 = dyn(st.x + dt * s3.dx, st.v + dt * s3.dv, u);
  st.x += dt / 6 * (s1.dx + 2 * s2.dx + 2 * s3.dx + s4.dx);
  st.v += dt / 6 * (s1.dv + 2 * s2.dv + 2 * s3.dv + s4.dv);
  st.t += dt;
}

function simulateStep() {
  const dt = Math.max(0.001, +els.dt.value || 0.016);
  rk4(dt, forcing(st.t));
  st.hist.push({ t: st.t, x: st.x, v: st.v });
  if (st.hist.length > 1800) st.hist.shift();
}

function wn() { return Math.sqrt(model.k / model.m); }
function zeta() { return model.c / (2 * Math.sqrt(model.k * model.m)); }

function drawSystem() {
  const c = els.sim.getContext('2d'), w = els.sim.width, h = els.sim.height;
  c.clearRect(0, 0, w, h);
  c.fillStyle = getComputedStyle(document.body).getPropertyValue('--panel'); c.fillRect(0, 0, w, h);
  const xPix = Math.max(170, Math.min(w - 120, 280 + st.x * 90));
  c.strokeStyle = '#6b7280'; c.lineWidth = 3; c.beginPath(); c.moveTo(70, 30); c.lineTo(70, 200); c.stroke();
  c.strokeStyle = '#3b82f6'; c.lineWidth = 3; c.beginPath(); c.moveTo(70, 95);
  for (let i = 0; i < 14; i++) c.lineTo(80 + 12 * i, 95 + (i % 2 ? -10 : 10));
  c.lineTo(xPix, 95); c.stroke();
  c.strokeStyle = '#10b981'; c.beginPath(); c.moveTo(70, 140); c.lineTo(xPix, 140); c.stroke();
  c.strokeStyle = '#60a5fa'; c.strokeRect(xPix, 70, 90, 90);
  c.fillStyle = '#ef4444'; c.fillText(`u(t)=${forcing(st.t).toFixed(2)}`, xPix + 100, 95);
  c.fillStyle = '#111827'; c.fillText(`x=${st.x.toFixed(3)}, v=${st.v.toFixed(3)}, t=${st.t.toFixed(2)}s`, xPix - 20, 175);
}

function plot(canvas, arrX, arrY, color, label) {
  const ctx = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = '#d1d5db';
  for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.moveTo(0, i * h / 8); ctx.lineTo(w, i * h / 8); ctx.stroke(); }
  if (arrX.length < 2) return;
  const xmin = Math.min(...arrX), xmax = Math.max(...arrX);
  let ymin = Math.min(...arrY), ymax = Math.max(...arrY);
  if (Math.abs(ymax - ymin) < 1e-9) { ymin -= 1; ymax += 1; }
  ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i < arrX.length; i++) {
    const X = ((arrX[i] - xmin) / (xmax - xmin || 1)) * (w - 20) + 10;
    const Y = h - (((arrY[i] - ymin) / (ymax - ymin || 1)) * (h - 20) + 10);
    if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
  }
  ctx.stroke();
  ctx.fillStyle = '#374151'; ctx.fillText(label, 10, 14);
}

function frfMagPhase(r, z) {
  const den = Math.sqrt((1 - r * r) ** 2 + (2 * z * r) ** 2);
  return { H: 1 / den, phi: Math.atan2(2 * z * r, 1 - r * r) };
}

function drawFRF() {
  const z = Math.max(1e-5, zeta());
  const rs = Array.from({ length: 200 }, (_, i) => i * 0.015);
  const mags = rs.map(r => frfMagPhase(r, z).H);
  plot(els.frf, rs, mags, '#8b5cf6', 'FRF |H(r)|');
}

function renderTheory() {
  const w0 = wn(), z = zeta();
  const domainEq = {
    mechanical: 'm x¨ + c x˙ + kx = f(t)',
    electrical: 'L q¨ + R q˙ + (1/C)q = v(t)',
    thermal: 'Cₜ T¨ + G T˙ + K T = q̇(t)'
  }[els.domain.value];
  const r = (+els.omega.value || 0) / (w0 || 1);
  const frf = frfMagPhase(r, Math.max(1e-5, z));
  els.theory.innerHTML = `
    <p><b>Equação:</b> ${domainEq}</p>
    <p><b>ωₙ:</b> ${w0.toFixed(3)} rad/s | <b>fₙ:</b> ${(w0 / (2 * Math.PI)).toFixed(3)} Hz</p>
    <p><b>ζ:</b> ${z.toFixed(4)} | <b>r=ω/ωₙ:</b> ${r.toFixed(3)}</p>
    <p><b>|H(r)|:</b> ${frf.H.toFixed(3)} | <b>φ:</b> ${(frf.phi * 180 / Math.PI).toFixed(1)}°</p>
    <p><small>Analogia: m↔L↔Cₜ, c↔R↔G, k↔1/C↔K.</small></p>
  `;
}

function renderParams() {
  const [a, b, c] = labels[els.domain.value];
  els.params.innerHTML = `
    <label>${a}<input id="p_m" type="number" min="0.001" step="0.1" value="${model.m}"></label>
    <label>${b}<input id="p_c" type="number" min="0" step="0.1" value="${model.c}"></label>
    <label>${c}<input id="p_k" type="number" min="0.001" step="0.1" value="${model.k}"></label>`;
  ['p_m', 'p_c', 'p_k'].forEach((id, i) => {
    document.getElementById(id).addEventListener('input', (e) => {
      model[['m', 'c', 'k'][i]] = Math.max(0.0001, +e.target.value || 0.0001);
    });
  });
}

function reset() {
  st = { t: 0, x: +els.x0.value || 0, v: +els.v0.value || 0, running: false, hist: [] };
}

function loop() {
  if (st.running) simulateStep();
  drawSystem();
  const t = st.hist.map(p => p.t), x = st.hist.map(p => p.x), v = st.hist.map(p => p.v);
  plot(els.time, t, x, '#2563eb', 'x(t)');
  plot(els.phase, x, v, '#f97316', 'fase v(x)');
  drawFRF();
  renderTheory();
  requestAnimationFrame(loop);
}

els.play.onclick = () => st.running = true;
els.pause.onclick = () => st.running = false;
els.reset.onclick = reset;
els.domain.onchange = syncDomainPreset;
els.preset.onchange = applyPreset;
els.theme.onclick = () => document.body.dataset.theme = document.body.dataset.theme === 'light' ? 'dark' : 'light';

syncDomainPreset();
reset();
loop();
