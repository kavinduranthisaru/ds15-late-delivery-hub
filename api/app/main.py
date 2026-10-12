"""FastAPI app: model facts from site_data.json, predictions from the champion.

Run:  uvicorn app.main:app --port 8000   (from webapp/api)
"""
import json
import os
import platform
from contextlib import asynccontextmanager
from pathlib import Path

import pandas as pd
import sklearn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from . import explain
from .features import engineer
from .paths import STORE, WEBAPP
from .registry import CHAMPION, CHAMPION_CUTOFF, TIER_CUTS, registry
from .schemas import REFERENCE, Order, Prediction, PredictAllRequest, PredictRequest

# On Vercel only the api/ folder is deployed, so a copy of site_data.json is kept next to this file.
_SITE_PATHS = [os.environ.get('DS15_SITE_DATA'), WEBAPP / 'content' / 'site_data.json', Path(__file__).parent / 'site_data.json']
SITE = json.loads(next(Path(p) for p in _SITE_PATHS if p and Path(p).exists()).read_text())
MODELS = {m['key']: m for m in SITE['models']}
EXAMPLES_PATH = Path(__file__).parent / 'examples.json'


@asynccontextmanager
async def lifespan(_app):
    registry.load_all()
    yield


app = FastAPI(title='DS-15 late delivery risk API', version='1.0', lifespan=lifespan)


@app.middleware('http')
async def strip_api_prefix(request, call_next):
    """The API is public under /api (Vercel rewrite /api/(.*), Vite proxy in dev). Routes are defined without the
    prefix, so /api/health and /health both work, locally and on Vercel."""
    path = request.scope['path']
    if path == '/api' or path.startswith('/api/'):
        request.scope['path'] = path[4:] or '/'
    return await call_next(request)

app.add_middleware(CORSMiddleware, allow_origins=['http://localhost:5173', 'http://127.0.0.1:5173',
                                                  'http://localhost:4173', 'http://127.0.0.1:4173'],
                   allow_methods=['GET', 'POST'], allow_headers=['*'])


def _availability(key):
    if key in registry.models:
        return {'available': True, 'provenance': registry.models[key].meta.get('provenance')}
    return {'available': False, 'reason': registry.errors.get(key, 'not loaded')}


def _range_notes(order: Order):
    notes = []
    for f, r in REFERENCE['numeric'].items():
        v = getattr(order, f)
        if v < r['min'] or v > r['max']:
            notes.append(f"{f} = {v:g} is outside the training range ({r['min']:g} to {r['max']:g})")
    return notes


def _predict_one(key, X, notes, with_reason):
    m = MODELS[key]
    base = dict(model=key, label=m['label'], owner_name=m['owner_name'], owner_id=m['owner_id'])
    loaded = registry.models.get(key)
    if loaded is None:
        return Prediction(**base, available=False, note=f"Model file not available: {registry.errors.get(key, 'not loaded')}")
    p = float(loaded.score(X)[0])
    cutoff, source = loaded.cutoff, loaded.cutoff_source
    if cutoff is None:
        cutoff, source = CHAMPION_CUTOFF, "champion's cut-off (this model has none of its own)"
    return Prediction(**base, available=True, probability=round(p, 6), cutoff=cutoff, cutoff_source=source,
                      predicted_late=p >= cutoff, tier=registry.tier(p),
                      reason=explain.reason(loaded, X) if with_reason else None,
                      provenance=loaded.meta.get('provenance'),
                      note=' '.join(n.rstrip('.') + '.' for n in notes) or None)


@app.get('/health')
def health():
    return {'status': 'ok' if CHAMPION in registry.models else 'champion missing',
            'models_loaded': sorted(registry.models), 'models_missing': registry.errors,
            'model_store': str(STORE), 'champion': CHAMPION, 'tier_cuts': TIER_CUTS,
            'versions': {'python': platform.python_version(), 'scikit-learn': sklearn.__version__, 'pandas': pd.__version__}}


@app.get('/models')
def list_models():
    return [{**{k: m[k] for k in ('key', 'rank', 'name', 'label', 'owner_name', 'owner_id', 'score', 'cv_roc',
                                 'test_roc', 'test_pr', 'test_brier', 'champion')}, **_availability(m['key'])}
            for m in SITE['models']]


@app.get('/models/{name}')
def get_model(name: str):
    if name not in MODELS:
        raise HTTPException(404, f"Unknown model '{name}'. Use one of: {', '.join(MODELS)}.")
    loaded = registry.models.get(name)
    return {**MODELS[name], **_availability(name),
            'runtime': None if loaded is None else {'cutoff': loaded.cutoff, 'cutoff_source': loaded.cutoff_source,
                                                     **{k: v for k, v in loaded.meta.items() if isinstance(v, (str, bool, int, float, type(None)))}}}


@app.get('/reference')
def reference():
    return {'categories': REFERENCE['categories'], 'market_regions': REFERENCE['market_regions'],
            'numeric': REFERENCE['numeric']}


@app.get('/examples')
def examples():
    if not EXAMPLES_PATH.exists():
        raise HTTPException(503, 'Example orders have not been built yet (run scripts/build_examples.py).')
    return json.loads(EXAMPLES_PATH.read_text())


@app.post('/predict', response_model=Prediction)
def predict(req: PredictRequest):
    key = req.model or CHAMPION
    X = engineer(pd.DataFrame([req.order.model_dump()]))
    result = _predict_one(key, X, _range_notes(req.order), with_reason=True)
    if not result.available:
        raise HTTPException(503, result.note)
    return result


@app.post('/predict/all', response_model=list[Prediction])
def predict_all(req: PredictAllRequest):
    X = engineer(pd.DataFrame([req.order.model_dump()]))
    notes = _range_notes(req.order)
    return [_predict_one(m['key'], X, notes, with_reason=m['key'] == CHAMPION) for m in SITE['models']]
