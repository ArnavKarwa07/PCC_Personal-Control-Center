# PCC Migration Notes - Release v1.1.0-beta (Vercel Serverless & Neon PostgreSQL Migration)

## Release Overview
Release `v1.1.0-beta` establishes the Vercel Serverless Python backend architecture, Neon PostgreSQL pool recycling and NullPool serverless handling, and cross-platform CORS configuration for PCC (Personal Control Center). Key features include Vercel Serverless Python deployment (`api/index.py` & `@vercel/python`), Neon PostgreSQL connection pool recycling (`pool_recycle=300` & `pool_pre_ping=True`), explicit SSL mode enforcement (`sslmode=require`), robust multi-origin CORS controls, client-side server URL override with fallback to `https://pcc-backend-ten.vercel.app`, and complete decommissioning of legacy GCP Cloud Run infrastructure.

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
- **SQLAlchemy 2.0 Pool Recycling Strategy**:
  - `pool_recycle = 300`: Recycles pooled database connections every 300 seconds (5 minutes). This is critical for Neon serverless PostgreSQL because Neon suspends compute endpoints after inactivity, causing stale connection handles to reset. Recycling prevents `OperationalError: SSL connection has been closed unexpectedly` errors.
  - `pool_pre_ping = True`: Emits a lightweight `SELECT 1` ping before executing queries, verifying connection health and auto-reconnecting if Neon suspended the compute.
  - `pool_size = 5`, `max_overflow = 10`: Standard connection limit settings tuned for Vercel serverless concurrent invocations.
  - Dynamic `connect_args`: SQLite uses `check_same_thread=False` and `timeout=30`, whereas PostgreSQL relies on native connection pooling.
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
  ```python
  class Settings(BaseSettings):
      DATABASE_URL: str = "sqlite:///./pcc.db"
      CORS_ORIGINS: str = "http://localhost:5173,https://pcc-backend-ten.vercel.app,capacitor://localhost,https://localhost,http://tauri.localhost,https://tauri.localhost,tauri://localhost,http://localhost"

      @property
      def cors_origins_list(self) -> List[str]:
          return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]
  ```
- **Frontend API Base URL Resolution (`frontend/src/services/api.ts`)**:
  - Resolution order: `localStorage.getItem('pcc_server_url')` -> `import.meta.env.VITE_API_URL` -> default `https://pcc-backend-ten.vercel.app`.
  - Enables instant server URL switching from Settings without rebuilding frontend artifacts.

---

# PCC Migration Notes - Release v1.5.0

## Release Overview
Release `v1.5.0` establishes production deployment infrastructure and cross-platform native application packaging for PCC (Personal Control Center). Key features include Neon serverless PostgreSQL database support with SSL connection management, 24/7 backend containerization via Docker and Docker Compose, Capacitor v6 mobile packaging for Android APK builds, Tauri v2 desktop application packaging for Windows (`.exe`), macOS (`.dmg`), and Linux (`.AppImage`/`.deb`), and automated GitHub Actions CI/CD release workflow pipelines.

---

## Key Changes & Migration Requirements

### 1. Database Migration & Neon PostgreSQL Cloud Support
- **Engine**: Fully compatible with both **Neon Serverless PostgreSQL** for production and **SQLite 3** for local offline development.
- **Connection String Schema**:
  - **Neon PostgreSQL**: `DATABASE_URL=postgresql://<user>:<password>@<ep-id>.<region>.aws.neon.tech/<dbname>?sslmode=require`
  - **Local SQLite Fallback**: `DATABASE_URL=sqlite:///./pcc.db` or `sqlite:///./data/pcc.db`
- **SSL Connection Requirement**: Neon PostgreSQL connections require `sslmode=require` parameter in the connection string to enforce encrypted TLS traffic.
- **Database Migration Execution**:
  ```bash
  cd backend
  # Run Alembic migrations against target database (Neon PostgreSQL or SQLite)
  alembic upgrade head
  ```
- **SQLAlchemy 2.0 Engine Updates**: `backend/app/core/database.py` dynamically handles SQLite-specific `connect_args` (`check_same_thread`, `PRAGMA foreign_keys=ON`, `PRAGMA journal_mode=WAL`) while allowing PostgreSQL native connection pooling for cloud deployments.

