# Pull Request: PCC Vercel Serverless & Neon PostgreSQL Infrastructure Migration (v1.0.0)

## Target Branch
`origin/staging` (Merge preparation for production `main` release).

## PR Title
`release(v1.0.0): Vercel Serverless Python deployment, Neon PostgreSQL pool recycling, dynamic CORS origin handling, and API client cloud endpoint fallback`

---

## Executive Summary

This pull request establishes the core cloud infrastructure and database persistence layer for PCC (Personal Control Center), migrating backend operations to **Vercel Serverless Python** (`@vercel/python`) and enabling **Neon Serverless PostgreSQL** with SQLAlchemy 2.0 pool recycling and SSL connection management.

---

## Comprehensive Change Inventory

### 1. Vercel Serverless Function Routing (`api/index.py` & `vercel.json`)
- **Files Modified**: `api/index.py`, `vercel.json`
- **Detailed Summary**:
  - `api/index.py` serves as the entrypoint for Vercel Serverless Functions (`@vercel/python`).
  - Dynamically calculates relative paths to the repository root and `backend/` directory, inserting them into `sys.path` (`sys.path.insert(0, ...)`).
  - Imports the FastAPI ASGI application instance `app` from `backend.app.main` and exposes it via `__all__ = ["app"]`.
  - Enables Vercel Serverless Functions to execute FastAPI routes without changing internal package imports or breaking local Uvicorn development server execution.
  - Paired with root `vercel.json` configuration specifying builder `@vercel/python` and routing wildcard path `/(.*)` to `api/index.py`.

### 2. Neon PostgreSQL Pool Recycling & Engine Configuration (`backend/app/core/database.py`)
- **Files Modified**: `backend/app/core/database.py`
- **Detailed Summary**:
  - Automatically normalizes database URIs, converting legacy `postgres://` prefixes to `postgresql://`.
  - Automatically appends `sslmode=require` parameter to PostgreSQL connection URIs if omitted, enforcing TLS-encrypted connection security to Neon cloud endpoints.
  - Implements SQLAlchemy 2.0 engine configuration tuned for serverless PostgreSQL:
    - `pool_recycle = 300`: Recycles pooled connections every 5 minutes (300 seconds) to prevent stale connection handles when Neon serverless compute instances suspend after inactivity.
    - `pool_pre_ping = True`: Emits a lightweight `SELECT 1` ping before executing queries, verifying connection health and automatically reconnecting if needed.
    - `pool_size = 5`, `max_overflow = 10`: Standard connection capacity limits optimized for serverless function concurrency.
  - Dynamic `connect_args`: Configures SQLite-specific arguments (`check_same_thread=False`, `timeout=30`) and attaches event listeners for SQLite pragmas (`PRAGMA foreign_keys=ON`, `PRAGMA journal_mode=WAL`, `PRAGMA busy_timeout=30000`) while allowing native PostgreSQL connection pooling in production.

### 3. Frontend API Client & Fallback Cloud Endpoint (`frontend/src/services/api.ts`)
- **Files Modified**: `frontend/src/services/api.ts`
- **Detailed Summary**:
  - Defines `DEFAULT_CLOUD_API_URL = 'https://pcc-backend-ten.vercel.app'` as the default cloud API host.
  - Implements dynamic API base URL resolution (`getApiBaseUrl()`) with fallback hierarchy:
    1. Saved local storage server override (`localStorage.getItem('pcc_server_url')`).
    2. Build-time environment variable (`import.meta.env.VITE_API_URL`).
    3. Production fallback endpoint (`DEFAULT_CLOUD_API_URL`).
  - Implements `setApiBaseUrl(url)` for runtime server configuration.
  - Constructs REST request pipeline (`request<T>()`) appending `/api/v1` prefix, standardizing headers, parsing 204 No Content responses, converting HTTP errors to structured `ApiException` instances, and normalizing response envelopes (`normalizeApiResponse` and `normalizeItem` for snake_case to camelCase mapping).
  - Exports typed API modules (`projectsApi`, `tasksApi`, `notesApi`, `ideasApi`, `calendarApi`, `remindersApi`, `alarmsApi`, `timersApi`, `notificationsApi`, `integrationsApi`, `weatherApi`, `searchApi`, `goalsApi`, `assistantApi`, `contactsApi`, `boardsApi`).

