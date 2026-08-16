"""Career & Professional Growth REST API endpoints."""

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.career import (
    AchievementCreate,
    AchievementRead,
    AchievementUpdate,
    CareerSummaryRead,
    CertificationCreate,
    CertificationRead,
    CertificationUpdate,
    ExperienceCreate,
    ExperienceRead,
    ExperienceUpdate,
    ResumeVersionCreate,
    ResumeVersionRead,
    ResumeVersionUpdate,
    SkillCreate,
    SkillRead,
    SkillUpdate,
)
from app.services.career_service import career_service

router = APIRouter(prefix="/career", tags=["Career"])


# ==========================================
# Summary
# ==========================================


@router.get("/summary", response_model=CareerSummaryRead, summary="Get Career Summary")
def get_career_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve portfolio metrics, counts, and recent achievement highlights."""
    return career_service.get_summary(db=db, user_id=current_user.id)


# ==========================================
# Achievements Endpoints
# ==========================================


@router.get("/achievements", summary="List Achievements")
def list_achievements(
    category: Optional[str] = None,
    resume_relevant: Optional[bool] = None,
    linkedin_relevant: Optional[bool] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve logged achievements and milestones."""
    items, total, total_pages = career_service.list_achievements(
        db=db,
        user_id=current_user.id,
        category=category,
        resume_relevant=resume_relevant,
        linkedin_relevant=linkedin_relevant,
        page=page,
        per_page=per_page,
    )
    return {
        "data": [AchievementRead.model_validate(item).model_dump() for item in items],
        "meta": {"total": total, "page": page, "per_page": per_page, "total_pages": total_pages},
    }