### 2. Environment Variables & System Configuration
Comprehensive list of required and optional environment variables (`.env.example` reference):

| Variable | Description | Default / Example Value | Target Scope |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL or SQLite connection URI | `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require` | Backend |
| `SECRET_KEY` | JWT signing secret key (32+ chars) | `change-me-in-production-super-secret-key-32-chars-min` | Backend |
| `ALGORITHM` | JWT signature algorithm | `HS256` | Backend |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Authentication token validity duration (minutes) | `30` | Backend |
| `CORS_ORIGINS` | Comma-separated allowed HTTP/app origins | `http://localhost:5173,capacitor://localhost,tauri://localhost,http://localhost` | Backend |
| `WEATHER_API_KEY` | OpenWeatherMap API key fallback | `29b21b5a2f9aca2282088c7c61c30ea2` | Backend |
| `VAPID_PRIVATE_KEY` | Web push notification private key | Optional string | Backend |
| `VAPID_PUBLIC_KEY` | Web push notification public key | Optional string | Backend |
| `ENVIRONMENT` | Application deployment environment | `production` / `development` | Backend |
| `DEBUG` | Verbose debug log & SQL echo flag | `false` (prod) / `true` (dev) | Backend |
| `PORT` | Container HTTP binding port | `7860` (HuggingFace) / `8000` (Local/Docker) | Backend |
| `VITE_API_URL` | Frontend REST API endpoint URL | `http://localhost:8000` / `https://pcc-backend-ten.vercel.app` | Frontend |

### 3. Vercel Serverless Python Deployment & Complete GCP Removal
- **Production Serverless Backend Host**: `https://pcc-backend-ten.vercel.app`
- **Vercel Serverless Architecture (`@vercel/python`)**:
  - Root `vercel.json` routes all wildcard API requests (`/(.*)`) to `api/index.py`.
  - `api/index.py` dynamically appends `backend/` to `sys.path` and imports `app` from `backend.app.main`, enabling seamless FastAPI execution on Vercel Serverless Functions.
- **Complete GCP Removal**:
  - Completely decommissioned Google Cloud Run (`pcc-backend`) services and Google Container Registry (`gcr.io`) image repositories.
  - Removed container build dependencies and GCP CLI deployment scripts, eliminating GCP compute costs and maintenance overhead.
- **Vercel Deployment Workflow**:
  ```bash
  # Deploy backend updates directly via Vercel CLI
  vercel --prod
  ```

---

## Developer Instructions & Build Pipelines

### 1. Production Docker Container & 24/7 Backend Deployment
- **Single Container Build**:
  ```bash
  cd backend
  docker build -t pcc-backend .
  docker run -d -p 8000:7860 -e DATABASE_URL="postgresql://..." -e SECRET_KEY="your-secret" pcc-backend
  ```
- **Multi-Container Stack (Docker Compose)**:
  ```bash
  # Starts FastAPI backend container and async background worker process
  docker-compose up -d --build
  ```
- **Continuous Hosting Platforms**:
  - **Hugging Face Spaces / Koyeb**: Set container `$PORT` (default `7860`) and inject environment variables via dashboard secret manager.
  - **Data Volume Mounting**: Persistent directory `/app/data` configured with `chmod 777` permissions for containerized SQLite/file storage.

### 2. Capacitor v6 Android Application Packaging Pipeline
- **Prerequisites**: Node.js 20+, JDK 17, Android SDK / Android Studio.
- **Build Sequence**:
  ```bash
  cd frontend
  # 1. Install dependencies
  npm ci
  # 2. Build Vite production bundle into dist/
  npm run build
  # 3. Add Android platform & sync web assets
  npx cap add android
  npx cap sync android
  # 4. Compile Android Debug APK
  cd android
  chmod +x gradlew
  ./gradlew assembleDebug
  ```
- **Output Artifact**: `frontend/android/app/build/outputs/apk/debug/app-debug.apk`

