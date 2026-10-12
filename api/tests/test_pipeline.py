"""The rebuilt pipeline v1.0 must match every number the reports state."""
import json

import numpy as np
import pandas as pd

from app.features import FEATURES
from app.paths import PIPELINE

MANIFEST = json.loads((PIPELINE / 'manifest.json').read_text())


def test_split_sizes_and_late_rates():
    assert MANIFEST['split']['sizes'] == {'train': 44492, 'validation': 4564, 'test': 13071}
    assert MANIFEST['split']['late_rate'] == {'train': 0.5734, 'validation': 0.5635, 'test': 0.5756}


def test_feature_order_and_columns():
    fi = MANIFEST['features_input']
    assert FEATURES == fi['categorical'] + fi['numeric'] + fi['cyclical'] + fi['binary']
    assert len(MANIFEST['features_model_ready']) == 54


def test_cv_folds_match_the_reports():
    folds = json.loads((PIPELINE / 'cv_folds.json').read_text())['folds']
    assert MANIFEST['cv']['gap_orders'] == 448
    assert [f['train'][1] - f['train'][0] for f in folds] == [6969, 14384, 21799, 29214, 36629]
    assert all(f['val'][1] - f['val'][0] == 7415 for f in folds)
    train = pd.read_parquet(PIPELINE / 'train_orders.parquet')
    assert train['order_date'].is_monotonic_increasing
    for f in folds:
        gap = train['order_date'].iloc[f['val'][0]] - train['order_date'].iloc[f['train'][1] - 1]
        assert gap >= pd.Timedelta(days=7)


def test_splits_do_not_overlap():
    d = {s: pd.read_parquet(PIPELINE / f'{s}_orders.parquet') for s in ('train', 'val', 'test')}
    assert d['train']['order_date'].max() < d['val']['order_date'].min()
    assert d['val']['order_date'].max() < d['test']['order_date'].min()
    assert not (set(d['train']['order_id']) & set(d['test']['order_id']))
    assert np.isclose(d['train']['Late_delivery_risk'].mean(), 0.5734, atol=5e-5)
