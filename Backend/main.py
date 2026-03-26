from contextlib import asynccontextmanager
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncEngine
from sqlmodel import SQLModel

from src.config.db import engine
from src.routes.billing import router as billing_router
from src.routes.boards import router as boards_router
from src.routes.webhook import router as webhook_router


@asynccontextmanager
async def lifespan(app: FastAPI):
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
env_origins = os.getenv("CORS_ORIGINS", "").strip()
frontend_origin = os.getenv("FRONTEND_ORIGIN", "").strip()

allowed_origins = default_origins.copy()
# If CORS_ORIGINS is provided, it becomes the source of truth.
if env_origins:
    allowed_origins = [origin.strip() for origin in env_origins.split(",") if origin.strip()]
else:
    # Otherwise, add FRONTEND_ORIGIN without removing the defaults.
    # This prevents accidentally allowing only one local port (e.g. :3001)
    # and blocking the other (e.g. :3000).
    if frontend_origin and frontend_origin not in allowed_origins:
        allowed_origins.append(frontend_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(boards_router)
app.include_router(billing_router)
app.include_router(webhook_router)