### 3. Tauri v2 Desktop Application Packaging Pipeline
- **Prerequisites**: Node.js 20+, Rust stable toolchain (`rustc`, `cargo`), OS build tools:
  - **Windows**: Visual C++ Build Tools & Windows SDK.
  - **Linux**: `libgtk-3-dev`, `libwebkit2gtk-4.1-dev`, `libappindicator3-dev`, `librsvg2-dev`, `patchelf`.
  - **macOS**: Xcode Command Line Tools.
- **Build Commands**:
  ```bash
  cd frontend
  # 1. Live desktop app preview
  npm run tauri dev
  # 2. Build production desktop bundles (.exe, .dmg, .AppImage, .deb)
  npm run tauri build
  ```
- **Output Artifacts**: `frontend/src-tauri/target/release/bundle/`

### 4. GitHub Actions CI/CD Release Pipeline
- **Workflow File**: `.github/workflows/build-release.yml`
- **Trigger**: Automatic on `push` to `main` branch.
- **Jobs**:
  - `build-android`: Builds Android APK on `ubuntu-latest` with Java 17 and uploads artifact `app-debug.apk` to GitHub Release.
  - `build-desktop`: Runs matrix builds on `windows-latest`, `macos-latest`, and `ubuntu-latest`, compiles native installer packages using `tauri-apps/tauri-action@v2`, and publishes installers to GitHub Release.
