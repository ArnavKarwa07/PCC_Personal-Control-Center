# PCC Migration Notes & Upgrade Guide - Release v1.1.0-beta

This document aggregates release migration notes, database schema upgrades, storage key transitions, deployment host environment configurations, and cross-platform setup guidelines for **Personal Control Center (PCC)** under the single unified release tag **`v1.1.0-beta`**.

---

# PCC Migration Notes - Release v1.1.0-beta (Unified Production Release)

## Release Overview
Consolidated Release `v1.1.0-beta` establishes the Vercel Serverless Python backend architecture, Neon PostgreSQL pool recycling and NullPool serverless handling, offline-first sync mutation queue, Tauri v2 desktop system tray persistence, Capacitor 6 native Android alarm notification channels, AI Executive Assistant Gemini 2.0 Flash integration, single-tenant owner mode for Arnav Karwa, enterprise integrations expansion, Keep-style Notes workspace refactor, and automated GitHub Actions release workflow.

---

## Key Changes & Architectural Specifications

### 1. Vercel Serverless Python Backend Architecture
- **Production Serverless Endpoint**: `https://pcc-backend-ten.vercel.app`
- **Builder**: `@vercel/python` engine defined in root `vercel.json`.
- **Routing Configuration (`vercel.json`)**:
  ```json
  {
    "version": 2,
    "builds": [
      {
        "src": "api/index.py",
        "use": "@vercel/python"
      }
    ],
    "routes": [
      {
        "src": "/(.*)",
        "dest": "api/index.py"
      }
    ]
  }
  ```
- **Entrypoint Routing (`api/index.py`)**:
  - `api/index.py` acts as the serverless function bridge, dynamically appending the repository root and `backend/` directory to `sys.path`.
  - Imports `app` from `backend.app.main` and exposes `__all__ = ["app"]`, allowing Vercel's Python runtime to invoke the FastAPI application without modifying internal package paths.
  ```python
  import os
  import sys

  current_dir = os.path.dirname(__file__)
  root_path = os.path.abspath(os.path.join(current_dir, ".."))
  backend_path = os.path.abspath(os.path.join(current_dir, "..", "backend"))

  if root_path not in sys.path:
      sys.path.insert(0, root_path)
  if backend_path not in sys.path:
      sys.path.insert(0, backend_path)

  from app.main import app

  __all__ = ["app"]
  ```
- **Stateless Execution Model**:
  - Operates on ephemeral serverless instances, eliminating idle container compute costs.
  - Background processes rely on client-side queues and scheduled heartbeat triggers rather than long-lived in-memory background worker daemons.
- **Decommissioned GCP Infrastructure**:
  - Fully decommissioned Google Cloud Run (`pcc-backend`) services and Google Container Registry (`gcr.io`) image repositories.
  - Removed container build dependencies and GCP deployment scripts.

### 2. Neon PostgreSQL Pool Recycling & Database Engine
- **Supported Engines**: **Neon Serverless PostgreSQL** for production cloud persistence and **SQLite 3** for offline local development.
- **Connection URI Normalization & SSL Enforcement (`backend/app/core/database.py`)**:
  - Automatically converts `postgres://` URI schemes to `postgresql://`.
  - Automatically appends `sslmode=require` if `sslmode` parameter is missing for PostgreSQL URIs.
