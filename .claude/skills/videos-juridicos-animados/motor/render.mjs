#!/usr/bin/env node
// Renderiza um roteiro em MP4 vertical.
// Uso (rodar na raiz do projeto, onde ficam roteiros/ e cenas/):
//   node motor/render.mjs roteiros/x.json                 -> saida/x.mp4
//   node motor/render.mjs roteiros/x.json --rascunho      -> 12 fps, metade da resolução (conferência rápida)
//   node motor/render.mjs roteiros/x.json --quadros 3,20,40,62,70   -> PNGs desses instantes (conferir visual)
//   opções: --saida arq.mp4  --fps 30  --largura 720  --altura 1280  --sem-voz  --reusar-voz (não gera a narração de novo)
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const MOTOR = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = process.cwd();

function lerArgs(a) {
  const o = { _: [] };
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith('--')) {
      const k = a[i].slice(2);
      const v = a[i + 1] && !a[i + 1].startsWith('--') ? a[++i] : true;
      o[k] = v;
    } else o._.push(a[i]);
  }
  return o;
}
const A = lerArgs(process.argv.slice(2));
if (!A._[0]) { console.error('uso: node motor/render.mjs roteiros/x.json [--rascunho] [--quadros 3,20]'); process.exit(1); }

const roteiroAbs = path.resolve(A._[0]);
const R = JSON.parse(fs.readFileSync(roteiroAbs, 'utf8'));
const formato = R.formato || 'contagem';
const nome = path.basename(roteiroAbs, '.json');
const pastaTrab = path.join(RAIZ, 'saida', nome);
fs.mkdirSync(pastaTrab, { recursive: true });
const rascunho = !!A.rascunho;
const fps = +(A.fps || (rascunho ? 12 : 30));
let W = +(A.largura || 720), H = +(A.altura || 1280);
if (rascunho) { W = Math.round(W / 2); H = Math.round(H / 2); }
const saida = path.resolve(A.saida || path.join(RAIZ, 'saida', `${nome}${rascunho ? '-rascunho' : ''}.mp4`));
const py = process.env.PYTHON || 'python3';

function rodar(cmd, args) {
  console.log('›', cmd, args.join(' '));
  const r = spawnSync(cmd, args, { stdio: 'inherit' });
  if (r.status !== 0) throw new Error(`${cmd} falhou (${r.status})`);
}

// 1) Narração (formato saga): gera narracao.wav + tempos.json
const temposArq = path.join(pastaTrab, 'tempos.json');
const vozArq = path.join(pastaTrab, 'narracao.wav');
if (formato === 'saga' && A['reusar-voz'] && fs.existsSync(temposArq)) {
  console.log('voz: reaproveitando', temposArq, '(apague-o ou rode sem --reusar-voz se mudou alguma fala)');
} else if (formato === 'saga') {
  const args = [path.join(MOTOR, 'voz.py'), roteiroAbs, pastaTrab];
  if (A['sem-voz']) args.push('--sem-voz');
  rodar(py, args);
}

// 2) Servidor local: /motor/* -> pasta do motor, resto -> raiz do projeto
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json',
  '.ttf': 'font/ttf', '.otf': 'font/otf', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.css': 'text/css' };
const servidor = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const base = p.startsWith('/motor/') ? MOTOR : RAIZ;
  const rel = p.startsWith('/motor/') ? p.slice(7) : p.slice(1);
  const f = path.resolve(base, rel);
  if (!f.startsWith(base) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' });
  fs.createReadStream(f).pipe(res);
});
await new Promise(r => servidor.listen(0, '127.0.0.1', r));
const porta = servidor.address().port;
const rel = p => '/' + path.relative(RAIZ, p).split(path.sep).join('/');
if (!path.relative(RAIZ, roteiroAbs) || path.relative(RAIZ, roteiroAbs).startsWith('..')) {
  console.error('O roteiro precisa estar dentro da pasta onde você roda o comando.'); process.exit(1);
}
let url = `http://127.0.0.1:${porta}/motor/${formato}.html?roteiro=${encodeURIComponent(rel(roteiroAbs))}&w=${W}&h=${H}&captura=1`;
if (formato === 'saga') url += `&tempos=${encodeURIComponent(rel(temposArq))}`;

// 3) Navegador
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.log('[página]', m.text()); });
page.on('pageerror', e => { console.error('[erro na página]', e.message); });
await page.goto(url);
await page.waitForFunction(() => window.__pronto === true || window.__erro, null, { timeout: 120000 });
const erro = await page.evaluate(() => window.__erro);
if (erro) { console.error('Erro ao montar o vídeo:', erro); await browser.close(); servidor.close(); process.exit(1); }
const duracao = await page.evaluate(() => window.__duracao);
const eventos = await page.evaluate(() => window.__eventos || []);
fs.writeFileSync(path.join(pastaTrab, 'eventos.json'), JSON.stringify({ duracao, eventos }, null, 1));

// Modo conferência: só alguns quadros em PNG
if (A.quadros) {
  const ts = String(A.quadros).split(',').map(Number);
  for (const t of ts) {
    await page.evaluate(t => window.__render(t), t);
    const f = path.join(pastaTrab, `quadro-${String(t).replace('.', '_')}s.png`);
    await page.screenshot({ path: f });
    console.log('quadro', f);
  }
  await browser.close(); servidor.close(); process.exit(0);
}

// 4) Trilha sonora
const trilha = path.join(pastaTrab, 'trilha.wav');
const aArgs = [path.join(MOTOR, 'audio.py'), roteiroAbs, path.join(pastaTrab, 'eventos.json'), trilha];
if (formato === 'saga' && fs.existsSync(vozArq)) aArgs.push('--voz', vozArq);
rodar(py, aArgs);

// 5) Quadros -> ffmpeg
const total = Math.ceil(duracao * fps);
const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
  '-i', trilha, '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', rascunho ? '26' : '18',
  '-pix_fmt', 'yuv420p', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-c:a', 'aac', '-b:a', '192k', '-ar', '44100',
  '-t', String(duracao), '-movflags', '+faststart', saida], { stdio: ['pipe', 'inherit', 'inherit'] });
const inicio = Date.now();
for (let i = 0; i < total; i++) {
  await page.evaluate(t => window.__render(t), i / fps);
  const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  if (i % (fps * 5) === 0) {
    const s = (Date.now() - inicio) / 1000;
    process.stdout.write(`\rquadro ${i}/${total}  (${(i / Math.max(s, 0.01)).toFixed(1)} q/s)   `);
  }
}
ff.stdin.end();
await new Promise(r => ff.on('close', r));
await browser.close();
servidor.close();
console.log(`\nPronto: ${saida}  (${duracao.toFixed(1)}s, ${W}x${H}, ${fps}fps)`);
