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

# Pull Request: PCC Third-Party Integrations Expansion & Security Readiness (v1.4.0)

## Target Branch
`origin/staging` (Strict compliance with `AGENTS.md` guidelines - DO NOT merge directly to `main`).

## PR Title
`feat(integrations): Add Teams Calendar, Slack, GitLab, and Jira connectors with automatic credential masking, accessible UI grid, and JSON backup/restore framework`

---

## Summary of Changes

This pull request delivers the full enterprise third-party integration expansion for PCC, adding 4 new service connectors (**Microsoft Teams Calendar**, **Slack**, **GitLab**, and **Jira**), automatic sensitive credential masking for API keys/tokens, expanded Settings integration UI grid with custom brand SVG iconography and aria accessibility attributes, updated `pcc_data.json` backup/restore framework, Alembic database migration `b71239c8e412`, and background worker task synchronization.

### Detailed Feature Inventory

#### 1. Third-Party Integrations Expansion
- **Files Modified**: `backend/app/models/integration.py`, `backend/app/services/integration_service.py`, `backend/app/api/v1/integrations.py`, `frontend/src/types/index.ts`, `frontend/src/stores/integrationStore.ts`
- **Capabilities**:
  - **Microsoft Teams Calendar (`teams_calendar`)**: Supports 2-way event sync, tenant ID, client ID, calendar ID configuration, and OAuth access token handling.
  - **Slack Integration (`slack`)**: Supports user/bot tokens (`xoxb-`, `xoxp-`), default channel configuration, focus mode status sync, and daily digest delivery.
  - **GitLab Workspace Sync (`gitlab`)**: Supports personal access tokens (`glpat-`), custom GitLab instance URLs, project ID mapping, merge request updates, and pipeline status monitoring.
  - **Jira Sprint & Task Sync (`jira`)**: Supports Atlassian domain connection (`company.atlassian.net`), email authentication, API tokens (`jira_`), project key mapping, sprint issue imports, and Kanban status alignment.

#### 2. Automatic Sensitive Credential Masking
- **Files Modified**: `backend/app/services/integration_service.py`
- **Capabilities**:
  - Automatically redacts sensitive fields (`token`, `user_token`, `bot_token`, `api_token`, `access_token`, `api_key`, `secret`, `password`) in REST API outputs and diagnostic endpoints.
  - Preserves standard key prefixes for secure UI identification (`ghp_****`, `xoxb-****`, `glpat-****`, `msteams_****`, `jira_****`).

#### 3. Expanded Settings Integrations UI Grid & Accessibility
- **Files Modified**: `frontend/src/features/settings/SettingsPage.tsx`, `frontend/src/features/settings/Settings.css`
- **Capabilities**:
  - Integrated 100% monochromatic vector SVG brand icons for Microsoft Teams Calendar, Slack, GitLab, and Jira.
  - Added accessibility attributes (`aria-label`, `aria-expanded`, `aria-hidden`) across integration card action triggers and configuration modals.
  - Dynamic connection modals with specialized field input types (`password` vs `text`) tailored for tokens, URLs, tenant IDs, and channel routing.

#### 4. JSON Onboarding & Backup Restore Integration
- **Files Modified**: `frontend/src/services/jsonImportService.ts`, `docs/DATA_SCHEMA.md`
- **Capabilities**:
  - Updated `validateAndCleanImportData()` and `executeDataImport()` to parse, validate, and restore integration descriptors and configurations under `integrations: []`.
  - Full backup JSON export includes all active and preset integration states (`pcc_integrations_store_v2`).

#### 5. Database Migration & Background Worker Sync
- **Files Modified**: `backend/alembic/versions/add_new_integration_providers.py`, `backend/worker/main.py`
- **Capabilities**:
  - Created Alembic migration `b71239c8e412` expanding `IntegrationProvider` enum values.
  - Registered worker background sync functions (`sync_teams_calendar`, `sync_slack`, `sync_gitlab`, `sync_jira`) in `worker/main.py`.

---

## Empirical Verification Results

### 1. Frontend TypeScript Typecheck (`npx tsc --noEmit`)
```text
C:\Users\user\OneDrive\Desktop\CODE\PCC_Personal-Control-Center\frontend> npx tsc --noEmit
Exit Code: 0 (Zero TypeScript errors)
```

### 2. Frontend Production Build (`npm run build`)
```text
C:\Users\user\OneDrive\Desktop\CODE\PCC_Personal-Control-Center\frontend> npm run build

> pcc-frontend@1.0.0 build
> tsc && vite build

vite v5.4.21 building for production...
transforming...
✓ 216 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                               1.07 kB │ gzip:   0.53 kB
dist/assets/index-CZ-vMPGP.js               337.50 kB │ gzip: 101.89 kB
✓ built in 6.11s
Exit Code: 0
```

