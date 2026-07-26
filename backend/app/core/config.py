from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "Sansi - Sanskrit/Hindi Platform"
    VERSION: str = "0.1.0"
    API_V1_PREFIX: str = "/api/v1"

    DATABASE_URL: str = "postgresql+asyncpg://sansi:sansi_secret@localhost:5432/sansi"
    SECRET_KEY: str = "change-me-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    ALGORITHM: str = "HS256"

    AI_SERVICE_URL: str = "http://ai:8080"

    class Config:
        env_file = ".env"


settings = Settings()
