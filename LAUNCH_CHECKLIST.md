# JugaadGPT — Launch Checklist

Every manual step to go live. **Total required spend: ₹0.**
(Optional: $5 one-time Chrome Web Store fee if you want a store listing instead of load-unpacked.)

**Primary stack:** Vercel (frontends) + Koyeb (backend) + Supabase (DB/Auth) + Upstash (Redis).
Full copy-paste steps: [docs/DEPLOY.md](docs/DEPLOY.md).

## 1. Accounts & API keys (all free)

- [ ] **Groq** — console.groq.com → `GROQ_API_KEY` (LLMs + Whisper transcription)
- [ ] **Google AI Studio** — aistudio.google.com/apikey → `GEMINI_API_KEY` (LLM fallback + **embeddings**)
- [ ] **OpenRouter** — openrouter.ai/keys → `OPENROUTER_API_KEY` (free models only)
- [ ] **Supabase** — new project:
  - [ ] SQL Editor: `create extension if not exists vector;` (BEFORE migrations)
  - [ ] Enable **Google** auth provider (Google Cloud OAuth client; redirect `https://<ref>.supabase.co/auth/v1/callback`)
  - [ ] Email provider on (OTP), Site URL + Redirect URLs = web app domain
  - [ ] Copy `SUPABASE_URL`, `SUPABASE_ANON_KEY`, JWT Secret → `SUPABASE_JWT_SECRET`
  - [ ] Copy BOTH pooler URLs: transaction (6543, app) + session (5432, migrations/backups)
- [ ] **Upstash** — create Redis DB → copy the `rediss://` URL → `REDIS_URL`
- [ ] **Koyeb** — free account (Docker deploy from GitHub)
- [ ] **Vercel** — free account (2 projects: web app + landing)
- [ ] **Expo** — expo.dev (APK builds)
- [ ] **Meta developer app** — WhatsApp Cloud API: permanent token + phone number ID
- [ ] *(Optional)* **Sentry** — sentry.io free tier: one Python project (`SENTRY_DSN` on Koyeb)
      and one React project (`VITE_SENTRY_DSN` on Vercel). Both optional — app runs fine without.
- [ ] *(Optional)* **UptimeRobot** — free monitor on `https://<app>.koyeb.app/health`
      (alerting + second keep-alive signal alongside the GitHub Action)

## 2. Deploy order (details in DEPLOY.md)

- [ ] Supabase project ready (vector extension enabled!)
- [ ] Upstash Redis created
- [ ] Koyeb service from this repo (Dockerfile in `jugaadgpt-backend/`, free instance,
      health check `/health`, env list from DEPLOY.md §3 — `EMBEDDING_PROVIDER=gemini`)
- [ ] From your local machine, against the **session pooler** URL:
      `alembic upgrade head` then `python scripts/reembed_cases.py` (DEPLOY.md §4)
- [ ] Vercel project 1: web app (build `npm run build`, output `dist`,
      env `VITE_API_URL` / `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`)
- [ ] Vercel project 2: landing (root dir `landing`, static)
- [ ] Fill the **EDIT ME** blocks in `landing/index.html` + robots/sitemap domains
      + team photos & `landing/team.js`
- [ ] Add final Vercel domains to `CORS_ORIGINS` on Koyeb
- [ ] Meta webhook → `https://<app>.koyeb.app/api/whatsapp/webhook`

## 3. GitHub (after you push)

- [ ] Enable **Actions** (Settings → Actions → Allow)
- [ ] Repo secrets — exactly two:
  - [ ] `KEEPALIVE_API_URL` = `https://<app>.koyeb.app` (keep-alive workflow)
  - [ ] `DATABASE_URL` = Supabase **session pooler** URL with `?sslmode=require` (weekly backup workflow)
- [ ] Confirm `ci.yml` runs green on your first push
- [ ] Run `backup.yml` once manually (workflow_dispatch) and check the artifact appears

## 4. Distribution artifacts

- [ ] Extension zip: `VITE_API_URL=… VITE_WEB_APP_URL=… ./scripts/package-extension.sh`
- [ ] APK: set `expo-app/app.json` → `extra.apiBaseUrl` (+ Supabase keys), then
      `eas build -p android --profile preview` (docs/BUILD_APK.md)
- [ ] GitHub Release with `jugaadgpt.apk` + `jugaadgpt-extension.zip`
      (landing buttons point at `releases/latest`)
- [ ] *(Optional, $5)* Chrome Web Store listing

## 5. Final sanity pass

- [ ] `curl https://<app>.koyeb.app/health` and `/health/db` both return ok
- [ ] Web: anonymous chat works, quota pill `n/5`, 6th generation → login card
- [ ] Login (Google + email OTP) → pill flips to `n/25`, previous chats claimed
- [ ] `/api/tts` reads a solution aloud (edge-tts, single worker)
- [ ] Extension: ping OK, query OK, limit → opens `app…/?login=1`
- [ ] APK connects to `apiBaseUrl`, voice + camera OK
- [ ] WhatsApp: solution arrives; 6th of the day → Hinglish limit message
- [ ] Koyeb logs show one structured "query completed" line per query
      (provider, latency, quota type, retries — no message content)
- [ ] Kill Groq key temporarily → responses fail over to Gemini (logs show
      "provider groq exhausted")

## Known notes

- Without `REDIS_URL`, quotas live in process memory and reset on every deploy —
  the backend logs a loud warning if `ENVIRONMENT=production` and Redis is missing.
- Embeddings on the PaaS path use Gemini `text-embedding-004` (768-dim). If the
  free embedding quota is exhausted, users see the same friendly "capacity"
  banner as LLM exhaustion (no crash). `EMBEDDING_PROVIDER=local` remains for
  self-hosting (install the `local-embeddings` poetry extra).
- GitHub scheduled workflows pause after 60 days without repo activity — the
  optional UptimeRobot monitor covers the keep-alive gap.
- `jugaadgpt-frontend/web/` (Next.js variant) is unused and ignored per plan.
- Model IDs in `app/llm/router.py` are current as of July 2026; the startup log
  prints what each provider actually serves.
