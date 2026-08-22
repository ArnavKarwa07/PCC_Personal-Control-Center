# Changelog

All notable changes to the PCC (Personal Control Center) project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v1.0.1beta] - 2026-08-23

### Added
- **Offline-First Mutation Queue & Background Auto-Sync**:
  - Implemented client-side persistent mutation queue service (`frontend/src/services/syncQueue.ts`) backed by `localStorage` (`pcc_sync_queue`).
  - Supports non-blocking optimistic UI mutations for 9 core domain entities (`tasks`, `notes`, `projects`, `ideas`, `calendar`, `reminders`, `alarms`, `goals`, `contacts`) across `create`, `update`, and `delete` actions.
  - Intelligent mutation deduplication and batch merging to coalesce successive edits or prune cancelled creation mutations prior to sync.
  - Automatic background queue flush on reconnection (`window.addEventListener('online')`), app visibility changes, or periodic sync triggers, featuring exponential backoff with a 3-retry threshold and 404 dead-letter pruning.
  - Global event notifications (`syncQueueChanged`) keeping UI synchronization indicators real-time reactive.
- **Native Desktop Alarm Scheduling & System Tray Integration (Tauri v2)**:
  - Configured Tauri v2 desktop runtime (`frontend/src-tauri/src/lib.rs`, `tauri.conf.json`) with native system tray menu integration featuring "Show PCC" and "Quit" options.
  - Close-to-tray background persistence (`tauri::WindowEvent::CloseRequested` with `window.hide()` and `api.prevent_close()`), ensuring continuous background alarm monitoring without terminal interruption.
  - Integrated `@tauri-apps/plugin-notification` and `@tauri-apps/plugin-autostart` for persistent desktop alerts and automatic system startup.
  - Exact timeout scheduling for alarms and reminders within Tauri runtime (`alarmScheduler.ts`).
- **Capacitor 6 Native Notification Channels & Custom Audio Asset (Android)**:
  - Configured dedicated high-priority native notification channel (`pcc_alarms_channel`) with MAX importance (level 5), public lockscreen visibility, custom vibration patterns, and bundled `alarm.wav` audio asset (`frontend/android/app/src/main/res/raw/alarm.wav`).
  - Low-power OS doze-mode wakeup support via `allowWhileIdle: true` on `@capacitor/local-notifications` to guarantee on-time wake-up alerts on mobile devices.
  - Deterministic numeric notification ID generation via FNV-1a hashing algorithm (`100000000+` namespace for alarms, `200000000+` for reminders).
- **Proactive Startup Permission Management Banner**:
  - Added proactive, non-intrusive startup permissions prompt (`AppShell.tsx`, `permissionService.ts`) to request notification access, background alarm execution, and Open-Meteo geolocation telemetry on initial launch.
  - Unified multi-platform permission queries handling Capacitor native Android, Tauri v2 desktop, and modern standard browser environments with automatic 3000ms race safeguards.
- **AI Executive Assistant Service & Gemini 2.0 Flash Integration**:
  - Overhauled the AI Executive Assistant floating widget (`AIAssistantWidget.tsx`), restoring direct endpoint routing to `/api/v1/assistant/process_assistant_query`.
  - Integrated Google Gemini 2.0 Flash (`gemini-2.0-flash` via `google.generativeai`) within `backend/app/services/assistant_service.py` for high-speed conversational querying, contextual workspace reasoning, and task/note auto-dispatch.
  - Added natural language intent detection (`CREATE_TASK`, `CREATE_NOTE`, `GENERAL_QUERY`) and automated executive morning briefing generation (`/assistant/get_daily_briefing`).
- **Standardized CI/CD Cross-Platform Release Pipeline (`v1.0.1beta`)**:
  - Upgraded GitHub Actions release workflow (`.github/workflows/build-release.yml`) with automated tag extraction and dynamic semver propagation.
  - Automatically synchronizes release version tags (`v1.0.1beta` -> `1.0.1`) across `frontend/package.json`, `frontend/src-tauri/tauri.conf.json`, `frontend/src-tauri/Cargo.toml`, and `frontend/android/app/build.gradle` (`versionCode` & `versionName`) during build matrix execution.
  - Produces and publishes signed cross-platform artifacts to GitHub Releases: Android debug APK (`PCC_v1.0.1beta.apk`) and desktop binaries (`.exe` NSIS installer, `.dmg`, `.AppImage`, `.deb`).

