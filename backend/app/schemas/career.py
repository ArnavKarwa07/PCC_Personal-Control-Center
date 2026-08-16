"""Pydantic schemas for Career portfolio, achievements, skills, certifications, and experience."""

import uuid
from datetime import date as dt_date
from datetime import datetime as dt_datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

# ==========================================
# Achievement Schemas
# ==========================================


class AchievementBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    date: Optional[dt_date] = None
    category: Optional[str] = Field(default=None, max_length=100)
    project_id: Optional[uuid.UUID] = None
    evidence: Optional[str] = None
    resume_relevant: bool = False
    linkedin_relevant: bool = False


class AchievementCreate(AchievementBase):
    pass


class AchievementUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=500)
    description: Optional[str] = None
    date: Optional[dt_date] = None
    category: Optional[str] = Field(default=None, max_length=100)
    project_id: Optional[uuid.UUID] = None
    evidence: Optional[str] = None
    resume_relevant: Optional[bool] = None
    linkedin_relevant: Optional[bool] = None


class AchievementRead(AchievementBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: dt_datetime
    updated_at: dt_datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# ResumeVersion Schemas
# ==========================================


class ResumeVersionBase(BaseModel):
    version_name: str = Field(..., min_length=1, max_length=255)
    target_role: Optional[str] = Field(default=None, max_length=255)
    content: Optional[str] = None
    notes: Optional[str] = None


class ResumeVersionCreate(ResumeVersionBase):
    pass


class ResumeVersionUpdate(BaseModel):
    version_name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    target_role: Optional[str] = Field(default=None, max_length=255)
    content: Optional[str] = None
    notes: Optional[str] = None


class ResumeVersionRead(ResumeVersionBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: dt_datetime
    updated_at: dt_datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Skill Schemas
# ==========================================


class SkillBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    category: Optional[str] = Field(default=None, max_length=100)
    proficiency: Optional[str] = Field(default=None, max_length=50)


class SkillCreate(SkillBase):
    pass


class SkillUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    category: Optional[str] = Field(default=None, max_length=100)
    proficiency: Optional[str] = Field(default=None, max_length=50)


class SkillRead(SkillBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: dt_datetime
    updated_at: dt_datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Certification Schemas
# ==========================================


class CertificationBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    issuer: Optional[str] = Field(default=None, max_length=255)
    date_obtained: Optional[dt_date] = None
    expiry_date: Optional[dt_date] = None
    credential_id: Optional[str] = Field(default=None, max_length=255)


class CertificationCreate(CertificationBase):
    pass


class CertificationUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    issuer: Optional[str] = Field(default=None, max_length=255)
    date_obtained: Optional[dt_date] = None
    expiry_date: Optional[dt_date] = None
    credential_id: Optional[str] = Field(default=None, max_length=255)


class CertificationRead(CertificationBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: dt_datetime
    updated_at: dt_datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Experience Schemas
# ==========================================


class ExperienceBase(BaseModel):
    company: str = Field(..., min_length=1, max_length=255)
    role: str = Field(..., min_length=1, max_length=255)
    start_date: Optional[dt_date] = None
    end_date: Optional[dt_date] = None
    description: Optional[str] = None
    is_current: bool = False


class ExperienceCreate(ExperienceBase):
    pass


class ExperienceUpdate(BaseModel):
    company: Optional[str] = Field(default=None, min_length=1, max_length=255)
    role: Optional[str] = Field(default=None, min_length=1, max_length=255)
    start_date: Optional[dt_date] = None
    end_date: Optional[dt_date] = None
    description: Optional[str] = None
    is_current: Optional[bool] = None


class ExperienceRead(ExperienceBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: dt_datetime
    updated_at: dt_datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Career Summary Schemas
# ==========================================


class CareerSummaryRead(BaseModel):
    achievements_count: int
    resume_relevant_achievements: int
    skills_count: int
    certifications_count: int
    experiences_count: int
    resume_versions_count: int
    recent_achievements: List[AchievementRead] = Field(default_factory=list)
    current_experiences: List[ExperienceRead] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)
