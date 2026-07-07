import base64

from app.schemas.query import QueryRequest


def test_query_request_ignores_swagger_image_placeholder():
    req = QueryRequest(
        session_id="s1",
        message="hi how to make a water pump",
        image_base64="string",
    )

    assert req.image_base64 is None


def test_query_request_accepts_data_uri_png():
    png_bytes = b"\x89PNG\r\n\x1a\n" + b"0" * 16
    encoded = base64.b64encode(png_bytes).decode()

    req = QueryRequest(
        session_id="s1",
        message="identify materials",
        image_base64=f"data:image/png;base64,{encoded}",
    )

    assert req.image_base64 == encoded


def test_query_request_drops_non_image_base64():
    encoded = base64.b64encode(b"not an image").decode()

    req = QueryRequest(
        session_id="s1",
        message="identify materials",
        image_base64=encoded,
    )

    assert req.image_base64 is None
