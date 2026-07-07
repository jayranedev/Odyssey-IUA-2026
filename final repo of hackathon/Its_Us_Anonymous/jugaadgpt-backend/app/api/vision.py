import base64
import json

import anthropic
from fastapi import APIRouter, File, HTTPException, UploadFile

router = APIRouter(prefix="/vision", tags=["vision"])

_client = anthropic.Anthropic()

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}


@router.post("")
async def detect_materials(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(415, f"Unsupported image type: {file.content_type}")

    data = await file.read()
    b64 = base64.b64encode(data).decode()

    msg = _client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=256,
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {"type": "base64", "media_type": file.content_type, "data": b64},
                },
                {
                    "type": "text",
                    "text": (
                        "Look at this image and list every distinct material, scrap, tool, or component visible. "
                        "Return ONLY a JSON array of short strings (in English), nothing else. "
                        'Example: ["old cycle rim", "PVC pipe 2m", "rubber tube", "metal sheet"]'
                    ),
                },
            ],
        }],
    )

    text = msg.content[0].text.strip()
    try:
        start, end = text.index("["), text.rindex("]") + 1
        items = json.loads(text[start:end])
        items = [str(i) for i in items if i]
    except Exception:
        items = []

    return {"materials": items}
