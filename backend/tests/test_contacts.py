"""Tests for Personal CRM & Contacts endpoints."""

from datetime import date
from fastapi.testclient import TestClient


def test_contacts_crud_and_search(client: TestClient, auth_headers: dict):
    # Create contact
    res = client.post(
        "/api/v1/contacts",
        headers=auth_headers,
        json={
            "name": "Alex Mercer",
            "organization": "Cyberdyne Systems",
            "role": "Chief Architect",
            "email": "alex@cyberdyne.io",
            "phone": "+1-555-0199",
            "notes": "Met at TechX Summit 2026",
            "next_followup": date.today().isoformat(),
        },
    )
    assert res.status_code == 201
    contact_id = res.json()["data"]["id"]

    # Search contacts
    res = client.get("/api/v1/contacts?search=Cyberdyne", headers=auth_headers)
    assert res.status_code == 200
    assert len(res.json()["data"]) == 1

    # Overdue followup query
    res = client.get("/api/v1/contacts?overdue_only=true", headers=auth_headers)
    assert res.status_code == 200
    assert len(res.json()["data"]) == 1

    # Update contact
    res = client.patch(
        f"/api/v1/contacts/{contact_id}",
        headers=auth_headers,
        json={"notes": "Updated interaction notes following sync"},
    )
    assert res.status_code == 200
    assert res.json()["data"]["notes"] == "Updated interaction notes following sync"

    # Delete contact
    res = client.delete(f"/api/v1/contacts/{contact_id}", headers=auth_headers)
    assert res.status_code == 204
