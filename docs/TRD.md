# PCC - Personal Control Center

## Technical Requirements Document (TRD)

**Product:** PCC
**Version:** 1.0
**Architecture:** Web + PWA + API
**Primary deployment:** Cloud-hosted application
**Primary database:** SQLite 3

---

# 1. Technical Objective

Build PCC as a production-quality, modular application that:

* Works on desktop browsers
* Works on mobile browsers
* Can be installed as a PWA
* Shares one backend and database
* Supports offline-first core functionality
* Supports push notifications
* Supports external integrations
* Can eventually be packaged as a native mobile application

The architecture must allow new modules to be added without rewriting the core platform.

## Core Technical & System Standards
* **Default Location Standard**: Pune, India (IN) for default weather telemetry and location context.
* **Currency Standard**: ₹ (INR - Indian Rupee) default across financial and transaction fields.
* **Theme Priority**: Light Theme by default (`html[data-theme='light']`), backed by toggleable dark glassmorphism.
* **UI Components & Icons**: Monochromatic SVG icons (`stroke="currentColor"`) matching modern design system tokens.
* **Active Modules**: Tasks (with Kanban Board), Projects, Calendar, Goals (with clean progress wheels), Notes, Ideas, Contacts, Reminders, Alarms, Timers, Weather (Pune default), Settings (Integrations & JSON Onboarding Loader).
* **Deprecated / Removed Modules**: Life Management, Periodic Reviews, World Clocks Planner, and Career & Growth.

---

# 2. Recommended Stack

## Frontend

* React
* TypeScript
* Vite
* React Router
* TanStack Query
* Zustand or equivalent lightweight state management
* Component-based design system
* Progressive Web App support

## Backend

* Python
* FastAPI
* Pydantic
* SQLAlchemy

## Database

* SQLite 3

## Background Processing

A queue/worker architecture for:

* Notifications
* Recurring task generation
* External synchronization
* Scheduled jobs
* AI processing
* Analytics generation

## Storage

Object storage for:

* Uploaded documents
* Images
* Attachments
* Export files

---

# 3. High-Level Architecture

```text
                         PCC Client
                            |
              +-------------+-------------+
              |                           |
        Desktop Browser             Mobile PWA
              |                           |
              +-------------+-------------+
                            |
                         HTTPS
                            |
                       API Gateway
                            |
                         FastAPI
                            |
       +--------------------+--------------------+
       |                    |                    |
   Application          Integration          Auth
     Services             Services            Layer
       |                    |                    |
       +--------------------+--------------------+
                            |
                          SQLite
                            |
              +-------------+-------------+
              |                           |
          Background                  Object Storage
           Workers
              |
       Notifications
       Automations
       Sync
       AI
```

---

# 4. Frontend Architecture

Recommended structure:

```text
src/
  app/
  components/
  features/
    dashboard/
    tasks/
    projects/
    calendar/
    reminders/
    alarms/
    timers/
    goals/
    notes/
    ideas/
    career/
    contacts/
    notifications/
  hooks/
  services/
  stores/
  layouts/
  routes/
  utils/
  types/
```

Each feature should be isolated enough to evolve independently.

---

# 5. Frontend Design Architecture

PCC should use reusable components.

Core component families:

* Button
* Input
* Select
* Modal
* Drawer
* Card
* Table
* Data grid
* Tabs
* Dropdown
* Toast
* Command palette
* Calendar
* Kanban card
* Kanban column
* Widget
* Timeline
* Progress indicator

The visual system should use shared tokens for:

* Typography
* Spacing
* Radius
* Shadows
* Breakpoints
* Component states

---

# 6. Responsive Design

Breakpoints should support:

* Large desktop
* Desktop
* Tablet
* Mobile

Desktop should use:

* Sidebar
* Multi-column layouts
* Dense information display

Mobile should use:

* Bottom navigation
* Stacked cards
* Drawers
* Bottom sheets
* Floating Quick Add
* Swipe interactions

---

# 7. Mobile Architecture

PCC should initially be implemented as a PWA.

Required:

