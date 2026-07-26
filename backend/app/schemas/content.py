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


class TutorQuery(BaseModel):
    message: str
    language: str = "sa"
    context: str = ""


class TutorResponse(BaseModel):
    reply: str
    citations: list[str] = []
