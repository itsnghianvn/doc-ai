from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.chat import router as chat_router
from app.api.routes.conversations import router as conversations_router
from app.api.routes.documents import router as documents_router
from app.api.routes.upload import router as upload_router
from app.core.config import settings
from app.db.database import init_db


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()

    yield

app = FastAPI(
    title="DocAI API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)

app.include_router(conversations_router)

app.include_router(upload_router)

app.include_router(documents_router)
@app.get("/")
def root():
    return {
        "message": "Welcome to DocAI API 🚀"
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "doc-ai-backend",
    }