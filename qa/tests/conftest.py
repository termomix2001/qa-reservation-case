import os
from urllib.parse import urlparse

import pytest
import requests


@pytest.fixture(scope="session")
def api_url():
    base_url = os.getenv("QA_API_URL", "http://127.0.0.1:3100/api").rstrip("/")
    hostname = urlparse(base_url).hostname

    if hostname not in {"127.0.0.1", "localhost"} and os.getenv("QA_ALLOW_REMOTE") != "true":
        pytest.exit(
            "Refusing to run against a remote API. Set QA_ALLOW_REMOTE=true only for an isolated test environment."
        )

    return base_url


@pytest.fixture()
def api_client():
    with requests.Session() as session:
        session.headers.update({"Accept": "application/json"})
        yield session
