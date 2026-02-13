from fastapi import APIRouter, Body
from litellm import completion
import json

router = APIRouter()


@router.post("/analyze-transaction")
def analyze_transaction(txn: dict = Body(...)):
    txn.pop('riskScore', None)
    txn.pop('status', None)
    
    response = completion(
        model="cerebras/qwen-3-32b",
        messages=[{"role": "user", "content": f"""Analyze the following transaction for potential reasons why it was flagged as fraudulent.
        Reply in a short concise paragraph.
        Transaction Details:
        {json.dumps(txn)}"""}]
    )

    return {"reason": response.choices[0].message.content}  # type: ignore
