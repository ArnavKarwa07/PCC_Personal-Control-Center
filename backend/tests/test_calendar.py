"""Tests for Unified Calendar API in single-tenant mode."""


def test_calendar_event_crud(client, auth_headers):
    """Test creating, reading, updating, and deleting calendar events."""
    payload = {
        "title": "Quarterly Planning Meeting",
        "description": "Discuss Q4 objectives and roadmap",
        "event_type": "meeting",
        "start_time": "2026-09-01T10:00:00Z",
        "end_time": "2026-09-01T11:30:00Z",
        "all_day": False,
        "location": "Room 402 / Zoom",
        "source": "pcc",
    }
    create_res = client.post("/api/v1/calendar/events/create_calendar_event", json=payload, headers=auth_headers)
    assert create_res.status_code == 201
    data = create_res.json()["data"]
    assert data["title"] == payload["title"]
    assert data["event_type"] == "meeting"
    assert data["location"] == "Room 402 / Zoom"
    event_id = data["id"]

    # Get single event
    get_res = client.get(f"/api/v1/calendar/events/get_calendar_event_by_id/{event_id}", headers=auth_headers)
    assert get_res.status_code == 200
    assert get_res.json()["data"]["id"] == event_id

    # Update event
    patch_res = client.patch(
        f"/api/v1/calendar/events/update_calendar_event_by_id/{event_id}",
        json={"location": "Zoom Only", "title": "Updated Planning Meeting"},
        headers=auth_headers,
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["data"]["location"] == "Zoom Only"
    assert patch_res.json()["data"]["title"] == "Updated Planning Meeting"

    # Delete event
    del_res = client.delete(f"/api/v1/calendar/events/delete_calendar_event_by_id/{event_id}", headers=auth_headers)
    assert del_res.status_code == 200

    # Verify not found
    assert (
        client.get(f"/api/v1/calendar/events/get_calendar_event_by_id/{event_id}", headers=auth_headers).status_code
        == 404
    )


def test_calendar_date_range_and_type_filtering(client, auth_headers):
    """Test date-range and event_type filtering."""
    client.post(
        "/api/v1/calendar/events/create_calendar_event",
        json={
            "title": "August Event",
            "event_type": "event",
            "start_time": "2026-08-20T14:00:00Z",
        },
        headers=auth_headers,
    )
    client.post(
        "/api/v1/calendar/events/create_calendar_event",
        json={
            "title": "September Meeting",
            "event_type": "meeting",
            "start_time": "2026-09-10T09:00:00Z",
        },
        headers=auth_headers,
    )
    client.post(
        "/api/v1/calendar/events/create_calendar_event",
        json={
            "title": "October Deadline",
            "event_type": "deadline",
            "start_time": "2026-10-01T23:59:59Z",
        },
        headers=auth_headers,
    )

    # Filter date range (Sept only)
    sept_res = client.get(
        "/api/v1/calendar/events/list_calendar_events?start_date=2026-09-01T00:00:00Z&end_date=2026-09-30T23:59:59Z",
        headers=auth_headers,
    )
    assert sept_res.status_code == 200
    assert len(sept_res.json()["data"]) == 1
    assert sept_res.json()["data"][0]["title"] == "September Meeting"

    # Filter by event_type
    type_res = client.get("/api/v1/calendar/events/list_calendar_events?event_type=deadline", headers=auth_headers)
    assert type_res.status_code == 200
    assert len(type_res.json()["data"]) == 1
    assert type_res.json()["data"][0]["title"] == "October Deadline"
