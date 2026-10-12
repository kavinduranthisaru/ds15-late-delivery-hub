"""Build app/reference.json: category levels and market -> region pairs from the TRAINING window, numeric ranges,
and the late rate of each rule group. Run:  python api/scripts/build_reference.py"""
import json

from _common import API, TARGET, TRAIN_END, CAT_FEATURES, cached_orders


def main():
    orders = cached_orders()
    assert len(orders) == 62897, f'expected 62,897 orders, got {len(orders):,}'
    train = orders[orders['order_date'] < TRAIN_END]
    assert len(train) == 44492, f'expected 44,492 training orders, got {len(train):,}'
    q = lambda c, p: float(train[c].quantile(p))
    ref = {
        'source': 'dataset.zip rebuilt with Notebook 02 Steps 1a, 1b, 3 and 5; levels from the training window only',
        'categories': {c: sorted(train[c].unique().tolist()) for c in CAT_FEATURES},
        'market_regions': {m: sorted(g['order_region'].unique().tolist()) for m, g in train.groupby('market')},
        'numeric': {c: {'min': float(train[c].min()), 'median': q(c, 0.5), 'max': float(train[c].max())}
                    for c in ['n_lines', 'total_qty', 'gross_sales', 'total_discount', 'max_unit_price']},
        'late_rate_by_mode': {m: round(float(g[TARGET].mean()), 4) for m, g in train.groupby('shipping_mode')},
        'rule_groups': [{'shipping_mode': m, 'same_day_after_cutoff': int(c), 'orders': int(len(g)),
                         'late_rate': round(float(g[TARGET].mean()), 4)}
                        for (m, c), g in train.groupby(['shipping_mode', 'same_day_after_cutoff'])],
    }
    out = API / 'app' / 'reference.json'
    out.write_text(json.dumps(ref, indent=2) + '\n')
    print(f'Wrote {out}. Late rate by mode (train): {ref["late_rate_by_mode"]}')


if __name__ == '__main__':
    main()
