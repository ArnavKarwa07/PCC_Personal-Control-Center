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
try:
    import spaces
except ImportError:
    spaces = None

from app.main import app as fastapi_app

# Gradio Interface for HF ZeroGPU Space runner
demo = gr.Interface(
    fn=lambda client_name: f"⚡ PCC Personal Control Center Backend Engine is Active & Ready for {client_name}",
    inputs=[gr.Textbox(value="PCC Admin", label="Client Name")],
    outputs="text",
    title="PCC Personal Control Center - 24/7 Cloud Backend Engine",
    description="FastAPI REST API running live 24/7. Interactive Swagger API Docs available at /docs",
)

# Mount Gradio interface onto FastAPI app at root /
app = gr.mount_gradio_app(fastapi_app, demo, path="/")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 7860))
    demo.launch(server_name="0.0.0.0", server_port=port)
