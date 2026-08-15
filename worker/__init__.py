"""Root worker forwarder package."""

import os
import sys

# Ensure backend directory is in path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(CURRENT_DIR, "..", "backend")
if os.path.exists(BACKEND_DIR) and BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from worker.main import (
    dispatch_pending_reminders,
    main,
    poll_external_sync,
    process_recurring_tasks,
    run_worker,
    run_worker_iteration,
)

__all__ = [
    "dispatch_pending_reminders",
    "process_recurring_tasks",
    "poll_external_sync",
    "run_worker_iteration",
    "run_worker",
    "main",
]
