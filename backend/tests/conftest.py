"""Test configuration and fixtures using SQLite in-memory database."""

import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401 - ensure all models are registered in Base.metadata
from app.core.database import Base, get_db
from app.main import app as fastapi_app
from app.models.user import User

# In-memory SQLite engine for tests with StaticPool
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(autouse=True)
def setup_database():
    """Create all tables before each test and drop them after."""
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def db_session():
    """Provide a transactional database session for tests."""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def client(db_session):
    """Provide a TestClient with overridden get_db dependency."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    fastapi_app.dependency_overrides[get_db] = override_get_db
    with TestClient(fastapi_app) as test_client:
        yield test_client
    fastapi_app.dependency_overrides.clear()


@pytest.fixture
def test_user(db_session) -> User:
    """Create and return default owner user for tests."""
    user = User(
        id=uuid.UUID("00000000-0000-0000-0000-000000000001"),
        email="arnavkarwa07@gmail.com",
        hashed_password="single_tenant_owner_nopassword",
        full_name="Arnav Karwa",
        timezone="Asia/Kolkata",
        theme="light",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def auth_headers(test_user: User) -> dict:
    """Generate authorization headers for default test user."""
    return {"Authorization": "Bearer pcc_owner_session"}


@pytest.fixture
def second_user(db_session) -> User:
    """Create and return a test user for single-tenant fallback."""
    user = User(
        id=uuid.UUID("00000000-0000-0000-0000-000000000002"),
        email="other@example.com",
        hashed_password="single_tenant_owner_nopassword",
        full_name="Other User",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def second_auth_headers(second_user: User) -> dict:
    """Generate authorization headers for second test user."""
    return {"Authorization": "Bearer pcc_owner_session"}
