# PCC - Personal Control Center (Personal OS)

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

PCC is a personal operating system built to integrate daily tasks, project management, knowledge bases, unified scheduling, environmental telemetry, and real-time reminders into a high-performance desktop web, desktop native app (Tauri v2), and mobile native app (Capacitor v6) application.

---

## Core Standards & Architectural Highlights

- **Default Location & Currency**: Default location standard set to **Pune, India** with **₹ (INR)** currency format.
- **Theme Priority**: Light Mode (`html[data-theme='light']`) prioritized by default, backed by a secondary dark glassmorphic mode toggle.
- **Database Engine Support**: Native support for **Neon serverless PostgreSQL** (`postgresql://...sslmode=require`) in production and **SQLite 3** for offline local development.
- **Cross-Platform Delivery**: Standalone native Android APKs (Capacitor v6) and cross-platform Desktop installers (Tauri v2 for Windows, macOS, Linux).
- **24/7 Cloud Execution**: Lightweight Docker runtime (`backend/Dockerfile`, `docker-compose.yml`) supporting Hugging Face Spaces, Koyeb, and self-hosted container environments.
- **Iconography**: Clean, crisp monochromatic SVG icons (`stroke="currentColor"`) matching modern design system tokens.
- **Command Architecture**: Global `Ctrl+K` CommandPalette providing instant navigation and search.

---

## Architecture & Directory Structure

```text
PCC_Personal-Control-Center/
├── frontend/                 # React 18 + TypeScript + Vite 5 SPA & Native App Shell
│   ├── android/              # Capacitor v6 Android Gradle project (`./gradlew assembleDebug`)
│   ├── src-tauri/            # Tauri v2 Desktop configuration & Rust manifest (`tauri.conf.json`)
│   ├── capacitor.config.json # Capacitor v6 mobile configuration
│   ├── src/
│   │   ├── components/       # Design System UI components & CommandPalette (Cmd+K)
│   │   ├── features/         # Core feature modules (Tasks, Projects, Notes, Ideas, Calendar, Goals, Contacts, Reminders, Alarms, Timers, Weather, Settings)
│   │   ├── hooks/            # Custom React hooks (useTasks, useProjects, useToast, etc.)
│   │   ├── layouts/          # AppShell, DesktopLayout, MobileLayout
│   │   ├── services/         # Typed API clients (api.ts)
│   │   ├── stores/           # Zustand state management stores
│   │   └── types/            # TypeScript models & interfaces
│   └── vite.config.ts        # Vite configuration (port 5173, path aliases)
│
├── backend/                  # FastAPI + SQLAlchemy 2.0 REST API
│   ├── app/
│   │   ├── api/v1/           # REST endpoints (auth, tasks, projects, notes, ideas, calendar, reminders, alarms, timers, weather, integrations)
│   │   ├── core/             # Configuration, database session, security, dependencies
│   │   ├── models/           # SQLAlchemy database entities (BaseModel with UUID & soft deletion)
│   │   ├── schemas/          # Pydantic v2 request/response envelopes
│   │   └── services/         # Business logic layer
│   ├── worker/               # Async background worker loop (main.py)
│   ├── tests/                # Pytest unit and integration test suite (104 tests)
│   ├── requirements.txt      # Python dependencies
│   └── Dockerfile            # 24/7 Production backend container configuration
│
├── .github/
│   └── workflows/
│       ├── ci.yml            # CI test runner pipeline
│       └── build-release.yml # GitHub Actions Android APK & Tauri v2 Desktop release pipeline
├── docs/                     # PRD, TRD, Architecture & Migration Notes (`MIGRATION_NOTES.md`)
├── docker-compose.yml        # PostgreSQL / SQLite + FastAPI + Worker multi-container manifest
├── .env.example              # Production & development environment variable template
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

## Cross-Platform Application Packaging

### Android Native App (Capacitor v6)
```bash
cd frontend

# 1. Build Vite web assets
npm run build

# 2. Sync assets with Android platform
npx cap sync android

# 3. Build Debug APK with Gradle
cd android
./gradlew assembleDebug
```
The compiled Android APK will be located at `frontend/android/app/build/outputs/apk/debug/app-debug.apk`.

### Native Desktop App (Tauri v2)
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

### 24/7 Docker Container Deployment
Launch the full production stack via Docker Compose:
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
The `.github/workflows/build-release.yml` pipeline automatically triggers on pushes to `main`:
1. **Android APK Job**: Compiles `app-debug.apk` using Java 17 and Gradle.
2. **Desktop Release Job**: Executes matrix builds on `windows-latest`, `macos-latest`, and `ubuntu-latest` to build cross-platform desktop installers.
3. **GitHub Release Publication**: Uploads all compiled binaries directly to GitHub Releases.

---

## Verification & Testing

### Backend Unit & Integration Tests (104 tests passing)
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

Copyright © 2026. All rights reserved.


