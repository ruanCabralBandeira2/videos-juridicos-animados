#!/usr/bin/env python3
"""Trilha sonora sintetizada (sem arquivos externos, sem direitos autorais).
Uso: python3 audio.py roteiro.json eventos.json saida.wav [--voz narracao.wav]

contagem: ambiente (cidade|praia|sala|escritorio) + tique-taque do prazo + zumbido que sobe + impacto na virada
          + ronco crescente + baques dos carimbos + golpe no clímax + sinos suaves na cartela.
saga:     narração em primeiro plano + tapete grave discreto + sons curtos nos elementos (pop, carimbo, martelo, erro...)
          + batida final no "PARTE N".
"""
import sys, json, wave
import numpy as np

SR = 44100
rng = np.random.default_rng(7)

def filtro(x, lo=None, hi=None):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); m = np.ones_like(f)
    if hi: m *= 1 / (1 + (f / hi) ** 4)
    if lo: m *= 1 - 1 / (1 + (f / lo) ** 4)
    return np.fft.irfft(X * m, len(x)).astype(np.float32)

def ruido(n, lo=None, hi=None):
    return filtro(rng.standard_normal(n).astype(np.float32), lo, hi)

def norma(x):
    m = np.max(np.abs(x)) or 1; return x / m

def env(n, ataque=.005, queda=.3):
    t = np.arange(n) / SR
    return (np.minimum(1, t / max(ataque, 1e-4)) * np.exp(-t / max(queda, 1e-4))).astype(np.float32)

def seno(freq, dur, fase=0):
    t = np.arange(int(dur * SR)) / SR
    f = np.full_like(t, freq) if np.isscalar(freq) else freq
    return np.sin(2 * np.pi * np.cumsum(f) / SR + fase).astype(np.float32)

def por(buf, som, t, ganho=1.0):
    i = int(t * SR)
    if i >= len(buf) or i + len(som) <= 0: return
    j = min(len(buf), i + len(som)); buf[max(0, i):j] += som[max(0, -i):j - i] * ganho

# ---------------- efeitos ----------------
def baque(dur=1.2, grave=48):
    n = int(dur * SR); t = np.arange(n) / SR
    sub = np.sin(2 * np.pi * (grave + 60 * np.exp(-t * 18)) * t) * np.exp(-t * 3.2)
    ar = ruido(n, 80, 2500) * np.exp(-t * 14) * .5
    return norma(sub + ar).astype(np.float32)

def carimbo():
    n = int(.35 * SR); t = np.arange(n) / SR
    corpo = np.sin(2 * np.pi * (95 + 80 * np.exp(-t * 40)) * t) * np.exp(-t * 16)
    estalo = ruido(n, 600, 5000) * np.exp(-t * 70) * .8
    return norma(corpo + estalo).astype(np.float32)

def martelo():
    n = int(.6 * SR); t = np.arange(n) / SR
    madeira = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * d) for f, d in [(420, 30), (760, 38), (1180, 45)])
    return norma(madeira + ruido(n, 1500, 8000) * np.exp(-t * 90) * .7 + np.sin(2 * np.pi * 70 * t) * np.exp(-t * 12) * .8).astype(np.float32)

def pop():
    n = int(.12 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * np.cumsum(900 * np.exp(-t * 22) + 260) / SR) * np.exp(-t * 30)).astype(np.float32)

def papel():
    n = int(.28 * SR); t = np.arange(n) / SR
    return (ruido(n, 1800, 9000) * (np.sin(np.pi * t / .28) ** 2) * .9).astype(np.float32)

def erro():
    n = int(.4 * SR); t = np.arange(n) / SR
    return ((np.sign(np.sin(2 * np.pi * 150 * t)) * .35 + np.sin(2 * np.pi * 157 * t) * .4) * np.exp(-t * 7)).astype(np.float32)

def acerto():
    s = np.zeros(int(.5 * SR), np.float32); por(s, seno(880, .4) * env(int(.4 * SR), .003, .12), 0); por(s, seno(1320, .3) * env(int(.3 * SR), .003, .12), .08); return s

def alerta():
    s = np.zeros(int(.7 * SR), np.float32)
    for k in range(3): por(s, seno(1000, .12) * env(int(.12 * SR), .002, .05) * .7, k * .18)
    return s

