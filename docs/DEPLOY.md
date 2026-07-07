# Deploying JugaadGPT — ₹0 stack

**Primary path:** Vercel (web app + landing) + Render (backend) + Supabase
(Postgres + pgvector + Auth) + Upstash (Redis). All free tiers.
The self-hosted Oracle/docker-compose path is kept as **Appendix A**.

| Piece | Where | Cost |
|---|---|---|
| FastAPI backend (Docker) | Render web service | ₹0 |
| Postgres + pgvector + Auth | Supabase free tier | ₹0 |
| Redis (quotas, exhaustion flags) | Upstash free tier | ₹0 |
| Root web app (Vite) | Vercel | ₹0 |
| Landing page (`landing/`) | Vercel (second project) | ₹0 |
| Keep-alive + backups + CI | GitHub Actions | ₹0 |

Order matters: **Supabase → Upstash → Render → migrations from your machine → Vercel.**

---

## 1. Supabase (Postgres + pgvector + Auth)

1. Create a project at [supabase.com](https://supabase.com) (free tier). Save the DB password.
2. **Enable pgvector** — SQL Editor → run:
   ```sql
   create extension if not exists vector;
   ```
   Do this BEFORE running any migration.
3. **Auth — Email** stays enabled (OTP works out of the box).
4. Skip Google auth for now. Enable it later in Supabase once your OAuth setup is ready.
5. **Auth — URL Configuration**: Site URL = your web app URL (Vercel domain), add it to Redirect URLs.
6. Collect the connection strings (Database → Connect):
   - **Transaction pooler (port 6543)** — for the running app:
     `postgresql+asyncpg://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres`
     → `DATABASE_URL` (note the `+asyncpg`)
   - **Session pooler (port 5432)** — for Alembic + scripts:
     `postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require`
     → `DATABASE_URL_SYNC` and your local migration runs
   The app auto-detects `pooler.supabase.com` and disables asyncpg statement
   caching (required in transaction mode) — no extra config.
7. Collect for auth: Project URL (`SUPABASE_URL`), anon key (`SUPABASE_ANON_KEY`),
   **JWT Secret** (`SUPABASE_JWT_SECRET`) — all under Settings → API.

## 2. Upstash (Redis)

1. [console.upstash.com](https://console.upstash.com) → Create Database (free tier,
   pick a region near your Render region).
2. Copy the **`rediss://` URL** (TLS) → `REDIS_URL`. Nothing else needed —
   the client handles TLS automatically.

## 3. Render (backend)

1. [render.com](https://render.com) → New → **Web Service** → connect this repo.
2. Builder: **Dockerfile**, work directory `jugaadgpt-backend`
   (Dockerfile path `jugaadgpt-backend/Dockerfile`).
3. Instance: use the smallest available web service size. The default image build uses
   `EMBEDDING_PROVIDER=gemini` — slim, no torch, fits in RAM.
4. Start Command: leave blank. The Dockerfile already starts the app with `gunicorn`.
5. **Health check**: HTTP path `/health` on port 8000 (Render injects `PORT`;
   the container binds to it automatically).
6. Environment variables (from `.env.example`):
   ```
   DATABASE_URL          = postgresql+asyncpg://postgres.<ref>:<pw>@aws-0-<region>.pooler.supabase.com:6543/postgres
   DATABASE_URL_SYNC     = postgresql://postgres.<ref>:<pw>@aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require
   REDIS_URL             = rediss://default:<pw>@<name>.upstash.io:6379
   GROQ_API_KEY          = ...
   GEMINI_API_KEY        = ...
   OPENROUTER_API_KEY    = ...
   EMBEDDING_PROVIDER    = gemini
   SUPABASE_URL          = https://<ref>.supabase.co
   SUPABASE_ANON_KEY     = ...
   SUPABASE_JWT_SECRET   = ...
   ENVIRONMENT           = production
   CORS_ORIGINS          = https://<webapp>.vercel.app,https://<landing>.vercel.app
   SENTRY_DSN            = (optional)
   ```
7. Deploy. Your API URL is your Render service URL.
8. Smoke test: `curl https://<app>.render.com/health` → `{"status":"ok"}` and
   `curl https://<app>.render.com/health/db` → `{"status":"ok","db":"ok"}`.

## 4. Migrations + data — run FROM YOUR LOCAL MACHINE against Supabase

The Render service is best left serving traffic; run one-off jobs locally
using the **session pooler** URL:

```bash
cd jugaadgpt-backend
poetry install                      # slim (no torch needed for gemini embeddings)

# Windows PowerShell: use  $env:VAR="..."  instead of export
export DATABASE_URL='postgresql+asyncpg://postgres.<ref>:<pw>@aws-0-<region>.pooler.supabase.com:5432/postgres'
export DATABASE_URL_SYNC='postgresql://postgres.<ref>:<pw>@aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require'
export EMBEDDING_PROVIDER=gemini
export GEMINI_API_KEY=<your key>

poetry run alembic upgrade head
poetry run python scripts/reembed_cases.py     # seeds hero cases if DB empty, embeds via Gemini API
```

Optional full case library first:
`poetry run python data/seed_cases.py --file data/scraped_cases.jsonl`, then re-run the reembed script.

Retrieval smoke test (against the deployed API):
```bash
curl -N -X POST https://<app>.render.com/api/query \
  -H 'Content-Type: application/json' \
  -d '{"session_id":"smoke","message":"vegetables rotting no electricity Rajasthan, budget 500"}'
```

## 5. Vercel — two projects

**Project 1: web app** (repo root)
- Framework: Vite. Build command `npm run build`, output `dist`.
- `vercel.json` at the repo root already provides the SPA rewrite
  (`/(.*) → /index.html`); `public/_redirects` stays for the Cloudflare Pages option.
- Env vars:
  ```
   VITE_API_URL           = https://<app>.render.com
  VITE_SUPABASE_URL      = https://<ref>.supabase.co
  VITE_SUPABASE_ANON_KEY = <anon key>
  VITE_SENTRY_DSN        = (optional)
  ```

**Project 2: landing**
- Same repo, **Root Directory = `landing`**, Framework preset "Other", no build
  command, output directory `.` (static). `landing/vercel.json` handles clean URLs.
- Before/after deploy: fill the two **EDIT ME** blocks in `landing/index.html`
  (canonical/OG URLs + `JUGAAD_CONFIG`), update `landing/robots.txt` +
  `landing/sitemap.xml`, replace team photos + `landing/team.js`.

Add your custom domains in each Vercel project if you have one, then add all
final origins to the backend `CORS_ORIGINS` on Render.

## 6. GitHub Actions (keep-alive, backups, CI)

After pushing:
1. Repo Settings → Actions → allow workflows.
2. Secrets → Actions → add:
   - `KEEPALIVE_API_URL` = `https://<app>.render.com` (no trailing slash)
   - `DATABASE_URL` = the **session pooler** URL with `?sslmode=require` (for backups)
3. Workflows included:
    - `keepalive.yml` — /health every 10 min (Render never idles),
     /health/db daily (Supabase never pauses).
   - `backup.yml` — weekly `pg_dump` → gzipped artifact, 90-day retention,
     manual trigger available.
   - `ci.yml` — ruff + pytest + web build on every push/PR.

---

## Appendix A — Self-hosted (Oracle Cloud Always Free + docker-compose)

The original path still works and is fully self-contained (Caddy auto-HTTPS,
local Postgres+pgvector, local Redis). Use `EMBEDDING_PROVIDER=local` and build
with `--build-arg EMBEDDING_PROVIDER=local` to run embeddings on the VM
(24GB RAM is plenty).

1. Oracle VM.Standard.A1.Flex (Ubuntu 22.04); open TCP 80/443 in the VCN
   security list and on the VM (`sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT`, same for 443).
2. `curl -fsSL https://get.docker.com | sudo sh`
3. Clone, `cp .env.example .env` (set `DOMAIN`, keys; local DB URLs are fine),
   point an A record `api.yourdomain.com` → VM IP.
4. ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   docker compose -f docker-compose.prod.yml exec api alembic upgrade head
   docker compose -f docker-compose.prod.yml exec api python scripts/reembed_cases.py
   ```

## Appendix B — Restoring a backup

Backups are gzipped `pg_dump` artifacts from the `backup` workflow
(Actions → backup → run → Artifacts). To restore into a fresh/emptied database:

```bash
gunzip jugaadgpt-<stamp>.sql.gz
psql 'postgresql://postgres.<ref>:<pw>@aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require' \
  -f jugaadgpt-<stamp>.sql
```

(If restoring over existing tables, drop the `public` schema objects first or
restore into a new Supabase project. Re-run the keep-alive and smoke tests after.)
