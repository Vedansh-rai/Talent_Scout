from __future__ import annotations

import json
import os
import time

from azure.ai.inference import ChatCompletionsClient
from azure.ai.inference.models import JsonSchemaFormat, SystemMessage, UserMessage, AssistantMessage
from azure.core.credentials import AzureKeyCredential
from azure.core.exceptions import HttpResponseError


_client: ChatCompletionsClient | None = None


def _get_client() -> ChatCompletionsClient:
    global _client
    if _client is None:
        api_key = os.environ.get("AZURE_OPENAI_API_KEY")
        endpoint = os.environ.get("AZURE_OPENAI_ENDPOINT")
        if not api_key:
            raise EnvironmentError("AZURE_OPENAI_API_KEY environment variable is not set.")
        if not endpoint:
            raise EnvironmentError("AZURE_OPENAI_ENDPOINT environment variable is not set.")
        _client = ChatCompletionsClient(
            endpoint=endpoint,
            credential=AzureKeyCredential(api_key),
        )
    return _client


def _get_deployment() -> str:
    return os.environ.get("AZURE_OPENAI_DEPLOYMENT", "gpt-4o-mini")


def chat_completion(
    messages: list[dict],
    model: str = "gpt-4o-mini",
    temperature: float = 0.7,
    json_mode: bool = False,
    max_retries: int = 3,
) -> str:
    client = _get_client()
    deployment = _get_deployment()

    kwargs: dict = {
        "model": deployment,
        "messages": messages,
        "temperature": temperature,
    }
    if json_mode:
        kwargs["response_format"] = "json_object"

    last_err: Exception | None = None
    for attempt in range(max_retries):
        try:
            resp = client.complete(**kwargs)
            content = resp.choices[0].message.content
            return content or ""
        except HttpResponseError as exc:
            last_err = exc
            wait = 2 ** attempt
            time.sleep(wait)

    raise RuntimeError(
        f"LLM call failed after {max_retries} retries: {last_err}"
    )


def chat_completion_json(
    messages: list[dict],
    model: str = "gpt-4o-mini",
    temperature: float = 0.4,
    max_retries: int = 3,
) -> dict:
    raw = chat_completion(
        messages, model=model, temperature=temperature,
        json_mode=True, max_retries=max_retries,
    )
    return json.loads(raw)
