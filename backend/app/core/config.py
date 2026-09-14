from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    GEMINI_API_KEY: str
    DATABASE_URL: str = (
        "postgresql+psycopg://docai:docai@localhost:5432/docai"
    )
    GEMINI_GENERATION_MODEL: str = "gemini-3.5-flash"
    GEMINI_EMBEDDING_MODEL: str = "gemini-embedding-001"

    RAG_RETRIEVAL_TOP_N: int = 10
    RAG_RETRIEVAL_SCORE_THRESHOLD: float = 0.45
    RAG_RERANK_TOP_K: int = 5
    RAG_RERANK_MIN_SCORE: float = 0.35
    RAG_RERANK_VECTOR_WEIGHT: float = 0.35
    QDRANT_HOST: str = "localhost"
    QDRANT_PORT: int = 6333
    QDRANT_COLLECTION_NAME: str = "documents"
    EMBEDDING_DIMENSION: int = 3072
    CORS_ORIGINS: str = (
        "http://localhost:3000,http://127.0.0.1:3000"
    )

    @property
    def cors_origins(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.CORS_ORIGINS.split(",")
            if origin.strip()
        ]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()