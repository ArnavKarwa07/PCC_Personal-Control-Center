# Changelog

All notable changes to the PCC (Personal Control Center) project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.1] - 2026-08-20

### Added
- **Contacts Page Glassmorphic Empty State**:
  - Added clean "No Contacts Found" `EmptyState` card with monochromatic vector SVG icon and interactive "Add Contact" CTA button in `ContactsPage.tsx`.

### Changed
- **LocalStorage Mock Data Auto-Purge**:
  - Implemented complete localStorage mock data auto-purge across all 7 primary domain stores (`alarmStore`, `taskStore`, `noteStore`, `reminderStore`, `ideaStore`, `projectStore`, `calendarStore`).
  - Clears legacy mock data from local storage on store initialization (`pcc_*_store_v1`), guaranteeing a clean-slate workspace while preserving explicit user imports.

### Refactored & Mobile Layout Improvements
- **Notes Workspace Mobile Layout**:
  - Re-aligned the Grid/List icon view switcher on the same horizontal row as the Notes filter select dropdown (`#notes-mobile-filter`).
- **Reminders Workspace Mobile Layout**:
  - Aligned the Status filter and Category filter select dropdowns into a single horizontal row (`grid-template-columns: 1fr 1fr`) on mobile viewports.
- **Settings Workspace Mobile Layout**:
  - Reorganized Settings page on screens `<= 768px` into 4 continuous scrolling sections stacked vertically (Preferences, Active Modules, Integrations, Data Management) instead of top tabs.
- **Comprehensive 320px Responsive Support**:
  - Implemented comprehensive 320px responsive UI support across all views, eliminating horizontal scrolling, element clipping, and layout distortion on ultra-small screens.

## [1.3.0] - 2026-08-20

### Added
- **Live API Workflows Integration**:
  - **Weather Telemetry API**: Connected live Weather service to Open-Meteo REST API (with OpenWeatherMap fallback), defaulting to Pune, IN (`18.5204° N, 73.8567° E`) with metric units (`°C`, `km/h`, `hPa`) and dynamic geolocation auto-detection.
  - **Goals & OKRs Matrix**: Integrated live backend REST endpoints (`/api/v1/goals/objectives`, `/api/v1/goals/key-results`) for objective lifecycle management, key result progress rollups, and interactive skill tree visualization.
  - **Contacts & Personal CRM**: Connected live backend endpoints (`/api/v1/contacts`) for contact record management, interaction logging, organizational filtering, and automated catch-up reminders.
  - **Calendar & Scheduling**: Full live backend REST integration (`/api/v1/calendar/events`) supporting day, week, month grid rendering, event recurrence rules, and time-block allocation.
  - **AI Executive Daily Briefing**: Live AI Assistant endpoint (`/api/v1/ai/assistant/daily-briefing`) synthesizing active tasks, upcoming calendar events, pending reminders, and live weather telemetry into executive morning briefs.
- **Glassmorphic Empty State UX Improvements**:
  - Implemented standardized `EmptyState` component (`EmptyState.tsx`, `EmptyState.css`) featuring glassmorphism backdrop blur (`backdrop-filter: blur(12px)`), crisp slate borders, monochromatic vector SVG iconography (`stroke="currentColor"`), and contextual Call-To-Action (CTA) action buttons.
  - Added guided CTA buttons across all empty feature views ("Create Task", "Add Project", "Schedule Event", "Create Goal", "Add Contact", "Set Reminder", "Create Note", "Add Idea", "Set Alarm", "Start Timer") to guide users seamlessly from empty workspace to active productivity.

