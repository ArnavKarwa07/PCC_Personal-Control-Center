"""Hugging Face Spaces Gradio SDK entrypoint for PCC FastAPI Backend.
Runs 24/7 for free on Hugging Face Spaces using Gradio SDK.
"""

import os
import uvicorn
import gradio as gr
from app.main import app

# Simple Gradio status interface for Hugging Face Space homepage
demo = gr.Interface(
    fn=lambda: "⚡ PCC (Personal Control Center) 24/7 Cloud Backend Engine is Active!",
    inputs=[],
    outputs="text",
    title="PCC Personal Control Center Backend",
    description="Live FastAPI REST Server. Interactive Swagger API documentation is available at /docs",
)

# Mount Gradio interface onto FastAPI app at /status while serving API endpoints at /api/v1
app = gr.mount_gradio_app(app, demo, path="/status")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port)
