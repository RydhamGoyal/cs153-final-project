#!/usr/bin/env bash
#
# One-command deploy of the 510(k) Navigator to a fresh DigitalOcean droplet.
#
# Prerequisites (done once — see deploy/README.md for the click-by-click guide):
#   • An Ubuntu 24.04 droplet (2+ vCPU, 4GB RAM) with your SSH key added
#   • .env filled in locally (copy from .env.example)
#
# Usage:
#   bash deploy/deploy.sh <droplet-ip>
#
# It rsyncs the repo + data to the droplet, installs Docker if needed, and brings
# up the stack with automatic HTTPS on a free sslip.io domain.
set -euo pipefail

IP="${1:-}"
if [[ -z "$IP" ]]; then
  echo "Usage: bash deploy/deploy.sh <droplet-ip>"
  exit 1
fi

# Resolve repo root (this script lives in deploy/).
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REMOTE_DIR="/opt/vera"
SSH_USER="root"
SSH_HOST="${SSH_USER}@${IP}"
SITE_ADDRESS="$(echo "$IP" | tr '.' '-').sslip.io"

if [[ ! -f "$ROOT/.env" ]]; then
  echo "❌  .env not found. Copy .env.example to .env and fill in OPENROUTER_API_KEY."
  exit 1
fi

echo "▶  Deploying to $SSH_HOST"
echo "▶  Site will be:  https://$SITE_ADDRESS"
echo

# 1. Make sure we can reach the droplet.
echo "▶  Checking SSH connectivity…"
ssh -o StrictHostKeyChecking=accept-new -o ConnectTimeout=10 "$SSH_HOST" "echo ok" >/dev/null

# 2. Install Docker (+ compose plugin) if it isn't there yet.
echo "▶  Ensuring Docker is installed on the droplet…"
ssh "$SSH_HOST" bash -s <<'REMOTE'
set -e
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi
mkdir -p /opt/vera
REMOTE

# 3. Sync the project (code + the runtime data: SQLite DB + FAISS index) to the droplet.
#    --delete keeps the remote clean. data/raw (3.3GB of source dumps) and other
#    build-time-only artifacts are excluded — only what the app needs at runtime ships.
echo "▶  Syncing project files (includes the ~580MB DB + embeddings on first run)…"
rsync -az --delete \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude '.venv' \
  --exclude '__pycache__' \
  --exclude 'frontend/dist' \
  --exclude 'data/raw' \
  --exclude 'data/pdfs' \
  --exclude 'data/finetune_dataset.jsonl' \
  --exclude 'finetune/output' \
  --exclude '*.log' \
  "$ROOT/" "$SSH_HOST:$REMOTE_DIR/"

# 4. Build and start. SITE_ADDRESS is passed inline so we never clobber the .env
#    that holds the backend secrets (it was just rsynced up).
echo "▶  Building and starting containers…"
ssh "$SSH_HOST" "cd $REMOTE_DIR && SITE_ADDRESS=$SITE_ADDRESS docker compose up -d --build"

echo
echo "✅  Deploy complete."
echo "    Your site:  https://$SITE_ADDRESS"
echo "    (Caddy provisions the HTTPS certificate on first load — give it ~30s.)"
echo
echo "    Logs:    ssh $SSH_HOST 'cd $REMOTE_DIR && docker compose logs -f'"
echo "    Restart: ssh $SSH_HOST 'cd $REMOTE_DIR && docker compose restart'"
