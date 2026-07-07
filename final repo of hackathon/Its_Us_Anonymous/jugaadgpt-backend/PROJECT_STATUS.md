# JugaadGPT — Project Status

> **Last updated:** 2026-04-25  
> **For:** Teammates, future LLMs, and contributors picking this up mid-build.

---

## What We're Building

**JugaadGPT** — An AI system that generates practical, low-cost solutions grounded in real-world Indian constraints. It inverts the typical AI pattern: constraints are the *input shape*, not an afterthought filter.

**Target user:** Marginal farmers, street vendors, rural workers in India — people solving problems with ₹500 and whatever's in the room.

**Core promise:** "I have ₹500, no electricity, and vegetables rotting in my shop in Rajasthan" → a specific, buildable solution with a rupee bill-of-materials.

---

## Architecture Decision: RAG Wrapper (Not Fine-Tune)

**Decision:** This is a RAG pipeline over a curated jugaad case library, NOT a fine-tuned model.

**Why:**
- Fine-tuning needs thousands of training pairs; we have ~500 cases scraped in hackathon time
- Claude Sonnet 4.6 with good RAG > fine-tuned 8B model for constraint reasoning
- 36-hour hackathon timeline — fine-tuning would consume it entirely
- RAG retrieval (pgvector) = 50-80ms, not a bottleneck

**Auth decision:** No Clerk. Anonymous session IDs (UUID in localStorage) on frontend, passed to backend. Saves 5-7 hours for zero demo value.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI + Python 3.11 |
| DB | PostgreSQL 16 + pgvector extension |
| ORM | SQLAlchemy 2.0 (async) + Alembic |
| LLM | Claude Haiku 4.5 (constraint extraction) + Claude Sonnet 4.6 (solution generation) |
| Embeddings | Voyage AI `voyage-3` (API, 1024-dim, Anthropic-recommended) |
| Deps | Poetry |
| Infra | Docker Compose (local dev), EC2 (prod) |
| WhatsApp | Meta Cloud API (Graph API webhooks) |
| Voice transcription | Groq Whisper `whisper-large-v3-turbo` |
| Streaming | SSE via `sse-starlette` |

---

## Pipeline Flow

```
User input
    ├── text  → direct
    ├── audio → POST /api/transcribe (Groq Whisper) → transcript text
    └── image → base64 in JSON body
    │
    ▼
[1] Constraint Extractor (Haiku)
    → Structured JSON: budget_inr, materials, power, location, etc.
    → If missing_constraints → ask clarifying question (no solution yet)
    │
    ▼
[2] RAG Retriever (pgvector)
    → Embed constraint query
    → Top-5 similar jugaad cases from case library
    → Fallback to hero_cases.json when DB is empty
    │
    ▼
[3] Solution Generator (Sonnet, streaming)
    → Grounded in retrieved cases
    → Strict output: BOM with ₹ prices, build steps, failure modes
    │
    ▼
[4] Validator (deterministic Python — the moat)
    → Hard rules: budget ≤ stated limit, no power tools if no power, etc.
    → If fails → regenerate with constraint appended to prompt
    → Max 2 retries, then fallback to top RAG case
    │
    ▼
Streaming SSE response to frontend / WhatsApp webhook
```

---

## Data Layer

Three datasets needed:

| Dataset | Source | Status |
|---------|--------|--------|
| Jugaad Case Library (~200-500 cases) | Honey Bee Network, NIF India, YouTube transcripts | **TODO — scraping in progress** |
| Materials & Cost Reference | LLM-generated + manual validation, Indian prices | **TODO** |
| Regional Context (30 states) | Climate, crops, local materials availability | **TODO** |
| Hero Cases (15 hand-curated) | Manual — these are the demo scenarios | **TODO — needed for demo** |

---

## Completed ✅

