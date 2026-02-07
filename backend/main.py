from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import api_router
from app.exceptions import register_exception_handlers

app = FastAPI(
    title="SubTrack - Subscription Management System",
    version="1.0.0",
    description="Backend API for subscription lifecycle management",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)
app.include_router(api_router)


@app.get("/")
def root():
    return {"message": "SubTrack API is running", "docs": "/docs"}