- **SQLAlchemy 2.0 Pool Recycling & NullPool Strategy**:
  - Under Vercel serverless execution (`VERCEL` env var set), utilizes `NullPool` allocation to prevent database connection pool exhaustion across lambda instances.
  - On stateful servers, `pool_recycle = 300` recycles pooled database connections every 300 seconds (5 minutes) to prevent stale connections when Neon compute endpoints suspend.
  - `pool_pre_ping = True`: Emits a lightweight `SELECT 1` ping before executing queries, verifying connection health and auto-reconnecting if Neon suspended compute.
  ```python
  db_url = settings.DATABASE_URL
  if db_url.startswith("postgres://"):
      db_url = db_url.replace("postgres://", "postgresql://", 1)

  connect_args = {}
  if db_url.startswith("sqlite"):
      connect_args["check_same_thread"] = False
      connect_args["timeout"] = 30
  elif "sslmode" not in db_url and "postgresql" in db_url:
      if "?" in db_url:
          db_url += "&sslmode=require"
      else:
          db_url += "?sslmode=require"

  engine_kwargs = {
      "echo": settings.DEBUG,
      "connect_args": connect_args,
      "pool_pre_ping": True,
  }

  if not db_url.startswith("sqlite"):
      if os.getenv("VERCEL"):
          engine_kwargs["poolclass"] = NullPool
      else:
          engine_kwargs["pool_recycle"] = 300
          engine_kwargs["pool_size"] = 5
          engine_kwargs["max_overflow"] = 10

  engine = create_engine(db_url, **engine_kwargs)
  ```

### 3. CORS Allowed Origins & Multi-Client Security
- **Configuration Module (`backend/app/core/config.py`)**:
  - `CORS_ORIGINS` environment variable string parsed via `@property def cors_origins_list` into a list of authorized origin strings.
  - Standardized default allowed origins:
    - Web Local Dev: `http://localhost:5173`, `http://localhost`
    - Vercel Production Host: `https://pcc-backend-ten.vercel.app`
    - Capacitor Android Mobile WebView: `capacitor://localhost`, `https://localhost`
    - Tauri Desktop Native App WebView: `tauri://localhost`, `http://tauri.localhost`, `https://tauri.localhost`
- **Frontend API Base URL Resolution (`frontend/src/services/api.ts`)**:
  - Resolution order: `localStorage.getItem('pcc_server_url')` -> `import.meta.env.VITE_API_URL` -> default `https://pcc-backend-ten.vercel.app`.
  - Enables instant server URL switching from Settings without rebuilding frontend artifacts.

---

## Release v1.1.0-beta - Cross-Platform Native Packaging & 24/7 Containerization

### 1. Database Migration & Neon PostgreSQL Cloud Support
- **Engine**: Fully compatible with both **Neon Serverless PostgreSQL** for production and **SQLite 3** for local offline development.
- **Connection String Schema**:
  - **Neon PostgreSQL**: `DATABASE_URL=postgresql://<user>:<password>@<ep-id>.<region>.aws.neon.tech/<dbname>?sslmode=require`
  - **Local SQLite Fallback**: `DATABASE_URL=sqlite:///./pcc.db` or `sqlite:///./data/pcc.db`
- **Database Migration Execution**:
  ```bash
  cd backend
  alembic upgrade head
  ```

### 2. Environment Variables & System Configuration (`.env.example` Reference)

| Variable | Description | Default / Example Value | Target Scope |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL or SQLite connection URI | `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require` | Backend |
| `SECRET_KEY` | JWT signing secret key (32+ chars) | `change-me-in-production-super-secret-key-32-chars-min` | Backend |
| `ALGORITHM` | JWT signature algorithm | `HS256` | Backend |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Authentication token validity duration (minutes) | `30` | Backend |
| `CORS_ORIGINS` | Comma-separated allowed HTTP/app origins | `http://localhost:5173,capacitor://localhost,tauri://localhost,http://localhost` | Backend |
| `WEATHER_API_KEY` | OpenWeatherMap API key fallback | `29b21b5a2f9aca2282088c7c61c30ea2` | Backend |
| `ENVIRONMENT` | Application deployment environment | `production` / `development` | Backend |
| `DEBUG` | Verbose debug log & SQL echo flag | `false` (prod) / `true` (dev) | Backend |
| `PORT` | Container HTTP binding port | `7860` (HuggingFace) / `8000` (Local/Docker) | Backend |
| `VITE_API_URL` | Frontend REST API endpoint URL | `http://localhost:8000` / `https://pcc-backend-ten.vercel.app` | Frontend |

---

## Release v1.1.0-beta - Enterprise Integrations & Credential Masking

