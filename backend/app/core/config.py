from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    GEMINI_API_KEY: str = Field(min_length=1)
    DATABASE_URL: str = (
        "postgresql+psycopg://docai:docai@localhost:5432/docai"
    )
    GEMINI_GENERATION_MODEL: str = "gemini-3.5-flash-lite"
    GEMINI_EMBEDDING_MODEL: str = "gemini-embedding-001"

    RAG_RETRIEVAL_TOP_N: int = Field(default=10, ge=1, le=100)
    RAG_RETRIEVAL_SCORE_THRESHOLD: float = Field(
        default=0.45,
        ge=0,
        le=1,
    )
    RAG_RERANK_TOP_K: int = Field(default=5, ge=1, le=50)
    RAG_RERANK_MIN_SCORE: float = Field(
        default=0.35,
        ge=0,
        le=1,
    )
    RAG_RERANK_VECTOR_WEIGHT: float = Field(
        default=0.35,
        ge=0,
        le=1,
    )
    QDRANT_HOST: str = "localhost"
    QDRANT_PORT: int = Field(default=6333, ge=1, le=65535)
    QDRANT_COLLECTION_NAME: str = "documents"
    EMBEDDING_DIMENSION: int = Field(default=3072, ge=1)
    CORS_ORIGINS: str = (
        "http://localhost:3000,http://127.0.0.1:3000,"
        "http://localhost:3001,http://127.0.0.1:3001"
    )

    @property
    def cors_origins(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.CORS_ORIGINS.split(",")
            if origin.strip()
        ]

    @field_validator("GEMINI_API_KEY")
    @classmethod
    def validate_gemini_api_key(cls, value: str) -> str:
        value = value.strip()
        if value == "replace-with-your-gemini-api-key":
            raise ValueError(
                "GEMINI_API_KEY must be replaced with a real key."
            )
        return value

settings = Settings()