// Peças 2D (SVG) do formato "saga". Coordenadas de projeto: 1080 x 1920.
// Cada função desenha na origem (0,0) = ponto de ancoragem. O motor posiciona e anima.
import { escapar } from './comum.js';

const PAL = {
  verm: '#e0453a', amar: '#f2b134', verde: '#3f9a5a', azul: '#4a8fd6', cinza: '#6f7782', escuro: '#1e2228', papel: '#f4efe4', tinta: '#2a2a2a',
};
export const cor = c => PAL[c] || c;

// ---------------- FUNDOS ----------------
function janelasGrade(x, y, w, h, cols, linhas, corJ, rnd, acesas = 0, corLuz = '#f2d58a') {
  let s = ''; const mx = w * .12, my = 26, cw = (w - mx * 2) / cols, ch = (h - my * 2) / linhas;
  for (let i = 0; i < cols; i++) for (let j = 0; j < linhas; j++) {
    const ac = rnd() < acesas;
    s += `<rect x="${(x + mx + i * cw + cw * .18).toFixed(1)}" y="${(y + my + j * ch + ch * .2).toFixed(1)}" width="${(cw * .64).toFixed(1)}" height="${(ch * .55).toFixed(1)}" fill="${ac ? corLuz : corJ}"/>`;
  }
  return s;
}
function skyline(rnd, { base = 1500, cor1 = '#c9c2b6', cor2 = '#b5ada0', corJ = '#e2ddd3', noite = false } = {}) {
  let s = '';
  for (const [camada, c, alt, op] of [[0, cor2, 900, .55], [1, cor1, 1150, 1]]) {
    let x = -40;
    while (x < 1120) {
      const w = 140 + rnd() * 160, h = alt * (.45 + rnd() * .55);
      s += `<g opacity="${op}"><rect x="${x.toFixed(1)}" y="${(base - h).toFixed(1)}" width="${w.toFixed(1)}" height="${(h + 500).toFixed(1)}" fill="${c}"/>`;
      s += janelasGrade(x, base - h, w, h, Math.max(2, Math.round(w / 55)), Math.max(3, Math.round(h / 80)), noite ? '#262b33' : corJ, rnd, noite ? .12 : 0) + '</g>';
      x += w + 10 + rnd() * 50 + camada * 20;
    }
  }
  return s;
}
const vinheta = (forca = .45) => `<rect width="1080" height="1920" fill="url(#vinheta)" opacity="${forca}"/>`;

