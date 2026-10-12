"""Endpoints, input validation, the champion and the published numbers."""
import json
from pathlib import Path

import pytest

RESULTS = {  # the agreed results table: rank, score, CV ROC, test ROC, test PR, test Brier
    'logistic_regression': ('1', 88.8, 0.7743, 0.7793, 0.8593, 0.1735),
    'adaboost': ('2=', 86.7, 0.7748, 0.7771, 0.8048, 0.1733),
    'xgboost': ('2=', 86.7, 0.7748, 0.7771, 0.8048, 0.1733),
    'linear_svm': ('4', 86.6, 0.7742, 0.7793, 0.8599, 0.1736),
    'knn': ('5', 85.0, 0.7756, 0.7797, 0.8534, 0.1733),
    'naive_bayes': ('6', 58.9, 0.7693, 0.7791, 0.8593, 0.1763),
    'decision_tree': ('7', 58.2, 0.7754, 0.7787, 0.8588, None),
    'random_forest': ('8', 40.8, 0.7736, 0.7787, 0.8601, None),
}
ORDER = {'order_date': '2017-08-14T15:30', 'shipping_mode': 'Standard Class', 'market': 'Europe',
         'order_region': 'Western Europe', 'customer_segment': 'Consumer', 'payment_type': 'DEBIT',
         'n_lines': 3, 'total_qty': 6, 'gross_sales': 560.0, 'total_discount': 51.5, 'max_unit_price': 200.0}


def test_health_champion_loaded(client):
    r = client.get('/health').json()
    assert r['champion'] == 'logistic_regression' and r['status'] == 'ok'
    assert 'logistic_regression' in r['models_loaded']


def test_models_list_matches_results_table(client):
    rows = client.get('/models').json()
    assert [m['key'] for m in rows] == list(RESULTS)
    for m in rows:
        assert (m['rank'], m['score'], m['cv_roc'], m['test_roc'], m['test_pr'], m['test_brier']) == RESULTS[m['key']]
        assert m['owner_id'] in m['label'] and 'Member' not in m['label']


def test_model_detail_and_404(client):
    lr = client.get('/models/logistic_regression').json()
    assert lr['owner_id'] == 'IT24102928' and lr['runtime']['cutoff'] == 0.604
    assert 'retrained by this app' in lr['provenance']
    r = client.get('/models/svm')
    assert r.status_code == 404 and 'linear_svm' in r.json()['detail']


@pytest.mark.parametrize('change, words', [
    ({'order_region': 'Canada'}, 'not in market'),
    ({'total_discount': 600.0}, 'less than gross_sales'),
    ({'n_lines': 4, 'total_qty': 2}, 'at least n_lines'),
    ({'shipping_mode': 'Express'}, 'shipping_mode'),
    ({'n_lines': 9}, 'n_lines'),
])
def test_bad_orders_get_clear_422(client, change, words):
    r = client.post('/predict', json={'order': {**ORDER, **change}})
    assert r.status_code == 422
    assert words in str(r.json()['detail'])


def test_unknown_field_rejected(client):
    assert client.post('/predict', json={'order': {**ORDER, 'days_for_shipping_real': 3}}).status_code == 422


def test_predict_champion(client):
    body = client.post('/predict', json={'order': ORDER}).json()
    assert body['model'] == 'logistic_regression' and body['cutoff'] == 0.604
    assert 0 <= body['probability'] <= 1 and body['tier'] in ('Low', 'Medium', 'High')
    assert 'shipping mode (Standard Class)' in body['reason'] and '40% of Standard Class' in body['reason']
    assert 'retrained by this app' in body['provenance']


def test_same_day_after_noon_reason(client):
    body = client.post('/predict', json={'order': {**ORDER, 'shipping_mode': 'Same Day', 'order_date': '2017-08-14T15:30'}}).json()
    assert body['predicted_late'] and 'noon cut-off' in body['reason']


def test_out_of_range_note(client):
    body = client.post('/predict', json={'order': {**ORDER, 'gross_sales': 5000.0}}).json()
    assert 'outside the training range' in body['note']


def test_examples_are_scored_as_recorded(client):
    ex = client.get('/examples').json()
    assert [e['key'] for e in ex] == ['low', 'mixed', 'high']
    for e in ex:
        p = client.post('/predict', json={'order': e['order']}).json()['probability']
        assert round(p, 4) == e['champion_probability']
    assert ex[0]['champion_probability'] < 0.3 < ex[1]['champion_probability'] < 0.604 < ex[2]['champion_probability']


def test_predict_all_has_eight_rows(client):
    rows = client.post('/predict/all', json={'order': ORDER}).json()
    assert [r['model'] for r in rows] == list(RESULTS)
    assert rows[0]['available'] and all(r['available'] == (r['probability'] is not None) for r in rows)


def test_retrain_reproduced_every_reported_number():
    from app.paths import STORE
    report = json.loads((STORE / 'logistic_regression' / 'retrain_report.json').read_text())
    assert report['mismatches'] == [] and report['selected_columns_match']
