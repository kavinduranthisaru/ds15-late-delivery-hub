# Prompt for Claude + Canva: backdrop slides for the 3-minute video

Paste everything inside the block below into Claude (with the Canva connector on), and attach your web app screenshots in the same message.

```
Create a Canva presentation (16:9, 1920×1080) with 6 slides. These slides will be shown on a screen BEHIND a
presenter while we film a 3-minute project video, so they are backdrops, not reading slides.

PROJECT
IT3091 Machine Learning, Group 2026-DS-15. "Late delivery risk on the DataCo supply chain dataset."
We compared 8 models that predict if an order will arrive late, and built a web app (DS-15 Hub).
I have attached screenshots of the web app. Match its look exactly and reuse the screenshots where I say so.

BACKDROP RULES (important)
- The presenter stands in front of the RIGHT third of the slide. Keep the right 35% of every slide empty
  (plain background only). Put all content in the left 65%.
- Very few words. Large type that a camera can read from 3 metres: titles 80–96 pt, key numbers 120–160 pt,
  supporting lines 36–44 pt. Nothing smaller than 30 pt except the footer.
- One idea per slide. No bullet lists longer than 3 items. No paragraphs.
- Flat and calm: no gradients, no drop shadows heavier than a soft 1 px shadow, no stock photos, no clip art,
  no animations or transitions.
- Same footer on every slide, bottom-left, 20 pt, uppercase, letter-spaced, grey #6E6E74:
  "IT3091 · GROUP 2026-DS-15 · 62,897 DATACO ORDERS"

STYLE (copy from the web app screenshots)
- Font: Plus Jakarta Sans everywhere. Bold 700 for titles and numbers, Medium 500 for supporting text.
- Background: light grey #F2F2F2.
- Cards: white #FFFFFF, corner radius 22 px, 1 px border #E7E7EA.
- Text: near-black #131313. Slide titles in navy #1B1F4B. Secondary text #4A4A4F. Muted text #6E6E74.
- Accent: mint green #A9E9AF for highlights, active pills and the champion. Text on green is #131313.
- Primary pill: black #131313 with green #A9E9AF text, fully rounded.
- Tags (small fully rounded pills): mint #DFF9F0 with text #11643F; pink #F6E6E6 with text #A3222B;
  peach #FDEADB with text #9A4A07; blue #E5EEFB with text #244C8F; grey #ECECEF with text #3F3F45.
- Champion card tint: #EEF9EF with border #BFE8C4. Warning card tint: peach #FFF3EA with border #F6CBA9.
- One fixed colour per team member, used as a small dot or avatar circle next to the name:
  Madushani G.R. (IT24102928) #22804A · Ranthisaru T.K.K. (IT24102255) #3B6FD8 ·
  Ratnaweera D.U.A. (IT24102397) #C2364F · Maheepala S.A.D.A.O. (IT24102901) #A85C0E
- Always write a person as name + ID. Never "Member 1".

SLIDES (use this text exactly; do not add or change any number)

Slide 1 · Opening
- Small label (uppercase, grey): "IT3091 MACHINE LEARNING · GROUP 2026-DS-15"
- Title: "Late delivery risk"
- Big number in a white card: "57%" with the line "of orders arrived late"
- Small line: "DataCo Smart Supply Chain"

Slide 2 · The business problem
- Label: "THE BUSINESS PROBLEM"
- Title (the question, large): "When an order is confirmed, can we tell if it will arrive late?"
- Three small tags in a row: "Late orders cost money" (pink) · "Late orders cost trust" (pink) ·
  "Act before the parcel ships" (mint)
- Small line: "DataCo · global supply chain"

Slide 3 · The data
- Label: "THE DATA"
- Title: "62,897 orders"
- Three stat cards in a row:
  1) "180,519" / "order lines"   2) "62,897" / "orders"   3) "57%" / "late"
- A horizontal split bar under the cards with three parts and labels:
  "Train 44,492 · 2015-01 to 2017-03" (dark grey #4A4A4F), "Validation 4,564 · 2017-04 to 2017-06" (green #22804A),
  "Test 13,071 · 2017-07 to 2018-01" (amber #A85C0E). Bar widths in proportion to the counts.
- One line: "Only facts known at order time · split by date"
- Source line (24 pt, grey): "Data: Constante, Silva and Pereira (2019), DataCo Smart Supply Chain for Big Data Analysis,
  Mendeley Data V4, doi 10.17632/8gx2fvg2k6.4"
- If I attached the "Problem & data" screenshot, you may use its split bar as a visual reference only.

Slide 4 · Our solution
- Label: "OUR SOLUTION"
- Title: "8 models. One fair comparison."
- Row of four grey tags: "Shared pipeline v1.0" · "8 models" · "Same 5 time-ordered folds" · "100-point scorecard"
- A green champion card (tint #EEF9EF):
  green tag "Champion · rank 1 of 8", name "Logistic Regression",
  owner line with a green dot "Madushani G.R. IT24102928",
  three numbers: "88.8 / 100" · "CV ROC-AUC 0.7743" · "Test ROC-AUC 0.7793"
- Small peach note under the card: "No model beats the simple shipping-mode rule (0.7748)"
- If I attached a Models or Predict screenshot, place ONE of them as a rounded-corner image (22 px radius,
  1 px border #E7E7EA) small, bottom-left of the content area. Do not crop out numbers.

Slide 5 · Recommendations for DataCo
- Label: "RECOMMENDATIONS FOR DATACO"
- Title: "Three things to do"
- Three numbered white cards stacked or in a row. Number in a black circle with green text:
  1 · "Check every order at confirmation" / "Flag risk above 0.60 · about 9 in 10 flags are right"
  2 · "Fix the delivery promises" / "First Class and Same Day after 12:00 were always late"
  3 · "Collect better data" / "Warehouse workload · carrier · distance"

Slide 6 · Close
- Title: "Thank you"
- Four white pill cards in a 2×2 grid, each with a coloured avatar circle (first letter, white text) + name + ID:
  M  Madushani G.R.  IT24102928   (#22804A)
  R  Ranthisaru T.K.K.  IT24102255   (#3B6FD8)
  R  Ratnaweera D.U.A.  IT24102397   (#C2364F)
  M  Maheepala S.A.D.A.O.  IT24102901   (#A85C0E)
- Small line: "IT3091 Machine Learning · Group 2026-DS-15"

CHECKS BEFORE YOU FINISH
- Every number matches this prompt exactly: 57%, 180,519, 62,897, 44,492, 4,564, 13,071, 88.8, 0.7743,
  0.7793, 0.7748, 0.60.
- The right 35% of each slide is empty.
- No em dashes. Simple English. Same font, colours and corner radius on all six slides.
- Give me the Canva link, and tell me if any font or colour could not be matched.
```

## Which slide goes with which part of the script

| Slide | Script part | Time |
|---|---|---|
| 1 Opening | Opening | 0:00–0:15 |
| 2 The business problem | The business problem | 0:15–0:35 |
| 3 The data | The data | 0:35–1:00 |
| (no slide) | brag video | 1:00–2:00 |
| 4 Our solution | Our solution | 2:00–2:25 |
| 5 Recommendations | Recommendations for DataCo | 2:25–2:53 |
| 6 Close | Close | 2:53–3:00 |

## Screenshots to attach (light theme, 1920×1080, browser zoom 100%)
1. Overview > Summary (shows the style: cards, tags, champion card)
2. Overview > Problem & data (the split bar)
3. Models > Cards (the eight model cards)
4. Predict, after pressing the "High risk" example (optional, for slide 4)

If the presenter will stand on the left instead, change "RIGHT third … right 35% … left 65%" in the prompt to the other side.
