import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from .config import settings
from .database import engine, Base
from .routers import auth, claims, stats

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Full-stack AI-Powered Fraud & Loan Claim Detection System with XGBoost & SHAP Explainability",
    version="1.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(claims.router, prefix=settings.API_V1_STR)
app.include_router(stats.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "docs_url": "/docs",
        "api_v1": settings.API_V1_STR
    }

@app.get(f"{settings.API_V1_STR}/sample-csv")
def download_sample_csv():
    sample_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "data", "sample_claims_upload.csv")
    )
    if os.path.exists(sample_path):
        return FileResponse(
            sample_path,
            media_type="text/csv",
            filename="sample_claims_upload.csv"
        )
    return {"error": "Sample CSV not found"}
