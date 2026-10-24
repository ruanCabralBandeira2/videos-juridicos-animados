// Kit de peças low-poly para montar cenas do formato "contagem".
// Toda peça é criada em metros, com Y para cima. Cor como número hex (0xRRGGBB) ou string css.
import * as THREE from 'three';
import { clamp, lerp } from './comum.js';

export function criarKit(scene, rnd) {
  const cacheMat = new Map();
  const atualizaveis = [];
  const mat = (cor, o = {}) => {
    const k = String(cor) + JSON.stringify(o);
    if (!cacheMat.has(k)) cacheMat.set(k, new THREE.MeshStandardMaterial({ color: cor, flatShading: true, roughness: .88, metalness: 0, ...o }));
    return cacheMat.get(k);
  };
  const malha = (geo, cor, o) => { const m = new THREE.Mesh(geo, cor instanceof THREE.Material ? cor : mat(cor, o)); m.castShadow = true; m.receiveShadow = true; return m; };
  const caixa = (w, h, d, cor, o) => { const m = malha(new THREE.BoxGeometry(w, h, d), cor, o); m.geometry.translate(0, h / 2, 0); return m; };
  const por = (obj, x = 0, y = 0, z = 0, pai = scene) => { obj.position.set(x, y, z); pai.add(obj); return obj; };
  const grupo = (pai = scene) => { const g = new THREE.Group(); pai.add(g); return g; };
  const cor = c => new THREE.Color(c);

  function texturaTexto(texto, { w = 1024, h = 256, fundo = '#f4efe6', corTexto = '#222', fonte = '700 120px Inter, Arial', borda = 0 } = {}) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d');
    g.fillStyle = fundo; g.fillRect(0, 0, w, h);
    if (borda) { g.strokeStyle = corTexto; g.lineWidth = borda; g.strokeRect(borda, borda, w - 2 * borda, h - 2 * borda); }
    g.fillStyle = corTexto; g.textAlign = 'center'; g.textBaseline = 'middle';
    const linhas = String(texto).split('\n'); const lh = h / (linhas.length + .4);
    // reduz a fonte até caber na largura (92%) e na altura da linha
    let px = parseFloat(fonte.match(/(\d+(?:\.\d+)?)px/)[1]);
    const comPx = n => fonte.replace(/\d+(?:\.\d+)?px/, n + 'px');
    g.font = comPx(px);
    while (px > 8 && (Math.max(...linhas.map(l => g.measureText(l).width)) > w * .92 || px > lh * .8)) { px -= 4; g.font = comPx(px); }
    linhas.forEach((l, i) => g.fillText(l, w / 2, h / 2 + (i - (linhas.length - 1) / 2) * lh));
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
  }

  const kit = {
    THREE, scene, rnd, mat, malha, caixa, por, grupo, cor, texturaTexto,
    aoAtualizar(fn) { atualizaveis.push(fn); },
    atualizar(s) { for (const f of atualizaveis) f(s); },

    // Céu em degradê que muda com o perigo (0..1). cores: {topo, base, topoPerigo, basePerigo}
    ceu({ topo = 0x6f93c9, base = 0xf4d9b8, topoPerigo = 0x3a1a12, basePerigo = 0xd9733a, neblina = [60, 260] } = {}) {
      const u = { topo: { value: cor(topo) }, base: { value: cor(base) } };
      const m = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, uniforms: u,
        vertexShader: 'varying vec3 p; void main(){ p = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
        fragmentShader: 'uniform vec3 topo; uniform vec3 base; varying vec3 p; void main(){ float h = clamp(p.y*1.6+.15,0.,1.); gl_FragColor = vec4(mix(base, topo, pow(h,.8)),1.); }' });
      const ceu = new THREE.Mesh(new THREE.SphereGeometry(900, 24, 16), m); scene.add(ceu);
      scene.fog = new THREE.Fog(cor(base), neblina[0], neblina[1]);
      const c = [cor(topo), cor(base), cor(topoPerigo), cor(basePerigo)];
      kit.aoAtualizar(s => {
        const d = clamp(s.perigo);
        u.topo.value.copy(c[0]).lerp(c[2], d); u.base.value.copy(c[1]).lerp(c[3], d);
        scene.fog.color.copy(u.base.value);
        scene.fog.near = lerp(neblina[0], neblina[0] * .35, d); scene.fog.far = lerp(neblina[1], neblina[1] * .55, d);
      });
      return ceu;
    },

    // Sol + luz ambiente. A luz esquenta e escurece com o perigo.
    luzes({ sol = [40, 60, 30], intensidade = 2.6, corSol = 0xfff1dc, ambiente = 1.1, sombra = 60 } = {}) {
      const hemi = new THREE.HemisphereLight(0xdfe9ff, 0x9a8466, ambiente); scene.add(hemi);
      const dir = new THREE.DirectionalLight(corSol, intensidade); dir.position.set(...sol);
      dir.castShadow = true; dir.shadow.mapSize.set(2048, 2048); dir.shadow.bias = -0.0004;
      Object.assign(dir.shadow.camera, { left: -sombra, right: sombra, top: sombra, bottom: -sombra, near: 1, far: 400 });
      scene.add(dir);
      const c0 = cor(corSol), c1 = cor(0xff7a3a);
      kit.aoAtualizar(s => { const d = clamp(s.perigo); dir.color.copy(c0).lerp(c1, d); dir.intensity = intensidade * (1 - d * .25); hemi.intensity = ambiente * (1 - d * .45); });
      return { hemi, dir };
    },

    chao(w = 400, d = 400, c = 0xd8c9a8) { const m = malha(new THREE.PlaneGeometry(w, d), c); m.rotation.x = -Math.PI / 2; m.castShadow = false; scene.add(m); return m; },

    rua({ x = 0, z = 0, comp = 200, larg = 8, rot = 0, faixa = true } = {}) {
      const g = grupo(); g.position.set(x, 0, z); g.rotation.y = rot;
      const asf = malha(new THREE.PlaneGeometry(larg, comp), 0x3d3f45); asf.rotation.x = -Math.PI / 2; asf.position.y = .02; asf.castShadow = false; g.add(asf);
      for (const s of [-1, 1]) { const c = caixa(2.2, .18, comp, 0xc9c3b6); c.position.x = s * (larg / 2 + 1.1); g.add(c); }
      if (faixa) for (let i = -comp / 2; i < comp / 2; i += 6) { const f = malha(new THREE.PlaneGeometry(.25, 2.6), 0xf2e6c9); f.rotation.x = -Math.PI / 2; f.position.set(0, .03, i); f.castShadow = false; g.add(f); }
      return g;
    },

    // Prédio com grade de janelas. acesas = fração de janelas com luz. As luzes vão apagando com o perigo se apagaComPerigo.
    predio({ x = 0, z = 0, andares = 8, larg = 8, prof = 8, alturaAndar = 3, cor: c = 0xe9dfcf, corJanela = 0x34445a, corLuz = 0xffd99a, acesas = .35, apagaComPerigo = true, rot = 0, telhado = 0xb9ad98 } = {}) {
      const g = grupo(); g.position.set(x, 0, z); g.rotation.y = rot;
      const h = andares * alturaAndar;
      g.add(caixa(larg, h, prof, c));
      const t = caixa(larg * 1.04, .5, prof * 1.04, telhado); t.position.y = h; g.add(t);
      const janelas = [];
      const nx = Math.max(1, Math.floor(larg / 2.2)), nz = Math.max(1, Math.floor(prof / 2.2));
      const geoJ = new THREE.PlaneGeometry(1.1, 1.5);
      const faces = [[0, prof / 2 + .02, 0, nx, larg], [Math.PI, -prof / 2 - .02, 0, nx, larg], [Math.PI / 2, larg / 2 + .02, 1, nz, prof], [-Math.PI / 2, -larg / 2 - .02, 1, nz, prof]];
      for (const [ry, off, eixo, n, span] of faces) for (let a = 0; a < andares; a++) for (let i = 0; i < n; i++) {
        const acesa = rnd() < acesas;
        const m = new THREE.MeshStandardMaterial({ color: acesa ? corLuz : corJanela, emissive: acesa ? corLuz : 0x000000, emissiveIntensity: acesa ? .9 : 0, flatShading: true, roughness: .4 });
        const j = new THREE.Mesh(geoJ, m); j.rotation.y = ry;
        const pos = (i + .5) / n * span - span / 2;
        if (eixo === 0) j.position.set(pos, a * alturaAndar + alturaAndar * .55, off); else j.position.set(off, a * alturaAndar + alturaAndar * .55, -pos * Math.sign(off));
        g.add(j); if (acesa) janelas.push({ m, limiar: rnd() });
      }
      if (apagaComPerigo) kit.aoAtualizar(s => { for (const j of janelas) { const on = s.perigo < .2 + j.limiar * .8; j.m.emissiveIntensity = on ? .9 : 0; j.m.color.set(on ? corLuz : corJanela); } });
      g.userData = { altura: h, larg, prof };
      return g;
    },

    // Placa com texto (fachada, letreiro). Retorna o mesh plano.
    placa(texto, { x = 0, y = 3, z = 0, w = 6, h = 1.4, rot = 0, fundo = '#f4efe6', corTexto = '#2b2b2b', fonte = '800 120px Inter, Arial', pai = scene } = {}) {
      const t = texturaTexto(texto, { w: 1024, h: Math.round(1024 * h / w), fundo, corTexto, fonte });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, roughness: .7 }));
      m.position.set(x, y, z); m.rotation.y = rot; pai.add(m); return m;
    },

    arvore({ x = 0, z = 0, alt = 4, c = 0x5f8f4e } = {}) {
      const g = grupo(); g.position.set(x, 0, z);
      g.add(caixa(.35, alt * .45, .35, 0x7a5a3c));
      const copa = malha(new THREE.IcosahedronGeometry(alt * .32, 0), c); copa.position.y = alt * .7; g.add(copa);
      return g;
    },
    palmeira({ x = 0, z = 0, alt = 7 } = {}) {
      const g = grupo(); g.position.set(x, 0, z);
      const tr = caixa(.3, alt, .3, 0x8a6a48); tr.rotation.z = .08; g.add(tr);
      for (let i = 0; i < 6; i++) { const f = caixa(.25, .08, 3, 0x4f8a3e); f.position.y = alt; f.rotation.y = i / 6 * Math.PI * 2; f.rotation.x = -.35; f.geometry.translate(0, 0, 1.5); g.add(f); }
      return g;
    },

    carro({ x = 0, z = 0, rot = 0, c = 0xc0392b } = {}) {
      const g = grupo(); g.position.set(x, 0, z); g.rotation.y = rot;
      const b = caixa(1.9, .8, 4.2, c); b.position.y = .35; g.add(b);
      const t = caixa(1.6, .65, 2.2, 0xdde6ee); t.position.set(0, 1.15, -.2); g.add(t);
      for (const [a, bb] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const r = malha(new THREE.CylinderGeometry(.38, .38, .3, 10), 0x1e1e1e); r.rotation.z = Math.PI / 2; r.position.set(a * .95, .38, bb * 1.35); g.add(r); }
      return g;
    },

    // Pessoa estilizada (cápsula + cabeça). Balança levemente; com perigo alto, tremem.
    pessoa({ x = 0, z = 0, c, pele, rot, escala = 1, pai = scene, panico = true } = {}) {
      const cores = [0xe74c3c, 0x3498db, 0xf1c40f, 0x2ecc71, 0x9b59b6, 0xe67e22, 0x1abc9c, 0xecf0f1, 0x34495e];
      const peles = [0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524, 0xffdbac];
      const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot ?? rnd() * Math.PI * 2; g.scale.setScalar(escala * (.9 + rnd() * .2)); pai.add(g);
      const corpo = malha(new THREE.CapsuleGeometry(.24, .75, 3, 8), c ?? cores[Math.floor(rnd() * cores.length)]); corpo.position.y = .62; g.add(corpo);
      const cab = malha(new THREE.SphereGeometry(.2, 10, 8), pele ?? peles[Math.floor(rnd() * peles.length)]); cab.position.y = 1.32; g.add(cab);
      const fase = rnd() * 10, vel = 1.5 + rnd() * 2;
      kit.aoAtualizar(s => { const tremor = panico ? Math.max(0, s.perigo - .5) * .12 : 0;
        g.position.y = Math.abs(Math.sin(s.t * vel + fase)) * .04; g.rotation.z = Math.sin(s.t * 31 + fase) * tremor; });
      return g;
    },
    multidao({ n = 40, x0 = -10, x1 = 10, z0 = -10, z1 = 10, ...o } = {}) {
      const g = []; for (let i = 0; i < n; i++) g.push(kit.pessoa({ x: lerp(x0, x1, rnd()), z: lerp(z0, z1, rnd()), ...o })); return g;
    },

    // Interior estilo diorama: piso + duas paredes.
    sala({ x = 0, z = 0, w = 10, d = 10, h = 4, parede = 0xe8dcc6, piso = 0xa8794f, rodape = 0x6b4a2f } = {}) {
      const g = grupo(); g.position.set(x, 0, z);
      const p = caixa(w, .2, d, piso); p.position.y = -.2; g.add(p);
      const a = caixa(w, h, .25, parede); a.position.z = -d / 2; g.add(a);
      const b = caixa(.25, h, d, parede); b.position.x = -w / 2; g.add(b);
      const r1 = caixa(w, .3, .3, rodape); r1.position.z = -d / 2 + .15; g.add(r1);
      const r2 = caixa(.3, .3, d, rodape); r2.position.x = -w / 2 + .15; g.add(r2);
      return g;
    },
    mesa({ x = 0, z = 0, w = 2.4, d = 1.2, h = 1, c = 0x8a5a36, pai = scene } = {}) {
      const g = new THREE.Group(); g.position.set(x, 0, z); pai.add(g);
      const t = caixa(w, .1, d, c); t.position.y = h - .1; g.add(t);
      for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const p = caixa(.1, h - .1, .1, c); p.position.set(a * (w / 2 - .1), 0, b * (d / 2 - .1)); g.add(p); }
      return g;
    },
    // Bancada de juiz / balcão.
    bancada({ x = 0, z = 0, w = 5, h = 1.6, d = 1.4, c = 0x6e4228 } = {}) {
      const g = grupo(); g.position.set(x, 0, z);
      g.add(caixa(w, h, d, c)); const tampo = caixa(w + .3, .12, d + .3, 0x4e2c18); tampo.position.y = h; g.add(tampo);
      return g;
    },
    martelo({ x = 0, y = 1, z = 0, pai = scene } = {}) {
      const g = new THREE.Group(); g.position.set(x, y, z); pai.add(g);
      const cab = malha(new THREE.CylinderGeometry(.13, .13, .5, 10), 0x5a3420); cab.rotation.z = Math.PI / 2; cab.position.y = .3; g.add(cab);
      const cabo = caixa(.06, .5, .06, 0x7a4a2c); cabo.rotation.x = Math.PI / 2.2; cabo.position.set(0, .3, .25); g.add(cabo);
      return g;
    },
    // Relógio de parede: ponteiros giram rápido conforme o perigo.
    relogio({ x = 0, y = 3, z = 0, raio = .6, rot = 0, pai = scene } = {}) {
      const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = rot; pai.add(g);
      const f = malha(new THREE.CylinderGeometry(raio, raio, .1, 24), 0xf6f1e7); f.rotation.x = Math.PI / 2; g.add(f);
      const aro = malha(new THREE.TorusGeometry(raio, .06, 6, 24), 0x2b2b2b); g.add(aro);
      const pH = caixa(.06, raio * .5, .03, 0x111111); pH.position.z = .08; g.add(pH);
      const pM = caixa(.04, raio * .8, .03, 0xc0392b); pM.position.z = .09; g.add(pM);
      kit.aoAtualizar(s => { const v = s.t * (1 + s.perigo * 30); pM.rotation.z = -v * 1.2; pH.rotation.z = -v * .1; });
      return g;
    },
    // Pilha de papéis que cresce com o perigo (até "max" folhas).
    pilhaPapel({ x = 0, z = 0, max = 60, larg = .8, prof = 1.1, pai = scene } = {}) {
      const g = new THREE.Group(); g.position.set(x, 0, z); pai.add(g);
      const folhas = [];
      for (let i = 0; i < max; i++) { const f = caixa(larg, .035, prof, i % 7 === 3 ? 0xf3d2c9 : 0xf7f4ec); f.position.y = i * .04; f.rotation.y = (rnd() - .5) * .35; f.visible = false; g.add(f); folhas.push(f); }
      kit.aoAtualizar(s => { const n = Math.floor(clamp(s.perigo) * max); folhas.forEach((f, i) => f.visible = i < n); });
      return g;
    },
    // Chuva de papéis/boletos. Quantidade ativa proporcional ao perigo.
    papeisCaindo({ n = 260, x0 = -20, x1 = 20, z0 = -20, z1 = 20, topo = 30, cores = [0xf7f4ec, 0xf7f4ec, 0xf3d2c9, 0xfff3c4] } = {}) {
      const geo = new THREE.PlaneGeometry(.45, .6);
      const lista = [];
      for (let i = 0; i < n; i++) {
        const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: cores[i % cores.length], emissive: cores[i % cores.length], emissiveIntensity: .35, side: THREE.DoubleSide, roughness: .9 }));
        m.castShadow = true; scene.add(m);
        lista.push({ m, x: lerp(x0, x1, rnd()), z: lerp(z0, z1, rnd()), fase: rnd() * 100, vel: 1.4 + rnd() * 1.6, limiar: rnd() });
      }
      kit.aoAtualizar(s => {
        for (const p of lista) {
          const ativo = s.perigo > .12 && p.limiar < (s.perigo - .1) * 1.15;
          p.m.visible = ativo; if (!ativo) continue;
          const ciclo = (s.t * p.vel + p.fase) % (topo / 1);
          const y = topo - (ciclo / (topo / 1)) * topo;
          p.m.position.set(p.x + Math.sin(s.t * 1.3 + p.fase) * 1.2, Math.max(.05, y), p.z + Math.cos(s.t * 1.1 + p.fase) * 1.2);
          p.m.rotation.set(s.t * 2 + p.fase, s.t * 1.3 + p.fase, s.t * .7);
        }
      });
      return lista;
    },
    // Fumaça/poeira escura que sobe com o perigo.
    fumaca({ x = 0, z = 0, n = 18, c = 0x3a3330 } = {}) {
      const geo = new THREE.IcosahedronGeometry(1, 0); const lista = [];
      for (let i = 0; i < n; i++) { const m = malha(geo, c, { transparent: true, opacity: .8 }); m.castShadow = false; scene.add(m); lista.push({ m, fase: rnd(), dx: (rnd() - .5) * 4 }); }
      kit.aoAtualizar(s => { for (const p of lista) { const k = (s.t * .08 + p.fase) % 1; const on = s.perigo > .35;
        p.m.visible = on; p.m.position.set(x + p.dx + k * 3, k * 30, z); p.m.scale.setScalar((.6 + k * 4) * clamp((s.perigo - .35) * 2)); } });
      return lista;
    },
  };
  return kit;
}
