from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+asyncpg://jugaad:jugaad_secret@localhost:5432/jugaadgpt"
    database_url_sync: str = "postgresql://jugaad:jugaad_secret@localhost:5432/jugaadgpt"

    anthropic_api_key: str = ""

    # Voyage AI (embeddings)
    voyage_api_key: str = ""

    # Groq (Whisper transcription)
    groq_api_key: str = ""

    # Meta WhatsApp Cloud API
    whatsapp_verify_token: str = "jugaadgpt_verify"  # set any secret string in Meta dashboard
    whatsapp_access_token: str = ""                  # permanent token from Meta App
    whatsapp_phone_number_id: str = ""               # from WhatsApp > API Setup in Meta dashboard

    # Sarvam AI (Indian TTS — web)
    sarvam_api_key: str = ""

    # ElevenLabs (mobile TTS)
    elevenlabs_api_key: str = ""
    elevenlabs_voice_id: str = "pNInz6obpgDQGcFmaJgB"  # Adam — change in .env to any voice

    # Gemini Imagen (cookie-based, NID value from browser)
    gemini_cookie: str = ""

    environment: str = "development"
    cors_origins: str = "http://localhost:3000,http://localhost:5173"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]


settings = Settings()
