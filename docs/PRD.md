# PCC - Personal Control Center

## Product Requirements Document (PRD)

**Product:** PCC
**Full Name:** Personal Control Center
**Version:** 1.0
**Status:** Product Definition
**Primary User:** Arnav
**Platforms:** Desktop Web, Mobile Web, Installable Mobile App
**Product Type:** Personal Operating System / Productivity Platform

---

# 1. Executive Summary

PCC is a centralized personal operating system designed to manage all major areas of Arnav's life from one application.

The system combines:

* Tasks
* Projects
* Kanban boards
* Calendar
* Reminders
* Recurring tasks
* Alarms
* Timers
* Weekly reviews
* Goals
* Career management
* Resume tracking
* Personal website maintenance
* GitHub/development tracking
* Learning
* Notes
* Ideas
* Personal CRM
* Documents
* Finance
* Fitness
* Weather
* World clocks
* Notifications
* Automation
* Personal analytics
* AI-assisted planning

PCC should become the single source of truth for personal and professional activity.

The product should not feel like a collection of unrelated tools. All modules should share a common data model and be interconnected.

---

# 2. Vision

PCC should answer four questions immediately:

1. What is happening right now?
2. What needs my attention?
3. What is coming next?
4. What have I been neglecting?

The long-term vision is for PCC to become an intelligent personal control center that understands the user's current context and helps manage it.

---

# 3. Problem Statement

Important information is normally scattered across multiple applications.

Examples:

* Tasks in one application
* Calendar elsewhere
* GitHub projects elsewhere
* Resume in files
* Career achievements in memory
* Reminders in a phone app
* Notes in another application
* Weekly reviews in ChatGPT
* Learning resources in bookmarks
* Personal goals in spreadsheets
* Alarms and timers in the phone
* Weather and clocks in separate widgets

This fragmentation creates:

* Repeated data entry
* Missed tasks
* Forgotten projects
* Poor visibility into priorities
* Difficulty reviewing progress
* Maintenance overhead

PCC solves this by bringing the information into one connected system.

---

# 4. Product Goals

## Primary Goals

### G1. Centralize personal information

Create one reliable source for tasks, projects, goals, schedules, career information, ideas, and personal administration.

### G2. Reduce cognitive overhead

The user should not need to remember where something is stored.

### G3. Make daily planning effortless

Opening PCC should provide an accurate picture of the day.

### G4. Automate recurring administration

Recurring activities such as weekly reviews should happen automatically.

### G5. Maintain long-term history

PCC should preserve accomplishments, progress, decisions, and activity history.

### G6. Work everywhere

The system should work on desktop and phone using the same data and account.

### G7. Build toward intelligent assistance

AI should eventually analyze PCC data and provide useful recommendations.

---

# 5. Non-Goals

PCC should not initially attempt to become:

* A full enterprise project management system
* A social network
* A complete accounting system
* A full health platform
* A complete communication replacement
* A replacement for GitHub
* A replacement for a full calendar provider

PCC should integrate with specialized services where appropriate.

---

# 6. Target User

The primary user is one technically sophisticated individual managing:

* College
* Internship/work
* Software projects
* Data/AI work
* Career development
* Learning
* Personal goals
* Fitness
* Personal administration
* Side projects

PCC should be designed specifically for this workflow rather than generalized for large organizations.

---

# 7. Core Product Principles

## 7.1 Single Source of Truth

A piece of information should be entered once.

## 7.2 Everything is Connected

A task may belong to a project, contribute to a goal, have a deadline, relate to a person, and appear in a review.

## 7.3 Quick Capture First

Creating a task, reminder, note, idea, or event must be extremely fast.

## 7.4 Dashboard Before Navigation

The system should surface relevant information rather than requiring the user to find it.

## 7.5 Automation Over Administration

Recurring processes should require minimal manual maintenance.

## 7.6 Mobile Is a First-Class Experience

The mobile application should not simply be the desktop website scaled down.

## 7.7 Data Ownership

The user should be able to export their complete PCC dataset.

---

# 8. Information Architecture

Top-level navigation:

* Home
* Tasks
* Projects
* Calendar
* Goals
* Contacts
* Career
* More

Global controls:

