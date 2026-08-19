# Antigravity Agent Guidelines & Workflow Rules - PCC Project

## 1. Branching & Git Release Rules
- **CRITICAL**: Code must **ONLY** be committed and pushed to the `staging` branch (`origin/staging`).
- **NEVER** push directly to or merge with `main`. The user manually handles all production merges to `main`.
- Every push to `staging` must be accompanied by empirical verification (zero TypeScript errors, 100% passing pytest suite).

## 2. Localization & Currency Standards
- Default Country Assumption: **India (IN)**.
- Default Location Standard: **Pune, India** (default weather telemetry & location).
- Default Currency Symbol: **₹ (INR - Indian Rupee)**.
- **NEVER** default to `$` (USD) or non-INR currencies unless explicitly requested.

## 3. Design & Aesthetic Standards
- **Theme Priority**: Light Theme by default (`html[data-theme='light']`), with dark glassmorphism as a secondary toggleable option.
- **Brand Identity**: Main logo is `/logo.png`. The favicon and logo must remain identical.
- **UI Components & Icons**: Use glassmorphism tokens, rich subtle borders, smooth micro-interactions, and clean monochromatic SVG icons (`stroke="currentColor"`).
- Module Scope & Naming:
  - Active Modules: Tasks (with Kanban Board), Projects, Calendar, Goals (with clean progress wheels), Notes, Ideas, Contacts, Reminders, Alarms, Timers, Weather (Pune, IN default), Settings (Integrations & JSON Onboarding Loader).
  - Deprecated / Removed Modules: Life Management, Periodic Reviews, World Clocks Planner, and Career & Growth.

## 4. Onboarding & Data Seeding
- Avoid hardcoded dummy data where possible.
- Provide a clean JSON Onboarding & Import/Export framework allowing users to seed their Personal OS from a `pcc_data.json` file.
