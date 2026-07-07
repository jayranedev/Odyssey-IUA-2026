# JugaadGPT backend — production image.
#
# Two flavours via build arg EMBEDDING_PROVIDER:
#   gemini (default) — slim image, no torch/sentence-transformers (<500MB).
#                      Right choice for Koyeb free (512MB RAM) and other PaaS.
#   local            — installs the `local-embeddings` extra and bakes the
#                      sentence-transformers model for fast cold start.
#
# Koyeb injects PORT; workers default to 1 (override with WEB_CONCURRENCY).

FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    HF_HOME=/opt/hf-cache

ARG EMBEDDING_PROVIDER=gemini
ARG EMBEDDING_MODEL=BAAI/bge-small-en-v1.5
ENV EMBEDDING_PROVIDER=${EMBEDDING_PROVIDER}

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
        libpq-dev curl \
    && rm -rf /var/lib/apt/lists/*

# Install deps from pyproject (poetry resolves; no venv inside the container).
# The local-embeddings extra (torch) is only pulled for EMBEDDING_PROVIDER=local.
COPY pyproject.toml ./
RUN pip install poetry \
    && poetry config virtualenvs.create false \
    && if [ "$EMBEDDING_PROVIDER" = "local" ]; then \
         poetry install --only main --extras local-embeddings --no-root --no-interaction; \
       else \
         poetry install --only main --no-root --no-interaction; \
       fi

# Bake the embedding model into the image (local provider only)
RUN if [ "$EMBEDDING_PROVIDER" = "local" ]; then \
      python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('${EMBEDDING_MODEL}')"; \
    fi

COPY . .

EXPOSE 8000

# gunicorn + uvicorn workers. PORT is injected by Koyeb; WEB_CONCURRENCY=1
# fits the 512MB free instance (SSE + edge-tts are fully async, one worker is fine).
CMD alembic upgrade head && gunicorn app.main:app \
    -k uvicorn.workers.UvicornWorker \
    -w ${WEB_CONCURRENCY:-1} \
    -b 0.0.0.0:${PORT:-8000} \
    --timeout 120 \
    --graceful-timeout 30