* Command Palette (Ctrl/Cmd + K - Global Search & Actions)
* Quick Add
* Notifications
* Profile/settings

## Core Platform Standards

* **Default Location**: Pune, India (IN) with ₹ (INR) currency standard.
* **Theme Priority**: Light Theme by default (`html[data-theme='light']`), with dark glassmorphism as toggleable option.
* **Unified Naming**: Unified "Notes" module for knowledge notes & docs.
* **Iconography**: Clean, monochromatic SVG icons (`stroke="currentColor"`).
* **Deprecated/Removed Features**: Life Management, Periodic Reviews, World Clocks Planner, and Career & Growth features have been removed to maintain focus and zero clutter.

---

# 9. Home Dashboard

Home is the primary entry point.

## 9.1 Header

Display:

* Current date
* Current time
* Weather
* Location
* Search
* Notifications
* Quick Add
* Profile

## 9.2 Today

Display:

* Tasks
* Events
* Reminders
* Deadlines
* Alarms
* Timers

## 9.3 Priority Panel

Show:

* Top priorities
* Overdue tasks
* Tasks due soon
* Blocked items
* Important upcoming events

## 9.4 Projects

Show:

* Active projects
* Project progress
* Recent activity
* Projects becoming stale

## 9.5 Goals

Show:

* Current goals
* Progress
* Upcoming milestones

## 9.6 Personal Pulse

Optional widgets for:

* Fitness
* Learning
* Career
* Finance
* Habits

## 9.7 Daily Briefing

A configurable summary of the day.

---

# 10. Dashboard Widget System

Widgets are modular.

Initial widgets:

* Clock
* World clocks
* Weather
* Tasks
* Calendar
* Projects
* Goals
* Weekly review
* Notifications
* Timers
* Alarms
* GitHub
* Learning
* Career
* Fitness
* Finance
* Ideas
* Notes

Users should be able to:

* Add widgets
* Remove widgets
* Reorder widgets
* Resize widgets
* Configure widget content

---

# 11. Task Management

Tasks are a core entity.

## Task properties

* ID
* Title
* Description
* Status
* Priority
* Due date
* Due time
* Reminder
* Recurrence
* Project
* Goal
* Tags
* Dependencies
* Estimated duration
* Actual duration
* Notes
* Attachments
* Created date
* Updated date
* Completed date

## Statuses

* Inbox
* Todo
* In Progress
* Waiting
* Done
* Cancelled

## Views

* Today
* Upcoming
* Overdue
* Inbox
* Completed
* Recurring
* Calendar
* Kanban

---

# 12. Quick Capture

Global Quick Add must support:

* Task
* Reminder
* Event
* Note
* Idea
* Project
* Goal
* Contact

The system should support natural-language input.

Example:

"Remind me tomorrow at 8 PM to update my resume."

Expected output:

* Entity: Reminder
* Date: tomorrow
* Time: 8 PM
* Notification: enabled

---

# 13. Projects

Every project gets its own workspace.

Project data:

* Name
* Description
* Status
* Priority
* Owner
* Start date
* Deadline
* Progress
* Tags
* Tasks
* Boards
* Notes
* Files
* Links
* GitHub repositories
* People
* Goals
* Activity

Project statuses:

* Idea
* Planned
* Active
* Paused
* Completed
* Archived

---

# 14. Kanban Boards

Boards support:

* Custom columns
* Drag-and-drop
* Task cards
* Labels
* Priorities
* Assignees
* Due dates
* Filters
* Sorting
* Swimlanes later

Default columns:

* Backlog
* Planned
* In Progress
* Testing
* Done

---

# 15. Calendar

PCC should provide a unified calendar.

Supported views:

* Day
* Week
* Month
* Agenda

Calendar item types:

* Event
* Meeting
* Task
* Deadline
* Reminder
* Appointment
* Personal event

External integrations should be supported later.

---

# 16. Recurring Tasks

Recurring entities should support:

* Daily
* Weekly
* Monthly
* Yearly
* Custom interval
* Weekdays
* Specific day of month
* End date
* Maximum occurrences
* Reminder time

Example:

Weekly review every Sunday.

When one occurrence completes, the next occurrence should be generated automatically.

---

# 17. Weekly Review

Weekly Review is a first-class PCC feature.

## Review sections

