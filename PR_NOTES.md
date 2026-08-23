# PCC Consolidated Release Pull Request Notes (Release v1.2.0)

## Target Branch
`origin/staging` (Merge preparation for production `main` release tag `v1.2.0`).

## PR Title
`release(v1.2.0): Single-tenant database schema revamp, Singapore Neon DB migration, Tauri v2 capability fixes, sequential mobile permissions, and dashboard count synchronization`

---

## Executive Summary

This pull request packages the **PCC v1.2.0** production release:

1. **Single-Tenant Database Schema Revamp**: Removed the `users` table and dropped `user_id` foreign key columns across all SQLAlchemy ORM models, Pydantic schemas, API route handlers, worker daemons, and unit tests. Eliminates Vercel serverless `get_current_user` dependency overhead.
2. **Singapore Neon PostgreSQL Migration**: Deployed and configured brand-new Neon serverless PostgreSQL 18.6 instance on Asia Pacific 1 (Singapore `aws-ap-southeast-1`). Applied clean initial single-tenant Alembic migration `105cb739b3f8_initial_single_tenant_schema`.
3. **Tauri v2 Desktop Capability Fix**: Declared `"notification:default"`, `"notification:allow-notify"`, and `"autostart:default"` in `frontend/src-tauri/capabilities/default.json`, eliminating desktop startup crashes.
4. **Sequential Mobile Permissions**: Refactored `permissionService.ts` to request notification and location permissions sequentially, resolving dropped native permission dialogs on mobile.
5. **Dashboard Count Synchronization**: Fixed camelCase normalized property mapping in `DashboardPage` (`index.tsx`), ensuring open task counts update instantly upon task creation.
6. **Empirical Verification**: 100% passing pytest suite (79/79 tests), zero TypeScript compiler errors (`npx tsc --noEmit`), and clean Vite production build.

---

# PCC Consolidated Release Pull Request Notes (Release v1.1.0-beta)

1. **Vercel Serverless & Neon PostgreSQL Architecture**: Serverless Python entrypoint (`api/index.py` & `@vercel/python`), `NullPool` serverless lambda handling, Neon PostgreSQL connection pool recycling (`pool_recycle=300`), explicit SSL enforcement (`sslmode=require`), and complete decommissioning of legacy GCP Cloud Run infrastructure.
2. **Offline-First Resilience**: Persistent client-side mutation queue (`pcc_sync_queue`) with automatic deduplication, batch merging, exponential backoff, and reconnection auto-flush.
3. **Desktop System Tray & Background Alarm Persistence**: Tauri v2 system tray menu ("Show PCC" / "Quit") with close-to-tray window management (`window.hide()`) ensuring continuous alarm monitoring.
4. **Native Android Alarm Channels & Custom Audio**: Capacitor 6 high-importance alarm notification channels with bundled `alarm.wav` audio asset and low-power OS doze-mode wakeup support (`allowWhileIdle: true`).
5. **Proactive Startup Permission Handshake**: Non-intrusive onboarding banner requesting notifications, exact alarms, and location telemetry across web and native platforms.
6. **AI Executive Assistant Service**: Google Gemini 2.0 Flash (`gemini-2.0-flash`) integration with natural language intent detection (`CREATE_TASK`, `CREATE_NOTE`) and executive morning briefing generation (`/assistant/get_daily_briefing`).
7. **Single-Tenant Owner Architecture**: Zero-friction single-tenant mode for Arnav Karwa (`arnavkarwa07@gmail.com` / `00000000-0000-0000-0000-000000000001`), removing multi-user login gates while retaining DB-level isolation.
8. **Enterprise Third-Party Integrations Expansion & Security**: Microsoft Teams Calendar, Slack, GitLab, and Jira connectors with automatic sensitive credential masking (`ghp_****`, `xoxb-****`, `glpat-****`) and accessible UI grid.
9. **Google Keep-Style Notes Application Refactor**: Knowledge capture workspace with semantic `<h1>Notes</h1>` top page header, 100% monochromatic vector SVG icons, interactive checklists, custom color palettes, grid/list view toggles, quick creation input bar, and debounced markdown editor.
10. **Automated Cross-Platform Release Pipeline**: GitHub Actions release workflow (`.github/workflows/build-release.yml`) dynamically syncing version tags (`v1.1.0-beta`) across all platform manifests (`package.json`, `tauri.conf.json`, `Cargo.toml`, `build.gradle`).

