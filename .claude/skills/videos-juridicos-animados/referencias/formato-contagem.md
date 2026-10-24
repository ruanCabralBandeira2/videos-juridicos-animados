# Formato "contagem": referência técnica

Plano-sequência 3D (Three.js), sem narração. Exemplo completo: `exemplos/roteiros/condominio-contagem.json` + `exemplos/cenas/condominio.js`.

## Roteiro JSON

```jsonc
{
  "formato": "contagem",
  "estilo": "serif",            // "serif" (padrão, EB Garamond itálico) | "sans" (Inter pesada)
  "cena": "../cenas/minha-cena.js", // caminho relativo ao JSON
  "duracao": 78,
  "semente": 11,                // muda a distribuição aleatória (prédios, pessoas, rachaduras)
  "tempos": { "gancho": 4.5, "virada": 34, "climax": 60, "fade": 64.5, "cartela": 66.5 }, // opcional; estes são os padrões
  "cores": { "acento": "#ff6b3d", "ouro": "#f2c66d" },  // opcional
  "gancho": { "pre": "E se", "texto": "você parasse de pagar o condomínio?" },
  "hud1": {                     // medidor do ato 1 (gancho -> virada)
    "rotulo": "O BOLETO VENCE EM", "de": 30, "ate": 0,
    "formato": "dias",          // mmss | hhmmss | dias | moeda | numero | decimal
    "curva": "suspense",        // linear | suspense | exponencial | acelerando | suave | degraus
    "sub": "VOCÊ JÁ DECIDIU NÃO PAGAR"   // linha laranja
  },
  "hud2": {                     // medidor do ato 2 (virada -> clímax)
    "rotulo": "VOCÊ DEVE", "de": 850, "ate": 48700, "formato": "moeda", "curva": "exponencial",
    "sub": "E CONTANDO",
    "contador": { "prefixo": "ATRASO: ", "de": 0, "ate": 36, "formato": "numero", "unidade": " MESES" } // linha extra opcional
  },
  "legendas": [ { "t": 5.2, "texto": "No começo, nada acontece." } ],  // t em segundos; some antes da próxima. **x** = dourado
  "carimbos": [ { "t": 35, "texto": "MULTA 2%" } ],   // x, y (%), rot opcionais
  "climax": { "sobre": "SEU APARTAMENTO", "palavra": "VENDIDO" },
  "cartela": { "calma": "Calma: ...", "pergunta": "...?", "fonte": "Lei, art.\nConteúdo informativo.", "assinatura": "@perfil" },
  "ambiente": "cidade",         // som de fundo: cidade | praia | sala | escritorio
  "tique": true                 // tique-taque do relógio no ato 1
}
```

**Tempos das legendas:** ato 1 de 5 a 6 legendas entre `gancho+0.7` e `virada-2`; ato 2 de 6 a 7 legendas entre `virada+0.4` e `climax-2`. Deixe pelo menos 3,5 s por legenda (4–5 s é o ideal). Carimbos 0,5 s depois da legenda que eles "carimbam".

**Formatos de número:** `dias` mostra "30 dias" e, abaixo de 1 dia, vira relógio 23:59:59 (os segundos finais correm em tempo real com a curva `suspense`). `moeda` usa R$ com centavos até R$ 100 mil. `degraus` (com `"degraus": n`) avança em saltos.

## Cena 3D (arquivo .js)

```js
export default function ({ THREE, scene, camera, kit, R, rnd }) {
  kit.ceu({ topo, base, topoPerigo, basePerigo, neblina: [perto, longe] });
  kit.luzes({ sol: [x, y, z], intensidade });
  kit.chao(600, 600, 0xcfc6b0);
  // ... peças ...
  return {
    camera: { de: { pos: [x,y,z], alvo: [x,y,z] }, ate: { pos, alvo }, fov: 50, tremor: 1 },
    atualizar(s) { /* s.t, s.perigo 0..1, s.fase, s.p1, s.p2 */ },
  };
}
```

A câmera vai de `de` até `ate` entre 0 s e o clímax, com suavização. **Enquadramento:** deixe o céu ocupando o terço de cima (é onde ficam o medidor e os carimbos) e o assunto principal no centro. `fov` entre 45 e 55 para vertical. Comece alto e longe e termine mais perto e mais baixo.

`s.perigo` vai de 0 (calma) até 1 (clímax) e é o que dirige a degradação: o céu escurece e avermelha, as luzes das janelas apagam, a chuva de papéis aumenta, as pessoas tremem, a fumaça sobe, a pilha de papel cresce, a imagem ganha sépia e vinheta. Use `atualizar(s)` para efeitos próprios (rachar uma placa, um carro indo embora, uma luz piscando).

### Peças do kit (`kit.*`)
Unidades em metros, Y para cima, cores `0xRRGGBB`.

| Peça | Parâmetros principais | Reage ao perigo |
|---|---|---|
| `ceu({topo, base, topoPerigo, basePerigo, neblina})` | degradê + neblina | sim, muda de cor |
| `luzes({sol, intensidade, corSol, ambiente})` | sol com sombra | esquenta e escurece |
| `chao(w, d, cor)` | plano | |
| `rua({x, z, comp, larg, rot, faixa})` | asfalto, calçadas, faixa | |
| `predio({x, z, andares, larg, prof, cor, acesas, apagaComPerigo, rot})` | caixa + janelas | as janelas apagam |
| `placa(texto, {x, y, z, w, h, rot, fundo, corTexto, fonte, pai})` | letreiro com texto ajustado | |
| `arvore`, `palmeira`, `carro({c, rot})` | | |
| `pessoa({x, z, c, pele, rot, escala, panico})`, `multidao({n, x0, x1, z0, z1})` | bonecos cápsula | tremem acima de 0,5 |
| `sala({w, d, h, parede, piso})` | diorama de interior (piso + 2 paredes) | |
| `mesa`, `bancada` (juiz/balcão), `martelo` | | |
| `relogio({x, y, z, raio, rot})` | relógio de parede | ponteiros disparam |
| `pilhaPapel({x, z, max})` | pilha de folhas | cresce |
| `papeisCaindo({n, x0, x1, z0, z1, topo})` | chuva de boletos/folhas | quantidade aumenta |
| `fumaca({x, z, n, c})` | | sobe a partir de 0,35 |
| `caixa(w,h,d,cor)`, `malha(geo,cor)`, `por(obj,x,y,z,pai)`, `grupo()`, `mat(cor)` | primitivas | |
| `aoAtualizar(fn)` | registra uma função chamada a cada quadro com `s` | |

**Cenários que funcionam para temas jurídicos:** rua com prédio/condomínio (dívidas, vizinhança), sala de estar em diorama (contratos, herança, consumidor), fachada de loja (consumidor), estacionamento/rua com carros (trânsito, seguro), fórum com escadaria (`predio` largo + `placa('FÓRUM')`), escritório com relógio e pilha de papéis (prazos, trabalhista). O lugar deve ser reconhecível e calmo no começo.

Para conferir o enquadramento: `node <skill>/motor/render.mjs roteiros/x.json --quadros 2,20,45,58` e abrir os PNGs em `saida/x/`.
