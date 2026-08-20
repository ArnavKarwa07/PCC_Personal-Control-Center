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
