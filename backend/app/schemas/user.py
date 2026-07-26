from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str
    display_name: str = ""


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: UUID
    email: str
    username: str
    display_name: str
    bio: str
    avatar_url: str
    is_tutor: bool
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class BadgeOut(BaseModel):
    id: UUID
    name: str
    description: str
    icon: str
    category: str
    created_at: datetime

    class Config:
        from_attributes = True


class UserScoreOut(BaseModel):
    total_points: int
    texts_uploaded: int
    annotations_made: int
    lessons_completed: int
    votes_cast: int
    comments_made: int

    class Config:
        from_attributes = True
