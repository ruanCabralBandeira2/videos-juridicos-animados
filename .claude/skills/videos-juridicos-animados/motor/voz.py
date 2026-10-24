#!/usr/bin/env python3
"""Narração do formato "saga".
Gera <pasta>/narracao.wav e <pasta>/tempos.json com o tempo de cada palavra de cada plano.

Provedores (escolha por roteiro.voz.provedor ou pela variável VOZ_PROVEDOR):
  elevenlabs  -> precisa de ELEVENLABS_API_KEY (e opcionalmente ELEVENLABS_VOICE_ID). Melhor qualidade, tempos exatos por letra.
  edge        -> pip install edge-tts. Gratuito, vozes neurais pt-BR (ex.: pt-BR-AntonioNeural). Tempos por palavra.
  nenhum      -> sem voz; a página estima os tempos pela velocidade de leitura (vídeo só com legenda).
Uso: python3 voz.py roteiro.json pasta_saida [--sem-voz]
"""
import sys, os, json, re, base64, subprocess, unicodedata, asyncio, urllib.request
import numpy as np

SR = 44100

def sem_marcas(s):
    s = re.sub(r'\*\*|\*', '', s or '')
    s = re.sub(r'(^|\s)_', r'\1', s)
    return re.sub(r'_(?=\s|$|[.,!?;:…”"])', '', s)

def norm(s):
    s = unicodedata.normalize('NFD', sem_marcas(s).lower())
    return re.sub(r'[^a-z0-9$%]', '', ''.join(c for c in s if unicodedata.category(c) != 'Mn'))

def decodificar(dados: bytes) -> np.ndarray:
    p = subprocess.run(['ffmpeg', '-v', 'error', '-i', 'pipe:0', '-f', 's16le', '-ac', '1', '-ar', str(SR), 'pipe:1'], input=dados, capture_output=True, check=True)
    return np.frombuffer(p.stdout, dtype=np.int16).astype(np.float32) / 32768

def aparar(a: np.ndarray):
    """Remove silêncio do começo e do fim; devolve (audio, deslocamento_inicial_em_s)."""
    idx = np.where(np.abs(a) > 0.012)[0]
    if len(idx) == 0: return a, 0.0
    i0 = max(0, idx[0] - int(.03 * SR)); i1 = min(len(a), idx[-1] + int(.09 * SR))
    return a[i0:i1], i0 / SR

# ---------------- provedores ----------------
def elevenlabs(texto, cfg, anterior, proximo):
    chave = os.environ['ELEVENLABS_API_KEY']
    voz = cfg.get('voz') or os.environ.get('ELEVENLABS_VOICE_ID') or 'pNInz6obpgDQGcFmaJgB'
    corpo = {'text': texto, 'model_id': cfg.get('modelo', 'eleven_multilingual_v2'),
             'voice_settings': {'stability': cfg.get('estabilidade', .42), 'similarity_boost': .8, 'style': cfg.get('estilo', .2), 'speed': cfg.get('velocidade', 1.08)}}
    if anterior: corpo['previous_text'] = anterior
    if proximo: corpo['next_text'] = proximo
    req = urllib.request.Request(f'https://api.elevenlabs.io/v1/text-to-speech/{voz}/with-timestamps?output_format=mp3_44100_128',
                                 data=json.dumps(corpo).encode(), headers={'xi-api-key': chave, 'content-type': 'application/json'})
    r = json.load(urllib.request.urlopen(req, timeout=120))
    audio = decodificar(base64.b64decode(r['audio_base64']))
    al = r.get('alignment') or r.get('normalized_alignment')
    palavras, atual = [], None
    for ch, a, b in zip(al['characters'], al['character_start_times_seconds'], al['character_end_times_seconds']):
        if ch.isspace():
            if atual: palavras.append(atual); atual = None
        else:
            atual = [atual[0], b, atual[2] + ch] if atual else [a, b, ch]
    if atual: palavras.append(atual)
    return audio, [(a, b, t) for a, b, t in palavras]

def edge(texto, cfg, *_):
    import edge_tts
    voz = cfg.get('voz') or 'pt-BR-AntonioNeural'
    taxa = cfg.get('taxa', '+14%')
    async def go():
        try: c = edge_tts.Communicate(texto, voz, rate=taxa, boundary='WordBoundary')
        except TypeError: c = edge_tts.Communicate(texto, voz, rate=taxa)
        dados, pal = b'', []
        async for ch in c.stream():
            if ch['type'] == 'audio': dados += ch['data']
            elif ch['type'] == 'WordBoundary': pal.append((ch['offset'] / 1e7, (ch['offset'] + ch['duration']) / 1e7, ch['text']))
        return dados, pal
    dados, pal = asyncio.run(go())
    return decodificar(dados), pal

