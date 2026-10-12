"""Pick the 20 fixed test orders used by tests/test_parity.py: 4 from each of the 5 rule groups
(shipping mode x Same Day noon cut-off), evenly spaced in time across the test window.
Run:  python api/scripts/build_parity_rows.py"""
import json

import numpy as np
import pandas as pd

from _common import API, TEST_START, cached_orders

FIELDS = ['order_id', 'order_date', 'shipping_mode', 'market', 'order_region', 'customer_segment', 'payment_type',
          'n_lines', 'total_qty', 'gross_sales', 'total_discount', 'max_unit_price']


def main():
    orders = cached_orders()
    test = orders[orders['order_date'] >= TEST_START].reset_index(drop=True)
    assert len(test) == 13071
    picks = [g.iloc[np.linspace(0, len(g) - 1, 4).round().astype(int)]
             for _, g in test.groupby(['shipping_mode', 'same_day_after_cutoff'])]
    rows = pd.concat(picks).sort_values('order_date')[FIELDS]
    rows['order_date'] = rows['order_date'].dt.strftime('%Y-%m-%dT%H:%M')
    out = API / 'tests' / 'parity_rows.json'
    out.write_text(json.dumps(rows.to_dict('records'), indent=2) + '\n')
    print(f'Wrote {out}: {len(rows)} orders')


if __name__ == '__main__':
    main()
