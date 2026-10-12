"""features.engineer must reproduce Notebook 02's order features exactly."""
import numpy as np
import pandas as pd
import pytest

from app.features import FEATURES, INPUT_FIELDS, engineer
from app.paths import PIPELINE
from app.schemas import Order


def test_engineer_matches_notebook_02_on_every_order(rebuilt_orders):
    got = engineer(rebuilt_orders[INPUT_FIELDS])
    want = rebuilt_orders[FEATURES].reset_index(drop=True)
    pd.testing.assert_frame_equal(got, want, check_dtype=False, atol=0, rtol=0)


def test_every_real_order_passes_input_validation(rebuilt_orders):
    rows = rebuilt_orders[INPUT_FIELDS].assign(order_date=lambda d: d['order_date'].dt.strftime('%Y-%m-%dT%H:%M'))
    for r in rows.to_dict('records'):
        Order(**r)


@pytest.mark.parametrize('split', ['train', 'val', 'test'])
def test_rebuilt_orders_equal_pipeline_v1(rebuilt_orders, split):
    saved = pd.read_parquet(PIPELINE / f'{split}_orders.parquet')
    mine = rebuilt_orders.set_index('order_id').loc[saved['order_id']].reset_index()
    for c in FEATURES:
        if saved[c].dtype == object:
            assert (mine[c].to_numpy() == saved[c].to_numpy()).all(), c
        else:
            np.testing.assert_array_equal(mine[c].to_numpy(float), saved[c].to_numpy(float), err_msg=c)
