# Changelog

All notable changes to the PCC (Personal Control Center) project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v1.1.0-beta] - 2026-08-23

### Consolidated Release Highlights
This consolidated `v1.1.0-beta` release unifies all platform enhancements, Vercel Serverless & Neon PostgreSQL architecture migrations, offline-first sync capabilities, native cross-platform packaging, AI executive assistant capabilities, enterprise integrations, and security hardening into a single production-ready release tag.

### Added & Fixed
- **Vercel Serverless Architecture & Python Bridge (`api/index.py`)**:
  - Implemented root serverless wrapper (`api/index.py`) importing FastAPI `app` from `backend.app.main` with dynamic `sys.path` resolution for `@vercel/python`.
  - Fixed module resolution by isolating package structure from Hugging Face Gradio entrypoint (`backend/hf_app.py`).
  - Standardized modern `vercel.json` wildcard rewrites (`/(.*)` -> `/api/index.py`).
  - Completely decommissioned legacy Google Cloud Run (`pcc-backend`) and Google Container Registry (`gcr.io`) infrastructure.
- **Neon PostgreSQL Connection Resilience & NullPool Handling**:
  - Enforced `sslmode=require` TLS parameters for Neon serverless PostgreSQL connection URIs.
  - Implemented `NullPool` allocation under Vercel serverless lambda execution to prevent DB connection pool exhaustion, alongside 5-minute pool recycling (`pool_recycle=300`) and pre-ping verification (`pool_pre_ping=True`) for stateful servers.
  - Added explicit transaction rollback handling on exceptions in `get_db()` dependency.
- **Frontend Cloud API Base URL & Error Envelope Extraction**:
  - Updated `DEFAULT_CLOUD_API_URL` to point to production serverless backend (`https://pcc-backend-ten.vercel.app`).
  - Added automatic base URL sanitization in `getApiBaseUrl()` to prevent `/api/v1` prefix double-stacking.
  - Enhanced error parsing in `ApiException` engine to unwrap FastAPI nested `{"error": {"code": ..., "message": ...}}` payloads.
  - Updated UI status indicators (`ColdStartSyncLoader.tsx`) to display `"Vercel Serverless (Neon Postgres)"`.
