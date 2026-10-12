# brag-plan: Eight models. One honest winner.

**Input:** project `~/Projects/ds15-webapp` (DS-15 Hub). The storyboard follows `../docs/brag-script.md`.
**Focus (from the user):** the 8-model comparison and the champion introduction only. No app tour.
**Tone:** polished. **Format:** 1920×1080, 30 fps, 60 s. Voiceover: macOS "Daniel (Enhanced)" at rate 210 with a small pitch lift (see work/voice-notes.md).

## Before planning
- **What it is:** a comparison of 8 late-delivery models for DataCo orders, and the champion the group picked.
- **Who it's for:** the IT3091 markers and anyone who wants to see an honest model choice.
- **What sets it apart:** it admits that no model beats a 5-group shipping-mode rule, then shows how the tie was broken.
- **Hook:** "8 models. 1 question: will this order arrive late?" The real model cards rise one by one.
- **Real UI shown:**
  - the `ModelCard` component (imported from the app)
  - the app's Card, Tag, OwnerChip and Icon pieces
  - the ROC dot plot, ladder, champion card, drivers and Predict result, rebuilt from the app's own markup and tokens so they can be driven frame by frame
- **Share caption:** see `share-copy.txt`.

## Storyboard (60 s)
| # | Time | Scene |
|---|---|---|
| 1 | 0–5 | Hook: 8 real model cards rise, grouped by teammate (owner name + ID) |
| 2 | 5–12.6 | Cards slide into rank order. Scores wipe in. Pink and peach status tints appear |
| 3 | 12.6–22.2 | Dot plot: dots slide to their CV ROC-AUC, the rule line draws, the tie zone opens, Naive Bayes is hollow and outside |
| 4 | 22.2–34.6 | Decision ladder: fit-gap bars grow and Random Forest goes over 0.03 ("Out."); Naive Bayes drops out ("Out."); the rest re-centre; tie-break |
| 5 | 34.6–47 | Champion card builds layer by layer; metrics wipe in; drivers grow out from the centre line (poster frame at 45.8 s) |
| 6 | 47–55.5 | Cursor presses "High risk"; fields swap; the gauge passes the 0.6040 cut-off; 95% (0.9514); the reason types; "Flag as late" |
| 7 | 55.5–60 | "No model beats the rule. So we chose the one you can explain." The four teammates with their IDs |

## Motion
- No zoom or scale. Things change only by moving, fading, wiping in, growing in length, changing colour, or typing.
- Easing: entrances cubic-bezier(.22, 1, .36, 1); moves (.65, 0, .35, 1); exits 450 ms.
- Numbers never count through made-up values. They wipe in left to right.
- Scene changes: the old content drifts out, then the new content enters.

## Sound
- **Music:** felt piano and pad in D major, 84 BPM; it opens up at the champion.
- **Effects:** ticks, two thuds, a click and a rising tone, all in key and in the same reverb.
- **Mix:** music ducks about 10 dB under the voice; −16 LUFS overall.
