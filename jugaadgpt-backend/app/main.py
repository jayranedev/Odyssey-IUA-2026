from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import archive, feedback, query, whatsapp
from app.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(
    title="JugaadGPT API",
    description="Constraint-first AI for India's street-smart solutions",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(query.router, prefix="/api")
app.include_router(feedback.router, prefix="/api")
app.include_router(whatsapp.router, prefix="/api")
app.include_router(archive.router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok"}