### 3. Backend Pytest Suite (`python -m pytest`)
```text
C:\Users\user\OneDrive\Desktop\CODE\PCC_Personal-Control-Center\backend> python -m pytest
============================= test session starts =============================
platform win32 -- Python 3.12.9, pytest-8.3.4, pluggy-1.5.0
rootdir: C:\Users\user\OneDrive\Desktop\CODE\PCC_Personal-Control-Center\backend
configfile: pytest.ini
testpaths: tests
collected 104 items

tests\test_assistant.py .....                                            [  4%]
tests\test_auth.py .............                                         [ 17%]
tests\test_calendar.py ...                                               [ 20%]
tests\test_contacts.py .                                                 [ 21%]
tests\test_goals.py .....                                                [ 25%]
tests\test_health.py ..                                                  [ 27%]
tests\test_integrations_new.py ...........                               [ 38%]
tests\test_integrations_weather.py ......                                [ 44%]
tests\test_notes_ideas.py .........                                      [ 52%]
tests\test_projects.py .......                                           [ 59%]
tests\test_recurrence.py ...                                             [ 62%]
tests\test_reminders_alarms.py ...............                           [ 76%]
tests\test_search.py ........                                            [ 84%]
tests\test_tasks.py ............                                         [ 96%]
tests\test_worker.py ....                                                [100%]

============================ 104 passed in 40.25s =============================
Exit Code: 0 (100% test pass rate)
```

---

## AGENTS.md Compliance Checklist
- [x] Code targeted strictly for `origin/staging` (never direct push or merge to `main`).
- [x] TypeScript compiler (`npx tsc --noEmit`): 0 errors.
- [x] Vite production build (`npm run build`): Clean build output (216 modules transformed).
- [x] Backend test suite (`python -m pytest`): 104/104 tests passing.
- [x] Default currency is ₹ (INR).
- [x] Default weather location is Pune, IN.
- [x] Light theme is default (`html[data-theme='light']`).
- [x] Single logo identity verified (`/logo.png`).

---

# Pull Request: PCC Keep-Style Notes Application & Release Readiness (v1.2.0)

## Target Branch
`origin/staging` (Strict compliance with `AGENTS.md` guidelines - DO NOT merge directly to `main`).


## PR Title
`feat(notes): Keep-style Notes page refactor with h1 header, 100% vector SVG icons, mobile select block consolidation, filter accuracy fixes, and interactive checklists`

---

## Summary of Changes

This release delivers the complete Google Keep-style Notes Application refactor within the PCC frontend, featuring streamlined navigation, vector iconography, complete emoji removal, mobile filter consolidation, state bug fixes, backed by full type checking, Vite production build, and backend test suite pass.

### Detailed Refactor & Feature Inventory

#### 1. Explicit Page Header (`<h1>Notes</h1>`)
- **Files Modified**: `NotesWorkspace.tsx`, `Notes.css`
- **Capabilities**:
  - Added semantic `<h1>Notes</h1>` top page header for consistent module branding and structure across the application.

#### 2. 100% Emoji Removal & Vector SVG Iconography
- **Files Modified**: `NotesWorkspace.tsx`, `Notes.css`
- **Capabilities**:
  - Replaced all visual emojis with clean, monochromatic SVG vector icons (`stroke="currentColor"` and `fill="currentColor"`) matching `AGENTS.md` design standards.
  - Covers pinned section icons, grid/list view toggles, search input icons, action buttons, quick note creation inputs, and trash banners.

#### 3. Complete Removal of Categories & Archive Features
- **Files Modified**: `NotesWorkspace.tsx`, `noteStore.ts`, `types/index.ts`
- **Capabilities**:
  - Purged obsolete category tag filters and archive state management to simplify the user workflow and streamline state operations.
  - Simplified active note state lifecycle strictly to `active`, `pinned`, and `trashed`.

#### 4. Mobile Filter Tab Consolidation (1 Dropdown Block)
- **Files Modified**: `NotesWorkspace.tsx`, `Notes.css`
- **Capabilities**:
  - Consolidated desktop filter tabs into a single responsive `<select id="notes-mobile-filter">` dropdown block for mobile viewports (< 768px).
  - Eliminates horizontal overflow and tab wrapping on mobile screens.

#### 5. Filter Accuracy Bug Fix
- **Files Modified**: `NotesWorkspace.tsx`, `noteStore.ts`
- **Capabilities**:
  - Resolved filter partitioning issue ensuring pinned notes and non-pinned notes are cleanly separated without item duplication or state leak during real-time text searches.

