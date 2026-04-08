import logging
import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

from routes.predict import router as predict_router
from routes.analyze import router as analyze_router
from routes.rules import router as rules_router
from routes.chat import router as chat_router
from core.feature_store import init_redis

load_dotenv()
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


app = FastAPI()  # uv run uvicorn main:app --reload

API_KEY = os.getenv("FRAUD_SERVICE_API_KEY")


@app.middleware("http")
async def verify_api_key(request: Request, call_next):
    """Reject requests that don't carry the internal API key."""
    if request.method == "OPTIONS" or request.url.path in ("/docs", "/openapi.json"):
        return await call_next(request)
    key = request.headers.get("X-API-Key")
    if key != API_KEY:
        return JSONResponse(status_code=403, content={"detail": "Forbidden: Invalid API key"})
    return await call_next(request)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predict_router)
app.include_router(analyze_router)
app.include_router(rules_router)
app.include_router(chat_router)


@app.on_event("startup")
def startup():
    init_redis()