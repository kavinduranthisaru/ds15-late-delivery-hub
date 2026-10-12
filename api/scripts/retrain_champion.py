"""Retrain the champion, Logistic Regression (Madushani IT24102928), on the rebuilt pipeline v1.0.

Madushani's saved model file was not provided, so the app refits it from her notebook and report:
  make_pipeline = shared preprocessor -> VarianceThreshold() -> SelectKBest(f_classif, k=20) -> LogisticRegression
  with C = 0.1, L2, no class weight, max_iter = 5000, random_state = 42; no calibration; cut-off 0.6040.
Her notebook file is online-only and could not be opened, so the solver is not known from the code. The script
fits each scikit-learn solver that supports L2 and keeps the one that reproduces her reported coefficients.

Everything is compared with IT24102928.md and printed. Nothing is changed to make it match.
Outputs: model_store/logistic_regression/logistic_regression.joblib (her bundle format, plus retrained_by_app)
         model_store/logistic_regression/predictions_logistic_regression.parquet (train, validation, test)
         model_store/logistic_regression/retrain_report.json
Run:  python api/scripts/retrain_champion.py
"""
import json
from datetime import datetime

import joblib
import numpy as np
import pandas as pd
import sklearn
from sklearn.base import clone
from sklearn.feature_selection import SelectKBest, VarianceThreshold, f_classif
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import average_precision_score, brier_score_loss, log_loss, roc_auc_score
from sklearn.pipeline import Pipeline

from _common import FEATURES, PIPELINE, SEED, STORE, TARGET

CUTOFF = 0.6040
REPORTED = {   # IT24102928.md, sections 5.5 to 5.12
    'cv_pr': 0.8564, 'cv_roc': 0.7743, 'train_pr': 0.8583, 'train_roc': 0.7792,
    'test_pr': 0.8593, 'test_roc': 0.7793, 'test_brier': 0.1735, 'test_logloss': 0.5013, 'test_flag_rate': 0.3790,
    'val_flag_rate': 0.3655, 'intercept': 0.754,
    'coef': {'same_day_after_cutoff': 5.5161, 'shipping_mode_First Class': 4.3032, 'shipping_mode_Same Day': -3.3487,
             'shipping_mode_Standard Class': -1.1893, 'shipping_mode_Second Class': 0.5988, 'order_region_Canada': -0.2484},
    'columns': ['hour_sin', 'hour_cos', 'dow_sin', 'dow_cos', 'shipping_mode_First Class', 'shipping_mode_Same Day',
                'shipping_mode_Second Class', 'shipping_mode_Standard Class', 'market_Africa', 'order_region_Canada',
                'order_region_Caribbean', 'order_region_Central Africa', 'order_region_Northern Europe',
                'order_region_South of USA', 'order_region_Southern Europe', 'order_region_West Africa',
                'order_region_West Asia', 'order_region_Western Europe', 'is_after_noon', 'same_day_after_cutoff'],
}


def make_pipeline(pre, model, k):
    """Madushani's make_pipeline: shared preprocessor -> drop constant columns -> keep k best columns -> model."""
    return Pipeline([('pre', clone(pre)), ('drop_constant', VarianceThreshold()),
                     ('select', SelectKBest(f_classif, k=k)), ('model', model)])


def selected_features(pipe):
    names = pipe.named_steps['pre'].get_feature_names_out()
    names = pipe.named_steps['drop_constant'].get_feature_names_out(names)
    return list(pipe.named_steps['select'].get_feature_names_out(names))


