// Formato "saga": narração + planos 2D com cortes, legenda palavra a palavra, fichas, contadores e cliffhanger "PARTE N".
import { clamp, lerp, suave, easeOut, easeOutBack, aleatorio, ruido, marcar, semMarcas, escapar, formatar, curva } from './comum.js';
import { fundo, peca, defsGlobais } from './saga-pecas.js';

const $ = s => document.querySelector(s);
const norm = s => semMarcas(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9$%]/g, '');

try {
  const q = new URLSearchParams(location.search);
  const R = await (await fetch(q.get('roteiro'))).json();
  let tempos = null;
  if (q.get('tempos')) { const r = await fetch(q.get('tempos')); if (r.ok) tempos = await r.json(); }
  const W = +q.get('w') || innerWidth, H = +q.get('h') || innerHeight;
  $('#palco').style.width = W + 'px'; $('#palco').style.height = H + 'px';
  document.documentElement.style.setProperty('--u', (W / 100) + 'px');

  // ---- tempos de cada plano (da narração; sem narração, estima pela leitura) ----
  const planos = R.planos || [];
  const estimar = () => {
    let t = .15; const out = [];
    for (const p of planos) {
      const toks = semMarcas(p.fala || '').split(/\s+/).filter(Boolean); const pal = [];
      for (const w of toks) { const d = .11 + .047 * w.length; pal.push({ ini: t, fim: t + d }); t += d + (/[.!?…]$/.test(w) ? .38 : /[,;:]$/.test(w) ? .18 : .02); }
      const ini = pal[0]?.ini ?? t, fim = Math.max(pal.at(-1)?.fim ?? t, ini + (p.minimo || 1.6)); t = Math.max(t, fim) + .1;
      out.push({ inicio: ini, fim, palavras: pal });
    }
    return out;
  };
  const TP = tempos?.planos?.length === planos.length ? tempos.planos : estimar();
  // Cada plano vai do início da própria fala até o início da próxima
  const P = planos.map((p, i) => ({ ...p, i, ini: i === 0 ? 0 : TP[i].inicio - .05, fimFala: TP[i].fim, palavras: TP[i].palavras }));
  P.forEach((p, i) => p.fim = i < P.length - 1 ? P[i + 1].ini : p.fimFala + .35);
  const F = R.final || {};
  const iniFinal = P.at(-1).fim;
  const DUR = iniFinal + (F.duracao ?? 4.5);

  // ---- tokens + marcação (cor) ----
  for (const p of P) {
    const brutos = String(p.fala || '').split(/\s+/).filter(Boolean); let estado = '';
    p.tokens = brutos.map((b, k) => {
      let c = estado, txt = b;
      if (/^\*[^*]/.test(txt) || txt === '*') { c = 'verm'; estado = 'verm'; }
      if (/^_/.test(txt)) { c = 'amar'; estado = 'amar'; }
      const fecha = /\*[.,!?;:…”"]*$/.test(txt) && c === 'verm' || /_[.,!?;:…”"]*$/.test(txt) && c === 'amar';
      txt = semMarcas(txt).replace(/\*/g, '');
      if (fecha) estado = '';
      return { txt, cor: c, ini: p.palavras[k]?.ini ?? p.ini, fim: p.palavras[k]?.fim ?? p.fimFala };
    });
    // blocos de legenda: até 3 palavras / 20 letras, quebra após pontuação
    p.blocos = []; let b = [];
    p.tokens.forEach((tk, k) => {
      b.push(tk);
      const letras = b.reduce((n, x) => n + x.txt.length + 1, 0);
      if (b.length >= (R.palavrasPorLegenda || 3) || letras > 20 || /[.!?…,;:]$/.test(tk.txt) || k === p.tokens.length - 1) { p.blocos.push(b); b = []; }
    });
  }
  const resolver = (p, v, padrao = 0) => {
    if (v == null) return p.ini + padrao;
    if (typeof v === 'number') return p.ini + v;
    if (String(v).startsWith('@')) { const alvo = norm(v.slice(1)); const tk = p.tokens.find(x => norm(x.txt).startsWith(alvo)); return tk ? tk.ini : p.ini + padrao; }
    if (String(v).startsWith('#')) return p.tokens[+v.slice(1)]?.ini ?? p.ini;
    return p.ini + padrao;
  };

  // ---- eventos de áudio ----
  const eventos = [];
  const somDe = { carimbo: 'carimbo', martelo: 'martelo', xis: 'erro', check: 'acerto', titulo: 'impacto', celular: 'alerta', etiqueta: 'pop', ficha: 'pop', inventario: 'papel', documento: 'papel', contrato: 'papel', boleto: 'papel', cronometro: 'tique', contador: 'pop' };
  for (const p of P) {
    if (p.i > 0) eventos.push({ t: p.ini, tipo: 'corte' });
    if (p.flash) eventos.push({ t: p.ini, tipo: 'impacto' });
    for (const e of p.elementos || []) {
      e._t = resolver(p, e.entra, 0); e._sai = e.sai != null ? resolver(p, e.sai) : Infinity;
      if (e.bate != null) { e._bate = resolver(p, e.bate); eventos.push({ t: e._bate, tipo: 'martelo' }); }
      if (e.move) e._mv = resolver(p, e.move.em ?? e.entra, 0);
      if (e._t > p.ini + .05 && somDe[e.tipo] && e.som !== false) eventos.push({ t: e._t, tipo: e.som || somDe[e.tipo] });
    }
  }
  eventos.push({ t: iniFinal, tipo: 'final' });

  // ---- render ----
  const svg = $('#cena'), leg = $('#legenda');
  const ctxBase = { rnd: aleatorio(1) };
  let planoAtual = -1, blocoAtual = null;
  $('#final .parte').textContent = F.parte || '';
  $('#final .perg').innerHTML = marcar(F.pergunta || '');
  $('#final .cta').textContent = F.cta || '';
  $('#final .serie').textContent = F.serie || '';
  $('#final .fonte').innerHTML = escapar(F.fonte || '').replace(/\n/g, '<br>');

  function montarPlano(p) {
    const rnd = aleatorio((R.semente || 3) * 100 + p.i);
    const fundoSvg = p.fundo === 'nenhum' ? '' : fundo(p.fundo || 'cidade-dia', rnd);
    svg.innerHTML = defsGlobais + `<g id="cam">${fundoSvg}<g id="els">${(p.elementos || []).map((_, k) => `<g data-k="${k}"></g>`).join('')}</g></g>`;
    p._els = [...svg.querySelectorAll('#els > g')];
    p._rnd = aleatorio((R.semente || 3) * 7 + p.i);
  }

  function render(t) {
    if (t >= iniFinal) {
      $('#final').style.opacity = suave(iniFinal, iniFinal + .25, t).toFixed(3); leg.style.opacity = 0; $('#flash').style.opacity = 0;
      return;
    }
    $('#final').style.opacity = 0;
    const p = P.find(x => t >= x.ini && t < x.fim) || P.at(-1);
    if (p.i !== planoAtual) { montarPlano(p); planoAtual = p.i; }
    const tp = t - p.ini, durP = p.fim - p.ini;

    // câmera (zoom lento + tremor)
    const [z0, z1] = p.zoom || [1, 1.06], [fx, fy] = p.foco || [540, 960];
    const z = lerp(z0, z1, clamp(tp / durP));
    let tremor = (p.tremor || 0) * 14;
    for (const e of p.elementos || []) if (['carimbo', 'titulo'].includes(e.tipo) || e._bate) { const te = t - (e._bate ?? e._t); if (te >= 0) tremor += Math.exp(-te * 10) * 18; }
    const ox = ruido(t, 1) * tremor, oy = ruido(t, 2) * tremor;
    svg.querySelector('#cam').setAttribute('transform', `translate(${(fx + ox).toFixed(2)} ${(fy + oy).toFixed(2)}) scale(${z.toFixed(4)}) translate(${-fx} ${-fy})`);

    // elementos
    (p.elementos || []).forEach((e, k) => {
      const g = p._els[k]; const te = t - e._t;
      if (te < 0 || t > e._sai + .2) { g.setAttribute('opacity', 0); g.innerHTML = ''; return; }
      const a = e.anim || (e.tipo === 'personagem' || e.tipo === 'predio' || e.tipo === 'multidao' ? (e._t <= p.ini + .05 ? 'nenhuma' : 'sobe') : e.tipo === 'carimbo' ? 'carimba' : 'pop');
      const k1 = clamp(te / (e.duracaoEntrada || .32));
      let op = 1, sc = 1, dy = 0, rot = e.rot || 0;
      if (a === 'pop') { op = clamp(te / .12); sc = lerp(.55, 1, easeOutBack(k1)); }
      else if (a === 'fade') op = k1;
      else if (a === 'sobe') { op = clamp(te / .2); dy = (1 - easeOut(k1)) * 90; }
      else if (a === 'cai') { dy = -(1 - easeOutBack(k1)) * 500; }
      else if (a === 'carimba') { const kk = clamp(te / .13); op = kk; sc = lerp(2.3, 1, kk * kk); }
      if (t > e._sai) op *= 1 - clamp((t - e._sai) / .2);
      let x = e.x ?? 540, y = e.y ?? (e.tipo === 'personagem' || e.tipo === 'gato' ? 1440 : 960);
      let andando = false;
      if (e.move) {
        const km = clamp((t - e._mv) / (e.move.dur || 1.2)); andando = km > 0 && km < 1;
        x = lerp(x, e.move.x ?? x, suave(0, 1, km)); y = lerp(y, e.move.y ?? y, suave(0, 1, km));
      }
      if (e.continuo === 'treme') { x += ruido(t * 1.6, k) * 6; y += ruido(t * 1.6, k + 9) * 6; }
      if (e.continuo === 'flutua') y += Math.sin(t * 2 + k) * 10;
      if (e.continuo === 'pulsa') sc *= 1 + Math.sin(t * 6) * .03;
      const esc = (e.escala ?? (e.tipo === 'personagem' ? 1.3 : 1)) * sc;
      const respira = e.tipo === 'personagem' ? 1 + Math.sin(t * 2.2 + k) * .008 : 1;
      g.setAttribute('opacity', op.toFixed(3));
      g.setAttribute('transform', `translate(${x.toFixed(1)} ${(y + dy).toFixed(1)}) rotate(${rot}) scale(${(esc * (e.espelhar ? -1 : 1)).toFixed(4)} ${(esc * respira).toFixed(4)})`);
      const ctx = {
        rnd: aleatorio(k + 1 + p.i * 31),
        valor: el => { const pr = clamp((t - el._t) / (el.dur || Math.max(.6, p.fim - el._t))); return formatar(curva(el, pr), el.formato || 'numero', el).num + (el.unidade || '') ; },
        valorItem: (el, it) => { const i = (el.itens || []).indexOf(it); const pr = clamp((t - el._t - .4 - i * .25) / .5); return Math.round(lerp(it.de ?? it.valor ?? 0, it.valor ?? 0, pr)); },
      };
      if (e._bate != null) e._bateK = clamp((t - e._bate + .12) / .12);
      g.innerHTML = peca({ ...e, _andando: andando, _bate: e._bateK }, t, ctx);
    });

    // flash
    $('#flash').style.opacity = p.flash ? (Math.exp(-tp * 4) * .9).toFixed(3) : 0;

    // legenda
    let bloco = null;
    for (let i = 0; i < p.blocos.length; i++) {
      const b = p.blocos[i], prox = p.blocos[i + 1];
      const ini = b[0].ini - .04, fim = prox ? prox[0].ini - .04 : b.at(-1).fim + .3;
      if (t >= ini && t < fim) { bloco = b; break; }
    }
    if (bloco !== blocoAtual) {
      blocoAtual = bloco;
      leg.innerHTML = bloco ? bloco.map(tk => tk.cor ? `<span class="${tk.cor}">${escapar(tk.txt)}</span>` : escapar(tk.txt)).join(' ') : '';
    }
    leg.style.opacity = bloco ? 1 : 0;
    if (p.legenda === 'alto') leg.style.top = '20%'; else if (p.legenda === 'baixo') leg.style.top = '78%'; else leg.style.top = '';
  }

  await document.fonts.ready;
  window.__render = render;
  window.__duracao = DUR;
  window.__eventos = eventos.sort((a, b) => a.t - b.t);
  render(0);
  window.__pronto = true;
  if (!q.has('captura')) {
    const t0 = performance.now(); const ini = +(q.get('t') || 0);
    const loop = () => { render((ini + (performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; loop();
  }
} catch (e) { console.error(e); window.__erro = String(e && e.stack || e); }
