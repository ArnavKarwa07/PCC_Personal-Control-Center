"""Hugging Face Spaces entrypoint for PCC FastAPI Backend.
Configured for ZeroGPU Free Tier with Gradio 5.x.
"""

import os
import sys
import uvicorn
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

# Gradio interface for HF Space status UI
demo = gr.Interface(
    fn=lambda client_name="PCC Admin": f"⚡ PCC Personal Control Center Backend Engine is Active & Ready for {client_name}",
    inputs=[gr.Textbox(value="PCC Admin", label="Client Name")],
    outputs="text",
    title="PCC Personal Control Center - 24/7 Cloud Backend Engine",
    description="FastAPI REST API running live on Hugging Face. Interactive Swagger API Docs available at /docs",
)

# Mount Gradio status UI onto FastAPI app
app = gr.mount_gradio_app(fastapi_app, demo, path="/status")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)
