# Formato "saga": referência técnica

Animação 2D vetorial com narração, cortes rápidos, legenda palavra a palavra e cliffhanger. Exemplo completo: `exemplos/roteiros/vizinho-pagode-saga.json`.

## Roteiro JSON

```jsonc
{
  "formato": "saga",
  "semente": 4,
  "voz": {
    "provedor": "",            // "" = automático (ElevenLabs se houver chave; senão edge-tts; senão sem voz)
    "voz": "",                 // ElevenLabs: voice_id | edge: "pt-BR-AntonioNeural", "pt-BR-FranciscaNeural", "pt-BR-ThalitaMultilingualNeural"
    "velocidade": 1.08,        // ElevenLabs (0.7–1.2)
    "taxa": "+14%",            // edge-tts
    "pausa": 0.12              // silêncio entre planos (s); +0,18 s após ponto final
  },
  "palavrasPorLegenda": 3,
  "tom": 55,                   // nota grave do tapete sonoro (Hz)
  "planos": [
    {
      "fala": "Se o seu vizinho liga o *pagode* toda noite, não desça pra brigar.",
      "fundo": "cidade-noite",  // ver lista abaixo
      "zoom": [1.0, 1.06],      // zoom lento do plano (padrão)
      "foco": [540, 960],       // centro do zoom
      "tremor": 0,              // 0–1 tremor contínuo da câmera
      "flash": false,           // clarão branco no corte
      "legenda": "meio",        // meio (padrão, 64% da altura) | alto | baixo
      "elementos": [ { "tipo": "predio", "x": 540, "y": 1500 } ]
    }
  ],
  "final": { "parte": "PARTE 2", "pergunta": "O que o Valdir vai fazer?", "cta": "Siga para a próxima assembleia",
             "serie": "PRÉDIO DO VALDIR", "fonte": "CC, arts. ... · Personagens fictícios. Conteúdo informativo.", "duracao": 4.5 }
}
```

**Duração:** cada plano dura o tempo da própria fala. A cartela final entra quando a narração termina.

**Cores na fala:** `*vermelho*` (perigo, erro, punchline) e `_amarelo_` (solução, recurso, direito). Funciona com várias palavras: `*quarenta minutos*`. As marcas são removidas antes de ir para a voz.

## Coordenadas
Tela de projeto 1080 × 1920. Centro (540, 960). **Chão dos interiores em y = 1440.** Topo seguro para fichas/etiquetas: y ≈ 300–360. A legenda fica em y ≈ 1240, então não coloque texto importante entre 1180 e 1330.

## Elementos

Todo elemento aceita: `x`, `y`, `escala`, `rot`, `espelhar`, `entra`, `sai`, `anim`, `continuo`, `move`, `som`.

- **`entra`**: segundos desde o início do plano (`0.4`), **`"@palavra"`** (entra quando a narração diz essa palavra, ex. `"@multa"`) ou `"#3"` (índice da palavra). O padrão é o início do plano.
- **`anim`**: `pop` (padrão para objetos), `sobe` (padrão para personagens que entram depois), `cai`, `fade`, `carimba` (padrão do carimbo), `nenhuma`.
- **`continuo`**: `treme` | `flutua` | `pulsa`.
- **`move`**: `{ "x": 800, "y": 1440, "dur": 1.2, "em": "@corre" }` (personagem anda até lá, com as pernas balançando).
- **`som`**: troca o efeito de entrada (`pop`, `papel`, `carimbo`, `martelo`, `erro`, `acerto`, `alerta`, `tique`, `impacto`) ou `false` para silenciar.

| tipo | Ancoragem | Campos |
|---|---|---|
| `personagem` | pés | `pele`, `cabelo` (curto, espetado, longo, coque, careca), `corCabelo`, `roupa`, `calca`, `expressao` (neutro, feliz, surpreso, bravo, preocupado, desconfiado), `pose` (baixo, aponta, acena, levanta, cruza, segura, celular), `acessorios` (bone, oculos, gravata, terno, toga, avental, bigode, barba, pasta), `corBone`. Escala padrão 1,3 (~780 px de altura). |
| `gato` | patas | `cor` (mascote) |
| `ficha` | centro | `topo`, `nome`, `sub`, `cor` |
| `etiqueta` | centro | `texto`, `cor` (verm, amar, verde, azul, cinza ou hex), `tam` |
| `titulo` | linha de base | `texto`, `cor`, `tam` (impacto em tela escura) |
| `texto` | linha de base | `texto`, `tam`, `cor`, `peso`, `ancora` |
| `cronometro` | centro | `de`, `ate`, `formato` (mmss, hhmmss, dias, numero), `rotulo`, `dur`, `curva` |
| `contador` | centro | `icone` (emoji), `rotulo`, `de`, `ate`, `formato`, `unidade`, `dur`, `curva`, `w` |
| `inventario` | centro | `titulo`, `itens: [{nome, valor 0–5, de, cor}]`, `selo: {topo, texto, cor}`, `rot` (as barras enchem uma a uma) |
| `niveis` | base | `itens` (de cima para baixo, ex. STF, STJ, TJ, 1ª VARA), `destaque` (índice), `rotulo`, `w`, `alturaNivel` (diagrama em corte, estilo "andares") |
| `documento` / `contrato` | centro | `titulo`, `linhas`, `assinatura`, `letraMiuda`, `w`, `h` |
| `boleto` | centro | `titulo`, `valor`, `venc` |
| `celular` | centro | `rotulo`, `titulo` (aceita `\n`), `texto`, `cor` (alerta) |
| `carimbo` | centro | `texto`, `tam` |
| `balao` | ponta | `texto` (aceita `\n`), `tam` |
| `xis`, `check` | centro | `tam`, `cor` |
| `seta` | início | `comp`, `cor`, `rot` |
| `predio` | base | `w`, `h`, `cor`, `corJanela`, `acesas` |
| `casa`, `carro`, `porta` (`luz`), `janela` (`noite`), `mesa`, `bancada`, `martelo` (`bate`: momento da martelada), `caixaSom`, `dinheiro`, `multidao` (`n`, `largura`, `cor`), `lua` | base/centro | |
| `svg` | livre | `svg`: marcação SVG crua para algo sob medida |

## Fundos
`cidade-dia` (bege/laranja com prédios), `cidade-noite`, `interior` (parede + lambri + piso de madeira), `interior-noite`, `escritorio` (estante + janela), `tribunal` (madeira + brasão §), `quadro` (cortiça marrom, para inventário/documentos), `escuro` (impacto), `claro` (papel), `nenhum`.

## Receita de planos que funciona
- Abra em um **plano geral** (cidade/prédio) com etiqueta de hora/lugar.
- Apresente cada personagem em **plano próprio**, com `ficha` entrando na palavra do nome (`"entra": "@Valdir"`).
- Explique a lei com `documento` + `etiqueta` do artigo.
- Use `inventario` para "o plano"/"situação" e reapresente-o mais tarde com valores diferentes (o público adora ver a barra mudar).
- Use `escuro` + `titulo` vermelho para a frase de virada ("UM PROBLEMA.").
- Feche com um plano de tensão (`porta` + `etiqueta` tremendo) e a cartela.
- Varie os fundos: nunca mais de 2 planos seguidos com o mesmo.