### Changed
- **Transition to Single-Tenant Owner Architecture**:
  - Streamlined backend REST architecture into a zero-friction single-tenant mode for Arnav Karwa (`arnavkarwa07@gmail.com` / `00000000-0000-0000-0000-000000000001`), eliminating redundant multi-user login, register, and token management overhead.
  - Removed client-side `authStore.ts`, login/register modals, and authorization bearer header blockers across API calls (`frontend/src/services/api.ts`).
  - Retained database-level user isolation with automatic default owner provisioning in dependency injections (`backend/app/core/dependencies.py`).
- **GCP US-Central Migration & Manual CI/CD Dispatch Workflow**:
  - Migrated GCP Cloud Run backend service deployment target to `us-central1` region to align with zero-cost scaling infrastructure.
  - Disabled automatic GitHub Actions CI/CD pipeline triggers, transitioning build and deployment runs to manual `workflow_dispatch` execution to optimize workflow resource utilization and control deployment timing.

### Removed
- **Financial & Fitness Modules Cleanup (Database Migration)**:
  - Created Alembic database migration `drop_deprecated_tables` (`backend/alembic/versions/drop_deprecated_tables.py`) to drop legacy `finances` table.
  - Purged obsolete auth endpoints (`backend/app/api/v1/auth.py`, `backend/app/api/v1/users.py`), auth schemas (`backend/app/schemas/auth.py`, `backend/app/schemas/user.py`), and test modules (`backend/tests/test_auth.py`).

### Compliance & Quality Assurance
- **Empirical Verification**:
  - `npx tsc --noEmit`: 0 TypeScript compiler errors.
  - `npm run build`: Vite production bundle generated successfully (232 modules transformed, 0 errors).
  - `python -m pytest`: 79/79 backend unit tests passing (100% success rate).

## [1.5.0] - 2026-08-22

### Added
- **Neon PostgreSQL Cloud Database Integration**:
  - Configured SQLAlchemy 2.0 and Alembic database migrations to support Neon serverless PostgreSQL (`postgresql://...sslmode=require`) alongside SQLite for production cloud persistence.
  - Enabled SSL connection parameter handling (`sslmode=require`), query timeout optimization, and dynamic database URI parsing via `backend/app/core/config.py` and `backend/app/core/database.py`.
- **24/7 Backend Production Docker Containerization**:
  - Standardized lightweight `backend/Dockerfile` using `python:3.12-slim` base image for continuous 24/7 cloud execution on platforms such as Koyeb, Hugging Face Spaces, or Docker Compose.
  - Added dynamic environment `$PORT` binding (defaulting to `7860` for Hugging Face / `8000` for Docker Compose), non-root `/app/data` permission configuration, and unbuffered production log output.
  - Updated `docker-compose.yml` for multi-container stack management (FastAPI backend API + async background worker process).
- **Capacitor v6 Native Android Application Packaging**:
  - Integrated Capacitor v6 framework (`@capacitor/core`, `@capacitor/android`, `@capacitor/cli` v6.0.0) in `frontend/package.json` and `frontend/capacitor.config.json`.
  - Configured `androidScheme: "https"`, cleartext traffic support, and splash screen customization for seamless Android mobile web view rendering and cross-origin REST API communication.
  - Added npm build scripts (`cap:sync`, `cap:android`) and Gradle build setup (`frontend/android/gradlew assembleDebug`) for packaging standalone Android APKs.
- **Tauri v2 Native Desktop Application Packaging**:
  - Configured Tauri v2 framework (`@tauri-apps/cli` v2.0.0) with desktop bundle manifest `frontend/src-tauri/tauri.conf.json`.
  - Enabled multi-platform desktop application packaging targeting Windows (`.exe` NSIS installer), macOS (`.dmg`), and Linux (`.AppImage` / `.deb`).
  - Added `tauri` CLI script integration to `package.json` for live development (`npm run tauri dev`) and desktop release builds (`npm run tauri build`).
