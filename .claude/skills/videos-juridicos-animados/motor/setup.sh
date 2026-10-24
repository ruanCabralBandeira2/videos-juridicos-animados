#!/usr/bin/env bash
# Instala o que o motor precisa. Rode uma vez: bash <skill>/motor/setup.sh
# Requisitos de sistema: node >= 18, python3 com numpy, ffmpeg.
set -e
M="$(cd "$(dirname "$0")" && pwd)"
cd "$M"
echo "== motor em $M"
command -v ffmpeg >/dev/null || { echo "Falta o ffmpeg (apt install ffmpeg | brew install ffmpeg)"; exit 1; }
python3 -c "import numpy" 2>/dev/null || pip install numpy
# Playwright + Chromium (renderizador)
if ! node -e "require('playwright')" 2>/dev/null; then
  npm init -y >/dev/null 2>&1 || true
  npm install playwright@1 && npx playwright install chromium
fi
# Three.js local (o motor também funciona sem rede depois disso)
mkdir -p vendor fonts
if [ ! -s vendor/three.module.js ]; then
  npm pack three@0.170.0 --silent >/dev/null && tar -xzf three-0.170.0.tgz package/build/three.module.js && mv package/build/three.module.js vendor/ && rm -rf package three-0.170.0.tgz \
  || curl -fsSL https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js -o vendor/three.module.js
fi
# Fontes (OFL): EB Garamond (contagem) e Oswald (saga)
baixa() { [ -s "fonts/$2" ] || curl -fsSL "https://github.com/google/fonts/raw/main/ofl/$1" -o "fonts/$2" || echo "aviso: não baixei $2 (o motor tenta Google Fonts na hora)"; }
baixa "ebgaramond/EBGaramond%5Bwght%5D.ttf" EBGaramond.ttf
baixa "ebgaramond/EBGaramond-Italic%5Bwght%5D.ttf" EBGaramond-Italic.ttf
baixa "oswald/Oswald%5Bwght%5D.ttf" Oswald.ttf
# Voz grátis (opcional). Para ElevenLabs basta exportar ELEVENLABS_API_KEY.
python3 -c "import edge_tts" 2>/dev/null || pip install edge-tts || echo "aviso: edge-tts não instalado (vídeos saga sairão sem voz, só legenda)"
echo "== pronto"
