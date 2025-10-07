from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from pydantic import BaseModel

from database import get_session
from models import Usuario, UsuarioPublic

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)


class UserRegister(BaseModel):
    email: str
    password: str
    nombre: str
    apellido: str


class UserLogin(BaseModel):
    email: str
    password: str


@router.post("/register", response_model=UsuarioPublic)
def register(user: UserRegister, session: Session = Depends(get_session)):
    """Register a new user"""
    # Check if user already exists
    statement = select(Usuario).where(Usuario.mail == user.email)
    existing_user = session.exec(statement).first()

    if existing_user:
        raise HTTPException(status_code=400, detail="El email ingresado ya se encuentra en uso")

    # Create new user
    new_user = Usuario(
        nombre=user.nombre,
        apellido=user.apellido,
        mail=user.email,
        password=user.password  # TODO: Hash password in feature/auth branch
    )
    session.add(new_user)
    session.commit()
    session.refresh(new_user)

    return new_user


@router.post("/login", response_model=UsuarioPublic)
def login(user: UserLogin, session: Session = Depends(get_session)):
    """Login user"""
    # Find user by email
    statement = select(Usuario).where(Usuario.mail == user.email)
    db_user = session.exec(statement).first()

    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Check password (plain text for now, will be hashed in feature/auth branch)
    if db_user.password != user.password:
        raise HTTPException(status_code=401, detail="Contraseña incorrecta")

    return db_user