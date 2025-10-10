from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from database import get_session
from models import Usuario, UsuarioPublic

router = APIRouter(
    prefix="/users",
    tags=["users"]
)

@router.get("/", response_model=list[UsuarioPublic])
def list_users(session: Session = Depends(get_session)):
    """List all users"""
    statement = select(Usuario)
    users = session.exec(statement).all()
    return users

@router.get("/{user_id}", response_model=UsuarioPublic)
def get_user(user_id: int, session: Session = Depends(get_session)):
    """Get user by ID"""
    user = session.get(Usuario, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user
