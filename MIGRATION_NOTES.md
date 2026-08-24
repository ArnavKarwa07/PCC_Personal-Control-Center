# PCC Migration Notes & Upgrade Guide - Official Release v1.0.0

This document aggregates release migration notes, database schema upgrades, storage key transitions, deployment host environment configurations, and cross-platform setup guidelines for **Personal Control Center (PCC)** under official release tag **`v1.0.0`**.

---

# PCC Migration Notes - Release v1.0.0 (Official Production Release)

## Release Overview
Official Release `v1.0.0` completes the production deployment of PCC. It provisions the active single-tenant Neon PostgreSQL instance (`holy-cell-73614246`) on AWS Singapore (`aws-ap-southeast-1`), executes full Alembic migrations creating all 28 entity tables, verifies client-backend sync across web, mobile, and desktop, and adds desktop launcher toolchain validation.

## Active Database Connection Parameters
- **Active Neon Instance**: `holy-cell-73614246` (`ep-odd-bonus-azdke95p-pooler.c-3.ap-southeast-1.aws.neon.tech`)
- **Connection URI**:
  `DATABASE_URL=postgresql://neondb_owner:npg_6rlNEeCa1XBy@ep-odd-bonus-azdke95p-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require`
- **Alembic Migration Command**:
  ```bash
  cd backend
  python -m alembic upgrade head
  ```

---

## Key Changes & Architectural Specifications (v1.0.0)

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
  - Automatically converts `postgres://` or `postgresql://` URIs to standard `postgresql://`.
  - Appends `sslmode=require` query parameters if missing when connecting to Neon cloud hosts.
- **Serverless `NullPool` Allocation**:
  - Detects Vercel execution environment via `VERCEL` environment variable.
  - Uses `sqlalchemy.pool.NullPool` under Vercel serverless lambda execution to prevent DB connection pool exhaustion.
  - Utilizes `QueuePool` with 5-minute pool recycling (`pool_recycle=300`) and pre-ping verification (`pool_pre_ping=True`) for stateful servers.

### 3. Offline-First Sync & Mutation Queue
- **Client-Side Sync Queue (`frontend/src/services/syncQueue.ts`)**:
  - Leverages browser `localStorage` under key `pcc_sync_queue`.
  - Manages optimistic UI updates for 9 core domain entities: `tasks`, `notes`, `projects`, `ideas`, `calendar`, `reminders`, `alarms`, `goals`, `contacts`.
  - Merges duplicate update mutations and discards invalid create/delete sequences before network execution.
- **Auto-Sync Trigger Mechanisms (`frontend/src/hooks/useAutoSync.ts`)**:
  - Triggers automatic queue flushing on `window.addEventListener('online')` network reconnection.
  - Periodically flushes pending items on background window focus and heartbeat intervals.

### 4. Desktop System Tray & Window Persistence (Tauri v2)
- **Rust System Tray Implementation (`frontend/src-tauri/src/lib.rs`)**:
  - Configures native system tray menu with "Show PCC" and "Quit" options.
  - Intercepts window close events (`tauri::WindowEvent::CloseRequested`) to hide main window (`window.hide()`) and prevent app termination (`api.prevent_close()`), keeping alarms running continuously in background.

### 5. Android Capacitor 6 Alarm & Notification Channels
- **High-Importance Channel Setup (`frontend/src/services/alarmScheduler.ts`)**:
  - Configures dedicated notification channel `pcc_alarms_channel` with MAX importance (level 5), public lockscreen visibility (level 1), custom vibration, and bundled `alarm.wav` sound asset.
  - Uses `allowWhileIdle: true` on `@capacitor/local-notifications` to trigger scheduled alarms even when device enters Android Doze mode.

### 6. Automated GitHub Actions Release Workflow
- **Pipeline Setup (`.github/workflows/build-release.yml`)**:
  - Triggers automatically on tag pushes matching `v*` (e.g., `v1.0.0`).
  - Dynamically updates version string `1.0.0` in `package.json`, `tauri.conf.json`, `Cargo.toml`, and `build.gradle` before compiling.
  - Produces Android APK (`PCC_v1.0.0.apk`) and desktop installers (`.exe`, `.dmg`, `.AppImage`, `.deb`) published directly to GitHub Releases.
