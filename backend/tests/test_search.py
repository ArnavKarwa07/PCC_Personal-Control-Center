"""Tests for Global Search cross-entity indexing and query endpoints."""

from datetime import datetime, timezone

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.calendar_event import CalendarEvent, CalendarEventType
from app.models.contact import Contact
from app.models.goal import Goal, GoalStatus
from app.models.idea import Idea, IdeaStatus
from app.models.note import Note
from app.models.project import Project, ProjectPriority, ProjectStatus
from app.models.reminder import Reminder, ReminderStatus
from app.models.task import Task, TaskPriority, TaskStatus
from app.models.user import User


def _seed_all_entities(db: Session, user: User, keyword: str = "Quantum"):
    """Helper to populate test records across all 8 supported entity types."""
    # 1. Task
    task = Task(
        user_id=user.id,
        title=f"{keyword} Task Title",
        description=f"Important {keyword} mission description",
        status=TaskStatus.TODO,
        priority=TaskPriority.HIGH,
    )
    db.add(task)

    # 2. Project
    project = Project(
        user_id=user.id,
        name=f"{keyword} Architecture Project",
        description=f"Blueprint for next-gen {keyword} systems",
        status=ProjectStatus.ACTIVE,
        priority=ProjectPriority.HIGH,
    )
    db.add(project)

    # 3. Note
    note = Note(
        user_id=user.id,
        title=f"{keyword} Meeting Notes",
        content=f"Summary of discussions regarding {keyword} key developments and algorithms.",
        category="Research",
    )
    db.add(note)

    # 4. Idea
    idea = Idea(
        user_id=user.id,
        title=f"{keyword} Brainstorm Concept",
        description=f"An innovative {keyword} protocol incubator",
        category="Innovation",
        status=IdeaStatus.EXPLORING,
    )
    db.add(idea)

    # 5. Calendar Event
    event = CalendarEvent(
        user_id=user.id,
        title=f"{keyword} Sync & Review",
        description=f"Quarterly roadmap for {keyword}",
        event_type=CalendarEventType.MEETING,
        start_time=datetime(2026, 9, 1, 10, 0, tzinfo=timezone.utc),
        location="Virtual Lab",
    )
    db.add(event)

    # 6. Contact
    contact = Contact(
        user_id=user.id,
        name=f"Dr. {keyword} Smith",
        organization="Quantum Tech Labs",
        role="Lead Researcher",
        email="quantum.smith@example.com",
        notes=f"Expert in {keyword} computing",
    )
    db.add(contact)

    # 7. Goal
    goal = Goal(
        user_id=user.id,
        name=f"Master {keyword} Engineering",
        description=f"Achieve breakthrough in {keyword} architecture",
        status=GoalStatus.IN_PROGRESS,
        progress=45.0,
    )
    db.add(goal)

    # 8. Reminder
    reminder = Reminder(
        user_id=user.id,
        title=f"Review {keyword} whitepaper draft",
        description=f"Check section 4 of {keyword} manuscript",
        remind_at=datetime(2026, 8, 20, 9, 0, tzinfo=timezone.utc),
        status=ReminderStatus.PENDING,
    )
    db.add(reminder)

    db.commit()


def test_search_across_all_entity_types(client: TestClient, auth_headers: dict, db_session: Session, test_user: User):
    """Verify that search returns results across all supported entity categories."""
    _seed_all_entities(db_session, test_user, keyword="Quantum")

    response = client.get("/api/v1/search/search_entities?q=Quantum", headers=auth_headers)
    assert response.status_code == 200
    res_data = response.json()

    data = res_data["data"]
    meta = res_data["meta"]

    assert meta["query"] == "Quantum"
    assert meta["total"] >= 8

    found_types = {item["entity_type"] for item in data}
    expected_types = {
        "task",
        "project",
        "note",
        "idea",
        "calendar_event",
        "contact",
        "goal",
        "reminder",
    }
    assert expected_types.issubset(found_types)


