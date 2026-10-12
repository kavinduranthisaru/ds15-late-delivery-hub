# brag-script.md: storyboard for /brag:brag-slim (60 s, polished, landscape)

Run from the repo root: `/brag:brag-slim --tone polished --format landscape --duration 60` using this file as the storyboard.


**Title:** Eight models. One honest winner.
**Tone:** polished: calm, precise, long holds. **Format:** 1920×1080, 30 fps, 60 s.
**Angle:** we trained eight models and none beat a five-group rule, so we crowned the one you can explain.
**Share caption:** "We trained 8 models to predict late deliveries on 62,897 DataCo orders. None beat a simple shipping-mode rule, so our champion is the one you can explain: Logistic Regression, 0.7793 test ROC-AUC. IT3091 · Group 2026-DS-15."

### Visual identity (taken from the app, reused, not rebuilt)
- **Source styles:** `web/src/styles/index.css`.
  - Canvas `#F2F2F2`, white cards (radius 22 px), ink `#131313`, navy titles `#1B1F4B`.
  - Active green `#A9E9AF`; primary pill black with green text.
  - Pink and peach alert tints.
  - Font: Plus Jakarta Sans (`@fontsource/plus-jakarta-sans`). Numbers use tabular figures.
- **Member colours (fixed):** Madushani `#22804A`, Ranthisaru `#3B6FD8`, Ratnaweera `#C2364F`, Maheepala `#A85C0E`. Every model label carries its owner's name and ID.
- **Components to render directly:**
  - `ModelCard` from `pages/Models.tsx`
  - `RocDot` from `components/charts/RocDot.tsx`
  - the ladder cards from `pages/Method.tsx`
  - `FitGap` from `components/charts/Charts.tsx`
  - `ChampionCard` and `Drivers` from `pages/Overview.tsx`
  - `Gauge` and `Result` from `pages/Predict.tsx`
  - `Tag`, `OwnerChip` and `CountUp` from `components/ui.tsx`
- **No app chrome:** components float on the canvas with generous space.

### Motion rules (apply everywhere)
- **No zoom.** No camera or screen zoom, no scale-up of screenshots, no Ken Burns. Elements move by translate, opacity, clip-path reveal, width or height growth, colour tint and number count-up only. Scale stays at 1.0, with an optional 0.98 to 1.0 settle on entry.
- **Easing:** entrances `cubic-bezier(0.22, 1, 0.36, 1)`, 700 to 900 ms. Moves and re-orders `cubic-bezier(0.65, 0, 0.35, 1)`, 900 ms. Exits 450 ms, ease-in.
- **Stagger:** 90 to 120 ms between siblings. Entrance travel is 16 to 24 px, never more.
- **Scene changes:** old content fades and drifts out (8 px down, 450 ms), there is a 150 ms dip to the canvas, then the new content enters. No crossfading two busy layouts, no hard cuts.
- **Reading time:** every line the viewer must read is fully settled and held for at least 0.3 s per word before anything moves away.
- **Pace:** one motion idea at a time. When the focus moves, the rest of the frame stays still.

### Storyboard (60 s)

| # | Time | Scene | On screen (real elements and motion) | Text to read (held) |
|---|---|---|---|---|
| 1 | 0.0–5.0 | **Hook** | Eight `ModelCard`s rise one by one into a 4×2 grid (stagger 110 ms, 20 px up), in the app's order: Logistic Regression, AdaBoost, XGBoost, Linear SVM, KNN, Naive Bayes, Decision Tree, Random Forest. Each owner chip fades in last, in its member colour. | "8 models. 1 question: will this order arrive late?" |
| 2 | 5.0–12.0 | **Four teammates, one scorecard** | Cards shift into rank order by sliding to their new slots (FLIP move, 900 ms; nothing jumps). Scores count up on each card: 88.8, 86.7, 86.7, 86.6, 85.0, 58.9, 58.2, 40.8. Pink and peach tints fade onto Naive Bayes, Decision Tree and Random Forest, and onto AdaBoost and XGBoost. | "Ranked on a 100-point scorecard. Never on accuracy." |
| 3 | 12.0–22.0 | **One narrow band** | Cards exit. `RocDot` builds row by row: labels in, then each dot slides from the left edge to its CV ROC-AUC value (0.7743, 0.7748, 0.7748, 0.7742, 0.7756, 0.7693, 0.7754, 0.7736). The rule line draws top to bottom at 0.7748, and the green tie zone opens sideways to ±0.005. The Naive Bayes dot settles outside and hollows out. | "All eight sit inside a 0.006 band." then "None beats the simple shipping-mode rule (0.7748)." |
| 4 | 22.0–34.0 | **The decision ladder** | Four ladder cards (Fit check, Rule check, Head-to-head, Tie-break) slide in left to right. **Step 1:** `FitGap` bars grow from zero. The Random Forest bar (+0.0310) passes the dashed 0.03 limit and the card tints pink: "Out: Random Forest IT24102397". **Step 2:** the Naive Bayes chip slides out of the line-up: "Out: Naive Bayes IT24102928, 0.0055 below the rule". **Steps 3–4:** the remaining chips settle side by side, with a mint tag "Nobody clearly beaten". | "Overfit? Out." · "Below the rule? Out." · "Still tied? Pick the simplest, most honest model." |
| 5 | 34.0–46.0 | **Champion introduction** | Ladder exits. `ChampionCard` assembles in layers: green card surface, then tag "Champion · rank 1 of 8", then title "Logistic Regression", then owner chip "Madushani G.R. IT24102928", then score counting to 88.8. Four metrics count up in turn: CV ROC-AUC 0.7743, Test ROC-AUC 0.7793, Test PR-AUC 0.8593, Test Brier 0.1735. Then the `Drivers` bars grow out from the centre line: Same Day after 12:00 +5.5161, First Class +4.3032, Second Class +0.5988, Standard Class −1.1893, Same Day −3.3487. | "Logistic Regression by Madushani G.R." then "Simple. Readable. Honest probabilities." |
| 6 | 46.0–55.0 | **Champion at work** | The Predict form and result card slide in side by side (no shell). A cursor glides (eased path, 700 ms) to the "High risk" example chip; the chip presses (90 ms dip, colour fills). The result card fills: the gauge bar grows to 0.9514 and passes the cut-off marker at 0.6040; "95%" counts up; the "Flag as late" tag fades in; the reason line types at a calm pace. Then a short beat: the cursor moves to "Low risk"; the gauge eases back to 0.0705 and the tag changes to "Likely on time". | Reason: "The main reason is the Same Day noon cut-off…" (hold until read) |
| 7 | 55.0–60.0 | **Punchline** | Result card exits. Four member chips (names, IDs and colours) settle in a row under one line of type. Final settled frame = poster. | "No model beats the rule. So we chose the one you can explain." · "IT3091 · Group 2026-DS-15" |

