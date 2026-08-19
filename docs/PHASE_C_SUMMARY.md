# PCC Phase C Summary - Knowledge Base & Idea Promotion Workflow

## Overview

Phase C delivered the Personal Knowledge Base modules of PCC, comprising a split-pane Markdown Notes workspace, live syntax-highlighted Markdown editor/previewer, pinned notes organization, a 4-stage Idea Incubator board, an automatic Idea Promotion API converting sparks into active Tasks or Projects, and search indexing integration.

---

## Architectural Decisions

### 1. Split-Pane Notes Workspace
- **Debounced Auto-Save**: Text mutations trigger a 1500ms debounced persistence call to `/api/v1/notes/{id}` accompanied by a UI auto-save indicator ("Saving..." -> "Saved").
- **Live Markdown Renderer**: Integrated custom previewer (`MarkdownPreview.tsx`) supporting headers, syntax-highlighted code blocks, task list checkboxes, and blockquotes.

### 2. Idea Incubator & Promotion Engine
Ideas progress through 4 lifecycle stages:
$$\text{Captured} \longrightarrow \text{Exploring} \longrightarrow \text{Promoted} \longrightarrow \text{Archived}$$

- **Idea Promotion API** (`/api/v1/ideas/{id}/promote`):
  - Converts an Idea into either a **Project** or a **Task**.
  - Automatically sets status to `promoted`, links the generated entity ID (`promoted_entity_id`), and stores the target type (`promoted_entity_type`).

---

## API Route Definitions

### Notes API (`/api/v1/notes`)

| Method | Endpoint | Description | Query / Request Payload | Response Envelope |
|---|---|---|---|---|
| `GET` | `/api/v1/notes` | List notes with pinned/category filters | `category`, `is_pinned`, `search` | `{ "data": [NoteResponse], "meta": ... }` |
| `POST` | `/api/v1/notes` | Create new note | `NoteCreate` | `{ "data": NoteResponse }` |
| `GET` | `/api/v1/notes/{id}` | Get note content | None | `{ "data": NoteResponse }` |
| `PATCH` | `/api/v1/notes/{id}` | Update note content / pin status | `NoteUpdate` | `{ "data": NoteResponse }` |
| `DELETE` | `/api/v1/notes/{id}` | Soft delete note | None | `{ "data": { "message": "Deleted" } }` |

### Ideas Incubator API (`/api/v1/ideas`)

| Method | Endpoint | Description | Query / Request Payload | Response Envelope |
|---|---|---|---|---|
| `GET` | `/api/v1/ideas` | List ideas by status | `status`, `impact`, `effort` | `{ "data": [IdeaResponse], "meta": ... }` |
| `POST` | `/api/v1/ideas` | Capture new idea spark | `IdeaCreate` | `{ "data": IdeaResponse }` |
| `PATCH` | `/api/v1/ideas/{id}` | Update status or matrix | `IdeaUpdate` | `{ "data": IdeaResponse }` |
| `POST` | `/api/v1/ideas/{id}/promote` | Convert Idea to Task/Project | `IdeaPromoteRequest` (type, title) | `{ "data": IdeaResponse }` |
| `DELETE` | `/api/v1/ideas/{id}` | Soft delete idea | None | `{ "data": { "message": "Deleted" } }` |

---

## Database Schemas & Models

### `notes` & `ideas` Table Schemas
```sql
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    category VARCHAR(50) DEFAULT 'General' NOT NULL,
    is_pinned BOOLEAN DEFAULT FALSE NOT NULL,
    tags VARCHAR(255)[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE ideas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'captured' NOT NULL,
    impact VARCHAR(20) DEFAULT 'medium' NOT NULL,
    effort VARCHAR(20) DEFAULT 'medium' NOT NULL,
    promoted_entity_type VARCHAR(50),
    promoted_entity_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);
```

---

## Testing & Verification Results

### Pytest Verification Output
```text
tests/test_notes_ideas.py::test_notes_crud_and_pin PASSED                [ 20%]
tests/test_notes_ideas.py::test_ideas_crud_and_filtering PASSED          [ 40%]
tests/test_notes_ideas.py::test_promote_idea_to_project PASSED           [ 60%]
tests/test_notes_ideas.py::test_promote_idea_to_task PASSED              [ 80%]
tests/test_notes_ideas.py::test_notes_ideas_multi_user_isolation PASSED  [100%]

============================== 5 passed in 4.12s ==============================
```