- **GitHub Actions Automated Cross-Platform Release Workflow**:
  - Created `.github/workflows/build-release.yml` automating production build and release distribution upon pushes to the `main` branch.
  - **Android Job (`build-android`)**: Automatically sets up Java 17 and Node.js 20, builds Vite web assets, performs Capacitor sync, compiles debug Android APK via Gradle, and publishes `app-debug.apk` to GitHub Releases via `softprops/action-gh-release@v2`.
  - **Desktop Job (`build-desktop`)**: Executes matrix builds across `windows-latest`, `macos-latest`, and `ubuntu-latest`, installs Rust toolchain and Linux GTK/WebKit dependencies, and bundles native installers published to GitHub Releases via `tauri-apps/tauri-action@v2`.

### Migration & Developer Documentation
- Added Release v1.5.0 documentation to `docs/MIGRATION_NOTES.md` covering Neon PostgreSQL configuration, environment variable specifications (`.env.example`), Docker deployment instructions, Capacitor v6 Android build steps, Tauri v2 Desktop packaging workflows, and GitHub Actions CI/CD release pipeline documentation.
- Updated root `README.md` to detail cross-platform packaging commands, environment variable schemas, and production release pipelines.

## [1.4.1] - 2026-08-20

### Removed
- **Obsolete Root Worker Forwarder**: Removed obsolete root `worker/` forwarder package (`worker/__init__.py`, `worker/main.py`, `worker/README.md`) since active background worker logic resides in `backend/worker/main.py`.
- **Unused Shared Stub**: Removed unused empty `shared/` package stub (`shared/__init__.py`, `shared/README.md`).
- **Empty Infrastructure Directory**: Removed empty `infrastructure/` placeholder directory (`infrastructure/README.md`).
- **Duplicate Sample Data**: Removed duplicate sample data file `frontend/public/pcc_data_sample.json`.

### Added
- **Git Ignore Rule**: Added `.ruff_cache/` rule to `.gitignore` to prevent Ruff linter cache artifacts from entering source control.
- **Makefile Clean Target**: Added `clean` target to `Makefile` for purging `.pytest_cache` and `.ruff_cache` directories.

## [1.4.0] - 2026-08-20

### Added
- **Third-Party Integrations Expansion**:
  - Integrated 4 new enterprise connectors: **Microsoft Teams Calendar** (`teams_calendar`), **Slack** (`slack`), **GitLab** (`gitlab`), and **Jira** (`jira`).
  - **Microsoft Teams Calendar**: Supports event synchronization, tenant ID, client ID, calendar ID configuration, and OAuth access token management.
  - **Slack Integration**: Enables user/bot tokens (`xoxb-`, `xoxp-`), default channel routing, focus mode status synchronization, and automated daily digests.
  - **GitLab Workspace Sync**: Supports personal access tokens (`glpat-`), custom GitLab instance URLs, project ID mapping, merge request updates, and pipeline build status monitoring.
  - **Jira Sprint & Task Sync**: Enables Atlassian domain connection (`company.atlassian.net`), email authentication, API tokens (`jira_`), project key mapping, sprint issue imports, and Kanban status alignment.
- **Security Enhancements & Automatic Credential Masking**:
  - Implemented automatic sensitive credential masking across backend REST endpoints (`/api/v1/integrations`) and status diagnostic responses.
  - Recursively inspects configuration payloads and redacts secrets (`token`, `user_token`, `bot_token`, `api_token`, `access_token`, `api_key`, `secret`, `password`) into prefix-preserved masked strings (e.g. `ghp_****`, `xoxb-****`, `glpat-****`, `msteams_****`, `jira_****`).
- **Settings Workspace Integrations UI Grid & Accessibility**:
  - Expanded Settings Integrations grid (`SettingsPage.tsx`, `Settings.css`) with 100% monochromatic vector SVG brand icons for Teams Calendar, Slack, GitLab, and Jira.
  - Added accessible `aria-label`, `aria-expanded`, and `aria-hidden` attributes on interactive integration cards and configuration modals.
  - Dynamic modal configuration forms tailored with specific input types (`password` vs `text`) for tokens, URLs, tenant IDs, and channel settings.
