"""
Local embeddings via fastembed (ONNX).
Model: intfloat/multilingual-e5-large — 1024 dims, multilingual (en/hi/hinglish).

GPU: install onnxruntime-gpu to use RTX 4070 (replaces onnxruntime).
  pip install onnxruntime-gpu

Falls back to CPU automatically if CUDA provider is unavailable.
Downloads model on first use to %TEMP%/fastembed_cache/
"""

import asyncio
import os
import sys
from functools import lru_cache

# On Windows, CUDA and cuDNN DLLs must be in PATH before onnxruntime imports.
# The cuDNN installer drops DLLs in a versioned subfolder that isn't on PATH.
if sys.platform == "win32":
    _GPU_DIRS = [
        r"C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v12.4\bin",
        r"C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v12.9\bin",
        r"C:\Program Files\NVIDIA\CUDNN\v9.21\bin\12.9\x64",
        r"C:\Program Files\NVIDIA\CUDNN\v9.21\bin\13.2\x64",
        r"C:\Program Files\NVIDIA\CUDNN\v9.12\bin\13.0",
    ]
    _extra = ";".join(p for p in _GPU_DIRS if os.path.isdir(p))
    if _extra:
        os.environ["PATH"] = _extra + ";" + os.environ.get("PATH", "")
    for _p in _GPU_DIRS:
        if os.path.isdir(_p):
            os.add_dll_directory(_p)

import onnxruntime as ort
from fastembed import TextEmbedding

LOCAL_MODEL = "intfloat/multilingual-e5-large"
LOCAL_DIMS = 1024

_ALL_PROVIDERS = ["CUDAExecutionProvider", "CPUExecutionProvider"]


@lru_cache(maxsize=1)
def _get_model() -> TextEmbedding:
    available = set(ort.get_available_providers())
    providers = [p for p in _ALL_PROVIDERS if p in available]
    using_gpu = "CUDAExecutionProvider" in providers
    print(f"[embeddings] loading {LOCAL_MODEL} on {'GPU (CUDA)' if using_gpu else 'CPU'}")
    return TextEmbedding(model_name=LOCAL_MODEL, providers=providers)


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
