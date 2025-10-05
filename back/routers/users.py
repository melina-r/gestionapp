from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from typing import List

from models import Usuario, UsuarioPublic
from database import get_session
from auth_utils import get_current_user

router = APIRouter(
    prefix="/users",
    tags=["users"]
)


@router.get("/", response_model=List[UsuarioPublic])
def list_users(
    session: Session = Depends(get_session),
    current_user: Usuario = Depends(get_current_user)
):
    """List all users (requires authentication)"""
    statement = select(Usuario)
    users = session.exec(statement).all()
    return users


@router.get("/{user_id}", response_model=UsuarioPublic)
def get_user(
    user_id: int,
    session: Session = Depends(get_session),
    current_user: Usuario = Depends(get_current_user)
):
    """Get a specific user by ID (requires authentication)"""
    user = session.get(Usuario, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user
