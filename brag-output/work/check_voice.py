import warnings
warnings.filterwarnings('ignore')
import numpy as np
from scipy.io import wavfile
from scipy.signal import fftconvolve
SR = 48000
starts = {'1': 0.6, '2': 5.6, '3a': 12.9, '3b': 19.3, '4a': 22.4, '4b': 24.34, '4c': 27.29, '4d': 30.3, '5a': 35.0, '5b': 39.3,
          '6a': 47.3, '6b': 49.0, '6c': 51.8, '6d': 54.45, '7': 55.7}
_, mix = wavfile.read('mix.wav'); mix = mix.astype(float).mean(axis=1)
worst, single = 0.0, True
for k, at in starts.items():
    _, x = wavfile.read(f'vo_daniel2/{k}.wav'); x = x.astype(float)
    seg = x[:SR * 4]; ac = fftconvolve(seg, seg[::-1])[len(seg) - 1:]; ac /= ac[0]
    worst = max(worst, ac[int(.02 * SR):int(.3 * SR)].max())
    i = int(at * SR); m = mix[max(0, i - SR):i + len(x) + SR]
    c = np.abs(fftconvolve(m, x[::-1], mode='valid')); c /= c.max(); p = int(np.argmax(c))
    far = np.concatenate([c[:max(0, p - int(.35 * SR))], c[p + int(.35 * SR):]])
    if far.size and far.max() > 0.3:
        single = False; print('possible second copy:', k, round(far.max(), 2))
print('worst in-clip echo peak (20-300 ms, above the pitch period):', round(worst, 3), '| one copy of each clip in the mix:', single)

def last_word(k):
    _, x = wavfile.read(f'vo_daniel2/{k}.wav'); x = x.astype(float)
    env = np.sqrt(np.convolve(x ** 2, np.ones(960) / 960, 'same')); act = env > env.max() * 0.05
    end = np.where(act)[0][-1]; gap = 0
    for j in range(end, 0, -1):
        gap = gap + 1 if not act[j] else 0
        if gap >= int(.12 * SR):
            return (j + gap) / SR, end / SR
    return 0.0, end / SR
for k, v in [('4b', 26.35), ('4c', 29.65), ('6d', 54.45)]:
    on, e = last_word(k); print(f'{k}: last word {starts[k] + on:.2f}-{starts[k] + e:.2f}s (visual at {v})')
