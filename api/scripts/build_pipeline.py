"""Rebuild pipeline v1.0 into model_store/pipeline_v1.0/ from dataset.zip, with Notebook 02's own code.

The teammate's frozen artifacts were not provided, so the app regenerates them:
Steps 1a, 1b, 3, 5 (in _common.rebuild_orders), then Step 6 (time split with 7-day purges), Step 7 (mean or
median imputation by training skew), Steps 9 to 11 (shared preprocessor, fitted on train only) and Step 12
(TimeSeriesSplit with a gap of at least 7 days). Every number the reports state is asserted.

Run:  python api/scripts/build_pipeline.py
"""
import json
from datetime import datetime

import joblib
import numpy as np
import pandas as pd
import sklearn
from sklearn.base import clone
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.model_selection import TimeSeriesSplit
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from _common import (BIN_FEATURES, CAT_FEATURES, CYCLIC_FEATURES, FEATURES, NUM_FEATURES, PIPELINE, PURGE_DAYS,
                     RAW_SHA, SEED, TARGET, TEST_START, TRAIN_END, VAL_END, VAL_START, cached_orders)

N_SPLITS = 5
MIN_FREQUENCY = 50
SKEW_THRESHOLD = 0.5


def build_preprocessor(mean_cols, median_cols):
    """Notebook 02 build_preprocessor() with no MNAR columns (none were found, Notebook 01 Section 7)."""
    return ColumnTransformer([
        ('num_mean', Pipeline([('impute', SimpleImputer(strategy='mean')), ('scale', StandardScaler())]), mean_cols),
        ('num_median', Pipeline([('impute', SimpleImputer(strategy='median')), ('scale', StandardScaler())]), median_cols),
        ('cat_mode', Pipeline([('impute', SimpleImputer(strategy='most_frequent')),
                               ('onehot', OneHotEncoder(handle_unknown='infrequent_if_exist', min_frequency=MIN_FREQUENCY,
                                                        sparse_output=False))]), CAT_FEATURES),
        ('binary', SimpleImputer(strategy='most_frequent'), BIN_FEATURES),
    ], remainder='drop', verbose_feature_names_out=False)


