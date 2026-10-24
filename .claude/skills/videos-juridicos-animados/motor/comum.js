// Utilitários compartilhados pelos dois formatos.
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, x) => a + (b - a) * x;
export const suave = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const easeOut = x => 1 - Math.pow(1 - clamp(x), 3);
export const easeInOut = x => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
export const easeOutBack = x => { x = clamp(x); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };

export function aleatorio(semente = 7) {
  let a = semente >>> 0;
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

// Ruído determinístico suave (para tremor de câmera etc.)
export const ruido = (t, s = 0) => Math.sin(t * 13.1 + s) * .5 + Math.sin(t * 7.7 + s * 2.3) * .3 + Math.sin(t * 23.3 + s * .7) * .2;

export function escapar(s) { return String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

// Marcação nas falas/legendas: *vermelho*  _amarelo_  **dourado(contagem)**
export function marcar(s) {
  return escapar(s)
    .replace(/\*\*(.+?)\*\*/g, '<span class="real">$1</span>')
    .replace(/\*(.+?)\*/g, '<span class="verm">$1</span>')
    .replace(/(^|[\s(“"])_(.+?)_(?=$|[\s.,!?;:)”"])/g, '$1<span class="amar">$2</span>');
}
export const semMarcas = s => String(s ?? '').replace(/\*\*|\*|(^|\s)_|_(?=\s|$|[.,!?;:])/g, '$1');

export function formatar(v, formato = 'numero', h = {}) {
  const br = (x, c = 0) => x.toLocaleString('pt-BR', { minimumFractionDigits: c, maximumFractionDigits: c });
  switch (formato) {
    case 'mmss': { const s = Math.max(0, Math.ceil(v)); return { num: `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`, uni: '' }; }
    case 'hhmmss': { const s = Math.max(0, Math.ceil(v)); const hh = Math.floor(s / 3600), mm = Math.floor(s % 3600 / 60), ss = s % 60;
      return { num: `${hh}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`, uni: '' }; }
    case 'dias': {
      if (v > 1) { const d = Math.ceil(v); return { num: br(d), uni: d === 1 ? ' dia' : ' dias' }; }
      const s = Math.max(0, Math.ceil(v * 86400)); const hh = Math.floor(s / 3600), mm = Math.floor(s % 3600 / 60), ss = s % 60;
      return { num: `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`, uni: '' };
    }
    case 'moeda': return { num: 'R$ ' + br(v, v >= 100000 ? 0 : 2), uni: '' };
    case 'decimal': return { num: br(v, h.casas ?? 1), uni: h.unidade || '' };
    default: return { num: br(Math.round(v)), uni: h.unidade || '' };
  }
}

// Curvas do medidor. p = progresso 0..1 do ato.
export function curva(h, p) {
  const c = h.curva || 'linear';
  if (c === 'exponencial' && h.de > 0 && h.ate > 0) return h.de * Math.pow(h.ate / h.de, p);
  let e = p;
  if (c === 'suspense') {
    // rápido no meio, quase em tempo real no fim (os últimos segundos "arrastam")
    const corte = h.corte ?? .8, fim = h.fim ?? .985;
    e = p < corte ? easeInOut(p / corte) * fim : fim + (p - corte) / (1 - corte) * (1 - fim);
  } else if (c === 'acelerando') e = Math.pow(p, 2.2);
  else if (c === 'suave') e = easeInOut(p);
  else if (c === 'degraus') { const n = h.degraus || 6; e = Math.min(1, Math.floor(p * n + .0001) / (n - 1)); }
  return h.de + (h.ate - h.de) * e;
}