### Changed
- **Zero Dummy Data Workspace Transition**:
  - Purged 100% of hardcoded dummy sample data and mock initial states across all 11 Zustand stores (`taskStore.ts`, `projectStore.ts`, `calendarStore.ts`, `noteStore.ts`, `ideaStore.ts`, `reminderStore.ts`, `alarmStore.ts`, `timerStore.ts`, `weatherStore.ts`, `notificationStore.ts`, `integrationStore.ts`) and feature views.
  - Established a clean-slate workspace initializing empty arrays (`[]`), `null` states, and zeroed counters on fresh installation.
  - Preserved optional local JSON data seeding framework (`pcc_data.json`) via Settings -> Data Management tab for users who wish to import sample data on demand.

### Compliance & Quality Assurance
- **AGENTS.md Guideline Adherence**:
  - **Git Branching Rules**: Strict development and commit workflow targeting `origin/staging` (never direct commit/merge to `main`).
  - **Localization Standards**: India (IN) set as default country, Pune, India as default weather location, and ₹ (INR - Indian Rupee) as default currency across all financial and telemetry views.
  - **Design & Aesthetic Standards**: Light theme default (`html[data-theme='light']`) with dark glassmorphism option, 100% monochromatic vector SVG iconography (zero emojis), and unified brand logo artwork (`/logo.png`).
  - **Module Scope Integrity**: Enforced 11 active core modules (Tasks, Projects, Calendar, Goals, Notes, Ideas, Contacts, Reminders, Alarms, Timers, Weather) and Settings, adhering strictly to deprecation of legacy modules.
- **Empirical Verification**: 
  - `npx tsc --noEmit`: 0 TypeScript compiler errors.
  - `npm run build`: Vite production bundle generated successfully.
  - `python -m pytest`: 93/93 backend tests passing (100% success rate).

## [1.2.0] - 2026-08-20

### Added
- **Google Keep-Style Notes Application Refactor**: Overhauled the Notes module into a clean, modern Keep-style knowledge capture workspace (`NotesWorkspace.tsx`, `noteStore.ts`).
  - **Explicit Page Header**: Added semantic `<h1>Notes</h1>` top page header for standard page layout consistency.
  - **100% Emoji Removal & Vector SVG Icons**: Replaced 100% of emojis with clean, monochromatic vector SVG icons (`stroke="currentColor"` / `fill="currentColor"`) across all note cards, filter tabs, quick bar buttons, editor modals, and trash banners.
  - **Feature Simplification**: Completely removed legacy categories and archive features to streamline note management and storage lifecycle.
  - **Mobile Filter Consolidation**: Consolidated mobile filter tabs into 1 single, responsive dropdown `<select>` block (`#notes-mobile-filter`) for seamless mobile UX.
  - **Filter Accuracy Bug Fix**: Fixed note filtering and search accuracy to cleanly partition pinned vs unpinned notes without item duplicates or state collision.
  - **Interactive Checklists**: Support for checklist notes with inline item creation, completion toggles, keyboard focus navigation (`Enter`/`Backspace`), and completion progress badges.
  - **Custom Color Themes**: 6 vibrant theme palettes (`default`, `lavender`, `emerald`, `amber`, `rose`, `sky`) with adaptive card backgrounds and accent borders for light/dark glassmorphism themes.
  - **Trash Lifecycle Management**: Trash note state transitions (`active`, `pinned`, `trashed`) with single-click restore and "Empty Trash" purge actions.
  - **Gallery & List View Options**: Dynamic view mode toggle between multi-column responsive grid card view and streamlined single-column list layout (`grid` vs `list`).
  - **Quick Creation Input Bar**: Expandable top creation bar for single-click note/checklist creation directly from the main view.
  - **Markdown & Split-View Editor**: Multi-tab text editor mode (`edit`, `split`, `preview`) with live GFM rendering (`MarkdownPreview.tsx`), auto-focus, scroll locking, and debounced auto-save.

### Changed
- **Note State Store & Storage Compatibility**: Enhanced `useNoteStore` Zustand store with robust API sync and localStorage fallback (`pcc_notes_store_v1`) supporting new schema attributes without breaking existing user data.

## [1.1.0] - 2026-08-20

