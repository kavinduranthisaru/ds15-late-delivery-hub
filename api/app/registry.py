"""Load saved models with joblib and score orders the same way each owner's notebook did.

The app serves the champion, Logistic Regression (Madushani IT24102928). It is retrained by
scripts/retrain_champion.py on pipeline v1.0 (rebuilt from dataset.zip), because the original file was not provided.
Loaders for the other notebook formats stay here, so a teammate's real file can be dropped into model_store later:
- Madushani (IT24102928), LR and NB: bundle['model'].predict_proba(X)[:, 1], cut-off bundle['threshold'].
- Ranthisaru (IT24102255), KNN and SVM: scores_of(pipeline) then calibrate(score, method), cut-off threshold_a.
- Ratnaweera (IT24102397), DT and RF: refit by scripts/refit_tree_models.py.
A missing or unloadable file never stops the API: that model is reported as unavailable, with the reason.
"""
import os
import sys
import warnings
from dataclasses import dataclass, field
from typing import Callable, Optional

import joblib
import numpy as np
import pandas as pd
from threadpoolctl import threadpool_limits

from .paths import STORE

CHAMPION = 'logistic_regression'
CHAMPION_CUTOFF = 0.6040
TIER_CUTS = {'Medium': 0.60, 'High': 0.90}   # provisional tiers from Ranthisaru's notebooks (IT24102255)


@dataclass
class Loaded:
    key: str
    score: Callable[[pd.DataFrame], np.ndarray]       # 20-feature frame -> P(late)
    cutoff: Optional[float]
    cutoff_source: str
    raw: object = None
    meta: dict = field(default_factory=dict)


def _load(path):
    if not path.exists():
        raise FileNotFoundError(f'{path.relative_to(STORE.parent) if STORE.parent in path.parents else path} not found')
    with warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter('always')
        obj = joblib.load(path)
    version_warnings = [str(w.message) for w in caught if 'Trying to unpickle' in str(w.message)]
    if version_warnings and os.environ.get('DS15_ALLOW_VERSION_MISMATCH') != '1':
        raise RuntimeError('saved with a different scikit-learn version: ' + version_warnings[0][:160])
    return obj


def load_member1(key):
    folder = STORE / key
    sys.path.insert(0, str(folder))        # member1_models.py (NB log-odds classes) sits next to the bundle
    try:
        b = _load(folder / f'{key}.joblib')
    finally:
        sys.path.remove(str(folder))
    cols = b['features']
    retrained = bool(b.get('retrained_by_app'))
    meta = {'calibration': b.get('calibration'), 'retrained_by_app': retrained,
            'provenance': b.get('provenance') or ('original notebook file' if not retrained else 'retrained by this app')}
    return Loaded(key, lambda X: b['model'].predict_proba(X[cols])[:, 1], float(b['threshold']),
                  'own cut-off, set on validation', raw=b, meta=meta)


def load_member2(key, file_key):
    b = _load(STORE / key / f'final_model_{file_key}.joblib')
    pipe, method, cal = b['pipeline'], b['calibration_method'], b['calibrator']
    cols = b['features']

    def score(X):
        # KNN has many neighbours at exactly the same distance; one thread keeps the tie-break repeatable.
        with threadpool_limits(limits=1):
            s = pipe.decision_function(X[cols]) if hasattr(pipe, 'decision_function') else pipe.predict_proba(X[cols])[:, 1]
        s = np.asarray(s, dtype=float)
        if method == 'none':
            return np.clip(s, 0, 1)
        if method == 'platt':
            return cal.predict_proba(s.reshape(-1, 1))[:, 1]
        return cal.predict(s)
    return Loaded(key, score, float(b['threshold_a']), 'own threshold A, set on validation', raw=b,
                  meta={'calibration': method, 'provenance': 'original notebook file'})


def load_refit(key):
    b = _load(STORE / key / f'{key}_refit.joblib')
    return Loaded(key, lambda X: b['pipeline'].predict_proba(X[b['features']])[:, 1], None,
                  'no cut-off was set for this model', raw=b,
                  meta={'refit': True, 'provenance': 'refit by this app', **b.get('meta', {})})


def load_missing(key, what):
    def _():
        raise FileNotFoundError(f'{what} not provided')
    return _


LOADERS = {
    'logistic_regression': lambda: load_member1('logistic_regression'),
    'naive_bayes': lambda: load_member1('naive_bayes'),
    'knn': lambda: load_member2('knn', 'knn'),
    'linear_svm': lambda: load_member2('linear_svm', 'svm'),
    'adaboost': load_missing('adaboost', "Maheepala's (IT24102901) AdaBoost file"),
    'xgboost': load_missing('xgboost', "Maheepala's (IT24102901) XGBoost file"),
    'decision_tree': lambda: load_refit('decision_tree'),
    'random_forest': lambda: load_refit('random_forest'),
}


class Registry:
    def __init__(self):
        self.models: dict[str, Loaded] = {}
        self.errors: dict[str, str] = {}

    def load_all(self):
        self.models.clear()
        self.errors.clear()
        for key, loader in LOADERS.items():
            try:
                self.models[key] = loader()
            except Exception as e:   # noqa: BLE001  report every failure, keep serving the rest
                self.errors[key] = f'{type(e).__name__}: {e}'
        return self

    @staticmethod
    def tier(p):
        return 'High' if p >= TIER_CUTS['High'] else 'Medium' if p >= TIER_CUTS['Medium'] else 'Low'


registry = Registry()
