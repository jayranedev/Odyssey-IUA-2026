from app.config import settings
from app.services.keepalive import keepalive_target_url, should_start_keepalive


def test_keepalive_uses_render_external_url(monkeypatch):
    monkeypatch.setattr(settings, "keepalive_url", "")
    monkeypatch.setenv("RENDER_EXTERNAL_URL", "https://example.onrender.com/")

    assert keepalive_target_url() == "https://example.onrender.com/health"


def test_keepalive_starts_on_render_production(monkeypatch):
    monkeypatch.setattr(settings, "environment", "production")
    monkeypatch.setattr(settings, "keepalive_enabled", True)
    monkeypatch.setattr(settings, "keepalive_interval_seconds", 600)
    monkeypatch.setattr(settings, "keepalive_url", "")
    monkeypatch.setenv("RENDER", "true")

    assert should_start_keepalive()


def test_keepalive_does_not_start_in_local_development(monkeypatch):
    monkeypatch.setattr(settings, "environment", "development")
    monkeypatch.setattr(settings, "keepalive_enabled", True)
    monkeypatch.setattr(settings, "keepalive_interval_seconds", 600)
    monkeypatch.setattr(settings, "keepalive_url", "")
    monkeypatch.setenv("RENDER", "true")

    assert not should_start_keepalive()


def test_keepalive_can_be_explicitly_enabled_off_render(monkeypatch):
    monkeypatch.setattr(settings, "environment", "production")
    monkeypatch.setattr(settings, "keepalive_enabled", True)
    monkeypatch.setattr(settings, "keepalive_interval_seconds", 600)
    monkeypatch.setattr(settings, "keepalive_url", "https://api.example.com")
    monkeypatch.delenv("RENDER", raising=False)

    assert should_start_keepalive()
