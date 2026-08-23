import os
import sys

# Ensure both repo root and backend directory are in sys.path
current_dir = os.path.dirname(__file__)
root_path = os.path.abspath(os.path.join(current_dir, ".."))
backend_path = os.path.abspath(os.path.join(current_dir, "..", "backend"))

if root_path not in sys.path:
    sys.path.insert(0, root_path)
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.main import app

__all__ = ["app"]

