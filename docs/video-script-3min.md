# Late delivery risk: 3-minute project video script
IT3091 Machine Learning · Group 2026-DS-15

**Structure:** 1 minute filmed, then the 1-minute brag video (`brag-output/brag.mp4`), then 1 minute filmed.
**Voiceover to record:** about 2 minutes (290 words). Speak calmly, at about 145 words a minute.
**Speakers:** the split below is a suggestion. Swap names as you like. Each speaker should say their name and ID on screen once (as a lower-third caption).

---

## Part 1 · Filmed (0:00 – 1:00)

### 0:00 – 0:15 · Opening
**Speaker:** Ranthisaru T.K.K. (IT24102255), on camera
**Shot:** presenter at a desk, then cut to the app's Overview page on a laptop screen.
**On-screen text:** "Late delivery risk · Group 2026-DS-15"

> Every day, a delivery company makes thousands of promises to its customers. In our data, more than half of those promises were broken. We are Group 2026-DS-15, and this is our project on late delivery risk.

### 0:15 – 0:35 · The business problem
**Speaker:** Ranthisaru T.K.K. (IT24102255), voice over
**Shot:** b-roll of parcels, a warehouse or a delivery map, or a simple animated order going "late". Then the presenter again.
**On-screen text:** "Can we tell, at the moment an order is confirmed, if it will arrive late?"

> The company is DataCo, a global supply chain business. A late order costs money and trust. So the question is simple: when an order is confirmed, can we tell if it will arrive late? If we know early, the team can act before the parcel ships.

### 0:35 – 1:00 · The data
**Speaker:** Ratnaweera D.U.A. (IT24102397), voice over
**Shot:** screen recording of the app's Overview > "Problem & data" tab, showing the train, validation and test split bar.
**Lower-third:** "Data: DataCo Smart Supply Chain · Mendeley Data V4 · Constante, Silva and Pereira (2019)"
**On-screen text:** "180,519 order lines → 62,897 orders · 57% late · split by date"

> We used the DataCo Smart Supply Chain dataset, published on Mendeley Data: over 180,000 order lines, which we turned into 62,897 orders. About 57 percent were late. We only used facts known when the order is placed, like shipping mode, region and time. And we split the data by date, so every model learns from the past and is tested on the future. Here is how we found the answer.

*If this part runs long, drop "like shipping mode, region and time".*

---

## Part 2 · The brag video (1:00 – 2:00)

**Insert:** `brag-output/brag.mp4`, full length (60 s), with its own voice and music.
**Edit notes:**
- Fade the last line of Part 1 into the video's first frame. The video opens on "8 models. 1 question: will this order arrive late?", which answers "Here is how we found the answer."
- Do not add a voiceover or music on top. The video already has both.
- The video ends on "So we chose the one you can explain." Cut straight to Part 3.

**What it covers:**
- the 8 models
- the narrow ROC-AUC band and the simple rule
- the decision ladder
- the champion, Logistic Regression by Madushani G.R. (IT24102928)
- a live prediction

---

## Part 3 · Filmed (2:00 – 3:00)

### 2:00 – 2:25 · Our solution
**Speaker:** Madushani G.R. (IT24102928), on camera, then screen recording
**Shot:** the app's Models page (Cards, then Ranking table), then the Predict page running the "High risk" example.
**On-screen text:** "Shared pipeline · 8 models · same 5 folds · one scorecard"

> So, what did we build? One shared data pipeline, eight models tested on the same five time-ordered folds, and a fair scorecard to choose between them. Our champion is Logistic Regression: simple, honest and easy to explain. We also built a web app, where anyone can enter an order and see its risk, with the reason in plain English.

### 2:25 – 2:53 · Recommendations for DataCo
**Speaker:** Maheepala S.A.D.A.O. (IT24102901), on camera
**Shot:** presenter, with each recommendation appearing as a numbered card on screen.
**On-screen text:**
1. Check every order at confirmation · flag risk above 0.60
2. Fix the delivery promises for First Class and late Same Day orders
3. Collect better data: workload, carrier, distance

> Our recommendations for DataCo. First, check every order when it is confirmed, and flag the ones with a risk above 0.60. On our test data, about nine in ten flagged orders really were late. Second, fix the delivery promises. In our training data, every First Class order, and every Same Day order placed after noon, arrived late. Third, collect better data, like warehouse workload, carrier and distance. That is the only way to go beyond shipping mode.

### 2:53 – 3:00 · Close
**Speaker:** all four members on camera, or the brag video's last frame with the four name chips
**On-screen text:** "Group 2026-DS-15 · IT3091 Machine Learning" and the four names with IDs

> Thank you for watching. We are Group 2026-DS-15.

---

## Facts used (check before filming)

| Claim in the script | Source |
|---|---|
| Dataset: DataCo SMART SUPPLY CHAIN FOR BIG DATA ANALYSIS, Constante, Silva and Pereira (2019), Mendeley Data V4, DOI 10.17632/8gx2fvg2k6.4, CC BY 4.0 | https://data.mendeley.com/datasets/8gx2fvg2k6/4 |
| 180,519 order lines → 62,897 orders, cancelled and fraud orders removed | Notebook 02; pipeline v1.0 |
| About 57% late (late rate 0.573) | results table / `site_data.json` |
| Split by date: train 2015-01 to 2017-03, validation 2017-04 to 2017-06, test 2017-07 to 2018-01 | pipeline v1.0 |
| Champion Logistic Regression, cut-off 0.6040 | IT24102928.md, results table |
| "About 9 in 10 flagged orders were late" (test precision 0.8985 at the cut-off) | IT24102928.md §5.10 |
| First Class and Same Day after 12:00 were 100% late in training (6,820 and 1,123 orders) | `api/app/reference.json` |
| No model beats the simple rule; ceiling about 0.775 ROC-AUC | Model_Comparison_Summary.docx |

## Editing checklist
- Total length 3:00. The brag video sits exactly from 1:00 to 2:00.
- Match the look: the brag video uses a light grey `#F2F2F2` background, the Plus Jakarta Sans font and the green `#A9E9AF` accent. Use the same font and colours for your captions and lower-thirds.
- Match the audio: record the voiceover in a quiet room. Normalise the filmed parts to about −16 LUFS so they sit level with the brag video. A soft music bed under Parts 1 and 3 is fine, very low under the voice.
- Screen recordings: use the app in light theme at 1920×1080, browser zoom 100%. Run the API so the Predict page works.
- Captions: burn in subtitles for all spoken lines. The brag video's on-screen text already covers its middle minute.
