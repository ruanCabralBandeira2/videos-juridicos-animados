---
name: videos-juridicos-animados
description: Produz vídeos verticais animados (TikTok, Reels, Shorts) que explicam temas de Direito com suspense e humor, em dois formatos testados: "contagem" (3D, pergunta "E se...?", contador que escala, cartela "Calma:") e "saga" (2D com personagens, narração e legenda palavra a palavra, série em partes). Use sempre que pedirem vídeo, reel, TikTok, short, animação ou roteiro de vídeo sobre lei, direitos, advocacia ou um caso jurídico.
---

# Vídeos jurídicos animados

Esta skill transforma uma regra jurídica em um vídeo de 60 a 80 s que prende do primeiro ao último segundo, renderizado direto em MP4 (720×1280, 30 fps, áudio incluso). O padrão veio da análise de vídeos virais; os detalhes estão em `referencias/padroes-das-referencias.md`.

## Os dois formatos

| | **contagem** | **saga** |
|---|---|---|
| Inspiração | "E se o Sol explodisse?" | série "Andar 14" |
| Visual | plano-sequência 3D low-poly, câmera de drone | animação 2D chapada, cortes a cada 2 a 6 s |
| Voz | nenhuma; o texto é a voz | narração em 2ª pessoa |
| Motor de tensão | contador regressivo → número que explode | personagens + plano + virada + cliffhanger |
| Fecho | cartela "Calma:" com a saída legal | "PARTE N" + pergunta |
| Melhor para | **uma consequência** que escala com o tempo (juros, prazo, multa, penhora, revelia) | **uma situação** com pessoas e passos (vizinhança, aluguel, consumo, família), em série |

Na dúvida: se o tema cabe em "E se você [fizesse/ignorasse X]?" e tem um número que cresce, use **contagem**. Se tem personagens e um "como resolver", use **saga**.

## Instalação (uma vez por máquina)

```bash
bash <pasta-da-skill>/motor/setup.sh
```
Precisa de node 18+, python3 com numpy e ffmpeg. O script instala Playwright/Chromium, Three.js, as fontes e o edge-tts. Para voz de melhor qualidade no formato saga, exporte `ELEVENLABS_API_KEY` (e `ELEVENLABS_VOICE_ID`).

## Fluxo de trabalho

1. **Tema e base legal.** Defina a situação, a escalada e a saída. Liste cada número/prazo/percentual que vai aparecer com lei e artigo, e **confirme que estão vigentes** (é o trabalho do agente especialista: na dúvida, pesquise). Nunca invente número.
2. **Formato.** Use a tabela acima.
3. **Roteiro.** Leia `referencias/roteiro-e-humor.md` e escreva o roteiro inteiro em texto: gancho, legendas/falas, carimbos ou elementos, clímax/cliffhanger, cartela. Aplique os mecanismos de humor.
4. **Checklist OAB.** Passe o roteiro por `referencias/oab.md`. Corrija tudo o que falhar. Isso não é opcional: o vídeo representa um advogado.
5. **JSON.** Monte o roteiro em `roteiros/<nome>.json` dentro do projeto, seguindo `referencias/formato-contagem.md` ou `referencias/formato-saga.md`. Parta de um exemplo em `exemplos/roteiros/`.
   - contagem: escreva também a cena 3D em `cenas/<nome>.js` (parta de `exemplos/cenas/condominio.js`) e escolha um cenário reconhecível que combine com o tema.
6. **Conferir quadros antes de renderizar** (rápido):
   ```bash
   node <skill>/motor/render.mjs roteiros/<nome>.json --quadros 2,15,30,40,50,58,62,70
   ```
   Abra os PNGs em `saida/<nome>/` e **olhe para eles**: o texto está legível e sem cortes? Nada importante atrás da legenda? A câmera mostra céu em cima e o assunto no centro? A palavra colorida certa? Ajuste e repita.
7. **Renderizar:**
   ```bash
   node <skill>/motor/render.mjs roteiros/<nome>.json             # final → saida/<nome>.mp4
   node <skill>/motor/render.mjs roteiros/<nome>.json --rascunho  # 12 fps, meia resolução, para revisar o ritmo
   ```
   Opções: `--saida arq.mp4`, `--fps`, `--largura`/`--altura`, `--sem-voz`. **Tempo:** sem GPU (servidor/nuvem), o formato contagem renderiza a ~2 quadros/s (≈ 20 min para 78 s) e o saga a ~4 a 6 quadros/s; com GPU, é bem mais rápido. Rode em segundo plano e use `--quadros`/`--rascunho` para iterar. Rode sempre a partir da raiz do projeto (onde ficam `roteiros/` e `cenas/`). Para uma pré-visualização ao vivo, abra `motor/<formato>.html?roteiro=/roteiros/<nome>.json` num servidor local.
8. **Conferir o vídeo.** Extraia alguns quadros do MP4 (`ffmpeg -ss 30 -i saida/x.mp4 -frames:v 1 q.png`) e confira a duração (`ffprobe`). No formato saga, confira se a legenda acompanha a voz.
9. **Entregar** o MP4 junto com uma **legenda de post** (2 a 3 linhas, sem prometer resultado, terminando com a pergunta da cartela) e de 3 a 5 hashtags do tema.

## Regras que não se quebram

- Todo número na tela tem fonte na cartela. Personagens são fictícios e a cartela diz isso.
- Sem oferta de serviço, preço, promessa de resultado, autopromoção ou incentivo a processar alguém.
- Humor sobre a **situação**, nunca sobre pessoas, partes, juízes ou grupos.
- Legendas de contagem com até 7 palavras. Falas da saga com até 14 palavras por plano.
- Sempre olhe os quadros antes de entregar. Um vídeo com texto cortado ou ilegível não sai.

## Arquivos

```
SKILL.md
referencias/
  padroes-das-referencias.md  o que foi extraído dos vídeos de referência (estrutura, tempos, tipografia, som)
  roteiro-e-humor.md          temas, ganchos, punchlines, humor, regras de escrita (LEIA SEMPRE)
  oab.md                      checklist do Provimento 205/2021 (LEIA SEMPRE)
  formato-contagem.md         JSON + cena 3D + kit de peças
  formato-saga.md             JSON + peças 2D + fundos
motor/
  render.mjs                  orquestra voz → página → trilha → quadros → MP4
  contagem.html/.js, kit3d.js formato 3D (Three.js)
  saga.html/.js, saga-pecas.js formato 2D (SVG)
  comum.js                    utilitários (curvas, formatos de número, marcação de cor)
  voz.py                      narração (ElevenLabs | edge-tts | nenhuma) + tempo de cada palavra
  audio.py                    trilha sintetizada (ambiente, impactos, carimbos, pops); sem direitos autorais
  setup.sh                    instalação
exemplos/
  roteiros/condominio-contagem.json   + cenas/condominio.js
  roteiros/vizinho-pagode-saga.json
```