---

## Comprehensive Change Inventory (v1.1.0-beta)

### 1. Vercel Serverless Function Routing & Database Resilience (v1.1.0-beta)
- **Files Modified**: `api/index.py`, `vercel.json`, `backend/app/core/database.py`, `backend/app/core/config.py`, `frontend/src/services/api.ts`
- **Detailed Summary**:
  - Entrypoint `api/index.py` dynamically injects repository root and `backend/` into `sys.path` and exposes FastAPI `app` for `@vercel/python`.
  - Configured root `vercel.json` routing wildcard `/(.*)` to `api/index.py`.
  - Automatically normalizes database URIs (`postgres://` -> `postgresql://`) and enforces `sslmode=require`.
  - Implements SQLAlchemy 2.0 engine configuration with `NullPool` under Vercel serverless execution and 5-minute pool recycling (`pool_recycle=300`) with pre-ping (`pool_pre_ping=True`) on stateful servers.
  - Standardized `DEFAULT_CLOUD_API_URL = 'https://pcc-backend-ten.vercel.app'` with fallback hierarchy and base URL sanitization.

### 2. Offline-First Mutation Queue & Background Auto-Sync (v1.1.0-beta)
- **Files Modified**: `frontend/src/services/syncQueue.ts`, `frontend/src/services/api.ts`, `frontend/src/hooks/useAutoSync.ts`
- **Detailed Summary**:
  - Implemented `SyncQueueService` utilizing `localStorage` key `pcc_sync_queue`.
  - Supports 9 primary domain entities: `tasks`, `notes`, `projects`, `ideas`, `calendar`, `reminders`, `alarms`, `goals`, `contacts`.
  - Smart deduplication logic: merges sequential `update` payloads, eliminates uncommitted `create` actions on `delete`, and handles dead-letter `404` errors cleanly.
  - Automatic queue flushing on window `online` events, app resume, and periodic background heartbeat.

### 3. Desktop System Tray & Native Alarms (Tauri v2) (v1.1.0-beta)
- **Files Modified**: `frontend/src-tauri/src/lib.rs`, `frontend/src-tauri/tauri.conf.json`, `frontend/src-tauri/Cargo.toml`, `frontend/src/services/alarmScheduler.ts`
- **Detailed Summary**:
  - Configured native system tray with `Show PCC` and `Quit` menu items in Rust.
  - Intercepts `tauri::WindowEvent::CloseRequested` to hide the window (`window.hide()`) and prevent app termination (`api.prevent_close()`), keeping alarms running continuously in the background.
  - Integrated `@tauri-apps/plugin-notification` and `@tauri-apps/plugin-autostart` for native notifications and boot-up persistence.

### 4. Capacitor 6 Native Notification Channels & Audio (Android) (v1.1.0-beta)
- **Files Modified**: `frontend/src/services/alarmScheduler.ts`, `frontend/android/app/src/main/res/raw/alarm.wav`, `frontend/android/app/build.gradle`
- **Detailed Summary**:
  - Created dedicated notification channel `pcc_alarms_channel` with MAX importance (level 5), public visibility (level 1), vibration, and custom sound `alarm.wav`.
  - Added physical audio asset `alarm.wav` to `frontend/android/app/src/main/res/raw/` for native Android playback.
  - Added `allowWhileIdle: true` to wake device from low-power OS Doze mode for high-priority alarms.
  - Implemented FNV-1a non-cryptographic hashing to generate unique 32-bit integer IDs with dedicated namespaces (`100000000+` alarms, `200000000+` reminders).