### Week in Review

* Tasks completed
* Projects progressed
* Goals progressed
* Events attended
* Achievements
* Things learned

### Outstanding

* Unfinished tasks
* Overdue tasks
* Stale projects
* Upcoming deadlines

### Reflection

* What went well?
* What went poorly?
* What was postponed?
* What should change?

### Next Week

* Main priorities
* Important projects
* Upcoming events
* Learning priorities
* Personal priorities

The review should be stored permanently.

---

# 18. Daily Briefing

The daily briefing should include:

* Weather
* Calendar
* Important reminders
* Today's priorities
* Overdue work
* Upcoming deadlines
* Active projects
* Goals
* Suggested priorities

The user should be able to configure the briefing time.

---

# 19. Evening Review

Optional automated workflow.

At a configured time:

* Show completed work
* Ask about unfinished tasks
* Capture accomplishments
* Move tasks forward
* Preview tomorrow

---

# 20. Goals

Goals should support hierarchy.

Example:

2026 Goal
→ Career Growth
→ Build Portfolio
→ Complete Project X
→ Implement Feature Y

Goal properties:

* Name
* Description
* Time period
* Progress
* Status
* Parent goal
* Child goals
* Tasks
* Projects
* Milestones

---

# 21. Career Center

Career module should store:

* Education
* Experience
* Skills
* Certifications
* Projects
* Achievements
* Resume versions
* Career goals

It should support multiple resume versions.

---

# 22. Resume Tracking

PCC should allow the user to track:

* Resume versions
* Last updated date
* Version notes
* Target role
* Resume content
* Relevant achievements

PCC should detect when new achievements have been added since the last resume update.

---

# 23. Online Presence

Track maintenance of:

* LinkedIn
* GitHub
* Personal website
* Portfolio
* Resume

Each profile can have:

* Last updated date
* Pending changes
* Planned changes
* Completed changes

---

# 24. Achievement Database

Store:

* Achievement
* Date
* Description
* Category
* Related project
* Evidence
* Resume relevance
* LinkedIn relevance

Achievements should persist permanently.

---

# 25. Developer Center

Potential GitHub data:

* Repositories
* Issues
* Pull requests
* Branches
* Releases
* Commits
* Deployment information

PCC should surface relevant GitHub activity but not replace GitHub.

---

# 26. Learning Center

Track:

* Technologies
* Courses
* Certifications
* Books
* Videos
* Tutorials
* Learning goals
* Progress

Learning status:

* Saved
* Planned
* Learning
* Practicing
* Completed

---

# 27. Knowledge Vault

Store:

* Notes
* Articles
* URLs
* YouTube videos
* Papers
* Books
* Tutorials
* Code snippets
* Concepts
* Ideas

Everything should be searchable and taggable.

---

# 28. Ideas Inbox

A low-friction inbox for unstructured content.

Examples:

* Business idea
* App idea
* Feature idea
* Learning topic
* Website improvement
* Research idea

Items can later become:

* Task
* Project
* Note
* Learning item
* Goal
* Archive

---

# 29. Personal CRM

Store lightweight relationship data:

* Name
* Organization
* Role
* Email
* Phone
* LinkedIn
* Notes
* Last interaction
* Next follow-up

---

# 30. Reminders

Support:

* One-time reminders
* Recurring reminders
* Date/time reminders
* Snooze
* Complete
* Reschedule

---

# 31. Alarms

Support:

* One-time alarm
* Recurring alarm
* Label
* Snooze
* Enable/disable
* Custom sound where supported

Native behavior will depend on mobile operating-system restrictions.

---

# 32. Timers

Support:

* Countdown
* Stopwatch
* Pomodoro
* Custom presets
* Persistent timer state

---

# 33. World Clocks

Allow multiple locations.

Example:

* India
* London
* New York
* Singapore

Users can add/remove clocks.

---

# 34. Weather

Display:

* Current weather
* Temperature
* Feels like
* Wind
* Humidity
* Forecast
* Sunrise
* Sunset

Location should be configurable manually or through permission.

---

# 35. Finance

Initial finance module:

* Income
* Expenses
* Budgets
* Subscriptions
* Upcoming payments
* Savings goals

This should remain lightweight in the initial releases.

---

# 36. Fitness

