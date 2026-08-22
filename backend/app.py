"""Hugging Face Spaces entrypoint for PCC FastAPI Backend.
Runs 24/7 for free on Hugging Face Spaces using Gradio SDK.
"""

import gradio as gr
from app.main import app

# Gradio status UI page
demo = gr.Interface(
    fn=lambda: "⚡ PCC Personal Control Center Backend Engine is Active!",
    inputs=[],
    outputs="text",
    title="PCC Backend Service",
    description="FastAPI REST API running live 24/7. Interactive Swagger API Docs available at /docs",
)

# Mount Gradio status UI onto FastAPI app so Hugging Face Space runner stays alive 24/7
app = gr.mount_gradio_app(app, demo, path="/")
