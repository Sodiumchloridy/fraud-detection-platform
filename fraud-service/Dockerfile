FROM python:3.12-slim

# Install uv binary from official image
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Copy dependency files first
COPY pyproject.toml uv.lock ./

# Install dependencies without installing self project
RUN uv sync --frozen --no-install-project

# Copy remaining application code
COPY core/ core/
COPY models/ models/
COPY routes/ routes/
COPY schemas/ schemas/
COPY main.py shap_worker.py ./

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
