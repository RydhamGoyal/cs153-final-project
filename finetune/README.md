# Fine-tuning and serving the SE-analysis model

The substantial-equivalence agent can run on a domain-specialized model: `Qwen2.5-7B-Instruct`
fine-tuned with QLoRA on 7,500 FDA-derived examples. Both training and serving run on Modal
(serverless GPU), so nothing needs to live on your own machine.

## 1. Build the dataset

```bash
python finetune/prep_dataset.py    # reads the DB, writes data/finetune_dataset.jsonl
```

## 2. Train (Modal A10G GPU)

```bash
pip install modal
modal setup                        # authenticate once
modal run finetune/modal_train.py  # ~2 hours, a few dollars; Modal stops the box when done
```

The adapter weights are written to the Modal volume `510k-finetune-output`. Download them:

```bash
modal volume get 510k-finetune-output /output/adapter ./finetune/output/adapter
```

Result: train loss 0.00108, eval loss 0.00290, 2,493 steps, a 154MB rank-16 adapter.

## 3. Serve (optional)

Serving the fine-tuned model makes the Navigator's "Fine-tuned Qwen" toggle use it
directly. Without this, the toggle falls back to OpenRouter automatically.

```bash
modal deploy finetune/modal_serve.py                       # prints a public URL
modal secret create vllm-api-key VLLM_API_KEY=<random-token>
```

Then set `MODAL_ENDPOINT_URL` and `MODAL_API_KEY` in the root `.env` and restart the app.
The endpoint is scale-to-zero, so it only costs compute while actually serving requests.
