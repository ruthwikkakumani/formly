from fastapi import APIRouter

from app.api.routes import auth, forms, health, invites, public, team

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(forms.router)
api_router.include_router(invites.router)
api_router.include_router(public.router)
api_router.include_router(team.router)
