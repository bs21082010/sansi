from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.models.content import CorpusText
from app.schemas.content import CorpusTextCreate, CorpusTextOut

router = APIRouter(prefix="/corpus", tags=["corpus"])


@router.get("/", response_model=list[CorpusTextOut])
async def list_texts(
    language: str | None = Query(None),
    search: str | None = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    query = select(CorpusText)

    if language:
        query = query.where(CorpusText.language == language)
    if search:
        query = query.where(
            CorpusText.title.ilike(f"%{search}%") | CorpusText.content.ilike(f"%{search}%")
        )

    query = query.order_by(CorpusText.created_at.desc()).offset((page - 1) * size).limit(size)
    result = await db.execute(query)
    return [CorpusTextOut.model_validate(t) for t in result.scalars().all()]


@router.get("/{text_id}", response_model=CorpusTextOut)
async def get_text(text_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CorpusText).where(CorpusText.id == text_id))
    text = result.scalar_one_or_none()
    if not text:
        raise HTTPException(status_code=404, detail="Text not found")
    return CorpusTextOut.model_validate(text)


@router.post("/", response_model=CorpusTextOut, status_code=201)
async def create_text(body: CorpusTextCreate, db: AsyncSession = Depends(get_db)):
    text = CorpusText(**body.model_dump())
    db.add(text)
    await db.flush()
    await db.refresh(text)
    return CorpusTextOut.model_validate(text)


@router.delete("/{text_id}", status_code=204)
async def delete_text(text_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CorpusText).where(CorpusText.id == text_id))
    text = result.scalar_one_or_none()
    if not text:
        raise HTTPException(status_code=404, detail="Text not found")
    await db.delete(text)
