from urllib.parse import urlparse

from app.core.config import settings

try:
    from openai import OpenAI
except ModuleNotFoundError:
    OpenAI = None


def get_openai_client():
    if OpenAI is None or not settings.openai_api_key:
        return None

    client_options = {"api_key": settings.openai_api_key}
    if settings.openai_base_url:
        client_options["base_url"] = settings.openai_base_url

    return OpenAI(**client_options)


def openai_provider_label() -> str:
    if not settings.openai_base_url:
        return "OpenAI"

    parsed = urlparse(settings.openai_base_url)
    host = parsed.netloc or parsed.path or "custom provider"
    host = host.replace("api.", "").strip("/")
    return f"OpenAI-compatible ({host})"