def main():
    orders = cached_orders()

    # Step 6: time-based split with purge gaps
    train_df = orders[orders['order_date'] < TRAIN_END].reset_index(drop=True)
    val_df = orders[(orders['order_date'] >= VAL_START) & (orders['order_date'] < VAL_END)].reset_index(drop=True)
    test_df = orders[orders['order_date'] >= TEST_START].reset_index(drop=True)
    sizes = {'train': len(train_df), 'validation': len(val_df), 'test': len(test_df)}
    rates = {'train': round(train_df[TARGET].mean(), 4), 'validation': round(val_df[TARGET].mean(), 4),
             'test': round(test_df[TARGET].mean(), 4)}
    assert sizes == {'train': 44492, 'validation': 4564, 'test': 13071}, sizes
    assert rates == {'train': 0.5734, 'validation': 0.5635, 'test': 0.5756}, rates
    assert len(orders) - sum(sizes.values()) == 770, 'purged orders should be 770'

    # Step 7: mean or median by training skew
    X_train = train_df[FEATURES]
    skew = X_train[NUM_FEATURES + CYCLIC_FEATURES].skew()
    mean_cols = [c for c in NUM_FEATURES + CYCLIC_FEATURES if abs(skew[c]) < SKEW_THRESHOLD]
    median_cols = [c for c in NUM_FEATURES + CYCLIC_FEATURES if abs(skew[c]) >= SKEW_THRESHOLD]
    assert mean_cols == ['n_lines', 'gross_sales', 'discount_rate', 'max_unit_price', 'hour_sin', 'hour_cos',
                         'dow_sin', 'dow_cos', 'month_sin', 'month_cos'], mean_cols   # Notebook 02 printed this list

    # Steps 9 to 11: fit on train only
    preprocessor_unfitted = build_preprocessor(mean_cols, median_cols)
    preprocessor = clone(preprocessor_unfitted).fit(X_train)
    names = list(preprocessor.get_feature_names_out())
    assert len(names) == 54, len(names)

    # Step 12: time-series CV folds with a gap of at least 7 days
    daily = train_df.groupby(train_df['order_date'].dt.floor('D')).size()
    cv_gap = int(np.ceil(PURGE_DAYS * daily.max()))
    while True:
        folds = list(TimeSeriesSplit(n_splits=N_SPLITS, gap=cv_gap).split(X_train))
        min_gap_days = min((train_df['order_date'].iloc[va[0]] - train_df['order_date'].iloc[tr[-1]]).total_seconds() / 86400
                           for tr, va in folds)
        if min_gap_days >= PURGE_DAYS:
            break
        cv_gap += 50
    assert cv_gap == 448, cv_gap
    assert [len(tr) for tr, _ in folds] == [6969, 14384, 21799, 29214, 36629], [len(tr) for tr, _ in folds]
    assert all(len(va) == 7415 for _, va in folds)

    # Step 14: save
    PIPELINE.mkdir(parents=True, exist_ok=True)
    for name, d in [('train', train_df), ('val', val_df), ('test', test_df)]:
        d.to_parquet(PIPELINE / f'{name}_orders.parquet', index=False)
        Xt = pd.DataFrame(preprocessor.transform(d[FEATURES]), columns=names)
        Xt.assign(order_id=d['order_id'].values).to_parquet(PIPELINE / f'X_{name}.parquet', index=False)
        d[['order_id', TARGET]].to_parquet(PIPELINE / f'y_{name}.parquet', index=False)
    joblib.dump(preprocessor, PIPELINE / 'preprocessor_fitted.joblib')
    joblib.dump(preprocessor_unfitted, PIPELINE / 'preprocessor_unfitted.joblib')
    cv_spec = {'scheme': f'TimeSeriesSplit(n_splits={N_SPLITS}, gap={cv_gap})', 'indexes_into': 'train_orders.parquet (row order as saved)',
               'note': 'Ranges are [start, end) positions; build with np.arange(start, end)',
               'folds': [{'fold': i, 'train': [int(tr[0]), int(tr[-1]) + 1], 'val': [int(va[0]), int(va[-1]) + 1]}
                         for i, (tr, va) in enumerate(folds)]}
    (PIPELINE / 'cv_folds.json').write_text(json.dumps(cv_spec, indent=2))
    manifest = {
        'pipeline_version': 'v1.0', 'source': 'rebuilt by app from dataset.zip with Notebook 02 code (not the teammate file)',
        'created_at': datetime.now().isoformat(timespec='seconds'), 'seed': SEED,
        'raw_file': {'name': 'DataCoSupplyChainDataset.csv', 'sha256': RAW_SHA},
        'target': TARGET, 'positive_class': '1 = late',
        'split': {'train': f'order_date < {TRAIN_END.date()}', 'validation': f'{VAL_START.date()} <= order_date < {VAL_END.date()}',
                  'test': f'order_date >= {TEST_START.date()}', 'purge_days': PURGE_DAYS, 'sizes': sizes, 'late_rate': rates},
        'features_input': {'categorical': CAT_FEATURES, 'numeric': NUM_FEATURES, 'cyclical': CYCLIC_FEATURES, 'binary': BIN_FEATURES},
        'features_model_ready': names,
        'imputation': {'mean': mean_cols, 'median': median_cols, 'mode': CAT_FEATURES + BIN_FEATURES,
                       'constant_unknown': [], 'constant_zero': []},
        'encoding': {'type': 'OneHotEncoder', 'min_frequency': MIN_FREQUENCY, 'handle_unknown': 'infrequent_if_exist'},
        'scaling': {'type': 'StandardScaler', 'columns': mean_cols + median_cols},
        'cv': {'n_splits': N_SPLITS, 'gap_orders': cv_gap, 'min_gap_days': round(min_gap_days, 1)},
        'versions': {'scikit-learn': sklearn.__version__, 'pandas': pd.__version__, 'numpy': np.__version__},
    }
    (PIPELINE / 'manifest.json').write_text(json.dumps(manifest, indent=2, default=str))
    print(f'Pipeline v1.0 rebuilt in {PIPELINE}')
    print(f'  splits {sizes}, late rates {rates}, purged 770')
    print(f'  median imputation for {median_cols}; 54 model-ready columns')
    print(f'  CV gap {cv_gap} orders, smallest gap {min_gap_days:.1f} days, fold sizes as reported')


if __name__ == '__main__':
    main()
