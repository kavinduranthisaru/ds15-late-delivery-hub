# DS-15 Hub: late delivery risk

A tab-based web app for IT3091 Group 2026-DS-15 (DataCo Smart Supply Chain). It does two jobs:

1. **Explains and compares the group's 8 models.** The pages are Overview, Models, Compare, Charts, Method and About. Every number comes from one file, `content/site_data.json`.
2. **Predicts late delivery for an order** with the champion model: Logistic Regression by Madushani G.R. (IT24102928).

The app works on phones and desktops, in light and dark themes. It installs as a PWA and works offline.
**It is fully static:** the champion runs in the browser, so the site deploys to Vercel with no server (see Deploy).

Also in this repo:
- `brag-output/brag.mp4`: the 60 s launch video, with its poster, plan and share copy.
- `docs/video-script-3min.md`: the 3-minute project video script.
- `docs/canva-slides-prompt.md`: the prompt for the Canva backdrop slides.
- `docs/brag-script.md`: the storyboard of the launch video.

| Part | Stack |
|---|---|
| `web/` | React 18, Vite 6, TypeScript, Tailwind 4, Recharts, vite-plugin-pwa |
| `api/` | FastAPI, scikit-learn 1.6.1, pandas 2.2.3 (pinned to the versions of the reported runs) |
| `content/` | `build_site_data.py`, which builds `site_data.json` from `Model_Comparison_Summary.docx` |
| `sources/` | `Model_Comparison_Summary.docx` (committed) and `dataset.zip` (download it, see `sources/README.md`) |

## Setup (macOS)

```bash
# Python 3.13 environment, kept outside OneDrive
python3 -m venv ~/.ds15/venv
~/.ds15/venv/bin/pip install -r api/requirements.txt

# Front end
cd web && npm install && cd ..
```

Put `dataset.zip` and `Model_Comparison_Summary.docx` in `sources/`, or set `DS15_SOURCES` to a folder that has them.

## Build the data and the champion (one time, about 1 minute)

```bash
cd api
~/.ds15/venv/bin/python scripts/build_reference.py    # form values and rule-group late rates (training window)
~/.ds15/venv/bin/python scripts/build_pipeline.py     # pipeline v1.0 rebuilt from dataset.zip with Notebook 02 code
~/.ds15/venv/bin/python scripts/retrain_champion.py   # Logistic Regression, checked against IT24102928.md
~/.ds15/venv/bin/python scripts/build_parity_rows.py  # the 20 fixed test orders for the parity test
~/.ds15/venv/bin/python scripts/build_examples.py     # the Low / Mixed / High example orders
~/.ds15/venv/bin/python scripts/export_browser_model.py  # champion weights for in-browser scoring, checked exact
cd ../web && npm run data                             # site_data.json + reference and examples for the front end
```

The repo already contains everything these steps produce, so you only need them to rebuild from scratch.

`retrain_champion.py` prints every check. The current result:
- the retrained model matches all 17 reported values: CV ROC-AUC 0.7743, test ROC-AUC 0.7793, PR-AUC 0.8593, Brier 0.1735, the intercept 0.754 and the coefficients
- its 20 selected columns are the same list as in the report

## Run

```bash
cd web && npm install && npm run dev        # http://127.0.0.1:5173
# or the production build: npm run build && npm run preview   (http://127.0.0.1:4173)
```

The web app needs no back end. **Predict runs the champion in the browser.**
- `src/lib/champion-core.mjs` applies the exact linear form of the saved scikit-learn pipeline: fitted scaler means and scales, one-hot categories, 20 selected columns, coefficients, sigmoid.
- `src/data/champion_model.json` holds those numbers, exported from the joblib file by `api/scripts/export_browser_model.py`.

The FastAPI back end (`api/`) is optional. It serves the same champion from the joblib file, for tests and for teammates' model files:

```bash
cd api && ~/.ds15/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
```

## Test

| What | Command | Current result |
|---|---|---|
| API, features, pipeline, champion parity | `cd api && ~/.ds15/venv/bin/python -m pytest -q` | 25 passed, 3 skipped (see below) |
| Parity on 20 fixed test orders | part of the run above | 20 of 20 match the saved champion predictions to 4 decimals |
| Browser model vs the Python pipeline | `cd web && node scripts/parity.mjs` | all 13,071 test orders match (max difference 5e-13); example reasons match the API word for word |
| Every page and tab at 375 and 1280 px, light and dark | `cd web && node scripts/screens.mjs` | 0 console errors, no sideways scroll, no page scroll on desktop |
| Rendered numbers vs the results table | `node scripts/audit-numbers.mjs` | 101 of 101 match |
| Colour contrast (WCAG AA) | `node scripts/contrast.mjs` | all pairs pass |
| Lighthouse (mobile) | `npx lighthouse http://127.0.0.1:4173/` | performance 93 to 97, accessibility 100 |

- **The 3 skipped tests** are parity tests for Naive Bayes, KNN and Linear SVM. They run on their own once those model files are dropped into `api/model_store/<model>/`.
- **The screenshot and audit scripts** need the preview server (`npm run preview`). They save screenshots to `screenshots/`.

## API

| Endpoint | What it does |
|---|---|
| `GET /health` | Which models loaded, and why the others did not |
| `GET /models`, `GET /models/{name}` | The results table plus details. Unknown names get a 404 that lists the valid ones. |
| `POST /predict` | `{"order": {...}, "model": optional}`. Uses the champion by default. Returns the probability, cut-off 0.6040, Late or On time, the tier and a plain-English reason. |
| `POST /predict/all` | Every model for one order. Models without a file come back as `available: false`. |
| `GET /reference`, `GET /examples` | Form values and the three example orders |

Inputs are checked with Pydantic:
- unknown fields are rejected
- the region must be in the chosen market
- quantity must be at least the number of lines
- the discount must be less than the order value

Values outside the training range still get a prediction, with a warning.

## Deploy (Vercel)

1. On vercel.com, choose **Add New → Project** and import this GitHub repo.
2. Leave **Root Directory** as the repo root. `vercel.json` already sets the build:
   - install `cd web && npm ci`
   - build `cd web && npm run build`
   - output `web/dist`
   - every page route rewrites to `index.html`, so deep links like `/models/knn` work
3. Press **Deploy**. Every push to `main` redeploys.

There are no environment variables, secrets or database. To share a preview before going public, use the deployment URL Vercel shows. For a private group link, turn on Vercel's **Deployment Protection**.

## Known limits

- **The served champion is a local retrain.** Madushani's original model file was not provided. The app rebuilds pipeline v1.0 from `dataset.zip` with Notebook 02's code, then retrains Logistic Regression from her reported settings. It reproduces every reported number and coefficient exactly, but it is not her saved file.
- **Predict in the browser is the exported champion.** It is checked to give the same probability as the joblib pipeline on every test order. The joblib file itself stays in `api/model_store/`.
- **Predict uses only the champion.** The other seven models are documentation only, because their saved files were not provided. Their numbers come from the group's results table.
- **The scorecard heatmap and the rank-robustness chart are images** taken from the docx, because their per-cell data was not available.
- **Risk tiers are provisional.** The cut-points are Medium from 0.60 and High from 0.90, taken from Ranthisaru's (IT24102255) notebooks.
- **The data has a ceiling of about 0.775 ROC-AUC.** Inside Standard Class and Second Class, lateness is a coin flip with respect to everything known at order time.