export function fundo(tipo, rnd) {
  const g = (a, b) => `<linearGradient id="gf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
  const defs = (extra = '') => `<defs><radialGradient id="vinheta" cx=".5" cy=".45" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="1"/></radialGradient>${extra}</defs>`;
  switch (tipo) {
    case 'cidade-noite':
      return defs(g('#14171d', '#262a33')) + `<rect width="1080" height="1920" fill="url(#gf)"/><circle cx="820" cy="300" r="34" fill="#e8e4d8" opacity=".9"/>` + skyline(rnd, { cor1: '#2b3039', cor2: '#22262d', noite: true }) + `<rect y="1500" width="1080" height="420" fill="#1a1d22"/>` + vinheta(.6);
    case 'interior':
      return defs() + `<rect width="1080" height="1920" fill="#efe4cf"/><rect y="1180" width="1080" height="260" fill="#e3d5bb"/><rect y="1180" width="1080" height="8" fill="#cdbd9f"/>` +
        Array.from({ length: 22 }, (_, i) => `<rect x="${i * 50}" y="1190" width="3" height="250" fill="#d6c6a8"/>`).join('') + `<rect y="1440" width="1080" height="480" fill="#7a5638"/><rect y="1440" width="1080" height="10" fill="#5e4029"/>` + vinheta(.5);
    case 'interior-noite':
      return defs() + `<rect width="1080" height="1920" fill="#3a3c42"/><rect y="1180" width="1080" height="260" fill="#33353a"/>` +
        Array.from({ length: 22 }, (_, i) => `<rect x="${i * 50}" y="1190" width="3" height="250" fill="#2c2e33"/>`).join('') + `<rect y="1440" width="1080" height="480" fill="#2a2520"/>` + vinheta(.75);
    case 'escritorio':
      return defs() + `<rect width="1080" height="1920" fill="#e9e6df"/><rect x="620" y="330" width="330" height="420" fill="#bcd3e6" stroke="#c9c2b4" stroke-width="18"/><line x1="785" y1="330" x2="785" y2="750" stroke="#c9c2b4" stroke-width="10"/>` +
        `<rect x="90" y="360" width="380" height="520" fill="#8a6244"/>` + Array.from({ length: 4 }, (_, i) => `<rect x="105" y="${385 + i * 125}" width="350" height="12" fill="#6a4a33"/>` + Array.from({ length: 9 }, (_, j) => `<rect x="${112 + j * 38}" y="${300 + 100 + i * 125 - 10}" width="28" height="${70 + (j * 7 % 20)}" fill="${['#b0413e', '#3e6e9e', '#d9a441', '#55785a', '#7c5c8a'][(i + j) % 5]}"/>`).join('')).join('') +
        `<rect y="1440" width="1080" height="480" fill="#8c6b4f"/>` + vinheta(.4);
    case 'tribunal':
      return defs() + `<rect width="1080" height="1920" fill="#6e4430"/>` + Array.from({ length: 12 }, (_, i) => `<rect x="${i * 92}" y="0" width="6" height="1440" fill="#5c3826"/>`).join('') +
        `<circle cx="540" cy="380" r="120" fill="#c9a45a" opacity=".9"/><circle cx="540" cy="380" r="96" fill="#6e4430"/><text x="540" y="410" text-anchor="middle" font-family="Oswald" font-weight="700" font-size="90" fill="#c9a45a">§</text>` +
        `<rect y="1440" width="1080" height="480" fill="#3e2619"/>` + vinheta(.55);
    case 'quadro':
      return defs(`<radialGradient id="gq" cx=".5" cy=".45" r=".7"><stop offset="0" stop-color="#7b5535"/><stop offset="1" stop-color="#4a2f1c"/></radialGradient>`) + `<rect width="1080" height="1920" fill="url(#gq)"/>`;
    case 'escuro':
      return defs() + `<rect width="1080" height="1920" fill="#15171b"/>` + vinheta(.6);
    case 'claro':
      return defs() + `<rect width="1080" height="1920" fill="#efe9dc"/>` + vinheta(.25);
    case 'cidade-dia':
    default:
      return defs(g('#eebd86', '#f5d8b0')) + `<rect width="1080" height="1920" fill="url(#gf)"/>` + skyline(rnd) + `<rect y="1500" width="1080" height="420" fill="#a9a196"/>` + vinheta(.35);
  }
}

// ---------------- PERSONAGEM ----------------
// pose: baixo | aponta | acena | levanta | cruza | segura | celular
// expressao: neutro | feliz | surpreso | bravo | preocupado | desconfiado
// cabelo: curto | longo | coque | careca | espetado ; acessorios: ['bone','oculos','gravata','bigode','barba','toga','terno','avental','pasta']
export function personagem(o = {}, t = 0) {
  const pele = o.pele || '#e8b98a', roupa = cor(o.roupa || '#3f6f6a'), calca = cor(o.calca || '#2f4e7a'), cab = o.corCabelo || '#4a3324';
  const ac = new Set(o.acessorios || []);
  const toga = ac.has('toga');
  const pose = o.pose || 'baixo', ex = o.expressao || 'neutro';
  const anda = o._andando ? Math.sin(t * 9) : 0;
  let s = '';
  // pernas
  if (!toga) {
    s += `<g transform="rotate(${(anda * 14).toFixed(1)} -18 -190)"><rect x="-46" y="-195" width="38" height="190" rx="8" fill="${calca}"/><rect x="-54" y="-14" width="50" height="16" rx="6" fill="#2b2b2b"/></g>`;
    s += `<g transform="rotate(${(-anda * 14).toFixed(1)} 18 -190)"><rect x="8" y="-195" width="38" height="190" rx="8" fill="${calca}"/><rect x="6" y="-14" width="50" height="16" rx="6" fill="#2b2b2b"/></g>`;
  } else s += `<path d="M-82 -380 L82 -380 L110 0 L-110 0 Z" fill="#1d1d22"/><rect x="-60" y="-14" width="120" height="16" rx="6" fill="#111"/>`;
  // braços (atrás do tronco quando baixos)
  const ombroE = [-66, -372], ombroD = [66, -372];
  const maos = {
    baixo: [[-84, -210], [84, -210]], aponta: [[-84, -210], [205, -340]], acena: [[-84, -210], [140, -560]], levanta: [[-150, -560], [150, -560]],
    cruza: [[30, -300], [-30, -290]], segura: [[-84, -210], [120, -300]], celular: [[-84, -210], [40, -420]],
  }[pose] || [[-84, -210], [84, -210]];
  const corBraco = toga ? '#1d1d22' : roupa;
  const braco = (a, m) => `<line x1="${a[0]}" y1="${a[1]}" x2="${m[0]}" y2="${m[1]}" stroke="${corBraco}" stroke-width="40" stroke-linecap="round"/><circle cx="${m[0]}" cy="${m[1]}" r="21" fill="${pele}"/>`;
  const bracoAtras = pose === 'cruza' ? '' : braco(ombroE, maos[0]);
  s += bracoAtras;
  // tronco
  if (!toga) s += `<rect x="-80" y="-405" width="160" height="225" rx="44" fill="${roupa}"/>`;
  if (ac.has('terno')) s += `<path d="M-20 -400 L0 -330 L20 -400 Z" fill="#f4efe4"/><path d="M-30 -400 L0 -300 L-60 -390 Z M30 -400 L0 -300 L60 -390 Z" fill="rgba(0,0,0,.18)"/>`;
  if (ac.has('gravata') || ac.has('terno')) s += `<path d="M-10 -395 L10 -395 L16 -300 L0 -280 L-16 -300 Z" fill="${PAL.verm}"/>`;
  if (ac.has('avental')) s += `<rect x="-56" y="-360" width="112" height="170" rx="10" fill="#f4efe4" opacity=".9"/>`;
  if (toga) s += `<path d="M-38 -392 L0 -350 L38 -392 Z" fill="#f4efe4"/>`;
  s += pose === 'cruza' ? `<line x1="-70" y1="-300" x2="60" y2="-285" stroke="${corBraco}" stroke-width="44" stroke-linecap="round"/><line x1="70" y1="-310" x2="-60" y2="-295" stroke="${corBraco}" stroke-width="44" stroke-linecap="round"/>` : braco(ombroD, maos[1]);
  if (pose === 'celular') s += `<rect x="20" y="-470" width="44" height="76" rx="8" fill="#22262d"/><rect x="25" y="-463" width="34" height="58" rx="4" fill="#8fc4f2"/>`;
  if (ac.has('pasta')) s += `<rect x="${maos[0][0] - 50}" y="${maos[0][1] + 6}" width="100" height="72" rx="8" fill="#5a3b26"/><rect x="${maos[0][0] - 16}" y="${maos[0][1] - 4}" width="32" height="14" rx="5" fill="none" stroke="#5a3b26" stroke-width="7"/>`;
  // pescoço e cabeça
  s += `<rect x="-20" y="-430" width="40" height="34" fill="${pele}"/>`;
  const hx = 0, hy = -505, r = 88;
  if (o.cabelo === 'longo') s += `<rect x="-96" y="-560" width="192" height="190" rx="70" fill="${cab}"/>`;
  s += `<circle cx="${hx}" cy="${hy}" r="${r}" fill="${pele}"/>`;
  s += `<circle cx="${-r + 4}" cy="${hy + 8}" r="14" fill="${pele}"/><circle cx="${r - 4}" cy="${hy + 8}" r="14" fill="${pele}"/>`;
  switch (o.cabelo || 'curto') {
    case 'curto': s += `<path d="M${-r} ${hy - 6} A${r} ${r} 0 0 1 ${r} ${hy - 6} Q${r * .4} ${hy - 48} ${-r * .2} ${hy - 40} Q${-r * .7} ${hy - 34} ${-r} ${hy - 6} Z" fill="${cab}"/>`; break;
    case 'espetado': s += `<path d="M${-r} ${hy - 10} L${-70} ${hy - 105} L-40 ${hy - 80} L-20 ${hy - 118} L5 ${hy - 86} L30 ${hy - 120} L48 ${hy - 82} L78 ${hy - 104} L${r} ${hy - 10} Q0 ${hy - 50} ${-r} ${hy - 10} Z" fill="${cab}"/>`; break;
    case 'longo': s += `<path d="M${-r - 4} ${hy + 20} A${r + 4} ${r + 4} 0 0 1 ${r + 4} ${hy + 20} Q${r * .5} ${hy - 50} 0 ${hy - 40} Q${-r * .5} ${hy - 50} ${-r - 4} ${hy + 20} Z" fill="${cab}"/>`; break;
    case 'coque': s += `<circle cx="0" cy="${hy - r - 18}" r="36" fill="${cab}"/><path d="M${-r} ${hy - 4} A${r} ${r} 0 0 1 ${r} ${hy - 4} Q0 ${hy - 46} ${-r} ${hy - 4} Z" fill="${cab}"/>`; break;
    case 'careca': s += `<path d="M${-r} ${hy + 10} Q${-r - 6} ${hy - 20} ${-r + 18} ${hy - 30} L${-r + 18} ${hy + 10} Z M${r} ${hy + 10} Q${r + 6} ${hy - 20} ${r - 18} ${hy - 30} L${r - 18} ${hy + 10} Z" fill="${cab}"/>`; break;
  }
  // rosto
  const pisca = (Math.sin(t * 1.7 + (o.x || 0)) > .985) ? .15 : 1;
  const olho = (x) => ex === 'surpreso' ? `<circle cx="${x}" cy="${hy + 4}" r="10" fill="#fff"/><circle cx="${x}" cy="${hy + 4}" r="6" fill="#222"/>` : `<ellipse cx="${x}" cy="${hy + 4}" rx="8" ry="${(9 * pisca).toFixed(1)}" fill="#222"/>`;
  s += olho(-30) + olho(30);
  const sob = { neutro: [0, 0], feliz: [-4, -4], surpreso: [-14, -14], bravo: [10, -8], preocupado: [-10, 6], desconfiado: [6, -6] }[ex] || [0, 0];
  s += `<line x1="-46" y1="${hy - 22 + sob[1]}" x2="-16" y2="${hy - 22 + sob[0]}" stroke="#2a2018" stroke-width="7" stroke-linecap="round"/>`;
  s += `<line x1="16" y1="${hy - 22 + sob[0]}" x2="46" y2="${hy - 22 + (ex === 'desconfiado' ? -sob[1] - 10 : sob[1])}" stroke="#2a2018" stroke-width="7" stroke-linecap="round"/>`;
  const bocas = {
    neutro: `<line x1="-14" y1="${hy + 44}" x2="14" y2="${hy + 44}" stroke="#5a2a20" stroke-width="6" stroke-linecap="round"/>`,
    feliz: `<path d="M-24 ${hy + 36} Q0 ${hy + 62} 24 ${hy + 36}" fill="none" stroke="#5a2a20" stroke-width="6" stroke-linecap="round"/>`,
    surpreso: `<ellipse cx="0" cy="${hy + 46}" rx="11" ry="15" fill="#5a2a20"/>`,
    bravo: `<path d="M-20 ${hy + 50} Q0 ${hy + 38} 20 ${hy + 50}" fill="none" stroke="#5a2a20" stroke-width="6" stroke-linecap="round"/>`,
    preocupado: `<path d="M-18 ${hy + 50} Q-6 ${hy + 42} 4 ${hy + 48} T20 ${hy + 44}" fill="none" stroke="#5a2a20" stroke-width="6" stroke-linecap="round"/>`,
    desconfiado: `<line x1="-14" y1="${hy + 46}" x2="16" y2="${hy + 40}" stroke="#5a2a20" stroke-width="6" stroke-linecap="round"/>`,
  };
  s += bocas[ex] || bocas.neutro;
  if (ac.has('bigode')) s += `<path d="M-30 ${hy + 34} Q-14 ${hy + 20} 0 ${hy + 30} Q14 ${hy + 20} 30 ${hy + 34} Q14 ${hy + 32} 0 ${hy + 36} Q-14 ${hy + 32} -30 ${hy + 34} Z" fill="${cab}"/>`;
  if (ac.has('barba')) s += `<path d="M${-r + 6} ${hy + 10} Q${-r + 10} ${hy + r + 10} 0 ${hy + r + 14} Q${r - 10} ${hy + r + 10} ${r - 6} ${hy + 10} Q${r - 20} ${hy + 60} 0 ${hy + 62} Q${-r + 20} ${hy + 60} ${-r + 6} ${hy + 10} Z" fill="${cab}"/>`;
  if (ac.has('oculos')) s += `<g fill="none" stroke="#2b2b2b" stroke-width="6"><circle cx="-30" cy="${hy + 4}" r="22"/><circle cx="30" cy="${hy + 4}" r="22"/><line x1="-8" y1="${hy + 2}" x2="8" y2="${hy + 2}"/></g>`;
  if (ac.has('bone')) s += `<path d="M${-r - 2} ${hy - 18} A${r + 2} ${r - 4} 0 0 1 ${r + 2} ${hy - 18} Z" fill="${cor(o.corBone || 'verm')}"/><path d="M${r - 30} ${hy - 22} L${r + 70} ${hy - 12} Q${r + 60} ${hy} ${r - 30} ${hy - 6} Z" fill="${cor(o.corBone || 'verm')}"/>`;
  return s;
}

// ---------------- OBJETOS ----------------
const sombra = 'filter="url(#sombra)"';
export const defsGlobais = `<defs><filter id="sombra" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#000" flood-opacity=".35"/></filter></defs>`;

export function peca(e, t, ctx) {
  const T = (s, x, y, tam, c = '#fff', peso = 700, anc = 'middle', extra = '') => `<text x="${x}" y="${y}" font-family="Oswald, 'Oswald Local', sans-serif" font-weight="${peso}" font-size="${tam}" fill="${c}" text-anchor="${anc}" ${extra}>${escapar(s)}</text>`;
  switch (e.tipo) {
    case 'personagem': return personagem(e, t);
    case 'gato': {
      const c = cor(e.cor || '#e8913a'), ab = Math.sin(t * 3) * 6;
      return `<path d="M60 -40 Q150 ${-120 + ab} 120 -190" fill="none" stroke="${c}" stroke-width="22" stroke-linecap="round"/><ellipse cx="0" cy="-70" rx="95" ry="70" fill="${c}"/>` +
        `<circle cx="-70" cy="-150" r="62" fill="${c}"/><path d="M-120 -180 L-112 -238 L-80 -200 Z M-60 -200 L-28 -238 L-22 -180 Z" fill="${c}"/>` +
        `<circle cx="-90" cy="-155" r="8" fill="#222"/><circle cx="-52" cy="-155" r="8" fill="#222"/><path d="M-78 -135 L-64 -135 L-71 -126 Z" fill="#c4544b"/>` +
        `<path d="M-40 -128 L-2 -134 M-40 -122 L-2 -118 M-100 -128 L-138 -134 M-100 -122 L-138 -118" stroke="#5a3a22" stroke-width="3"/>`;
    }
    case 'predio': {
      const w = e.w || 360, h = e.h || 1100, c = e.cor || '#c9c2b6';
      return `<rect x="${-w / 2}" y="${-h}" width="${w}" height="${h}" fill="${c}"/><rect x="${-w / 2 - 10}" y="${-h - 14}" width="${w + 20}" height="18" fill="rgba(0,0,0,.15)"/>` + janelasGrade(-w / 2, -h, w, h, Math.max(2, Math.round(w / 70)), Math.max(3, Math.round(h / 95)), e.corJanela || '#e8e3d8', ctx.rnd, e.acesas || 0);
    }
    case 'multidao': {
      let s = ''; const n = e.n || 12, larg = e.largura || 1000;
      for (let i = 0; i < n; i++) { const x = -larg / 2 + (i + .5) * larg / n + Math.sin(i * 7.3) * 20, b = Math.sin(t * 4 + i) * 6, h = 150 + (i * 37 % 40);
        s += `<g fill="${e.cor || '#16181c'}" transform="translate(${x.toFixed(1)},${b.toFixed(1)})"><circle cx="0" cy="${-h - 26}" r="28"/><rect x="-28" y="${-h}" width="56" height="${h - 40}" rx="18"/><rect x="-24" y="-46" width="18" height="46"/><rect x="6" y="-46" width="18" height="46"/><line x1="-26" y1="${-h + 20}" x2="-60" y2="${-h + 60}" stroke="${e.cor || '#16181c'}" stroke-width="16" stroke-linecap="round"/></g>`; }
      return s;
    }
    case 'porta': {
      const w = e.w || 300, h = e.h || 560;
      return `<rect x="${-w / 2 - 14}" y="${-h - 14}" width="${w + 28}" height="${h + 14}" fill="#3a271b"/><rect x="${-w / 2}" y="${-h}" width="${w}" height="${h}" fill="#5a3b28"/><circle cx="${w / 2 - 36}" cy="${-h / 2}" r="10" fill="#d9b25a"/><circle cx="0" cy="${-h * .78}" r="7" fill="#e9e3d6"/>` +
        (e.luz !== false ? `<path d="M${-w / 2} 0 L${w / 2} 0 L${w / 2 + 160} 260 L${-w / 2 - 160} 260 Z" fill="#f2d58a" opacity=".22"/><rect x="${-w / 2}" y="-6" width="${w}" height="6" fill="#f2d58a"/>` : '');
    }
    case 'janela': {
      const w = e.w || 420, h = e.h || 360, noite = e.noite;
      return `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="${noite ? '#1d2330' : '#b9cfe2'}"/>` + (noite ? '' : `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="#e8e3d6" opacity=".45"/>`) +
        `<g fill="#f2d58a" opacity="${noite ? .9 : .6}"><rect x="${-w * .3}" y="${-h * .3}" width="${w * .14}" height="${h * .14}"/><rect x="${w * .1}" y="${-h * .1}" width="${w * .14}" height="${h * .14}"/><rect x="${-w * .1}" y="${h * .15}" width="${w * .14}" height="${h * .14}"/></g>` +
        `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="none" stroke="#d8d2c5" stroke-width="16"/><line x1="0" y1="${-h / 2}" x2="0" y2="${h / 2}" stroke="#d8d2c5" stroke-width="12"/><line x1="${-w / 2}" y1="0" x2="${w / 2}" y2="0" stroke="#d8d2c5" stroke-width="12"/><rect x="${-w / 2 - 30}" y="${h / 2}" width="${w + 60}" height="18" fill="#c9c2b4"/>`;
    }
    case 'mesa': { const w = e.w || 520, c = e.cor || '#8a5a36';
      return `<rect x="${-w / 2}" y="-240" width="${w}" height="26" fill="${c}"/><rect x="${-w / 2 + 20}" y="-214" width="22" height="214" fill="${c}"/><rect x="${w / 2 - 42}" y="-214" width="22" height="214" fill="${c}"/>`; }
    case 'bancada': { const w = e.w || 760;
      return `<rect x="${-w / 2}" y="-420" width="${w}" height="420" fill="#5b3522"/><rect x="${-w / 2 - 20}" y="-440" width="${w + 40}" height="30" fill="#3f2416"/>` + Array.from({ length: Math.floor(w / 130) }, (_, i) => `<rect x="${-w / 2 + 30 + i * 130}" y="-380" width="100" height="340" fill="none" stroke="#4a2a1a" stroke-width="8"/>`).join(''); }
    case 'martelo': {
      const bate = e._bate || 0; const ang = -35 * (1 - bate);
      return `<rect x="-70" y="-24" width="140" height="24" rx="6" fill="#4a2a1a"/><g transform="rotate(${ang.toFixed(1)} 90 -30)"><rect x="-20" y="-100" width="120" height="60" rx="14" fill="#6b3d22"/><rect x="30" y="-60" width="18" height="150" rx="6" fill="#8a5a36" transform="rotate(70 39 -60)"/></g>`;
    }
    case 'documento': case 'contrato': {
      const w = e.w || 420, h = e.h || 560; let s = `<g ${sombra}><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="6" fill="${PAL.papel}"/></g>`;
      s += T(e.titulo || 'CONTRATO', 0, -h / 2 + 70, 46, PAL.tinta);
      const n = e.linhas ?? 9; for (let i = 0; i < n; i++) s += `<rect x="${-w / 2 + 40}" y="${-h / 2 + 110 + i * 34}" width="${(w - 80) * (i % 4 === 3 ? .6 : 1)}" height="10" rx="5" fill="#cfc8b8"/>`;
      if (e.letraMiuda) s += `<g opacity=".8">${Array.from({ length: 6 }, (_, i) => `<rect x="${-w / 2 + 40}" y="${h / 2 - 120 + i * 14}" width="${w - 80}" height="4" fill="#bdb5a3"/>`).join('')}</g>`;
      if (e.assinatura) s += `<path d="M${-w / 2 + 60} ${h / 2 - 40} q30 -40 60 0 t60 -10 t50 5" fill="none" stroke="#2c4f8a" stroke-width="5"/><line x1="${-w / 2 + 40}" y1="${h / 2 - 30}" x2="${w / 2 - 40}" y2="${h / 2 - 30}" stroke="#999" stroke-width="3"/>`;
      return s;
    }
    case 'boleto': {
      const w = e.w || 520, h = 300; let s = `<g ${sombra}><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="8" fill="${PAL.papel}"/></g>`;
      s += T(e.titulo || 'BOLETO', -w / 2 + 30, -h / 2 + 56, 34, PAL.tinta, 700, 'start') + T(e.valor || 'R$ 850,00', w / 2 - 30, -h / 2 + 56, 40, PAL.verm, 700, 'end');
      s += T(e.venc || 'VENCIMENTO: HOJE', -w / 2 + 30, -h / 2 + 104, 24, '#777', 500, 'start');
      for (let i = 0; i < 46; i++) s += `<rect x="${-w / 2 + 30 + i * ((w - 60) / 46)}" y="${h / 2 - 120}" width="${(i * 7 % 3) + 2}" height="90" fill="#222"/>`;
      return s;
    }
    case 'celular': {
      const c = cor(e.cor || 'verm');
      return `<g ${sombra}><rect x="-150" y="-260" width="300" height="520" rx="36" fill="#1d2026"/><rect x="-132" y="-236" width="264" height="472" rx="22" fill="${c}"/></g>` +
        `<path d="M0 -180 L52 -90 L-52 -90 Z" fill="none" stroke="#fff" stroke-width="10" stroke-linejoin="round"/><rect x="-4" y="-160" width="8" height="38" fill="#fff"/><circle cx="0" cy="-108" r="5" fill="#fff"/>` +
        T(e.rotulo || 'ALERTA', 0, -40, 26, '#fff', 500) + (e.titulo || '').split('\n').map((l, i) => T(l, 0, 30 + i * 62, 64, '#fff', 700)).join('') + (e.texto ? T(e.texto, 0, 190, 22, '#fff', 400) : '');
    }
    case 'cronometro': {
      const v = ctx.valor(e), w = e.w || 300;
      return `<g ${sombra}><rect x="${-w / 2}" y="-60" width="${w}" height="${e.rotulo ? 120 : 92}" rx="16" fill="#1d2026"/></g><circle cx="${-w / 2 + 44}" cy="-14" r="18" fill="none" stroke="${PAL.amar}" stroke-width="6"/><line x1="${-w / 2 + 44}" y1="-14" x2="${-w / 2 + 44}" y2="-26" stroke="${PAL.amar}" stroke-width="5"/>` +
        T(v, 26, 8, 64, '#fff', 700) + (e.rotulo ? T(e.rotulo, 0, 48, 20, '#c9c9c9', 500) : '');
    }
    case 'contador': {
      const v = ctx.valor(e), w = e.w || 260;
      return `<g ${sombra}><rect x="${-w / 2}" y="-58" width="${w}" height="116" rx="18" fill="#f7f3ea"/></g>` + (e.rotulo ? T(e.rotulo, 26, -24, 22, '#7a7a7a', 600) : '') +
        `<text x="${-w / 2 + 44}" y="22" font-size="48" text-anchor="middle">${escapar(e.icone || '')}</text>` + T(v, 26, 32, 56, PAL.tinta, 700);
    }
    case 'ficha': {
      const c = cor(e.cor || 'amar'), w = e.w || 380;
      return `<g ${sombra}><rect x="${-w / 2}" y="-110" width="${w}" height="220" rx="14" fill="${PAL.papel}"/></g><rect x="${-w / 2}" y="-110" width="${w}" height="52" rx="14" fill="${c}"/><rect x="${-w / 2}" y="-74" width="${w}" height="16" fill="${c}"/>` +
        T(e.topo || '', 0, -74, 24, '#fff', 600, 'middle', 'letter-spacing="2"') + T(e.nome || '', 0, 6, 70, PAL.tinta, 700) + T(e.sub || '', 0, 82, 54, c, 700);
    }
    case 'etiqueta': {
      const c = cor(e.cor || 'verm'), tam = e.tam || 30, w = (e.texto || '').length * tam * .58 + 50;
      return `<rect x="${-w / 2}" y="${-tam * .9}" width="${w}" height="${tam * 1.8}" rx="8" fill="${c}"/>` + T(e.texto || '', 0, tam * .35, tam, '#fff', 700, 'middle', 'letter-spacing="1.5"');
    }
    case 'xis': { const r = (e.tam || 160) / 2; return `<g stroke="${cor(e.cor || 'verm')}" stroke-width="${r * .28}" stroke-linecap="round"><line x1="${-r}" y1="${-r}" x2="${r}" y2="${r}"/><line x1="${r}" y1="${-r}" x2="${-r}" y2="${r}"/></g>`; }
    case 'check': { const r = (e.tam || 120) / 2; return `<circle r="${r}" fill="${PAL.verde}"/><path d="M${-r * .45} 0 L${-r * .1} ${r * .35} L${r * .5} ${-r * .35}" fill="none" stroke="#fff" stroke-width="${r * .2}" stroke-linecap="round" stroke-linejoin="round"/>`; }
    case 'seta': { const c = cor(e.cor || 'amar'), l = e.comp || 260;
      return `<line x1="0" y1="0" x2="${l - 40}" y2="0" stroke="${c}" stroke-width="22" stroke-linecap="round"/><path d="M${l} 0 L${l - 60} -40 L${l - 60} 40 Z" fill="${c}"/>`; }
    case 'inventario': {
      const itens = e.itens || [], w = 640, h = 230 + itens.length * 120;
      let s = `<g transform="rotate(${e.rot ?? -2})"><g ${sombra}><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="6" fill="${PAL.papel}"/></g><rect x="-80" y="${-h / 2 - 26}" width="160" height="52" rx="10" fill="#8a8f98"/>`;
      s += T(e.titulo || 'INVENTÁRIO', 0, -h / 2 + 120, 64, PAL.tinta);
      itens.forEach((it, i) => {
        const y = -h / 2 + 230 + i * 120, val = ctx.valorItem(e, it);
        s += T(it.nome, -w / 2 + 50, y, 40, '#3a3a3a', 600, 'start');
        for (let k = 0; k < 5; k++) s += `<rect x="${40 + k * 50}" y="${y - 36}" width="40" height="34" rx="4" fill="${k < val ? cor(it.cor || 'azul') : '#ddd6c8'}"/>`;
      });
      if (e.selo) s += `<g transform="translate(0 ${-h / 2 - 90}) rotate(3)"><g ${sombra}><rect x="-170" y="-60" width="340" height="120" rx="12" fill="#fff"/></g><rect x="-170" y="-60" width="340" height="40" rx="12" fill="${cor(e.selo.cor || 'verde')}"/><rect x="-170" y="-34" width="340" height="14" fill="${cor(e.selo.cor || 'verde')}"/>` + T(e.selo.topo || 'STATUS', 0, -32, 22, '#fff', 600) + T(e.selo.texto || '', 0, 42, 54, PAL.tinta) + '</g>';
      return s + '</g>';
    }
    case 'niveis': {
      const itens = e.itens || [], w = e.w || 560, hN = e.alturaNivel || 120; let s = '';
      itens.forEach((nome, i) => {
        const y = -itens.length * hN + i * hN, dest = i === e.destaque;
        s += `<rect x="${-w / 2}" y="${y}" width="${w}" height="${hN - 8}" fill="${dest ? PAL.amar : '#d8d2c5'}"/><line x1="${-w / 2 + 20}" y1="${y + hN - 20}" x2="${-w / 2 + 120}" y2="${y + 12}" stroke="rgba(0,0,0,.25)" stroke-width="4"/>`;
        s += T(nome, -w / 2 - 24, y + hN * .6, 34, '#f4efe4', 600, 'end');
        if (dest && e.rotulo) s += `<path d="M${w / 2 + 16} ${y + hN / 2 - 4} l30 -22 v44 z" fill="${PAL.amar}"/>` + T(e.rotulo, w / 2 + 56, y + hN / 2 + 8, 30, '#f4efe4', 700, 'start');
      });
      return s;
    }
    case 'carimbo': {
      const tam = e.tam || 64, w = (e.texto || '').length * tam * .62 + 60;
      return `<g opacity=".92"><rect x="${-w / 2}" y="${-tam * .85}" width="${w}" height="${tam * 1.7}" rx="12" fill="rgba(255,245,240,.08)"/><rect x="${-w / 2}" y="${-tam * .85}" width="${w}" height="${tam * 1.7}" rx="12" fill="none" stroke="${PAL.verm}" stroke-width="10"/>` + T(e.texto || '', 0, tam * .36, tam, PAL.verm, 700) + '</g>';
    }
    case 'titulo': return T(e.texto || '', 0, 0, e.tam || 120, cor(e.cor || 'verm'), 700, 'middle', 'letter-spacing="1"');
    case 'texto': return T(e.texto || '', 0, 0, e.tam || 40, cor(e.cor || '#fff'), e.peso || 600, e.ancora || 'middle');
    case 'balao': {
      const tam = e.tam || 44, linhas = String(e.texto || '').split('\n'), w = Math.max(...linhas.map(l => l.length)) * tam * .55 + 70, h = linhas.length * tam * 1.25 + 50;
      return `<g ${sombra}><rect x="${-w / 2}" y="${-h}" width="${w}" height="${h}" rx="30" fill="#fff"/><path d="M${-30} -2 L${-60} 60 L${10} -2 Z" fill="#fff"/></g>` + linhas.map((l, i) => T(l, 0, -h + 25 + tam + i * tam * 1.25, tam, PAL.tinta, 600)).join('');
    }
    case 'lua': return `<circle r="${e.r || 34}" fill="#e8e4d8"/>`;
    case 'dinheiro': { let s = ''; for (let i = 0; i < (e.n || 5); i++) s += `<g transform="translate(${i * 16} ${-i * 14}) rotate(${(i % 3 - 1) * 4})"><rect x="-120" y="-60" width="240" height="120" rx="8" fill="#6aa86f" stroke="#3f7a45" stroke-width="6"/><circle r="34" fill="none" stroke="#3f7a45" stroke-width="6"/></g>`; return s; }
    case 'casa': { const w = e.w || 420, c = e.cor || '#e9dcc5';
      return `<rect x="${-w / 2}" y="${-w * .6}" width="${w}" height="${w * .6}" fill="${c}"/><path d="M${-w / 2 - 30} ${-w * .6} L0 ${-w * 1.05} L${w / 2 + 30} ${-w * .6} Z" fill="#b5523b"/><rect x="${-w * .1}" y="${-w * .32}" width="${w * .2}" height="${w * .32}" fill="#6b4a2f"/><rect x="${-w * .38}" y="${-w * .45}" width="${w * .16}" height="${w * .14}" fill="#bcd3e6"/><rect x="${w * .22}" y="${-w * .45}" width="${w * .16}" height="${w * .14}" fill="#bcd3e6"/>`; }
    case 'carro': { const c = cor(e.cor || 'azul');
      return `<path d="M-200 -60 L-150 -60 L-110 -130 L90 -130 L140 -60 L200 -60 L200 -10 L-200 -10 Z" fill="${c}"/><rect x="-95" y="-120" width="80" height="55" fill="#cfe0ee"/><rect x="0" y="-120" width="80" height="55" fill="#cfe0ee"/><circle cx="-120" cy="-8" r="38" fill="#222"/><circle cx="120" cy="-8" r="38" fill="#222"/>`; }
    case 'caixaSom': {
      const b = 1 + Math.max(0, Math.sin(t * Math.PI * 4)) * .06 * (e.volume ?? 1);
      let s = `<rect x="-120" y="-420" width="240" height="420" rx="18" fill="#22252b"/>` +
        `<g transform="translate(0 -290) scale(${b.toFixed(3)})"><circle r="80" fill="#3a3e46"/><circle r="46" fill="#15171b"/></g><g transform="translate(0 -110) scale(${b.toFixed(3)})"><circle r="52" fill="#3a3e46"/><circle r="26" fill="#15171b"/></g>`;
      for (let i = 0; i < 3; i++) { const k = (t * .7 + i / 3) % 1; s += `<text x="${(140 + Math.sin(i * 2 + t) * 30).toFixed(1)}" y="${(-380 - k * 260).toFixed(1)}" font-size="70" fill="#f2b134" opacity="${(1 - k).toFixed(2)}">♪</text>`; }
      return s;
    }
    case 'svg': return e.svg || '';
    default: return '';
  }
}
