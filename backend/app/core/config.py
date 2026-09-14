from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    GEMINI_API_KEY: str
    GEMINI_GENERATION_MODEL: str = "gemini-3.5-flash"
    GEMINI_EMBEDDING_MODEL: str = "gemini-embedding-001"

    RAG_RETRIEVAL_TOP_N: int = 10
    RAG_RETRIEVAL_SCORE_THRESHOLD: float = 0.45
    RAG_RERANK_TOP_K: int = 5
    RAG_RERANK_MIN_SCORE: float = 0.35
    RAG_RERANK_VECTOR_WEIGHT: float = 0.35

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()