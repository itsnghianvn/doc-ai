from fastapi import FastAPI
from app.api.routes.upload import router as upload_router
from app.api.routes.chat import router as chat_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="DocAI API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)

app.include_router(upload_router)


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