### 4. Application Configuration & Dynamic CORS Origins (`backend/app/core/config.py`)
- **Files Modified**: `backend/app/core/config.py`
- **Detailed Summary**:
  - Utilizes Pydantic Settings (`BaseSettings` & `SettingsConfigDict`) to load environment variables from `.env` and `../.env` with UTF-8 encoding.
  - Defines default `DATABASE_URL` (`sqlite:///./pcc.db`).
  - Defines `CORS_ORIGINS` string containing authorized cross-origin URLs: `http://localhost:5173`, `https://pcc-backend-ten.vercel.app`, `capacitor://localhost`, `https://localhost`, `http://tauri.localhost`, `https://tauri.localhost`, `tauri://localhost`, `http://localhost`.
  - Provides computed property `@property def cors_origins_list(self) -> List[str]` parsing the comma-separated string into a clean list of authorized origin strings passed to FastAPI's `CORSMiddleware`.

---

# Pull Request: PCC Cross-Platform System Hardening, Native Alarms & AI Dispatcher (v1.0.1beta)

## Target Branch
`origin/staging` (Merge preparation for production `main` release).

## PR Title
`release(v1.0.1beta): Offline mutation sync queue, Tauri v2 system tray, Android Capacitor 6 alarm channels, AI Assistant Gemini 2.0 Flash integration, single-tenant owner mode, and automated release pipeline`

---

## Executive Summary

This release packages the **PCC v1.0.1beta** milestone, delivering critical resilience, cross-platform background capabilities, and architectural simplification across web, mobile, and desktop runtimes:

1. **Offline-First Resilience**: Persistent client-side mutation queue with automatic deduplication, batch merging, and reconnection auto-flush.
2. **Desktop Background Persistence**: Tauri v2 system tray menu ("Show PCC" / "Quit") with close-to-tray window management and persistent desktop alarm timers.
3. **Native Android Alarm Channels**: Capacitor 6 high-importance alarm notification channels with bundled `alarm.wav` audio asset and doze-mode wakeup support (`allowWhileIdle: true`).
4. **Proactive Permission Handshake**: Startup onboarding banner requesting notifications, exact alarms, and location telemetry across web and native platforms.
5. **AI Executive Assistant Integration**: Natural language task/note creation and general workspace queries powered by Google Gemini 2.0 Flash (`gemini-2.0-flash`).
6. **Single-Tenant Owner Architecture**: Eliminated multi-user auth overhead and login gates in favor of direct owner access for Arnav Karwa (`arnavkarwa07@gmail.com`).
7. **Deprecated Table Schema Cleanup**: Alembic migration `drop_deprecated_tables` purging deprecated financial and fitness schema tables.
8. **Automated Cross-Platform Release Pipeline**: GitHub Actions workflow dynamically extracting version tags (`v1.0.1beta`) and synchronizing all platform manifests.

---

## Comprehensive Change Inventory

### 1. Offline-First Mutation Queue & Auto-Sync
- **Files**: `frontend/src/services/syncQueue.ts`, `frontend/src/services/api.ts`, `frontend/src/hooks/useAutoSync.ts`
- **Details**:
  - Implemented `SyncQueueService` utilizing `localStorage` key `pcc_sync_queue`.
  - Supports 9 primary domain entities: `task`, `note`, `project`, `idea`, `calendar`, `reminder`, `alarm`, `goal`, `contact`.
  - Smart deduplication logic: merges sequential `update` payloads, eliminates uncommitted `create` actions on `delete`, and handles dead-letter `404` errors cleanly.
  - Automatic queue flushing on window `online` events, app resume, and periodic background heartbeat.
  - Fires `syncQueueChanged` custom DOM events to keep UI sync indicators up to date.

