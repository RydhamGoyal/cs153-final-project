"""
Serve the fine-tuned Qwen2.5-7B-Instruct + 510(k) LoRA adapter as an
OpenAI-compatible inference endpoint on Modal.

This is what makes the "Powered by fine-tuned Qwen2.5-7B" claim real: the backend's
SE-analysis agent can route to this endpoint instead of OpenRouter.

Design notes:
  • Scale-to-zero, the container spins down after `SCALEDOWN_WINDOW` seconds idle,
    so it only costs Modal credits while actually serving. First call after idle pays
    a ~60-90s cold start (model load); the backend gracefully falls back to OpenRouter
    if a request times out, so the app never breaks.
  • Dynamic LoRA, vLLM loads the base model once and applies the 154MB adapter as a
    named module, so we never have to merge/store a full fine-tuned checkpoint.
  • Bearer-token auth, vLLM's --api-key requires `Authorization: Bearer <token>` on
    every request, so a leaked URL alone can't burn credits.

Deploy:
  modal deploy finetune/modal_serve.py
  # prints the public URL, e.g. https://<user>--510k-serve-serve.modal.run
  # set MODAL_ENDPOINT_URL and MODAL_API_KEY in backend/.env to that URL + token

Warm it before a demo:
  curl https://<url>/v1/models -H "Authorization: Bearer <token>"
"""
import modal

# The adapter weights written by modal_train.py live in this volume at /output/adapter.
adapter_volume = modal.Volume.from_name("510k-finetune-output", create_if_missing=True)
# Cache base-model weights between cold starts so we don't re-download 15GB each time.
hf_cache_volume = modal.Volume.from_name("510k-hf-cache", create_if_missing=True)

BASE_MODEL = "Qwen/Qwen2.5-7B-Instruct"
ADAPTER_NAME = "510k-se"            # the `model` value the backend requests
ADAPTER_PATH = "/adapter"          # where the volume is mounted
SCALEDOWN_WINDOW = 120             # seconds idle before the container stops (scale to zero)
VLLM_PORT = 8000

image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "vllm==0.6.6",
        "huggingface_hub[hf_transfer]==0.27.0",
    )
    .env({"HF_HUB_ENABLE_HF_TRANSFER": "1"})
)

app = modal.App("510k-serve")

# The API token is stored as a Modal secret named "vllm-api-key" with key VLLM_API_KEY.
# Create it once:  modal secret create vllm-api-key VLLM_API_KEY=<your-long-random-token>
auth_secret = modal.Secret.from_name("vllm-api-key")


@app.function(
    image=image,
    gpu="A10G",                     # 24GB, fits Qwen2.5-7B bf16 (~15GB) + KV cache
    volumes={ADAPTER_PATH: adapter_volume, "/root/.cache/huggingface": hf_cache_volume},
    secrets=[auth_secret],
    scaledown_window=SCALEDOWN_WINDOW,
    timeout=600,
)
@modal.web_server(port=VLLM_PORT, startup_timeout=300)
def serve():
    """Launch vLLM's OpenAI-compatible server with the base model + LoRA adapter."""
    import os
    import subprocess

    api_key = os.environ["VLLM_API_KEY"]

    cmd = [
        "vllm", "serve", BASE_MODEL,
        "--host", "0.0.0.0",
        "--port", str(VLLM_PORT),
        "--api-key", api_key,
        "--enable-lora",
        "--max-lora-rank", "16",                       # matches the trained adapter
        "--lora-modules", f"{ADAPTER_NAME}={ADAPTER_PATH}/adapter",
        "--max-model-len", "8192",
        "--gpu-memory-utilization", "0.90",
        "--served-model-name", BASE_MODEL,             # base also addressable for A/B
        "--disable-log-requests",
    ]
    subprocess.Popen(" ".join(cmd), shell=True)
