from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import router as api_router
from app.database.connection import engine, Base
from app.models import models

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Smart ATM Management API",
    description="API for ATM cash prediction, monitoring, and alerts",
    version="1.0.0"
)

# CORS config
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

@app.get("/")
def root():
    return {"message": "Welcome to Smart ATM Management System API"}
