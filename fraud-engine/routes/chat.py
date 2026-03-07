from fastapi import APIRouter
from pydantic import BaseModel
from litellm import completion
import json
import os

router = APIRouter()

SYSTEM_PROMPT = """You are Fraud Copilot, an AI assistant for fraud analysts in a real-time fraud detection platform.

Help analysts understand flagged transactions, risk scores, fraud patterns, rules, thresholds, and ML model outputs.

Important domain facts:
- Risk scores range from 0.0 to 1.0 (not 0-100). A score of 0.85 means 85% fraud likelihood.
- Transaction features include z-scores, velocity, frequency, and amount deviation metrics.

Response format rules:
- Respond in plain text only. Do NOT use markdown formatting (no **, ##, ```, -, * bullets, etc.).
- Keep responses concise and actionable.
- Use short paragraphs or numbered lists (1. 2. 3.) when structure is needed.
- If asked about something outside fraud analysis, politely redirect."""


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    transaction_context: dict | None = None


@router.post("/chat")
def chat(req: ChatRequest):
    system = SYSTEM_PROMPT
    if req.transaction_context:
        system += f"\n\nThe analyst is currently reviewing this transaction:\n{json.dumps(req.transaction_context, indent=2)}\nUse this context to answer their questions."
    messages = [{"role": "system", "content": system}]
    messages.extend({"role": m.role, "content": m.content} for m in req.messages)

    response = completion(
        model=os.getenv("LLM_MODEL", "cerebras/llama3.1-8b"),
        messages=messages,
    )

    return {"reply": response.choices[0].message.content}  # type: ignore