### 2. Desktop System Tray & Native Alarms (Tauri v2)
- **Files**: `frontend/src-tauri/src/lib.rs`, `frontend/src-tauri/tauri.conf.json`, `frontend/src-tauri/Cargo.toml`, `frontend/src/services/alarmScheduler.ts`
- **Details**:
  - Configured native system tray with `Show PCC` and `Quit` menu items in Rust.
  - Intercepts `tauri::WindowEvent::CloseRequested` to hide the window (`window.hide()`) and prevent app termination (`api.prevent_close()`), keeping alarms running continuously in the background.
  - Integrated `@tauri-apps/plugin-notification` and `@tauri-apps/plugin-autostart` for native notifications and boot-up persistence.
  - Direct timer management (`activeTauriTimers`) to fire desktop notifications at exact alarm and reminder timestamps.

### 3. Capacitor 6 Native Notification Channels & Audio (Android)
- **Files**: `frontend/src/services/alarmScheduler.ts`, `frontend/android/app/src/main/res/raw/alarm.wav`, `frontend/android/app/build.gradle`
- **Details**:
  - Created dedicated notification channel `pcc_alarms_channel` with MAX importance (level 5), public visibility (level 1), vibration, and custom sound `alarm.wav`.
  - Added physical audio asset `alarm.wav` to `frontend/android/app/src/main/res/raw/` for native Android playback.
  - Added `allowWhileIdle: true` to wake device from low-power OS Doze mode for high-priority alarms.
  - Implemented FNV-1a non-cryptographic hashing to generate unique 32-bit integer IDs with dedicated namespaces (`100000000+` alarms, `200000000+` reminders).

### 4. Proactive Startup Permission Prompts
- **Files**: `frontend/src/services/permissionService.ts`, `frontend/src/layouts/AppShell.tsx`, `frontend/src/features/settings/SettingsPage.tsx`
- **Details**:
  - Added a non-blocking startup banner in `AppShell.tsx` prompting users to grant notifications and location permissions on initial launch.
  - Standardized `permissionService` across Capacitor native, Tauri desktop, and web standards with a 3000ms race safety timeout for location permissions.
  - Added explicit permission status indicators and interactive request buttons in Settings.

### 5. AI Executive Assistant & Gemini 2.0 Flash Integration
- **Files**: `frontend/src/components/AIAssistantWidget.tsx`, `backend/app/api/v1/assistant.py`, `backend/app/services/assistant_service.py`
- **Details**:
  - Restored `/assistant/process_assistant_query` endpoint routing in `assistantApi.query()`.
  - Connected `google.generativeai` utilizing `gemini-2.0-flash` with graceful fallback handling.
  - Natural language intent parsing: creates tasks (`CREATE_TASK`), notes (`CREATE_NOTE`), and synthesizes daily workspace briefings (`/assistant/get_daily_briefing`).
  - Added responsive chat panel with typing animations, message history auto-scrolling, and floating bubble trigger.

### 6. Single-Tenant Owner Architecture
- **Files**: `backend/app/core/dependencies.py`, `backend/app/api/v1/*`, `frontend/src/services/api.ts`, `frontend/src/routes/router.tsx`
- **Details**:
  - Transitioned backend dependencies (`get_current_user`) to automatically resolve default owner Arnav Karwa (`00000000-0000-0000-0000-000000000001` / `arnavkarwa07@gmail.com`).
  - Removed obsolete auth routes (`/auth/login`, `/auth/register`), authentication schemas, and client-side `authStore.ts`.
  - Removed login gates, login redirects, and authorization headers from frontend API clients.

### 7. Deprecated Modules & Table Cleanup
- **Files**: `backend/alembic/versions/drop_deprecated_tables.py`
- **Details**:
  - Added Alembic migration `drop_deprecated_tables` (down-revision `b71239c8e412`) to drop legacy `finances` table.
  - Purged obsolete auth test files (`test_auth.py`).

