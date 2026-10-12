import json
import sys
from pathlib import Path

import pytest

API = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(API))
sys.path.insert(0, str(API / 'scripts'))


@pytest.fixture(scope='session')
def rebuilt_orders():
    """All 62,897 orders rebuilt from dataset.zip with Notebook 02's own code (cached after the first run)."""
    from _common import cached_orders
    return cached_orders()


@pytest.fixture(scope='session')
def client():
    from fastapi.testclient import TestClient
    from app.main import app
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope='session')
def parity_rows():
    return json.loads((API / 'tests' / 'parity_rows.json').read_text())