* Web app manifest
* Service worker
* Offline cache
* Install prompt
* App icons
* Splash screen where supported
* Push notifications
* Responsive UI

Native packaging can later use a framework such as Capacitor when deeper OS APIs become necessary.

---

# 8. Backend Structure

Recommended:

```text
backend/
  app/
    main.py
    core/
    auth/
    users/
    tasks/
    projects/
    boards/
    calendar/
    reminders/
    alarms/
    timers/
    goals/
    notes/
    ideas/
    reviews/
    career/
    learning/
    knowledge/
    contacts/
    documents/
    finance/
    fitness/
    notifications/
    integrations/
    automations/
    ai/
    analytics/
```

Each module should contain:

* Router
* Service
* Repository/data access
* Schemas
* Models
* Tests

---

# 9. Database Architecture

Core tables should include:

```text
users
user_settings

tasks
task_recurrences
task_dependencies
task_tags

projects
project_members
project_tags

boards
board_columns
board_cards

calendar_events

reminders
alarms
timers

goals
goal_milestones

notes
ideas

reviews
review_entries

achievements
resume_versions
skills
certifications
experiences

learning_items

contacts

documents

finance_items
subscriptions

workouts
exercises

notifications

automations
automation_runs

integrations
integration_tokens

activities

tags
```

---

# 10. Database Principles

Every major entity should have:

```text
id
user_id
created_at
updated_at
deleted_at
```

Soft deletion should be preferred where recovery is useful.

Database constraints must enforce user-level ownership.

---

# 11. Authentication

Authentication should support:

### MVP

* Email
* Password
* Session management
* Logout
* Password reset

### Future

* Google OAuth
* Apple Sign-In
* GitHub OAuth
* Passkeys

Passwords must never be stored in plaintext.

---

# 12. Authorization

Even though PCC initially targets one user, all records should be associated with a user account.

Every API query must enforce:

```text
resource.user_id == authenticated_user.id
```

No endpoint should rely on frontend filtering for authorization.

---

# 13. API Design

REST API initially.

Example:

```text
GET    /api/v1/tasks
POST   /api/v1/tasks
GET    /api/v1/tasks/{id}
PATCH  /api/v1/tasks/{id}
DELETE /api/v1/tasks/{id}
```

Same convention should apply across modules.

---

# 14. API Response Structure

Responses should be consistent.

Example:

```json
{
  "data": {},
  "meta": {}
}
```

Errors:

```json
{
  "error": {
    "code": "TASK_NOT_FOUND",
    "message": "Task not found"
  }
}
```

---

# 15. Pagination

Large endpoints must support pagination.

Preferred:

* Cursor-based pagination for activity/history feeds
* Offset pagination where practical

---

# 16. Validation

Backend validation is mandatory.

Use schema validation for:

* Dates
* Timezones
* Enum values
* IDs
* Recurrence rules
* External URLs
* User-controlled text

Frontend validation should improve UX but must never replace backend validation.

---

# 17. Task Engine

Task lifecycle:

```text
Inbox
  ↓
Todo
  ↓
In Progress
  ↓
Waiting
  ↓
Done
```

Cancellation can occur from any active state.

Recurring tasks should generate task instances based on recurrence rules.

The recurrence definition must be separate from the generated task instance.

---

# 18. Recurrence Engine

The recurrence engine should support:

* Daily
* Weekly
* Monthly
* Yearly
* Custom intervals
* Specific weekdays
* End dates
* Occurrence limits

The system should use timezone-aware date calculations.

---

# 19. Reminder Engine

Reminder processing should:

1. Identify reminders approaching execution time.
2. Generate a notification.
3. Deliver through the appropriate channel.
4. Record delivery state.
5. Retry failed deliveries where appropriate.

---

# 20. Notification Architecture

Notification types:

```text
IN_APP
WEB_PUSH
EMAIL
NATIVE
```

The notification service should abstract delivery channels.

Example:

```text
Notification
    ↓
Notification Service
    ↓
Channel Adapter
    ├── In-App
    ├── Push
    └── Email
```

---

# 21. Automation Engine

Automation structure:

```text
Trigger
   ↓
Conditions
   ↓
Actions
```