### 8. Automated Cross-Platform Release Pipeline
- **Files**: `.github/workflows/build-release.yml`
- **Details**:
  - Automated release workflow triggered on `v*` tags.
  - Dynamically extracts semantic version numbers (`v1.0.1beta` -> `1.0.1`) and updates `package.json`, `tauri.conf.json`, `Cargo.toml`, and `build.gradle` (`versionCode` & `versionName`).
  - Builds and publishes signed release assets: `PCC_v1.0.1beta.apk`, Windows NSIS `.exe`, macOS `.dmg`, Linux `.AppImage` / `.deb`.

---

## Empirical Verification & Validation

### 1. Frontend TypeScript Compilation (`npx tsc --noEmit`)
```text
C:\Users\user\OneDrive\Desktop\CODE\PCC_Personal-Control-Center\frontend> npx tsc --noEmit
Exit Code: 0 (Zero TypeScript errors)
```

### 2. Frontend Production Build (`npm run build`)
```text
C:\Users\user\OneDrive\Desktop\CODE\PCC_Personal-Control-Center\frontend> npm run build

> pcc-frontend@1.0.1-beta build
> tsc && vite build

vite v5.4.21 building for production...
transforming...
✓ 232 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                               1.07 kB │ gzip:   0.53 kB
dist/assets/ProjectDetailPage-BctFSHR2.css    3.28 kB │ gzip:   0.83 kB
dist/assets/index-CHHoAeRe.css                4.57 kB │ gzip:   1.15 kB
dist/assets/index-DFcCPTlj.css                4.74 kB │ gzip:   1.09 kB
dist/assets/index-Fb8l8K7e.css                4.75 kB │ gzip:   1.04 kB
dist/assets/ContactsPage-CDH_qNyu.css         4.87 kB │ gzip:   1.26 kB
dist/assets/index-Dv3GPGtg.css                5.54 kB │ gzip:   1.34 kB
dist/assets/index-eZa6wLWJ.css                7.17 kB │ gzip:   1.50 kB
dist/assets/KanbanBoard-DlJkzYWJ.css          7.40 kB │ gzip:   1.60 kB
dist/assets/TaskDetailPage-eJ9pxDnZ.css       8.30 kB │ gzip:   1.70 kB
dist/assets/index-DTPGCmv8.css                9.31 kB │ gzip:   1.79 kB
dist/assets/index-CqeGLE2a.css                9.49 kB │ gzip:   2.19 kB
dist/assets/index-BYYJusCb.css                9.84 kB │ gzip:   2.02 kB
dist/assets/index-Ds5n9Hhd.css               10.09 kB │ gzip:   1.91 kB
dist/assets/index-DhiKvh66.css               11.96 kB │ gzip:   2.09 kB
dist/assets/index-E9tO6iIE.css               13.13 kB │ gzip:   2.46 kB
dist/assets/index-v0XBywJQ.css               15.92 kB │ gzip:   3.14 kB
dist/assets/index-CgMFm5KQ.css               69.06 kB │ gzip:  11.37 kB
dist/assets/Card-B8e0uK5Z.js                  0.46 kB │ gzip:   0.27 kB
dist/assets/web-DDj8GhEq.js                   0.67 kB │ gzip:   0.33 kB
dist/assets/EmptyState-BdgGZOF0.js            0.91 kB │ gzip:   0.48 kB
dist/assets/web-BoGNTkAq.js                   0.92 kB │ gzip:   0.47 kB
dist/assets/Tabs-DNP4aJWI.js                  1.30 kB │ gzip:   0.65 kB
dist/assets/web-DqZ6nSqB.js                   3.44 kB │ gzip:   1.09 kB
dist/assets/index-DCgngTJG.js                 4.07 kB │ gzip:   1.48 kB
dist/assets/index-0Mg1PbJN.js                 5.72 kB │ gzip:   1.57 kB
dist/assets/index-CPPNR8eB.js                 5.84 kB │ gzip:   1.76 kB
dist/assets/ContactsPage-DSH2W2Gt.js          7.53 kB │ gzip:   2.73 kB
dist/assets/KanbanBoard-C8tImXEc.js           9.15 kB │ gzip:   2.90 kB
dist/assets/TaskDetailPage-Ck7IlZvu.js        9.23 kB │ gzip:   2.83 kB
dist/assets/index-BswJZBu2.js                10.41 kB │ gzip:   3.50 kB
dist/assets/ProjectDetailPage-hBf0nC8W.js    13.20 kB │ gzip:   3.45 kB
dist/assets/index-HnNG0nIA.js                13.30 kB │ gzip:   3.81 kB
dist/assets/index-CGRKaOex.js                13.34 kB │ gzip:   3.54 kB
dist/assets/index-agYEvSG7.js                13.90 kB │ gzip:   3.96 kB
dist/assets/index-BmCzDiHG.js                13.96 kB │ gzip:   3.53 kB
dist/assets/index-RuryLjxo.js                16.51 kB │ gzip:   4.55 kB
dist/assets/index-Cjqhgdvr.js                18.11 kB │ gzip:   3.98 kB
dist/assets/index-Ck8cD1jl.js                22.41 kB │ gzip:   5.55 kB
dist/assets/index-1tjBSqhv.js                23.13 kB │ gzip:   5.06 kB
dist/assets/index-CC9OmtCf.js                28.09 kB │ gzip:   7.27 kB
dist/assets/index-DMJA2cmI.js                28.63 kB │ gzip:   8.26 kB
dist/assets/index-CJL5jdSV.js               371.72 kB │ gzip: 112.03 kB
✓ built in 7.29s
Exit Code: 0
```

