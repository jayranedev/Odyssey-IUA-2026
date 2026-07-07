import base64

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.llm import router as llm_router
from app.llm.parsing import extract_json_array
from app.llm.router import AllProvidersExhausted

router = APIRouter(prefix="/vision", tags=["vision"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}


@router.post("")
async def detect_materials(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(415, f"Unsupported image type: {file.content_type}")

    data = await file.read()
    b64 = base64.b64encode(data).decode()

    try:
        text = await llm_router.complete(
            role="vision",
            system="",
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:{file.content_type};base64,{b64}"},
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
            max_tokens=256,
            temperature=0.1,
        )
    except AllProvidersExhausted:
        return {"materials": []}

    items = extract_json_array(text) or []
    return {"materials": [str(i) for i in items if i]}
