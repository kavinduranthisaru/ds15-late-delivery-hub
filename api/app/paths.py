"""Where the app finds its inputs.

SOURCES holds local copies of the group's files (dataset.zip, the reports, Madushani's notebook). It defaults to
<webapp>/sources and can be changed with DS15_SOURCES. MODEL_STORE holds the rebuilt pipeline and the champion.
"""
import os
from pathlib import Path

API_DIR = Path(__file__).resolve().parent.parent
WEBAPP = API_DIR.parent
SOURCES = Path(os.environ.get('DS15_SOURCES', WEBAPP / 'sources'))
STORE = Path(os.environ.get('DS15_MODEL_STORE', API_DIR / 'model_store'))
PIPELINE = STORE / 'pipeline_v1.0'
