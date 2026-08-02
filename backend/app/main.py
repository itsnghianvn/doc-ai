from fastapi import FastAPI
from app.api.routes.upload import router as upload_router

app = FastAPI(
    title="DocAI API",
    version="1.0.0"
)

app.include_router(upload_router)


@app.get("/")
def root():
    return {
        "message": "Welcome to DocAI API 🚀"
    }