**Poster frame:** scene 5 at about 44 s, when the champion card is fully assembled and every metric has settled.

### Voiceover
**Voice:** macOS **"Daniel (Enhanced)"** (en_GB), at a livelier setting than the first render.
- Rate 210 (the first render used 160, the voice's slow default) and a slightly higher pitch: `say -v "Daniel (Enhanced)" -r 210 -o <id>.aiff "[[pbas +2]] <text>"`.
- Then a light EQ in ffmpeg for a less "lecture" tone: high-pass at 95 Hz, −2.5 dB at 240 Hz, +2.5 dB at 3.6 kHz, +2 dB above 7.5 kHz.
- This voice ignores the emphasis and pitch-range commands (`[[emph]]`, `[[pmod]]`); only rate and base pitch work.

| Clip | Starts | Voiceover line | Length | Ends |
|---|---|---|---|---|
| 1 | 0.60 s | "Will this order arrive late? We trained eight models to find out." | 3.42 s | 4.02 s |
| 2 | 5.60 s | "Four teammates. One shared pipeline. Every model ranked on one scorecard, never on accuracy." | 5.90 s | 11.50 s |
| 3a | 12.90 s | "Here's the honest part. All eight sit inside a band just zero point zero zero six wide." | 5.21 s | 18.11 s |
| 3b | 19.30 s | "None beats a simple shipping-mode rule." | 2.20 s | 21.50 s |
| 4a | 22.40 s | "So the rules decide." | 1.36 s | 23.76 s |
| 4b | 24.34 s | "Random Forest overfits. Out." ("Out." at 26.05 s) | 2.12 s | 26.46 s |
| 4c | 27.29 s | "Naive Bayes falls below the rule. Out." ("Out." at 29.35 s) | 2.48 s | 29.77 s |
| 4d | 30.30 s | "The rest are tied, so we pick the simplest, most honest one." | 3.65 s | 33.95 s |
| 5a | 35.00 s | "Meet the champion: Logistic Regression, by Madushani." | 3.41 s | 38.41 s |
| 5b | 39.30 s | "Test R-O-C, zero point seven seven nine three. Honest probabilities, and weights you can read." | 6.13 s | 45.43 s |
| 6a | 47.30 s | "Give it an order." | 0.96 s | 48.26 s |
| 6b | 49.00 s | "Same Day, placed after noon?" | 2.16 s | 51.16 s |
| 6c | 51.80 s | "Ninety-five percent likely to be late." | 2.15 s | 53.95 s |
| 6d | 54.45 s | "Flag it." | 0.80 s | 55.25 s |
| 7 | 55.70 s | "No model beats the rule. So we chose the one you can explain." | 3.71 s | 59.41 s |

Clips never overlap: there are at least 0.3 s between them. Each "Out." lands 0.3 s before its card changes.

### Sound
- **Music:** soft, warm instrumental (felt piano and pad), about 84 BPM, in one key, with a gentle lift at scene 5 (the champion).
- **Effects:**
  - soft ticks under the count-ups
  - a muted low thud when Random Forest and Naive Bayes are marked "Out"
  - a light click on the example chip
  - a soft rising tone as the gauge passes the cut-off
- **Mix (voice first):**
  - **Voice:** about −16 LUFS, clear and dry, light compression, high-pass at 80 Hz.
  - **Music:** ducks about 10 dB under every voice line (300 ms attack, 600 ms release) and comes back up in the gaps.
  - **Effects:** in the same key and space as the music, mixed under both. Effects never land on top of a spoken number.
  - **End:** the music fades out over the last 1.5 s, after the final line.

### Facts used (all from content/site_data.json and api/app/examples.json)
- 62,897 orders; scores, CV and test ROC-AUC exactly as in the results table; tie zone ±0.005 around the rule's 0.7748.
- Fit gaps from docx Figure 4; Random Forest out at step 1, Naive Bayes out at step 2.
- The champion's coefficients from IT24102928.md §5.7.
- Example orders: High risk is order 74041, P(late) 0.9514, actually late; Low risk is order 76115, P(late) 0.0705, actually on time.

---
