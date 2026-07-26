import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class DeveloperApp(Base):
    __tablename__ = "developer_apps"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), index=True
    )
    name: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text, default="")
    api_key: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    api_key_prefix: Mapped[str] = mapped_column(String(20))
    rate_plan: Mapped[str] = mapped_column(
        String(20), default="free"
    )  # free, basic, pro, enterprise
    requests_per_hour: Mapped[int] = mapped_column(Integer, default=100)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_used_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )


class APIUsageLog(Base):
    __tablename__ = "api_usage_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    app_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("developer_apps.id"), index=True
    )
    endpoint: Mapped[str] = mapped_column(String(200))
    method: Mapped[str] = mapped_column(String(10))
    status_code: Mapped[int] = mapped_column(Integer, default=200)
    response_time_ms: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )


class APIEndpoint(Base):
    __tablename__ = "api_endpoints"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    path: Mapped[str] = mapped_column(String(200), unique=True)
    method: Mapped[str] = mapped_column(String(10), default="GET")
    description: Mapped[str] = mapped_column(Text)
    category: Mapped[str] = mapped_column(
        String(30), default="corpus"
    )  # corpus, tutor, courses, marketplace
    min_plan: Mapped[str] = mapped_column(String(20), default="free")
    example_response: Mapped[dict | None] = mapped_column(
        type_=Text, default=None
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
