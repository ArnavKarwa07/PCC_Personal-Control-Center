"""Comprehensive tests for Career & Professional Growth endpoints."""

from datetime import date

from fastapi.testclient import TestClient


def test_career_summary_and_full_crud(client: TestClient, auth_headers: dict):
    # 1. Check initial empty summary
    res = client.get("/api/v1/career/summary", headers=auth_headers)
    assert res.status_code == 200
    summary = res.json()
    assert summary["achievements_count"] == 0
    assert summary["skills_count"] == 0
    assert summary["certifications_count"] == 0
    assert summary["experiences_count"] == 0
    assert summary["resume_versions_count"] == 0

    # 2. Create Achievement
    res = client.post(
        "/api/v1/career/achievements",
        headers=auth_headers,
        json={
            "title": "Architected PCC Multi-Agent System",
            "description": "Engineered distributed state sync and responsive UI",
            "date": date.today().isoformat(),
            "category": "Architecture",
            "evidence": "https://github.com/ArnavKarwa07/PCC_Personal-Control-Center",
            "resume_relevant": True,
            "linkedin_relevant": True,
        },
    )
    if res.status_code != 201:
        print("POST ACHIEVEMENT ERROR:", res.status_code, res.text)
    assert res.status_code == 201
    ach_id = res.json()["data"]["id"]
    assert res.json()["data"]["resume_relevant"] is True


    # List achievements with filter
    res = client.get("/api/v1/career/achievements?resume_relevant=true", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["meta"]["total"] == 1

    # Update achievement
    res = client.patch(
        f"/api/v1/career/achievements/{ach_id}",
        headers=auth_headers,
        json={"title": "Architected PCC Production-Ready System"},
    )
    assert res.status_code == 200
    assert res.json()["data"]["title"] == "Architected PCC Production-Ready System"

    # 3. Create Skill
    res = client.post(
        "/api/v1/career/skills",
        headers=auth_headers,
        json={
            "name": "FastAPI & Python 3.12",
            "category": "Backend",
            "proficiency": "Expert",
        },
    )
    assert res.status_code == 201
    skill_id = res.json()["data"]["id"]

    # List skills
    res = client.get("/api/v1/career/skills?category=Backend", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["meta"]["total"] == 1

    # Update skill
    res = client.patch(
        f"/api/v1/career/skills/{skill_id}",
        headers=auth_headers,
        json={"proficiency": "Master"},
    )
    assert res.status_code == 200
    assert res.json()["data"]["proficiency"] == "Master"

    # 4. Create Certification
    res = client.post(
        "/api/v1/career/certifications",
        headers=auth_headers,
        json={
            "name": "AWS Certified Solutions Architect",
            "issuer": "Amazon Web Services",
            "date_obtained": date.today().isoformat(),
            "credential_id": "AWS-PSA-994821",
        },
    )
    assert res.status_code == 201
    cert_id = res.json()["data"]["id"]

    # List certifications
    res = client.get("/api/v1/career/certifications", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["meta"]["total"] == 1

    # Update certification
    res = client.patch(
        f"/api/v1/career/certifications/{cert_id}",
        headers=auth_headers,
        json={"credential_id": "AWS-PSA-UPDATED"},
    )
    assert res.status_code == 200
    assert res.json()["data"]["credential_id"] == "AWS-PSA-UPDATED"

    # 5. Create Experience
    res = client.post(
        "/api/v1/career/experiences",
        headers=auth_headers,
        json={
            "company": "PCC Core Labs",
            "role": "Principal Systems Architect",
            "start_date": date.today().isoformat(),
            "description": "Leading design and execution of personal control systems.",
            "is_current": True,
        },
    )
    assert res.status_code == 201
    exp_id = res.json()["data"]["id"]

    # List experiences
    res = client.get("/api/v1/experiences" if False else "/api/v1/career/experiences", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["meta"]["total"] == 1

    # Update experience
    res = client.patch(
        f"/api/v1/career/experiences/{exp_id}",
        headers=auth_headers,
        json={"role": "Lead Architect"},
    )
    assert res.status_code == 200
    assert res.json()["data"]["role"] == "Lead Architect"

    # 6. Create Resume Version
    res = client.post(
        "/api/v1/career/resumes",
        headers=auth_headers,
        json={
            "version_name": "FullStack-Lead-2026",
            "target_role": "Staff Full Stack Engineer",
            "content": "# Resume\n\n## Experience\nLead Full Stack Engineer",
            "notes": "Tailored for high-scale distributed systems roles",
        },
    )
    assert res.status_code == 201
    resume_id = res.json()["data"]["id"]

    # List resumes
    res = client.get("/api/v1/career/resumes", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["meta"]["total"] == 1

    # Update resume
    res = client.patch(
        f"/api/v1/career/resumes/{resume_id}",
        headers=auth_headers,
        json={"target_role": "Principal Engineer"},
    )
    assert res.status_code == 200
    assert res.json()["data"]["target_role"] == "Principal Engineer"

    # 7. Check Summary with data
    res = client.get("/api/v1/career/summary", headers=auth_headers)
    assert res.status_code == 200
    summary = res.json()
    assert summary["achievements_count"] == 1
    assert summary["resume_relevant_achievements"] == 1
    assert summary["skills_count"] == 1
    assert summary["certifications_count"] == 1
    assert summary["experiences_count"] == 1
    assert summary["resume_versions_count"] == 1
    assert len(summary["recent_achievements"]) == 1
    assert len(summary["current_experiences"]) == 1

    # 8. Deletions
    res = client.delete(f"/api/v1/career/achievements/{ach_id}", headers=auth_headers)
    assert res.status_code == 204

    res = client.delete(f"/api/v1/career/skills/{skill_id}", headers=auth_headers)
    assert res.status_code == 204

    res = client.delete(f"/api/v1/career/certifications/{cert_id}", headers=auth_headers)
    assert res.status_code == 204

    res = client.delete(f"/api/v1/career/experiences/{exp_id}", headers=auth_headers)
    assert res.status_code == 204

    res = client.delete(f"/api/v1/career/resumes/{resume_id}", headers=auth_headers)
    assert res.status_code == 204

    # Final summary check
    res = client.get("/api/v1/career/summary", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["achievements_count"] == 0