Optional module:

* Workout routines
* Exercises
* Sets
* Reps
* Weights
* Cardio
* Personal records
* Goals

---

# 37. Documents

Store metadata for:

* Certificates
* Resumes
* Important files
* IDs
* Contracts
* Project files

Each document may have:

* Expiration date
* Tags
* Related project
* Category

---

# 38. Notifications

Unified notification center.

Notification types:

* Task reminder
* Upcoming event
* Deadline
* Recurring task
* Weekly review
* Project alert
* Integration update
* System notification

Users can customize notifications globally.

---

# 39. Search

Global search must cover the entire PCC database.

Search entities:

* Tasks
* Projects
* Notes
* Goals
* People
* Events
* Achievements
* Ideas
* Documents
* Learning items
* GitHub data

Future natural-language search:

"What have I not worked on recently?"

---

# 40. Command Palette

Desktop command palette:

**Ctrl/Cmd + K**

Capabilities:

* Search
* Create task
* Create note
* Start timer
* Set reminder
* Open project
* Navigate
* Open review
* Open calendar

---

# 41. Automation Engine

Automations should support:

**Trigger → Conditions → Action**

Examples:

* Every Sunday → create weekly review
* Every month → remind to update resume
* 3 days before deadline → notify
* If project inactive for 7 days → flag project
* Every Monday morning → generate weekly priorities

The automation engine should eventually support custom workflows.

---

# 42. AI Assistant

AI should operate on PCC's data.

Capabilities:

* Daily planning
* Weekly review summaries
* Monthly summaries
* Project analysis
* Resume suggestions
* Achievement detection
* Natural language task creation
* Knowledge search
* Planning suggestions

AI suggestions must always be distinguishable from actual stored information.

---

# 43. Personal Analytics

Metrics may include:

* Tasks completed
* Tasks overdue
* Projects active
* Project stagnation
* Goal completion
* Learning progress
* Review completion
* Activity trends

Analytics should emphasize useful insights over excessive charts.

---

# 44. Activity Timeline

PCC should maintain an activity log.

Examples:

* Created task
* Completed task
* Created project
* Updated resume
* Completed review
* Added achievement
* Created note

This provides a personal history.

---

# 45. Mobile Experience

Mobile app must prioritize:

* Home
* Quick Add
* Tasks
* Calendar
* Notifications
* Timers
* Alarms
* Search

Bottom navigation:

**Home | Tasks | Calendar | Projects | More**

Floating Quick Add should be globally available.

---

# 46. Offline Support

Core functionality must work offline:

* Tasks
* Notes
* Projects
* Goals
* Calendar data
* Timers
* Basic dashboard

Changes synchronize when connectivity returns.

---

# 47. Security

Minimum requirements:

* HTTPS
* Password hashing
* Secure sessions
* Authentication controls
* Rate limiting
* Input validation
* Database authorization
* Encrypted integration credentials
* Secure backups

---

# 48. Data Ownership

Users must be able to:

* Export data
* Download backups
* Delete account
* Disconnect integrations

Export formats should include JSON and CSV where appropriate.

---

# 49. MVP Scope

The MVP should contain:

* Authentication
* Home dashboard
* Tasks
* Projects
* Kanban
* Calendar
* Reminders
* Recurring tasks
* Weekly review
* Goals
* Notes
* Ideas
* Alarms
* Timers
* Clock
* Weather
* Notifications
* Search
* Responsive UI
* PWA
* Offline core functionality

---

# 50. Phase 2

Add:

* Career
* Resume
* Achievements
* GitHub
* Learning
* Personal CRM
* Documents
* External calendar integration
* Dashboard customization
* Daily briefing
* Evening review

---

# 51. Phase 3

Add:

* AI assistant
* Personal context engine
* Smart recommendations
* Advanced analytics
* Finance
* Fitness
* Native mobile packaging
* Advanced automation
* More integrations

---

# 52. Success Metrics

PCC should measure product usefulness through:

* Daily active usage
* Tasks created/completed
* Weekly review completion
* Number of recurring workflows
* Dashboard usage
* Mobile usage
* Search usage
* Quick Add usage
* Automation usage

The most important qualitative metric is:

> **Does PCC reduce the number of places the user needs to check every day?**
