"""Shared helpers for the build scripts: paths, and Notebook 02's order rebuild (Steps 1a, 1b, 3, 5, unchanged)."""
import hashlib
import io
import sys
import zipfile
from pathlib import Path

import numpy as np
import pandas as pd

API = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(API))
from app.paths import PIPELINE, SOURCES, STORE, WEBAPP   # noqa: E402,F401

RAW_SHA = 'fa6d022ed437155e1a2f0378710602848703c8a7f203f7ff5d77805bf8480aa6'   # Notebook 01 fingerprint
TARGET = 'Late_delivery_risk'
ORDER_DATE = 'order date (DateOrders)'
DATE_FMT = '%m/%d/%Y %H:%M'
SEED = 42
PURGE_DAYS = 7
PURGE = pd.Timedelta(days=PURGE_DAYS)
VAL_START = pd.Timestamp('2017-04-01')
TEST_START = pd.Timestamp('2017-07-01')
TRAIN_END = VAL_START - PURGE      # train:      order_date <  2017-03-25
VAL_END = TEST_START - PURGE       # validation: 2017-04-01 <= order_date < 2017-06-24
CAT_FEATURES = ['shipping_mode', 'market', 'order_region', 'customer_segment', 'payment_type']
NUM_FEATURES = ['n_lines', 'total_qty', 'gross_sales', 'total_discount', 'discount_rate', 'max_unit_price']
CYCLIC_FEATURES = ['hour_sin', 'hour_cos', 'dow_sin', 'dow_cos', 'month_sin', 'month_cos']
BIN_FEATURES = ['is_after_noon', 'is_weekend', 'same_day_after_cutoff']
FEATURES = CAT_FEATURES + NUM_FEATURES + CYCLIC_FEATURES + BIN_FEATURES
META = ['order_id', 'order_date']
CACHE = API / '.cache' / 'orders_rebuilt.parquet'


def is_text(s):
    return s.dtype == object or pd.api.types.is_string_dtype(s)


def rebuild_orders(zip_path=None):
    zip_path = Path(zip_path or SOURCES / 'dataset.zip')
    with zipfile.ZipFile(zip_path) as z:
        data = z.read('DataCoSupplyChainDataset.csv')
    assert hashlib.sha256(data).hexdigest() == RAW_SHA, 'dataset.zip does not match the Notebook 01 fingerprint'
    raw = pd.read_csv(io.BytesIO(data), encoding='latin-1')
    raw.columns = raw.columns.str.strip()

    # Step 1a and 1b (Notebook 02, unchanged)
    df = raw.copy()
    for c in [c for c in df.columns if is_text(df[c])]:
        df[c] = df[c].str.strip().str.replace(r'\s+', ' ', regex=True)
    df['order_date'] = pd.to_datetime(df[ORDER_DATE], format=DATE_FMT, errors='coerce')

    # Step 3 (Notebook 02, unchanged)
    lines = df.loc[~df['Delivery Status'].eq('Shipping canceled')].copy()

    # Step 5 (Notebook 02, unchanged)
    g = lines.groupby('Order Id', sort=True)
    orders = g.agg(order_date=('order_date', 'first'), **{TARGET: (TARGET, 'first')},
                   shipping_mode=('Shipping Mode', 'first'), market=('Market', 'first'),
                   order_region=('Order Region', 'first'), customer_segment=('Customer Segment', 'first'),
                   payment_type=('Type', 'first'), n_lines=('Sales', 'size'), total_qty=('Order Item Quantity', 'sum'),
                   gross_sales=('Sales', 'sum'), total_discount=('Order Item Discount', 'sum'),
                   max_unit_price=('Product Price', 'max'))
    orders['discount_rate'] = orders['total_discount'] / orders['gross_sales']
    hour = orders['order_date'].dt.hour
    dow = orders['order_date'].dt.dayofweek
    month = orders['order_date'].dt.month
    for name, value, period in [('hour', hour, 24), ('dow', dow, 7), ('month', month - 1, 12)]:
        orders[f'{name}_sin'] = np.sin(2 * np.pi * value / period)
        orders[f'{name}_cos'] = np.cos(2 * np.pi * value / period)
    orders['is_after_noon'] = (hour >= 12).astype(int)
    orders['is_weekend'] = (dow >= 5).astype(int)
    orders['same_day_after_cutoff'] = ((orders['shipping_mode'] == 'Same Day') & (hour >= 12)).astype(int)
    orders = (orders.reset_index().rename(columns={'Order Id': 'order_id'})
                    .sort_values(['order_date', 'order_id']).reset_index(drop=True))
    return orders[META + FEATURES + [TARGET]]


def cached_orders():
    if not CACHE.exists():
        CACHE.parent.mkdir(exist_ok=True)
        rebuild_orders().to_parquet(CACHE, index=False)
    return pd.read_parquet(CACHE)
