// Formato "contagem": plano-sequência 3D, medidor no topo, legendas curtas, carimbos, clímax e cartela "Calma:".
import * as THREE from 'three';
import { clamp, lerp, suave, easeOut, easeInOut, easeOutBack, aleatorio, ruido, marcar, escapar, formatar, curva } from './comum.js';
import { criarKit } from './kit3d.js';

const $ = s => document.querySelector(s);
try {
  const q = new URLSearchParams(location.search);
  const roteiroURL = q.get('roteiro');
  const R = await (await fetch(roteiroURL)).json();
  const W = +q.get('w') || innerWidth, H = +q.get('h') || innerHeight;
  const palco = $('#palco');
  palco.style.width = W + 'px'; palco.style.height = H + 'px';
  document.documentElement.style.setProperty('--u', (W / 100) + 'px');
  if (R.estilo === 'sans') palco.classList.add('sans');
  if (R.cores?.acento) document.documentElement.style.setProperty('--acento', R.cores.acento);
  if (R.cores?.ouro) document.documentElement.style.setProperty('--ouro', R.cores.ouro);

  const T = Object.assign({ gancho: 4.5, virada: 34, climax: 60, fade: 64.5, cartela: 66.5 }, R.tempos || {});
  const DUR = R.duracao || 78;
  const rnd = aleatorio(R.semente || 7);

  // ---------- 3D ----------
  const renderer = new THREE.WebGLRenderer({ canvas: $('#gl'), antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(W, H, false);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(R.camera?.fov || 38, W / H, .1, 2000);
  const kit = criarKit(scene, rnd);
  const cenaURL = new URL(R.cena, new URL(roteiroURL, location.href)).href;
  const montar = (await import(cenaURL)).default;
  const cena = (await montar({ THREE, scene, camera, kit, R, rnd })) || {};
  const cam = cena.camera || R.camera || { de: { pos: [0, 30, 60], alvo: [0, 5, 0] }, ate: { pos: [0, 22, 40], alvo: [0, 5, 0] } };
  if (cam.fov) camera.fov = cam.fov;
  camera.updateProjectionMatrix();
  const v3 = a => new THREE.Vector3(...a);
  const camDe = { pos: v3(cam.de.pos), alvo: v3(cam.de.alvo) }, camAte = { pos: v3(cam.ate.pos), alvo: v3(cam.ate.alvo) };

  // ---------- Texto ----------
  const g = R.gancho || {};
  $('#gancho .pre').innerHTML = marcar(g.pre ?? 'E se');
  $('#gancho .t').innerHTML = marcar(g.texto ?? R.titulo ?? '');
  const C = R.climax || {};
  $('#climax .sobre').textContent = C.sobre || '';
  $('#climax .palavra').textContent = C.palavra || 'AQUI';
  const K = R.cartela || {};
  $('#cartela .tit').innerHTML = marcar(K.titulo ?? `${g.pre ?? 'E se'} ${g.texto ?? ''}`.trim());
  $('#cartela .calma').innerHTML = marcar(K.calma || '');
  $('#cartela .perg').innerHTML = marcar(K.pergunta || '');
  $('#cartela .fonte').innerHTML = escapar(K.fonte || '').replace(/\n/g, '<br>');
  $('#cartela .assin').textContent = K.assinatura || '';

  // Ajusta a palavra do clímax à largura
  await document.fonts.ready;
  const pal = $('#climax .palavra');
  $('#climax').style.opacity = 1;
  const larg = pal.getBoundingClientRect().width;
  if (larg > W * .86) pal.style.fontSize = (parseFloat(getComputedStyle(pal).fontSize) * W * .86 / larg) + 'px';
  $('#climax').style.opacity = 0;

  // Rachaduras (SVG procedural)
  {
    const svg = $('#climax svg'); svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const cx = W * .5, cy = H * .52; let d = '';
    const raios = [];
    const n = 15;
    for (let i = 0; i < n; i++) {
      const ang = i / n * Math.PI * 2 + (rnd() - .5) * .35; let r = 0, pts = [[cx, cy]];
      while (r < Math.max(W, H)) { r += 30 + rnd() * 90; const a = ang + (rnd() - .5) * .25; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
      raios.push(pts); d += 'M' + pts.map(p => p.map(v => v.toFixed(1)).join(' ')).join('L');
    }
    for (const rr of [60, 150, 280, 430]) for (let i = 0; i < n; i++) {
      if (rnd() < .35) continue; const a = raios[i], b = raios[(i + 1) % n];
      const pa = a.find(p => Math.hypot(p[0] - cx, p[1] - cy) > rr), pb = b.find(p => Math.hypot(p[0] - cx, p[1] - cy) > rr);
      if (pa && pb) d += `M${pa[0].toFixed(1)} ${pa[1].toFixed(1)}L${((pa[0] + pb[0]) / 2 + (rnd() - .5) * 20).toFixed(1)} ${((pa[1] + pb[1]) / 2 + (rnd() - .5) * 20).toFixed(1)}L${pb[0].toFixed(1)} ${pb[1].toFixed(1)}`;
    }
    svg.innerHTML = `<circle cx="${cx}" cy="${cy}" r="${W * .018}" fill="none" stroke="currentColor" stroke-width="2"/><path d="${d}" fill="none" stroke="currentColor" stroke-width="${Math.max(1.2, W / 420)}" stroke-linejoin="round"/>`;
  }

  // Carimbos
  const carimbos = (R.carimbos || []).map((c, i) => {
    const el = document.createElement('div'); el.className = 'carimbo'; el.textContent = c.texto;
    $('#carimbos').appendChild(el);
    // vagas em zigue-zague entre o medidor e a legenda, sem sobreposição
    const vagas = [[52, 26], [8, 33], [44, 40], [12, 47], [50, 54], [20, 29], [30, 51]];
    const [vx, vy] = vagas[i % vagas.length];
    const x = c.x ?? (vx + rnd() * 6), y = c.y ?? (vy + rnd() * 2), rot = c.rot ?? ((rnd() - .5) * 22);
    el.style.left = x + '%'; el.style.top = y + '%';
    return { ...c, el, rot };
  });

  // Eventos (para a trilha sonora)
  const eventos = [{ t: T.gancho, tipo: 'inicio_contagem' }, { t: T.virada, tipo: 'virada' }, { t: T.climax, tipo: 'climax' }, { t: T.fade, tipo: 'fade' }, { t: T.cartela, tipo: 'cartela' },
    { t: T.cartela + 1.0, tipo: 'sino' }, { t: T.cartela + 2.6, tipo: 'sino' }];
  for (const c of carimbos) eventos.push({ t: c.t, tipo: 'carimbo' });
  for (const l of R.legendas || []) eventos.push({ t: l.t, tipo: 'legenda' });

  const legendas = (R.legendas || []).slice().sort((a, b) => a.t - b.t);
  let legendaAtual = null, hudAtual = null;
  const hudNum = $('#hud .num'), hudSub2 = $('#hud .sub2');

  function estado(t) {
    const p1 = clamp((t - T.gancho) / (T.virada - T.gancho)), p2 = clamp((t - T.virada) / (T.climax - T.virada));
    let perigo = t < T.virada ? .1 * suave(.75, 1, p1) : t < T.climax ? .16 + .84 * Math.pow(p2, 1.2) : 1;
    const fase = t < T.gancho ? 'gancho' : t < T.virada ? 'ato1' : t < T.climax ? 'ato2' : t < T.cartela ? 'climax' : 'cartela';
    return { t, p1, p2, perigo, fase, T };
  }

  function render(t) {
    const s = estado(t);
    kit.atualizar(s);
    cena.atualizar?.(s);

    // câmera: deriva lenta + empurrão no ato 2 + tremor
    const k = easeInOut(clamp(t / T.climax));
    const pos = camDe.pos.clone().lerp(camAte.pos, k), alvo = camDe.alvo.clone().lerp(camAte.alvo, k);
    let impulso = 0;
    for (const c of carimbos) if (t >= c.t) impulso += Math.exp(-(t - c.t) * 9) * .5;
    if (t >= T.virada) impulso += Math.exp(-(t - T.virada) * 3) * 1.2;
    const amp = (Math.pow(s.perigo, 2) * .35 + impulso) * (cam.tremor ?? 1);
    pos.x += ruido(t, 1) * amp; pos.y += ruido(t, 2) * amp; alvo.x += ruido(t, 3) * amp * .5;
    camera.position.copy(pos); camera.lookAt(alvo);
    renderer.render(scene, camera);

    // gradação de cor
    const d = s.perigo;
    $('#gl').style.filter = `sepia(${(d * .5).toFixed(3)}) saturate(${(1 + d * .35).toFixed(3)}) contrast(${(1 + d * .08).toFixed(3)}) brightness(${(1 - d * .1).toFixed(3)}) hue-rotate(${(-d * 8).toFixed(2)}deg)`;
    $('#vinheta').style.opacity = (d * .85).toFixed(3);

    // flash da virada
    const fl = t < T.virada ? suave(T.virada - .6, T.virada, t) * .5 : Math.exp(-(t - T.virada) * 1.7) * .97;
    $('#flash').style.opacity = t < T.climax ? fl.toFixed(3) : 0;

    // gancho
    $('#gancho').style.opacity = (suave(0, .35, t) * (1 - suave(T.gancho - .6, T.gancho, t))).toFixed(3);

    // HUD
    const hudOp = suave(T.gancho - .3, T.gancho + .3, t) * (1 - suave(T.climax - .3, T.climax, t));
    $('#hud').style.opacity = hudOp.toFixed(3);
    const h = t < T.virada ? R.hud1 : R.hud2;
    if (h) {
      if (hudAtual !== h) { hudAtual = h; $('#hud .rot').textContent = h.rotulo || ''; $('#hud .sub').textContent = h.sub || ''; }
      const p = t < T.virada ? s.p1 : s.p2;
      const v = formatar(curva(h, p), h.formato, h);
      hudNum.innerHTML = `${escapar(v.num)}${v.uni ? `<span class="uni">${escapar(v.uni)}</span>` : ''}`;
      const alerta = t < T.virada ? suave(.78, .86, p) : clamp(d * 1.1);
      hudNum.style.color = `rgb(255,${Math.round(lerp(255, 107, alerta))},${Math.round(lerp(255, 61, alerta))})`;
      if (h.contador) {
        const c = h.contador; const cv = formatar(lerp(c.de ?? 0, c.ate ?? 0, p), c.formato, c);
        hudSub2.textContent = `${c.prefixo || ''}${cv.num}${cv.uni}${c.sufixo || ''}`;
      } else hudSub2.textContent = '';
    }

    // legendas
    let atual = null;
    for (let i = 0; i < legendas.length; i++) {
      const l = legendas[i], prox = legendas[i + 1];
      const fim = l.ate ?? (prox ? prox.t - .15 : T.climax - .2);
      if (t >= l.t && t < fim) { atual = { l, fim }; break; }
    }
    const leg = $('#legenda');
    if (atual) {
      if (legendaAtual !== atual.l) { legendaAtual = atual.l; leg.innerHTML = marcar(atual.l.texto); }
      const op = suave(atual.l.t, atual.l.t + .3, t) * (1 - suave(atual.fim - .3, atual.fim, t));
      leg.style.opacity = op.toFixed(3); leg.style.transform = `translateY(${((1 - easeOut((t - atual.l.t) / .4)) * W * .012).toFixed(2)}px)`;
    } else leg.style.opacity = 0;

    // carimbos
    for (const c of carimbos) {
      const e = t - c.t;
      if (e < 0 || t >= T.climax) { c.el.style.opacity = 0; continue; }
      const k2 = clamp(e / .14);
      c.el.style.opacity = (k2 * .9).toFixed(3);
      c.el.style.transform = `rotate(${c.rot}deg) scale(${lerp(2.4, 1, k2 * k2).toFixed(3)})`;
    }

    // clímax
    const ce = t - T.climax, cl = $('#climax');
    if (ce >= 0 && t < T.cartela) {
      cl.style.opacity = 1;
      const claro = '#f4efe6', escuro = '#3a2216';
      const mix = suave(1.0, 2.4, ce);
      const c1 = new THREE.Color(claro).lerp(new THREE.Color(escuro), mix);
      cl.style.background = `rgba(${Math.round(c1.r * 255)},${Math.round(c1.g * 255)},${Math.round(c1.b * 255)},${clamp(ce / .12).toFixed(3)})`;
      $('#climax .sobre').style.color = mix > .5 ? '#e9dccf' : '#2a1a12';
      pal.style.transform = `scale(${lerp(1.3, 1, easeOutBack(ce / .3)).toFixed(3)})`;
      const svg = $('#climax svg');
      svg.style.opacity = ce > .35 ? 1 : 0;
      svg.style.color = mix > .5 ? 'rgba(240,225,210,.55)' : 'rgba(40,25,18,.8)';
      const tr = ce > .35 ? Math.exp(-(ce - .35) * 6) * W * .02 : 0;
      cl.style.transform = `translate(${(ruido(t, 5) * tr).toFixed(2)}px, ${(ruido(t, 6) * tr).toFixed(2)}px)`;
    } else cl.style.opacity = 0;
    $('#preto').style.opacity = suave(T.fade, T.cartela - .2, t).toFixed(3);

    // cartela
    const ke = t - T.cartela;
    $('#cartela').style.opacity = ke >= 0 ? 1 : 0;
    const rev = [['.tit', .2], ['.div', .6], ['.calma', 1.0], ['.perg', 2.6], ['.fonte', 3.2], ['.assin', 3.4]];
    for (const [sel, t0] of rev) $('#cartela ' + sel).style.opacity = suave(t0, t0 + .7, ke).toFixed(3);
  }

  window.__render = render;
  window.__duracao = DUR;
  window.__eventos = eventos.sort((a, b) => a.t - b.t);
  render(0);
  window.__pronto = true;

  // Pré-visualização ao vivo (abrir no navegador sem &captura=1)
  if (!q.has('captura')) {
    const t0 = performance.now(); const ini = +(q.get('t') || 0);
    const loop = () => { render((ini + (performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; loop();
  }
} catch (e) { console.error(e); window.__erro = String(e && e.stack || e); }