#### 6. Interactive Checklists & Keyboard Focus Control
- **Files Modified**: `NotesWorkspace.tsx`, `noteStore.ts`, `types/index.ts`
- **Capabilities**:
  - Support for multi-item checklist notes (`type: 'checklist'`).
  - Dynamic item creation, inline text editing, completion toggle with strikethrough styling, and deletion.
  - Keyboard shortcut navigation: press `Enter` to create and focus the next item, press `Backspace` on an empty row to delete and focus the previous item.
  - Checklist completion progress badges on note cards.

#### 7. Custom Color Palette & Theme Styling
- **Files Modified**: `NotesWorkspace.tsx`, `Notes.css`
- **Capabilities**:
  - 6 rich theme colors: `default` (#6366f1 indigo), `lavender` (#8b5cf6), `emerald` (#10b981), `amber` (#f59e0b), `rose` (#f43f5e), `sky` (#0ea5e9).
  - Dynamic background tints and accent borders across light (`html[data-theme='light']`) and dark glassmorphism modes.

#### 8. Gallery & Streamlined List Views
- **Files Modified**: `NotesWorkspace.tsx`, `Notes.css`
- **Capabilities**:
  - Dynamic view mode toggle between multi-column responsive grid view (`grid`) and single-column full-width list layout (`list`).
  - Real-time search bar filtering across titles, markdown content, and checklist items.

#### 9. Quick Note Creation Input Bar
- **Files Modified**: `NotesWorkspace.tsx`, `Notes.css`
- **Capabilities**:
  - Expandable top creation input bar on the main Notes page allowing users to capture quick thoughts or checklists instantly without opening a modal.

#### 10. Markdown Split-View & Auto-Save Editor Modal
- **Files Modified**: `NotesWorkspace.tsx`, `MarkdownPreview.tsx`
- **Capabilities**:
  - Fullscreen/modal editor supporting `edit`, `split`, and `preview` modes with live GitHub Flavored Markdown rendering.
  - Debounced auto-save engine preventing race conditions while typing.
  - Keyboard escape navigation and body scroll-locking when editing.

---

## Empirical Verification Results

### 1. Frontend TypeScript Typecheck (`npx tsc --noEmit`)
```text
C:\Users\user\OneDrive\Desktop\CODE\PCC_Personal-Control-Center\frontend> npx tsc --noEmit
Exit Code: 0 (Zero TypeScript errors)
```

### 2. Frontend Production Build (`npm run build`)
```text
C:\Users\user\OneDrive\Desktop\CODE\PCC_Personal-Control-Center\frontend> npm run build

> pcc-frontend@1.0.0 build
> tsc && vite build

vite v5.4.21 building for production...
transforming...
✓ 216 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                               1.07 kB │ gzip:   0.53 kB
dist/assets/ProjectDetailPage-BctFSHR2.css    3.28 kB │ gzip:   0.83 kB
...
dist/assets/index-4K0R1UQh.js               348.55 kB │ gzip: 106.26 kB
✓ built in 2.20s
Exit Code: 0
```

### 3. Backend Pytest Suite (`python -m pytest`)
```text
C:\Users\user\OneDrive\Desktop\CODE\PCC_Personal-Control-Center\backend> python -m pytest
============================= test session starts =============================
platform win32 -- Python 3.12.9, pytest-8.3.4, pluggy-1.5.0
rootdir: C:\Users\user\OneDrive\Desktop\CODE\PCC_Personal-Control-Center\backend
configfile: pytest.ini
testpaths: tests
collected 93 items

tests\test_assistant.py .....                                            [  5%]
tests\test_auth.py .............                                         [ 19%]
tests\test_calendar.py ...                                               [ 22%]
tests\test_contacts.py .                                                 [ 23%]
tests\test_goals.py .....                                                [ 29%]
tests\test_health.py ..                                                  [ 31%]
tests\test_integrations_weather.py ......                                [ 37%]
tests\test_notes_ideas.py .........                                      [ 47%]
tests\test_projects.py .......                                           [ 54%]
tests\test_recurrence.py ...                                             [ 58%]
tests\test_reminders_alarms.py ...............                           [ 74%]
tests\test_search.py ........                                            [ 82%]
tests\test_tasks.py ............                                         [ 95%]
tests\test_worker.py ....                                                [100%]

============================= 93 passed in 23.75s =============================
Exit Code: 0 (100% test pass rate)
```

---

## AGENTS.md Compliance Checklist
- [x] Code targeted strictly for `origin/staging` (never direct push or merge to `main`).
- [x] TypeScript compiler (`npx tsc --noEmit`): 0 errors.
- [x] Vite production build (`npm run build`): Clean build output.
- [x] Backend test suite (`python -m pytest`): 93/93 tests passing.
- [x] Default currency is ₹ (INR).
- [x] Default weather location is Pune, IN.
- [x] Light theme is default (`html[data-theme='light']`).
- [x] Single logo identity verified (`/logo.png`).