### 1. Database Schema & Provider Enum Migration
- **Alembic Revision ID**: `b71239c8e412` (`add_new_integration_providers`).
- **Extended Enum Values in `IntegrationProvider` (`backend/app/models/integration.py`)**:
  - `TEAMS_CALENDAR` (`"teams_calendar"`)
  - `SLACK` (`"slack"`)
  - `GITLAB` (`"gitlab"`)
  - `JIRA` (`"jira"`)

### 2. Automatic Sensitive Credential Masking
- **Security Implementation**: `_mask_sensitive_config()` in `backend/app/services/integration_service.py`.
- **Masking Protocol**: Sensitive keys (`token`, `user_token`, `bot_token`, `api_token`, `access_token`, `api_key`, `secret`, `password`) are automatically redacted in API responses and status endpoints into prefix-preserved strings (`ghp_****`, `xoxb-****`, `glpat-****`, `msteams_****`, `jira_****`).

### 3. Client-Side Storage & LocalStorage Migration (`pcc_integrations_store_v2`)
- **Storage Key**: `pcc_integrations_store_v2`.
- **Automatic Hydration & Preset Merging**: Merges server integration states into preset service descriptors.

---

## Release v1.1.0-beta - Keep-Style Notes Application Refactor

### 1. Simplified Note Data Schema & Deprecations
- **Removed Attributes in Note Model**:
  - `category` / `categories` — Removed. Note categorization simplified; notes no longer store or require category tags.
  - `archived` — Deprecated. Note status workflow is simplified strictly to `active`, `pinned`, and `trashed`.
- **Active Attributes in Note Model**:
  - `type?: 'text' | 'checklist'` — Standard text note or checklist rows. Default: `'text'`.
  - `checklistItems?: NoteChecklistItem[]` — Array of checklist items (`{ id: string, text: string, completed: boolean }`).
  - `color?: string` — Color theme key (`default`, `lavender`, `emerald`, `amber`, `rose`, `sky`).
  - `pinned?: boolean` — Pinned note flag.
  - `trashed?: boolean` — Trash state flag.

### 2. Client-Side Storage & LocalStorage Migration
- **Storage Key**: `pcc_notes_store_v1`.
- **Automatic Hydration Migration**: Legacy notes normalized automatically upon startup without data loss.

---

## Release v1.1.0-beta - Core Platform Services & Storage Pathways

### 1. Active Domain LocalStorage Keys

| Domain | Storage Key | Format | Migration Fallback |
| :--- | :--- | :--- | :--- |
| **Alarms** | `pcc_alarms_store_v1` | JSON Array | `pcc_alarms` (Legacy) |
| **Snoozed Alarms** | `pcc_snoozed_alarms_v1` | JSON Array | Auto-purging expired entries |
| **Mutation Sync Queue** | `pcc_sync_queue` | JSON Array | Background auto-flush |
| **Tasks** | `pcc_tasks` | JSON Array | Direct hydration |
| **Projects** | `pcc_projects` | JSON Array | Direct hydration |
| **Notes** | `pcc_notes_store_v1` | JSON Array | `pcc_notes` (Legacy) |
| **Ideas** | `pcc_ideas` | JSON Array | Direct hydration |
| **Reminders** | `pcc_reminders` | JSON Array | Direct hydration |
| **Calendar** | `pcc_calendar_events` | JSON Array | Direct hydration |
| **Integrations** | `pcc_integrations_store_v2` | JSON Array | Preset merging fallback |
| **User Profile** | `pcc_user_profile` / `pcc_user_data` | JSON Object | Single-tenant default owner |

---

## Cross-Platform Build Pipelines & Verification Steps

### 1. Backend Verification
```bash
cd backend
python -m pytest
```

### 2. Frontend Compilation & Typecheck
```bash
cd frontend
npx tsc --noEmit
npm run build
```

### 3. Capacitor v6 Android Application Build
```bash
cd frontend
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
```
Output: `frontend/android/app/build/outputs/apk/debug/app-debug.apk`

### 4. Tauri v2 Desktop Packaging
```bash
cd frontend
npm run tauri build
```
Output: `frontend/src-tauri/target/release/bundle/`
