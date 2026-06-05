"""
Fine-tune Qwen2.5-7B-Instruct on 510(k) SE analysis data using Modal GPU compute.

Model: Qwen/Qwen2.5-7B-Instruct, ungated, no HuggingFace approval needed,
       strong structured JSON output capability, better than Mistral 7B for this task.

Usage:
  pip install modal
  modal setup                        # authenticate once
  python finetune/prep_dataset.py    # build training data from DB
  modal run finetune/modal_train.py  # launch GPU job

Adapter weights saved to Modal Volume. Download with:
  modal volume get 510k-finetune-output /output/adapter ./finetune/output/adapter

Cost estimate: ~$2-4 on an A10G (~2-3 hours training).
Modal bills by the second and stops the container when done.
"""
import modal
import os

volume = modal.Volume.from_name("510k-finetune-output", create_if_missing=True)

image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("git")
    .pip_install(
        # Pinned to a mutually-compatible stack. Leaving these unpinned lets pip
        # backtrack LlamaFactory down to 0.8.3 while pulling transformers 5.x,
        # which removed AutoModelForVision2Seq and breaks LlamaFactory's import.
        "torch==2.5.1",
        "transformers==4.49.0",
        "datasets==3.1.0",
        "accelerate==1.2.1",
        "peft==0.12.0",
        "trl==0.9.6",
        "llamafactory==0.9.2",
        "bitsandbytes==0.44.1",
        "scipy",
        "pyyaml",
    )
)

app = modal.App("510k-finetune", image=image)


@app.function(
    gpu="A10G",       # ~$1.10/hr, sufficient for Qwen2.5 7B QLoRA
    timeout=86400,    # 24-hour max (Modal's hard ceiling)
    volumes={"/output": volume},
    # No HuggingFace secret needed, Qwen2.5 is ungated
)
def train(dataset_jsonl: bytes, config_yaml: bytes):
    """Runs inside Modal's GPU container."""
    import subprocess
    import tempfile
    import shutil
    import json
    import yaml

    # Write dataset to container filesystem
    with tempfile.NamedTemporaryFile(suffix=".jsonl", delete=False, mode="wb") as f:
        f.write(dataset_jsonl)
        dataset_path = f.name

    # Set up dataset directory with LlamaFactory-compatible dataset_info.json
    local_dataset_dir = "/tmp/510k_dataset"
    os.makedirs(local_dataset_dir, exist_ok=True)
    shutil.copy(dataset_path, f"{local_dataset_dir}/train.jsonl")

    dataset_info = {
        "510k_se": {
            "file_name": f"{local_dataset_dir}/train.jsonl",
            "formatting": "alpaca"
        }
    }
    with open(f"{local_dataset_dir}/dataset_info.json", "w") as f:
        json.dump(dataset_info, f)

    # Patch config: point to our dataset and output volume
    config = yaml.safe_load(config_yaml)
    config["dataset"] = "510k_se"
    config["dataset_dir"] = local_dataset_dir
    config["output_dir"] = "/output/adapter"

    patched_config_path = "/tmp/train_config.yaml"
    with open(patched_config_path, "w") as f:
        yaml.dump(config, f)

    print("Starting LlamaFactory training...")
    print(f"  Model: Qwen/Qwen2.5-7B-Instruct")
    print(f"  GPU:   A10G")
    print(f"  Output: /output/adapter")

    subprocess.run(
        ["llamafactory-cli", "train", patched_config_path],
        check=True,
    )

    # List what was saved so we can verify before committing
    result = subprocess.run(["find", "/output", "-type", "f"], capture_output=True, text=True)
    print("Files saved to volume:")
    print(result.stdout)

    print("Committing volume...")
    volume.commit()
    print("Volume committed.")
    return "Training complete. Adapter saved to Modal volume '510k-finetune-output' at /output/adapter"


@app.local_entrypoint()
def main():
    import pathlib

    dataset_path = pathlib.Path("data/finetune_dataset.jsonl")
    config_path = pathlib.Path("finetune/llamafactory_config.yaml")

    if not dataset_path.exists():
        print("ERROR: data/finetune_dataset.jsonl not found.")
        print("Run: python finetune/prep_dataset.py")
        raise SystemExit(1)

    if not config_path.exists():
        print("ERROR: finetune/llamafactory_config.yaml not found.")
        raise SystemExit(1)

    print(f"Uploading dataset ({dataset_path.stat().st_size // 1024} KB) to Modal...")
    result = train.remote(
        dataset_jsonl=dataset_path.read_bytes(),
        config_yaml=config_path.read_bytes(),
    )
    print(result)
    print()
    print("To download the adapter weights:")
    print("  modal volume get 510k-finetune-output /output/adapter ./finetune/output/adapter")
