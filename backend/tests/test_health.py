"""Tests for health check and root endpoints."""


def test_root_endpoint(client):
    """Test GET / returns API metadata."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "PCC API"
    assert data["version"] == "0.1.0"


def test_health_check_endpoint(client):
    """Test GET /api/v1/health returns status ok."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["version"] == "0.1.0"
    assert "timestamp" in data
