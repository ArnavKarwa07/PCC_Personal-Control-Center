"""Career models: Achievement, ResumeVersion, Skill, Certification, Experience."""

from sqlalchemy import Boolean, Column, Date, ForeignKey, String, Text, Uuid
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class Achievement(BaseModel):
    """Notable milestone, outcome, or win for career portfolio."""

    __tablename__ = "achievements"

    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    date = Column(Date, nullable=True)
    category = Column(String(100), nullable=True)
    project_id = Column(Uuid(as_uuid=True), ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)
    evidence = Column(Text, nullable=True)
    resume_relevant = Column(Boolean, default=False, nullable=False)
    linkedin_relevant = Column(Boolean, default=False, nullable=False)

    project = relationship("Project")


class ResumeVersion(BaseModel):
    """Tailored resume markdown/text snapshot."""

    __tablename__ = "resume_versions"

    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    version_name = Column(String(255), nullable=False)
    target_role = Column(String(255), nullable=True)
    content = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)


class Skill(BaseModel):
    """Tracked technical and soft skills."""

    __tablename__ = "skills"

    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=True)
    proficiency = Column(String(50), nullable=True)


class Certification(BaseModel):
    """Professional certifications and credentials."""

    __tablename__ = "certifications"

    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    issuer = Column(String(255), nullable=True)
    date_obtained = Column(Date, nullable=True)
    expiry_date = Column(Date, nullable=True)
    credential_id = Column(String(255), nullable=True)


class Experience(BaseModel):
    """Work history and employment experience."""

    __tablename__ = "experiences"

    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    company = Column(String(255), nullable=False)
    role = Column(String(255), nullable=False)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    description = Column(Text, nullable=True)
    is_current = Column(Boolean, default=False, nullable=False)