def tique(alto=False):
    n = int(.06 * SR); t = np.arange(n) / SR
    return (ruido(n, 2000 if alto else 1400, 7000) * np.exp(-t * 160)).astype(np.float32)

def sino(f=880):
    n = int(2.6 * SR); t = np.arange(n) / SR
    return (sum(np.sin(2 * np.pi * f * m * t) * a * np.exp(-t * d) for m, a, d in [(1, 1, 1.6), (2.01, .35, 2.5), (3.02, .15, 3.4)]) * np.minimum(1, t / .004)).astype(np.float32)

def whoosh(dur=.35):
    n = int(dur * SR); t = np.arange(n) / SR
    return (ruido(n, 300, 3000) * np.sin(np.pi * t / dur) ** 3).astype(np.float32)

def impacto_final():
    return norma(baque(2.2, 40) + np.pad(sino(220)[:int(2.2 * SR)] * .3, (0, 0))).astype(np.float32)

# ---------------- camadas ----------------
def ambiente(tipo, n):
    t = np.arange(n) / SR
    if tipo == 'praia':
        ondas = ruido(n, 150, 1400) * (.55 + .45 * np.sin(2 * np.pi * t / 7.5) ** 2)
        return ondas * .5 + ruido(n, 2000, 6000) * .05
    if tipo in ('sala', 'escritorio'):
        return ruido(n, 40, 300) * .25 + ruido(n, 3000, 8000) * .015
    # cidade: tráfego distante + vento leve
    base = ruido(n, 40, 500) * (.7 + .3 * np.sin(2 * np.pi * t / 11))
    s = base * .45 + ruido(n, 1500, 5000) * .03
    for k in range(int(n / SR / 9)):  # buzinas/veículos distantes, raros
        tt = rng.uniform(0, n / SR); d = rng.uniform(.8, 2.2)
        por(s, ruido(int(d * SR), 200, 900) * np.sin(np.pi * np.arange(int(d * SR)) / (d * SR)) ** 2 * .25, tt)
    return s

def contagem(R, ev, dur):
    n = int(dur * SR); t = np.arange(n) / SR
    tempos = {e['tipo']: e['t'] for e in ev}
    TG, TV, TC, TF, TK = tempos.get('inicio_contagem', 4.5), tempos.get('virada', 34), tempos.get('climax', 60), tempos.get('fade', 64.5), tempos.get('cartela', 66.5)
    mix = np.zeros(n, np.float32)
    # ambiente: cheio no ato 1, some no ato 2
    amb = ambiente(R.get('ambiente', 'cidade'), n)
    g_amb = np.where(t < TV, 1, np.clip(1 - (t - TV) / 12, .15, 1)) * np.where(t < TC, 1, 0)
    mix += norma(amb) * .22 * g_amb
    # zumbido que sobe no ato 1
    p1 = np.clip((t - TG) / (TV - TG), 0, 1)
    f = 55 * (1 + .04 * p1)
    drone = (np.sin(2 * np.pi * np.cumsum(f) / SR) + .5 * np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR) + .3 * np.sin(2 * np.pi * np.cumsum(f * 2.003) / SR))
    mix += drone * (p1 ** 2) * .13 * (t < TV)
    # sucção antes da virada
    k = np.clip((t - (TV - 1.2)) / 1.2, 0, 1) * (t < TV)
    mix += ruido(n, 400, 6000) * k ** 3 * .25
    # tique-taque do prazo (ato 1)
    if R.get('tique', True):
        s = TG; i = 0
        while s < TV - .05:
            pr = (s - TG) / (TV - TG); por(mix, tique(i % 2 == 0), s, .05 + .2 * pr); s += 1.0; i += 1
    # virada
    por(mix, baque(2.4, 42), TV, 1.5); por(mix, ruido(int(1.5 * SR), 200, 8000) * env(int(1.5 * SR), .002, .4), TV, .5)
    # ronco crescente + estalos no ato 2
    p2 = np.clip((t - TV) / (TC - TV), 0, 1) * (t >= TV) * (t < TF)
    ronco = ruido(n, 25, 180)
    mix += norma(ronco) * (.1 + .3 * p2 ** 1.3) * (t >= TV) * np.where(t < TC, 1, np.clip(1 - (t - TC) / (TF - TC + .8), 0, 1))
    estalos = np.zeros(n, np.float32); m = rng.random(n) < (p2 ** 2 * 18 / SR)
    estalos[m] = rng.uniform(-1, 1, m.sum()); mix += filtro(estalos, 800, 6000) * 1.4
    # carimbos e legendas
    for e in ev:
        if e['tipo'] == 'carimbo': por(mix, carimbo(), e['t'], .75)
    # clímax
    por(mix, baque(3.2, 36), TC, 1.8); por(mix, martelo(), TC + .02, 1.0); por(mix, ruido(int(3 * SR), 60, 3000) * env(int(3 * SR), .003, .9), TC, .4)
    # silencia antes da cartela
    mix *= np.where(t < TF, 1, np.clip(1 - (t - TF) / .8, 0, 1)).astype(np.float32)
    # sinos da cartela
    for e in ev:
        if e['tipo'] == 'sino': por(mix, sino(660 if e['t'] - TK < 2 else 880), e['t'], .07)
    por(mix, ruido(n, 40, 200) * .05 * (t > TK), 0)
    return mix

