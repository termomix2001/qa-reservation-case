import pytest


@pytest.mark.parametrize(
    ("vehicle_type", "dirtiness", "service_id", "expected_total", "expected_status"),
    [
        ("standard", "normal", "interior-comfort", 2499, "estimated"),
        ("suv", "heavy", "interior-comfort", 3499, "estimated"),
        ("standard", "heavy", "exterior-basic", 999, "estimated"),
        ("standard", "extreme", "interior-standard", None, "individual"),
    ],
)
def test_quote_business_rules(
    api_client,
    api_url,
    vehicle_type,
    dirtiness,
    service_id,
    expected_total,
    expected_status,
):
    response = api_client.post(
        f"{api_url}/reservations/quote",
        json={
            "vehicles": [
                {
                    "vehicleType": vehicle_type,
                    "dirtiness": dirtiness,
                    "serviceIds": [service_id],
                }
            ]
        },
        timeout=5,
    )

    assert response.status_code == 200
    quote = response.json()["data"]
    assert quote["totalPrice"] == expected_total
    assert quote["priceStatus"] == expected_status


@pytest.mark.parametrize(
    "invalid_vehicle",
    [
        {"vehicleType": "truck", "dirtiness": "normal", "serviceIds": ["interior-standard"]},
        {"vehicleType": "standard", "dirtiness": "unknown", "serviceIds": ["interior-standard"]},
        {"vehicleType": "standard", "dirtiness": "normal", "serviceIds": []},
        {"vehicleType": "standard", "dirtiness": "normal", "serviceIds": ["unknown-service"]},
    ],
)
def test_quote_rejects_invalid_vehicle_selection(api_client, api_url, invalid_vehicle):
    response = api_client.post(
        f"{api_url}/reservations/quote",
        json={"vehicles": [invalid_vehicle]},
        timeout=5,
    )

    assert response.status_code == 400


def test_quote_rejects_unknown_properties(api_client, api_url):
    response = api_client.post(
        f"{api_url}/reservations/quote",
        json={
            "adminOverride": True,
            "vehicles": [
                {
                    "vehicleType": "standard",
                    "dirtiness": "normal",
                    "serviceIds": ["interior-standard"],
                }
            ],
        },
        timeout=5,
    )

    assert response.status_code == 400
