"""Hugging Face Spaces entrypoint for PCC FastAPI Backend.
Configured for ZeroGPU Free Tier.
"""

import os
import sys
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
import spaces
from app.main import app as fastapi_app

# ZeroGPU function required by Hugging Face ZeroGPU space supervisor
@spaces.GPU(duration=1)
def gpu_status(name: str = "PCC Admin") -> str:
    return f"⚡ ZeroGPU Engine Active & Ready for {name}"

# Gradio interface wrapping ZeroGPU function
demo = gr.Interface(
    fn=gpu_status,
    inputs=[gr.Textbox(value="PCC Admin", label="Client Name")],
    outputs="text",
    title="PCC Personal Control Center - 24/7 ZeroGPU Backend Engine",
    description="FastAPI REST API running live on ZeroGPU. Interactive Swagger API Docs available at /docs",
)

# Mount FastAPI app onto Gradio interface
app = gr.mount_gradio_app(fastapi_app, demo, path="/status")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 7860))
    demo.launch(server_name="0.0.0.0", server_port=port)