Example:

```text
Sunday 20:00
   ↓
Create weekly review
   ↓
Send notification
```

Automation executions should be logged.

---

# 22. Background Jobs

Workers should handle:

* Recurring task generation
* Notification scheduling
* Weather refresh
* GitHub sync
* Calendar sync
* Automation execution
* Daily briefing generation
* Analytics aggregation
* AI jobs
* Cleanup jobs

---

# 23. Job Queue

A reliable queue system should be used for scheduled and asynchronous tasks.

Jobs must support:

* Retry
* Idempotency
* Failure logging
* Dead-letter handling
* Execution timestamps

---

# 24. Calendar System

Calendar events should be stored internally.

External integrations should map external events to internal event representations.

Every event should have:

* Start
* End
* Timezone
* Title
* Description
* Source
* External ID where applicable

---

# 25. External Calendar Sync

Potential providers:

* Google Calendar
* Microsoft Calendar
* Apple Calendar where technically feasible

Sync must maintain external identifiers.

Changes should be tracked using:

```text
source
external_id
last_synced_at
sync_version
```

---

# 26. GitHub Integration

OAuth-based connection.

Possible synchronized data:

* Repositories
* Issues
* Pull requests
* Releases
* Commits

PCC should store synchronization metadata and avoid unnecessarily duplicating large datasets.

---

# 27. Weather Service

Weather should be abstracted behind a service interface.

Example:

```text
WeatherService
   ↓
Provider Adapter
   ↓
Normalized Weather Model
```

This allows the provider to be changed without redesigning the frontend.

---

# 28. World Clock Service

World clocks can use the IANA timezone database.

Store:

```text
timezone
display_name
enabled
sort_order
```

All times should be rendered in the user's configured timezone unless explicitly overridden.

---

# 29. Timezone Handling

Timezone support is critical.

User profile should store:

* Primary timezone
* Locale
* Date format
* Time format

All persisted timestamps should use UTC.

Display should convert to local timezone.

---

# 30. Offline Architecture

Core application state should be cached locally.

Recommended:

* IndexedDB
* Service worker
* Local query cache

Offline operations should create a local mutation queue.

Example:

```text
User completes task
        ↓
Local state updates immediately
        ↓
Mutation queued
        ↓
Connectivity restored
        ↓
Server synchronization
```

---

# 31. Synchronization

Sync must handle:

* New entities
* Updates
* Deletes
* Conflicts
* Offline-created records

Every record should contain a server-compatible identifier.

Optimistic UI should be used where appropriate.

---

# 32. Conflict Resolution

For most user-owned records:

Default strategy:

**Last-write-wins using version/timestamp**, with explicit conflict handling for records where data loss could occur.

Future versions can use field-level merges.

---

# 33. Search Architecture

Initial search can use SQLite full-text search (FTS5).

Searchable fields:

* Titles
* Descriptions
* Notes
* Tags
* Project names
* People
* Achievements

Later, introduce:

* SQLite FTS5 index optimizations
* Vector embeddings
* Semantic search

---

# 34. AI Architecture

AI should exist as a separate service layer.

```text
PCC
 ↓
AI Service
 ↓
Context Builder
 ↓
LLM Provider
 ↓
Structured response
```

The context builder decides which PCC data can be sent to the model.

AI should not have unrestricted database access.

---

# 35. AI Safety Architecture

AI actions should be categorized:

### Read-only

Examples:

* Summarize week
* Find stale projects
* Suggest priorities

### Low-risk mutation

Examples:

* Create draft task
* Categorize note

### High-risk mutation

Examples:

* Delete project
* Send external communication
* Modify important documents

High-risk actions require explicit confirmation.

---

# 36. File Storage

Documents should be stored outside SQLite.

Database stores:

* File ID
* Filename
* MIME type
* Size
* Storage path
* Hash
* Owner
* Created date

Object storage should be used for actual files.

---

# 37. Audit Logging

Important operations should be logged:

* Login
* Logout
* Account changes
* Integration changes
* Data deletion
* Export
* Automation execution

Audit logs should be immutable from the application layer.

---

# 38. Security Requirements

