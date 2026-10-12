"""Export the champion (Logistic Regression, Madushani IT24102928) so the web app can score orders in the browser.

The model is linear, so the fitted pipeline reduces exactly to: for each of the 20 selected columns, take the
order's value (standardised numbers use the fitted mean and scale; one-hot columns are 1 or 0), multiply by the
coefficient, add the intercept, apply the sigmoid. This script reads every number from the saved joblib pipeline
(no hand-typed values), then proves the export is exact:
  1. a NumPy re-implementation of the JSON matches pipeline.predict_proba on all 62,897 orders (max error < 1e-9);
  2. it writes web/scripts/fixtures/champion_parity.json (the 13,071 test orders and their probabilities), which
     web/scripts/parity.mjs uses to check the browser code itself.
Run:  python api/scripts/export_browser_model.py
"""
import json

import joblib
import numpy as np
import pandas as pd

from _common import FEATURES, STORE, TARGET, TEST_START, WEBAPP, cached_orders

OUT = WEBAPP / 'web' / 'src' / 'data' / 'champion_model.json'
FIXTURE = WEBAPP / 'web' / 'scripts' / 'fixtures' / 'champion_parity.json'
INPUTS = ['order_date', 'shipping_mode', 'market', 'order_region', 'customer_segment', 'payment_type',
          'n_lines', 'total_qty', 'gross_sales', 'total_discount', 'max_unit_price']


def main():
    bundle = joblib.load(STORE / 'logistic_regression' / 'logistic_regression.joblib')
    pipe = bundle['model']
    pre, drop, sel, lr = (pipe.named_steps[k] for k in ('pre', 'drop_constant', 'select', 'model'))

    # Describe every one of the 54 preprocessor outputs, in output order.
    cols = []
    for name, tr, feats in pre.transformers_:
        if name in ('num_mean', 'num_median'):
            imp, sc = tr.named_steps['impute'], tr.named_steps['scale']
            for f, fill, m, s in zip(feats, imp.statistics_, sc.mean_, sc.scale_):
                cols.append({'name': f, 'kind': 'num', 'feature': f, 'mean': float(m), 'scale': float(s), 'fill': float(fill)})
        elif name == 'cat_mode':
            enc = tr.named_steps['onehot']
            assert all(i is None for i in enc.infrequent_categories_), 'infrequent levels present: update the export'
            for f, cats in zip(feats, enc.categories_):
                for c in cats:
                    cols.append({'name': f'{f}_{c}', 'kind': 'onehot', 'feature': f, 'category': str(c)})
        elif name == 'binary':
            for f, fill in zip(feats, tr.statistics_):
                cols.append({'name': f, 'kind': 'binary', 'feature': f, 'fill': float(fill)})
    assert [c['name'] for c in cols] == list(pre.get_feature_names_out())

    keep = np.where(drop.get_support())[0][sel.get_support()]
    terms = [{**cols[i], 'coef': float(w)} for i, w in zip(keep, lr.coef_[0])]
    model = {
        'model': 'Logistic Regression', 'owner': 'Madushani G.R.', 'owner_id': 'IT24102928',
        'provenance': bundle.get('provenance'), 'cutoff': bundle['threshold'], 'tiers': {'Medium': 0.6, 'High': 0.9},
        'intercept': float(lr.intercept_[0]), 'terms': terms,
        'note': 'Exported from model_store/logistic_regression/logistic_regression.joblib by api/scripts/export_browser_model.py',
    }

    # Check 1: NumPy version of the export vs the real pipeline on every order.
    orders = cached_orders()
    X = orders[FEATURES]
    z = np.full(len(X), model['intercept'])
    for t in terms:
        v = X[t['feature']]
        x = ((v - t['mean']) / t['scale']).to_numpy(float) if t['kind'] == 'num' else \
            (v.astype(str) == t['category']).to_numpy(float) if t['kind'] == 'onehot' else v.to_numpy(float)
        z += t['coef'] * x
    p_export = 1 / (1 + np.exp(-z))
    p_pipe = pipe.predict_proba(X)[:, 1]
    err = float(np.abs(p_export - p_pipe).max())
    assert err < 1e-9, f'export differs from the pipeline by {err}'

    OUT.write_text(json.dumps(model, indent=1) + '\n')
    test = orders[orders['order_date'] >= TEST_START].copy()
    test['p'] = pipe.predict_proba(test[FEATURES])[:, 1]
    test['order_date'] = test['order_date'].dt.strftime('%Y-%m-%dT%H:%M')
    rows = [[*r[INPUTS].tolist(), round(float(r['p']), 12)] for _, r in test.iterrows()]
    FIXTURE.parent.mkdir(parents=True, exist_ok=True)
    FIXTURE.write_text(json.dumps({'fields': INPUTS + ['p'], 'rows': rows}, separators=(',', ':')))
    print(f'Wrote {OUT.name}: {len(terms)} terms; max |export - pipeline| on {len(X):,} orders = {err:.2e}')
    print(f'Wrote {FIXTURE.name}: {len(rows):,} test orders')


if __name__ == '__main__':
    main()
