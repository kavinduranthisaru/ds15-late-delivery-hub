# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

The DS-15 Hub web app for the IT3091 group assignment (late delivery risk, DataCo dataset). The group's notebooks and reports live in the OneDrive folder `3Y 1S/ML Assignment/ML`. This app was moved out of OneDrive because OneDrive kept evicting files. Inputs are copied into `sources/` (override with `DS15_SOURCES`). Setup, run and test commands are in README.md.

## Commands
- Python env: `~/.ds15/venv` (scikit-learn 1.6.1 pinned; saved models only load with the same version).
- API tests: `cd api && ~/.ds15/venv/bin/python -m pytest -q`. Single test: `-k test_predict_champion`.
- Web: `cd web && npm run build`. Checks that need `npm run preview` and uvicorn running: `node scripts/screens.mjs [--only='/models?tab=table'] [--no-shots]`, `node scripts/audit-numbers.mjs`, `node scripts/contrast.mjs`.

## Architecture
- **One source for numbers.** `content/build_site_data.py` parses `Model_Comparison_Summary.docx` and merges in the agreed results table (`RESULTS`) and per-model notes from the member reports (`MODEL_DETAILS`). It fails if the docx ranking table differs from `RESULTS`, or if any em or en dash appears. `npm run data` copies the output, plus `api/app/reference.json` and `examples.json`, into `web/src/data/`. Never hard-code metrics in components.
- **Champion pipeline.** `api/scripts/_common.rebuild_orders()` is Notebook 02 Steps 1a, 1b, 3 and 5, copied unchanged. `build_pipeline.py` adds Steps 6, 7, 9–12 and asserts the reported sizes, late rates, the 448-order CV gap and the fold sizes. `retrain_champion.py` refits Madushani's LR (`make_pipeline`: pre → VarianceThreshold → SelectKBest(f_classif, 20) → LogisticRegression C=0.1 L2 lbfgs). It compares 17 values and the selected columns with IT24102928.md and writes `retrain_report.json`.
- **API** (`api/app`):
  - `features.engineer` repeats Step 5 for form orders; a test checks it on all 62,897 orders.
  - `registry.py` loads each notebook's bundle format. Missing files become "unavailable", never errors.
  - `explain.py` builds the reason from the LR pipeline's own coefficients.
- **Browser champion:** `web/src/lib/champion-core.mjs` plus `web/src/data/champion_model.json` (exported by `api/scripts/export_browser_model.py`) reproduce the LR pipeline exactly; `node web/scripts/parity.mjs` checks all 13,071 test orders. Re-export after any retrain. Deploys as a static site on Vercel (`vercel.json`).
- **Front end** (`web/src`):
  - The `Shell` holds the sidebar, the phone bottom tabs and Cmd+K search.
  - Each route is a `Page` (title, summary, `SegTabs`), with the tab kept in `?tab=`. Pages are sized so the desktop body never scrolls; only inner panels scroll.
  - Design tokens are CSS variables in `styles/index.css`, taken from the HR Hub / K&Z references. There is one fixed colour per member (`MEMBER_VAR`), and owners are always shown as name + ID.

## Rules
- Never fake predictions or numbers. Models without a provided file stay documentation-only.
- Simple English and no em dashes in user-facing text. WCAG AA: run `contrast.mjs` after changing colours. Touch targets of at least 44 px.
