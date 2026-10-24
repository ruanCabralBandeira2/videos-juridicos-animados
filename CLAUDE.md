# Contexto do projeto

Produção de vídeos verticais animados (TikTok, Reels, Shorts) sobre Direito brasileiro, com suspense e humor, para um perfil de advocacia. O motor de vídeo já existe e funciona. **Próxima etapa: criar o time de agentes** (ver abaixo).

## O que já está pronto

- **Skill `videos-juridicos-animados`** em `.claude/skills/videos-juridicos-animados/`. Leia o `SKILL.md` e as `referencias/` antes de qualquer trabalho com vídeo. Ela tem dois formatos:
  - **contagem**: 3D (Three.js), pergunta "E se...?", contador que escala, carimbos, clímax com tela rachada e cartela "Calma:" com a saída legal. Sem narração. Inspirado em "E se o Sol explodisse?".
  - **saga**: 2D (SVG), narração, legenda palavra a palavra com destaque em vermelho/amarelo, personagens com ficha, inventário, cronômetros e cliffhanger "PARTE N". Inspirado na série "Andar 14".
- **Exemplos renderizados** em `videos-exemplo/`. O da saga está **sem voz**: foi gerado num ambiente sem acesso a serviços de voz.
- **Roteiros e cena de exemplo** em `roteiros/` e `cenas/`, que são as pastas de trabalho.

## Como renderizar (sempre a partir da raiz do repositório)

```bash
bash .claude/skills/videos-juridicos-animados/motor/setup.sh      # uma vez por máquina
node .claude/skills/videos-juridicos-animados/motor/render.mjs roteiros/X.json --quadros 2,20,45,62   # conferir PNGs
node .claude/skills/videos-juridicos-animados/motor/render.mjs roteiros/X.json                         # MP4 em saida/X.mp4
```
Voz (formato saga): `ELEVENLABS_API_KEY` (+ `ELEVENLABS_VOICE_ID`) para ElevenLabs; sem chave, usa edge-tts (grátis, `pt-BR-AntonioNeural`). `--reusar-voz` re-renderiza sem gerar a narração de novo.

## Próxima etapa: time de agentes (`.claude/agents/`)

1. **jurista**: recebe um tema, pesquisa na base de leis do usuário (repositório com a legislação brasileira; perguntar o caminho se não estiver aqui), confirma vigência e entrega uma **ficha de base legal** com cada regra, número, prazo e percentual que pode aparecer no vídeo, com lei + artigo + trecho literal. Nunca inventa número; se não achar, diz que não achou.
2. **roteirista**: com a ficha, escreve o roteiro seguindo `referencias/roteiro-e-humor.md` (gancho, escalada, humor, "Calma:" ou cliffhanger), escolhe o formato e monta o JSON (e a cena 3D, no formato contagem).
3. **revisor**: independente; confere o roteiro contra a ficha (todo número na tela tem fonte) e contra `referencias/oab.md` (Provimento 205/2021). Reprova e devolve com correções quando algo falhar.
4. **produtor**: renderiza, confere os quadros (olhando os PNGs) antes do render final e entrega o MP4 + legenda de post + hashtags.

**Primeiro passo sugerido:** rodar o `setup.sh` e renderizar `roteiros/vizinho-pagode-saga.json` **com voz** para validar a narração antes de criar os agentes.

## Pendências conhecidas
- A narração nunca foi testada com voz real, só com voz simulada (a sincronia funcionou). Conferir se a legenda acompanha a fala.
- Os números jurídicos dos exemplos devem ser conferidos na base de leis: condomínio (CC 1.336 §1º: multa 2%, juros 1% a.m.; CPC 784 X, 829 e 916; Lei 8.009/90 art. 3º IV) e vizinho (CC 1.277 e 1.337; LCP art. 42).
- Valores como "R$1.000" na fala podem desalinhar a legenda: escreva números por extenso nas falas.
- Sem GPU, o formato contagem renderiza a ~2 quadros/s; com GPU, é bem mais rápido.

## Regras do projeto
- Conteúdo informativo, personagens fictícios, todo número com fonte na cartela.
- Sem oferta de serviço, preço, promessa de resultado ou incentivo a processar (Provimento 205/2021).
- Humor sobre a situação, nunca sobre pessoas reais, partes, juízes ou grupos.
