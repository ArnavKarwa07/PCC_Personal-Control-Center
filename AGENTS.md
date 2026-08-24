# Antigravity Agent Guidelines & Workflow Rules - PCC Project

## 1. Branching & Git Release Rules ( THIS IS TO BE IGNORED DURING DEPLOYMENTS AND PROD BUILDS )
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

## 5. API Response Envelope & Field Mapping Standards (CRITICAL LESSONS)
- **Response Envelope Unwrapping**:
  - Backend list/paginated REST endpoints return `{ "data": [ ... ], "meta": { ... } }`.
  - In `frontend/src/services/api.ts`, `normalizeApiResponse` MUST preserve `{ data: normalizeItem(resJson.data), meta: resJson.meta }` when `meta` is present.
  - NEVER add guards like `!('meta' in resJson)` that cause `normalizeApiResponse` to skip unwrapping `data` or drop `meta`.
  - Feature API helpers (e.g. `tasksApi.getAll()`, `notesApi.getAll()`) MUST handle both raw arrays `res` and wrapped array payloads `res.data`.
- **Symmetric Field Name Normalization & Payload Sanitization**:
  - **NEVER** assume frontend TypeScript interface keys match backend Pydantic model field names without inspecting `backend/app/schemas/`.
  - Always implement paired `normalizeX(data)` (response unwrapping) and `sanitizeXPayload(data)` (request serialization) functions for every domain entity in `frontend/src/services/api.ts`:
    - **Notes**: Map `is_pinned` / `isPinned` <-> `pinned` symmetrically.
    - **Ideas Promotion**: Send `{ promote_to: promotion.type, target_name: promotion.title, target_project_id: promotion.projectId }` matching `IdeaPromoteRequest`.
    - **Calendar Events**: Map `start_time` / `end_time` / `event_type` / `all_day` <-> `startDate` / `endDate` / `type` / `isAllDay`.
    - **Goals**: Map `name` <-> `title`, and calculate `progress = (current / target) * 100` dynamically when `progress` is undefined and `target > 0`.
    - **Reminders**: Map `completed` -> `status: 'completed'|'pending'`, and format ISO `remind_at` <-> `dueDate` + `dueTime` (ensure single-digit time string padding `09:00`).

## 6. Tauri Desktop & Security Guidelines
- **Tauri Plugin Configuration**: In `tauri.conf.json`, plugin objects under `"plugins"` must be omitted or `null` unless custom options exist. Passing `{}` causes `PluginInitialization` deserialization panics on startup.
- **Window Label Declaration**: Always declare `"label": "main"` in `tauri.conf.json` under `"app" -> "windows"` array to match `capabilities/default.json` and Rust IPC window handles.
- **Safe Window IPC Result Handling**: Replaced `.unwrap()` calls in `frontend/src-tauri/src/lib.rs` with safe `let _ = ...` handles to prevent panics during OS window events.
- **Credential Security & Sanitization**: NEVER commit raw database passwords, Neon connection strings, or secrets into markdown files, release notes, or git logs. Use `<REDACTED_PASSWORD>` placeholders.
