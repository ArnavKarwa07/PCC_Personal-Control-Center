"""Career and professional portfolio service layer."""

import uuid
from typing import List, Optional, Tuple

from sqlalchemy.orm import Session

from app.models.career import (
    Achievement,
    Certification,
    Experience,
    ResumeVersion,
    Skill,
)
from app.schemas.career import (
    AchievementCreate,
    AchievementUpdate,
    CareerSummaryRead,
    CertificationCreate,
    CertificationUpdate,
    ExperienceCreate,
    ExperienceUpdate,
    ResumeVersionCreate,
    ResumeVersionUpdate,
    SkillCreate,
    SkillUpdate,
)


class CareerService:
    """Service layer managing achievements, resumes, skills, certs, and work history."""

    # -------------------------------------------------------------------------
    # Summary
    # -------------------------------------------------------------------------

    def get_summary(self, db: Session, user_id: uuid.UUID) -> CareerSummaryRead:
        """Aggregate high-level career telemetry for portfolio overview."""
        achievements_count = db.query(Achievement).filter(Achievement.user_id == user_id).count()
        resume_relevant_achievements = (
            db.query(Achievement)
            .filter(Achievement.user_id == user_id, Achievement.resume_relevant.is_(True))
            .count()
        )
        skills_count = db.query(Skill).filter(Skill.user_id == user_id).count()
        certifications_count = db.query(Certification).filter(Certification.user_id == user_id).count()
        experiences_count = db.query(Experience).filter(Experience.user_id == user_id).count()
        resume_versions_count = db.query(ResumeVersion).filter(ResumeVersion.user_id == user_id).count()

        recent_achievements = (
            db.query(Achievement)
            .filter(Achievement.user_id == user_id)
            .order_by(Achievement.date.desc().nullslast(), Achievement.created_at.desc())
            .limit(5)
            .all()
        )

        current_experiences = (
            db.query(Experience)
            .filter(Experience.user_id == user_id, Experience.is_current.is_(True))
            .order_by(Experience.start_date.desc().nullslast())
            .all()
        )

        return CareerSummaryRead(
            achievements_count=achievements_count,
            resume_relevant_achievements=resume_relevant_achievements,
            skills_count=skills_count,
            certifications_count=certifications_count,
            experiences_count=experiences_count,
            resume_versions_count=resume_versions_count,
            recent_achievements=recent_achievements,
            current_experiences=current_experiences,
        )

    # -------------------------------------------------------------------------
    # Achievements CRUD
    # -------------------------------------------------------------------------

    def list_achievements(
        self,
        db: Session,
        user_id: uuid.UUID,
        category: Optional[str] = None,
        resume_relevant: Optional[bool] = None,
        linkedin_relevant: Optional[bool] = None,
        page: int = 1,
        per_page: int = 50,
    ) -> Tuple[List[Achievement], int, int]:
        query = db.query(Achievement).filter(Achievement.user_id == user_id)
        if category:
            query = query.filter(Achievement.category.ilike(f"%{category}%"))
        if resume_relevant is not None:
            query = query.filter(Achievement.resume_relevant == resume_relevant)
        if linkedin_relevant is not None:
            query = query.filter(Achievement.linkedin_relevant == linkedin_relevant)

        total = query.count()
        total_pages = (total + per_page - 1) // per_page if total > 0 else 1
        achievements = (
            query.order_by(Achievement.date.desc().nullslast(), Achievement.created_at.desc())
            .offset((page - 1) * per_page)
            .limit(per_page)
            .all()
        )
        return achievements, total, total_pages

    def get_achievement(
        self, db: Session, user_id: uuid.UUID, achievement_id: uuid.UUID
    ) -> Optional[Achievement]:
        return (
            db.query(Achievement)
            .filter(Achievement.id == achievement_id, Achievement.user_id == user_id)
            .first()
        )

    def create_achievement(
        self, db: Session, user_id: uuid.UUID, data: AchievementCreate
    ) -> Achievement:
        achievement = Achievement(
            user_id=user_id,
            title=data.title,
            description=data.description,
            date=data.date,
            category=data.category,
            project_id=data.project_id,
            evidence=data.evidence,
            resume_relevant=data.resume_relevant,
            linkedin_relevant=data.linkedin_relevant,
        )
        db.add(achievement)
        db.commit()
        db.refresh(achievement)
        return achievement

    def update_achievement(
        self,
        db: Session,
        user_id: uuid.UUID,
        achievement_id: uuid.UUID,
        data: AchievementUpdate,
    ) -> Optional[Achievement]:
        achievement = self.get_achievement(db, user_id, achievement_id)
        if not achievement:
            return None

        for key, val in data.model_dump(exclude_unset=True).items():
            setattr(achievement, key, val)

        db.commit()
        db.refresh(achievement)
        return achievement

    def delete_achievement(
        self, db: Session, user_id: uuid.UUID, achievement_id: uuid.UUID
    ) -> bool:
        achievement = self.get_achievement(db, user_id, achievement_id)
        if not achievement:
            return False
        db.delete(achievement)
        db.commit()
        return True

    # -------------------------------------------------------------------------
    # Resume Versions CRUD
    # -------------------------------------------------------------------------

    def list_resume_versions(
        self,
        db: Session,
        user_id: uuid.UUID,
        page: int = 1,
        per_page: int = 50,
    ) -> Tuple[List[ResumeVersion], int, int]:
        query = db.query(ResumeVersion).filter(ResumeVersion.user_id == user_id)
        total = query.count()
        total_pages = (total + per_page - 1) // per_page if total > 0 else 1
        resumes = (
            query.order_by(ResumeVersion.updated_at.desc())
            .offset((page - 1) * per_page)
            .limit(per_page)
            .all()
        )
        return resumes, total, total_pages

    def get_resume_version(
        self, db: Session, user_id: uuid.UUID, version_id: uuid.UUID
    ) -> Optional[ResumeVersion]:
        return (
            db.query(ResumeVersion)
            .filter(ResumeVersion.id == version_id, ResumeVersion.user_id == user_id)
            .first()
        )

    def create_resume_version(
        self, db: Session, user_id: uuid.UUID, data: ResumeVersionCreate
    ) -> ResumeVersion:
        resume = ResumeVersion(
            user_id=user_id,
            version_name=data.version_name,
            target_role=data.target_role,
            content=data.content,
            notes=data.notes,
        )
        db.add(resume)
        db.commit()
        db.refresh(resume)
        return resume

    def update_resume_version(
        self,
        db: Session,
        user_id: uuid.UUID,
        version_id: uuid.UUID,
        data: ResumeVersionUpdate,
    ) -> Optional[ResumeVersion]:
        resume = self.get_resume_version(db, user_id, version_id)
        if not resume:
            return None

        for key, val in data.model_dump(exclude_unset=True).items():
            setattr(resume, key, val)

        db.commit()
        db.refresh(resume)
        return resume

    def delete_resume_version(
        self, db: Session, user_id: uuid.UUID, version_id: uuid.UUID
    ) -> bool:
        resume = self.get_resume_version(db, user_id, version_id)
        if not resume:
            return False
        db.delete(resume)
        db.commit()
        return True

    # -------------------------------------------------------------------------
    # Skills CRUD
    # -------------------------------------------------------------------------

    def list_skills(
        self,
        db: Session,
        user_id: uuid.UUID,
        category: Optional[str] = None,
        page: int = 1,
        per_page: int = 100,
    ) -> Tuple[List[Skill], int, int]:
        query = db.query(Skill).filter(Skill.user_id == user_id)
        if category:
            query = query.filter(Skill.category.ilike(f"%{category}%"))

        total = query.count()
        total_pages = (total + per_page - 1) // per_page if total > 0 else 1
        skills = (
            query.order_by(Skill.category.asc().nullslast(), Skill.name.asc())
            .offset((page - 1) * per_page)
            .limit(per_page)
            .all()
        )
        return skills, total, total_pages

    def get_skill(self, db: Session, user_id: uuid.UUID, skill_id: uuid.UUID) -> Optional[Skill]:
        return db.query(Skill).filter(Skill.id == skill_id, Skill.user_id == user_id).first()

    def create_skill(self, db: Session, user_id: uuid.UUID, data: SkillCreate) -> Skill:
        skill = Skill(
            user_id=user_id,
            name=data.name,
            category=data.category,
            proficiency=data.proficiency,
        )
        db.add(skill)
        db.commit()
        db.refresh(skill)
        return skill

    def update_skill(
        self, db: Session, user_id: uuid.UUID, skill_id: uuid.UUID, data: SkillUpdate
    ) -> Optional[Skill]:
        skill = self.get_skill(db, user_id, skill_id)
        if not skill:
            return None

        for key, val in data.model_dump(exclude_unset=True).items():
            setattr(skill, key, val)

        db.commit()
        db.refresh(skill)
        return skill

    def delete_skill(self, db: Session, user_id: uuid.UUID, skill_id: uuid.UUID) -> bool:
        skill = self.get_skill(db, user_id, skill_id)
        if not skill:
            return False
        db.delete(skill)
        db.commit()
        return True

    # -------------------------------------------------------------------------
    # Certifications CRUD
    # -------------------------------------------------------------------------

    def list_certifications(
        self,
        db: Session,
        user_id: uuid.UUID,
        page: int = 1,
        per_page: int = 50,
    ) -> Tuple[List[Certification], int, int]:
        query = db.query(Certification).filter(Certification.user_id == user_id)
        total = query.count()
        total_pages = (total + per_page - 1) // per_page if total > 0 else 1
        certifications = (
            query.order_by(Certification.date_obtained.desc().nullslast(), Certification.created_at.desc())
            .offset((page - 1) * per_page)
            .limit(per_page)
            .all()
        )
        return certifications, total, total_pages

    def get_certification(
        self, db: Session, user_id: uuid.UUID, cert_id: uuid.UUID
    ) -> Optional[Certification]:
        return (
            db.query(Certification)
            .filter(Certification.id == cert_id, Certification.user_id == user_id)
            .first()
        )

    def create_certification(
        self, db: Session, user_id: uuid.UUID, data: CertificationCreate
    ) -> Certification:
        certification = Certification(
            user_id=user_id,
            name=data.name,
            issuer=data.issuer,
            date_obtained=data.date_obtained,
            expiry_date=data.expiry_date,
            credential_id=data.credential_id,
        )
        db.add(certification)
        db.commit()
        db.refresh(certification)
        return certification

    def update_certification(
        self,
        db: Session,
        user_id: uuid.UUID,
        cert_id: uuid.UUID,
        data: CertificationUpdate,
    ) -> Optional[Certification]:
        certification = self.get_certification(db, user_id, cert_id)
        if not certification:
            return None

        for key, val in data.model_dump(exclude_unset=True).items():
            setattr(certification, key, val)

        db.commit()
        db.refresh(certification)
        return certification

    def delete_certification(
        self, db: Session, user_id: uuid.UUID, cert_id: uuid.UUID
    ) -> bool:
        certification = self.get_certification(db, user_id, cert_id)
        if not certification:
            return False
        db.delete(certification)
        db.commit()
        return True

    # -------------------------------------------------------------------------
    # Experience CRUD
    # -------------------------------------------------------------------------

    def list_experiences(
        self,
        db: Session,
        user_id: uuid.UUID,
        page: int = 1,
        per_page: int = 50,
    ) -> Tuple[List[Experience], int, int]:
        query = db.query(Experience).filter(Experience.user_id == user_id)
        total = query.count()
        total_pages = (total + per_page - 1) // per_page if total > 0 else 1
        experiences = (
            query.order_by(
                Experience.is_current.desc(),
                Experience.start_date.desc().nullslast(),
                Experience.created_at.desc(),
            )
            .offset((page - 1) * per_page)
            .limit(per_page)
            .all()
        )
        return experiences, total, total_pages

    def get_experience(
        self, db: Session, user_id: uuid.UUID, exp_id: uuid.UUID
    ) -> Optional[Experience]:
        return (
            db.query(Experience)
            .filter(Experience.id == exp_id, Experience.user_id == user_id)
            .first()
        )

    def create_experience(
        self, db: Session, user_id: uuid.UUID, data: ExperienceCreate
    ) -> Experience:
        experience = Experience(
            user_id=user_id,
            company=data.company,
            role=data.role,
            start_date=data.start_date,
            end_date=data.end_date,
            description=data.description,
            is_current=data.is_current,
        )
        db.add(experience)
        db.commit()
        db.refresh(experience)
        return experience

    def update_experience(
        self,
        db: Session,
        user_id: uuid.UUID,
        exp_id: uuid.UUID,
        data: ExperienceUpdate,
    ) -> Optional[Experience]:
        experience = self.get_experience(db, user_id, exp_id)
        if not experience:
            return None

        for key, val in data.model_dump(exclude_unset=True).items():
            setattr(experience, key, val)

        db.commit()
        db.refresh(experience)
        return experience

    def delete_experience(
        self, db: Session, user_id: uuid.UUID, exp_id: uuid.UUID
    ) -> bool:
        experience = self.get_experience(db, user_id, exp_id)
        if not experience:
            return False
        db.delete(experience)
        db.commit()
        return True


career_service = CareerService()
