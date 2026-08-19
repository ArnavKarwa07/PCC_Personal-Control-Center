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
  "timers": []
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

---

## 3. Importing & Exporting Data

- **Import/Load**: Navigate to **Settings** (`/settings`) -> **JSON Onboarding Loader** tab, paste or upload `pcc_data.json`, and click **Load & Initialize Data**.
- **Export**: Navigate to **Settings** (`/settings`) -> **Data & Backup** tab, click **Export pcc_data.json** to download a full backup archive of your workspace.
