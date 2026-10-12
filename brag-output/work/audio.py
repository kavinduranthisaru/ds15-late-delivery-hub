"""Soundtrack for the 60 s video: warm felt-piano + pad in D major at 84 BPM, soft effects in the same key,
and the Daniel (Enhanced) voiceover placed at fixed times. Music ducks about 10 dB under every voice line.
Writes work/mix.wav (48 kHz stereo). Run with ~/.ds15/venv/bin/python audio.py"""
import subprocess
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, sosfilt

SR, DUR = 48000, 60.0
N = int(SR * DUR)
HERE = Path(__file__).parent
rng = np.random.default_rng(42)
t = np.arange(N) / SR


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def env_adsr(n, a, r, sustain_len):
    e = np.ones(n)
    ai = int(a * SR)
    e[:ai] = np.linspace(0, 1, ai) ** 2
    ri = int(r * SR)
    s = int(sustain_len * SR)
    if s + ri < n:
        e[s:s + ri] *= np.linspace(1, 0, ri) ** 2
        e[s + ri:] = 0
    return e


def add(buf, start, sig):
    i = int(start * SR)
    if i >= len(buf):
        return
    j = min(len(buf), i + len(sig))
    buf[i:j] += sig[:j - i]


# ---- Music ---------------------------------------------------------------------------------------------
BPM = 84
BEAT = 60 / BPM
BAR = 4 * BEAT
CHORDS = [  # (bass, chord tones) in MIDI, D major: Dmaj9, Bm7, Gmaj7, Asus2
    (38, [50, 54, 57, 61, 64]),
    (47, [47, 50, 54, 57, 62]),
    (43, [43, 47, 50, 54, 59]),
    (45, [45, 47, 52, 57, 59]),
]
pad = np.zeros(N)
piano = np.zeros(N)
bass = np.zeros(N)
LIFT = 34.6  # the champion: music opens up a little

c_len = 2 * BAR
k = 0
start = 0.0
while start < DUR:
    b, tones = CHORDS[k % 4]
    n = int((c_len + 2.0) * SR)
    tt = np.arange(n) / SR
    e = env_adsr(n, 1.4, 1.8, c_len)
    for m in tones[1:]:
        f = hz(m)
        det = 1 + rng.uniform(-0.0015, 0.0015)
        tone = np.sin(2 * np.pi * f * det * tt) + 0.18 * np.sin(2 * np.pi * 2 * f * tt + 0.3)
        add(pad, start, 0.05 * e * tone * (1 + 0.06 * np.sin(2 * np.pi * 0.21 * tt)))
    if start + 0.01 >= LIFT - 0.5:  # soft bass from the champion onwards
        fb = hz(b)
        add(bass, start, 0.09 * env_adsr(n, 0.6, 1.5, c_len) * (np.sin(2 * np.pi * fb * tt) + 0.25 * np.sin(2 * np.pi * 2 * fb * tt)))
    # felt piano: one chord tone per beat, a little denser after the lift
    pattern = [0, 2, 1, 3, 0, 2, 4, 3]
    for i, pi in enumerate(pattern):
        nt = start + i * BEAT
        if nt < 1.2 or nt > DUR - 1.5:
            continue
        m = tones[1:][pi % 4] + 12
        f = hz(m)
        ln = int(2.4 * SR)
        tt2 = np.arange(ln) / SR
        decay = np.exp(-tt2 / 0.9)
        att = np.minimum(1, tt2 / 0.006)
        note = (np.sin(2 * np.pi * f * tt2) + 0.35 * np.sin(2 * np.pi * 2 * f * tt2) * np.exp(-tt2 / 0.35)
                + 0.12 * np.sin(2 * np.pi * 3 * f * tt2) * np.exp(-tt2 / 0.2))
        vel = 0.075 if nt < LIFT else 0.09
        add(piano, nt, vel * att * decay * note)
        if nt >= LIFT and i % 2 == 1:  # answer an octave up
            add(piano, nt + BEAT / 2, 0.035 * att * decay * np.sin(2 * np.pi * 2 * f * tt2))
    start += c_len
    k += 1

music = pad + piano + bass
music = sosfilt(butter(2, 5200, 'lowpass', fs=SR, output='sos'), music)

# ---- Effects (same key, soft) ----------------------------------------------------------------------------
sfx = np.zeros(N)


def tick(at, midi=86, vol=0.05):
    ln = int(0.18 * SR)
    tt = np.arange(ln) / SR
    add(sfx, at, vol * np.sin(2 * np.pi * hz(midi) * tt) * np.exp(-tt / 0.035))


def thud(at, vol=0.22):
    ln = int(0.9 * SR)
    tt = np.arange(ln) / SR
    f = hz(38) * (1 + 0.15 * np.exp(-tt / 0.05))
    add(sfx, at, vol * (np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.3 * np.sin(2 * np.pi * hz(50) * tt)) * np.exp(-tt / 0.22))


def click(at, vol=0.06):
    ln = int(0.06 * SR)
    tt = np.arange(ln) / SR
    noise = sosfilt(butter(2, [1800, 5000], 'bandpass', fs=SR, output='sos'), rng.normal(0, 1, ln))
    add(sfx, at, vol * (0.5 * noise + np.sin(2 * np.pi * hz(81) * tt)) * np.exp(-tt / 0.012))


def rise(at, vol=0.05):
    ln = int(0.8 * SR)
    tt = np.arange(ln) / SR
    f = hz(69) * 2 ** ((5 / 12) * np.clip(tt / 0.6, 0, 1))  # A4 to D5
    add(sfx, at, vol * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * np.clip(tt / 0.8, 0, 1)))


