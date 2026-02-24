from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel

from src.config.db import engine
from src.routes.billing import router as billing_router
from src.routes.boards import router as boards_router
from src.routes.webhook import router as webhook_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Creating Tables ... ")
    SQLModel.metadata.create_all(engine)
    yield


app = FastAPI(
    title="Board Management API",
    description="FastAPI backend for managing boards, users, and payments",
    version="1.0.0",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(boards_router)
app.include_router(billing_router)
app.include_router(webhook_router)
