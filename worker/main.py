"""Root worker main entrypoint."""

import asyncio
import os
import sys

# Ensure backend directory is in path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.abspath(os.path.join(CURRENT_DIR, "..", "backend"))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from worker.main import (
    dispatch_pending_reminders,
    main,
    poll_external_sync,
    process_recurring_tasks,
    run_worker,
    run_worker_iteration,
)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