def test_search_type_filtering(client: TestClient, auth_headers: dict, db_session: Session, test_user: User):
    """Verify filtering search queries by specific entity types."""
    _seed_all_entities(db_session, test_user, keyword="Filtered")

    # Filter to only tasks and notes
    response = client.get("/api/v1/search/search_entities?q=Filtered&types=tasks,notes", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()["data"]

    assert len(data) == 2
    types_found = {item["entity_type"] for item in data}
    assert types_found == {"task", "note"}


def test_search_relevance_ranking(client: TestClient, auth_headers: dict, db_session: Session, test_user: User):
    """Verify items with exact or title matches score higher relevance than body-only matches."""
    # Exact title match
    note1 = Note(
        user_id=test_user.id,
        title="Supernova",
        content="General notes here.",
    )
    # Body-only match
    note2 = Note(
        user_id=test_user.id,
        title="Miscellaneous Items",
        content="Deep down in the document body Supernova is referenced briefly.",
    )
    db_session.add_all([note1, note2])
    db_session.commit()

    response = client.get("/api/v1/search/search_entities?q=Supernova", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()["data"]

    assert len(data) >= 2
    assert data[0]["title"] == "Supernova"
    assert data[0]["relevance"] > data[1]["relevance"]


def test_search_user_isolation(
    client: TestClient,
    auth_headers: dict,
    second_auth_headers: dict,
    db_session: Session,
    test_user: User,
    second_user: User,
):
    """Verify User A's private entities are not accessible in User B's search results."""
    task_a = Task(
        user_id=test_user.id,
        title="Secret Project Alpha for User 1",
        description="Top secret user 1 info",
    )
    task_b = Task(
        user_id=second_user.id,
        title="Different Project Beta for User 2",
        description="User 2 items only",
    )
    db_session.add_all([task_a, task_b])
    db_session.commit()

    # Search with user 2 headers
    response = client.get("/api/v1/search/search_entities?q=Alpha", headers=second_auth_headers)
    assert response.status_code == 200
    data = response.json()["data"]
    assert len(data) == 0

    # Search with user 1 headers
    response = client.get("/api/v1/search/search_entities?q=Alpha", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()["data"]
    assert len(data) == 1
    assert data[0]["title"] == "Secret Project Alpha for User 1"


def test_search_soft_deleted_excluded(
    client: TestClient, auth_headers: dict, db_session: Session, test_user: User
):
    """Verify soft-deleted items do not appear in search results."""
    active_task = Task(
        user_id=test_user.id,
        title="Active Target Task",
        description="This task is alive and searchable",
    )
    deleted_task = Task(
        user_id=test_user.id,
        title="Deleted Target Task",
        description="This task was deleted",
        deleted_at=datetime.now(timezone.utc),
    )
    db_session.add_all([active_task, deleted_task])
    db_session.commit()

    response = client.get("/api/v1/search/search_entities?q=Target", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()["data"]

    assert len(data) == 1
    assert data[0]["title"] == "Active Target Task"


def test_search_case_insensitivity_and_snippet(
    client: TestClient, auth_headers: dict, db_session: Session, test_user: User
):
    """Verify search is case-insensitive and generates informative context snippets."""
    long_desc = (
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. "
        "Curabitur imperdiet pretium magna, sed facilisis sem HYPERDRIVE system is fully operational. "
        "Donec sed odio dui."
    )
    task = Task(
        user_id=test_user.id,
        title="Propulsion Diagnostics",
        description=long_desc,
    )
    db_session.add(task)
    db_session.commit()

    # Query with lower case "hyperdrive"
    response = client.get("/api/v1/search/search_entities?q=hyperdrive", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()["data"]

    assert len(data) == 1
    assert data[0]["snippet"] is not None
    assert "HYPERDRIVE" in data[0]["snippet"] or "hyperdrive" in data[0]["snippet"].lower()


def test_search_empty_and_no_matches(
    client: TestClient, auth_headers: dict, db_session: Session, test_user: User
):
    """Verify behavior when no results match or invalid query is passed."""
    response = client.get("/api/v1/search/search_entities?q=NonExistentTermXYZ12345", headers=auth_headers)
    assert response.status_code == 200
    res = response.json()
    assert res["data"] == []
    assert res["meta"]["total"] == 0


def test_search_pagination_limit_offset(
    client: TestClient, auth_headers: dict, db_session: Session, test_user: User
):
    """Verify limit and offset pagination parameters work correctly."""
    tasks = [
        Task(user_id=test_user.id, title=f"BatchItem {i}")
        for i in range(10)
    ]
    db_session.add_all(tasks)
    db_session.commit()

    response = client.get("/api/v1/search/search_entities?q=BatchItem&limit=3&offset=0", headers=auth_headers)
    assert response.status_code == 200
    res = response.json()
    assert len(res["data"]) == 3
    assert res["meta"]["total"] == 10
    assert res["meta"]["limit"] == 3
    assert res["meta"]["offset"] == 0

    # Next page
    response2 = client.get("/api/v1/search/search_entities?q=BatchItem&limit=3&offset=3", headers=auth_headers)
    assert response2.status_code == 200
    res2 = response2.json()
    assert len(res2["data"]) == 3
    assert res2["data"][0]["id"] != res["data"][0]["id"]