### Changed
- **Timer Module Renaming**: Renamed "World Clocks Planner" module to **Timers** across top navigation, sidebar, and routing components (`TimersPage.tsx`) in strict compliance with `AGENTS.md` module scope.
- **Alarm Store Formatting**: Updated `alarmStore.ts` next alarm metric logic to cleanly format alarm times (`Next at HH:MM`) without trailing string artifacts.

### Refactored & Fixed (11 UI Fixes)
1. **Header Branding & Notification Badging (Image 1)**
   - Removed redundant "PCC" text next to the brand logo image in desktop and mobile headers (`DesktopLayout.tsx`, `MobileLayout.tsx`).
   - Fixed notification badge positioning, padding, border isolation, and z-index overlap in `DesktopLayout.css` and `MobileLayout.css`.

2. **Weather Hero Card & Telemetry Hierarchy (Image 2)**
   - Redesigned Weather view (`WeatherPage.tsx`, `Weather.css`) with clean quick metric badges (Pressure, Sunrise/Sunset, Rain Chance, Humidity, Wind).
   - Added interactive search clear button and responsive telemetry grid for Pune, IN defaults.

3. **AI Assistant Widget & FAB Positioning (Image 3)**
   - Standardized floating AI Assistant widget trigger button (`AIAssistantWidget.css`) with safe-area spacing above mobile bottom navigation.
   - Prevented drawer clipping on mobile viewports.

4. **Tasks Filter Bar & Mobile View Selectors (Image 4)**
   - Overhauled Task Filter bar responsive layout (`TasksPage.tsx`, `Tasks.css`, `index.css`).
   - Added mobile-optimized `<select>` dropdown for view mode toggles and wrapped filter controls to prevent horizontal overflow on screens < 768px.

5. **Notes Workspace Toolbar & Card Aesthetics (Image 5)**
   - Fixed Notes workspace toolbar button wrapping and alignment (`NotesWorkspace.tsx`, `Notes.css`).
   - Removed extra hover outlines and refined card status tags.

6. **Ideas Board Layout & Tag Styling (Image 6)**
   - Cleaned up Ideas card layout, tag padding, and hover actions (`Ideas.css`, `KanbanBoard.css`).
   - Removed duplicate border artifacts.

7. **Reminders Quick Filter & Form Layout (Image 7)**
   - Restructured Reminders dashboard header (`RemindersPage.tsx`, `Reminders.css`, `index.css`).
   - Added 2-column mobile stats grid and responsive filter pills (All, Upcoming, Recurring, High Priority).

8. **Settings Module Management & Data Loader UI (Image 8)**
   - Redesigned Settings workspace (`SettingsPage.tsx`, `Settings.css`) into categorized card sections (Preferences, Active Modules, Integrations, Data Management).
   - Fixed JSON Onboarding import/export action triggers and toggle switch alignments.

9. **Global Brand Logo Asset Optimization (Image 9)**
   - Updated `/logo.png` image asset with optimized branding artwork.
   - Ensured unified logo display across favicon, desktop sidebar, and mobile top bar per `AGENTS.md`.

10. **Mobile Navigation Spacing & Safe-Area Padding (Image 10)**
    - Adjusted mobile layout viewport containers (`MobileLayout.css`) with `min-height: 100dvh` and dynamic `padding-bottom: calc(var(--bottom-nav-height) + 96px)`.
    - Fixed FAB bottom positioning (`calc(var(--bottom-nav-height) + 16px)`), eliminating bottom bar overlaps.

11. **Timer Module Renaming & Next Alarm Badge Cleanliness**
    - Completed transition of timer/clock features to the simplified "Timers" module.
    - Sanitized next alarm badge labels in `alarmStore.ts`.

### Verified Production Readiness
- `npx tsc --noEmit`: 0 errors.
- `npm run build`: Vite production bundle generated successfully.
- Target branch: `origin/staging`.
