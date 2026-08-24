# Developer & AI Agent Lessons Learned — PCC Project

This document provides technical principles, post-mortem findings, and architectural guidelines established during the PCC v1.0.0 release cycle to prevent future regressions.

---

## 1. Response Envelope Unwrapping (`api.ts`)

### Problem & Root Cause
Backend list endpoints return JSON envelopes formatted as:
```json
{
  "data": [ ... ],
  "meta": { "total": 10, "page": 1, "per_page": 20, "total_pages": 1 }
}
```
Previously, `normalizeApiResponse` checked `!('meta' in resJson)`. Because `meta` was present, `normalizeApiResponse` refused to unwrap `resJson.data` and returned the raw object `{ data: [...], meta: {...} }`. Feature API functions checking `Array.isArray(res)` evaluated to `false`, causing all feature stores to receive empty arrays `[]`.

### Mandatory Architectural Rule
- In `frontend/src/services/api.ts`, `normalizeApiResponse` MUST handle envelopes containing `meta` by returning:
  ```typescript
  return {
    data: normalizeItem(resJson.data),
    meta: resJson.meta || resJson.pagination,
  };
  ```
- All feature API `getAll()` functions MUST extract array items safely:
  ```typescript
  const items = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
  ```

---

## 2. Symmetric Schema Normalization & Payload Sanitization

### Problem & Root Cause
Frontend TypeScript interfaces use `camelCase` (e.g. `startDate`, `dueDate`, `isPinned`, `completed`), while backend FastAPI Pydantic models use `snake_case` or specific field names (`start_time`, `due_date`, `is_pinned`, `status`, `remind_at`, `name`). Passing raw frontend objects to backend endpoints caused **HTTP 422 Unprocessable Entity** errors or silent data loss.

### Mandatory Architectural Rule
Every domain entity in `frontend/src/services/api.ts` MUST implement paired functions:
1. `normalize<Entity>(data)`: Maps backend response fields (both camelCase and snake_case) into complete frontend interfaces.
2. `sanitize<Entity>Payload(data)`: Prepares clean payloads for POST/PATCH requests, removing frontend-only properties (`createdAt`, `updatedAt`, `columnId`, `subtasks`) and converting keys to backend Pydantic model names.

#### Feature Contract Reference Matrix:
| Domain | Frontend Fields | Backend Pydantic Fields | Key Sanitization Behavior |
| :--- | :--- | :--- | :--- |
| **Tasks** | `dueDate`, `projectId`, `completed` | `due_date`, `project_id`, `status: 'done'\|'in_progress'\|'todo'` | Convert status 'completed' -> 'done'; strip empty recurrence |
| **Notes** | `pinned` | `is_pinned` | Map `pinned`/`isPinned` <-> `is_pinned` |
| **Ideas** | `promote(type, title, projectId)` | `promote_to`, `target_name`, `target_project_id` | Pass `target_project_id` to link promoted task to project |
| **Calendar** | `startDate`, `endDate`, `type`, `isAllDay` | `start_time`, `end_time`, `event_type`, `all_day` | Map all-day boolean aliases symmetrically |
| **Goals** | `title`, `target`, `current`, `progress` | `name`, `progress` (0.0 to 100.0) | Map `title` -> `name`; calculate `progress = (current / target) * 100` |
| **Reminders**| `dueDate`, `dueTime`, `completed` | `remind_at` (ISO string), `status: 'completed'\|'pending'` | Pad single digit hours (`09:00`); convert `dueDate` + `dueTime` -> ISO |

---

## 3. Tauri v2 Desktop Launcher Diagnostics & Crash Prevention

### Problem & Root Cause
In `tauri.conf.json`, passing `"plugins": { "notification": {} }` caused a Rust deserialization panic on app launch (`PluginInitialization("notification", ...)`). Omitting `"label": "main"` caused `app.get_webview_window("main")` to fail.

### Mandatory Architectural Rule
- In `tauri.conf.json`, plugin objects under `"plugins"` must be omitted or `null` unless custom options are required.
- Always specify `"label": "main"` in `tauri.conf.json` under `"app" -> "windows"`.
- In Rust native code (`lib.rs`), replace `.unwrap()` on window IPC calls with safe handles:
  ```rust
  let _ = window.show();
  let _ = window.set_focus();
  ```

---

## 4. Credential Security & Redaction

### Mandatory Security Rule
- **NEVER** commit raw database credentials, Neon connection passwords (`postgresql://user:pass@host`), or API tokens into markdown documentation, PR notes, or git commits.
- Always use `<REDACTED_NEON_PASSWORD>` placeholders in docs.
