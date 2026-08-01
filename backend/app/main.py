from fastapi import FastAPI

app = FastAPI(
    title="DocAI API",
    version="1.0.0"
)


@app.get("/")
def root():
    return {
        "message": "Welcome to DocAI API 🚀"
    }