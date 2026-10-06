from datetime import date, timedelta
from uuid import uuid4

import pytest


@pytest.mark.destructive
def test_reservation_happy_path_and_state_machine(api_client, api_url):
    payload = reservation_payload()
    created = api_client.post(f"{api_url}/reservations", json=payload, timeout=5)

    assert created.status_code == 201
    reservation = created.json()["data"]
    reservation_id = reservation["id"]
    assert reservation["status"] == "new"
    assert reservation["finishAt"] > reservation["startAt"]

    statuses = [
        "confirmed",
        "received",
        "in-progress",
        "ready-for-handover",
        "delivered",
    ]
    for status in statuses:
        response = api_client.patch(
            f"{api_url}/reservations/{reservation_id}/status",
            json={"status": status},
            timeout=5,
        )
        assert response.status_code == 200
        assert response.json()["data"]["status"] == status

    illegal_transition = api_client.patch(
        f"{api_url}/reservations/{reservation_id}/status",
        json={"status": "confirmed"},
        timeout=5,
    )
    assert illegal_transition.status_code == 400


@pytest.mark.destructive
def test_overlapping_reservation_returns_conflict(api_client, api_url):
    payload = reservation_payload()
    first = api_client.post(f"{api_url}/reservations", json=payload, timeout=5)

    assert first.status_code == 201

    payload["customer"]["email"] = f"second-{uuid4()}@example.test"
    payload["startTime"] = "11:00"
    second = api_client.post(f"{api_url}/reservations", json=payload, timeout=5)

    assert second.status_code == 409
    assert "overlaps reservation" in second.json()["message"]


def reservation_payload():
    return {
        "customer": {
            "email": f"qa-{uuid4()}@example.test",
            "name": "API Test User",
            "phone": "+420700000000",
        },
        "pickupRequested": False,
        "startDate": random_future_weekday(),
        "startTime": "10:00",
        "vehicles": [
            {
                "vehicleType": "standard",
                "dirtiness": "normal",
                "serviceIds": ["interior-comfort"],
            }
        ],
    }


def random_future_weekday():
    candidate = date.today() + timedelta(days=30 + uuid4().int % 1200)
    while candidate.weekday() >= 5:
        candidate += timedelta(days=1)
    return candidate.isoformat()
