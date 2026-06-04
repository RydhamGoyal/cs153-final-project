from pydantic_settings import BaseSettings
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    openrouter_api_key: str = os.getenv("OPENROUTER_API_KEY", "")
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    default_model: str = "meta-llama/llama-3.3-70b-instruct:free"
    fast_model: str = "meta-llama/llama-3.1-8b-instruct"
    # Fine-tuned model served on Modal (see finetune/modal_serve.py). When the endpoint
    # URL is unset or unreachable, the "finetuned" toggle transparently falls back to OpenRouter.
    modal_endpoint_url: str = os.getenv("MODAL_ENDPOINT_URL", "")
    modal_api_key: str = os.getenv("MODAL_API_KEY", "")
    finetuned_model_name: str = "510k-se"
    db_path: str = "data/db/510k.db"
    faiss_index_path: str = "data/embeddings/devices.index"
    faiss_metadata_path: str = "data/embeddings/devices_metadata.pkl"
    finetuned_model_path: str | None = os.getenv("FINETUNED_MODEL_PATH")
    pdf_dir: str = "data/pdfs"
    innolitics_api_key: str = ""
    backend_port: int = 8000
    # In production Caddy serves the SPA and proxies /api on the same origin, so CORS
    # isn't triggered. These cover local dev where the Vite server is a separate origin.
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    class Config:
        env_file = ".env"

settings = Settings()
