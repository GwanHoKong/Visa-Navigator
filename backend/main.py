"""
Visa Navigator -- FastAPI Backend
Provides ML prediction, timeline, industry lookup, and company recommendation endpoints.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import os
import joblib
import pandas as pd
from pathlib import Path

from state import app_state
from routers import predict, timeline, industries, companies

BASE_DIR = Path(__file__).parent
MODELS_DIR = BASE_DIR / "models"
LOOKUPS_DIR = BASE_DIR / "lookups"

# CORS: read allowed origins from env var (comma-separated), fallback for local dev
ALLOWED_ORIGINS = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:3000"
).split(",")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load model and lookup tables once at startup."""
    print("Loading model and lookup tables...")

    # ML model pipeline (StandardScaler + LogisticRegression)
    model_path = MODELS_DIR / "h1b_model.joblib"
    app_state["model"] = joblib.load(model_path)
    print(f"  Model loaded from {model_path}")

    # Model metadata (feature columns, metrics, etc.)
    meta_path = MODELS_DIR / "model_meta.joblib"
    app_state["model_meta"] = joblib.load(meta_path)
    print(f"  Model metadata loaded")

    # Lookup tables
    app_state["naics_stats"] = pd.read_csv(LOOKUPS_DIR / "naics_stats.csv")
    app_state["state_stats"] = pd.read_csv(LOOKUPS_DIR / "state_stats.csv")
    app_state["employer_stats"] = pd.read_csv(LOOKUPS_DIR / "employer_stats.csv")

    print(f"  NAICS stats: {len(app_state['naics_stats'])} industries")
    print(f"  State stats: {len(app_state['state_stats'])} states")
    print(f"  Employer stats: {len(app_state['employer_stats']):,} employers")
    print("Startup complete.\n")

    yield

    # Cleanup
    app_state.clear()
    print("Shutdown complete.")


app = FastAPI(
    title="Visa Navigator API",
    description="API for H1B visa prediction and recommendation system",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS -- allow frontend origin(s)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(predict.router, prefix="/api", tags=["Prediction"])
app.include_router(timeline.router, prefix="/api", tags=["Timeline"])
app.include_router(industries.router, prefix="/api", tags=["Industries"])
app.include_router(companies.router, prefix="/api", tags=["Companies"])


@app.get("/")
async def root():
    return {"message": "Visa Navigator API is running"}