Must include:

* TLS
* Secure cookies/tokens
* Password hashing
* CSRF protection where relevant
* XSS prevention
* SQL injection protection
* Rate limiting
* File validation
* Authorization checks
* Secret encryption
* Secure headers

---

# 39. Secrets Management

API keys and OAuth tokens must never be committed to source control.

Production secrets should be managed through secure environment configuration or a secrets manager.

---

# 40. Database Backups

Production database must support:

* Automated backups
* Point-in-time recovery where supported
* Backup retention
* Restore testing

A backup that has never been restored should not be considered validated.

---

# 41. Observability

Production system should provide:

* Structured logs
* Error tracking
* API latency metrics
* Background job metrics
* Database health metrics
* Availability monitoring

---

# 42. Performance Requirements

Target initial expectations:

### Dashboard

Cached dashboard should appear rapidly on repeat visits.

### API

Typical CRUD requests should target sub-second response time under normal load.

### Interaction

Task completion and similar UI actions should feel immediate through optimistic updates.

### Mobile

Avoid unnecessarily large bundles and expensive rendering on low-end devices.

---

# 43. Scalability

The first version only needs to support a small user base.

However, architecture should allow:

* Horizontal API scaling
* Separate workers
* Database connection pooling
* Cache layer later
* Object storage
* CDN

---

# 44. Testing Strategy

Testing layers:

### Unit Tests

* Services
* Utilities
* Recurrence engine
* Date handling
* Validation

### Integration Tests

* API + database
* Authentication
* Task lifecycle
* Automations
* Notifications

### End-to-End Tests

Critical user journeys:

* Login
* Create task
* Complete task
* Create project
* Move Kanban card
* Create reminder
* Weekly review
* Install PWA
* Offline mutation
* Reconnect/sync

---

# 45. Mobile Testing

Must test:

* Small Android devices
* Large Android devices
* iPhone-sized devices
* Landscape mode where relevant
* Touch interaction
* Keyboard behavior
* Safe areas
* Push notification permissions
* Offline behavior

---

# 46. Accessibility

Target WCAG AA-level accessibility.

Requirements:

* Keyboard navigation
* Visible focus states
* Semantic HTML
* Screen-reader labels
* Adequate contrast
* Reduced-motion support
* Accessible forms
* Touch targets large enough for mobile

---

# 47. Progressive Web App Requirements

Manifest must define:

* Name
* Short name
* Icons
* Theme
* Background
* Start URL
* Display mode

Service worker must provide:

* App shell caching
* Offline support
* Update handling

---

# 48. Deployment

Recommended environments:

```text
Development
Staging
Production
```

Each environment should have separate:

* Database
* Secrets
* OAuth credentials
* Storage
* API configuration

---

# 49. CI/CD

Every change should pass:

1. Lint
2. Type checking
3. Unit tests
4. Integration tests
5. Build
6. Deployment validation

Production deployment should be automated.

---

# 50. Versioning

API should use versioned routes:

```text
/api/v1/
```

Breaking API changes should introduce a new version.

---

# 51. Error Handling

Frontend should provide:

* User-friendly errors
* Retry
* Offline indicators
* Unsaved state warnings

Backend should provide:

* Structured error codes
* Safe messages
* Detailed internal logs

---

# 52. Settings

Settings categories:

### Account

* Name
* Email
* Password
* Sessions

### Appearance

* Theme
* Accent
* Density
* Widget layout

### Time

* Timezone
* Date format
* Time format

### Notifications

* Push
* Email
* Reminder defaults
* Quiet hours

### Dashboard

* Default dashboard
* Widget configuration

### Integrations

* Google
* GitHub
* Weather provider

### Privacy

* AI permissions
* Data export
* Connected services

---

# 53. Data Export Architecture

Export service should generate:

* JSON
* CSV
* Markdown

Optional:

* PDF reports

Exports should be generated asynchronously for large datasets.

---

# 54. Disaster Recovery

The system should support:

* Database restore
* Object-storage recovery
* Configuration recreation
* User data export

Recovery procedures should be documented and periodically tested.

---

# 55. Recommended Development Order

