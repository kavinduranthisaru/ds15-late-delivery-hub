"""Plain-English reason for a prediction.

For the champion (Logistic Regression, Madushani IT24102928) the reason comes from the saved model itself:
each selected column's weight times its value, summed per input feature. The biggest push wins.
The sentence also states the training late rate of the order's rule group, from reference.json.
"""
import numpy as np
import pandas as pd

from .schemas import REFERENCE

FRIENDLY = {
    'shipping_mode': 'shipping mode', 'same_day_after_cutoff': 'the Same Day noon cut-off', 'market': 'market',
    'order_region': 'region', 'customer_segment': 'customer segment', 'payment_type': 'payment type',
    'n_lines': 'number of lines', 'total_qty': 'quantity', 'gross_sales': 'order value',
    'total_discount': 'discount', 'discount_rate': 'discount rate', 'max_unit_price': 'highest product price',
    'hour_sin': 'time of day', 'hour_cos': 'time of day', 'dow_sin': 'day of the week', 'dow_cos': 'day of the week',
    'month_sin': 'month', 'month_cos': 'month', 'is_after_noon': 'ordering after 12:00', 'is_weekend': 'weekend ordering',
}
_INPUTS = sorted(FRIENDLY, key=len, reverse=True)


def input_of(column):
    """Which input feature a model-ready column came from (one-hot columns are '<feature>_<level>')."""
    return next((f for f in _INPUTS if column == f or column.startswith(f + '_')), column)


def group_rate(row):
    mode, cut = row['shipping_mode'], int(row['same_day_after_cutoff'])
    return next(g for g in REFERENCE['rule_groups'] if g['shipping_mode'] == mode and g['same_day_after_cutoff'] == cut)


def group_sentence(row):
    g = group_rate(row)
    if row['shipping_mode'] == 'Same Day':
        when = 'after 12:00' if g['same_day_after_cutoff'] else 'before 12:00'
        return (f"In the training data, {g['late_rate']:.0%} of Same Day orders placed {when} were late "
                f"({g['orders']:,} orders).")
    return f"In the training data, {g['late_rate']:.0%} of {row['shipping_mode']} orders were late ({g['orders']:,} orders)."


def champion_contributions(bundle, X):
    """Per-input-feature contribution to the log-odds, from the saved LR pipeline (no refitting)."""
    steps = bundle['model'].named_steps
    Z = steps['pre'].transform(X[bundle['features']])
    names = list(steps['pre'].get_feature_names_out())
    Z = steps['drop_constant'].transform(Z)
    names = list(steps['drop_constant'].get_feature_names_out(names))
    Z = steps['select'].transform(Z)
    names = list(steps['select'].get_feature_names_out(names))
    contrib = np.asarray(Z)[0] * steps['model'].coef_[0]
    return pd.Series(contrib, index=[input_of(n) for n in names]).groupby(level=0).sum()


def reason(loaded, X):
    row = X.iloc[0]
    base = group_sentence(row)
    if loaded is None or loaded.key != 'logistic_regression':
        return base
    try:
        c = champion_contributions(loaded.raw, X)
    except Exception:   # noqa: BLE001  structure differs from the notebook: fall back to the group fact
        return base
    top = c.abs().idxmax()
    direction = 'raises' if c[top] > 0 else 'lowers'
    if top == 'shipping_mode':
        lead = f"The main reason is the shipping mode ({row['shipping_mode']}), which {direction} the risk the most."
    elif top == 'same_day_after_cutoff':
        lead = 'The main reason is the Same Day noon cut-off: this order came in after 12:00, which raises the risk the most.'
    else:
        lead = f"The biggest push comes from {FRIENDLY.get(top, top)}, which {direction} the risk."
    return f'{lead} {base}'
