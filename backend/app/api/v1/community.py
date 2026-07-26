from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.models.content import CommunityPost, Comment
from app.schemas.content import CommunityPostCreate, CommunityPostOut, CommentCreate, CommentOut

router = APIRouter(prefix="/community", tags=["community"])


@router.get("/posts", response_model=list[CommunityPostOut])
async def list_posts(
    post_type: str | None = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    query = select(CommunityPost)
    if post_type:
        query = query.where(CommunityPost.post_type == post_type)
    query = query.order_by(CommunityPost.votes.desc(), CommunityPost.created_at.desc())
    query = query.offset((page - 1) * size).limit(size)

    result = await db.execute(query)
    return [CommunityPostOut.model_validate(p) for p in result.scalars().all()]


@router.post("/posts", response_model=CommunityPostOut, status_code=201)
async def create_post(body: CommunityPostCreate, db: AsyncSession = Depends(get_db)):
    post = CommunityPost(**body.model_dump())
    db.add(post)
    await db.flush()
    await db.refresh(post)
    return CommunityPostOut.model_validate(post)


@router.post("/posts/{post_id}/vote")
async def vote_post(post_id: UUID, delta: int = Query(1), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CommunityPost).where(CommunityPost.id == post_id))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    post.votes += delta
    await db.flush()
    return {"votes": post.votes}


@router.post("/comments", response_model=CommentOut, status_code=201)
async def create_comment(body: CommentCreate, db: AsyncSession = Depends(get_db)):
    comment = Comment(**body.model_dump())
    db.add(comment)
    await db.flush()
    await db.refresh(comment)
    return CommentOut.model_validate(comment)


@router.get("/comments/{parent_type}/{parent_id}", response_model=list[CommentOut])
async def list_comments(parent_type: str, parent_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Comment).where(
            Comment.parent_type == parent_type, Comment.parent_id == parent_id
        ).order_by(Comment.created_at)
    )
    return [CommentOut.model_validate(c) for c in result.scalars().all()]