- **JSON Backup & Restore Framework Integration**:
  - Updated `pcc_data.json` import/export schema and `jsonImportService.ts` to validate, seed, export, and restore third-party integration descriptors, active connection states, and sanitized configuration settings (`pcc_integrations_store_v2`).
- **Database Migration & Async Worker Jobs**:
  - Added Alembic migration revision `b71239c8e412` (`add_new_integration_providers`) expanding `IntegrationProvider` enum values.
  - Registered background worker sync routines (`worker/main.py`) for periodic automated synchronization of Teams Calendar, Slack, GitLab, and Jira integrations.

### Compliance & Quality Assurance
- **Empirical Verification**:
  - `npx tsc --noEmit`: 0 TypeScript compiler errors.
  - `npm run build`: Vite production bundle generated successfully.
  - `python -m pytest`: 104/104 backend unit tests passing (100% success rate).

## [1.3.1] - 2026-08-20

### Added
- **Contacts Page Glassmorphic Empty State**:
  - Added clean "No Contacts Found" `EmptyState` card with monochromatic vector SVG icon and interactive "Add Contact" CTA button in `ContactsPage.tsx`.

### Changed
- **LocalStorage Mock Data Auto-Purge**:
  - Implemented complete localStorage mock data auto-purge across all 7 primary domain stores (`alarmStore`, `taskStore`, `noteStore`, `reminderStore`, `ideaStore`, `projectStore`, `calendarStore`).
  - Clears legacy mock data from local storage on store initialization (`pcc_*_store_v1`), guaranteeing a clean-slate workspace while preserving explicit user imports.

### Refactored & Mobile Layout Improvements
- **Notes Workspace Mobile Layout**:
  - Re-aligned the Grid/List icon view switcher on the same horizontal row as the Notes filter select dropdown (`#notes-mobile-filter`).
- **Reminders Workspace Mobile Layout**:
  - Aligned the Status filter and Category filter select dropdowns into a single horizontal row (`grid-template-columns: 1fr 1fr`) on mobile viewports.
- **Settings Workspace Mobile Layout**:
  - Reorganized Settings page on screens `<= 768px` into 4 continuous scrolling sections stacked vertically (Preferences, Active Modules, Integrations, Data Management) instead of top tabs.
- **Comprehensive 320px Responsive Support**:
  - Implemented comprehensive 320px responsive UI support across all views, eliminating horizontal scrolling, element clipping, and layout distortion on ultra-small screens.

## [1.3.0] - 2026-08-20

### Added
- **Live API Workflows Integration**:
  - **Weather Telemetry API**: Connected live Weather service to Open-Meteo REST API (with OpenWeatherMap fallback), defaulting to Pune, IN (`18.5204° N, 73.8567° E`) with metric units (`°C`, `km/h`, `hPa`) and dynamic geolocation auto-detection.
  - **Goals & OKRs Matrix**: Integrated live backend REST endpoints (`/api/v1/goals/objectives`, `/api/v1/goals/key-results`) for objective lifecycle management, key result progress rollups, and interactive skill tree visualization.
  - **Contacts & Personal CRM**: Connected live backend endpoints (`/api/v1/contacts`) for contact record management, interaction logging, organizational filtering, and automated catch-up reminders.
  - **Calendar & Scheduling**: Full live backend REST integration (`/api/v1/calendar/events`) supporting day, week, month grid rendering, event recurrence rules, and time-block allocation.
  - **AI Executive Daily Briefing**: Live AI Assistant endpoint (`/api/v1/ai/assistant/daily-briefing`) synthesizing active tasks, upcoming calendar events, pending reminders, and live weather telemetry into executive morning briefs.
- **Glassmorphic Empty State UX Improvements**:
  - Implemented standardized `EmptyState` component (`EmptyState.tsx`, `EmptyState.css`) featuring glassmorphism backdrop blur (`backdrop-filter: blur(12px)`), crisp slate borders, monochromatic vector SVG iconography (`stroke="currentColor"`), and contextual Call-To-Action (CTA) action buttons.
  - Added guided CTA buttons across all empty feature views ("Create Task", "Add Project", "Schedule Event", "Create Goal", "Add Contact", "Set Reminder", "Create Note", "Add Idea", "Set Alarm", "Start Timer") to guide users seamlessly from empty workspace to active productivity.

