from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel
from src.config.db import engine
from src.config.settings import settings
from src.routes.auth import router as auth_router
from src.routes.billing import router as billing_router
from src.routes.boards import router as boards_router
from src.routes.features import router as features_router
from src.routes.share_links import router as share_links_router
from src.routes.upvotes import router as upvotes_router
from src.routes.webhook import router as webhook_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # For a learning-first project we create tables on startup to remove
    # migration friction in fresh environments. In stricter production flows,
    # startup DDL is usually replaced by explicit migration pipelines.
    print("Creating Tables ... ")
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    yield


app = FastAPI(
    title="Board Management API",
    description="FastAPI backend for managing boards, users, and payments",
    version="1.0.0",
    lifespan=lifespan,
)

default_origins = ["http://localhost:3000", "http://localhost:3001"]
configured_origins = settings.cors_origins_list
frontend_origin = settings.frontend_origin.strip()

# We merge explicit CORS configuration with a safe local fallback so deploys
# remain predictable while local onboarding still works out of the box.
allowed_origins = configured_origins if configured_origins else default_origins.copy()
if frontend_origin and frontend_origin not in allowed_origins:
    allowed_origins.append(frontend_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    # Credentialed requests are required because auth/session flows rely on
    # cookies and protected headers across frontend-backend boundaries.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(boards_router)
app.include_router(features_router)
app.include_router(share_links_router)
app.include_router(upvotes_router)
app.include_router(billing_router)
app.include_router(auth_router)

# Root endpoint for welcome message
@app.get("/", tags=["Root"])
async def root():
    return {"message": "welcome to feedderslab"}

app.include_router(webhook_router)
