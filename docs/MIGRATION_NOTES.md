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