### 3. Backend Test Suite Execution (`python -m pytest`)
```text
C:\Users\user\OneDrive\Desktop\CODE\PCC_Personal-Control-Center\backend> python -m pytest
============================= test session starts =============================
platform win32 -- Python 3.12.9, pytest-8.3.4, pluggy-1.5.0
rootdir: C:\Users\user\OneDrive\Desktop\CODE\PCC_Personal-Control-Center\backend
configfile: pytest.ini
testpaths: tests
collected 79 items

tests\test_assistant.py ....                                             [  5%]
tests\test_calendar.py ..                                                [  7%]
tests\test_contacts.py .                                                 [  8%]
tests\test_goals.py ....                                                 [ 13%]
tests\test_health.py ..                                                  [ 16%]
tests\test_integrations_new.py ...........                               [ 30%]
tests\test_integrations_weather.py .....                                 [ 36%]
tests\test_notes_ideas.py .......                                        [ 45%]
tests\test_projects.py ......                                            [ 53%]
tests\test_recurrence.py ...                                             [ 56%]
tests\test_reminders_alarms.py ..............                            [ 74%]
tests\test_search.py .......                                             [ 83%]
tests\test_tasks.py .........                                            [ 94%]
tests\test_worker.py ....                                                [100%]

======================= 79 passed, 3 warnings in 9.50s ========================
Exit Code: 0 (100% test pass rate)
```

---

## AGENTS.md Compliance Checklist

- [x] **Branching Rule**: Commits and code targeted strictly for `origin/staging` (manual merge to `main`).
- [x] **Zero TypeScript Errors**: Verified via `npx tsc --noEmit` (0 errors).
- [x] **Clean Production Build**: Verified via `npm run build` (232 modules bundled cleanly).
- [x] **Passing Pytest Suite**: 79/79 backend tests passing (100% success rate).
- [x] **Localization Standards**: Defaults set to India (IN), Pune weather telemetry, and ₹ (INR) currency.
- [x] **Aesthetics & Theme**: Light theme default (`html[data-theme='light']`) with dark glassmorphism toggle, 100% monochromatic vector SVG icons, unified `/logo.png`.
- [x] **Module Scope Integrity**: Only active approved modules maintained; deprecated tables and auth dependencies cleanly purged.
