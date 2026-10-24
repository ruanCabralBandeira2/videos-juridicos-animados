# Vídeos jurídicos animados

Motor e skill para produzir vídeos verticais (720×1280, 30 fps, com áudio) que explicam temas de Direito com suspense e humor.

| Formato | Estilo | Exemplo |
|---|---|---|
| **contagem** | 3D, "E se...?", contador que escala, cartela "Calma:" | `videos-exemplo/exemplo-contagem-condominio.mp4` |
| **saga** | 2D, narração, legenda palavra a palavra, série em partes | `videos-exemplo/exemplo-saga-vizinho-sem-voz.mp4` (gerado sem voz) |

## Começar

Requisitos: Node 18+, Python 3 com numpy, ffmpeg.

```bash
bash .claude/skills/videos-juridicos-animados/motor/setup.sh
node .claude/skills/videos-juridicos-animados/motor/render.mjs roteiros/condominio-contagem.json
```

O vídeo sai em `saida/`. Documentação completa: `.claude/skills/videos-juridicos-animados/SKILL.md`.

## Estrutura

```
.claude/skills/videos-juridicos-animados/   skill (instruções, referências, motor)
roteiros/                                   roteiros JSON (um por vídeo)
cenas/                                      cenas 3D do formato contagem
videos-exemplo/                             vídeos de teste
CLAUDE.md                                   contexto e próximos passos para o Claude Code
```

Fontes EB Garamond e Oswald (SIL OFL 1.1) e Three.js (MIT) incluídos em `motor/`. Trilha sonora sintetizada pelo próprio motor, sem direitos autorais de terceiros.
