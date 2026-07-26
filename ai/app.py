from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Sansi AI Service", version="0.1.0")


class ChatRequest(BaseModel):
    message: str
    language: str = "sa"
    context: str = ""


class ChatResponse(BaseModel):
    reply: str
    citations: list[str] = []


class TranslateRequest(BaseModel):
    text: str
    source: str = "sa"
    target: str = "hi"


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    return ChatResponse(
        reply=f"AI response for: {req.message} (RAG pipeline ready — model loading in production)",
        citations=[],
    )


@app.post("/translate")
async def translate(req: TranslateRequest):
    return {
        "translated_text": f"[{req.source} → {req.target}] {req.text}",
        "source": req.source,
        "target": req.target,
    }


@app.get("/health")
async def health():
    return {"status": "ok", "service": "sansi-ai"}
