# Deploying Vera to DigitalOcean

A click-by-click guide to get a live `https://` URL. ~20 minutes start to finish.
You only need your DigitalOcean account (with credits) and a terminal on your Mac.

---

## 1. Create an SSH key (skip if you already have one)

In your Mac terminal:

```bash
ls ~/.ssh/id_ed25519.pub        # if this prints a path, you already have a key — skip to step 2
ssh-keygen -t ed25519           # otherwise create one; press Enter through all prompts
cat ~/.ssh/id_ed25519.pub       # copy this whole line
```

## 2. Create the droplet

1. Go to **cloud.digitalocean.com → Create → Droplets**.
2. **Region:** pick the one nearest you (e.g. San Francisco).
3. **Image:** Ubuntu 24.04 (LTS).
4. **Size:** Basic → Regular → **4 GB RAM / 2 vCPU** (≈ $24/mo, well within your credits).
   The FAISS index + embedding model need the RAM; smaller droplets will OOM.
5. **Authentication:** choose **SSH Key → New SSH Key**, paste the line from step 1, name it.
6. Create the droplet. When it's ready, copy its **public IPv4 address** (e.g. `159.89.1.2`).

## 3. Fill in your backend secrets

From the repo root on your Mac:

```bash
cp .env.example .env
# open .env and paste your OPENROUTER_API_KEY (required).
# Leave MODAL_* blank for now — the fine-tuned toggle will fall back to OpenRouter
# until you deploy the Modal endpoint (see ../finetune/modal_serve.py).
```

## 4. Deploy

```bash
bash deploy/deploy.sh <droplet-ip>
```

That's it. The script installs Docker on the droplet, uploads the project + data,
builds the containers, and starts everything with automatic HTTPS. First build
takes a few minutes (it compiles the Python image and the frontend).

When it finishes it prints your live URL:

```
https://159-89-1-2.sslip.io
```

Open it — give Caddy ~30 seconds on first load to issue the HTTPS certificate.

---

## Updating after a code change

Just run the same command again — it re-syncs and rebuilds only what changed:

```bash
bash deploy/deploy.sh <droplet-ip>
```

## Useful commands

```bash
# follow logs
ssh root@<droplet-ip> 'cd /opt/vera && docker compose logs -f'

# restart everything
ssh root@<droplet-ip> 'cd /opt/vera && docker compose restart'

# stop (to pause spend)
ssh root@<droplet-ip> 'cd /opt/vera && docker compose down'
```

## (Optional) Serve the real fine-tuned model

The "Fine-tuned Qwen" toggle works without this — it falls back to OpenRouter.
To serve the actual fine-tuned model:

```bash
modal deploy finetune/modal_serve.py        # prints a public URL
modal secret create vllm-api-key VLLM_API_KEY=<long-random-token>
```

Then put the URL + token into `.env` as `MODAL_ENDPOINT_URL` and `MODAL_API_KEY`,
and re-run `bash deploy/deploy.sh <droplet-ip>`. Warm it before a demo with a single
`curl <url>/v1/models -H "Authorization: Bearer <token>"`.

## Troubleshooting

- **Site won't load / cert error for a minute:** Caddy is still issuing the
  certificate. Wait ~30s and refresh.
- **`Permission denied (publickey)`:** your SSH key isn't on the droplet. Recreate
  the droplet with the key from step 1, or add it via the DigitalOcean console.
- **Backend container restarting:** check `docker compose logs backend` — almost
  always a missing `OPENROUTER_API_KEY` in `.env`.