### Changed
- **Zero Dummy Data Workspace Transition**:
  - Purged 100% of hardcoded dummy sample data and mock initial states across all 11 Zustand stores (`taskStore.ts`, `projectStore.ts`, `calendarStore.ts`, `noteStore.ts`, `ideaStore.ts`, `reminderStore.ts`, `alarmStore.ts`, `timerStore.ts`, `weatherStore.ts`, `notificationStore.ts`, `integrationStore.ts`) and feature views.
  - Established a clean-slate workspace initializing empty arrays (`[]`), `null` states, and zeroed counters on fresh installation.
  - Preserved optional local JSON data seeding framework (`pcc_data.json`) via Settings -> Data Management tab for users who wish to import sample data on demand.

### Compliance & Quality Assurance
- **AGENTS.md Guideline Adherence**:
  - **Git Branching Rules**: Strict development and commit workflow targeting `origin/staging` (never direct commit/merge to `main`).
  - **Localization Standards**: India (IN) set as default country, Pune, India as default weather location, and ₹ (INR - Indian Rupee) as default currency across all financial and telemetry views.
  - **Design & Aesthetic Standards**: Light theme default (`html[data-theme='light']`) with dark glassmorphism option, 100% monochromatic vector SVG iconography (zero emojis), and unified brand logo artwork (`/logo.png`).
  - **Module Scope Integrity**: Enforced 11 active core modules (Tasks, Projects, Calendar, Goals, Notes, Ideas, Contacts, Reminders, Alarms, Timers, Weather) and Settings, adhering strictly to deprecation of legacy modules.
- **Empirical Verification**: 
  - `npx tsc --noEmit`: 0 TypeScript compiler errors.
  - `npm run build`: Vite production bundle generated successfully.
  - `python -m pytest`: 93/93 backend tests passing (100% success rate).

## [1.2.0] - 2026-08-20

### Added
- **Google Keep-Style Notes Application Refactor**: Overhauled the Notes module into a clean, modern Keep-style knowledge capture workspace (`NotesWorkspace.tsx`, `noteStore.ts`).
  - **Explicit Page Header**: Added semantic `<h1>Notes</h1>` top page header for standard page layout consistency.
  - **100% Emoji Removal & Vector SVG Icons**: Replaced 100% of emojis with clean, monochromatic vector SVG icons (`stroke="currentColor"` / `fill="currentColor"`) across all note cards, filter tabs, quick bar buttons, editor modals, and trash banners.
  - **Feature Simplification**: Completely removed legacy categories and archive features to streamline note management and storage lifecycle.
  - **Mobile Filter Consolidation**: Consolidated mobile filter tabs into 1 single, responsive dropdown `<select>` block (`#notes-mobile-filter`) for seamless mobile UX.
  - **Filter Accuracy Bug Fix**: Fixed note filtering and search accuracy to cleanly partition pinned vs unpinned notes without item duplicates or state collision.
  - **Interactive Checklists**: Support for checklist notes with inline item creation, completion toggles, keyboard focus navigation (`Enter`/`Backspace`), and completion progress badges.
  - **Custom Color Themes**: 6 vibrant theme palettes (`default`, `lavender`, `emerald`, `amber`, `rose`, `sky`) with adaptive card backgrounds and accent borders for light/dark glassmorphism themes.
  - **Trash Lifecycle Management**: Trash note state transitions (`active`, `pinned`, `trashed`) with single-click restore and "Empty Trash" purge actions.
  - **Gallery & List View Options**: Dynamic view mode toggle between multi-column responsive grid card view and streamlined single-column list layout (`grid` vs `list`).
  - **Quick Creation Input Bar**: Expandable top creation bar for single-click note/checklist creation directly from the main view.
  - **Markdown & Split-View Editor**: Multi-tab text editor mode (`edit`, `split`, `preview`) with live GFM rendering (`MarkdownPreview.tsx`), auto-focus, scroll locking, and debounced auto-save.