## Phase 1: Foundation

* Repository
* Frontend shell
* Backend shell
* Database
* Authentication
* Design system
* Deployment pipeline

## Phase 2: Core Productivity

* Tasks
* Projects
* Kanban
* Calendar
* Reminders
* Recurrence
* Notifications

## Phase 3: Personal OS

* Goals
* Reviews
* Notes
* Ideas
* Dashboard widgets
* Weather
* Clocks
* Timers
* Alarms

## Phase 4: Personal Data

* Career
* Resume
* Achievements
* Learning
* Contacts
* Documents

## Phase 5: Integrations

* GitHub
* Google Calendar
* Additional services

## Phase 6: Intelligence

* AI assistant
* Smart summaries
* Personal context engine
* Recommendations

## Phase 7: Advanced Mobile

* Native wrapper
* Native notifications
* Background functionality
* Deeper device integrations

---

# 56. Initial Repository Structure

```text
pcc/
├── frontend/
│   ├── src/
│   ├── public/
│   └── tests/
│
├── backend/
│   ├── app/
│   ├── migrations/
│   └── tests/
│
├── worker/
│
├── shared/
│
├── infrastructure/
│
├── docs/
│
├── .env.example
├── docker-compose.yml
└── README.md
```

---

# 57. Engineering Rules

The implementation should follow these rules:

1. Type-safe frontend.
2. Strong backend validation.
3. No business logic duplicated unnecessarily between frontend and backend.
4. Every feature should have tests.
5. No credentials in source control.
6. Every major entity must have clear ownership.
7. API contracts must be explicit.
8. Core functionality must work without AI.
9. Integration failures must not break PCC.
10. New modules should use existing shared infrastructure.

---

# 58. Definition of Done

A feature is complete when:

* UI is implemented
* API exists
* Database schema exists
* Validation exists
* Error handling exists
* Mobile layout works
* Accessibility is considered
* Tests exist
* Offline behavior is defined if relevant
* Loading/empty/error states exist
* Documentation is updated

---

# 59. MVP Technical Definition

The first production-capable PCC build should include:

### Frontend

* React
* TypeScript
* Responsive layout
* PWA
* Routing
* State management
* Query caching
* Dashboard widgets

### Backend

* FastAPI
* Authentication
* REST API
* SQLite 3
* Background jobs
* Notifications

### Core Features

* Tasks
* Projects
* Kanban
* Calendar
* Reminders
* Recurrence
* Goals
* Weekly reviews
* Notes
* Ideas
* Alarms
* Timers
* Clock
* Weather
* Search

### Platform

* Desktop web
* Mobile web
* Installable PWA
* Offline core functionality

---

# 60. Long-Term Architecture Goal

The final PCC architecture should evolve into:

```text
                    ┌────────────────────────┐
                    │         PCC UI         │
                    │ Web + Mobile + PWA     │
                    └───────────┬────────────┘
                                │
                         Personal API
                                │
        ┌───────────────┬───────┴────────┬───────────────┐
        │               │                │               │
   Productivity     Personal Data    Integrations       AI
        │               │                │               │
 Tasks / Projects   Career / Goals     GitHub /        Context
 Calendar / Reviews Knowledge / Life   Calendar /      Engine
        │               │              Weather           │
        └───────────────┴───────┬────────┴───────────────┘
                                │
                          Personal Data Layer
                                │
                              SQLite
                                │
                      ┌─────────┴─────────┐
                      │                   │
                 Object Storage      Background Jobs
```

The central architectural idea is that **PCC's modules should all operate on the same underlying personal data model**.

That is what allows a task to become part of a project, a project to contribute to a goal, the goal to appear in a weekly review, the completed work to become an achievement, and the achievement to later feed the resume.

---

# 61. Final Technical Principle

PCC should be designed as a **platform first and a collection of features second**.

The first implementation does not need every possible feature.

It needs a strong foundation that makes adding the next feature cheap, predictable, and consistent.

The most important architectural decision is therefore:

> **Build the core personal data model, task/project engine, event/notification system, automation engine, and responsive application shell correctly. Everything else becomes a module on top of that foundation.**
