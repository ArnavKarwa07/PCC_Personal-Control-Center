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
| `VITE_API_URL` | Frontend REST API endpoint URL | `http://localhost:8000` / `https://api.yourdomain.com` | Frontend |

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
