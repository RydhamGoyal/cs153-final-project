#!/bin/bash
# Start both backend (FastAPI) and frontend (Vite) with a single command.
# Press Ctrl+C to stop both.
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Color output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Starting 510(k) Predicate Navigator...${NC}"
echo ""

# Warn if running in conda base (should be in the 510k env)
if [ "${CONDA_DEFAULT_ENV}" = "base" ] || [ -z "${CONDA_DEFAULT_ENV}" ]; then
    echo "Warning: not in the 510k conda env. Run: conda activate 510k"
    echo "Continuing anyway with current Python: $(which python)"
    echo ""
fi

# Check .env exists
if [ ! -f .env ]; then
    echo "Warning: .env not found. Copying from .env.example..."
    cp .env.example .env
    echo "Edit .env and add your OPENROUTER_API_KEY before analyzing devices."
fi

# Start backend
echo -e "${GREEN}[backend]${NC} Starting FastAPI on http://localhost:8000"
python -m uvicorn backend.main:app --port 8000 --reload &
BACKEND_PID=$!

# Give backend a moment to bind
sleep 1

# Start frontend
echo -e "${GREEN}[frontend]${NC} Starting Vite on http://localhost:5173"
cd frontend && npm run dev &
FRONTEND_PID=$!

echo ""
echo "----------------------------------------------"
echo "  Backend:  http://localhost:8000"
echo "  Frontend: http://localhost:5173"
echo "  API docs: http://localhost:8000/docs"
echo "----------------------------------------------"
echo "Press Ctrl+C to stop both servers."
echo ""

# Kill both on exit
cleanup() {
    echo ""
    echo "Stopping servers..."
    kill "$BACKEND_PID" 2>/dev/null
    kill "$FRONTEND_PID" 2>/dev/null
    exit 0
}
trap cleanup INT TERM

wait
