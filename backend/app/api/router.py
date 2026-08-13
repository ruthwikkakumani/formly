from fastapi import APIRouter

from app.api.routes import forms, health, public, team

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(forms.router)
api_router.include_router(public.router)
api_router.include_router(team.router)
