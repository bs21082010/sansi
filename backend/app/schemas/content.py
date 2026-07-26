from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class CorpusTextCreate(BaseModel):
    title: str
    title_iast: str = ""
    content: str
    content_iast: str = ""
    language: str = "sa"
    source: str = ""
    tags: list[str] = []


class CorpusTextOut(BaseModel):
    id: UUID
    title: str
    title_iast: str
    content: str
    content_iast: str
    language: str
    source: str
    tags: list
    is_verified: bool
    version: int
    uploaded_by: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class CourseCreate(BaseModel):
    title: str
    description: str
    language: str = "sa"
    level: str = "beginner"


class CourseOut(BaseModel):
    id: UUID
    title: str
    description: str
    language: str
    level: str
    created_by: UUID
    is_published: bool
    created_at: datetime

    class Config:
        from_attributes = True


class LessonCreate(BaseModel):
    course_id: UUID
    title: str
    content: str
    order: int = 0
    lesson_type: str = "text"


class LessonOut(BaseModel):
    id: UUID
    course_id: UUID
    title: str
    content: str
    order: int
    lesson_type: str
    created_at: datetime

    class Config:
        from_attributes = True


class CommunityPostCreate(BaseModel):
    title: str
    content: str
    post_type: str = "discussion"
    tags: list[str] = []


class CommunityPostOut(BaseModel):
    id: UUID
    title: str
    content: str
    post_type: str
    author_id: UUID
    votes: int
    tags: list
    created_at: datetime

    class Config:
        from_attributes = True


class CommentCreate(BaseModel):
    content: str
    parent_type: str
    parent_id: UUID


class CommentOut(BaseModel):
    id: UUID
    content: str
    author_id: UUID
    parent_type: str
    parent_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class CorpusTextAnnotation(BaseModel):
    annotation_type: str = "grammar"
    content: str
    verse_ref: str = ""
    char_start: int = 0
    char_end: int = 0


class AnnotationOut(BaseModel):
    id: UUID
    text_id: UUID
    author_id: UUID
    annotation_type: str
    content: str
    verse_ref: str
    char_start: int
    char_end: int
    upvotes: int
    created_at: datetime

    class Config:
        from_attributes = True


class LessonForkCreate(BaseModel):
    original_lesson_id: UUID
    title: str
    content: str


class LessonForkOut(BaseModel):
    id: UUID
    original_lesson_id: UUID
    forked_by: UUID
    title: str
    content: str
    version: int
    parent_fork_id: UUID | None
    created_at: datetime

    class Config:
        from_attributes = True


class FlashcardCreate(BaseModel):
    course_id: UUID
    lesson_id: UUID | None = None
    front: str
    back: str
    front_iast: str = ""
    back_iast: str = ""
    language: str = "sa"
    difficulty: str = "beginner"


class FlashcardOut(BaseModel):
    id: UUID
    course_id: UUID
    lesson_id: UUID | None
    front: str
    back: str
    front_iast: str
    back_iast: str
    language: str
    difficulty: str
    created_by: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class PracticeTestCreate(BaseModel):
    course_id: UUID
    title: str
    questions: dict
    time_limit_minutes: int = 0
    passing_score: int = 60


class PracticeTestOut(BaseModel):
    id: UUID
    course_id: UUID
    title: str
    questions: dict
    time_limit_minutes: int
    passing_score: int
    created_by: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class TestAttemptSubmit(BaseModel):
    answers: dict


class TestAttemptOut(BaseModel):
    id: UUID
    test_id: UUID
    user_id: UUID
    score: int
    passed: bool
    completed_at: datetime | None

    class Config:
        from_attributes = True


class TutorQuery(BaseModel):
    message: str
    language: str = "sa"
    context: str = ""
    difficulty: str = "auto"
    mode: str = "text"  # text, voice, quiz


class TutorResponse(BaseModel):
    reply: str
    citations: list[str] = []
    difficulty: str = "auto"
    suggested_exercise: str = ""
    mode: str = "text"



# ── Marketplace Schemas ──

class TutorProfileCreate(BaseModel):
    headline: str = ""
    bio: str = ""
    languages: list[str] = ["sa", "hi", "en"]
    specializations: list[str] = ["grammar"]
    hourly_rate: float = 0.0
    currency: str = "INR"


class TutorProfileOut(BaseModel):
    id: UUID
    user_id: UUID
    headline: str
    bio: str
    languages: list
    specializations: list
    hourly_rate: float
    currency: str
    is_available: bool
    total_sessions: int
    rating: float
    review_count: int
    badge: str
    created_at: datetime

    class Config:
        from_attributes = True


class SessionCreate(BaseModel):
    tutor_id: UUID
    scheduled_at: datetime
    duration_minutes: int = 60
    session_type: str = "video"


class SessionOut(BaseModel):
    id: UUID
    tutor_id: UUID
    learner_id: UUID
    status: str
    session_type: str
    scheduled_at: datetime
    duration_minutes: int
    amount: float
    notes: str
    created_at: datetime

    class Config:
        from_attributes = True


class ReviewCreate(BaseModel):
    session_id: UUID
    tutor_id: UUID
    rating: int = 5
    content: str = ""


class ReviewOut(BaseModel):
    id: UUID
    session_id: UUID
    reviewer_id: UUID
    tutor_id: UUID
    rating: int
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class StreakOut(BaseModel):
    current_streak: int
    longest_streak: int
    streak_freeze: bool
    last_activity: datetime | None

    class Config:
        from_attributes = True


class MentorRequestCreate(BaseModel):
    tutor_id: UUID
    question: str
    context: str = ""


class MentorRequestOut(BaseModel):
    id: UUID
    learner_id: UUID
    tutor_id: UUID
    status: str
    question: str
    context: str
    created_at: datetime

    class Config:
        from_attributes = True


class ReportCreate(BaseModel):
    target_type: str
    target_id: UUID
    reason: str


class ReportOut(BaseModel):
    id: UUID
    reporter_id: UUID
    target_type: str
    target_id: UUID
    reason: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
