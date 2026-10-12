"""Parity: /predict must give the saved prediction for each served model, to 4 decimal places, on 20 fixed test
orders. For the champion the saved predictions come from scripts/retrain_champion.py (the original notebook file
was not provided). Models without a file are skipped with the reason, never faked."""
import pandas as pd
import pytest

from app.paths import STORE

EXPECTED = {   # model key: (prediction file inside model_store/<key>/, probability column, filter)
    'logistic_regression': ('predictions_logistic_regression.parquet', 'risk_score', {'split': 'test'}),
    'naive_bayes': ('predictions_naive_bayes.parquet', 'risk_score', {'split': 'test'}),
    'knn': ('predictions_test_knn.csv', 'prob_late', {}),
    'linear_svm': ('predictions_test_svm.csv', 'prob_late', {}),
}


def expected_probs(key):
    name, col, where = EXPECTED[key]
    path = STORE / key / name
    if not path.exists():
        pytest.skip(f'{key}: prediction file {name} not provided')
    df = pd.read_parquet(path) if path.suffix == '.parquet' else pd.read_csv(path)
    for k, v in where.items():
        df = df[df[k] == v]
    return df.set_index('order_id')[col]


@pytest.mark.parametrize('key', list(EXPECTED))
def test_predict_matches_saved_predictions(client, parity_rows, key):
    health = client.get('/health').json()
    if key not in health['models_loaded']:
        pytest.skip(f"{key}: {health['models_missing'].get(key, 'not loaded')}")
    want = expected_probs(key)
    bad = []
    for row in parity_rows:
        order = {k: v for k, v in row.items() if k != 'order_id'}
        r = client.post('/predict', json={'order': order, 'model': key})
        assert r.status_code == 200, r.text
        got, exp = r.json()['probability'], float(want.loc[row['order_id']])
        if round(got, 4) != round(exp, 4):
            bad.append(f"order {row['order_id']}: api {got:.6f} vs saved {exp:.6f}")
    assert not bad, f'{key}: {len(bad)} of 20 rows differ\n' + '\n'.join(bad)
