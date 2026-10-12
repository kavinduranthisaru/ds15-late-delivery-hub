"""Turn order inputs into the 20 order-level features of pipeline v1.0.

This is Notebook 02, Step 5 (feature engineering), with the same formulas applied to orders typed into the form.
Encoding, imputation and scaling are NOT done here: the saved model contains the fitted preprocessor.
tests/test_features.py proves this function gives identical values to Notebook 02 on all 62,897 orders.
"""
import numpy as np
import pandas as pd

CAT_FEATURES = ['shipping_mode', 'market', 'order_region', 'customer_segment', 'payment_type']
NUM_FEATURES = ['n_lines', 'total_qty', 'gross_sales', 'total_discount', 'discount_rate', 'max_unit_price']
CYCLIC_FEATURES = ['hour_sin', 'hour_cos', 'dow_sin', 'dow_cos', 'month_sin', 'month_cos']
BIN_FEATURES = ['is_after_noon', 'is_weekend', 'same_day_after_cutoff']
FEATURES = CAT_FEATURES + NUM_FEATURES + CYCLIC_FEATURES + BIN_FEATURES

INPUT_FIELDS = ['order_date', 'shipping_mode', 'market', 'order_region', 'customer_segment', 'payment_type',
                'n_lines', 'total_qty', 'gross_sales', 'total_discount', 'max_unit_price']


def engineer(orders: pd.DataFrame) -> pd.DataFrame:
    """orders: one row per order with INPUT_FIELDS. Returns the 20 FEATURES in pipeline order."""
    o = orders[INPUT_FIELDS].copy()
    o['order_date'] = pd.to_datetime(o['order_date'])
    o['discount_rate'] = o['total_discount'] / o['gross_sales']

    hour = o['order_date'].dt.hour
    dow = o['order_date'].dt.dayofweek
    month = o['order_date'].dt.month
    for name, value, period in [('hour', hour, 24), ('dow', dow, 7), ('month', month - 1, 12)]:
        o[f'{name}_sin'] = np.sin(2 * np.pi * value / period)
        o[f'{name}_cos'] = np.cos(2 * np.pi * value / period)
    o['is_after_noon'] = (hour >= 12).astype(int)
    o['is_weekend'] = (dow >= 5).astype(int)
    o['same_day_after_cutoff'] = ((o['shipping_mode'] == 'Same Day') & (hour >= 12)).astype(int)
    return o[FEATURES].reset_index(drop=True)
