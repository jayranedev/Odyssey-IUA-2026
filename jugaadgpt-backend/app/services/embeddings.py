"""
Local embeddings via fastembed (ONNX).
Model: intfloat/multilingual-e5-large — 1024 dims, multilingual (en/hi/hinglish).

GPU: install onnxruntime-gpu to use RTX 4070 (replaces onnxruntime).
  pip install onnxruntime-gpu

Falls back to CPU automatically if CUDA provider is unavailable.
Downloads model on first use to %TEMP%/fastembed_cache/
"""

import asyncio
from functools import lru_cache

from fastembed import TextEmbedding

LOCAL_MODEL = "intfloat/multilingual-e5-large"
LOCAL_DIMS = 1024


@lru_cache(maxsize=1)
def _get_model() -> TextEmbedding:
    return TextEmbedding(
        model_name=LOCAL_MODEL,
        providers=["CUDAExecutionProvider", "CPUExecutionProvider"],
    )


def _embed_sync(texts: list[str], mode: str = "passage") -> list[list[float]]:
    model = _get_model()
    if mode == "query":
        return [emb.tolist() for emb in model.query_embed(texts)]
    return [emb.tolist() for emb in model.passage_embed(texts)]


async def _embed_async(texts: list[str], mode: str = "passage") -> list[list[float]]:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _embed_sync, texts, mode)


async def embed_documents(texts: list[str]) -> list[list[float]]:
    return await _embed_async(texts, mode="passage")


async def embed_query(text: str) -> list[float]:
    results = await _embed_async([text], mode="query")
    return results[0]


async def embed_documents_batched(
    texts: list[str], batch_size: int = 64, inter_batch_delay: float = 0
) -> list[list[float]]:
    all_embeddings: list[list[float]] = []
    total = len(texts)
    for i in range(0, total, batch_size):
        batch = texts[i : i + batch_size]
        embeddings = await _embed_async(batch, mode="passage")
        all_embeddings.extend(embeddings)
        done = min(i + batch_size, total)
        print(f"  embedded {done}/{total}", end="\r", flush=True)
    print()
    return all_embeddings
