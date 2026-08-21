# PCC - Personal Control Center (Personal OS)

[![CI/CD Pipeline](https://github.com/ArnavKarwa07/PCC_Personal-Control-Center/actions/workflows/ci.yml/badge.svg)](https://github.com/ArnavKarwa07/PCC_Personal-Control-Center/actions)
[![Python 3.12](https://img.shields.io/badge/Python-3.12-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com/)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57.svg)](https://www.sqlite.org/)
[![React 18](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0+-646CFF.svg)](https://vitejs.dev/)

PCC is a personal operating system built to integrate daily tasks, project management, knowledge bases, unified scheduling, environmental telemetry, and real-time reminders into a high-performance desktop web and mobile PWA application.

---

## Core Standards & Architectural Highlights

- **Default Location & Currency**: Default location standard set to **Pune, India** with **₹ (INR)** currency format.
- **Theme Priority**: Light Mode (`html[data-theme='light']`) prioritized by default, backed by a secondary dark glassmorphic mode toggle.
- **Unified Knowledge System**: Unified **Notes** module combining markdown notes, documentation workspace, and knowledge base.
- **Iconography**: Clean, crisp monochromatic SVG icons (`stroke="currentColor"`) matching modern design system tokens.
- **Command Architecture**: Global `Ctrl+K` CommandPalette providing instant navigation and search (replacing standalone search pages).
- **Streamlined Scope**: Deprecated legacy/redundant modules including Life Management, Periodic Reviews, World Clocks Planner, and Career & Growth.

---

## Architecture & Directory Structure

```text
PCC_Personal-Control-Center/
├── frontend/                 # React 18 + TypeScript + Vite 5 SPA
│   ├── src/
│   │   ├── components/       # Design System UI components & CommandPalette (Cmd+K)
│   │   ├── features/         # Feature modules (Tasks, Projects, Notes, Ideas, Calendar, Goals, Contacts, Reminders, Alarms, Timers, Weather, Settings)
│   │   ├── hooks/            # Custom React hooks (useTasks, useProjects, useToast, etc.)
│   │   ├── layouts/          # AppShell, DesktopLayout, MobileLayout
│   │   ├── services/         # Typed API clients (api.ts)
│   │   ├── stores/           # Zustand state management stores
│   │   ├── styles/           # CSS design tokens (index.css)
│   │   ├── types/            # TypeScript models & interfaces
│   │   └── utils/            # Audio synthesizer, date formatting, helpers
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
│   ├── tests/                # Pytest unit and integration test suite (59 tests)
│   ├── requirements.txt      # Python dependencies
│   └── Dockerfile            # Backend container configuration
│
├── docs/                     # PRD v1.0 & TRD v1.0 baseline documentation
├── docker-compose.yml        # SQLite 3 + FastAPI + Worker manifest
├── Makefile                  # Project orchestration commands
└── README.md
```

---

## Quick Start Guide

### Prerequisites
- Node.js 18+ & npm
- Python 3.12+
- Docker & Docker Compose (optional)

### 1. Backend & Database Setup
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

# Run database migrations to initialize SQLite database
alembic upgrade head

# Start FastAPI development server (port 8000)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Interactive OpenAPI documentation will be available at [http://localhost:8000/docs](http://localhost:8000/docs).

### 2. Background Worker Engine
In a separate terminal:
```bash
cd backend
python -m worker.main
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server (port 5173)
npm run dev
```
Access the application in your browser at [http://localhost:5173](http://localhost:5173).

---

## Verification & Testing

### Backend Unit & Integration Tests (71 tests pass)
```bash
cd backend
python -m pytest -v
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

## Production Docker Deployment

To launch the full containerized production stack:
```bash
docker-compose up -d --build
```

---

## License

Copyright © 2026. All rights reserved.

