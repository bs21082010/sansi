from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import httpx

from app.core.database import get_db
from app.core.config import settings
from app.schemas.content import TutorQuery, TutorResponse

router = APIRouter(prefix="/tutor", tags=["tutor"])


@router.post("/chat", response_model=TutorResponse)
async def chat_with_tutor(body: TutorQuery):
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{settings.AI_SERVICE_URL}/chat",
                json=body.model_dump(),
                timeout=30.0,
            )
            resp.raise_for_status()
            return TutorResponse(**resp.json())
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"AI service unavailable: {str(e)}")


@router.post("/translate")
async def translate_text(text: str, source: str = "sa", target: str = "hi"):
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{settings.AI_SERVICE_URL}/translate",
                json={"text": text, "source": source, "target": target},
                timeout=30.0,
            )
            resp.raise_for_status()
            return resp.json()
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"AI service unavailable: {str(e)}")
