"""Pick the three ready-made example orders for the Predict page from real test-window orders,
using the champion's own probability (model_store/logistic_regression).
- Low: a Same Day order placed before 12:00
- Mixed: a Standard Class order (about 4 in 10 of these were late in training)
- High: a Same Day order placed after 12:00
Run:  python api/scripts/build_examples.py"""
import json
import sys

import joblib
import pandas as pd

from _common import API, FEATURES, STORE, TARGET, TEST_START, cached_orders

sys.path.insert(0, str(API))
from build_parity_rows import FIELDS   # noqa: E402
from app.features import engineer   # noqa: E402

PICKS = [
    ('low', 'Low risk', 'Same Day order placed in the morning, before the noon cut-off.',
     lambda d: (d['shipping_mode'] == 'Same Day') & (d['same_day_after_cutoff'] == 0)),
    ('mixed', 'Mixed', 'Standard Class order. About 4 in 10 of these were late, so the model is unsure.',
     lambda d: d['shipping_mode'] == 'Standard Class'),
    ('high', 'High risk', 'Same Day order placed in the afternoon, after the noon cut-off.',
     lambda d: d['same_day_after_cutoff'] == 1),
]


def main():
    bundle = joblib.load(STORE / 'logistic_regression' / 'logistic_regression.joblib')
    test = cached_orders().query('order_date >= @TEST_START').reset_index(drop=True)
    test['p'] = bundle['model'].predict_proba(test[FEATURES])[:, 1]
    out = []
    for key, title, why, mask in PICKS:
        g = test[mask(test)]
        row = g.iloc[(g['p'] - g['p'].median()).abs().argsort().iloc[0]]   # the most typical order of its group
        order = {k: (row[k].strftime('%Y-%m-%dT%H:%M') if k == 'order_date' else
                     (int(row[k]) if k in ('n_lines', 'total_qty') else
                      round(float(row[k]), 2) if isinstance(row[k], float) else row[k]))
                 for k in FIELDS if k != 'order_id'}
        p = float(bundle['model'].predict_proba(engineer(pd.DataFrame([order])))[:, 1][0])   # exactly what /predict sees
        out.append({'key': key, 'title': title, 'why': why, 'order_id': int(row['order_id']),
                    'actual_late': int(row[TARGET]), 'champion_probability': round(p, 4), 'order': order})
        print(f"{title:10s} order {int(row['order_id'])}: P(late) = {p:.4f}, actually {'late' if row[TARGET] else 'on time'}")
    (API / 'app' / 'examples.json').write_text(json.dumps(out, indent=2) + '\n')


if __name__ == '__main__':
    main()