def main():
    manifest = json.loads((PIPELINE / 'manifest.json').read_text())
    pre = joblib.load(PIPELINE / 'preprocessor_unfitted.joblib')
    train = pd.read_parquet(PIPELINE / 'train_orders.parquet')
    val = pd.read_parquet(PIPELINE / 'val_orders.parquet')
    test = pd.read_parquet(PIPELINE / 'test_orders.parquet')
    X, y = train[FEATURES], train[TARGET]
    folds = [(np.arange(*f['train']), np.arange(*f['val'])) for f in json.loads((PIPELINE / 'cv_folds.json').read_text())['folds']]

    # Which solver reproduces the reported weights?
    candidates = {}
    for solver in ['lbfgs', 'liblinear', 'newton-cg', 'newton-cholesky', 'sag', 'saga']:
        lr = LogisticRegression(C=0.1, penalty='l2', class_weight=None, solver=solver, max_iter=5000, random_state=SEED)
        pipe = make_pipeline(pre, lr, 20).fit(X, y)
        cols = selected_features(pipe)
        coef = dict(zip(cols, pipe.named_steps['model'].coef_[0]))
        err = max(abs(coef.get(k, np.nan) - v) for k, v in REPORTED['coef'].items())
        err = max(err, abs(pipe.named_steps['model'].intercept_[0] - REPORTED['intercept']))
        candidates[solver] = (err, pipe)
        print(f'  solver {solver:16s} largest gap to the reported weights: {err:.4f}')
    solver = min(candidates, key=lambda s: candidates[s][0])
    err, final = candidates[solver]
    model = final.named_steps['model']

    cv = []
    for tr, va in folds:
        est = clone(final).fit(X.iloc[tr], y.iloc[tr])
        rank = est.decision_function(X.iloc[va])
        cv.append((average_precision_score(y.iloc[va], rank), roc_auc_score(y.iloc[va], rank)))
    p = {s: final.predict_proba(d[FEATURES])[:, 1] for s, d in [('train', train), ('validation', val), ('test', test)]}
    got = {
        'cv_pr': np.mean([c[0] for c in cv]), 'cv_roc': np.mean([c[1] for c in cv]),
        'train_pr': average_precision_score(y, p['train']), 'train_roc': roc_auc_score(y, p['train']),
        'test_pr': average_precision_score(test[TARGET], p['test']), 'test_roc': roc_auc_score(test[TARGET], p['test']),
        'test_brier': brier_score_loss(test[TARGET], p['test']), 'test_logloss': log_loss(test[TARGET], p['test']),
        'test_flag_rate': float((p['test'] >= CUTOFF).mean()), 'val_flag_rate': float((p['validation'] >= CUTOFF).mean()),
        'intercept': float(model.intercept_[0]),
    }
    cols = selected_features(final)
    coef = dict(zip(cols, model.coef_[0]))

    rows, mismatches = [], []
    for k, want in REPORTED.items():
        if k in ('coef', 'columns'):
            continue
        digits = 3 if k == 'intercept' else 4
        ok = round(got[k], digits) == round(want, digits)
        rows.append((k, round(got[k], digits), want, ok))
        if not ok:
            mismatches.append(k)
    for k, want in REPORTED['coef'].items():
        ok = round(coef[k], 4) == want
        rows.append((f'coef {k}', round(coef[k], 4), want, ok))
        if not ok:
            mismatches.append(f'coef {k}')
    cols_ok = cols == REPORTED['columns']
    if not cols_ok:
        mismatches.append('selected columns')

    print(f'\nChosen solver: {solver}')
    print(f"{'check':42s} {'retrained':>10s} {'reported':>10s}")
    for k, g, w, ok in rows:
        print(f"{k:42s} {g:>10} {w:>10}  {'match' if ok else 'DIFFERENT'}")
    print(f"{'20 selected columns':42s} {'same list' if cols_ok else 'DIFFERENT':>21s}")
    print('\nAll checks match the report.' if not mismatches else f'\nDifferences: {", ".join(mismatches)}')

    out = STORE / 'logistic_regression'
    out.mkdir(parents=True, exist_ok=True)
    joblib.dump({'model': final, 'threshold': CUTOFF, 'features': FEATURES, 'model_name': 'Logistic Regression',
                 'owner': 'Madushani G.R. (IT24102928)', 'pipeline_version': manifest['pipeline_version'], 'seed': SEED,
                 'best_params': f'k = 20, C = 0.1, penalty = L2, class_weight = None, solver = {solver}',
                 'calibration': 'none', 'created_at': datetime.now().isoformat(timespec='seconds'),
                 'retrained_by_app': True,
                 'provenance': 'retrained by this app from the reported settings (original file not provided)'},
                out / 'logistic_regression.joblib')
    pd.concat([pd.DataFrame({'order_id': d['order_id'].to_numpy(), 'order_date': d['order_date'].to_numpy(), 'split': s,
                             'y_true': d[TARGET].to_numpy(), 'risk_score': p[s], 'predicted_late': (p[s] >= CUTOFF).astype(int)})
               for s, d in [('train', train), ('validation', val), ('test', test)]], ignore_index=True) \
        .to_parquet(out / 'predictions_logistic_regression.parquet', index=False)
    (out / 'retrain_report.json').write_text(json.dumps({
        'solver': solver, 'scikit-learn': sklearn.__version__, 'checks': [
            {'check': k, 'retrained': g, 'reported': w, 'match': ok} for k, g, w, ok in rows],
        'selected_columns_match': cols_ok, 'mismatches': mismatches}, indent=2, default=float))
    print(f'Saved {out}/logistic_regression.joblib and predictions')


if __name__ == '__main__':
    main()