def bez(x1, y1, x2, y2):
    def f(x):
        u = np.linspace(0, 1, 20001)
        bx = 3 * (1 - u) ** 2 * u * x1 + 3 * (1 - u) * u ** 2 * x2 + u ** 3
        by = 3 * (1 - u) ** 2 * u * y1 + 3 * (1 - u) * u ** 2 * y2 + u ** 3
        return np.interp(x, bx, by)
    return f


e_move = bez(0.65, 0, 0.35, 1)
xs = np.linspace(0, 1, 20001)
cross = 49.8 + 1.9 * xs[np.argmax(0.951374 * e_move(xs) >= 0.604)]  # gauge passes the cut-off

order = ['logistic_regression', 'adaboost', 'xgboost', 'linear_svm', 'knn', 'naive_bayes', 'decision_tree', 'random_forest']
for r in range(8):
    tick(6.6 + r * 0.09 + 0.15, 86 if r % 2 == 0 else 81, 0.035)   # scores wipe in
for i in range(4):
    tick(39.4 + i * 0.45 + 0.1, [86, 81, 78, 86][i], 0.045)        # champion metrics
tick(36.75, 74, 0.05)                                              # champion score
thud(26.35)                                                        # Random Forest out
thud(29.65)                                                        # Naive Bayes out
click(48.9)                                                        # "High risk" example
rise(cross - 0.25)                                                 # gauge passes 0.6040
tick(54.45, 86, 0.05)                                              # "Flag as late"

# reverb shared by music and effects (one space)
ir_len = int(2.4 * SR)
ir_t = np.arange(ir_len) / SR
ir = rng.normal(0, 1, (2, ir_len)) * np.exp(-ir_t / 0.55)
ir = sosfilt(butter(2, 3800, 'lowpass', fs=SR, output='sos'), ir, axis=1)
ir /= np.abs(ir).sum(axis=1, keepdims=True) / 6
bed = music + 0.8 * sfx
wet = np.stack([fftconvolve(bed, ir[c])[:N] for c in range(2)])
bed_st = np.stack([bed, bed]) * 0.78 + wet * 0.32

# ---- Voice -------------------------------------------------------------------------------------------------
# "Daniel (Enhanced)" at a livelier setting: say -r 210 with [[pbas +2]], then a light EQ (less chest, more presence).
VOICE_DIR = HERE / 'vo_daniel2'
VO = [('1', 0.6), ('2', 5.6), ('3a', 12.9), ('3b', 19.3), ('4a', 22.4), ('4b', 24.34), ('4c', 27.29), ('4d', 30.3),
      ('5a', 35.0), ('5b', 39.3), ('6a', 47.3), ('6b', 49.0), ('6c', 51.8), ('6d', 54.45), ('7', 55.7)]
voice = np.zeros(N)
spans = []
for name, at in VO:
    sr, x = wavfile.read(VOICE_DIR / f'{name}.wav')
    assert sr == SR and x.ndim == 1, f'{name}: expected mono {SR} Hz, got {sr} Hz, shape {x.shape}'
    x = x.astype(np.float64) / 32768.0
    end = at + len(x) / SR
    assert end <= DUR - 0.15, f'{name} ends at {end:.2f}s'
    if spans:
        assert at - spans[-1][2] >= 0.15, f'{name} starts {at:.2f}s, only {at - spans[-1][2]:.2f}s after {spans[-1][0]} ends'
    spans.append((name, at, end))
    add(voice, at, x)
    print(f'voice {name:3s} {at:5.2f}s to {end:5.2f}s')
voice = sosfilt(butter(2, 80, 'highpass', fs=SR, output='sos'), voice)
# gentle compression: tame peaks above -18 dBFS by 2:1 (RMS over 30 ms)
rms = np.sqrt(np.convolve(voice ** 2, np.ones(1440) / 1440, mode='same')) + 1e-9
thr = 10 ** (-18 / 20)
gain = np.where(rms > thr, (thr * (rms / thr) ** 0.5) / rms, 1.0)
voice *= gain
voice *= 10 ** (-17 / 20) / (np.sqrt(np.mean(voice[np.abs(voice) > 1e-4] ** 2)) + 1e-9)

# ducking: music down about 10 dB under every line (300 ms attack, 600 ms release)
act = (np.abs(voice) > 1e-3).astype(float)
act = np.convolve(act, np.ones(int(0.25 * SR)) / int(0.25 * SR), mode='same') > 0.02
env = np.zeros(N)
a_c, r_c = np.exp(-1 / (0.3 * SR)), np.exp(-1 / (0.6 * SR))
lvl = 0.0
for i in range(0, N, 48):  # control rate 1 kHz
    target = 1.0 if act[i] else 0.0
    c = a_c ** 48 if target > lvl else r_c ** 48
    lvl = target + (lvl - target) * c
    env[i:i + 48] = lvl
duck = 1 - env * (1 - 10 ** (-10 / 20))

mix = bed_st * duck + np.stack([voice, voice])
wavfile.write(HERE / 'voice_only.wav', SR, (np.clip(voice / max(1e-9, np.abs(voice).max()) * 0.89, -1, 1) * 32767).astype(np.int16))
# fades: in over 1 s, music out over the last 1.5 s
fade = np.ones(N)
fade[:SR] = np.linspace(0, 1, SR) ** 2
fo = int(1.5 * SR)
fade[-fo:] = np.linspace(1, 0, fo) ** 2
mix *= fade
mix /= max(1.0, np.abs(mix).max() / 0.89)
wavfile.write(HERE / 'mix_raw.wav', SR, (mix.T * 32767).astype(np.int16))
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(HERE / 'mix_raw.wav'),
                '-af', 'loudnorm=I=-16:TP=-1.5:LRA=9', '-ar', str(SR), str(HERE / 'mix.wav')], check=True)
print(f'gauge crosses the cut-off at {cross:.2f}s; wrote mix.wav')
