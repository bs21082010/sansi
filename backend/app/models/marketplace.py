import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy import JSON
from sqlalchemy.types import Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class MentorProfile(Base):
    __tablename__ = "mentor_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(), ForeignKey("users.id"), unique=True, index=True
    )
    headline: Mapped[str] = mapped_column(String(300), default="")
    bio: Mapped[str] = mapped_column(Text, default="")
    languages: Mapped[list] = mapped_column(JSON, default=["sa", "hi", "en"])
    specializations: Mapped[list] = mapped_column(
        JSON, default=["grammar", "conversation"]
    )
    is_available: Mapped[bool] = mapped_column(Boolean, default=True)
    total_sessions: Mapped[int] = mapped_column(Integer, default=0)
    rating: Mapped[int] = mapped_column(Integer, default=0)
    thanks_count: Mapped[int] = mapped_column(Integer, default=0)
    badge: Mapped[str] = mapped_column(String(20), default="new")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )


class MentorshipSession(Base):
    __tablename__ = "mentorship_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(), primary_key=True, default=uuid.uuid4
    )
    mentor_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(), ForeignKey("users.id"), index=True
    )
    learner_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(), ForeignKey("users.id"), index=True
    )
    status: Mapped[str] = mapped_column(
        String(20), default="pending"
    )  # pending, confirmed, completed, cancelled
    session_type: Mapped[str] = mapped_column(
        String(20), default="video"
    )  # video, voice, chat
    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    duration_minutes: Mapped[int] = mapped_column(Integer, default=60)
    notes: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )


class ThankYou(Base):
    __tablename__ = "thank_yous"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(), primary_key=True, default=uuid.uuid4
    )
    session_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(), ForeignKey("mentorship_sessions.id"), unique=True
    )
    giver_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(), ForeignKey("users.id")
    )
    mentor_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(), ForeignKey("users.id"), index=True
    )
    rating: Mapped[int] = mapped_column(Integer, default=5)
    message: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )


class Streak(Base):
    __tablename__ = "streaks"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(), ForeignKey("users.id"), unique=True, index=True
    )
    current_streak: Mapped[int] = mapped_column(Integer, default=0)
    longest_streak: Mapped[int] = mapped_column(Integer, default=0)
    last_activity: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    streak_freeze: Mapped[bool] = mapped_column(Boolean, default=False)


class MentorRequest(Base):
    __tablename__ = "mentor_requests"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(), primary_key=True, default=uuid.uuid4
    )
    learner_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(), ForeignKey("users.id"), index=True
    )
    mentor_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(), ForeignKey("users.id"), index=True
    )
    status: Mapped[str] = mapped_column(
        String(20), default="open"
    )  # open, assigned, resolved
    question: Mapped[str] = mapped_column(Text)
    context: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    resolved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(), primary_key=True, default=uuid.uuid4
    )
    reporter_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(), ForeignKey("users.id")
    )
    target_type: Mapped[str] = mapped_column(
        String(30)
    )  # post, comment, user, mentor
    target_id: Mapped[uuid.UUID] = mapped_column(Uuid())
    reason: Mapped[str] = mapped_column(String(300))
    status: Mapped[str] = mapped_column(
        String(20), default="pending"
    )  # pending, reviewed, dismissed
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(), ForeignKey("users.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