### Changed
- **Note State Store & Storage Compatibility**: Enhanced `useNoteStore` Zustand store with robust API sync and localStorage fallback (`pcc_notes_store_v1`) supporting new schema attributes without breaking existing user data.

## [1.1.0] - 2026-08-20

### Added
- **24/7 Hugging Face Cloud Deployment**:
  - Containerized FastAPI backend runtime (`backend/Dockerfile`) built on `python:3.12-slim` for continuous 24/7 execution on Hugging Face Spaces, Koyeb, and self-hosted Docker hosts.
  - Dynamic `$PORT` environment variable binding (defaulting to `7860` for Hugging Face Spaces / `8000` for local Docker Compose execution).
  - Explicit non-root volume write permissions (`mkdir -p /app/data && chmod -R 777 /app/data`) ensuring unprivileged container storage access for SQLite/file data.
  - Orchestrated multi-container execution stack (`docker-compose.yml`) pairing the FastAPI web API server with the async background worker runner.
- **Mobile-Desktop Cross-Sync**:
  - Multi-device global `useAutoSync` hook (`useAutoSync.ts`) integrated into `AppShell.tsx` for seamless background state reconciliation across web, desktop (Tauri v2), and mobile (Capacitor v6).
  - Orchestrates concurrent synchronization across 7 primary domain stores (`alarms`, `reminders`, `tasks`, `notes`, `projects`, `events`, `ideas`) using non-blocking `Promise.allSettled`.
  - Multi-trigger lifecycle matrix: initial component mount, tab/window foreground visibility toggles (`visibilitychange`), native Capacitor mobile app resume (`appStateChange`), and periodic 60-second background heartbeat polling.
- **Native Local Notifications & Alarm Scheduler**:
  - Cross-platform notification engine (`alarmScheduler.ts`) leveraging `@capacitor/local-notifications` for native mobile push alerts and fallback web notifications.
  - Standardized high-priority OS notification channel (`pcc_alarms_channel`) with MAX importance (level 5), public lockscreen visibility, custom vibration patterns, and `alarm.wav` audio.
  - FNV-1a non-cryptographic hashing algorithm (`fnv1aHash`) converting string UUIDs into deterministic 32-bit integer IDs with distinct namespace offsets (`100000000+` for alarms, `200000000+` for reminders).
  - OS low-power doze mode wakeup support via `allowWhileIdle: true` and weekly day-of-week recurrence calculation (`days` array offset logic).
- **Unified Permissions & Timeout Safeguards**:
  - Unified system permission management service (`permissionService.ts`) querying and requesting notification and geolocation access across web and native Capacitor platforms (`SystemPermissionStatus`).
  - 3000ms race-condition timeout safeguard on geolocation permission requests (`requestLocationPermission`) to prevent UI freeze when users ignore browser permission prompts.
  - Batch non-blocking permission requester (`requestAllPermissions`) utilizing `Promise.allSettled` for smooth onboarding and settings permission grants.
- **Ringing Alarm Queue & Audio Context Controls**:
  - Real-time 1-second alarm ticker engine in `AppShell.tsx` scanning active alarm schedules against local system time (`HH:MM` and day of week).
  - `ringingQueue` state supporting multiple simultaneous triggered alarms rendered via full-screen overlay modal (`AlarmRingingModal.tsx`).
  - Pure Web Audio API synthesizer (`soundEffects` in `utils/audio.ts`) with lazy `AudioContext` initialization and state resume handler (`suspended` -> `running`).
  - Built-in audio synthesis for `gentle`, `digital`, and `radiant` alarm patterns, bell/chime chord tones, timer completion notifications, and UI interaction pips.
  - Deduplication tracking ref (`triggeredSetRef`) mapping `${id}-${date}-${time}` to prevent duplicate triggers with 24-hour timestamp auto-pruning.
- **JSON Onboarding & Backup Import/Export**:
  - Robust import/export service (`jsonImportService.ts`) handling schema validation, data sanitization, issue accumulation (`error` vs `warning`), and sensible fallback defaults across 12 PCC data domains.
  - `executeDataImport` engine writing batch domain entries into `localStorage`, firing custom `pcc-data-imported` DOM events, and triggering Zustand store state re-hydration (`fetchAlarms()`, `fetchTasks()`, etc.).
  - Complete Settings Data Management integration for exporting complete backups (`pcc_data.json`) and seeding initial onboarding states.

