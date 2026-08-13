from fastapi import APIRouter
from app.api.routes import forms, public

api_router = APIRouter()
api_router.include_router(forms.router)
api_router.include_router(public.router)
