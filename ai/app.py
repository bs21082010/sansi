from fastapi import FastAPI, Query
from pydantic import BaseModel

from rag.pipeline import pipeline
from tutor.difficulty import difficulty
from morph.analyzer import analyzer
from tts.speech import speech

app = FastAPI(title="Sansi AI Service", version="0.2.0")


class ChatRequest(BaseModel):
    message: str
    language: str = "sa"
    context: str = ""
    difficulty: str = "auto"
    user_id: str = ""


class ChatResponse(BaseModel):
    reply: str
    citations: list[str] = []
    difficulty: str = "auto"
    suggested_exercise: str = ""


class TranslateRequest(BaseModel):
    text: str
    source: str = "sa"
    target: str = "hi"


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    level = req.difficulty
    if level == "auto" and req.user_id:
        level = difficulty.get_level(req.user_id)

    retrieved = pipeline.retrieve(req.message, top_k=3)
    rag_context = pipeline.format_context(retrieved) if retrieved else req.context
    citations = [d["title"] for d in retrieved]

    exercise = difficulty.generate_exercise(level)
    reply = f"[{level.upper()}] Based on the texts:\n{rag_context}\n\n{req.message}"

    return ChatResponse(
        reply=reply,
        citations=citations,
        difficulty=level,
        suggested_exercise=exercise["question"],
    )


@app.get("/tutor/exercise")
async def get_exercise(
    level: str = Query("beginning", regex="^(beginner|intermediate|advanced)$"),
):
    return difficulty.generate_exercise(level)


@app.post("/tutor/feedback")
async def submit_feedback(
    user_id: str,
    correct: bool,
    level: str = "beginner",
):
    difficulty.adjust_level(user_id, correct, streak=1)
    return {"new_level": difficulty.get_level(user_id)}


@app.post("/translate")
async def translate(req: TranslateRequest):
    return {
        "translated_text": f"[{req.source} -> {req.target}] {req.text}",
        "source": req.source,
        "target": req.target,
    }


@app.post("/morph/analyze")
async def morph_analyze(text: str, language: str = "sa"):
    return analyzer.analyze(text, language)


@app.post("/morph/sandhi")
async def split_sandhi(text: str):
    return {"original": text, "parts": analyzer.split_sandhi(text)}


@app.post("/morph/stem")
async def stem_hindi(text: str):
    words = text.split()
    stems = [analyzer.stem_hindi(w) for w in words]
    return {"original": words, "stems": stems}


@app.post("/tts/synthesize")
async def synthesize(text: str, language: str = "sa"):
    audio = await speech.synthesize(text, language)
    return {"audio_length": len(audio), "language": language}


@app.get("/tts/voices")
async def list_voices():
    return await speech.list_voices()


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "sansi-ai",
        "modules": ["rag", "tts", "morph", "tutor"],
    }
