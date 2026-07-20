import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import api_router
from app.core.config import get_settings
from app.routes import admin, auth, blood_banks, blood_radar, chats, cities, donors, hospitals, institutions, matches, notifications, reports, requests, uploads


settings = get_settings()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    os.makedirs(settings.upload_dir, exist_ok=True)
    yield


app = FastAPI(title="BloodLink Pakistan API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.backend_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(auth.router)
app.include_router(donors.router)
app.include_router(requests.router)
app.include_router(matches.router)
app.include_router(notifications.router)
app.include_router(reports.router)
app.include_router(admin.router)
app.include_router(uploads.router)
app.include_router(hospitals.router)
app.include_router(blood_banks.router)
app.include_router(blood_radar.router)
app.include_router(institutions.router)
app.include_router(chats.router)
app.include_router(cities.router)
app.include_router(api_router)