@router.post("/achievements", status_code=status.HTTP_201_CREATED, summary="Create Achievement")
def create_achievement(
    data: AchievementCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Log a new career win, milestone, or portfolio achievement."""
    item = career_service.create_achievement(db=db, user_id=current_user.id, data=data)
    return {"data": AchievementRead.model_validate(item).model_dump()}


@router.patch("/achievements/{achievement_id}", summary="Update Achievement")
def update_achievement(
    achievement_id: uuid.UUID,
    data: AchievementUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update an achievement's details or relevance flags."""
    item = career_service.update_achievement(
        db=db, user_id=current_user.id, achievement_id=achievement_id, data=data
    )
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Achievement not found")
    return {"data": AchievementRead.model_validate(item).model_dump()}


@router.delete(
    "/achievements/{achievement_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Achievement",
)
def delete_achievement(
    achievement_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete an achievement."""
    success = career_service.delete_achievement(
        db=db, user_id=current_user.id, achievement_id=achievement_id
    )
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Achievement not found")


# ==========================================
# Resume Versions Endpoints
# ==========================================


@router.get("/resumes", summary="List Resume Versions")
def list_resume_versions(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve resume version snapshots."""
    items, total, total_pages = career_service.list_resume_versions(
        db=db, user_id=current_user.id, page=page, per_page=per_page
    )
    return {
        "data": [ResumeVersionRead.model_validate(item).model_dump() for item in items],
        "meta": {"total": total, "page": page, "per_page": per_page, "total_pages": total_pages},
    }


@router.post("/resumes", status_code=status.HTTP_201_CREATED, summary="Create Resume Version")
def create_resume_version(
    data: ResumeVersionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Save a new resume markdown/text snapshot."""
    item = career_service.create_resume_version(db=db, user_id=current_user.id, data=data)
    return {"data": ResumeVersionRead.model_validate(item).model_dump()}


@router.patch("/resumes/{version_id}", summary="Update Resume Version")
def update_resume_version(
    version_id: uuid.UUID,
    data: ResumeVersionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a resume version's title, content, or notes."""
    item = career_service.update_resume_version(
        db=db, user_id=current_user.id, version_id=version_id, data=data
    )
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume version not found")
    return {"data": ResumeVersionRead.model_validate(item).model_dump()}


@router.delete(
    "/resumes/{version_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Resume Version",
)
def delete_resume_version(
    version_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a resume version."""
    success = career_service.delete_resume_version(
        db=db, user_id=current_user.id, version_id=version_id
    )
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume version not found")


# ==========================================
# Skills Endpoints
# ==========================================


@router.get("/skills", summary="List Skills")
def list_skills(
    category: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(100, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve skill inventory matrix."""
    items, total, total_pages = career_service.list_skills(
        db=db, user_id=current_user.id, category=category, page=page, per_page=per_page
    )
    return {
        "data": [SkillRead.model_validate(item).model_dump() for item in items],
        "meta": {"total": total, "page": page, "per_page": per_page, "total_pages": total_pages},
    }


@router.post("/skills", status_code=status.HTTP_201_CREATED, summary="Create Skill")
def create_skill(
    data: SkillCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add a new technical or soft skill to the matrix."""
    item = career_service.create_skill(db=db, user_id=current_user.id, data=data)
    return {"data": SkillRead.model_validate(item).model_dump()}


@router.patch("/skills/{skill_id}", summary="Update Skill")
def update_skill(
    skill_id: uuid.UUID,
    data: SkillUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a skill's proficiency level or category."""
    item = career_service.update_skill(
        db=db, user_id=current_user.id, skill_id=skill_id, data=data
    )
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found")
    return {"data": SkillRead.model_validate(item).model_dump()}


@router.delete(
    "/skills/{skill_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Skill",
)
def delete_skill(
    skill_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove a skill from the matrix."""
    success = career_service.delete_skill(db=db, user_id=current_user.id, skill_id=skill_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found")


# ==========================================
# Certifications Endpoints
# ==========================================


@router.get("/certifications", summary="List Certifications")
def list_certifications(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve professional credentials and certifications."""
    items, total, total_pages = career_service.list_certifications(
        db=db, user_id=current_user.id, page=page, per_page=per_page
    )
    return {
        "data": [CertificationRead.model_validate(item).model_dump() for item in items],
        "meta": {"total": total, "page": page, "per_page": per_page, "total_pages": total_pages},
    }


@router.post(
    "/certifications",
    status_code=status.HTTP_201_CREATED,
    summary="Create Certification",
)
def create_certification(
    data: CertificationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Log a professional certification or license."""
    item = career_service.create_certification(db=db, user_id=current_user.id, data=data)
    return {"data": CertificationRead.model_validate(item).model_dump()}


@router.patch("/certifications/{cert_id}", summary="Update Certification")
def update_certification(
    cert_id: uuid.UUID,
    data: CertificationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update certification credentials or expiry date."""
    item = career_service.update_certification(
        db=db, user_id=current_user.id, cert_id=cert_id, data=data
    )
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certification not found")
    return {"data": CertificationRead.model_validate(item).model_dump()}


@router.delete(
    "/certifications/{cert_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Certification",
)
def delete_certification(
    cert_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a certification credential."""
    success = career_service.delete_certification(
        db=db, user_id=current_user.id, cert_id=cert_id
    )
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certification not found")


# ==========================================
# Experience Endpoints
# ==========================================


@router.get("/experiences", summary="List Experiences")
def list_experiences(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve employment and career work history."""
    items, total, total_pages = career_service.list_experiences(
        db=db, user_id=current_user.id, page=page, per_page=per_page
    )
    return {
        "data": [ExperienceRead.model_validate(item).model_dump() for item in items],
        "meta": {"total": total, "page": page, "per_page": per_page, "total_pages": total_pages},
    }


@router.post("/experiences", status_code=status.HTTP_201_CREATED, summary="Create Experience")
def create_experience(
    data: ExperienceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add a work history role or employment experience."""
    item = career_service.create_experience(db=db, user_id=current_user.id, data=data)
    return {"data": ExperienceRead.model_validate(item).model_dump()}


@router.patch("/experiences/{exp_id}", summary="Update Experience")
def update_experience(
    exp_id: uuid.UUID,
    data: ExperienceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update role, company, dates, or experience details."""
    item = career_service.update_experience(
        db=db, user_id=current_user.id, exp_id=exp_id, data=data
    )
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Experience not found")
    return {"data": ExperienceRead.model_validate(item).model_dump()}


@router.delete(
    "/experiences/{exp_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Experience",
)
def delete_experience(
    exp_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete an experience history entry."""
    success = career_service.delete_experience(db=db, user_id=current_user.id, exp_id=exp_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Experience not found")
