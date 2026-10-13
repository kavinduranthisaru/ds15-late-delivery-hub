# Thumbnail prompt, video title and description

## 1. Prompt for Claude + Canva (thumbnail as one presentation slide)

Paste this into Claude with the Canva connector on. Attach two screenshots of the web app in light theme:
- the champion card (Overview > Summary)
- the Predict result showing 95%

```
Create a Canva presentation with ONE slide (16:9, 1920×1080). It is the THUMBNAIL for our 3-minute project video,
so it must read clearly when shown small (about 320×180 px on YouTube or a phone). I have attached screenshots of
our web app; copy its look exactly.

PROJECT
IT3091 Machine Learning, Group 2026-DS-15. We compared 8 machine learning models that predict if a DataCo order
will arrive late. The winner is Logistic Regression by Madushani G.R. (IT24102928).

THUMBNAIL RULES
- At most 8 words of large text in total. Nothing important smaller than 48 pt.
- High contrast, one clear focal point, generous empty space. No paragraphs, no tables, no stock photos,
  no clip art, no gradients, no faces.
- Keep a 100 px safe margin on every edge. Keep the bottom-right corner (380 × 120 px) empty,
  because YouTube puts the video length there.

STYLE (from the web app)
- Font: Plus Jakarta Sans. Bold 700 for the headline and numbers.
- Background: light grey #F2F2F2.
- Headline colour: navy #1B1F4B. Body text: #131313. Muted: #6E6E74.
- Accent: mint green #A9E9AF. Champion card: tint #EEF9EF, 1 px border #BFE8C4, corner radius 22 px.
- Tags are fully rounded pills: green #A9E9AF with #131313 text; pink #F6E6E6 with #A3222B text.
- Primary pill: black #131313 with green #A9E9AF text.

LAYOUT
- LEFT HALF, stacked:
  - Headline over two lines, 150–170 pt, navy: "8 models." / "1 winner."
  - Under it, a black pill (60 pt text, green): "Late delivery risk"
- RIGHT HALF: one large champion card (tint #EEF9EF, radius 22 px), straight (no tilt):
  - green tag at the top: "Champion"
  - "Logistic Regression" in 72 pt bold
  - a huge number "0.7793" in 140 pt bold with a small label above it "Test ROC-AUC" (40 pt, muted)
  - a small owner line with a green dot (#22804A): "Madushani G.R. IT24102928" (36 pt)
- Optional accent: a small pink pill overlapping the card's top-left corner: "95% late" (an example order
  the model flagged). Leave it out if it makes the slide busy.
- Bottom-left, 32 pt, muted, uppercase, letter-spaced: "IT3091 · GROUP 2026-DS-15"

CHECKS
- Use exactly these numbers: 8, 0.7793, 95%. Do not invent any other numbers or claims.
- No em dashes. Same font and colours as the screenshots.
- Make a second version of the same slide where the headline is "No model beat" / "the simple rule." and
  everything else is the same, so we can pick the better one.
- Give me the Canva link and export both as PNG at 1920×1080.
```

## 2. Video title (pick one)

1. **8 Models, 1 Honest Winner: Predicting Late Deliveries | IT3091 Group 2026-DS-15**
2. Can We Predict a Late Delivery Before It Ships? | DataCo Machine Learning Project
3. Late Delivery Risk on DataCo: 8 Models Compared, One Champion | IT3091 ML Group 2026-DS-15

YouTube shows about the first 60 characters, so option 1 puts the hook first.

## 3. Video description

```
Can we tell, at the moment an order is confirmed, if it will arrive late? This is our IT3091 Machine Learning
project (Group 2026-DS-15) on late delivery risk for DataCo, a global supply chain business.

We turned 180,519 order lines into 62,897 orders (about 57% late), used only facts known when an order is placed,
and split the data by date so every model learns from the past and is tested on the future. Eight models were
compared on the same five time-ordered folds and ranked on a 100-point scorecard.

The honest result: no model beats a simple shipping-mode rule (CV ROC-AUC 0.7748). So our champion is the model
you can explain: Logistic Regression by Madushani G.R. (IT24102928), with a test ROC-AUC of 0.7793.

Our recommendations for DataCo:
1. Check every order at confirmation and flag risk above 0.60 (about 9 in 10 flagged orders were really late).
2. Fix the delivery promises: in our training data, every First Class order and every Same Day order placed after
   12:00 arrived late.
3. Collect better data, such as warehouse workload, carrier and distance.

Chapters
0:00 Opening
0:15 The business problem
0:35 The data
1:00 Eight models, one honest winner
2:00 Our solution
2:25 Recommendations for DataCo
2:53 Thank you

Team
Madushani G.R. (IT24102928): Logistic Regression, Naive Bayes
Ranthisaru T.K.K. (IT24102255): KNN, Linear SVM
Ratnaweera D.U.A. (IT24102397): Decision Tree, Random Forest
Maheepala S.A.D.A.O. (IT24102901): AdaBoost, XGBoost

Try the web app: ADD-YOUR-VERCEL-LINK-HERE

Dataset
Constante, F., Silva, F. and Pereira, A. (2019). DataCo SMART SUPPLY CHAIN FOR BIG DATA ANALYSIS.
Mendeley Data, V4. https://doi.org/10.17632/8gx2fvg2k6.4 (CC BY 4.0)

Voiceover in the middle section is generated with macOS text-to-speech. Built for IT3091 Machine Learning,
Sri Lanka Institute of Information Technology.

#MachineLearning #DataScience #SupplyChain #LogisticRegression #IT3091
```
