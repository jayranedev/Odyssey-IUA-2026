"""
Structured logging via loguru.

- ENVIRONMENT=production → one JSON object per line on stdout (PaaS-friendly).
- Otherwise → pretty, colorized console output.
- Standard-library loggers (uvicorn, gunicorn, sqlalchemy, our modules using
  `logging`) are intercepted and routed through loguru so formatting is uniform.

Never log user message content or model tokens — only metadata.
"""

import inspect
import logging
import sys

from loguru import logger

from app.config import settings


class InterceptHandler(logging.Handler):
    """Route stdlib logging records into loguru."""

    def emit(self, record: logging.LogRecord) -> None:
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno

        # Walk back to the original caller so file/line info stays correct
        frame, depth = inspect.currentframe(), 0
        while frame and (depth == 0 or frame.f_code.co_filename == logging.__file__):
            frame = frame.f_back
            depth += 1

        logger.opt(depth=depth, exception=record.exc_info).log(level, record.getMessage())


def setup_logging() -> None:
    # Windows consoles default to cp1252 — force UTF-8 so ₹/emoji/em-dashes
    # in log lines never crash the sink (Linux containers are UTF-8 already).
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            try:
                stream.reconfigure(encoding="utf-8", errors="replace")
            except (ValueError, OSError):
                pass

    logger.remove()
    if settings.environment == "production":
        logger.add(sys.stdout, serialize=True, level="INFO", backtrace=False, diagnose=False)
    else:
        logger.add(
            sys.stdout,
            level="INFO",
            format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | "
                   "<cyan>{name}</cyan> - <level>{message}</level>",
        )

    # Intercept everything that uses the stdlib logging module
    logging.basicConfig(handlers=[InterceptHandler()], level=logging.INFO, force=True)
    for name in ("uvicorn", "uvicorn.error", "uvicorn.access", "gunicorn", "gunicorn.error", "gunicorn.access"):
        std_logger = logging.getLogger(name)
        std_logger.handlers = [InterceptHandler()]
        std_logger.propagate = False
