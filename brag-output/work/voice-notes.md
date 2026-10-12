# Voice notes (re-voice to Zoe (Premium))

## The "two voices" report
I checked the old Daniel (Enhanced) audio three ways:
- **Clip format:** each `say` AIFF was mono at 22,050 Hz. There was no hidden second channel to fold together.
- **Duplicate copies:** cross-correlating each clip with the final mix found exactly one copy, with no delayed duplicate.
- **Echo inside a clip:** the autocorrelation at 20 to 300 ms stayed at 0.10 or below. The only strong peaks sat at the voice's pitch period: about 9 to 11 ms for Daniel and about 4 to 5 ms for Zoe. That is normal for voiced speech, not an echo.

**Conclusion:** the mix never held two voices at once. The doubled, phasey sound most likely came from the Daniel synthesis itself, slowed to rate 160 and upsampled from 22 kHz.

## What changed
- New voice: Zoe (Premium). `say` writes each clip straight to mono 48 kHz WAV, so there is no resampling or downmix (`work/vo_zoe/`).
- `audio.py` now checks that every clip is mono at 48 kHz and starts at least 0.15 s after the previous clip ends.
- Two start times moved so the final word lands just before the picture:
  - 4b moved 24.15 to 24.40 s: "Out." at 26.00 to 26.27 s; Random Forest turns pink at 26.35 s.
  - 4c moved 27.00 to 27.10 s: "Out." at 29.32 to 29.59 s; Naive Bayes drops at 29.65 s.
- The pictures and music are unchanged. The video stream MD5 is identical to the previous render (f760d9fefaa4e27d273a1e11e71f4fb4).
- The previous version is kept as `work/brag_daniel.mp4`, with `audio_daniel.py`.

## Back to Daniel (Enhanced), livelier
- The user preferred Daniel to Zoe, but the first Daniel render sounded like a history lesson.
- Cause: it used rate 160, which is this voice's slow default pace.
- New settings: `say -r 210` (about 13% faster) with `[[pbas +2]]` (median pitch about 112 Hz up to about 123 Hz), plus a light EQ (less chest, more presence). Clips are in `work/vo_daniel2/`.
- This voice ignores `[[emph]]`, `[[pmod]]` and `[[slnc]]`. Rate and base pitch are the only controls that change it.
- Backups: `work/brag_zoe.mp4` (Zoe), `work/brag_daniel.mp4` (first Daniel render).
- The video stream is still identical (MD5 f760d9fefaa4e27d273a1e11e71f4fb4).