def saga(R, ev, dur, voz):
    n = int(dur * SR); t = np.arange(n) / SR
    mix = np.zeros(n, np.float32)
    # tapete: acorde grave menor, pulsando devagar
    raiz = R.get('tom', 55.0)
    pad = sum(np.sin(2 * np.pi * raiz * m * t + m) * a for m, a in [(1, 1), (1.189, .5), (1.498, .6), (2, .35)])
    pad *= .55 + .45 * np.sin(2 * np.pi * t / 4) ** 2
    pad = filtro(pad.astype(np.float32), None, 600)
    fim = next((e['t'] for e in ev if e['tipo'] == 'final'), dur)
    mix += norma(pad) * .07 * np.clip(t / 1.5, 0, 1) * (t < fim)
    mix += norma(ruido(n, 40, 220)) * .04 * (t < fim)
    sons = {'pop': (pop, .22), 'papel': (papel, .25), 'carimbo': (carimbo, .55), 'martelo': (martelo, .6), 'erro': (erro, .25), 'acerto': (acerto, .2),
            'alerta': (alerta, .25), 'tique': (lambda: tique(True), .3), 'impacto': (lambda: baque(1.4), .6), 'corte': (whoosh, .05)}
    for e in ev:
        if e['tipo'] in sons: f, g = sons[e['tipo']]; por(mix, f(), e['t'], g)
    por(mix, impacto_final(), fim, .7)
    if voz is not None:
        v = np.zeros(n, np.float32); m = min(n, len(voz)); v[:m] = voz[:m]
        # abaixa a trilha quando há fala
        envv = np.convolve(np.abs(v), np.ones(int(.25 * SR)) / int(.25 * SR), 'same')
        duck = 1 - .45 * np.clip(envv / (envv.max() or 1) * 6, 0, 1)
        mix = mix * duck + v * 1.0
    return mix

def main():
    roteiro, eventos, saida = sys.argv[1:4]
    R = json.load(open(roteiro, encoding='utf-8'))
    E = json.load(open(eventos)); ev, dur = E['eventos'], E['duracao']
    voz = None
    if '--voz' in sys.argv:
        with wave.open(sys.argv[sys.argv.index('--voz') + 1]) as w:
            voz = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
    mix = (saga(R, ev, dur, voz) if R.get('formato') == 'saga' else contagem(R, ev, dur)).astype(np.float32)
    mix = mix / (np.max(np.abs(mix)) or 1) * .89
    # estéreo leve (atraso de 8 ms no canal direito para o ambiente ficar largo)
    d = int(.008 * SR); dir_ = np.concatenate([np.zeros(d, np.float32), mix[:-d]])
    st = np.stack([mix, mix * .7 + dir_ * .3], 1)
    with wave.open(saida, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(st, -1, 1) * 32767).astype(np.int16).tobytes())
    print(f'trilha: {dur:.1f}s -> {saida}')

if __name__ == '__main__':
    main()
