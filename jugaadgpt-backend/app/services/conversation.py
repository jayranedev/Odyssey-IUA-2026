"""
In-memory conversation history keyed by session_id.
Keeps the last N turns so the generator has context for follow-up questions.

Limitations (acceptable for hackathon):
- Not persistent across server restarts
- Not shared across multiple server instances
- Use Redis for production
"""

from dataclasses import dataclass, field
from datetime import datetime

MAX_TURNS = 5  # keep last 5 turns in context


@dataclass
class Turn:
    user: str
    assistant: str
    timestamp: datetime = field(default_factory=datetime.utcnow)


# session_id → list of turns
_sessions: dict[str, list[Turn]] = {}


def get_history(session_id: str) -> list[Turn]:
    return _sessions.get(session_id, [])


def add_turn(session_id: str, user_message: str, assistant_message: str) -> None:
    if session_id not in _sessions:
        _sessions[session_id] = []
    _sessions[session_id].append(Turn(user=user_message, assistant=assistant_message))
    # Trim to last N turns
    _sessions[session_id] = _sessions[session_id][-MAX_TURNS:]


def format_history_for_prompt(session_id: str) -> str:
    turns = get_history(session_id)
    if not turns:
        return ""
    lines = ["Previous conversation:"]
    for t in turns:
        lines.append(f"User: {t.user}")
        lines.append(f"Assistant: {t.assistant[:300]}...")  # truncate long solutions
    return "\n".join(lines)


def clear_session(session_id: str) -> None:
    _sessions.pop(session_id, None)
