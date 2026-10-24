// Cena: rua de bairro com o "Edifício Sossego" no centro. Câmera de drone se aproximando devagar.
// Contrato: export default function({ THREE, scene, camera, kit, R, rnd }) -> { camera, atualizar(s) }
// s = { t, perigo (0..1), fase ('gancho'|'ato1'|'ato2'|'climax'|'cartela'), p1, p2 }
export default function ({ kit, rnd }) {
  kit.ceu({ topo: 0x7fa6d8, base: 0xf6dcc0, topoPerigo: 0x2c1712, basePerigo: 0xc8642e, neblina: [70, 300] });
  kit.luzes({ sol: [-50, 70, 40], intensidade: 2.8 });
  kit.chao(600, 600, 0xcfc6b0);
  kit.rua({ x: 0, z: 14, comp: 400, larg: 9, rot: Math.PI / 2 });

  // prédio principal
  const p = kit.predio({ x: 0, z: -4, andares: 11, larg: 12, prof: 10, cor: 0xefe4d2, acesas: .45 });
  kit.placa('EDIFÍCIO SOSSEGO', { x: 0, y: 4.2, z: 1.06, w: 7.5, h: 1.2, fundo: '#2f3b4a', corTexto: '#f4efe6' });
  // portaria
  const port = kit.caixa(4, 2.6, 2.4, 0xd9cdb8); kit.por(port, 0, 0, 3.2);
  kit.placa('PORTARIA', { x: 0, y: 2.0, z: 4.42, w: 2.6, h: .55, fundo: '#f4efe6', corTexto: '#2b2b2b' });
  // portão e muro
  for (const s of [-1, 1]) { const m = kit.caixa(9, 1.4, .4, 0xbfb19a); kit.por(m, s * 7.5, 0, 5.2); }
  // pilha de boletos na portaria (cresce com o perigo)
  kit.pilhaPapel({ x: 3.2, z: 6.2, max: 70 });

  // vizinhança
  const cores = [0xd7c6ad, 0xc9d4d8, 0xe3d3c3, 0xcdbfa8, 0xdcd0bd];
  for (let i = 0; i < 14; i++) {
    const lado = i % 2 ? 1 : -1, x = lado * (16 + Math.floor(i / 2) * 11 + rnd() * 3), z = -8 - rnd() * 20;
    kit.predio({ x, z, andares: 4 + Math.floor(rnd() * 10), larg: 8 + rnd() * 4, prof: 8 + rnd() * 3, cor: cores[i % cores.length], acesas: .3 });
  }
  for (let i = 0; i < 24; i++) kit.predio({ x: (rnd() - .5) * 260, z: -50 - rnd() * 120, andares: 5 + Math.floor(rnd() * 14), larg: 9 + rnd() * 6, prof: 9, cor: cores[i % cores.length], acesas: .25 });
  for (let x = -60; x <= 60; x += 7) if (Math.abs(x) > 6) kit.arvore({ x: x + rnd() * 2, z: 8 + rnd(), alt: 3.5 + rnd() * 1.5 });
  for (let i = 0; i < 6; i++) kit.carro({ x: -40 + i * 15 + rnd() * 5, z: 12 + (i % 2) * 3.5, rot: Math.PI / 2, c: [0xc0392b, 0x2e86c1, 0xf4d03f, 0x7f8c8d, 0x27ae60, 0xecf0f1][i] });

  // moradores na calçada (alheios a tudo)
  kit.multidao({ n: 26, x0: -22, x1: 22, z0: 7, z1: 10 });
  // o síndico, de camisa amarela, perto da portaria
  kit.pessoa({ x: -2.6, z: 5.8, c: 0xf1c40f, rot: .4, escala: 1.15, panico: false });

  kit.papeisCaindo({ n: 320, x0: -26, x1: 26, z0: -14, z1: 16, topo: 34 });
  kit.fumaca({ x: 18, z: -30 });

  return {
    camera: { de: { pos: [34, 26, 92], alvo: [0, 15, -20] }, ate: { pos: [16, 12, 44], alvo: [0, 13, -6] }, fov: 52 },
    atualizar(s) {},
  };
}