- **Release Verification**: Check [GitHub Repository Releases](https://github.com/ArnavKarwa07/PCC_Personal-Control-Center/releases) for generated build tags (`release-${SHA}`) and attached binaries.

---

# PCC Migration Notes - Release v1.4.0

## Release Overview
Release `v1.4.0` expands the PCC Third-Party Integrations framework with 4 new enterprise connectors: **Microsoft Teams Calendar**, **Slack**, **GitLab**, and **Jira**. Key highlights include automatic sensitive credential masking for API keys/tokens, expanded Settings integration UI grid with brand-specific vector SVG iconography and aria accessibility attributes, updated `pcc_data.json` import/export schema (`jsonImportService.ts`), Alembic database schema migration (`b71239c8e412`), and automated async worker sync tasks.

---

## Key Changes & Migration Requirements

### 1. Database Schema & Provider Enum Migration
- **Alembic Revision ID**: `b71239c8e412` (`add_new_integration_providers`).
- **Parent Revision**: `4a3652a9cb85`.
- **Extended Enum Values in `IntegrationProvider` (`backend/app/models/integration.py`)**:
  - `TEAMS_CALENDAR` (`"teams_calendar"`)
  - `SLACK` (`"slack"`)
  - `GITLAB` (`"gitlab"`)
  - `JIRA` (`"jira"`)
- **Database Command**:
  ```bash
  cd backend
  alembic upgrade head
  ```

### 2. Automatic Sensitive Credential Masking
- **Security Implementation**: `_mask_sensitive_config()` in `backend/app/services/integration_service.py`.
- **Masking Protocol**: Sensitive keys (`token`, `user_token`, `bot_token`, `api_token`, `access_token`, `api_key`, `secret`, `password`) are automatically redacted in API responses and status endpoints.
- **Prefix Preservation**: Standard provider key prefixes are preserved for UI diagnostics:
  - GitHub: `ghp_****`
  - Slack: `xoxb-****` / `xoxp-****`
  - GitLab: `glpat-****`
  - Microsoft Teams Calendar: `msteams_****`
  - Jira: `jira_****`

### 3. Client-Side Storage & LocalStorage Migration (`pcc_integrations_store_v2`)
- **Storage Key**: `pcc_integrations_store_v2`.
- **Automatic Hydration & Preset Merging**: The `loadStoredIntegrations()` helper in `integrationStore.ts` automatically merges server integration states into preset service descriptors, ensuring existing presets (`github`, `google_calendar`, `teams_calendar`, `telegram`, `slack`, `gitlab`, `jira`, `notion`, `discord`) are hydrated smoothly without losing UI metadata or custom configurations.
- **JSON Onboarding & Backup Restore**: `validateAndCleanImportData()` and `executeDataImport()` in `jsonImportService.ts` support importing and exporting third-party integration descriptors under `integrations: []`.

### 4. Background Sync & Worker Integration
- Async task runner (`worker/main.py`) schedules periodic sync tasks for `teams_calendar`, `slack`, `gitlab`, and `jira` connectors alongside existing providers.

---

## Deployment & Verification Steps

1. **Checkout & Pull Staging**:
   ```bash
   git checkout staging
   git pull origin staging
   ```

2. **Run Database Migrations**:
   ```bash
   cd backend
   alembic upgrade head
   ```

3. **Backend Unit Test Verification (104 Tests)**:
   ```bash
   cd backend
   python -m pytest
   ```

4. **Frontend Typecheck & Vite Production Build**:
   ```bash
   cd frontend
   npx tsc --noEmit
   npm run build
   ```

5. **Staging Deployment**:
   Deploy static artifacts from `frontend/dist/` and restart FastAPI web server and worker process.

---

# PCC Migration Notes - Release v1.2.0

## Release Overview
Release `v1.2.0` introduces the Keep-style Notes Application refactor, featuring semantic `<h1>Notes</h1>` header, 100% vector SVG icons (zero emojis), removal of obsolete categories and archive features, consolidated mobile dropdown filter block, search filter accuracy fix, interactive checklists, custom color palettes, grid/list gallery toggles, quick creation input bars, and debounced auto-saving markdown editor modals.


---

## Key Changes & Migration Requirements

### 1. Simplified Note Data Schema & Deprecations
- **Removed Attributes in Note Model**:
  - `category` / `categories` — Removed. Note categorization has been simplified; notes no longer store or require category tags.
  - `archived` — Deprecated. Note status workflow is simplified strictly to `active`, `pinned`, and `trashed`.
- **Active Attributes in Note Model**:
  - `type?: 'text' | 'checklist'` — Defines whether the note displays formatted markdown content or interactive checklist rows. Default: `'text'`.
  - `checklistItems?: NoteChecklistItem[]` — Array of checklist items (`{ id: string, text: string, completed: boolean }`).
  - `color?: string` — Color theme key (`default`, `lavender`, `emerald`, `amber`, `rose`, `sky`). Default: `'default'`.
  - `pinned?: boolean` — Flags if note is pinned to top. Default: `false`.
  - `trashed?: boolean` — Flags if note is moved to Trash. Default: `false`.

### 2. Client-Side Storage & LocalStorage Migration
- **Storage Key**: `pcc_notes_store_v1`.
- **Automatic Hydration Migration**: The `loadStoredNotes()` parser automatically normalizes legacy notes upon application startup. Any pre-existing notes with deprecated `archived` or `category` fields are safely normalized to standard defaults (`type: 'text'`, `color: 'default'`, `trashed: false`, `checklistItems: []`).
- **No Manual Migration Required**: Existing local storage data remains 100% backward compatible without data loss or user intervention.

### 3. Layout & Mobile Filter Consolidation
- **Header Standard**: Embedded explicit `<h1>Notes</h1>` top page header.
- **Mobile Select Filter**: Replaced tab bar on screens < 768px with a single consolidated `<select id="notes-mobile-filter">` block containing All Notes, Pinned, Checklists, and Trash options.
- **Vector Icons**: Replaced 100% of emojis with monochromatic SVG vector icons (`stroke="currentColor"` / `fill="currentColor"`).

### 4. Backend API Compatibility
- The FastAPI backend endpoints (`/api/v1/notes`) accept note objects and safely handle optional attributes.
- Offline-first resilience: `useNoteStore` handles local updates instantly and syncs with backend endpoints optimistically.

---

## Deployment & Verification Steps

1. **Checkout & Pull Staging**:
   ```bash
   git checkout staging
   git pull origin staging
   ```

2. **Frontend Typecheck & Build**:
   ```bash
   cd frontend
   npx tsc --noEmit
   npm run build
   ```

3. **Backend Test Suite Verification**:
   ```bash
   cd backend
   python -m pytest
   ```

4. **Staging Deployment**:
   Deploy static artifacts from `frontend/dist/` and restart backend services as needed.

---

# PCC Migration Notes - Release v1.1.0

## Release Overview
Release `v1.1.0` introduces core platform infrastructure including 24/7 Hugging Face Cloud Deployment containerization, Mobile-Desktop Cross-Device Auto-Sync (`useAutoSync`), Native Local Notifications & Alarm Scheduler (`alarmScheduler`), Unified Permissions & Geolocation Timeout Safeguards (`permissionService`), Ringing Alarm Queue & Web Audio Context Controls (`soundEffects`), and JSON Onboarding & Backup Import/Export (`jsonImportService`).

---

## Key Changes & Migration Requirements

### 1. Local Storage Key Migration Pathways (`pcc_alarms` -> `pcc_alarms_store_v1`)
- **Legacy Storage Key**: `pcc_alarms`
- **Versioned Target Key**: `pcc_alarms_store_v1`
- **Snoozed Alarms Storage Key**: `pcc_snoozed_alarms_v1`

#### Dual-Read Fallback Strategy (`alarmStore.ts`)
- Upon application initialization, `loadStoredAlarms()` inspects `pcc_alarms_store_v1` first.
- If `pcc_alarms_store_v1` is missing or contains an empty array, it automatically falls back to reading legacy data from `pcc_alarms`.
- Any persistent alarms retrieved from `pcc_alarms` are seamlessly converted into the `Alarm` model without data loss.

#### Dual-Write Backward Compatibility (`alarmStore.ts`)
- Whenever alarms are modified, added, toggled, or deleted, `saveAlarms()` writes persistent alarms (excluding temporary `alm_snooze_*` instances) to **both** `pcc_alarms_store_v1` and `pcc_alarms`.
- This dual-write protocol ensures complete backward compatibility for users switching between application versions or accessing local storage across browser contexts.

#### Snoozed Alarms Isolation & Auto-Purging
- Snoozed alarm instances (`alm_snooze_*`) are isolated from main persistent alarm stores and saved strictly in `pcc_snoozed_alarms_v1`.
- Each snoozed alarm includes an explicit `expiresAt` timestamp (1-hour grace period).
- On application boot, `getStoredSnoozedAlarms()` filters out expired snoozed alarms (`expiresAt > Date.now()`) and auto-purges stale records.

#### Summary of Active Domain Storage Keys

| Domain | Storage Key | Format | Migration Fallback |
| :--- | :--- | :--- | :--- |
| **Alarms** | `pcc_alarms_store_v1` | JSON Array | `pcc_alarms` (Legacy) |
| **Snoozed Alarms** | `pcc_snoozed_alarms_v1` | JSON Array | Auto-purging expired entries |
| **Tasks** | `pcc_tasks` | JSON Array | Direct hydration |
| **Projects** | `pcc_projects` | JSON Array | Direct hydration |
| **Notes** | `pcc_notes_store_v1` | JSON Array | `pcc_notes` (Legacy) |
| **Ideas** | `pcc_ideas` | JSON Array | Direct hydration |
| **Reminders** | `pcc_reminders` | JSON Array | Direct hydration |
| **Calendar** | `pcc_calendar_events` | JSON Array | Direct hydration |
| **Integrations** | `pcc_integrations_store_v2` | JSON Array | Preset merging fallback |
| **User Profile** | `pcc_user_profile` / `pcc_user_data` | JSON Object | Default schema fallbacks |

---

### 2. Environment Configuration for 24/7 Deployment Host
Continuous 24/7 cloud execution (Hugging Face Spaces, Koyeb, Docker Compose) relies on standardized container environment variables and non-root volume write permissions.

#### Environment Variables Schema (`.env.example`)

```env
# Database Configuration
DATABASE_URL=postgresql://user:password@ep-sample-123456.aws-ap-southeast-1.aws.neon.tech/neondb?sslmode=require

# Application Security
SECRET_KEY=change-me-in-production-use-a-long-random-string
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS Allowed Origins
CORS_ORIGINS=http://localhost:5173,capacitor://localhost,tauri://localhost,http://localhost

# External Service Keys
WEATHER_API_KEY=29b21b5a2f9aca2282088c7c61c30ea2
VAPID_PRIVATE_KEY=
VAPID_PUBLIC_KEY=

# Runtime Environment
ENVIRONMENT=production
DEBUG=false
PORT=7860

# Frontend REST API Endpoint
VITE_API_URL=http://localhost:8000
```

#### 24/7 Hugging Face Spaces & Container Write Permissions
- **Base Image**: `python:3.12-slim` (`backend/Dockerfile`).
- **Dynamic Port Binding**: `$PORT` defaults to `7860` for Hugging Face Spaces / `8000` for local execution:
  ```dockerfile
  ENV PORT=7860
  EXPOSE 7860 8000
  CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-7860}"]
  ```
- **Non-Root Directory Permissions**: Hugging Face Spaces executes containers under unprivileged random UIDs. `backend/Dockerfile` configures recursive write permissions on `/app/data`:
  ```dockerfile
  RUN mkdir -p /app/data && chmod -R 777 /app/data
  ```

---

### 3. Service Architecture Summary

#### Alarm Scheduler (`alarmScheduler.ts`)
- Integrates `@capacitor/local-notifications` for Android/iOS native push notifications.
- Configures high-priority channel `pcc_alarms_channel` (`importance: 5`, `visibility: 1`, `sound: 'alarm.wav'`).
- Converts UUID strings to deterministic numeric notification IDs via FNV-1a hashing algorithm (`alarmIdToNumericId` with `100000000+` offset).
- Schedules wakeups during OS low-power doze mode via `schedule: { at: targetDate, allowWhileIdle: true }`.
- Web browser fallback via `triggerWebNotification()` (`Notification` API with `requireInteraction: true`).

#### Permission Service (`permissionService.ts`)
- Provides unified cross-platform status check (`checkPermissions()`) and permission requester (`requestNotificationPermission()`, `requestLocationPermission()`).
- Prevents UI blocking during browser geolocation prompts via a 3000ms race-condition timeout safeguard.
- Concurrent non-blocking requester `requestAllPermissions()` using `Promise.allSettled`.

#### Mobile-Desktop Cross-Sync (`useAutoSync.ts`)
- Mounted globally in `AppShell.tsx` to orchestrate 7 domain stores (`alarms`, `reminders`, `tasks`, `notes`, `projects`, `events`, `ideas`).
- Executes background synchronization across 4 lifecycle triggers:
  1. *Component Mount*: Immediate fetch on initialization.
  2. *Visibility Toggle*: `visibilitychange` listener when tab becomes visible.
  3. *Native Mobile Resume*: Capacitor `appStateChange` listener when app returns to foreground.
  4. *Background Heartbeat*: 60-second periodic timer loop when online.

#### Ringing Alarm Queue & Audio Synthesizer (`AppShell.tsx`, `audio.ts`)
- 1-second ticker loop in `AppShell.tsx` matching current time against active alarm schedules.
- Deduplication map (`triggeredSetRef`) tracking `${id}-${date}-${time}` with 24-hour timestamp auto-pruning.
- Sequential `ringingQueue` state array rendered via full-screen overlay modal (`AlarmRingingModal.tsx`).
- Web Audio API synthesizer (`soundEffects` in `utils/audio.ts`) with lazy `AudioContext` instantiation and `suspended` -> `running` state resume.

#### JSON Onboarding & Backup Service (`jsonImportService.ts`)
- Validates and sanitizes raw JSON payloads against 12 PCC data schemas (`validateAndCleanImportData`).
- Accumulates detailed validation issues (`error` vs `warning`).
- Executes batch updates (`executeDataImport`), dispatches custom `pcc-data-imported` DOM events, and triggers Zustand store re-hydration.

---

## Deployment & Verification Steps

1. **Checkout & Verification**:
   ```bash
   git checkout staging
   git pull origin staging
   ```

2. **Backend Unit Testing**:
   ```bash
   cd backend
   python -m pytest
   ```

3. **Frontend Compilation**:
   ```bash
   cd frontend
   npx tsc --noEmit
   npm run build
   ```

4. **Container Build Verification**:
   ```bash
   cd backend
   docker build -t pcc-backend .
   ```

