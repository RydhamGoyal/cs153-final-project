FINE-TUNING SETUP ON DIGITALOCEAN

1. Create a GPU Droplet:
   - Image: "AI/ML Ready" Ubuntu 22.04 with NVIDIA drivers
   - Size: 1x NVIDIA L40S ($1.57/hr) — sufficient for Llama 3.1 8B QLoRA
   - Region: nearest to you

2. SSH in and install:
   pip install llamafactory

3. Copy your data:
   scp -r data/finetune_dataset.jsonl user@droplet-ip:~/

4. Run training:
   llamafactory-cli train finetune/llamafactory_config.yaml

5. Training takes ~3-4 hours on L40S. Cost: ~$5-7 total.

6. Download adapter weights:
   scp -r user@droplet-ip:~/output/adapter/ finetune/output/

7. DESTROY the droplet immediately after. $1.57/hr adds up.
