"""Project, ProjectMember, and ProjectTag database models."""

import enum

from sqlalchemy import Column, Date, DateTime, Enum, Float, ForeignKey, String, Text, Uuid, func
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import BaseModel


class ProjectStatus(str, enum.Enum):
    IDEA = "idea"
    PLANNED = "planned"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class ProjectPriority(str, enum.Enum):
    NONE = "none"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class ProjectTag(Base):
    """Many-to-many junction between projects and tags."""

    __tablename__ = "project_tags"

    project_id = Column(Uuid(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True)
    tag_id = Column(Uuid(as_uuid=True), ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class ProjectMember(BaseModel):
    """Project stakeholder or collaborator linked to a contact."""

    __tablename__ = "project_members"

    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = Column(Uuid(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    contact_id = Column(Uuid(as_uuid=True), ForeignKey("contacts.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(100), nullable=True)

    project = relationship("Project", back_populates="members")
    contact = relationship("Contact")


class Project(BaseModel):
    """Project entity organizing tasks, boards, and milestones."""

    __tablename__ = "projects"

    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(
        Enum(ProjectStatus, name="project_status", values_callable=lambda obj: [e.value for e in obj]),
        default=ProjectStatus.PLANNED,
        nullable=False,
    )
    priority = Column(
        Enum(ProjectPriority, name="project_priority", values_callable=lambda obj: [e.value for e in obj]),
        default=ProjectPriority.NONE,
        nullable=False,
    )
    start_date = Column(Date, nullable=True)
    deadline = Column(Date, nullable=True)
    progress = Column(Float, default=0.0, nullable=False)

    members = relationship("ProjectMember", back_populates="project", cascade="all, delete-orphan")
    tags = relationship("Tag", secondary="project_tags")
    tasks = relationship("Task", back_populates="project")
    boards = relationship("Board", back_populates="project", cascade="all, delete-orphan")
