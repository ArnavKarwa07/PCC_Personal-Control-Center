# PCC - Personal Control Center (Personal OS)

[![Release v1.1.0-beta](https://img.shields.io/badge/Release-v1.1.0--beta-blue.svg)](https://github.com/ArnavKarwa07/PCC_Personal-Control-Center/releases)
[![CI/CD Pipeline](https://github.com/ArnavKarwa07/PCC_Personal-Control-Center/actions/workflows/ci.yml/badge.svg)](https://github.com/ArnavKarwa07/PCC_Personal-Control-Center/actions)
[![Python 3.12](https://img.shields.io/badge/Python-3.12-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com/)
[![PostgreSQL / Neon](https://img.shields.io/badge/PostgreSQL-Neon-4169E1.svg)](https://neon.tech/)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57.svg)](https://www.sqlite.org/)
[![Capacitor v6](https://img.shields.io/badge/Capacitor-v6-119EFF.svg)](https://capacitorjs.com/)
[![Tauri v2](https://img.shields.io/badge/Tauri-v2-FFC131.svg)](https://tauri.app/)
[![React 18](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0+-646CFF.svg)](https://vitejs.dev/)

PCC is a personal operating system built to integrate daily tasks, project management, knowledge bases, unified scheduling, environmental telemetry, real-time reminders, and AI assistance into a high-performance desktop web app, native desktop app (Tauri v2), and native mobile app (Capacitor v6).

---

### Core Standards & Architectural Highlights

- **Release Tag**: Consolidated **v1.1.0-beta** release.
- **Default Location & Currency**: Default location standard set to **Pune, India** with **₹ (INR)** currency format.
- **Theme Priority**: Light Mode (`html[data-theme='light']`) prioritized by default, backed by a secondary dark glassmorphic mode toggle.
- **Serverless Production Host**: Deployed on **Vercel Serverless Python** (`https://pcc-backend-ten.vercel.app`) via `@vercel/python` and root `api/index.py` router.
- **Database Engine Support**: Native support for **Neon serverless PostgreSQL** (`postgresql://...sslmode=require`) with `NullPool` serverless lambda handling and connection pool recycling (`pool_recycle=300`, `pool_pre_ping=True`) alongside **SQLite 3** for offline local development.
- **Single-Tenant Architecture**: Optimized single-tenant owner mode for Arnav Karwa (`arnavkarwa07@gmail.com`).
- **Cross-Platform Delivery**: Standalone native Android APKs (Capacitor v6) and cross-platform Desktop installers (Tauri v2 for Windows, macOS, Linux).
- **Offline-First Resilience**: Persistent client-side mutation queue (`pcc_sync_queue`) with automatic deduplication, batch merging, and auto-flush on reconnection.
- **Iconography**: Clean, crisp monochromatic SVG icons (`stroke="currentColor"`) matching modern design system tokens.
- **Command Architecture**: Global `Ctrl+K` CommandPalette providing instant navigation and search.

---

## Architecture & Directory Structure

```text
PCC_Personal-Control-Center/
├── api/                      # Vercel Serverless Python entrypoint (index.py)
├── frontend/                 # React 18 + TypeScript + Vite 5 SPA & Native App Shell
│   ├── android/              # Capacitor v6 Android Gradle project (`./gradlew assembleDebug`)
│   ├── src-tauri/            # Tauri v2 Desktop configuration & Rust manifest (`tauri.conf.json`)
│   ├── capacitor.config.json # Capacitor v6 mobile configuration
│   ├── src/
│   │   ├── components/       # Design System UI components & CommandPalette (Cmd+K)
│   │   ├── features/         # Core feature modules (Tasks, Projects, Notes, Ideas, Calendar, Goals, Contacts, Reminders, Alarms, Timers, Weather, Settings)
│   │   ├── hooks/            # Custom React hooks (useTasks, useProjects, useToast, etc.)
│   │   ├── layouts/          # AppShell, DesktopLayout, MobileLayout
│   │   ├── services/         # Typed API clients (api.ts) & mutation queue (syncQueue.ts)
│   │   ├── stores/           # Zustand state management stores
│   │   └── types/            # TypeScript models & interfaces
│   └── vite.config.ts        # Vite configuration (port 5173, path aliases)
│
├── backend/                  # FastAPI + SQLAlchemy 2.0 REST API
│   ├── app/
│   │   ├── api/v1/           # REST endpoints (tasks, projects, notes, ideas, calendar, reminders, alarms, timers, weather, integrations, assistant)
│   │   ├── core/             # Configuration (config.py with CORS_ORIGINS), database engine & pool recycling (database.py), dependencies
│   │   ├── models/           # SQLAlchemy database entities (BaseModel with UUID & soft deletion)
│   │   ├── schemas/          # Pydantic v2 request/response envelopes
│   │   └── services/         # Business logic layer & AI Assistant engine
│   ├── worker/               # Async background worker loop (main.py)
│   ├── tests/                # Pytest unit and integration test suite (79 tests passing)
│   ├── requirements.txt      # Python dependencies
│   └── Dockerfile            # Production backend container configuration
│
├── .github/
│   └── workflows/
│       ├── ci.yml            # CI test runner pipeline
│       ├── deploy-vercel.yml # Vercel backend deployment workflow
│       └── build-release.yml # GitHub Actions Android APK & Tauri v2 Desktop release pipeline
├── docs/                     # Architecture, Migration Notes (`MIGRATION_NOTES.md`), & PR Notes (`PR_NOTES.md`)
├── vercel.json               # Vercel Serverless Python route routing (@vercel/python)
├── docker-compose.yml        # PostgreSQL / SQLite + FastAPI + Worker multi-container manifest
├── .env.example              # Production & development environment variable template
├── CHANGELOG.md              # Consolidated release changelog (v1.1.0-beta)
├── MIGRATION_NOTES.md        # Migration pathways & serverless architecture specifications
├── PR_NOTES.md               # Unified PR notes for release v1.1.0-beta
├── Makefile                  # Project orchestration commands
└── README.md
```

---

## Quick Start Guide

### Prerequisites
- Node.js 20+ & npm
- Python 3.12+
- Rust stable toolchain (optional, for Tauri desktop builds)
- Java 17 & Android SDK (optional, for Capacitor Android builds)
- Docker & Docker Compose (optional)

### 1. Environment Configuration
Copy `.env.example` to `.env` and configure database connection and security parameters:
```bash
cp .env.example .env
```
For Neon PostgreSQL Cloud deployment:
```env
DATABASE_URL=postgresql://user:password@ep-sample-123456.aws-ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

### 2. Backend & Database Setup
```bash
cd backend

# Create virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations to initialize PostgreSQL / SQLite database
alembic upgrade head

# Start FastAPI development server (port 8000)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Interactive OpenAPI documentation will be available at [http://localhost:8000/docs](http://localhost:8000/docs).

### 3. Background Worker Engine
In a separate terminal:
```bash
cd backend
python -m worker.main
```

### 4. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server (port 5173)
npm run dev
```
Access the application in your browser at [http://localhost:5173](http://localhost:5173).

---

## Release Build & Cross-Platform Packaging Instructions

### 1. Web Production Build
```bash
cd frontend
# Run TypeScript compiler verification
npx tsc --noEmit

# Compile Vite production assets into dist/
npm run build
```

### 2. Android Native App (Capacitor v6)
```bash
cd frontend

# 1. Build Vite web assets
npm run build

# 2. Sync web assets into Android project
npx cap sync android

# 3. Compile Debug/Release Android APK with Gradle
cd android
./gradlew assembleDebug
```
The compiled Android APK will be located at `frontend/android/app/build/outputs/apk/debug/app-debug.apk`.

### 3. Native Desktop App (Tauri v2)
```bash
cd frontend

# Run live desktop app in development mode
npm run tauri dev

# Build production desktop installers (.exe, .dmg, .AppImage, .deb)
npm run tauri build
```
Compiled desktop bundles will be generated in `frontend/src-tauri/target/release/bundle/`.

---

## Production Deployment & CI/CD Pipelines

### Vercel Serverless Python Deployment
The production backend API is hosted at `https://pcc-backend-ten.vercel.app` powered by Vercel Serverless Python (`@vercel/python`):
- Root `vercel.json` maps wildcard path `/(.*)` to `api/index.py`.
- Entrypoint `api/index.py` dynamically injects `backend/` into `sys.path` and delegates execution to `app` in `backend/app/main.py`.
- Deploy backend updates via Vercel CLI:
  ```bash
  vercel --prod
  ```

### 24/7 Docker Container Deployment
Launch the full production container stack via Docker Compose:
```bash
docker-compose up -d --build
```
Or run the standalone backend container:
```bash
cd backend
docker build -t pcc-backend .
docker run -d -p 8000:7860 -e DATABASE_URL="postgresql://..." pcc-backend
```

### Automated GitHub Actions Release Workflow
The `.github/workflows/build-release.yml` pipeline automatically triggers on pushes to `v1.1.0-beta` tags:
1. **Version Sync**: Dynamically synchronizes version tag `v1.1.0-beta` across `package.json`, `tauri.conf.json`, `Cargo.toml`, and `build.gradle`.
2. **Android APK Job**: Compiles `PCC_v1.1.0-beta.apk` using Java 17 and Gradle.
3. **Desktop Release Job**: Executes matrix builds on `windows-latest`, `macos-latest`, and `ubuntu-latest` to build cross-platform desktop installers.
4. **GitHub Release Publication**: Uploads all compiled binaries directly to GitHub Releases.

---

## Verification & Testing

### Backend Unit & Integration Tests (79 tests passing)
```bash
cd backend
python -m pytest
```

### Frontend Type Check & Production Build
```bash
cd frontend
# TypeScript compiler check
npx tsc --noEmit

# Production build bundle
npm run build
```

---

## License

Copyright © 2026 Arnav Karwa. All rights reserved.
