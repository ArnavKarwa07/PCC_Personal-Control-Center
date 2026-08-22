"""Hugging Face Spaces entrypoint for PCC FastAPI Backend.
Runs 24/7 for free on Hugging Face Spaces.
"""

import os
import uvicorn
from app.main import app

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)
