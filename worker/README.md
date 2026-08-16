# Background Worker Service

This directory contains the background job workers, scheduled tasks, and asynchronous job processing components for the Personal Control Center (PCC).

## Responsibilities
- Scheduled tasks (e.g. cron triggers, reminder evaluations, periodic data sync)
- Asynchronous task queues and event consumption (e.g. background notification delivery, analytics aggregation)
- External integration polling (e.g. calendar, weather, or IoT status checks)

## Architecture
- Integrates with backend shared models and database polling for task processing.
- Executes independently of the main API server to ensure non-blocking HTTP request processing.
