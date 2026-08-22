"""Hugging Face Spaces entrypoint for PCC FastAPI Backend.
Runs 24/7 for free on Hugging Face Spaces using Gradio SDK.
"""

import sys
import huggingface_hub

# Monkey-patch HfFolder if missing in newer huggingface_hub versions
if not hasattr(huggingface_hub, "HfFolder"):
    class MockHfFolder:
        @classmethod
        def get_token(cls):
            return None
        @classmethod
        def save_token(cls, token):
            pass
    huggingface_hub.HfFolder = MockHfFolder

import gradio as gr
from app.main import app

# Gradio status UI page to keep HF container supervisor active 24/7
demo = gr.Interface(
    fn=lambda: "⚡ PCC Personal Control Center Backend Engine is Active!",
    inputs=[],
    outputs="text",
    title="PCC Backend Service",
    description="FastAPI REST API running live 24/7. Interactive Swagger API Docs available at /docs",
)

# Mount Gradio interface onto FastAPI app at root /
app = gr.mount_gradio_app(app, demo, path="/")
