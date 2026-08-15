"""Test configuration and fixtures using SQLite in-memory database."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401 - ensure all models are registered in Base.metadata
from app.core.database import Base, get_db
from app.core.security import create_access_token, hash_password
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
    """Create and return a default test user."""
    user = User(
        email="test@example.com",
        hashed_password=hash_password("password123"),
        full_name="Test User",
        timezone="UTC",
        theme="dark",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def auth_headers(test_user: User) -> dict:
    """Generate authorization headers for default test user."""
    token = create_access_token(data={"sub": str(test_user.id), "email": test_user.email})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def second_user(db_session) -> User:
    """Create and return a second test user for cross-user isolation tests."""
    user = User(
        email="other@example.com",
        hashed_password=hash_password("otherpassword123"),
        full_name="Other User",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def second_auth_headers(second_user: User) -> dict:
    """Generate authorization headers for second test user."""
    token = create_access_token(data={"sub": str(second_user.id), "email": second_user.email})
    return {"Authorization": f"Bearer {token}"}
