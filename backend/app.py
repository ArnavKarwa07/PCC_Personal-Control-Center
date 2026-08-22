"""Hugging Face Spaces entrypoint for PCC FastAPI Backend.
Runs 24/7 for free on Hugging Face Spaces using Gradio SDK (supports CPU & ZeroGPU).
"""

import os
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
from app.main import app as fastapi_app

# ZeroGPU compatibility handler for Hugging Face ZeroGPU spaces
try:
    import spaces

    @spaces.GPU
    def zero_gpu_initializer():
        return "ZeroGPU Ready"
except Exception:
    zero_gpu_initializer = None

# Gradio Interface for HF Space runner
demo = gr.Interface(
    fn=lambda: f"⚡ PCC Personal Control Center Backend Engine is Active! ({'ZeroGPU' if zero_gpu_initializer else 'CPU'})",
    inputs=[],
    outputs="text",
    title="PCC Backend Service",
    description="FastAPI REST API running live 24/7. Interactive Swagger API Docs available at /docs",
)

# Mount FastAPI app onto Gradio
app = gr.mount_gradio_app(fastapi_app, demo, path="/status")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 7860))
    demo.launch(server_name="0.0.0.0", server_port=port)
