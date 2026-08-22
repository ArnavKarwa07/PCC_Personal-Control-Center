# PCC Migration Notes & Upgrade Guide (`MIGRATION_NOTES.md`)

This document aggregates release migration notes, database schema upgrades, storage key transitions, deployment host environment configurations, and cross-platform setup guidelines for **Personal Control Center (PCC)**.

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
| `VITE_API_URL` | Frontend REST API endpoint URL | `http://localhost:8000` / `https://api.yourdomain.com` | Frontend |

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

### 2. Client-Side Storage & LocalStorage Migration (`pcc_integrations_store_v2`)
- **Storage Key**: `pcc_integrations_store_v2`.
- **Automatic Hydration & Preset Merging**: The `loadStoredIntegrations()` helper in `integrationStore.ts` automatically merges server integration states into preset service descriptors.

---

# PCC Migration Notes - Release v1.2.0

## Release Overview
Release `v1.2.0` introduces the Keep-style Notes Application refactor, featuring semantic `<h1>Notes</h1>` header, 100% vector SVG icons (zero emojis), removal of obsolete categories and archive features, consolidated mobile dropdown filter block, search filter accuracy fix, interactive checklists, custom color palettes, grid/list gallery toggles, quick creation input bars, and debounced auto-saving markdown editor modals.

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
