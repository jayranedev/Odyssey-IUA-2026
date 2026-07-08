import base64
import json
import logging

import requests

from app.config import settings

logger = logging.getLogger(__name__)


def send_request(prompt=None, index=None):
    if prompt is None:
        prompt = (
            "Pipe ka size check karo: Apne ghar ke nal (tap) ka size dekho. "
            "Zyada tar Indian ghar mein 1/2 inch ya 3/4 inch ka tap hota hai."
        )
    if index is None:
        index = 1

    # Use the GEMINI_COOKIE from environment config
    cookie = settings.gemini_cookie
    if not cookie:
        logger.warning("GEMINI_COOKIE not set — image generation disabled")
        return None

    # Matching the exact nested payload structure
    payload = [
        [
            [
                "q4uTj",
                json.dumps(
                    [
                        None,
                        json.dumps(
                            {
                                "instances": [{"prompt": prompt}],
                                "parameters": {"sampleCount": 1},
                            }
                        ),
                        2,
                    ]
                ),
                None,
                "generic",
            ]
        ]
    ]

    url = "https://gemini.google.com/_/BardChatUi/data/batchexecute"

    headers = {
        "Cookie": f"NID={cookie}" if not cookie.startswith("NID=") else cookie,
        "User-Agent": "Mozilla/5.0",
        "Content-Type": "application/x-www-form-urlencoded",
    }

    try:
        data = {"f.req": json.dumps(payload)}

        response = requests.post(url, headers=headers, data=data)
        response.raise_for_status()

        # Cleaning the prefix )]}'
        clean_text = response.text.replace(")]}'\n", "").strip()
        outer_data = json.loads(clean_text)

        def find_target(data_list):
            for item in data_list:
                if isinstance(item, list):
                    res = find_target(item)
                    if res:
                        return res
                elif isinstance(item, str) and "bytesBase64Encoded" in item:
                    return item
            return None

        target_string = find_target(outer_data)

        if target_string:
            final_object = json.loads(target_string)

            if isinstance(final_object, list):
                final_object = json.loads(final_object[0])

            base64_data = final_object["predictions"][0]["bytesBase64Encoded"]

            logger.info("Successfully generated image for prompt: %s...", prompt[:40])
            return base64_data

    except Exception as e:
        logger.warning("Image generation request failed: %s", e)

    return None


if __name__ == "__main__":
    send_request()