- **CI/CD Security & Release Pipeline Updates (`.github/workflows/deploy-vercel.yml`, `build-release.yml`)**:
  - Restricted production Vercel deploys to `main` branch pushes and manual dispatches.
  - Automated `pytest` and TypeScript build verification step prior to deployment.
  - Secured Vercel deployment credentials via GitHub Actions environment secrets (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`).
  - Automated version tag extraction (`v1.1.0-beta` -> `1.1.0-beta`) across `package.json`, `tauri.conf.json`, `Cargo.toml`, and `build.gradle` (`versionCode` & `versionName`).
  - Produces and publishes signed cross-platform release artifacts to GitHub Releases: Android APK (`PCC_v1.1.0-beta.apk`) and desktop binaries (`.exe` NSIS installer, `.dmg`, `.AppImage`, `.deb`).
- **Offline-First Mutation Queue & Background Auto-Sync**:
  - Client-side persistent mutation queue service (`frontend/src/services/syncQueue.ts`) backed by `localStorage` (`pcc_sync_queue`).
  - Supports non-blocking optimistic UI mutations for 9 core domain entities (`tasks`, `notes`, `projects`, `ideas`, `calendar`, `reminders`, `alarms`, `goals`, `contacts`) across `create`, `update`, and `delete` actions.
  - Intelligent mutation deduplication, batch merging, auto-flush on reconnection (`online` event), app visibility changes, or periodic sync triggers with exponential backoff and dead-letter pruning.
- **Native Desktop Alarm Scheduling & System Tray Integration (Tauri v2)**:
  - Configured Tauri v2 desktop runtime (`frontend/src-tauri/`) with native system tray menu integration featuring "Show PCC" and "Quit" options.
  - Close-to-tray background persistence (`tauri::WindowEvent::CloseRequested` with `window.hide()` and `api.prevent_close()`), ensuring continuous background alarm monitoring without terminal interruption.
  - Integrated `@tauri-apps/plugin-notification` and `@tauri-apps/plugin-autostart` for persistent desktop alerts and automatic system startup.
  - Exact timeout scheduling for alarms and reminders within Tauri runtime (`alarmScheduler.ts`).
- **Capacitor 6 Native Notification Channels & Custom Audio Asset (Android)**:
  - Configured dedicated high-priority native notification channel (`pcc_alarms_channel`) with MAX importance (level 5), public lockscreen visibility, custom vibration patterns, and bundled `alarm.wav` audio asset (`frontend/android/app/src/main/res/raw/alarm.wav`).
  - Low-power OS doze-mode wakeup support via `allowWhileIdle: true` on `@capacitor/local-notifications` to guarantee on-time wake-up alerts on mobile devices.
  - Deterministic numeric notification ID generation via FNV-1a hashing algorithm (`100000000+` namespace for alarms, `200000000+` for reminders).
- **Proactive Startup Permission Management Banner**:
  - Added proactive, non-intrusive startup permissions prompt (`AppShell.tsx`, `permissionService.ts`) to request notification access, background alarm execution, and Open-Meteo geolocation telemetry on initial launch.
  - Unified multi-platform permission queries handling Capacitor native Android, Tauri v2 desktop, and modern standard browser environments.
- **AI Executive Assistant Service & Gemini 2.0 Flash Integration**:
  - Overhauled the AI Executive Assistant floating widget (`AIAssistantWidget.tsx`), restoring direct endpoint routing to `/api/v1/assistant/process_assistant_query`.
  - Integrated Google Gemini 2.0 Flash (`gemini-2.0-flash` via `google.generativeai`) within `backend/app/services/assistant_service.py` for high-speed conversational querying, contextual workspace reasoning, and task/note auto-dispatch.
  - Added natural language intent detection (`CREATE_TASK`, `CREATE_NOTE`, `GENERAL_QUERY`) and automated executive morning briefing generation (`/assistant/get_daily_briefing`).
- **Enterprise Third-Party Integrations Expansion & Credential Masking**:
  - Integrated 4 new connectors: Microsoft Teams Calendar, Slack, GitLab, and Jira.
  - Implemented automatic sensitive credential masking (`token`, `api_token`, `secret`, `password`) in API responses into prefix-preserved masked strings (e.g. `ghp_****`, `xoxb-****`, `glpat-****`).
  - Expanded Settings workspace UI grid with 100% monochromatic vector SVG brand icons and accessible `aria-*` attributes.
- **Google Keep-Style Notes Application Refactor**:
  - Keep-style knowledge capture workspace (`NotesWorkspace.tsx`, `noteStore.ts`) with semantic `<h1>Notes</h1>` top page header, 100% monochromatic vector SVG icons, interactive checklists, custom color palettes, grid/list view toggles, quick creation input bar, and split-view markdown editor modal.

### Changed & Single-Tenant Refactoring
- **Transition to Single-Tenant Owner Architecture**:
  - Streamlined backend REST architecture into a zero-friction single-tenant mode for Arnav Karwa (`arnavkarwa07@gmail.com` / `00000000-0000-0000-0000-000000000001`), eliminating redundant multi-user login, register, and token management overhead.
  - Removed client-side `authStore.ts`, login/register modals, and authorization bearer header blockers across API calls (`frontend/src/services/api.ts`).
  - Retained database-level user isolation with automatic default owner provisioning in dependency injections (`backend/app/core/dependencies.py`).
- **Vercel Serverless Python Deployment & Complete GCP Removal**:
  - Migrated backend API serverless deployment to Vercel Serverless Python (`@vercel/python`) hosted at `https://pcc-backend-ten.vercel.app`.
  - Added root `vercel.json` routing configuration and `api/index.py` entrypoint delegating requests to FastAPI application instance (`backend/app/main.py`).
  - Completely decommissioned and removed Google Cloud Run (`pcc-backend`) infrastructure, transitioning to zero-overhead serverless execution on Vercel.

### Removed
- **Complete GCP Cloud Infrastructure Removal**:
  - Decommissioned legacy GCP Cloud Run (`pcc-backend`) service and Google Container Registry artifacts.
- **Financial & Fitness Modules Cleanup (Database Migration)**:
  - Created Alembic database migration `drop_deprecated_tables` (`backend/alembic/versions/drop_deprecated_tables.py`) to drop legacy `finances` table.
  - Purged obsolete auth endpoints (`backend/app/api/v1/auth.py`, `backend/app/api/v1/users.py`), auth schemas (`backend/app/schemas/auth.py`, `backend/app/schemas/user.py`), and test modules (`backend/tests/test_auth.py`).

### Compliance & Quality Assurance
- **Empirical Verification**:
  - `npx tsc --noEmit`: 0 TypeScript compiler errors.
  - `npm run build`: Vite production bundle generated successfully (0 errors).
  - `python -m pytest`: 79/79 backend unit tests passing (100% success rate).
