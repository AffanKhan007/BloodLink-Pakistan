from fastapi import APIRouter

from app.routes import admin, auth, blood_banks, chats, cities, donors, hospitals, institutions, matches, notifications, reports, requests, uploads


api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(donors.router)
api_router.include_router(requests.router)
api_router.include_router(matches.router)
api_router.include_router(notifications.router)
api_router.include_router(reports.router)
api_router.include_router(admin.router)
api_router.include_router(uploads.router)
api_router.include_router(hospitals.router)
api_router.include_router(blood_banks.router)
api_router.include_router(institutions.router)
api_router.include_router(chats.router)
api_router.include_router(cities.router)
