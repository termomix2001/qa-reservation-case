from datetime import datetime
from pathlib import Path

import pytest
import yaml
from jsonschema import validate as validate_json_schema
from openapi_spec_validator import validate as validate_openapi


HEALTH_SCHEMA = {
    "type": "object",
    "required": ["ok", "service", "time"],
    "additionalProperties": False,
    "properties": {
        "ok": {"const": True},
        "service": {"const": "reservation-qa-showcase"},
        "time": {"type": "string"},
    },
}

SERVICE_SCHEMA = {
    "type": "object",
    "required": ["category", "durationMinutes", "id", "includesInterior", "name", "price"],
    "additionalProperties": False,
    "properties": {
        "category": {"enum": ["interior", "exterior", "package"]},
        "durationMinutes": {"type": "integer", "minimum": 1},
        "id": {"type": "string", "minLength": 1},
        "includesInterior": {"type": "boolean"},
        "name": {"type": "string", "minLength": 1},
        "price": {"type": "integer", "minimum": 0},
    },
}


def test_versioned_openapi_document_is_valid():
    contract_path = Path(__file__).parents[2] / "docs" / "api-contract.yaml"
    with contract_path.open(encoding="utf-8") as contract_file:
        contract = yaml.safe_load(contract_file)

    validate_openapi(contract)


@pytest.mark.contract
def test_health_response_matches_contract(api_client, api_url):
    response = api_client.get(f"{api_url}/health", timeout=5)

    assert response.status_code == 200
    validate_json_schema(response.json(), HEALTH_SCHEMA)
    datetime.fromisoformat(response.json()["time"].replace("Z", "+00:00"))


@pytest.mark.contract
def test_service_catalog_has_unique_ids_and_valid_items(api_client, api_url):
    response = api_client.get(f"{api_url}/services", timeout=5)

    assert response.status_code == 200
    services = response.json()["data"]
    assert services

    for service in services:
        validate_json_schema(service, SERVICE_SCHEMA)

    service_ids = [service["id"] for service in services]
    assert len(service_ids) == len(set(service_ids))
