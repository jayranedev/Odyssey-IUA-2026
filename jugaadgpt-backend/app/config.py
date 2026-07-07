from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+asyncpg://jugaad:jugaad_secret@localhost:5432/jugaadgpt"
    database_url_sync: str = "postgresql://jugaad:jugaad_secret@localhost:5432/jugaadgpt"

    # Redis (quota counters + provider exhaustion flags). Empty → in-memory fallback (dev/tests).
    redis_url: str = ""

    # Free-tier LLM providers (OpenAI-compatible endpoints)
    groq_api_key: str = ""
    gemini_api_key: str = ""
    openrouter_api_key: str = ""

    # Embeddings.
    #   gemini (default) — Google text-embedding-004 via GEMINI_API_KEY, 768 dims.
    #                      No torch needed → fits 512MB PaaS instances (Koyeb free).
    #   local            — sentence-transformers on the server (install the
    #                      `local-embeddings` poetry extra). bge-small = 384 dims.
    embedding_provider: str = "gemini"
    embedding_model: str = "BAAI/bge-small-en-v1.5"  # used only when provider=local
    embedding_dim: int = 0  # 0 = auto: 768 for gemini, 384 for local

    def model_post_init(self, __context) -> None:
        if self.embedding_dim == 0:
            self.embedding_dim = 768 if self.embedding_provider == "gemini" else 384

    # Supabase Auth (backend only verifies the JWT — Supabase DB is not used)
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_jwt_secret: str = ""

    # Daily generation quotas (generator runs only — clarifying turns don't count)
    free_daily_quota: int = 5     # anonymous, per device-id / per IP
    auth_daily_quota: int = 25    # logged-in, per user
    wa_daily_quota: int = 5       # WhatsApp, per phone number

    # Meta WhatsApp Cloud API
    whatsapp_verify_token: str = "jugaadgpt_verify"  # set any secret string in Meta dashboard
    whatsapp_access_token: str = ""                  # permanent token from Meta App
    whatsapp_phone_number_id: str = ""               # from WhatsApp > API Setup in Meta dashboard

    # Gemini Imagen (cookie-based, NID value from browser)
    gemini_cookie: str = ""

    # Observability (optional)
    sentry_dsn: str = ""

    environment: str = "development"
    cors_origins: str = "http://localhost:3000,http://localhost:5173"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
