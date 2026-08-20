# PCC Onboarding & Data Import/Export Schema Specification (`DATA_SCHEMA.md`)

This document defines the structured JSON data schema for seeding, exporting, and initializing a Personal Control Center workspace via the `pcc_data.json` Onboarding Loader.

---

## 1. Schema Overview

The `pcc_data.json` file is a self-contained JSON document that populates all core personal operating system modules.

```json
{
  "version": "1.0",
  "user": {
    "name": "Arnav Karwa",
    "email": "user@example.com",
    "location": "Pune, IN",
    "currency": "INR"
  },
  "tasks": [],
  "projects": [],
  "goals": [],
  "notes": [],
  "ideas": [],
  "contacts": [],
  "reminders": [],
  "alarms": [],
  "timers": [],
  "integrations": []
}
```

---

## 2. Module Object Definitions

### Tasks (`tasks`)
```json
{
  "id": "task-101",
  "title": "Finalize Q3 Architecture Roadmap",
  "status": "In Progress",
  "priority": "High",
  "category": "Engineering",
  "dueDate": "2026-08-25",
  "checklist": [
    { "id": "chk-1", "text": "Draft system diagram", "completed": true },
    { "id": "chk-2", "text": "Review with team", "completed": false }
  ]
}
```

### Projects (`projects`)
```json
{
  "id": "proj-201",
  "title": "PCC Personal OS Core Release",
  "description": "Centralized personal dashboard and automation engine",
  "status": "Active",
  "progress": 85,
  "targetDate": "2026-09-01",
  "tags": ["PCC", "React", "TypeScript"]
}
```

### Goals & OKRs (`goals`)
```json
{
  "id": "goal-301",
  "title": "Master Distributed Systems Engineering",
  "period": "2026-Q3",
  "progress": 70,
  "status": "In Progress",
  "milestones": [
    { "id": "m-1", "text": "Complete Raft Consensus implementation", "completed": true },
    { "id": "m-2", "text": "Publish technical post on quorum storage", "completed": false }
  ]
}
```

### Notes (`notes`)
```json
{
  "id": "note-401",
  "title": "Personal Control Center Architecture Notes",
  "category": "Architecture",
  "content": "# PCC Architecture\n- React 18 SPA\n- Zustand state management\n- Glassmorphic Light & Dark UI",
  "isPinned": true,
  "updatedAt": "2026-08-19"
}
```

### Contacts / Personal CRM (`contacts`)
```json
{
  "id": "contact-501",
  "name": "Rohan Sharma",
  "role": "Lead Architect",
  "company": "Tech Corp",
  "email": "rohan@example.com",
  "phone": "+91 98765 43210",
  "location": "Pune, IN",
  "lastContacted": "2026-08-15"
}
```

### Third-Party Integrations (`integrations`)

Integrations map active connectors, connection statuses, and service configuration parameters across external developer and messaging providers.

#### Microsoft Teams Calendar (`teams_calendar`)
```json
{
  "id": "int-teams-calendar",
  "service": "teams_calendar",
  "name": "Microsoft Teams Calendar",
  "description": "Sync Microsoft 365 calendar events and schedule focus time.",
  "connected": true,
  "category": "calendar",
  "config": {
    "tenantId": "8f9b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d",
    "clientId": "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
    "calendarId": "teams_primary",
    "token_masked": "msteams_a1b2***"
  },
  "lastSynced": "2026-08-20T23:30:00Z"
}
```

#### Slack Integration (`slack`)
```json
{
  "id": "int-slack",
  "service": "slack",
  "name": "Slack Integration",
  "description": "Sync status during focus mode, deliver daily digests, and relay task alerts.",
  "connected": true,
  "category": "messaging",
  "config": {
    "userToken": "xoxp-****",
    "defaultChannel": "#pcc-alerts",
    "token_masked": "xoxb-9876***"
  },
  "lastSynced": "2026-08-20T23:30:00Z"
}
```

#### GitLab Workspace Sync (`gitlab`)
```json
{
  "id": "int-gitlab",
  "service": "gitlab",
  "name": "GitLab Workspace Sync",
  "description": "Sync merge requests, assigned issues to tasks, and pipeline build status.",
  "connected": true,
  "category": "developer",
  "config": {
    "gitlabUrl": "https://gitlab.com",
    "projectIds": "12345,67890",
    "token_masked": "glpat-a1b2***"
  },
  "lastSynced": "2026-08-20T23:30:00Z"
}
```

#### Jira Sprint & Task Sync (`jira`)
```json
{
  "id": "int-jira",
  "service": "jira",
  "name": "Jira Sprint & Task Sync",
  "description": "Import sprint issues, sync kanban card statuses, and track project tickets.",
  "connected": true,
  "category": "developer",
  "config": {
    "domain": "company.atlassian.net",
    "email": "user@example.com",
    "projectKey": "PCC",
    "token_masked": "jira_a1b2***"
  },
  "lastSynced": "2026-08-20T23:30:00Z"
}
```

---

## 3. Importing & Exporting Data

- **Import/Load**: Navigate to **Settings** (`/settings`) -> **Data Management** -> **JSON Onboarding Loader**, paste or upload `pcc_data.json`, and click **Load & Initialize Data**.
- **Export**: Navigate to **Settings** (`/settings`) -> **Data Management** -> **Full JSON Workspace Backup**, click **Export pcc_data.json** to download a full backup archive including all task, project, note, goal, contact, and integration states.