- [x] Project architecture and tech stack decided
- [x] Repository initialized
- [x] `pyproject.toml` — Poetry config, all deps pinned
- [x] `docker-compose.yml` — pgvector/pg16 with healthcheck
- [x] `.env.example` — all required env vars documented
- [x] `.gitignore`
- [x] `app/config.py` — pydantic-settings
- [x] `app/db.py` — SQLAlchemy async session + Base
- [x] `app/models/jugaad_case.py` — JugaadCase with Vector(384) column
- [x] `app/models/query_log.py` — QueryLog
- [x] `app/models/feedback.py` — Feedback
- [x] `app/schemas/query.py` — QueryRequest, ClarifyingQuestion
- [x] `app/schemas/solution.py` — Constraints, Material, Solution, ValidationResult
- [x] `app/llm/anthropic_client.py` — async Anthropic singleton
- [x] `app/pipeline/extractor.py` — Haiku constraint extractor (+ vision fallback for photo input)
- [x] `app/pipeline/retriever.py` — pgvector retrieval with hero_cases fallback
- [x] `app/pipeline/generator.py` — streaming Sonnet generator
- [x] `app/pipeline/validator.py` — deterministic validator (15+ domain rules)
- [x] `app/api/query.py` — SSE streaming endpoint
- [x] `app/api/feedback.py` — feedback endpoint
- [x] `app/api/whatsapp.py` — Meta Cloud API webhook (text + image + audio/voice)
- [x] `app/services/transcription.py` — Groq Whisper transcription (Hindi + multilingual)
- [x] `app/services/embeddings.py` — Voyage AI `voyage-3` embeddings (1024 dims)
- [x] `app/services/conversation.py` — In-memory session history (last 5 turns)
- [x] `POST /api/transcribe` — web voice input (audio → transcript)
- [x] `POST /api/tts` — web voice reply (text → mp3)
- [x] Conversation memory wired into generator (follow-up questions work)
- [x] `data/seed_wikihow.py` — filter + embed 8,228 WikiHow articles (Home/Garden/Food/Crafts)
- [x] `data/seed_cases.py` — updated to use Voyage AI embeddings
- [x] `app/main.py` — FastAPI app with CORS, route mounting
- [x] `alembic/` — migrations for CREATE EXTENSION vector + all tables
- [x] `data/hero_cases.json` — 5 seed demo scenarios
- [x] `data/seed_cases.py` — script to embed and load cases into pgvector
- [x] `tests/test_pipeline.py` — smoke tests for pipeline

---

## In Progress 🔄

- [ ] Real jugaad case data scraping (Honey Bee Network, NIF India)
- [ ] Frontend (separate repo: `jugaadgpt-frontend`)

---

## Next Steps (Priority Order)

1. **Add hero_cases.json** — 15 hand-curated scenarios covering zeer pot, motorcycle pump, biogas, bamboo cooler, jute sack cooling
2. **Run `docker compose up -d`** then `poetry run python data/seed_cases.py` to embed hero cases
3. **Test pipeline end-to-end** with `pytest tests/`
4. **Scrape real data** — Honey Bee Network + NIF India, structure as JSONL, run seed script
5. **Frontend build** — static Next.js export, direct API calls to FastAPI on EC2
6. **WhatsApp integration** — Twilio sandbox, test with a real phone

---

## Demo Scenarios (The 3 We'll Show Judges)

1. **Ramesh's pump** — Vidarbha farmer, ₹1500, dead motor, old motorcycle → motorcycle water pump
2. **Rani's vegetables** — Rajasthan street vendor, ₹500, 8h power outage → zeer pot cooler
3. **Suresh's pests** — Maharashtra farmer, ₹200, no chemicals → neem oil + sticky trap

These 3 scenarios must work perfectly. Everything else is bonus.

---

## Known Issues / Decisions Pending

- Frontend stack not decided yet (Next.js static export vs plain Vite+React)
- WhatsApp voice input — Sarvam AI API key not yet obtained
- Multimodal (photo-of-materials) feature — available in pipeline, needs frontend file upload

---

## Repo Structure

```
jugaadgpt-backend/
├── PROJECT_STATUS.md        ← you are here
├── pyproject.toml
├── docker-compose.yml
├── .env.example
├── .gitignore
├── alembic.ini
├── alembic/
│   ├── env.py
│   └── versions/001_initial.py
├── app/
│   ├── main.py
│   ├── config.py
│   ├── db.py
│   ├── models/
│   ├── schemas/
│   ├── api/
│   ├── pipeline/
│   └── llm/
├── data/
│   ├── hero_cases.json
│   └── seed_cases.py
└── tests/
    └── test_pipeline.py
```
