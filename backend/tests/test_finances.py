"""Tests for Personal Finance REST endpoints."""

from datetime import date
from fastapi.testclient import TestClient


def test_finance_summary_and_item_crud(client: TestClient, auth_headers: dict):
    # Get initial summary
    res = client.get("/api/v1/finances/summary", headers=auth_headers)
    assert res.status_code == 200
    summary = res.json()
    assert summary["net_worth"] == 0.0

    # Create income item
    res = client.post(
        "/api/v1/finances/items",
        headers=auth_headers,
        json={
            "type": "income",
            "amount": 5000.00,
            "currency": "USD",
            "category": "Salary",
            "date": date.today().isoformat(),
            "description": "Monthly salary payout",
        },
    )
    assert res.status_code == 201
    income_id = res.json()["data"]["id"]

    # Create expense item
    res = client.post(
        "/api/v1/finances/items",
        headers=auth_headers,
        json={
            "type": "expense",
            "amount": 1200.00,
            "currency": "USD",
            "category": "Housing",
            "date": date.today().isoformat(),
            "description": "Rent payment",
        },
    )
    assert res.status_code == 201

    # Create subscription
    res = client.post(
        "/api/v1/finances/subscriptions",
        headers=auth_headers,
        json={
            "name": "Cloud Hosting",
            "amount": 50.00,
            "billing_cycle": "monthly",
            "category": "Infrastructure",
        },
    )
    assert res.status_code == 201

    # Verify summary after items
    res = client.get("/api/v1/finances/summary", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total_income"] == 5000.0
    assert data["total_expenses"] == 1200.0
    assert data["net_worth"] == 3800.0
    assert data["active_subscriptions_count"] == 1

    # Delete income item
    res = client.delete(f"/api/v1/finances/items/{income_id}", headers=auth_headers)
    assert res.status_code == 204
