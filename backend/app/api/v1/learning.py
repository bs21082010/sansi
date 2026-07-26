from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.core.cache import cache
from app.models.user import User
from app.models.content import Course, Lesson
from app.models.enrichment import (
    LessonFork, Flashcard, PracticeTest, TestAttempt, CourseVersion,
)
from app.schemas.content import (
    LessonForkCreate, LessonForkOut,
    FlashcardCreate, FlashcardOut,
    PracticeTestCreate, PracticeTestOut,
    TestAttemptSubmit, TestAttemptOut,
)

router = APIRouter(prefix="/learning", tags=["learning"])


# ── Lesson Forks ──

@router.post("/lessons/{lesson_id}/fork", response_model=LessonForkOut, status_code=201)
async def fork_lesson(
    lesson_id: UUID,
    body: LessonForkCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("contributor")),
):
    original = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
    if not original.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Lesson not found")

    fork = LessonFork(
        original_lesson_id=lesson_id,
        forked_by=current_user.id,
        **body.model_dump(exclude={"original_lesson_id"}),
    )
    db.add(fork)
    await db.flush()
    await db.refresh(fork)
    return LessonForkOut.model_validate(fork)


@router.get("/lessons/{lesson_id}/forks", response_model=list[LessonForkOut])
async def list_forks(lesson_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(LessonFork).where(LessonFork.original_lesson_id == lesson_id)
    )
    return [LessonForkOut.model_validate(f) for f in result.scalars().all()]


# ── Flashcards ──

@router.get("/courses/{course_id}/flashcards", response_model=list[FlashcardOut])
@cache(prefix="flashcards", ttl=300)
async def list_flashcards(course_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Flashcard).where(Flashcard.course_id == course_id)
    )
    return [FlashcardOut.model_validate(f) for f in result.scalars().all()]


@router.post("/flashcards", response_model=FlashcardOut, status_code=201)
async def create_flashcard(
    body: FlashcardCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("contributor")),
):
    card = Flashcard(**body.model_dump(), created_by=current_user.id)
    db.add(card)
    await db.flush()
    await db.refresh(card)
    return FlashcardOut.model_validate(card)


# ── Practice Tests ──

@router.post("/tests", response_model=PracticeTestOut, status_code=201)
async def create_test(
    body: PracticeTestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("contributor")),
):
    test = PracticeTest(**body.model_dump(), created_by=current_user.id)
    db.add(test)
    await db.flush()
    await db.refresh(test)
    return PracticeTestOut.model_validate(test)


@router.get("/tests/{test_id}")
async def get_test(test_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PracticeTest).where(PracticeTest.id == test_id))
    test = result.scalar_one_or_none()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    return PracticeTestOut.model_validate(test)


@router.post("/tests/{test_id}/attempt", response_model=TestAttemptOut)
async def submit_attempt(
    test_id: UUID,
    body: TestAttemptSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    test = await db.execute(select(PracticeTest).where(PracticeTest.id == test_id))
    test_row = test.scalar_one_or_none()
    if not test_row:
        raise HTTPException(status_code=404, detail="Test not found")

    questions = test_row.questions
    correct = 0
    total = len(questions.get("questions", []))
    for q in questions.get("questions", []):
        qid = q.get("id")
        if qid and body.answers.get(qid) == q.get("answer"):
            correct += 1

    score = int((correct / total) * 100) if total > 0 else 0
    passed = score >= test_row.passing_score

    attempt = TestAttempt(
        test_id=test_id,
        user_id=current_user.id,
        answers=body.answers,
        score=score,
        passed=passed,
        completed_at=None,
    )
    db.add(attempt)
    await db.flush()
    await db.refresh(attempt)
    return TestAttemptOut.model_validate(attempt)


# ── Course Versions ──

@router.post("/courses/{course_id}/versions", status_code=201)
async def create_course_version(
    course_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("contributor")),
):
    course = await db.execute(select(Course).where(Course.id == course_id))
    course_row = course.scalar_one_or_none()
    if not course_row:
        raise HTTPException(status_code=404, detail="Course not found")

    lessons = await db.execute(
        select(Lesson).where(Lesson.course_id == course_id).order_by(Lesson.order)
    )

    version_count = await db.execute(
        select(func.count()).select_from(CourseVersion).where(
            CourseVersion.course_id == course_id
        )
    )
    next_version = (version_count.scalar() or 0) + 1

    cv = CourseVersion(
        course_id=course_id,
        version=next_version,
        snapshot={
            "course": {
                "title": course_row.title,
                "description": course_row.description,
                "level": course_row.level,
            },
            "lessons": [
                {"id": str(l.id), "title": l.title, "order": l.order, "lesson_type": l.lesson_type}
                for l in lessons.scalars().all()
            ],
        },
        created_by=current_user.id,
    )
    db.add(cv)
    await db.flush()
    await db.refresh(cv)
    return {"version": next_version, "id": str(cv.id)}
