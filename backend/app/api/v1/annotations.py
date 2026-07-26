from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.user import User
from app.models.content import CorpusText
from app.models.enrichment import Annotation
from app.schemas.content import CorpusTextAnnotation, AnnotationOut

router = APIRouter(prefix="/corpus", tags=["annotations"])


@router.get("/{text_id}/annotations", response_model=list[AnnotationOut])
async def list_annotations(
    text_id: UUID,
    annotation_type: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    query = select(Annotation).where(Annotation.text_id == text_id)
    if annotation_type:
        query = query.where(Annotation.annotation_type == annotation_type)
    result = await db.execute(query.order_by(Annotation.char_start))
    return [AnnotationOut.model_validate(a) for a in result.scalars().all()]


@router.post("/{text_id}/annotations", response_model=AnnotationOut, status_code=201)
async def create_annotation(
    text_id: UUID,
    body: CorpusTextAnnotation,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("contributor")),
):
    text = await db.execute(select(CorpusText).where(CorpusText.id == text_id))
    if not text.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Text not found")

    annotation = Annotation(
        text_id=text_id,
        author_id=current_user.id,
        **body.model_dump(),
    )
    db.add(annotation)
    await db.flush()
    await db.refresh(annotation)
    return AnnotationOut.model_validate(annotation)


@router.post("/annotations/{annotation_id}/upvote")
async def upvote_annotation(
    annotation_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Annotation).where(Annotation.id == annotation_id))
    ann = result.scalar_one_or_none()
    if not ann:
        raise HTTPException(status_code=404, detail="Annotation not found")
    ann.upvotes += 1
    await db.flush()
    return {"upvotes": ann.upvotes}
