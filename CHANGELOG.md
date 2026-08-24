# Changelog

All notable changes to the PCC (Personal Control Center) project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v1.0.0] - 2026-08-24

### Official Production Release Highlights (v1.0.0 Final)
This official `v1.0.0` release establishes the production release of PCC (Personal Control Center). It initializes the fresh single-tenant Neon PostgreSQL database instance (`holy-cell-73614246`) on AWS Singapore (`aws-ap-southeast-1`), executes full Alembic migrations creating all 28 core tables, establishes full synchronization between Web/Mobile/Desktop clients and the backend API, provides Vercel serverless Python deployment (`api/index.py`), offline-first sync mutation queue, native Tauri v2 desktop system tray background alarm persistence, Android Capacitor v6 alarm notification channels, AI Executive Assistant integration (Gemini 2.0 Flash), enterprise third-party connectors (Teams, Slack, GitLab, Jira) with sensitive credential masking, Google Keep-style Notes workspace, and desktop launch diagnostics.

### Core Enhancements & Features
- **Fresh Active Neon Database Provisioning & Schema Migration**:
  - Provisioned single-tenant Neon PostgreSQL instance (`holy-cell-73614246` / `ep-odd-bonus-azdke95p` on `aws-ap-southeast-1`).
  - Executed Alembic migration `105cb739b3f8_initial_single_tenant_schema` creating all 28 database tables (tasks, projects, calendar, goals, notes, ideas, contacts, reminders, alarms, timers, weather, notifications, integrations, automations, etc.).
- **Desktop Launcher Diagnostics**:
  - Enhanced `start_desktop.bat` with automated Rust toolchain (`cargo`/`rustc`) validation, providing user instructions if Rust is missing on the host.
- **Frontend & Backend Sync Stabilization**:
  - Verified REST API endpoint compatibility across all core modules with zero schema mismatch.
- **Vercel Serverless Architecture & Python Bridge (`api/index.py`)**:
  - Implemented root serverless wrapper (`api/index.py`) importing FastAPI `app` from `backend.app.main` with dynamic `sys.path` resolution for `@vercel/python`.
  - Configured modern `vercel.json` wildcard rewrites (`/(.*)` -> `/api/index.py`).
  - Decommissioned legacy Google Cloud Run and Google Container Registry infrastructure.
- **Neon PostgreSQL Connection Resilience & NullPool Handling**:
  - Enforced `sslmode=require` TLS parameters for Neon serverless PostgreSQL connection URIs.
  - Implemented `NullPool` allocation under Vercel serverless lambda execution to prevent DB connection pool exhaustion, alongside 5-minute pool recycling (`pool_recycle=300`) and pre-ping verification (`pool_pre_ping=True`) for stateful servers.
- **Offline-First Mutation Queue & Background Auto-Sync**:
  - Client-side persistent mutation queue service (`frontend/src/services/syncQueue.ts`) backed by `localStorage` (`pcc_sync_queue`).
  - Intelligent mutation deduplication, batch merging, auto-flush on reconnection (`online` event), app visibility changes, and periodic sync triggers with exponential backoff.
- **Native Desktop Alarm Scheduling & System Tray Integration (Tauri v2)**:
  - Configured Tauri v2 desktop runtime (`frontend/src-tauri/`) with native system tray menu integration ("Show PCC" and "Quit").
  - Close-to-tray background persistence (`window.hide()` and `api.prevent_close()`), ensuring continuous background alarm monitoring without process interruption.
- **Capacitor 6 Native Notification Channels & Custom Audio Asset (Android)**:
  - Dedicated high-priority native notification channel (`pcc_alarms_channel`) with MAX importance (level 5), public lockscreen visibility, custom vibration, and bundled `alarm.wav` audio asset.
  - Low-power OS doze-mode wakeup support via `allowWhileIdle: true` on `@capacitor/local-notifications`.
- **AI Executive Assistant Service & Gemini 2.0 Flash Integration**:
  - Direct endpoint routing to `/api/v1/assistant/process_assistant_query` powered by Google Gemini 2.0 Flash (`gemini-2.0-flash`).
  - Natural language intent parsing: creates tasks (`CREATE_TASK`), notes (`CREATE_NOTE`) and synthesizes daily workspace briefings (`/assistant/get_daily_briefing`).
- **Enterprise Third-Party Integrations Expansion & Credential Masking**:
  - Integrated connectors for Microsoft Teams Calendar, Slack, GitLab, and Jira.
  - Automatic sensitive credential masking (`token`, `api_token`, `secret`, `password`) into prefix-preserved masked strings (e.g. `ghp_****`, `xoxb-****`, `glpat-****`).

### Compliance & Quality Assurance
- **Empirical Verification**:
  - `npx tsc --noEmit` & `npm run build`: 0 TypeScript compiler errors, clean Vite production bundle build.
  - `python -m pytest`: 79/79 backend unit tests passing (100% success rate).
