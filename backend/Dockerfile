# Backend image — FastAPI + LangGraph pipeline + FAISS retrieval.
# Build context is the repo root so we can copy requirements.txt and backend/.
FROM python:3.11-slim

WORKDIR /app

# build-essential is needed for a couple of wheels (faiss, etc.)
RUN apt-get update \
 && apt-get install -y --no-install-recommends build-essential \
 && rm -rf /var/lib/apt/lists/*

# Install the CPU build of torch first so pip doesn't pull the ~2GB CUDA wheel.
RUN pip install --no-cache-dir torch==2.3.0 --index-url https://download.pytorch.org/whl/cpu

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend/

# data/ (SQLite DB + FAISS index) is bind-mounted at runtime via docker-compose.
EXPOSE 8000
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
