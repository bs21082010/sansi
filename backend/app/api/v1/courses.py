from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.core.cache import cache
from app.models.user import User
from app.models.content import Course, Lesson
from app.schemas.content import CourseCreate, CourseOut, LessonCreate, LessonOut

router = APIRouter(prefix="/courses", tags=["courses"])


@router.get("/", response_model=list[CourseOut])
async def list_courses(
    language: str | None = Query(None),
    level: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    query = select(Course).where(Course.is_published == True)
    if language:
        query = query.where(Course.language == language)
    if level:
        query = query.where(Course.level == level)

    result = await db.execute(query.order_by(Course.created_at.desc()))
    return [CourseOut.model_validate(c) for c in result.scalars().all()]


@router.get("/{course_id}", response_model=CourseOut)
async def get_course(course_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return CourseOut.model_validate(course)


@router.post("/", response_model=CourseOut, status_code=201)
async def create_course(
    body: CourseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("contributor")),
):
    course = Course(**body.model_dump(), created_by=current_user.id)
    db.add(course)
    await db.flush()
    await db.refresh(course)
    return CourseOut.model_validate(course)


@router.get("/{course_id}/lessons", response_model=list[LessonOut])
async def list_lessons(course_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Lesson).where(Lesson.course_id == course_id).order_by(Lesson.order)
    )
    return [LessonOut.model_validate(l) for l in result.scalars().all()]


@router.post("/lessons", response_model=LessonOut, status_code=201)
async def create_lesson(
    body: LessonCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("contributor")),
):
    lesson = Lesson(**body.model_dump())
    db.add(lesson)
    await db.flush()
    await db.refresh(lesson)
    return LessonOut.model_validate(lesson)
