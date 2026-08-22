"""Hugging Face Spaces entrypoint for PCC FastAPI Backend.
Configured for Hugging Face Spaces (Gradio SDK free tier).
"""

import huggingface_hub

# Monkey-patch HfFolder for huggingface_hub compatibility
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

from app.main import app as fastapi_app

# Gradio Interface for status UI
demo = gr.Interface(
    fn=lambda client_name="PCC Admin": f"⚡ PCC Personal Control Center Backend Engine is Active for {client_name}",
    inputs=[gr.Textbox(value="PCC Admin", label="Client Name")],
    outputs="text",
    title="PCC Personal Control Center - 24/7 Cloud Backend Engine",
    description="FastAPI REST API running live on Hugging Face. Interactive Swagger API Docs available at /docs",
)

# Mount Gradio UI onto FastAPI app at /status so / and /api/v1/ and /docs are served by FastAPI
app = gr.mount_gradio_app(fastapi_app, demo, path="/status")