### Changed
- **Timer Module Renaming**: Renamed "World Clocks Planner" module to **Timers** across top navigation, sidebar, and routing components (`TimersPage.tsx`) in strict compliance with `AGENTS.md` module scope.
- **Alarm Store Formatting**: Updated `alarmStore.ts` next alarm metric logic to cleanly format alarm times (`Next at HH:MM`) without trailing string artifacts.

### Refactored & Fixed (11 UI Fixes)
1. **Header Branding & Notification Badging (Image 1)**
   - Removed redundant "PCC" text next to the brand logo image in desktop and mobile headers (`DesktopLayout.tsx`, `MobileLayout.tsx`).
   - Fixed notification badge positioning, padding, border isolation, and z-index overlap in `DesktopLayout.css` and `MobileLayout.css`.

2. **Weather Hero Card & Telemetry Hierarchy (Image 2)**
   - Redesigned Weather view (`WeatherPage.tsx`, `Weather.css`) with clean quick metric badges (Pressure, Sunrise/Sunset, Rain Chance, Humidity, Wind).
   - Added interactive search clear button and responsive telemetry grid for Pune, IN defaults.

3. **AI Assistant Widget & FAB Positioning (Image 3)**
   - Standardized floating AI Assistant widget trigger button (`AIAssistantWidget.css`) with safe-area spacing above mobile bottom navigation.
   - Prevented drawer clipping on mobile viewports.

4. **Tasks Filter Bar & Mobile View Selectors (Image 4)**
   - Overhauled Task Filter bar responsive layout (`TasksPage.tsx`, `Tasks.css`, `index.css`).
   - Added mobile-optimized `<select>` dropdown for view mode toggles and wrapped filter controls to prevent horizontal overflow on screens < 768px.

5. **Notes Workspace Toolbar & Card Aesthetics (Image 5)**
   - Fixed Notes workspace toolbar button wrapping and alignment (`NotesWorkspace.tsx`, `Notes.css`).
   - Removed extra hover outlines and refined card status tags.

6. **Ideas Board Layout & Tag Styling (Image 6)**
   - Cleaned up Ideas card layout, tag padding, and hover actions (`Ideas.css`, `KanbanBoard.css`).
   - Removed duplicate border artifacts.

7. **Reminders Quick Filter & Form Layout (Image 7)**
   - Restructured Reminders dashboard header (`RemindersPage.tsx`, `Reminders.css`, `index.css`).
   - Added 2-column mobile stats grid and responsive filter pills (All, Upcoming, Recurring, High Priority).

8. **Settings Module Management & Data Loader UI (Image 8)**
   - Redesigned Settings workspace (`SettingsPage.tsx`, `Settings.css`) into categorized card sections (Preferences, Active Modules, Integrations, Data Management).
   - Fixed JSON Onboarding import/export action triggers and toggle switch alignments.

9. **Global Brand Logo Asset Optimization (Image 9)**
   - Updated `/logo.png` image asset with optimized branding artwork.
   - Ensured unified logo display across favicon, desktop sidebar, and mobile top bar per `AGENTS.md`.

10. **Mobile Navigation Spacing & Safe-Area Padding (Image 10)**
    - Adjusted mobile layout viewport containers (`MobileLayout.css`) with `min-height: 100dvh` and dynamic `padding-bottom: calc(var(--bottom-nav-height) + 96px)`.
    - Fixed FAB bottom positioning (`calc(var(--bottom-nav-height) + 16px)`), eliminating bottom bar overlaps.

11. **Timer Module Renaming & Next Alarm Badge Cleanliness**
    - Completed transition of timer/clock features to the simplified "Timers" module.
    - Sanitized next alarm badge labels in `alarmStore.ts`.

### Verified Production Readiness
- `npx tsc --noEmit`: 0 errors.
- `npm run build`: Vite production bundle generated successfully.
- Target branch: `origin/staging`.