### 5. Proactive Startup Permission Handshake (v1.1.0-beta)
- **Files Modified**: `frontend/src/services/permissionService.ts`, `frontend/src/layouts/AppShell.tsx`, `frontend/src/features/settings/SettingsPage.tsx`
- **Detailed Summary**:
  - Added non-blocking startup banner in `AppShell.tsx` prompting users to grant notifications and location permissions on initial launch.
  - Standardized `permissionService` across Capacitor native, Tauri desktop, and web standards with a 3000ms race safety timeout for location permissions.

### 6. AI Executive Assistant & Gemini 2.0 Flash Integration (v1.1.0-beta)
- **Files Modified**: `frontend/src/components/AIAssistantWidget.tsx`, `backend/app/api/v1/assistant.py`, `backend/app/services/assistant_service.py`
- **Detailed Summary**:
  - Connected `/assistant/process_assistant_query` endpoint using `google.generativeai` with `gemini-2.0-flash`.
  - Natural language intent parsing: creates tasks (`CREATE_TASK`), notes (`CREATE_NOTE`), and synthesizes daily workspace briefings (`/assistant/get_daily_briefing`).

### 7. Single-Tenant Owner Architecture (v1.1.0-beta)
- **Files Modified**: `backend/app/core/dependencies.py`, `backend/app/api/v1/*`, `frontend/src/services/api.ts`, `frontend/src/routes/router.tsx`
- **Detailed Summary**:
  - Transitioned backend dependencies (`get_current_user`) to automatically resolve default owner Arnav Karwa (`00000000-0000-0000-0000-000000000001` / `arnavkarwa07@gmail.com`).
  - Purged legacy auth routes (`/auth/login`, `/auth/register`), authentication schemas, and client-side `authStore.ts`.

### 8. Enterprise Third-Party Integrations & Security (v1.1.0-beta)
- **Files Modified**: `backend/app/models/integration.py`, `backend/app/services/integration_service.py`, `backend/app/api/v1/integrations.py`, `frontend/src/features/settings/SettingsPage.tsx`
- **Detailed Summary**:
  - Added Teams Calendar, Slack, GitLab, and Jira connectors (`IntegrationProvider` enum extension in Alembic migration `b71239c8e412`).
  - Automatic sensitive credential masking preserving provider prefixes (`ghp_****`, `xoxb-****`, `glpat-****`).
  - Monochromatic SVG brand icons and accessible `aria-*` attributes on UI grid cards.

### 9. Google Keep-Style Notes Workspace Refactor (v1.1.0-beta)
- **Files Modified**: `frontend/src/features/notes/NotesWorkspace.tsx`, `frontend/src/stores/noteStore.ts`, `frontend/src/features/notes/Notes.css`
- **Detailed Summary**:
  - Semantic `<h1>Notes</h1>` top page header, 100% vector SVG icons (zero emojis), interactive checklist notes (`type: 'checklist'`), custom color palettes, gallery/list view mode toggles, and debounced auto-save markdown editor.

### 10. Automated Cross-Platform Release Pipeline (v1.1.0-beta)
- **Files Modified**: `.github/workflows/build-release.yml`
- **Detailed Summary**:
  - GitHub Actions release workflow triggering on `v1.1.0-beta` tag pushes.
  - Dynamically synchronizes release tag `v1.1.0-beta` across `package.json`, `tauri.conf.json`, `Cargo.toml`, and `build.gradle`.
  - Compiles and publishes signed release binaries (`PCC_v1.1.0-beta.apk`, `.exe`, `.dmg`, `.AppImage`, `.deb`) to GitHub Releases.

---

## Empirical Verification & Validation

### 1. Frontend TypeScript Compilation (`npx tsc --noEmit`)
```text
Exit Code: 0 (Zero TypeScript errors)
```

### 2. Frontend Production Build (`npm run build`)
```text
✓ 232 modules transformed.
✓ built in 7.29s
Exit Code: 0
```

### 3. Backend Test Suite Execution (`python -m pytest`)
```text
======================= 79 passed, 3 warnings in 11.31s =======================
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
