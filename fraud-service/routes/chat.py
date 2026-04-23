from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import litellm
from litellm import completion
import json
import os

litellm.ssl_verify = False

router = APIRouter()

SYSTEM_PROMPT = """You are Fraud Copilot, an AI assistant for fraud analysts in a real-time fraud detection platform.

Help analysts understand flagged transactions, risk scores, fraud patterns, rules, thresholds, and ML model outputs.

Important domain facts:
- Risk scores range from 0.0 to 1.0 (not 0-100). A score of 0.85 means 85% fraud likelihood.
- Transaction features include z-scores, velocity, frequency, and amount deviation metrics.

Response format rules:
- Respond in plain text only. Do NOT use markdown formatting (no **, ##, ```, -, * bullets, etc.).
- Keep responses concise and actionable. Avoid overly technical details.
- Present risk scores as rounded percentages (e.g. say "86%" instead of "0.86236273"). Round numeric values to at most 2 decimal places.
- Use short paragraphs or numbered lists (1. 2. 3.) when structure is needed.
- Keep your responses short and concise
- If asked about something outside fraud analysis, politely redirect."""


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    transaction_context: dict | None = None
    dashboard_context: dict | None = None


@router.post("/chat")
def chat(req: ChatRequest):
    system = SYSTEM_PROMPT
    if req.transaction_context:
        system += f"\n\nThe analyst is currently reviewing this transaction:\n{json.dumps(req.transaction_context, indent=2)}\nUse this context to answer their questions."
    if req.dashboard_context:
        system += (
            "\n\nThe analyst is currently viewing the dashboard. Here are the live metrics:"
            f"\n{json.dumps(req.dashboard_context, indent=2)}"
            "\nUse these metrics to give contextual answers about the platform's current state, "
            "fraud trends, and recommended actions."
        )
    messages = [{"role": "system", "content": system}]
    messages.extend({"role": m.role, "content": m.content} for m in req.messages)

    response = completion(
        model=os.getenv("LLM_MODEL"),
        messages=messages,
        stream=True,
    )

    def generate():
        for chunk in response:
            content = chunk.choices[0].delta.content  # type: ignore
            if content:
                yield f"data: {json.dumps({'token': content})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