def alinhar(tokens, pal, dur):
    """Associa cada palavra do roteiro a um tempo. Se não casar bem, distribui pelo tamanho das palavras."""
    out, j, acertos = [], 0, 0
    for tk in tokens:
        n = norm(tk); achou = None
        for k in range(j, min(j + 3, len(pal))):
            pn = norm(pal[k][2])
            if not pn or not n: continue
            if pn == n or (min(len(pn), len(n)) >= 3 and (n.startswith(pn) or pn.startswith(n))):
                achou = k; break
        if achou is not None:
            ini, fim = pal[achou][0], pal[achou][1]
            # palavra do roteiro que o provedor dividiu em várias (ex.: "R$1.000") -> junta enquanto a concatenação bater
            acc = norm(pal[achou][2])
            while acc != n and achou + 1 < len(pal) and norm(pal[achou + 1][2]) and n.startswith(acc + norm(pal[achou + 1][2])):
                achou += 1; acc += norm(pal[achou][2]); fim = pal[achou][1]
            out.append({'ini': round(ini, 3), 'fim': round(fim, 3)}); j = achou + 1; acertos += 1
        else:
            out.append(None)
    if acertos < .6 * len(tokens):
        pesos = np.array([len(t) + 2 for t in tokens], dtype=float); c = np.cumsum(pesos) / pesos.sum() * dur
        return [{'ini': round(float(c[i] - pesos[i] / pesos.sum() * dur), 3), 'fim': round(float(c[i]), 3)} for i in range(len(tokens))]
    for i, v in enumerate(out):  # preenche buracos interpolando
        if v is None:
            prev = out[i - 1]['fim'] if i > 0 and out[i - 1] else 0
            nxt = next((x['ini'] for x in out[i + 1:] if x), dur)
            out[i] = {'ini': round(prev, 3), 'fim': round(min(nxt, prev + .3), 3)}
    return out

def main():
    roteiro, pasta = sys.argv[1], sys.argv[2]
    R = json.load(open(roteiro, encoding='utf-8'))
    cfg = R.get('voz') or {}
    prov = 'nenhum' if '--sem-voz' in sys.argv else (cfg.get('provedor') or os.environ.get('VOZ_PROVEDOR') or '')
    if not prov:
        if os.environ.get('ELEVENLABS_API_KEY'): prov = 'elevenlabs'
        else:
            try: import edge_tts  # noqa
            except ImportError: prov = 'nenhum'
            else: prov = 'edge'
    tempos_arq = os.path.join(pasta, 'tempos.json'); voz_arq = os.path.join(pasta, 'narracao.wav')
    for f in (tempos_arq, voz_arq):
        if os.path.exists(f): os.remove(f)
    if prov == 'nenhum':
        print('voz: nenhuma (vídeo só com legenda; tempos estimados pela leitura)')
        return
    falas = [sem_marcas(p.get('fala', '')).strip() for p in R['planos']]
    pausa, t, blocos, planos = cfg.get('pausa', .12), .12, [np.zeros(int(.12 * SR), np.float32)], []
    for i, txt in enumerate(falas):
        tokens = txt.split()
        if not tokens:
            planos.append({'inicio': t, 'fim': t + 1.2, 'palavras': []}); blocos.append(np.zeros(int(1.2 * SR), np.float32)); t += 1.2; continue
        print(f'voz [{prov}] plano {i + 1}/{len(falas)}: {txt[:60]}')
        audio, pal = (elevenlabs if prov == 'elevenlabs' else edge)(txt, cfg, falas[i - 1] if i else '', falas[i + 1] if i + 1 < len(falas) else '')
        audio, desloc = aparar(audio)
        dur = len(audio) / SR
        pal = [(max(0, a - desloc), max(0, b - desloc), w) for a, b, w in pal]
        tempos = alinhar(tokens, pal, dur)
        planos.append({'inicio': round(t, 3), 'fim': round(t + dur, 3), 'palavras': [{'ini': round(t + x['ini'], 3), 'fim': round(t + x['fim'], 3)} for x in tempos]})
        extra = pausa + (.18 if re.search(r'[.!?…]$', txt) else 0)
        blocos += [audio, np.zeros(int(extra * SR), np.float32)]
        t += dur + extra
    sinal = np.concatenate(blocos)
    import wave
    with wave.open(voz_arq, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(sinal, -1, 1) * 32767).astype(np.int16).tobytes())
    json.dump({'provedor': prov, 'planos': planos, 'duracao': round(t, 3)}, open(tempos_arq, 'w'), indent=1)
    print(f'voz: {len(planos)} planos, {t:.1f}s -> {voz_arq}')

if __name__ == '__main__':
    main()
