from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from qdrant_client.http.exceptions import (
    ApiException,
    ResponseHandlingException,
)
from sqlalchemy.exc import SQLAlchemyError

from app.api.routes.chat import router as chat_router
from app.api.routes.conversations import router as conversations_router
from app.api.routes.documents import router as documents_router
from app.api.routes.upload import router as upload_router
from app.core.config import settings
from app.db.database import init_db


logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()

    yield

app = FastAPI(
    title="DocAI API",
    version="1.0.0",
    lifespan=lifespan,
)


@app.exception_handler(ApiException)
@app.exception_handler(ResponseHandlingException)
async def handle_qdrant_unavailable(
    _: Request,
    error: Exception,
):
    logger.error("Qdrant request failed: %s", error)
    return JSONResponse(
        status_code=503,
        content={
            "detail": (
                "Document search is temporarily unavailable. "
                "Please try again shortly."
            )
        },
    )


@app.exception_handler(SQLAlchemyError)
async def handle_database_unavailable(
    _: Request,
    error: SQLAlchemyError,
):
    logger.error("Database request failed: %s", error)
    return JSONResponse(
        status_code=503,
        content={
            "detail": (
                "Database is temporarily unavailable. "
                "Please try again shortly."
            )
        },
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